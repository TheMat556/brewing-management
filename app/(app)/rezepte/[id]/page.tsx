import { ArrowLeft, FilePlus2, LockKeyhole, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BoilSchedule } from "@/components/brewing/boil-schedule";
import { PageHeader } from "@/components/brewing/page-header";
import { ArchivBadge, RezeptStatusBadge } from "@/components/brewing/status-badge";
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
  getRezept,
  getSchritteFuerVersion,
  getVersionenFuerRezept,
  getZutatenFuerVersion,
  rezepte,
} from "@/lib/demo";
import {
  formatDate,
  formatDateTime,
  formatLiters,
  formatMinutes,
  formatNumber,
  formatPercent,
  formatPlato,
} from "@/lib/format";
import { basiseinheitLabels, prozessschrittTypLabels } from "@/lib/labels";

export const instant = false;

export function generateStaticParams() {
  return rezepte.map((rezept) => ({ id: String(rezept.id) }));
}

function zugabeLabel(
  zutat: { zugabe_nach_min: number | null },
  schritt?: { typ: string; dauer_min: number | null },
): string {
  if (zutat.zugabe_nach_min === null) {
    return "—";
  }
  if (schritt?.typ === "KOCHEN" && schritt.dauer_min !== null) {
    const vorKochende = schritt.dauer_min - zutat.zugabe_nach_min;
    if (vorKochende > 0) {
      return `T-${formatNumber(vorKochende)} Min.`;
    }
    if (vorKochende === 0) {
      return "Kochende";
    }
    return `T+${formatNumber(Math.abs(vorKochende))} Min.`;
  }
  if (zutat.zugabe_nach_min === 0) {
    return "zu Beginn";
  }
  return `+${formatMinutes(zutat.zugabe_nach_min)}`;
}

export default async function RezeptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rezept = getRezept(Number(id));
  if (!rezept) {
    notFound();
  }
  const versionen = getVersionenFuerRezept(rezept.id);
  if (versionen.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={rezept.name}
        description={rezept.beschreibung ?? "Keine Beschreibung hinterlegt."}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/rezepte">
                <ArrowLeft />
                Zurück
              </Link>
            </Button>
            <Button disabled title="Im Demo-Modus nicht verfügbar">
              <FilePlus2 />
              Neue Version
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{versionen.length} Versionen</Badge>
        {rezept.archiviert ? <ArchivBadge /> : null}
        <span className="text-sm text-muted-foreground">
          Erstellt am {formatDate(rezept.erstellt_am)}
        </span>
      </div>

      <Tabs defaultValue={String(versionen[0].id)} className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
          {versionen.map((version) => (
            <TabsTrigger key={version.id} value={String(version.id)} className="gap-2">
              v{version.versionsnummer}
              <RezeptStatusBadge status={version.status} />
            </TabsTrigger>
          ))}
        </TabsList>

        {versionen.map((version) => {
          const zutaten = getZutatenFuerVersion(version.id);
          const schritte = getSchritteFuerVersion(version.id);
          const kochschritt = schritte.find((schritt) => schritt.typ === "KOCHEN");
          const kochzutaten = kochschritt
            ? zutaten.filter((zutat) => zutat.rezeptschritt_id === kochschritt.id)
            : [];
          return (
            <TabsContent key={version.id} value={String(version.id)} className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <RezeptStatusBadge status={version.status} />
                <span className="text-sm text-muted-foreground">
                  Erstellt am {formatDateTime(version.erstellt_am)}
                </span>
                {version.freigegeben_am ? (
                  <span className="text-sm text-muted-foreground">
                    Freigegeben am {formatDateTime(version.freigegeben_am)}
                  </span>
                ) : null}
                {version.status === "FREIGEGEBEN" ? (
                  <Badge variant="outline" className="gap-1">
                    <LockKeyhole className="size-3" />
                    unveränderlich
                  </Badge>
                ) : (
                  <Badge variant="outline">Entwurf bearbeitbar</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Ausschlagmenge</CardDescription>
                    <CardTitle className="text-xl">
                      {formatLiters(version.ziel_ausschlagmenge_l)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Stammwürze</CardDescription>
                    <CardTitle className="text-xl">
                      {formatPlato(version.ziel_stammwuerze_plato)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>ABV</CardDescription>
                    <CardTitle className="text-xl">
                      {formatPercent(version.ziel_abv_prozent)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>IBU</CardDescription>
                    <CardTitle className="text-xl tabular-nums">
                      {version.ziel_ibu === null ? "—" : formatNumber(version.ziel_ibu)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>EBC</CardDescription>
                    <CardTitle className="text-xl tabular-nums">
                      {version.ziel_ebc === null ? "—" : formatNumber(version.ziel_ebc)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {version.infos ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Informationen</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {version.infos}
                  </CardContent>
                </Card>
              ) : null}

              <BoilSchedule
                dauerMin={kochschritt?.dauer_min ?? null}
                additions={kochzutaten.map((zutat) => ({
                  id: zutat.id,
                  name: zutat.rohstoffname_snapshot,
                  menge: zutat.menge,
                  einheit: basiseinheitLabels[zutat.einheit_snapshot],
                  alphasaeureProzent: zutat.alphasaeure_prozent,
                  zugabeNachStartMin: zutat.zugabe_nach_min,
                  notizen: zutat.notizen,
                }))}
              />

              <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
                <Card>
                  <CardHeader>
                    <CardTitle>Zutaten</CardTitle>
                    <CardDescription>Mengen und Rohstoff-Snapshots dieser Version.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full min-w-0 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Rohstoff</TableHead>
                            <TableHead className="text-right">Menge</TableHead>
                            <TableHead>Schritt</TableHead>
                            <TableHead className="hidden sm:table-cell">Alpha / EBC</TableHead>
                            <TableHead className="hidden text-right md:table-cell">
                              Zugabe
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {zutaten.map((zutat) => {
                            const schritt = schritte.find(
                              (item) => item.id === zutat.rezeptschritt_id,
                            );
                            return (
                              <TableRow key={zutat.id}>
                                <TableCell className="font-medium">
                                  {zutat.rohstoffname_snapshot}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatNumber(zutat.menge)}{" "}
                                  {basiseinheitLabels[zutat.einheit_snapshot]}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {schritt ? `P${schritt.position} ${schritt.name}` : "—"}
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
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Schritte</CardTitle>
                    <CardDescription>
                      Reihenfolge und Prozesswerte der Rezeptversion.
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
                            <TableHead className="hidden text-right lg:table-cell">
                              Wasser
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {schritte.map((schritt) => (
                            <TableRow key={schritt.id}>
                              <TableCell className="tabular-nums">{schritt.position}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {prozessschrittTypLabels[schritt.typ]}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{schritt.name}</div>
                                {schritt.anweisung ? (
                                  <div className="max-w-72 whitespace-normal text-xs text-muted-foreground">
                                    {schritt.anweisung}
                                  </div>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {schritt.temperatur_c === null
                                  ? "—"
                                  : `${formatNumber(schritt.temperatur_c)} °C`}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatMinutes(schritt.dauer_min)}
                              </TableCell>
                              <TableCell className="hidden text-right tabular-nums lg:table-cell">
                                {formatLiters(schritt.wassermenge_l)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button disabled title="Im Demo-Modus nicht verfügbar">
                  <LockKeyhole />
                  Freigeben
                </Button>
                <Button variant="destructive" disabled title="Im Demo-Modus nicht verfügbar">
                  <Trash2 />
                  Entwurf löschen
                </Button>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
