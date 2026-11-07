import type { Tables } from "@/lib/database.types";

export type Rezept = Tables<"tb_rezept">;
export type Rezeptversion = Tables<"tb_rezeptversion">;
export type Rezeptschritt = Tables<"tb_rezeptschritt">;
export type Rezeptzutat = Tables<"tb_rezeptzutat">;

type StepExtra = Partial<
  Pick<Rezeptschritt, "temperatur_c" | "dauer_min" | "wassermenge_l" | "anweisung">
>;

type IngredientExtra = Partial<
  Pick<Rezeptzutat, "alphasaeure_prozent" | "ebc" | "zugabe_nach_min" | "notizen">
>;

function step(
  id: number,
  versionId: number,
  position: number,
  typ: Rezeptschritt["typ"],
  name: string,
  extra: StepExtra = {},
): Rezeptschritt {
  return {
    id,
    rezeptversion_id: versionId,
    position,
    typ,
    name,
    temperatur_c: null,
    dauer_min: null,
    wassermenge_l: null,
    anweisung: null,
    ...extra,
  };
}

function ingredient(
  id: number,
  versionId: number,
  rohstoffId: number,
  name: string,
  einheit: Rezeptzutat["einheit_snapshot"],
  menge: number,
  rezeptschrittId: number | null,
  extra: IngredientExtra | null = {},
): Rezeptzutat {
  return {
    id,
    rezeptversion_id: versionId,
    rohstoff_id: rohstoffId,
    rezeptschritt_id: rezeptschrittId,
    rohstoffname_snapshot: name,
    einheit_snapshot: einheit,
    menge,
    alphasaeure_prozent: null,
    ebc: null,
    zugabe_nach_min: null,
    notizen: null,
    ...(extra ?? {}),
  };
}

export const rezepte = [
  {
    id: 1,
    name: "Helles 2026",
    beschreibung: "Mildes, süffiges Helles mit feiner Hopfennote.",
    erstellt_am: "2026-05-01T09:00:00+02:00",
    archiviert: false,
  },
  {
    id: 2,
    name: "Weizen",
    beschreibung: "Bananiges Weizen mit weichem Malzkörper.",
    erstellt_am: "2026-05-15T09:00:00+02:00",
    archiviert: false,
  },
  {
    id: 3,
    name: "Cascade IPA",
    beschreibung: "Hopfenbetontes IPA mit Cascade-Aroma.",
    erstellt_am: "2026-06-01T09:00:00+02:00",
    archiviert: false,
  },
  {
    id: 4,
    name: "Koriander-Saison",
    beschreibung: "Archiviertes Saison mit Koriander und Hallertauer.",
    erstellt_am: "2025-11-01T09:00:00+01:00",
    archiviert: true,
  },
] satisfies Rezept[];

export const rezeptversionen = [
  {
    id: 1,
    rezept_id: 1,
    versionsnummer: 1,
    name_snapshot: "Helles 2026",
    beschreibung_snapshot: "Mildes, süffiges Helles mit feiner Hopfennote.",
    erstellt_am: "2026-05-01T09:00:00+02:00",
    freigegeben_am: "2026-05-03T10:30:00+02:00",
    status: "FREIGEGEBEN",
    ziel_ausschlagmenge_l: 20,
    ziel_stammwuerze_plato: 12.5,
    ziel_abv_prozent: 5.2,
    ziel_ibu: 22,
    ziel_ebc: 7,
    infos: "Referenzversion für Sud 2026-001 und 2026-004.",
  },
  {
    id: 2,
    rezept_id: 1,
    versionsnummer: 2,
    name_snapshot: "Helles 2026",
    beschreibung_snapshot: "Etwas kräftiger, mit mehr Hallertauer im Whirlpool.",
    erstellt_am: "2026-10-20T09:00:00+02:00",
    freigegeben_am: null,
    status: "ENTWURF",
    ziel_ausschlagmenge_l: 22,
    ziel_stammwuerze_plato: 12.8,
    ziel_abv_prozent: 5.4,
    ziel_ibu: 24,
    ziel_ebc: 7,
    infos: "Entwurf für die nächste Helles-Runde.",
  },
  {
    id: 3,
    rezept_id: 2,
    versionsnummer: 1,
    name_snapshot: "Weizen",
    beschreibung_snapshot: "Bananiges Weizen mit weichem Malzkörper.",
    erstellt_am: "2026-05-15T09:00:00+02:00",
    freigegeben_am: "2026-05-18T11:00:00+02:00",
    status: "FREIGEGEBEN",
    ziel_ausschlagmenge_l: 20,
    ziel_stammwuerze_plato: 12.8,
    ziel_abv_prozent: 5.4,
    ziel_ibu: 14,
    ziel_ebc: 12,
    infos: null,
  },
  {
    id: 4,
    rezept_id: 3,
    versionsnummer: 1,
    name_snapshot: "Cascade IPA",
    beschreibung_snapshot: "Hopfenbetontes IPA mit Cascade-Aroma.",
    erstellt_am: "2026-06-01T09:00:00+02:00",
    freigegeben_am: "2026-06-03T15:00:00+02:00",
    status: "FREIGEGEBEN",
    ziel_ausschlagmenge_l: 20,
    ziel_stammwuerze_plato: 16,
    ziel_abv_prozent: 6.5,
    ziel_ibu: 55,
    ziel_ebc: 15,
    infos: "Kalthopfung mit 80 g Cascade geplant.",
  },
  {
    id: 5,
    rezept_id: 3,
    versionsnummer: 2,
    name_snapshot: "Cascade IPA",
    beschreibung_snapshot: "Noch hopfenbetonter, mit größerer Ausschlagmenge.",
    erstellt_am: "2026-10-25T09:00:00+02:00",
    freigegeben_am: null,
    status: "ENTWURF",
    ziel_ausschlagmenge_l: 22,
    ziel_stammwuerze_plato: 16.5,
    ziel_abv_prozent: 6.7,
    ziel_ibu: 60,
    ziel_ebc: 16,
    infos: "Entwurf, noch nicht freigegeben.",
  },
  {
    id: 6,
    rezept_id: 4,
    versionsnummer: 1,
    name_snapshot: "Koriander-Saison",
    beschreibung_snapshot: "Archiviertes Saison mit Koriander und Hallertauer.",
    erstellt_am: "2025-11-01T09:00:00+01:00",
    freigegeben_am: "2025-11-04T12:00:00+01:00",
    status: "FREIGEGEBEN",
    ziel_ausschlagmenge_l: 18,
    ziel_stammwuerze_plato: 13.2,
    ziel_abv_prozent: 6,
    ziel_ibu: 25,
    ziel_ebc: 10,
    infos: "Nur noch für die Historie sichtbar.",
  },
] satisfies Rezeptversion[];

export const rezeptschritte = [
  step(1, 1, 1, "EINMAISCHEN", "Einmaischen", {
    temperatur_c: 67,
    wassermenge_l: 15,
    anweisung: "Malz in 67 °C warmes Wasser einrühren.",
  }),
  step(2, 1, 2, "RAST", "Maltoserast", {
    temperatur_c: 63,
    dauer_min: 30,
    anweisung: "Temperatur halten, regelmäßig umrühren.",
  }),
  step(3, 1, 3, "RAST", "Verzuckerungsrast", {
    temperatur_c: 72,
    dauer_min: 20,
    anweisung: "Auf 72 °C aufheizen und Jodprobe durchführen.",
  }),
  step(4, 1, 4, "KOCHEN", "Würzekochen", {
    temperatur_c: 100,
    dauer_min: 60,
    anweisung: "30 g Hallertauer Tradition zu Beginn, 15 g 10 Minuten vor Kochende zugeben.",
  }),
  step(5, 1, 5, "GAERUNG", "Hauptgärung", {
    temperatur_c: 18,
    dauer_min: 10080,
    anweisung: "Hefe bei 18 °C anstellen, bis Restextrakt stabil ist.",
  }),
  step(6, 1, 6, "ABFUELLUNG", "Abfüllung", {
    temperatur_c: 20,
    dauer_min: 60,
    anweisung: "Auf Speise oder Zucker karbonisieren und abfüllen.",
  }),

  step(7, 2, 1, "EINMAISCHEN", "Einmaischen", {
    temperatur_c: 67,
    wassermenge_l: 16,
    anweisung: "Malz in 67 °C warmes Wasser einrühren.",
  }),
  step(8, 2, 2, "RAST", "Maltoserast", {
    temperatur_c: 63,
    dauer_min: 35,
    anweisung: "Temperatur halten.",
  }),
  step(9, 2, 3, "RAST", "Verzuckerungsrast", {
    temperatur_c: 72,
    dauer_min: 20,
    anweisung: "Jodprobe durchführen.",
  }),
  step(10, 2, 4, "KOCHEN", "Würzekochen", {
    temperatur_c: 100,
    dauer_min: 60,
    anweisung: "35 g Hallertauer Tradition zu Beginn, 15 g 10 Minuten vor Kochende zugeben.",
  }),
  step(11, 2, 5, "GAERUNG", "Hauptgärung", {
    temperatur_c: 18,
    dauer_min: 10080,
    anweisung: "Hefe bei 18 °C anstellen.",
  }),
  step(12, 2, 6, "ABFUELLUNG", "Abfüllung", {
    temperatur_c: 20,
    dauer_min: 60,
    anweisung: "Karbonisieren und abfüllen.",
  }),

  step(13, 3, 1, "EINMAISCHEN", "Einmaischen", {
    temperatur_c: 68,
    wassermenge_l: 15,
    anweisung: "Weizen- und Pilsner Malz einrühren.",
  }),
  step(14, 3, 2, "RAST", "Maltoserast", {
    temperatur_c: 63,
    dauer_min: 30,
    anweisung: null,
  }),
  step(15, 3, 3, "RAST", "Verzuckerungsrast", {
    temperatur_c: 72,
    dauer_min: 20,
    anweisung: null,
  }),
  step(16, 3, 4, "KOCHEN", "Würzekochen", {
    temperatur_c: 100,
    dauer_min: 60,
    anweisung: "15 g Hallertauer Tradition zu Beginn, 10 g 10 Minuten vor Kochende zugeben.",
  }),
  step(17, 3, 5, "GAERUNG", "Hauptgärung", {
    temperatur_c: 20,
    dauer_min: 10080,
    anweisung: "Bei 20 °C vergären, Hefe regelmäßig aufschwenken.",
  }),
  step(18, 3, 6, "ABFUELLUNG", "Abfüllung", {
    temperatur_c: 20,
    dauer_min: 60,
    anweisung: null,
  }),

  step(19, 4, 1, "EINMAISCHEN", "Einmaischen", {
    temperatur_c: 66,
    wassermenge_l: 18,
    anweisung: null,
  }),
  step(20, 4, 2, "RAST", "Maltoserast", {
    temperatur_c: 63,
    dauer_min: 40,
    anweisung: null,
  }),
  step(21, 4, 3, "RAST", "Verzuckerungsrast", {
    temperatur_c: 72,
    dauer_min: 20,
    anweisung: null,
  }),
  step(22, 4, 4, "KOCHEN", "Würzekochen", {
    temperatur_c: 100,
    dauer_min: 60,
    anweisung: "70 g Cascade zu Beginn, 30 g 10 Minuten und 50 g 5 Minuten vor Kochende zugeben.",
  }),
  step(23, 4, 5, "KALTHOPFUNG", "Kalthopfung", {
    temperatur_c: 18,
    dauer_min: 4320,
    anweisung: "80 g Cascade für drei Tage kalthopfen.",
  }),
  step(24, 4, 6, "GAERUNG", "Hauptgärung", {
    temperatur_c: 19,
    dauer_min: 10080,
    anweisung: null,
  }),
  step(25, 4, 7, "ABFUELLUNG", "Abfüllung", {
    temperatur_c: 20,
    dauer_min: 60,
    anweisung: null,
  }),

  step(26, 5, 1, "EINMAISCHEN", "Einmaischen", {
    temperatur_c: 66,
    wassermenge_l: 20,
    anweisung: null,
  }),
  step(27, 5, 2, "RAST", "Maltoserast", {
    temperatur_c: 63,
    dauer_min: 40,
    anweisung: null,
  }),
  step(28, 5, 3, "RAST", "Verzuckerungsrast", {
    temperatur_c: 72,
    dauer_min: 20,
    anweisung: null,
  }),
  step(29, 5, 4, "KOCHEN", "Würzekochen", {
    temperatur_c: 100,
    dauer_min: 60,
    anweisung: "90 g Cascade zu Beginn, 40 g 10 Minuten und 50 g 5 Minuten vor Kochende zugeben.",
  }),
  step(30, 5, 5, "KALTHOPFUNG", "Kalthopfung", {
    temperatur_c: 18,
    dauer_min: 4320,
    anweisung: "100 g Cascade für drei Tage kalthopfen.",
  }),
  step(31, 5, 6, "GAERUNG", "Hauptgärung", {
    temperatur_c: 19,
    dauer_min: 10080,
    anweisung: null,
  }),
  step(32, 5, 7, "ABFUELLUNG", "Abfüllung", {
    temperatur_c: 20,
    dauer_min: 60,
    anweisung: null,
  }),

  step(33, 6, 1, "EINMAISCHEN", "Einmaischen", {
    temperatur_c: 65,
    wassermenge_l: 14,
    anweisung: null,
  }),
  step(34, 6, 2, "RAST", "Maltoserast", {
    temperatur_c: 63,
    dauer_min: 45,
    anweisung: null,
  }),
  step(35, 6, 3, "RAST", "Verzuckerungsrast", {
    temperatur_c: 72,
    dauer_min: 15,
    anweisung: null,
  }),
  step(36, 6, 4, "KOCHEN", "Würzekochen", {
    temperatur_c: 100,
    dauer_min: 60,
    anweisung:
      "20 g Hallertauer zu Beginn; 20 g Koriander und 10 g Hallertauer 10 Minuten vor Kochende zugeben.",
  }),
  step(37, 6, 5, "GAERUNG", "Hauptgärung", {
    temperatur_c: 22,
    dauer_min: 10080,
    anweisung: null,
  }),
  step(38, 6, 6, "ABFUELLUNG", "Abfüllung", {
    temperatur_c: 20,
    dauer_min: 60,
    anweisung: null,
  }),
] satisfies Rezeptschritt[];

export const rezeptzutaten = [
  ingredient(1, 1, 1, "Pilsner Malz", "g", 4200, 1, { ebc: 3.5 }),
  ingredient(2, 1, 2, "Münchner Malz", "g", 800, 1, { ebc: 15 }),
  ingredient(3, 1, 4, "Hallertauer Tradition", "g", 30, 4, {
    alphasaeure_prozent: 5.2,
    zugabe_nach_min: 0,
    notizen: "Vorderwürzehopfung zu Beginn des Kochens.",
  }),
  ingredient(4, 1, 4, "Hallertauer Tradition", "g", 15, 4, {
    alphasaeure_prozent: 5.2,
    zugabe_nach_min: 50,
    notizen: "Aromagabe 10 Minuten vor Kochende.",
  }),
  ingredient(5, 1, 6, "SafAle US-05", "g", 11, 5, {
    notizen: "Trockenhefe, direkt anstellen.",
  }),

  ingredient(6, 2, 1, "Pilsner Malz", "g", 4500, 7, { ebc: 3.5 }),
  ingredient(7, 2, 2, "Münchner Malz", "g", 900, 7, { ebc: 15 }),
  ingredient(8, 2, 4, "Hallertauer Tradition", "g", 35, 10, {
    alphasaeure_prozent: 5.2,
    zugabe_nach_min: 0,
    notizen: "Vorderwürzehopfung zu Beginn des Kochens.",
  }),
  ingredient(9, 2, 4, "Hallertauer Tradition", "g", 15, 10, {
    alphasaeure_prozent: 5.2,
    zugabe_nach_min: 50,
    notizen: "Aromagabe 10 Minuten vor Kochende.",
  }),
  ingredient(10, 2, 6, "SafAle US-05", "g", 11, 11, null),

  ingredient(11, 3, 3, "Weizenmalz hell", "g", 3000, 13, { ebc: 12 }),
  ingredient(12, 3, 1, "Pilsner Malz", "g", 2000, 13, { ebc: 3.5 }),
  ingredient(13, 3, 4, "Hallertauer Tradition", "g", 15, 16, {
    alphasaeure_prozent: 5.2,
    zugabe_nach_min: 0,
    notizen: "Vorderwürzehopfung zu Beginn des Kochens.",
  }),
  ingredient(14, 3, 4, "Hallertauer Tradition", "g", 10, 16, {
    alphasaeure_prozent: 5.2,
    zugabe_nach_min: 50,
    notizen: "Aromagabe 10 Minuten vor Kochende.",
  }),
  ingredient(15, 3, 7, "SafAle WB-06", "g", 11, 17, null),

  ingredient(16, 4, 1, "Pilsner Malz", "g", 5500, 19, { ebc: 3.5 }),
  ingredient(17, 4, 5, "Cascade", "g", 70, 22, {
    alphasaeure_prozent: 6.8,
    zugabe_nach_min: 0,
    notizen: "Bitterhopfung zu Beginn des Kochens.",
  }),
  ingredient(18, 4, 5, "Cascade", "g", 30, 22, {
    alphasaeure_prozent: 6.8,
    zugabe_nach_min: 50,
    notizen: "Aromagabe 10 Minuten vor Kochende.",
  }),
  ingredient(19, 4, 5, "Cascade", "g", 50, 22, {
    alphasaeure_prozent: 6.8,
    zugabe_nach_min: 55,
    notizen: "Whirlpool-Gabe 5 Minuten vor Kochende.",
  }),
  ingredient(20, 4, 6, "SafAle US-05", "g", 11, 24, null),
  ingredient(21, 4, 5, "Cascade", "g", 80, 23, {
    alphasaeure_prozent: 6.8,
    zugabe_nach_min: 0,
    notizen: "Kalthopfung zu Beginn der Kalthopfung.",
  }),

  ingredient(22, 5, 1, "Pilsner Malz", "g", 6000, 26, { ebc: 3.5 }),
  ingredient(23, 5, 5, "Cascade", "g", 90, 29, {
    alphasaeure_prozent: 6.8,
    zugabe_nach_min: 0,
    notizen: "Bitterhopfung zu Beginn des Kochens.",
  }),
  ingredient(24, 5, 5, "Cascade", "g", 40, 29, {
    alphasaeure_prozent: 6.8,
    zugabe_nach_min: 50,
    notizen: "Aromagabe 10 Minuten vor Kochende.",
  }),
  ingredient(25, 5, 5, "Cascade", "g", 50, 29, {
    alphasaeure_prozent: 6.8,
    zugabe_nach_min: 55,
    notizen: "Whirlpool-Gabe 5 Minuten vor Kochende.",
  }),
  ingredient(26, 5, 6, "SafAle US-05", "g", 11, 31, null),
  ingredient(27, 5, 5, "Cascade", "g", 100, 30, {
    alphasaeure_prozent: 6.8,
    zugabe_nach_min: 0,
    notizen: "Kalthopfung zu Beginn der Kalthopfung.",
  }),

  ingredient(28, 6, 1, "Pilsner Malz", "g", 3500, 33, { ebc: 3.5 }),
  ingredient(29, 6, 3, "Weizenmalz hell", "g", 1500, 33, { ebc: 12 }),
  ingredient(30, 6, 8, "Koriandersamen", "g", 20, 36, {
    zugabe_nach_min: 50,
    notizen: "Gewürzgabe 10 Minuten vor Kochende.",
  }),
  ingredient(31, 6, 4, "Hallertauer Tradition", "g", 20, 36, {
    alphasaeure_prozent: 5.2,
    zugabe_nach_min: 0,
    notizen: "Bitterhopfung zu Beginn des Kochens.",
  }),
  ingredient(32, 6, 4, "Hallertauer Tradition", "g", 10, 36, {
    alphasaeure_prozent: 5.2,
    zugabe_nach_min: 50,
    notizen: "Aromagabe 10 Minuten vor Kochende.",
  }),
  ingredient(33, 6, 7, "SafAle WB-06", "g", 11, 37, null),
] satisfies Rezeptzutat[];
