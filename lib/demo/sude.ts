import type { Tables } from "@/lib/database.types";
import { rezeptschritte, rezeptversionen, rezeptzutaten } from "./rezepte";

export type Sud = Tables<"tb_sud">;
export type Sudschritt = Tables<"tb_sudschritt">;
export type Sudzutat = Tables<"tb_sudzutat">;
export type Sudgeraet = Tables<"tb_sudgeraet">;

type SudModus = "abgeschlossen" | "in_arbeit" | "geplant" | "verworfen";

const sudDaten = [
  {
    id: 1,
    rezeptversion_id: 1,
    sudnummer: "2026-001",
    name: "Helles 2026",
    erstellt_am: "2026-06-10T09:00:00+02:00",
    braudatum: "2026-06-14",
    status: "ABGESCHLOSSEN",
    ziel_ausschlagmenge_l: 20,
    ziel_stammwuerze_plato: 12.5,
    ziel_abv_prozent: 5.2,
    ziel_ibu: 22,
    ziel_ebc: 7,
    ist_ausschlagmenge_l: 19.5,
    ist_stammwuerze_plato: 12.6,
    ist_abv_prozent: 5.2,
    ist_ibu: 21,
    ist_ebc: 7,
    abgefuellte_menge_l: 18,
    infos: "Erster Sud mit der neuen Anlage.",
  },
  {
    id: 2,
    rezeptversion_id: 3,
    sudnummer: "2026-002",
    name: "Weizen",
    erstellt_am: "2026-07-01T09:00:00+02:00",
    braudatum: "2026-07-05",
    status: "ABGESCHLOSSEN",
    ziel_ausschlagmenge_l: 20,
    ziel_stammwuerze_plato: 12.8,
    ziel_abv_prozent: 5.4,
    ziel_ibu: 14,
    ziel_ebc: 12,
    ist_ausschlagmenge_l: 20.2,
    ist_stammwuerze_plato: 12.9,
    ist_abv_prozent: 5.4,
    ist_ibu: 14,
    ist_ebc: 12,
    abgefuellte_menge_l: 19,
    infos: null,
  },
  {
    id: 3,
    rezeptversion_id: 4,
    sudnummer: "2026-003",
    name: "Cascade IPA",
    erstellt_am: "2026-07-28T09:00:00+02:00",
    braudatum: "2026-08-01",
    status: "VERWORFEN",
    ziel_ausschlagmenge_l: 20,
    ziel_stammwuerze_plato: 16,
    ziel_abv_prozent: 6.5,
    ziel_ibu: 55,
    ziel_ebc: 15,
    ist_ausschlagmenge_l: null,
    ist_stammwuerze_plato: null,
    ist_abv_prozent: null,
    ist_ibu: null,
    ist_ebc: null,
    abgefuellte_menge_l: null,
    infos: "Gärung wurde wegen Fehlgeschmack abgebrochen.",
  },
  {
    id: 4,
    rezeptversion_id: 1,
    sudnummer: "2026-004",
    name: "Helles 2026",
    erstellt_am: "2026-09-28T09:00:00+02:00",
    braudatum: "2026-10-02",
    status: "IN_ARBEIT",
    ziel_ausschlagmenge_l: 20,
    ziel_stammwuerze_plato: 12.5,
    ziel_abv_prozent: 5.2,
    ziel_ibu: 22,
    ziel_ebc: 7,
    ist_ausschlagmenge_l: 19,
    ist_stammwuerze_plato: 12.4,
    ist_abv_prozent: null,
    ist_ibu: null,
    ist_ebc: null,
    abgefuellte_menge_l: null,
    infos: "Hauptgärung läuft. Abfüllung noch offen.",
  },
  {
    id: 5,
    rezeptversion_id: 3,
    sudnummer: "2026-005",
    name: "Weizen",
    erstellt_am: "2026-10-20T09:00:00+02:00",
    braudatum: "2026-11-15",
    status: "GEPLANT",
    ziel_ausschlagmenge_l: 20,
    ziel_stammwuerze_plato: 12.8,
    ziel_abv_prozent: 5.4,
    ziel_ibu: 14,
    ziel_ebc: 12,
    ist_ausschlagmenge_l: null,
    ist_stammwuerze_plato: null,
    ist_abv_prozent: null,
    ist_ibu: null,
    ist_ebc: null,
    abgefuellte_menge_l: null,
    infos: "Brautermin steht, Zutaten sind reserviert.",
  },
  {
    id: 6,
    rezeptversion_id: 4,
    sudnummer: "2026-006",
    name: "Cascade IPA",
    erstellt_am: "2026-10-28T09:00:00+02:00",
    braudatum: "2026-12-05",
    status: "GEPLANT",
    ziel_ausschlagmenge_l: 20,
    ziel_stammwuerze_plato: 16,
    ziel_abv_prozent: 6.5,
    ziel_ibu: 55,
    ziel_ebc: 15,
    ist_ausschlagmenge_l: null,
    ist_stammwuerze_plato: null,
    ist_abv_prozent: null,
    ist_ibu: null,
    ist_ebc: null,
    abgefuellte_menge_l: null,
    infos: null,
  },
] satisfies Sud[];

export const sude = sudDaten;

const sudModus: Record<number, SudModus> = {
  1: "abgeschlossen",
  2: "abgeschlossen",
  3: "verworfen",
  4: "in_arbeit",
  5: "geplant",
  6: "geplant",
};

function startDate(sud: Sud): string {
  if (!sud.braudatum) {
    return sud.erstellt_am;
  }
  return `${sud.braudatum}T08:00:00+02:00`;
}

function plusMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function buildSudschritte(sud: Sud, startId: number): Sudschritt[] {
  const modus = sudModus[sud.id] ?? "geplant";
  const steps = rezeptschritte
    .filter((schritt) => schritt.rezeptversion_id === sud.rezeptversion_id)
    .sort((a, b) => a.position - b.position);
  let cursor = 0;

  return steps.map((schritt, index) => {
    const dauer = schritt.dauer_min ?? 60;
    const start = plusMinutes(startDate(sud), cursor);
    cursor += dauer + 15;

    const base: Sudschritt = {
      id: startId + index,
      sud_id: sud.id,
      position: schritt.position,
      typ: schritt.typ,
      name: schritt.name,
      gestartet_am: null,
      beendet_am: null,
      ziel_temperatur_c: schritt.temperatur_c,
      ist_temperatur_c: null,
      ziel_dauer_min: schritt.dauer_min,
      ist_dauer_min: null,
      ziel_wassermenge_l: schritt.wassermenge_l,
      ist_wassermenge_l: null,
      anweisung: schritt.anweisung,
      notizen: null,
    };

    if (modus === "geplant") {
      return base;
    }

    if (modus === "verworfen") {
      if (index >= 2) {
        return base;
      }
      return {
        ...base,
        gestartet_am: start,
        beendet_am: plusMinutes(start, dauer),
        ist_temperatur_c: schritt.temperatur_c,
        ist_dauer_min: schritt.dauer_min,
        ist_wassermenge_l: schritt.wassermenge_l,
      };
    }

    if (modus === "in_arbeit") {
      if (index < 4) {
        return {
          ...base,
          gestartet_am: start,
          beendet_am: plusMinutes(start, dauer),
          ist_temperatur_c: schritt.temperatur_c === null ? null : schritt.temperatur_c + 0.4,
          ist_dauer_min: schritt.dauer_min,
          ist_wassermenge_l: schritt.wassermenge_l,
        };
      }
      if (index === 4) {
        return {
          ...base,
          gestartet_am: start,
          ist_temperatur_c: schritt.temperatur_c === null ? null : schritt.temperatur_c + 0.3,
          notizen: "Gärung läuft, Endmessung steht noch aus.",
        };
      }
      return base;
    }

    return {
      ...base,
      gestartet_am: start,
      beendet_am: plusMinutes(start, dauer),
      ist_temperatur_c: schritt.temperatur_c === null ? null : schritt.temperatur_c + 0.2,
      ist_dauer_min: schritt.dauer_min,
      ist_wassermenge_l: schritt.wassermenge_l,
    };
  });
}

function buildSudzutaten(sud: Sud, startId: number): Sudzutat[] {
  const modus = sudModus[sud.id] ?? "geplant";
  const zutaten = rezeptzutaten.filter((zutat) => zutat.rezeptversion_id === sud.rezeptversion_id);
  const rezeptSteps = rezeptschritte
    .filter((schritt) => schritt.rezeptversion_id === sud.rezeptversion_id)
    .sort((a, b) => a.position - b.position);
  const sudStepStart = 1 + (sud.id - 1) * 100;
  const useActual = modus === "abgeschlossen" || modus === "in_arbeit";

  return zutaten.map((zutat, index) => {
    const stepIndex = zutat.rezeptschritt_id
      ? rezeptSteps.findIndex((schritt) => schritt.id === zutat.rezeptschritt_id)
      : -1;
    return {
      id: startId + index,
      sud_id: sud.id,
      rohstoff_id: zutat.rohstoff_id,
      sudschritt_id: stepIndex >= 0 ? sudStepStart + stepIndex : null,
      rohstoffname_snapshot: zutat.rohstoffname_snapshot,
      einheit_snapshot: zutat.einheit_snapshot,
      geplante_menge: zutat.menge,
      ist_menge: useActual ? zutat.menge : null,
      alphasaeure_prozent: zutat.alphasaeure_prozent,
      ebc: zutat.ebc,
      ziel_zugabe_nach_min: zutat.zugabe_nach_min,
      ist_zugabe_nach_min: useActual ? zutat.zugabe_nach_min : null,
      notizen: zutat.notizen,
    };
  });
}

const s4Zutaten = [
  {
    id: 1,
    sud_id: 4,
    rohstoff_id: 1,
    sudschritt_id: 301,
    rohstoffname_snapshot: "Pilsner Malz",
    einheit_snapshot: "g",
    geplante_menge: 4200,
    ist_menge: 4200,
    alphasaeure_prozent: null,
    ebc: 3.5,
    ziel_zugabe_nach_min: null,
    ist_zugabe_nach_min: null,
    notizen: null,
  },
  {
    id: 2,
    sud_id: 4,
    rohstoff_id: 2,
    sudschritt_id: 301,
    rohstoffname_snapshot: "Münchner Malz",
    einheit_snapshot: "g",
    geplante_menge: 800,
    ist_menge: 800,
    alphasaeure_prozent: null,
    ebc: 15,
    ziel_zugabe_nach_min: null,
    ist_zugabe_nach_min: null,
    notizen: null,
  },
  {
    id: 3,
    sud_id: 4,
    rohstoff_id: 4,
    sudschritt_id: 304,
    rohstoffname_snapshot: "Hallertauer Tradition",
    einheit_snapshot: "g",
    geplante_menge: 30,
    ist_menge: 30,
    alphasaeure_prozent: 5.2,
    ebc: null,
    ziel_zugabe_nach_min: 0,
    ist_zugabe_nach_min: 0,
    notizen: "Vorderwürzehopfung zu Beginn des Kochens.",
  },
  {
    id: 4,
    sud_id: 4,
    rohstoff_id: 4,
    sudschritt_id: 304,
    rohstoffname_snapshot: "Hallertauer Tradition",
    einheit_snapshot: "g",
    geplante_menge: 15,
    ist_menge: 15,
    alphasaeure_prozent: 5.2,
    ebc: null,
    ziel_zugabe_nach_min: 50,
    ist_zugabe_nach_min: 50,
    notizen: "Aromagabe 10 Minuten vor Kochende.",
  },
  {
    id: 5,
    sud_id: 4,
    rohstoff_id: 6,
    sudschritt_id: 305,
    rohstoffname_snapshot: "SafAle US-05",
    einheit_snapshot: "g",
    geplante_menge: 11,
    ist_menge: 11,
    alphasaeure_prozent: null,
    ebc: null,
    ziel_zugabe_nach_min: null,
    ist_zugabe_nach_min: null,
    notizen: "Trockenhefe, direkt anstellen.",
  },
  {
    id: 6,
    sud_id: 4,
    rohstoff_id: 9,
    sudschritt_id: 306,
    rohstoffname_snapshot: "Klärungsmittel",
    einheit_snapshot: "ml",
    geplante_menge: 5,
    ist_menge: 5,
    alphasaeure_prozent: null,
    ebc: null,
    ziel_zugabe_nach_min: null,
    ist_zugabe_nach_min: null,
    notizen: "Direktzugabe ohne Lagerbewegung.",
  },
] satisfies Sudzutat[];

export const s4ZutatIds = {
  pilsner: 1,
  muenchner: 2,
  hallertauer60: 3,
  hallertauer10: 4,
  us05: 5,
  klaerungsmittel: 6,
} as const;

export const sudzutaten = [
  ...s4Zutaten,
  ...buildSudzutaten(sude[0], 101),
  ...buildSudzutaten(sude[1], 201),
  ...buildSudzutaten(sude[2], 301),
  ...buildSudzutaten(sude[4], 501),
  ...buildSudzutaten(sude[5], 601),
];

export const sudschritte = sude.flatMap((sud, index) => buildSudschritte(sud, 1 + index * 100));

export const sudgeraete = [
  {
    id: 1,
    sud_id: 1,
    geraet_id: 1,
    geraetename_snapshot: "50-Liter-Sudkessel",
    zugewiesene_menge: 1,
    lob_genutzt: false,
    lob_menge_l_snapshot: null,
    notizen: null,
  },
  {
    id: 2,
    sud_id: 1,
    geraet_id: 2,
    geraetename_snapshot: "30-Liter-Gärtank",
    zugewiesene_menge: 1,
    lob_genutzt: false,
    lob_menge_l_snapshot: null,
    notizen: null,
  },
  {
    id: 3,
    sud_id: 1,
    geraet_id: 3,
    geraetename_snapshot: "20-Liter-Keg",
    zugewiesene_menge: 2,
    lob_genutzt: true,
    lob_menge_l_snapshot: 20,
    notizen: "Zwei Kegs für die Abfüllung.",
  },
  {
    id: 4,
    sud_id: 2,
    geraet_id: 1,
    geraetename_snapshot: "50-Liter-Sudkessel",
    zugewiesene_menge: 1,
    lob_genutzt: false,
    lob_menge_l_snapshot: null,
    notizen: null,
  },
  {
    id: 5,
    sud_id: 2,
    geraet_id: 2,
    geraetename_snapshot: "30-Liter-Gärtank",
    zugewiesene_menge: 1,
    lob_genutzt: false,
    lob_menge_l_snapshot: null,
    notizen: null,
  },
  {
    id: 6,
    sud_id: 2,
    geraet_id: 3,
    geraetename_snapshot: "20-Liter-Keg",
    zugewiesene_menge: 1,
    lob_genutzt: true,
    lob_menge_l_snapshot: 20,
    notizen: null,
  },
  {
    id: 7,
    sud_id: 4,
    geraet_id: 1,
    geraetename_snapshot: "50-Liter-Sudkessel",
    zugewiesene_menge: 1,
    lob_genutzt: false,
    lob_menge_l_snapshot: null,
    notizen: null,
  },
  {
    id: 8,
    sud_id: 4,
    geraet_id: 2,
    geraetename_snapshot: "30-Liter-Gärtank",
    zugewiesene_menge: 1,
    lob_genutzt: false,
    lob_menge_l_snapshot: null,
    notizen: null,
  },
  {
    id: 9,
    sud_id: 5,
    geraet_id: 1,
    geraetename_snapshot: "50-Liter-Sudkessel",
    zugewiesene_menge: 1,
    lob_genutzt: false,
    lob_menge_l_snapshot: null,
    notizen: "Für den geplanten Brautermin reserviert.",
  },
] satisfies Sudgeraet[];

export function getRezeptversionFuerSud(sud: Sud) {
  return rezeptversionen.find((version) => version.id === sud.rezeptversion_id);
}
