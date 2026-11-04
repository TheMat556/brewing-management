import { type Geraet, geraete } from "./geraete";
import { type Lagerbewegung, type Lagercharge, lagerbewegungen, lagerchargen } from "./lager";
import {
  type Rezept,
  type Rezeptschritt,
  type Rezeptversion,
  type Rezeptzutat,
  rezepte,
  rezeptschritte,
  rezeptversionen,
  rezeptzutaten,
} from "./rezepte";
import { type Rohstoff, rohstoffe } from "./rohstoffe";
import {
  type Sud,
  type Sudgeraet,
  type Sudschritt,
  type Sudzutat,
  sude,
  sudgeraete,
  sudschritte,
  sudzutaten,
} from "./sude";
import { aktuellerBenutzer, demoBenutzer } from "./zugang";

export * from "./geraete";
export * from "./lager";
export * from "./rezepte";
export * from "./rohstoffe";
export * from "./sude";
export * from "./zugang";

export const demoToday = "2026-11-04";

export function getRohstoff(id: number): Rohstoff | undefined {
  return rohstoffe.find((rohstoff) => rohstoff.id === id);
}

export function getLagercharge(id: number): Lagercharge | undefined {
  return lagerchargen.find((charge) => charge.id === id);
}

export function getBewegungenFuerCharge(chargeId: number): Lagerbewegung[] {
  return lagerbewegungen
    .filter((bewegung) => bewegung.lagercharge_id === chargeId)
    .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt));
}

export function getBestandCharge(chargeId: number): number {
  return lagerbewegungen
    .filter((bewegung) => bewegung.lagercharge_id === chargeId)
    .reduce((summe, bewegung) => summe + bewegung.mengen_delta, 0);
}

export function getBestandRohstoff(rohstoffId: number): number {
  return lagerchargen
    .filter((charge) => charge.rohstoff_id === rohstoffId)
    .reduce((summe, charge) => summe + getBestandCharge(charge.id), 0);
}

export function getChargenFuerRohstoff(rohstoffId: number): Lagercharge[] {
  return lagerchargen
    .filter((charge) => charge.rohstoff_id === rohstoffId)
    .sort((a, b) => b.lieferdatum.localeCompare(a.lieferdatum));
}

export type BewegungDetails = {
  bewegung: Lagerbewegung;
  charge: Lagercharge;
  rohstoff: Rohstoff;
  sud?: Sud;
};

export function getBewegungDetails(bewegung: Lagerbewegung): BewegungDetails | null {
  const charge = getLagercharge(bewegung.lagercharge_id);
  const rohstoff = charge ? getRohstoff(charge.rohstoff_id) : undefined;
  if (!charge || !rohstoff) {
    return null;
  }
  const zutat = bewegung.sudzutat_id
    ? sudzutaten.find((item) => item.id === bewegung.sudzutat_id)
    : undefined;
  const sud = zutat ? sude.find((item) => item.id === zutat.sud_id) : undefined;
  return { bewegung, charge, rohstoff, sud };
}

export function getRezept(id: number): Rezept | undefined {
  return rezepte.find((rezept) => rezept.id === id);
}

export function getVersion(id: number): Rezeptversion | undefined {
  return rezeptversionen.find((version) => version.id === id);
}

export function getVersionenFuerRezept(rezeptId: number): Rezeptversion[] {
  return rezeptversionen
    .filter((version) => version.rezept_id === rezeptId)
    .sort((a, b) => b.versionsnummer - a.versionsnummer);
}

export function getAktuelleVersion(rezeptId: number): Rezeptversion | undefined {
  return getVersionenFuerRezept(rezeptId)[0];
}

export function getRezeptFuerVersion(versionId: number): Rezept | undefined {
  const version = getVersion(versionId);
  return version ? getRezept(version.rezept_id) : undefined;
}

export function getZutatenFuerVersion(versionId: number): Rezeptzutat[] {
  return rezeptzutaten
    .filter((zutat) => zutat.rezeptversion_id === versionId)
    .sort((a, b) => a.id - b.id);
}

export function getSchritteFuerVersion(versionId: number): Rezeptschritt[] {
  return rezeptschritte
    .filter((schritt) => schritt.rezeptversion_id === versionId)
    .sort((a, b) => a.position - b.position);
}

export function getSud(id: number): Sud | undefined {
  return sude.find((sud) => sud.id === id);
}

export function getVersionFuerSud(sud: Sud): Rezeptversion | undefined {
  return getVersion(sud.rezeptversion_id);
}

export function getSudZutaten(sudId: number): Sudzutat[] {
  return sudzutaten.filter((zutat) => zutat.sud_id === sudId).sort((a, b) => a.id - b.id);
}

export function getSudSchritte(sudId: number): Sudschritt[] {
  return sudschritte
    .filter((schritt) => schritt.sud_id === sudId)
    .sort((a, b) => a.position - b.position);
}

export function getSudGeraete(sudId: number): Sudgeraet[] {
  return sudgeraete.filter((eintrag) => eintrag.sud_id === sudId).sort((a, b) => a.id - b.id);
}

export function getBewegungenFuerSud(sudId: number): Lagerbewegung[] {
  const zutatIds = new Set(getSudZutaten(sudId).map((zutat) => zutat.id));
  return lagerbewegungen
    .filter((bewegung) => bewegung.sudzutat_id && zutatIds.has(bewegung.sudzutat_id))
    .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt));
}

export function getGeraet(id: number): Geraet | undefined {
  return geraete.find((geraet) => geraet.id === id);
}

export type GeraetHistorie = {
  eintrag: Sudgeraet;
  sud: Sud;
};

export function getGeraetHistorie(geraetId: number): GeraetHistorie[] {
  const historie: GeraetHistorie[] = [];
  for (const eintrag of sudgeraete) {
    if (eintrag.geraet_id !== geraetId) {
      continue;
    }
    const sud = getSud(eintrag.sud_id);
    if (sud) {
      historie.push({ eintrag, sud });
    }
  }
  return historie.sort((a, b) => (b.sud.braudatum ?? "").localeCompare(a.sud.braudatum ?? ""));
}

export function getOffeneSude(): Sud[] {
  return sude.filter((sud) => sud.status === "GEPLANT" || sud.status === "IN_ARBEIT");
}

export function getFreigegebeneRezepte(): Rezept[] {
  return rezepte.filter(
    (rezept) =>
      !rezept.archiviert &&
      rezeptversionen.some(
        (version) => version.rezept_id === rezept.id && version.status === "FREIGEGEBEN",
      ),
  );
}

export function getBaldAblaufendeChargen(): Lagercharge[] {
  return lagerchargen
    .filter((charge) => {
      if (!charge.mhd || getBestandCharge(charge.id) <= 0) {
        return false;
      }
      const tage = tageBis(charge.mhd);
      return tage <= 90;
    })
    .sort((a, b) => (a.mhd ?? "").localeCompare(b.mhd ?? ""));
}

export function tageBis(datum: string): number {
  const heute = new Date(`${demoToday}T00:00:00Z`).getTime();
  const ziel = new Date(`${datum}T00:00:00Z`).getTime();
  return Math.ceil((ziel - heute) / 86_400_000);
}

export {
  aktuellerBenutzer,
  demoBenutzer,
  geraete,
  lagerbewegungen,
  lagerchargen,
  rezepte,
  rezeptschritte,
  rezeptversionen,
  rezeptzutaten,
  rohstoffe,
  sude,
  sudgeraete,
  sudschritte,
  sudzutaten,
};
