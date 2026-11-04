import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/brewing/page-header";
import { BewegungTypBadge, KategorieBadge } from "@/components/brewing/status-badge";
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
  getBestandCharge,
  getBewegungDetails,
  getBewegungenFuerCharge,
  getLagercharge,
  getRohstoff,
  lagerchargen,
  tageBis,
} from "@/lib/demo";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatSignedNumber,
} from "@/lib/format";
import { basiseinheitLabels } from "@/lib/labels";

export const instant = false;

export function generateStaticParams() {
  return lagerchargen.map((charge) => ({ id: String(charge.id) }));
}

export default async function LagerchargePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const charge = getLagercharge(Number(id));
  if (!charge) {
    notFound();
  }
  const rohstoff = getRohstoff(charge.rohstoff_id);
  if (!rohstoff) {
    notFound();
  }

  const bestand = getBestandCharge(charge.id);
  const bewegungen = getBewegungenFuerCharge(charge.id);
  const einheit = basiseinheitLabels[rohstoff.basiseinheit];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${rohstoff.name} · ${charge.lieferanten_chargennummer ?? "ohne Chargennummer"}`}
        description="Chargendetails und vollständige, append-only Bewegungshistorie."
        actions={
          <Button variant="outline" asChild>
            <Link href="/lager">
              <ArrowLeft />
              Zurück zum Bestand
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktueller Bestand</CardDescription>
            <CardTitle className="text-2xl tabular-nums">
              {formatNumber(bestand)} {einheit}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Summe aller Bewegungen dieser Charge.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lieferdatum</CardDescription>
            <CardTitle className="text-lg">{formatDate(charge.lieferdatum)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{bewegungen.length} Bewegungen erfasst.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>MHD</CardDescription>
            <CardTitle className="text-lg">{formatDate(charge.mhd)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {charge.mhd
                ? tageBis(charge.mhd) < 0
                  ? "MHD überschritten"
                  : `Noch ${tageBis(charge.mhd)} Tage`
                : "Kein MHD hinterlegt"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rohstoff</CardDescription>
            <CardTitle className="text-lg">{rohstoff.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <KategorieBadge kategorie={rohstoff.kategorie} />
            <span className="text-xs text-muted-foreground">
              Basiseinheit {basiseinheitLabels[rohstoff.basiseinheit]}
            </span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Chargenwerte</CardTitle>
            <CardDescription>Werte gelten nur für diese Lieferung.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Alpha-Säure</dt>
                <dd className="font-medium tabular-nums">
                  {formatPercent(charge.alphasaeure_prozent)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">EBC</dt>
                <dd className="font-medium tabular-nums">
                  {charge.ebc === null ? "—" : formatNumber(charge.ebc)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Lieferantennummer</dt>
                <dd className="font-medium">{charge.lieferanten_chargennummer ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Notizen</dt>
                <dd className="mt-1">{charge.notizen ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bewegungen</CardTitle>
            <CardDescription>
              Korrekturen erfolgen ausschließlich über neue Bewegungen, nie durch Überschreiben.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeitpunkt</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-right">Delta</TableHead>
                    <TableHead className="hidden sm:table-cell">Sud</TableHead>
                    <TableHead className="hidden lg:table-cell">Notiz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bewegungen.map((bewegung) => {
                    const details = getBewegungDetails(bewegung);
                    return (
                      <TableRow key={bewegung.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(bewegung.zeitpunkt)}
                        </TableCell>
                        <TableCell>
                          <BewegungTypBadge typ={bewegung.typ} />
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatSignedNumber(bewegung.mengen_delta)} {einheit}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {details?.sud ? (
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
                        <TableCell className="hidden max-w-64 whitespace-normal text-muted-foreground lg:table-cell">
                          {bewegung.notizen ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
