import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  anon,
  createTestUser,
  db,
  deleteTestUser,
  expectSqlError,
  resetDomainData,
  sql,
  type TestUser,
  unwrap,
} from "./helpers";

let owner: TestUser;
let outsider: TestUser;
let sequence = 0;

function unique(label: string): string {
  sequence += 1;
  return `${label}-${sequence}-${Date.now()}`;
}

function n(value: unknown): number {
  return Number(value);
}

async function createRohstoff(
  name: string,
  kategorie: "MALZ" | "HOPFEN" | "HEFE" | "GEWUERZ" | "SONSTIGES" = "MALZ",
  basiseinheit: "g" | "ml" | "Stueck" = "g",
): Promise<number> {
  const [row] = await sql<{ id: string }>(
    `insert into public.tb_rohstoff (name, kategorie, basiseinheit)
     values ($1, $2, $3) returning id`,
    [name, kategorie, basiseinheit],
  );
  return n(row.id);
}

async function createLot(
  rohstoffId: number,
  options: { lieferdatum?: string; mhd?: string; alpha?: number; ebc?: number } = {},
): Promise<number> {
  const [row] = await sql<{ id: string }>(
    `insert into public.tb_lagercharge
       (rohstoff_id, lieferdatum, mhd, alphasaeure_prozent, ebc)
     values ($1, $2, $3, $4, $5) returning id`,
    [
      rohstoffId,
      options.lieferdatum ?? "2026-01-01",
      options.mhd ?? null,
      options.alpha ?? null,
      options.ebc ?? null,
    ],
  );
  return n(row.id);
}

async function createRecipe(name: string): Promise<{ rezeptId: number; versionId: number }> {
  const rows = unwrap(
    await owner.client.rpc("rezept_erstellen", {
      p_name: name,
      p_beschreibung: `Beschreibung ${name}`,
    }),
  );
  return { rezeptId: Number(rows[0].rezept_id), versionId: Number(rows[0].rezeptversion_id) };
}

async function addStep(
  versionId: number,
  position: number,
  typ:
    | "EINMAISCHEN"
    | "RAST"
    | "NACHGUSS"
    | "KOCHEN"
    | "GAERUNG"
    | "KALTHOPFUNG"
    | "REIFUNG"
    | "ABFUELLUNG"
    | "SONSTIGES",
  name: string,
  options: { temperatur?: number; dauer?: number; wasser?: number; anweisung?: string } = {},
): Promise<number> {
  const [row] = await sql<{ id: string }>(
    `insert into public.tb_rezeptschritt
       (rezeptversion_id, position, typ, name, temperatur_c, dauer_min, wassermenge_l, anweisung)
     values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
    [
      versionId,
      position,
      typ,
      name,
      options.temperatur ?? null,
      options.dauer ?? null,
      options.wasser ?? null,
      options.anweisung ?? null,
    ],
  );
  return n(row.id);
}

async function addIngredient(
  versionId: number,
  rohstoffId: number,
  stepId: number | null,
  menge: number,
  options: { alpha?: number; ebc?: number; offset?: number; notizen?: string } = {},
): Promise<number> {
  const [row] = await sql<{ id: string }>(
    `insert into public.tb_rezeptzutat
       (rezeptversion_id, rohstoff_id, rezeptschritt_id, rohstoffname_snapshot,
        einheit_snapshot, menge, alphasaeure_prozent, ebc, zugabe_nach_min, notizen)
     values ($1, $2, $3, 'placeholder', 'g', $4, $5, $6, $7, $8) returning id`,
    [
      versionId,
      rohstoffId,
      stepId,
      menge,
      options.alpha ?? null,
      options.ebc ?? null,
      options.offset ?? null,
      options.notizen ?? null,
    ],
  );
  return n(row.id);
}

async function releaseVersion(versionId: number): Promise<void> {
  const result = await owner.client.rpc("rezeptversion_freigeben", { p_id: versionId });
  if (result.error) throw new Error(result.error.message);
}

async function createReleasedRecipe(label: string) {
  const { rezeptId, versionId } = await createRecipe(unique(label));
  const malt = await createRohstoff(unique(`${label} Malz`), "MALZ", "g");
  const hopfen = await createRohstoff(unique(`${label} Hopfen`), "HOPFEN", "g");
  const step1 = await addStep(versionId, 1, "RAST", "Rast 1", {
    temperatur: 67,
    dauer: 60,
    wasser: 20,
    anweisung: "Maische rasten",
  });
  const step2 = await addStep(versionId, 2, "KOCHEN", "Kochen", {
    temperatur: 100,
    dauer: 60,
    wasser: 0,
    anweisung: "Kochen",
  });
  const maltZutat = await addIngredient(versionId, malt, step1, 5000, {
    ebc: 5,
    offset: 10,
    notizen: "Malz",
  });
  const hopfenZutat = await addIngredient(versionId, hopfen, step2, 50, {
    alpha: 5,
    offset: 5,
    notizen: "Hopfen",
  });

  await sql(
    `update public.tb_rezeptversion
     set ziel_ausschlagmenge_l = 20, ziel_stammwuerze_plato = 12, ziel_abv_prozent = 5,
         ziel_ibu = 30, ziel_ebc = 12
     where id = $1`,
    [versionId],
  );
  await releaseVersion(versionId);

  return { rezeptId, versionId, malt, hopfen, step1, step2, maltZutat, hopfenZutat };
}

async function createBatch(versionId: number, label: string, sudnummer?: string): Promise<number> {
  const sudId = unwrap(
    await owner.client.rpc("sud_aus_rezept_erstellen", {
      p_rezeptversion_id: versionId,
      p_name: unique(label),
      p_sudnummer: sudnummer,
    }),
  );
  return Number(sudId);
}

async function addStock(lotId: number, menge: number): Promise<number> {
  const [row] = await sql<{ id: string }>(
    `insert into public.tb_lagerbewegung (lagercharge_id, typ, mengen_delta)
     values ($1, 'ZUGANG', $2) returning id`,
    [lotId, menge],
  );
  return n(row.id);
}

async function stockOf(lotId: number): Promise<number> {
  const [row] = await sql<{ stock: string }>(
    `select coalesce(sum(mengen_delta), 0)::text as stock
     from public.tb_lagerbewegung where lagercharge_id = $1`,
    [lotId],
  );
  return n(row.stock);
}

async function getBatchIngredient(batchId: number, rohstoffId: number) {
  const [row] = await sql<{ id: string; sudschritt_id: string | null }>(
    `select id, sudschritt_id from public.tb_sudzutat
     where sud_id = $1 and rohstoff_id = $2 order by id limit 1`,
    [batchId, rohstoffId],
  );
  return { id: n(row.id), stepId: row.sudschritt_id ? n(row.sudschritt_id) : null };
}

async function move(
  lotId: number,
  typ: "ZUGANG" | "VERBRAUCH" | "KORREKTUR" | "ENTSORGUNG",
  delta: number,
  options: { sudzutatId?: number; key?: string; notizen?: string } = {},
) {
  return unwrap(
    await owner.client.rpc("lagerbewegung_erfassen", {
      p_lagercharge_id: lotId,
      p_typ: typ,
      p_mengen_delta: delta,
      p_idempotenzschluessel: options.key ?? unique("move"),
      p_sudzutat_id: options.sudzutatId,
      p_notizen: options.notizen,
    }),
  );
}

async function createConsumable(label: string) {
  const released = await createReleasedRecipe(label);
  const batchId = await createBatch(released.versionId, `${label} Sud`);
  const zutat = await getBatchIngredient(batchId, released.malt);
  const lot1 = await createLot(released.malt);
  const lot2 = await createLot(released.malt);
  await addStock(lot1, 10);
  await addStock(lot2, 10);
  return { ...released, batchId, zutatId: zutat.id, lot1, lot2 };
}

beforeAll(async () => {
  await resetDomainData();
  owner = await createTestUser("owner");
  outsider = await createTestUser("outsider");
  unwrap(await owner.client.rpc("zugang_beanspruchen"));
});

afterAll(async () => {
  if (owner) await deleteTestUser(owner);
  if (outsider) await deleteTestUser(outsider);
  await resetDomainData();
  await db.end();
});

describe("access policy", () => {
  it("allows the allowlisted owner to read and write domain data", async () => {
    const name = unique("Eigentuemer Malz");
    const { data, error } = await owner.client
      .from("tb_rohstoff")
      .insert({ name, kategorie: "MALZ", basiseinheit: "g" })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data?.name).toBe(name);
  });

  it("does not expose data or writes to an authenticated non-owner", async () => {
    const read = await outsider.client.from("tb_rohstoff").select("*");
    if (read.error) expect(read.error).toBeTruthy();
    else expect(read.data ?? []).toHaveLength(0);

    const write = await outsider.client
      .from("tb_rohstoff")
      .insert({ name: unique("Nicht erlaubt"), kategorie: "MALZ", basiseinheit: "g" })
      .select();
    expect(write.error).not.toBeNull();

    const rpc = await outsider.client.rpc("rezept_erstellen", { p_name: "Nicht erlaubt" });
    expect(rpc.error?.message).toContain("Keine Berechtigung");
  });

  it("does not expose data to anonymous clients", async () => {
    const read = await anon.from("tb_rohstoff").select("*");
    if (read.error) expect(read.error).toBeTruthy();
    else expect(read.data ?? []).toHaveLength(0);
  });

  it("allows only the first user to claim ownership", async () => {
    const secondClaim = await outsider.client.rpc("zugang_beanspruchen");
    expect(secondClaim.error).not.toBeNull();
  });
});

describe("recipe lifecycle", () => {
  it("creates a recipe and its first draft version atomically", async () => {
    const name = unique("Atomisches Rezept");
    const { rezeptId, versionId } = await createRecipe(name);

    const versions = await sql<{
      id: string;
      versionsnummer: number;
      status: string;
      name_snapshot: string;
      beschreibung_snapshot: string | null;
    }>(
      `select id, versionsnummer, status, name_snapshot, beschreibung_snapshot
       from public.tb_rezeptversion where rezept_id = $1`,
      [rezeptId],
    );

    expect(versions).toHaveLength(1);
    expect(versions[0].id).toBe(String(versionId));
    expect(versions[0].versionsnummer).toBe(1);
    expect(versions[0].status).toBe("ENTWURF");
    expect(versions[0].name_snapshot).toBe(name);
    expect(versions[0].beschreibung_snapshot).toBe(`Beschreibung ${name}`);

    const before = await sql<{ count: string }>(
      `select count(*)::text as count from public.tb_rezept`,
    );
    const blank = await owner.client.rpc("rezept_erstellen", { p_name: "   " });
    expect(blank.error).not.toBeNull();
    const after = await sql<{ count: string }>(
      `select count(*)::text as count from public.tb_rezept`,
    );
    expect(after[0].count).toBe(before[0].count);
  });

  it("allocates subsequent versions safely and rejects duplicate numbers", async () => {
    const { rezeptId } = await createRecipe(unique("Versionsrezept"));
    const v2 = Number(
      unwrap(await owner.client.rpc("rezeptversion_erstellen", { p_rezept_id: rezeptId })),
    );
    const v3 = Number(
      unwrap(await owner.client.rpc("rezeptversion_erstellen", { p_rezept_id: rezeptId })),
    );

    const versions = await sql<{ versionsnummer: number }>(
      `select versionsnummer from public.tb_rezeptversion
       where rezept_id = $1 order by versionsnummer`,
      [rezeptId],
    );
    expect(versions.map((row) => row.versionsnummer)).toEqual([1, 2, 3]);
    expect(v2).not.toBe(v3);

    await expectSqlError(
      sql(
        `insert into public.tb_rezeptversion
           (rezept_id, versionsnummer, name_snapshot) values ($1, 2, 'Duplikat')`,
        [rezeptId],
      ),
      /duplicate key|unique/i,
    );
  });

  it("requires new recipe versions to start as drafts", async () => {
    const { rezeptId } = await createRecipe(unique("Entwurfspflicht"));
    await expectSqlError(
      sql(
        `insert into public.tb_rezeptversion
           (rezept_id, versionsnummer, name_snapshot, status, freigegeben_am)
         values ($1, 2, 'Direkt freigegeben', 'FREIGEGEBEN', now())`,
        [rezeptId],
      ),
      /Entwurf|check/i,
    );
  });

  it("does not allow a batch from a draft recipe version", async () => {
    const { versionId } = await createRecipe(unique("Entwurf Sud"));
    await expectSqlError(
      sql(
        `insert into public.tb_sud (rezeptversion_id, sudnummer, name)
         values ($1, $2, 'Direkter Sud')`,
        [versionId, unique("SUD-DRAFT")],
      ),
      /freigegeben/i,
    );
  });

  it("rejects duplicate step positions, sudnummer, and equipment assignments", async () => {
    const { versionId } = await createRecipe(unique("Duplikatrezept"));
    await addStep(versionId, 1, "RAST", "Rast");
    await expectSqlError(
      sql(
        `insert into public.tb_rezeptschritt (rezeptversion_id, position, typ, name)
         values ($1, 1, 'RAST', 'Duplikat')`,
        [versionId],
      ),
      /duplicate key|unique/i,
    );

    const released = await createReleasedRecipe("Duplikat Sud");
    const sudnummer = unique("SUD-DUP");
    await createBatch(released.versionId, "Duplikat Sud 1", sudnummer);
    const duplicateSud = await owner.client.rpc("sud_aus_rezept_erstellen", {
      p_rezeptversion_id: released.versionId,
      p_name: unique("Duplikat Sud 2"),
      p_sudnummer: sudnummer,
    });
    expect(duplicateSud.error).not.toBeNull();

    const [geraet] = await sql<{ id: string }>(
      `insert into public.tb_geraet (name, menge) values ($1, 2) returning id`,
      [unique("Geraet")],
    );
    const batchId = await createBatch(released.versionId, "Duplikat Geraet");
    await expectSqlError(
      sql(
        `insert into public.tb_sudschritt (sud_id, position, typ, name)
         values ($1, 1, 'RAST', 'Duplikat')`,
        [batchId],
      ),
      /duplicate key|unique/i,
    );
    await sql(
      `insert into public.tb_sudgeraet (sud_id, geraet_id, zugewiesene_menge)
       values ($1, $2, 1)`,
      [batchId, geraet.id],
    );
    await expectSqlError(
      sql(
        `insert into public.tb_sudgeraet (sud_id, geraet_id, zugewiesene_menge)
         values ($1, $2, 1)`,
        [batchId, geraet.id],
      ),
      /duplicate key|unique/i,
    );
  });

  it("rejects invalid enums, signs, negative quantities, and percentages", async () => {
    await expectSqlError(
      sql(
        `insert into public.tb_rohstoff (name, kategorie, basiseinheit)
         values ('Ungueltig', 'UNGUELTIG', 'g')`,
      ),
      /invalid input value for enum/i,
    );

    const rohstoff = await createRohstoff(unique("Bewegungsmalz"));
    const lot = await createLot(rohstoff);

    await expectSqlError(
      sql(
        `insert into public.tb_lagerbewegung (lagercharge_id, typ, mengen_delta)
         values ($1, 'ZUGANG', -1)`,
        [lot],
      ),
      /check|Lagerbestand|negativ/i,
    );
    await expectSqlError(
      sql(
        `insert into public.tb_lagerbewegung (lagercharge_id, typ, mengen_delta)
         values ($1, 'KORREKTUR', 0)`,
        [lot],
      ),
      /check/i,
    );
    await expectSqlError(
      sql(
        `insert into public.tb_lagercharge
           (rohstoff_id, lieferdatum, alphasaeure_prozent)
         values ($1, '2026-01-01', 101)`,
        [rohstoff],
      ),
      /check/i,
    );

    const { versionId } = await createRecipe(unique("Ungueltige Werte"));
    await expectSqlError(
      sql(`update public.tb_rezeptversion set ziel_ausschlagmenge_l = 0 where id = $1`, [
        versionId,
      ]),
      /check/i,
    );
    const zutat = await addIngredient(versionId, rohstoff, null, 1);
    await expectSqlError(
      sql(`update public.tb_rezeptzutat set menge = -1 where id = $1`, [zutat]),
      /check/i,
    );
    await expectSqlError(
      sql(`update public.tb_rezeptzutat set alphasaeure_prozent = 101 where id = $1`, [zutat]),
      /check/i,
    );

    const { versionId: releasedVersion } = await createReleasedRecipe("Geraet ungueltig");
    const batchId = await createBatch(releasedVersion, "Geraet ungueltig");
    const [geraet] = await sql<{ id: string }>(
      `insert into public.tb_geraet (name, menge) values ($1, 2) returning id`,
      [unique("Ungueltiges Geraet")],
    );
    await expectSqlError(
      sql(
        `insert into public.tb_sudgeraet (sud_id, geraet_id, zugewiesene_menge)
         values ($1, $2, 0)`,
        [batchId, geraet.id],
      ),
      /check/i,
    );
  });

  it("distinguishes unknown NULL values from recorded zero values", async () => {
    const released = await createReleasedRecipe("NULL Rezept");
    const batchId = await createBatch(released.versionId, "NULL Sud");

    const [row] = await sql<{
      ziel_ibu: string;
      ist_ibu: string | null;
      ist_ausschlagmenge_l: string | null;
    }>(`select ziel_ibu, ist_ibu, ist_ausschlagmenge_l from public.tb_sud where id = $1`, [
      batchId,
    ]);

    expect(Number(row.ziel_ibu)).toBe(30);
    expect(row.ist_ibu).toBeNull();
    expect(row.ist_ausschlagmenge_l).toBeNull();

    await sql(`update public.tb_sud set ist_ausschlagmenge_l = 0 where id = $1`, [batchId]);
    const [updated] = await sql<{ ist_ausschlagmenge_l: string }>(
      `select ist_ausschlagmenge_l from public.tb_sud where id = $1`,
      [batchId],
    );
    expect(Number(updated.ist_ausschlagmenge_l)).toBe(0);
  });

  it("rejects a recipe ingredient assigned to another version's step", async () => {
    const a = await createRecipe(unique("Version A"));
    const b = await createRecipe(unique("Version B"));
    const rohstoff = await createRohstoff(unique("Fremdschritt Malz"));
    const stepB = await addStep(b.versionId, 1, "RAST", "Fremder Schritt");

    await expectSqlError(
      sql(
        `insert into public.tb_rezeptzutat
           (rezeptversion_id, rohstoff_id, rezeptschritt_id, rohstoffname_snapshot,
            einheit_snapshot, menge)
         values ($1, $2, $3, 'placeholder', 'g', 1)`,
        [a.versionId, rohstoff, stepB],
      ),
      /foreign key|violates/i,
    );
  });

  it("rejects a batch ingredient assigned to another batch's step", async () => {
    const released = await createReleasedRecipe("Fremder Sudschritt");
    const batchA = await createBatch(released.versionId, "Sud A");
    const batchB = await createBatch(released.versionId, "Sud B");
    const [stepB] = await sql<{ id: string }>(
      `select id from public.tb_sudschritt where sud_id = $1 order by position limit 1`,
      [batchB],
    );

    await expectSqlError(
      sql(
        `insert into public.tb_sudzutat
           (sud_id, rohstoff_id, sudschritt_id, rohstoffname_snapshot,
            einheit_snapshot, geplante_menge)
         values ($1, $2, $3, 'placeholder', 'g', 1)`,
        [batchA, released.malt, stepB.id],
      ),
      /foreign key|violates/i,
    );
  });

  it("rejects a movement linking a lot and a batch ingredient with different ingredients", async () => {
    const released = await createReleasedRecipe("Bewegungs-Mismatch");
    const batchId = await createBatch(released.versionId, "Bewegungs-Mismatch");
    const zutat = await getBatchIngredient(batchId, released.malt);
    const otherLot = await createLot(released.hopfen);

    const result = await owner.client.rpc("lagerbewegung_erfassen", {
      p_lagercharge_id: otherLot,
      p_typ: "VERBRAUCH",
      p_mengen_delta: -1,
      p_sudzutat_id: zutat.id,
      p_idempotenzschluessel: unique("mismatch"),
    });
    expect(result.error?.message).toContain("denselben Rohstoff");
  });

  it("makes released versions and their children immutable", async () => {
    const released = await createReleasedRecipe("Unveraenderlich");

    await expectSqlError(
      sql(`update public.tb_rezeptversion set name_snapshot = 'geaendert' where id = $1`, [
        released.versionId,
      ]),
      /freigegeben|unveraenderlich/i,
    );
    await expectSqlError(
      sql(
        `insert into public.tb_rezeptschritt (rezeptversion_id, position, typ, name)
         values ($1, 99, 'RAST', 'Neu')`,
        [released.versionId],
      ),
      /freigegeben|unveraenderlich/i,
    );
    await expectSqlError(
      sql(`update public.tb_rezeptzutat set menge = 1 where id = $1`, [released.maltZutat]),
      /freigegeben|unveraenderlich/i,
    );
    await expectSqlError(
      sql(`update public.tb_rohstoff set basiseinheit = 'ml' where id = $1`, [released.malt]),
      /Basiseinheit|referenziert/i,
    );

    const lot = await createLot(released.malt);
    const movementId = await addStock(lot, 10);
    await expectSqlError(
      sql(`update public.tb_lagercharge set rohstoff_id = $1 where id = $2`, [
        released.hopfen,
        lot,
      ]),
      /Bewegungen|geaendert/i,
    );
    await expectSqlError(
      sql(`update public.tb_lagerbewegung set mengen_delta = 1 where id = $1`, [movementId]),
      /unveraenderlich/i,
    );
    await expectSqlError(
      sql(`delete from public.tb_lagerbewegung where id = $1`, [movementId]),
      /unveraenderlich/i,
    );
  });
});

describe("batch copying and substitution", () => {
  it("copies a released recipe into independent batch rows with step remapping", async () => {
    const released = await createReleasedRecipe("Kopie");
    const batchId = await createBatch(released.versionId, "Kopie Sud", unique("SUD-COPY"));

    const [sud] = await sql<{
      ziel_ausschlagmenge_l: string;
      ziel_stammwuerze_plato: string;
      ziel_abv_prozent: string;
      ziel_ibu: string;
      ziel_ebc: string;
      ist_ausschlagmenge_l: string | null;
    }>(
      `select ziel_ausschlagmenge_l, ziel_stammwuerze_plato, ziel_abv_prozent,
              ziel_ibu, ziel_ebc, ist_ausschlagmenge_l
       from public.tb_sud where id = $1`,
      [batchId],
    );
    expect(Number(sud.ziel_ausschlagmenge_l)).toBe(20);
    expect(Number(sud.ziel_stammwuerze_plato)).toBe(12);
    expect(Number(sud.ziel_abv_prozent)).toBe(5);
    expect(Number(sud.ziel_ibu)).toBe(30);
    expect(Number(sud.ziel_ebc)).toBe(12);
    expect(sud.ist_ausschlagmenge_l).toBeNull();

    const steps = await sql<{
      id: string;
      position: number;
      ziel_temperatur_c: string;
      ziel_dauer_min: string;
    }>(
      `select id, position, ziel_temperatur_c, ziel_dauer_min
       from public.tb_sudschritt where sud_id = $1 order by position`,
      [batchId],
    );
    expect(steps).toHaveLength(2);
    expect(steps[0].position).toBe(1);
    expect(Number(steps[0].ziel_temperatur_c)).toBe(67);
    expect(Number(steps[0].ziel_dauer_min)).toBe(60);

    const zutaten = await sql<{
      id: string;
      rohstoff_id: string;
      sudschritt_id: string | null;
      geplante_menge: string;
      alphasaeure_prozent: string | null;
      ebc: string | null;
      ziel_zugabe_nach_min: string | null;
    }>(
      `select id, rohstoff_id, sudschritt_id, geplante_menge, alphasaeure_prozent,
              ebc, ziel_zugabe_nach_min
       from public.tb_sudzutat where sud_id = $1 order by id`,
      [batchId],
    );
    expect(zutaten).toHaveLength(2);
    const malt = zutaten.find((row) => Number(row.rohstoff_id) === released.malt);
    const hopfen = zutaten.find((row) => Number(row.rohstoff_id) === released.hopfen);
    expect(malt).toBeDefined();
    expect(hopfen).toBeDefined();
    expect(Number(malt?.geplante_menge)).toBe(5000);
    expect(Number(malt?.ebc)).toBe(5);
    expect(Number(malt?.ziel_zugabe_nach_min)).toBe(10);
    expect(Number(hopfen?.geplante_menge)).toBe(50);
    expect(Number(hopfen?.alphasaeure_prozent)).toBe(5);
    expect(Number(hopfen?.ziel_zugabe_nach_min)).toBe(5);
    expect(malt?.sudschritt_id).toBe(steps[0].id);
    expect(hopfen?.sudschritt_id).toBe(steps[1].id);

    const recipeZutaten = await sql<{ count: string }>(
      `select count(*)::text as count from public.tb_rezeptzutat where rezeptversion_id = $1`,
      [released.versionId],
    );
    expect(recipeZutaten[0].count).toBe("2");

    await sql(`update public.tb_sud set ziel_ibu = 99 where id = $1`, [batchId]);
    const [versionTarget] = await sql<{ ziel_ibu: string }>(
      `select ziel_ibu from public.tb_rezeptversion where id = $1`,
      [released.versionId],
    );
    expect(Number(versionTarget.ziel_ibu)).toBe(30);
  });

  it("derives batch step duration from complete timestamps", async () => {
    const released = await createReleasedRecipe("Dauer");
    const batchId = await createBatch(released.versionId, "Dauer");
    const [step] = await sql<{ id: string }>(
      `select id from public.tb_sudschritt where sud_id = $1 order by position limit 1`,
      [batchId],
    );

    await sql(
      `update public.tb_sudschritt
       set gestartet_am = '2026-01-01T10:00:00Z', beendet_am = '2026-01-01T10:30:00Z'
       where id = $1`,
      [step.id],
    );
    const [updated] = await sql<{ ist_dauer_min: string }>(
      `select ist_dauer_min from public.tb_sudschritt where id = $1`,
      [step.id],
    );
    expect(Number(updated.ist_dauer_min)).toBe(30);

    await expectSqlError(
      sql(
        `update public.tb_sudschritt
         set gestartet_am = '2026-01-01T10:00:00Z', beendet_am = '2026-01-01T09:00:00Z'
         where id = $1`,
        [step.id],
      ),
      /beendet_am|check/i,
    );
  });

  it("substitutes a batch ingredient without changing the recipe", async () => {
    const released = await createReleasedRecipe("Substitution");
    const batchId = await createBatch(released.versionId, "Substitution Sud");
    const zutat = await getBatchIngredient(batchId, released.malt);
    const newMalt = await createRohstoff(unique("Ersatzmalz"), "MALZ", "g");

    const substituted = unwrap(
      await owner.client.rpc("sudzutat_ersetzen", {
        p_sudzutat_id: zutat.id,
        p_rohstoff_id: newMalt,
        p_alphasaeure_prozent: 4.5,
        p_ebc: 8.5,
        p_notizen: "Ersetzt",
      }),
    );
    expect(substituted.rohstoff_id).toBe(newMalt);
    expect(substituted.rohstoffname_snapshot).toContain("Ersatzmalz");
    expect(substituted.einheit_snapshot).toBe("g");
    expect(Number(substituted.geplante_menge)).toBe(5000);
    expect(Number(substituted.alphasaeure_prozent)).toBe(4.5);
    expect(Number(substituted.ebc)).toBe(8.5);

    const [recipeIngredient] = await sql<{ rohstoff_id: string }>(
      `select rohstoff_id from public.tb_rezeptzutat where id = $1`,
      [released.maltZutat],
    );
    expect(Number(recipeIngredient.rohstoff_id)).toBe(released.malt);

    const mlMalt = await createRohstoff(unique("Fluessigmalz"), "MALZ", "ml");
    const withoutQuantity = await owner.client.rpc("sudzutat_ersetzen", {
      p_sudzutat_id: zutat.id,
      p_rohstoff_id: mlMalt,
    });
    expect(withoutQuantity.error).not.toBeNull();
    expect(withoutQuantity.error?.message).toContain("Basiseinheit");

    const unitChanged = unwrap(
      await owner.client.rpc("sudzutat_ersetzen", {
        p_sudzutat_id: zutat.id,
        p_rohstoff_id: mlMalt,
        p_menge: 100,
        p_alphasaeure_prozent: 3,
        p_ebc: 4,
      }),
    );
    expect(unitChanged.einheit_snapshot).toBe("ml");
    expect(Number(unitChanged.geplante_menge)).toBe(100);
    expect(Number(unitChanged.alphasaeure_prozent)).toBe(3);

    const newLot = await createLot(mlMalt);
    await addStock(newLot, 200);
    await move(newLot, "VERBRAUCH", -50, {
      sudzutatId: zutat.id,
      notizen: "Verbrauch des Ersatzrohstoffs",
    });
    expect(await stockOf(newLot)).toBe(150);

    const [step] = await sql<{ id: string }>(
      `select id from public.tb_sudschritt where sud_id = $1 order by position limit 1`,
      [batchId],
    );
    await sql(
      `insert into public.tb_sudzutat
         (sud_id, rohstoff_id, sudschritt_id, rohstoffname_snapshot,
          einheit_snapshot, geplante_menge)
       values ($1, $2, $3, 'placeholder', 'ml', 25)`,
      [batchId, mlMalt, step.id],
    );
    const split = await sql<{ count: string }>(
      `select count(*)::text as count from public.tb_sudzutat
       where sud_id = $1 and rohstoff_id = $2`,
      [batchId, mlMalt],
    );
    expect(split[0].count).toBe("2");
    const recipeCount = await sql<{ count: string }>(
      `select count(*)::text as count from public.tb_rezeptzutat where rezeptversion_id = $1`,
      [released.versionId],
    );
    expect(recipeCount[0].count).toBe("2");
  });
});

describe("inventory and actual use", () => {
  it("consumes one batch ingredient from multiple lots and corrects through new movements", async () => {
    const fixture = await createConsumable("Mehrere Chargen");
    const first = await move(fixture.lot1, "VERBRAUCH", -2, {
      sudzutatId: fixture.zutatId,
      notizen: "Charge 1",
    });
    const second = await move(fixture.lot2, "VERBRAUCH", -3, {
      sudzutatId: fixture.zutatId,
      notizen: "Charge 2",
    });

    expect(Number(first.mengen_delta)).toBe(-2);
    expect(Number(second.mengen_delta)).toBe(-3);
    expect(await stockOf(fixture.lot1)).toBe(8);
    expect(await stockOf(fixture.lot2)).toBe(7);

    const netAfterConsumption = unwrap(
      await owner.client.rpc("sudzutat_verbrauch_netto", { p_sudzutat_id: fixture.zutatId }),
    );
    expect(Number(netAfterConsumption)).toBe(5);

    const correction = await move(fixture.lot1, "KORREKTUR", 2, {
      sudzutatId: fixture.zutatId,
      notizen: "Korrektur",
    });
    expect(correction.id).not.toBe(first.id);
    expect(await stockOf(fixture.lot1)).toBe(10);
    const netAfterCorrection = unwrap(
      await owner.client.rpc("sudzutat_verbrauch_netto", { p_sudzutat_id: fixture.zutatId }),
    );
    expect(Number(netAfterCorrection)).toBe(3);

    const movementCount = await sql<{ count: string }>(
      `select count(*)::text as count from public.tb_lagerbewegung where sudzutat_id = $1`,
      [fixture.zutatId],
    );
    expect(movementCount[0].count).toBe("3");

    const replacement = await owner.client.rpc("sudzutat_ersetzen", {
      p_sudzutat_id: fixture.zutatId,
      p_rohstoff_id: fixture.malt,
    });
    expect(replacement.error).not.toBeNull();

    await expectSqlError(
      sql(`update public.tb_sudzutat set rohstoff_id = $1 where id = $2`, [
        fixture.hopfen,
        fixture.zutatId,
      ]),
      /Lagerbewegungen|geaendert/i,
    );

    const reconciled = unwrap(
      await owner.client.rpc("sudzutat_ist_menge_setzen", {
        p_sudzutat_id: fixture.zutatId,
        p_ist_menge: 3,
        p_aus_lager: true,
      }),
    );
    expect(Number(reconciled.ist_menge)).toBe(3);

    const mismatch = await owner.client.rpc("sudzutat_ist_menge_setzen", {
      p_sudzutat_id: fixture.zutatId,
      p_ist_menge: 4,
      p_aus_lager: true,
    });
    expect(mismatch.error).not.toBeNull();

    await expectSqlError(
      sql(`update public.tb_sudzutat set ist_menge = 4 where id = $1`, [fixture.zutatId]),
      /Nettolagerverbrauch|Ist-Menge/i,
    );
    await sql(`update public.tb_sudzutat set ist_menge = 3 where id = $1`, [fixture.zutatId]);
    const [direct] = await sql<{ ist_menge: string }>(
      `select ist_menge from public.tb_sudzutat where id = $1`,
      [fixture.zutatId],
    );
    expect(Number(direct.ist_menge)).toBe(3);
  });

  it("supports direct-use ingredients without inventory movements", async () => {
    const released = await createReleasedRecipe("Direktverwendung");
    const batchId = await createBatch(released.versionId, "Direktverwendung");
    const zutat = await getBatchIngredient(batchId, released.hopfen);

    const updated = unwrap(
      await owner.client.rpc("sudzutat_ist_menge_setzen", {
        p_sudzutat_id: zutat.id,
        p_ist_menge: 5,
        p_aus_lager: false,
      }),
    );
    expect(Number(updated.ist_menge)).toBe(5);
    const net = unwrap(
      await owner.client.rpc("sudzutat_verbrauch_netto", { p_sudzutat_id: zutat.id }),
    );
    expect(Number(net)).toBe(0);

    const impossible = await owner.client.rpc("sudzutat_ist_menge_setzen", {
      p_sudzutat_id: zutat.id,
      p_ist_menge: 5,
      p_aus_lager: true,
    });
    expect(impossible.error).not.toBeNull();
  });

  it("does not duplicate a retried consumption request", async () => {
    const fixture = await createConsumable("Retry");
    const key = unique("retry-key");
    const first = await move(fixture.lot1, "VERBRAUCH", -1, {
      sudzutatId: fixture.zutatId,
      key,
    });
    const retry = await move(fixture.lot1, "VERBRAUCH", -1, {
      sudzutatId: fixture.zutatId,
      key,
    });
    expect(retry.id).toBe(first.id);

    const count = await sql<{ count: string }>(
      `select count(*)::text as count from public.tb_lagerbewegung where sudzutat_id = $1`,
      [fixture.zutatId],
    );
    expect(count[0].count).toBe("1");
    expect(await stockOf(fixture.lot1)).toBe(9);
  });

  it("prevents concurrent withdrawals from creating a negative balance", async () => {
    const fixture = await createConsumable("Konkurrenz");
    const results = await Promise.all([
      owner.client.rpc("lagerbewegung_erfassen", {
        p_lagercharge_id: fixture.lot1,
        p_typ: "VERBRAUCH",
        p_mengen_delta: -8,
        p_sudzutat_id: fixture.zutatId,
        p_idempotenzschluessel: unique("concurrent-a"),
      }),
      owner.client.rpc("lagerbewegung_erfassen", {
        p_lagercharge_id: fixture.lot1,
        p_typ: "VERBRAUCH",
        p_mengen_delta: -8,
        p_sudzutat_id: fixture.zutatId,
        p_idempotenzschluessel: unique("concurrent-b"),
      }),
    ]);

    const successes = results.filter((result) => result.error === null).length;
    expect(successes).toBe(1);
    expect(await stockOf(fixture.lot1)).toBe(2);
  });

  it("allocates recipe versions and sudnummer safely under concurrency", async () => {
    const { rezeptId } = await createRecipe(unique("Konkurrenz-Versionen"));
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        owner.client.rpc("rezeptversion_erstellen", { p_rezept_id: rezeptId }),
      ),
    );
    expect(results.every((result) => result.error === null)).toBe(true);

    const versions = await sql<{ versionsnummer: number }>(
      `select versionsnummer from public.tb_rezeptversion where rezept_id = $1 order by versionsnummer`,
      [rezeptId],
    );
    expect(versions.map((row) => row.versionsnummer)).toEqual([1, 2, 3, 4, 5, 6]);

    const numbers = await Promise.all(
      Array.from({ length: 10 }, () => owner.client.rpc("naechste_sudnummer")),
    );
    const values = numbers
      .filter((result) => result.error === null)
      .map((result) => String(result.data));
    expect(values).toHaveLength(10);
    expect(new Set(values).size).toBe(10);

    const released = await createReleasedRecipe("Konkurrenz-Sudnummern");
    const batchResults = await Promise.all(
      Array.from({ length: 5 }, () =>
        owner.client.rpc("sud_aus_rezept_erstellen", {
          p_rezeptversion_id: released.versionId,
          p_name: unique("Paralleler Sud"),
        }),
      ),
    );
    expect(batchResults.every((result) => result.error === null)).toBe(true);
    const sudnummern = await sql<{ sudnummer: string }>(
      `select sudnummer from public.tb_sud where rezeptversion_id = $1`,
      [released.versionId],
    );
    expect(sudnummern).toHaveLength(5);
    expect(new Set(sudnummern.map((row) => row.sudnummer)).size).toBe(5);
  });
});

describe("equipment, archiving, and deletion", () => {
  it("preserves equipment snapshots after master-data changes", async () => {
    const released = await createReleasedRecipe("Geraete-Snapshot");
    const batchId = await createBatch(released.versionId, "Geraete-Snapshot");
    const [geraet] = await sql<{ id: string }>(
      `insert into public.tb_geraet (name, menge, lob_faehig, lob_menge_l)
       values ($1, 2, true, 10) returning id`,
      [unique("Sudkessel")],
    );

    await sql(
      `insert into public.tb_sudgeraet
         (sud_id, geraet_id, zugewiesene_menge, lob_genutzt)
       values ($1, $2, 2, true)`,
      [batchId, geraet.id],
    );

    const [snapshot] = await sql<{
      geraetename_snapshot: string;
      lob_menge_l_snapshot: string;
    }>(
      `select geraetename_snapshot, lob_menge_l_snapshot from public.tb_sudgeraet
        where sud_id = $1 and geraet_id = $2`,
      [batchId, geraet.id],
    );
    expect(snapshot.geraetename_snapshot).toContain("Sudkessel");
    expect(Number(snapshot.lob_menge_l_snapshot)).toBe(10);

    await sql(`update public.tb_geraet set name = $1, lob_menge_l = 20, menge = 5 where id = $2`, [
      unique("Neuer Kessel"),
      geraet.id,
    ]);
    await sql(
      `update public.tb_sudgeraet set notizen = 'unveraendert' where sud_id = $1 and geraet_id = $2`,
      [batchId, geraet.id],
    );

    const [after] = await sql<{
      geraetename_snapshot: string;
      lob_menge_l_snapshot: string;
      notizen: string;
    }>(
      `select geraetename_snapshot, lob_menge_l_snapshot, notizen from public.tb_sudgeraet
        where sud_id = $1 and geraet_id = $2`,
      [batchId, geraet.id],
    );
    expect(after.geraetename_snapshot).toBe(snapshot.geraetename_snapshot);
    expect(Number(after.lob_menge_l_snapshot)).toBe(10);
    expect(after.notizen).toBe("unveraendert");
  });

  it("rejects LOB use on equipment that is not LOB-capable", async () => {
    const released = await createReleasedRecipe("Kein LOB");
    const batchId = await createBatch(released.versionId, "Kein LOB");
    const [geraet] = await sql<{ id: string }>(
      `insert into public.tb_geraet (name, menge, lob_faehig)
       values ($1, 1, false) returning id`,
      [unique("Ohne LOB")],
    );
    await expectSqlError(
      sql(
        `insert into public.tb_sudgeraet
           (sud_id, geraet_id, zugewiesene_menge, lob_genutzt, lob_menge_l_snapshot)
         values ($1, $2, 1, true, 5)`,
        [batchId, geraet.id],
      ),
      /LOB|faehig/i,
    );

    const [small] = await sql<{ id: string }>(
      `insert into public.tb_geraet (name, menge) values ($1, 1) returning id`,
      [unique("Kleines Geraet")],
    );
    await expectSqlError(
      sql(
        `insert into public.tb_sudgeraet (sud_id, geraet_id, zugewiesene_menge)
         values ($1, $2, 2)`,
        [batchId, small.id],
      ),
      /uebersteigt|Menge/i,
    );
  });

  it("keeps archived master data visible and blocks destructive deletes", async () => {
    const released = await createReleasedRecipe("Archiv");
    const batchId = await createBatch(released.versionId, "Archiv");
    await sql(`update public.tb_rohstoff set archiviert = true where id = $1`, [released.malt]);

    const archived = await owner.client
      .from("tb_rohstoff")
      .select("id, archiviert")
      .eq("id", released.malt)
      .single();
    expect(archived.error).toBeNull();
    expect(archived.data?.archiviert).toBe(true);

    const [batchIngredient] = await sql<{ id: string }>(
      `select id from public.tb_sudzutat where sud_id = $1 and rohstoff_id = $2`,
      [batchId, released.malt],
    );
    const lot = await createLot(released.malt);
    await addStock(lot, 5);
    await move(lot, "VERBRAUCH", -1, { sudzutatId: n(batchIngredient.id), notizen: "Test" });

    await expectSqlError(
      sql(`delete from public.tb_rohstoff where id = $1`, [released.malt]),
      /foreign key|violates/i,
    );
    await expectSqlError(
      sql(`delete from public.tb_sudzutat where id = $1`, [batchIngredient.id]),
      /foreign key|violates/i,
    );
    await expectSqlError(
      sql(`delete from public.tb_lagercharge where id = $1`, [lot]),
      /foreign key|violates/i,
    );
    await expectSqlError(
      sql(`delete from public.tb_rezeptversion where id = $1`, [released.versionId]),
      /freigegeben|unveraenderlich/i,
    );
    await expectSqlError(
      sql(`delete from public.tb_rezept where id = $1`, [released.rezeptId]),
      /foreign key|violates/i,
    );
  });

  it("blocks deleting the final recipe version", async () => {
    const { versionId } = await createRecipe(unique("Letzte Version"));
    await expectSqlError(
      sql(`delete from public.tb_rezeptversion where id = $1`, [versionId]),
      /letzte Rezeptversion/i,
    );
  });
});
