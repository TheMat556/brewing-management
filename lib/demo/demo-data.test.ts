import { describe, expect, it } from "vitest";
import {
  geraete,
  getBestandCharge,
  getBewegungDetails,
  lagerbewegungen,
  lagerchargen,
  rezeptschritte,
  rezeptversionen,
  rezeptzutaten,
  sude,
  sudgeraete,
  sudzutaten,
} from "@/lib/demo";

describe("demo fixture integrity", () => {
  it("uses valid movement signs and never produces negative stock", () => {
    for (const bewegung of lagerbewegungen) {
      expect(bewegung.mengen_delta).not.toBe(0);
      if (bewegung.typ === "ZUGANG") {
        expect(bewegung.mengen_delta).toBeGreaterThan(0);
      }
      if (bewegung.typ === "VERBRAUCH" || bewegung.typ === "ENTSORGUNG") {
        expect(bewegung.mengen_delta).toBeLessThan(0);
      }
    }

    for (const charge of lagerchargen) {
      expect(getBestandCharge(charge.id)).toBeGreaterThanOrEqual(0);
    }
  });

  it("links movements only to matching raw ingredients", () => {
    for (const bewegung of lagerbewegungen) {
      const details = getBewegungDetails(bewegung);
      expect(details).not.toBeNull();
      if (bewegung.sudzutat_id === null || !details) {
        continue;
      }
      const zutat = sudzutaten.find((item) => item.id === bewegung.sudzutat_id);
      expect(zutat).toBeDefined();
      expect(zutat?.rohstoff_id).toBe(details.rohstoff.id);
    }
  });

  it("creates batches only from released recipe versions", () => {
    for (const sud of sude) {
      const version = rezeptversionen.find((item) => item.id === sud.rezeptversion_id);
      expect(version).toBeDefined();
      expect(version?.status).toBe("FREIGEGEBEN");
    }
  });

  it("keeps recipe version release timestamps consistent", () => {
    for (const version of rezeptversionen) {
      if (version.status === "ENTWURF") {
        expect(version.freigegeben_am).toBeNull();
      } else {
        expect(version.freigegeben_am).not.toBeNull();
      }
    }
  });

  it("splits boil additions into T-minus timings", () => {
    const kochschritt = rezeptschritte.find(
      (schritt) => schritt.rezeptversion_id === 1 && schritt.typ === "KOCHEN",
    );
    expect(kochschritt).toBeDefined();
    expect(kochschritt?.dauer_min).toBe(60);

    const kochzutaten = rezeptzutaten.filter((zutat) => zutat.rezeptschritt_id === kochschritt?.id);
    expect(kochzutaten).toHaveLength(2);
    expect(kochzutaten.map((zutat) => zutat.zugabe_nach_min).sort()).toEqual([0, 50]);
    expect(kochzutaten.reduce((summe, zutat) => summe + zutat.menge, 0)).toBe(45);

    for (const zutat of kochzutaten) {
      expect(zutat.zugabe_nach_min).toBeLessThanOrEqual(kochschritt?.dauer_min ?? 0);
    }
  });

  it("respects equipment quantities, LOB capability, and snapshots", () => {
    for (const eintrag of sudgeraete) {
      const geraet = geraete.find((item) => item.id === eintrag.geraet_id);
      expect(geraet).toBeDefined();
      if (!geraet) {
        continue;
      }
      expect(eintrag.zugewiesene_menge).toBeGreaterThan(0);
      expect(eintrag.zugewiesene_menge).toBeLessThanOrEqual(geraet.menge);
      if (eintrag.lob_genutzt) {
        expect(geraet.lob_faehig).toBe(true);
        expect(eintrag.lob_menge_l_snapshot).not.toBeNull();
      }
    }
  });
});
