import type { Database } from "@/lib/database.types";

type Basiseinheit = Database["public"]["Enums"]["basiseinheit"];
type LagerbewegungTyp = Database["public"]["Enums"]["lagerbewegung_typ"];
type ProzessschrittTyp = Database["public"]["Enums"]["prozessschritt_typ"];
type RezeptversionStatus = Database["public"]["Enums"]["rezeptversion_status"];
type RohstoffKategorie = Database["public"]["Enums"]["rohstoff_kategorie"];
type SudStatus = Database["public"]["Enums"]["sud_status"];

export const basiseinheitLabels: Record<Basiseinheit, string> = {
  g: "g",
  ml: "ml",
  Stueck: "Stk.",
};

export const rohstoffKategorieLabels: Record<RohstoffKategorie, string> = {
  MALZ: "Malz",
  HOPFEN: "Hopfen",
  HEFE: "Hefe",
  GEWUERZ: "Gewürz",
  SONSTIGES: "Sonstiges",
};

export const rezeptversionStatusLabels: Record<RezeptversionStatus, string> = {
  ENTWURF: "Entwurf",
  FREIGEGEBEN: "Freigegeben",
};

export const sudStatusLabels: Record<SudStatus, string> = {
  GEPLANT: "Geplant",
  IN_ARBEIT: "In Arbeit",
  ABGESCHLOSSEN: "Abgeschlossen",
  VERWORFEN: "Verworfen",
};

export const lagerbewegungTypLabels: Record<LagerbewegungTyp, string> = {
  ZUGANG: "Zugang",
  VERBRAUCH: "Verbrauch",
  KORREKTUR: "Korrektur",
  ENTSORGUNG: "Entsorgung",
};

export const prozessschrittTypLabels: Record<ProzessschrittTyp, string> = {
  EINMAISCHEN: "Einmaischen",
  RAST: "Rast",
  NACHGUSS: "Nachguss",
  KOCHEN: "Kochen",
  GAERUNG: "Gärung",
  KALTHOPFUNG: "Kalthopfung",
  REIFUNG: "Reifung",
  ABFUELLUNG: "Abfüllung",
  SONSTIGES: "Sonstiges",
};

export function formatEinheit(einheit: Basiseinheit): string {
  return basiseinheitLabels[einheit];
}
