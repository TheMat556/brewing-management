import { ArrowLeft, ClipboardCheck, PackageMinus, Repeat2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoilSchedule } from "@/components/brewing/boil-schedule";
import { PageHeader } from "@/components/brewing/page-header";
import { BewegungTypBadge, SudStatusBadge } from "@/components/brewing/status-badge";
import { TargetActual } from "@/components/brewing/target-actual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getBewegungDetails,
  getBewegungenFuerSud,
  getRezeptFuerVersion,
  getSud,
  getSudGeraete,
  getSudSchritte,
  getSudZutaten,
  getVersionFuerSud,
  lagerbewegungen,
  sude,
} from "@/lib/demo";
import {
  formatDate,
  formatDateTime,
  formatLiters,
  formatMinutes,
  formatNumber,
  formatPercent,
  formatPlato,
  formatQuantity,
  formatSignedNumber,
} from "@/lib/format";
import { basiseinheitLabels, prozessschrittTypLabels } from "@/lib/labels";

export const instant = false;

export function generateStaticParams() {
  return sude.map((sud) => ({ id: String(sud.id) }));
}

function zugabeLabel(
  zutat: { ziel_zugabe_nach_min: number | null },
  schritt?: { typ: string; ziel_dauer_min: number | null },
): string {
  if (zutat.ziel_zugabe_nach_min === null) {
    return "—";
  }
  if (schritt?.typ === "KOCHEN" && schritt.ziel_dauer_min !== null) {
    const vorKochende = schritt.ziel_dauer_min - zutat.ziel_zugabe_nach_min;
    if (vorKochende > 0) {
      return `T-${formatNumber(vorKochende)} Min.`;
    }
    if (vorKochende === 0) {
      return "Kochende";
    }
    return `T+${formatNumber(Math.abs(vorKochende))} Min.`;
  }
  if (zutat.ziel_zugabe_nach_min === 0) {
    return "zu Beginn";
  }
  return `+${formatMinutes(zutat.ziel_zugabe_nach_min)}`;
}

export default async function SudPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sud = getSud(Number(id));
  if (!sud) {
    notFound();
  }
  const version = getVersionFuerSud(sud);
  const rezept = version ? getRezeptFuerVersion(version.id) : undefined;
  const zutaten = getSudZutaten(sud.id);
  const schritte = getSudSchritte(sud.id);
  const kochschritt = schritte.find((schritt) => schritt.typ === "KOCHEN");
  const kochzutaten = kochschritt
    ? zutaten.filter((zutat) => zutat.sudschritt_id === kochschritt.id)
    : [];
  const geraete = getSudGeraete(sud.id);
  const bewegungen = getBewegungenFuerSud(sud.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${sud.sudnummer} · ${sud.name}`}
        description={
          rezept && version
            ? `Kopie von ${rezept.name}, Version ${version.versionsnummer}. Die Rezeptversion dient nur als Herkunftsnachweis.`
            : "Sud ohne gefundene Rezeptversion."
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/sude">
                <ArrowLeft />
                Zurück
              </Link>
            </Button>
            <Button disabled title="Im Demo-Modus nicht verfügbar">
              <ClipboardCheck />
              Ist-Werte erfassen
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SudStatusBadge status={sud.status} />
        <Badge variant="outline">Braudatum {formatDate(sud.braudatum)}</Badge>
        {version ? <Badge variant="outline">Rezeptversion v{version.versionsnummer}</Badge> : null}
        <span className="text-sm text-muted-foreground">
          Angelegt am {formatDateTime(sud.erstellt_am)}
        </span>
      </div>

      <Tabs defaultValue="uebersicht" className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
          <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
          <TabsTrigger value="schritte">Schritte</TabsTrigger>
          <TabsTrigger value="zutaten">Zutaten</TabsTrigger>
          <TabsTrigger value="geraete">Geräte</TabsTrigger>
          <TabsTrigger value="bewegungen">Bewegungen</TabsTrigger>
        </TabsList>

        <TabsContent value="uebersicht" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <TargetActual
              label="Ausschlagmenge"
              target={formatLiters(sud.ziel_ausschlagmenge_l)}
              actual={formatLiters(sud.ist_ausschlagmenge_l)}
            />
            <TargetActual
              label="Stammwürze"
              target={formatPlato(sud.ziel_stammwuerze_plato)}
              actual={formatPlato(sud.ist_stammwuerze_plato)}
            />
            <TargetActual
              label="Alkohol (ABV)"
              target={formatPercent(sud.ziel_abv_prozent)}
              actual={formatPercent(sud.ist_abv_prozent)}
            />
            <TargetActual
              label="Bittere (IBU)"
              target={sud.ziel_ibu === null ? "—" : `${formatNumber(sud.ziel_ibu)} IBU`}
              actual={sud.ist_ibu === null ? "—" : `${formatNumber(sud.ist_ibu)} IBU`}
            />
            <TargetActual
              label="Farbe (EBC)"
              target={sud.ziel_ebc === null ? "—" : `${formatNumber(sud.ziel_ebc)} EBC`}
              actual={sud.ist_ebc === null ? "—" : `${formatNumber(sud.ist_ebc)} EBC`}
            />
            <TargetActual
              label="Abgefüllte Menge"
              target="—"
              actual={formatLiters(sud.abgefuellte_menge_l)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Informationen</CardTitle>
                <CardDescription>Freitext und Hinweise zum Sud.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {sud.infos ?? "Keine Informationen hinterlegt."}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Herkunft</CardTitle>
                <CardDescription>Provenienz, keine Live-Verknüpfung.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Rezept</span>
                  <span className="font-medium">{rezept?.name ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">
                    {version ? `v${version.versionsnummer}` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Sudnummer</span>
                  <span className="font-medium tabular-nums">{sud.sudnummer}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schritte" className="space-y-4">
          <BoilSchedule
            dauerMin={kochschritt?.ziel_dauer_min ?? null}
            showActual
            additions={kochzutaten.map((zutat) => ({
              id: zutat.id,
              name: zutat.rohstoffname_snapshot,
              menge: zutat.geplante_menge,
              einheit: basiseinheitLabels[zutat.einheit_snapshot],
              alphasaeureProzent: zutat.alphasaeure_prozent,
              zugabeNachStartMin: zutat.ziel_zugabe_nach_min,
              istMenge: zutat.ist_menge,
              notizen: zutat.notizen,
            }))}
          />
          <Card>
            <CardHeader>
              <CardTitle>Prozessschritte</CardTitle>
              <CardDescription>
                Zielwerte wurden aus der Rezeptversion kopiert; Ist-Werte und Zeitstempel gehören
                nur zu diesem Sud.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full min-w-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pos.</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Temperatur</TableHead>
                      <TableHead className="text-right">Dauer</TableHead>
                      <TableHead className="hidden lg:table-cell">Start / Ende</TableHead>
                      <TableHead className="hidden xl:table-cell">Notiz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schritte.map((schritt) => (
                      <TableRow key={schritt.id}>
                        <TableCell className="tabular-nums">{schritt.position}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{prozessschrittTypLabels[schritt.typ]}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{schritt.name}</div>
                          {schritt.anweisung ? (
                            <div className="max-w-72 whitespace-normal text-xs text-muted-foreground">
                              {schritt.anweisung}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums">
                          <div className="font-medium">
                            {schritt.ist_temperatur_c === null
                              ? "—"
                              : `${formatNumber(schritt.ist_temperatur_c)} °C`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Ziel{" "}
                            {schritt.ziel_temperatur_c === null
                              ? "—"
                              : `${formatNumber(schritt.ziel_temperatur_c)} °C`}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums">
                          <div className="font-medium">{formatMinutes(schritt.ist_dauer_min)}</div>
                          <div className="text-xs text-muted-foreground">
                            Ziel {formatMinutes(schritt.ziel_dauer_min)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap text-xs text-muted-foreground lg:table-cell">
                          <div>{formatDateTime(schritt.gestartet_am)}</div>
                          <div>{formatDateTime(schritt.beendet_am)}</div>
                        </TableCell>
                        <TableCell className="hidden max-w-56 whitespace-normal text-muted-foreground xl:table-cell">
                          {schritt.notizen ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zutaten">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Zutaten</CardTitle>
                <CardDescription>
                  Geplante und tatsächliche Mengen. Lagerbewegungen werden separat pro Charge
                  erfasst.
                </CardDescription>
              </div>
              <Button disabled variant="outline" title="Im Demo-Modus nicht verfügbar">
                <Repeat2 />
                Zutat ersetzen
              </Button>
            </CardHeader>
            <CardContent>
              <div className="w-full min-w-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rohstoff</TableHead>
                      <TableHead className="text-right">Geplant</TableHead>
                      <TableHead className="text-right">Ist</TableHead>
                      <TableHead className="hidden sm:table-cell">Alpha / EBC</TableHead>
                      <TableHead className="hidden text-right md:table-cell">Zugabe</TableHead>
                      <TableHead className="hidden lg:table-cell">Lagerbewegungen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zutaten.map((zutat) => {
                      const einheit = basiseinheitLabels[zutat.einheit_snapshot];
                      const schritt = schritte.find((item) => item.id === zutat.sudschritt_id);
                      const zugehoerigeBewegungen = lagerbewegungen.filter(
                        (bewegung) => bewegung.sudzutat_id === zutat.id,
                      );
                      return (
                        <TableRow key={zutat.id}>
                          <TableCell>
                            <div className="font-medium">{zutat.rohstoffname_snapshot}</div>
                            {zutat.notizen ? (
                              <div className="text-xs text-muted-foreground">{zutat.notizen}</div>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatQuantity(zutat.geplante_menge, einheit)}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
                            {formatQuantity(zutat.ist_menge, einheit)}
                          </TableCell>
                          <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                            {zutat.alphasaeure_prozent !== null
                              ? formatPercent(zutat.alphasaeure_prozent)
                              : zutat.ebc !== null
                                ? `EBC ${formatNumber(zutat.ebc)}`
                                : "—"}
                          </TableCell>
                          <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                            {zugabeLabel(zutat, schritt)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {zugehoerigeBewegungen.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Keine Bewegung</span>
                            ) : (
                              <div className="space-y-1 text-xs">
                                {zugehoerigeBewegungen.map((bewegung) => {
                                  const details = getBewegungDetails(bewegung);
                                  return (
                                    <div key={bewegung.id}>
                                      <Link
                                        href={`/lager/chargen/${bewegung.lagercharge_id}`}
                                        className="font-medium hover:underline"
                                      >
                                        {details?.charge.lieferanten_chargennummer ??
                                          `Charge ${bewegung.lagercharge_id}`}
                                      </Link>{" "}
                                      <span className="text-muted-foreground">
                                        {formatSignedNumber(bewegung.mengen_delta)} {einheit}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geraete">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Geräte</CardTitle>
                <CardDescription>
                  Zugewiesene Gerätegruppen mit Mengen- und LOB-Snapshots.
                </CardDescription>
              </div>
              <Button disabled variant="outline" title="Im Demo-Modus nicht verfügbar">
                <PackageMinus />
                Gerät zuweisen
              </Button>
            </CardHeader>
            <CardContent>
              <div className="w-full min-w-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gerät</TableHead>
                      <TableHead className="text-right">Menge</TableHead>
                      <TableHead>LOB genutzt</TableHead>
                      <TableHead className="hidden text-right sm:table-cell">
                        LOB-Menge / Stück
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">Notiz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {geraete.map((eintrag) => (
                      <TableRow key={eintrag.id}>
                        <TableCell className="font-medium">
                          {eintrag.geraetename_snapshot}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {eintrag.zugewiesene_menge}
                        </TableCell>
                        <TableCell>
                          {eintrag.lob_genutzt ? (
                            <Badge variant="outline">Ja</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Nein</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums sm:table-cell">
                          {formatLiters(eintrag.lob_menge_l_snapshot)}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {eintrag.notizen ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bewegungen">
          <Card>
            <CardHeader>
              <CardTitle>Verknüpfte Lagerbewegungen</CardTitle>
              <CardDescription>
                Nur Verbrauch und Korrekturen dieses Suds. Zugänge und Entsorgungen bleiben
                unverknüpft.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bewegungen.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Für diesen Sud sind noch keine Lagerbewegungen erfasst.
                </p>
              ) : (
                <div className="w-full min-w-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Zeitpunkt</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Charge</TableHead>
                        <TableHead className="text-right">Delta</TableHead>
                        <TableHead className="hidden lg:table-cell">Notiz</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bewegungen.map((bewegung) => {
                        const details = getBewegungDetails(bewegung);
                        if (!details) {
                          return null;
                        }
                        return (
                          <TableRow key={bewegung.id}>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatDateTime(bewegung.zeitpunkt)}
                            </TableCell>
                            <TableCell>
                              <BewegungTypBadge typ={bewegung.typ} />
                            </TableCell>
                            <TableCell>
                              <Link
                                href={`/lager/chargen/${details.charge.id}`}
                                className="hover:underline"
                              >
                                {details.rohstoff.name} ·{" "}
                                {details.charge.lieferanten_chargennummer ?? "ohne Nummer"}
                              </Link>
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              {formatSignedNumber(bewegung.mengen_delta)}{" "}
                              {basiseinheitLabels[details.rohstoff.basiseinheit]}
                            </TableCell>
                            <TableCell className="hidden text-muted-foreground lg:table-cell">
                              {bewegung.notizen ?? "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
