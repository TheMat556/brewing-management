import { ArrowRight, BookOpen, FlaskConical, Info, Package, Wheat } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/brewing/page-header";
import { StatCard } from "@/components/brewing/stat-card";
import {
  BewegungTypBadge,
  RezeptStatusBadge,
  SudStatusBadge,
} from "@/components/brewing/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  getAktuelleVersion,
  getBaldAblaufendeChargen,
  getBestandCharge,
  getBewegungDetails,
  getFreigegebeneRezepte,
  getOffeneSude,
  lagerbewegungen,
  lagerchargen,
  rezepte,
  rohstoffe,
} from "@/lib/demo";
import {
  formatDate,
  formatDateTime,
  formatLiters,
  formatNumber,
  formatPlato,
  formatSignedNumber,
} from "@/lib/format";
import { basiseinheitLabels } from "@/lib/labels";

export default function DashboardPage() {
  const aktiveRohstoffe = rohstoffe.filter((rohstoff) => !rohstoff.archiviert);
  const offeneSude = getOffeneSude();
  const freigegebeneRezepte = getFreigegebeneRezepte();
  const baldAblaufend = getBaldAblaufendeChargen();
  const letzteBewegungen = [...lagerbewegungen]
    .sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt))
    .slice(0, 6);
  const aktuelleRezepte = rezepte
    .filter((rezept) => !rezept.archiviert)
    .map((rezept) => ({ rezept, version: getAktuelleVersion(rezept.id) }))
    .filter((eintrag) => eintrag.version !== undefined);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Übersicht"
        description="Demo-Dashboard mit Beispieldaten aus dem vollständigen Brewing-Datenmodell. Es werden noch keine echten Supabase-Daten geladen."
        actions={
          <Button asChild>
            <Link href="/sude">
              <FlaskConical />
              Sude ansehen
            </Link>
          </Button>
        }
      />

      <Alert>
        <Info />
        <AlertTitle>Demo-Modus</AlertTitle>
        <AlertDescription>
          Alle Listen und Detailseiten verwenden lokal typisierte Beispieldaten. Aktionen zum
          Anlegen, Freigeben, Löschen oder Buchen von Beständen sind deaktiviert.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Aktive Rohstoffe"
          value={aktiveRohstoffe.length}
          hint={`${rohstoffe.length - aktiveRohstoffe.length} archiviert`}
          icon={Wheat}
        />
        <StatCard
          title="Lagerchargen"
          value={lagerchargen.length}
          hint={`${baldAblaufend.length} mit MHD-Warnung`}
          icon={Package}
        />
        <StatCard
          title="Offene Sude"
          value={offeneSude.length}
          hint="Geplant oder in Arbeit"
          icon={FlaskConical}
        />
        <StatCard
          title="Freigegebene Rezepte"
          value={freigegebeneRezepte.length}
          hint="Ohne archivierte Rezepte"
          icon={BookOpen}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Letzte Lagerbewegungen</CardTitle>
              <CardDescription>Append-only Historie aus dem Demo-Datensatz.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/lager/bewegungen">Alle ansehen</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden md:table-cell">Zeitpunkt</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Rohstoff</TableHead>
                    <TableHead className="text-right">Menge</TableHead>
                    <TableHead className="hidden sm:table-cell">Sud</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {letzteBewegungen.map((bewegung) => {
                    const details = getBewegungDetails(bewegung);
                    if (!details) {
                      return null;
                    }
                    return (
                      <TableRow key={bewegung.id}>
                        <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                          {formatDateTime(bewegung.zeitpunkt)}
                        </TableCell>
                        <TableCell>
                          <BewegungTypBadge typ={bewegung.typ} />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/lager/chargen/${details.charge.id}`}
                            className="font-medium hover:underline"
                          >
                            {details.rohstoff.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {details.charge.lieferanten_chargennummer ?? "ohne Chargennummer"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatSignedNumber(bewegung.mengen_delta)}{" "}
                          {basiseinheitLabels[details.rohstoff.basiseinheit]}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {details.sud ? (
                            <Link
                              href={`/sude/${details.sud.id}`}
                              className="text-sm hover:underline"
                            >
                              {details.sud.sudnummer}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
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

        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bald ablaufend</CardTitle>
              <CardDescription>
                Chargen mit Bestand und MHD in den nächsten 90 Tagen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {baldAblaufend.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Chargen mit nahendem MHD.</p>
              ) : (
                baldAblaufend.map((charge) => {
                  const rohstoff = rohstoffe.find((item) => item.id === charge.rohstoff_id);
                  return (
                    <Link
                      key={charge.id}
                      href={`/lager/chargen/${charge.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{rohstoff?.name ?? "Unbekannt"}</p>
                        <p className="text-xs text-muted-foreground">
                          MHD {formatDate(charge.mhd)} · Bestand{" "}
                          {formatNumber(getBestandCharge(charge.id))}{" "}
                          {rohstoff ? basiseinheitLabels[rohstoff.basiseinheit] : ""}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Aktuelle Sude</CardTitle>
              <CardDescription>Geplante und laufende Sude.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {offeneSude.map((sud) => (
                <Link
                  key={sud.id}
                  href={`/sude/${sud.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {sud.sudnummer} · {sud.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(sud.braudatum)} · Ziel {formatLiters(sud.ziel_ausschlagmenge_l)} ·{" "}
                      {formatPlato(sud.ziel_stammwuerze_plato)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <SudStatusBadge status={sud.status} />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Aktuelle Rezepte</CardTitle>
            <CardDescription>
              Jeweils die neueste Version mit Status und Zielwerten.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/rezepte">Alle Rezepte</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {aktuelleRezepte.map(({ rezept, version }) => (
              <Link
                key={rezept.id}
                href={`/rezepte/${rezept.id}`}
                className="rounded-xl border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{rezept.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Version {version?.versionsnummer}
                    </p>
                  </div>
                  {version ? <RezeptStatusBadge status={version.status} /> : null}
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {rezept.beschreibung}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">{formatLiters(version?.ziel_ausschlagmenge_l)}</Badge>
                  <Badge variant="outline">{formatPlato(version?.ziel_stammwuerze_plato)}</Badge>
                  <Badge variant="outline">{version?.ziel_ibu ?? "—"} IBU</Badge>
                  <Badge variant="outline">{version?.ziel_ebc ?? "—"} EBC</Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
