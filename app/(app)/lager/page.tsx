import { Package, Plus, TriangleAlert, Wheat } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/brewing/page-header";
import { StatCard } from "@/components/brewing/stat-card";
import { KategorieBadge } from "@/components/brewing/status-badge";
import { DemoActionButton } from "@/components/demo/demo-action-dialog";
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
  getBaldAblaufendeChargen,
  getBestandCharge,
  lagerchargen,
  rohstoffe,
  tageBis,
} from "@/lib/demo";
import { formatDate, formatNumber, formatPercent, formatQuantity } from "@/lib/format";
import { basiseinheitLabels } from "@/lib/labels";

function BestandsBadge({ chargeId, mhd }: { chargeId: number; mhd: string | null }) {
  const bestand = getBestandCharge(chargeId);
  if (bestand <= 0) {
    return <Badge variant="outline">Leer</Badge>;
  }
  if (mhd && tageBis(mhd) < 0) {
    return <Badge variant="destructive">MHD überschritten</Badge>;
  }
  if (mhd && tageBis(mhd) <= 90) {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
      >
        MHD bald
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
    >
      Verfügbar
    </Badge>
  );
}

export default function LagerPage() {
  const aktiveRohstoffe = rohstoffe.filter((rohstoff) => !rohstoff.archiviert);
  const warnungen = getBaldAblaufendeChargen();
  const leereChargen = lagerchargen.filter((charge) => getBestandCharge(charge.id) <= 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lagerbestand"
        description="Der Bestand wird aus der Summe aller Lagerbewegungen berechnet. Es gibt kein separat gespeichertes Bestandsfeld."
        actions={
          <DemoActionButton
            label="Charge erfassen"
            title="Lagercharge erfassen"
            description="Eine neue Lieferung für einen bestehenden Rohstoff erfassen."
            submitLabel="Charge vorbereiten"
            icon={<Plus />}
            successMessage="Demo-Lagercharge vorbereitet."
            fields={[
              {
                kind: "select",
                name: "rohstoff",
                label: "Rohstoff",
                required: true,
                placeholder: "Rohstoff wählen",
                options: rohstoffe
                  .filter((rohstoff) => !rohstoff.archiviert)
                  .map((rohstoff) => ({ value: String(rohstoff.id), label: rohstoff.name })),
              },
              {
                kind: "text",
                name: "charge",
                label: "Lieferanten-Chargennummer",
                placeholder: "z. B. L-2026-015",
              },
              {
                kind: "date",
                name: "lieferdatum",
                label: "Lieferdatum",
                required: true,
              },
              { kind: "date", name: "mhd", label: "Mindesthaltbarkeitsdatum" },
              {
                kind: "number",
                name: "alpha",
                label: "Alpha-Säure (%)",
                placeholder: "Optional",
                min: 0,
                step: "0.1",
              },
              {
                kind: "number",
                name: "ebc",
                label: "EBC",
                placeholder: "Optional",
                min: 0,
                step: "0.1",
              },
              { kind: "textarea", name: "notizen", label: "Notizen", placeholder: "Optional" },
            ]}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Lagerchargen" value={lagerchargen.length} icon={Package} />
        <StatCard title="Aktive Rohstoffe" value={aktiveRohstoffe.length} icon={Wheat} />
        <StatCard
          title="MHD-Warnungen"
          value={warnungen.length}
          hint="Bestand und MHD in den nächsten 90 Tagen"
          icon={TriangleAlert}
        />
        <StatCard title="Leere Chargen" value={leereChargen.length} hint="Bestand ≤ 0" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chargen</CardTitle>
          <CardDescription>
            Eine Zeile pro Lagercharge. Alpha-Säure und EBC sind chargenspezifische Werte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rohstoff</TableHead>
                  <TableHead className="hidden md:table-cell">Kategorie</TableHead>
                  <TableHead className="hidden sm:table-cell">Charge</TableHead>
                  <TableHead className="hidden lg:table-cell">Lieferdatum</TableHead>
                  <TableHead className="hidden sm:table-cell">MHD</TableHead>
                  <TableHead className="text-right">Bestand</TableHead>
                  <TableHead className="hidden md:table-cell">Alpha / EBC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lagerchargen.map((charge) => {
                  const rohstoff = rohstoffe.find((item) => item.id === charge.rohstoff_id);
                  if (!rohstoff) {
                    return null;
                  }
                  const bestand = getBestandCharge(charge.id);
                  return (
                    <TableRow key={charge.id}>
                      <TableCell>
                        <Link
                          href={`/lager/chargen/${charge.id}`}
                          className="font-medium hover:underline"
                        >
                          {rohstoff.name}
                        </Link>
                        {rohstoff.archiviert ? (
                          <span className="ml-2 text-xs text-muted-foreground">archiviert</span>
                        ) : null}
                        <div className="mt-1 text-xs text-muted-foreground sm:hidden">
                          {charge.lieferanten_chargennummer ?? "Keine Charge"} · MHD{" "}
                          {formatDate(charge.mhd)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <KategorieBadge kategorie={rohstoff.kategorie} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {charge.lieferanten_chargennummer ?? "—"}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">
                        {formatDate(charge.lieferdatum)}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                        {formatDate(charge.mhd)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatQuantity(bestand, basiseinheitLabels[rohstoff.basiseinheit])}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground md:table-cell">
                        {charge.alphasaeure_prozent !== null
                          ? `Alpha ${formatPercent(charge.alphasaeure_prozent)}`
                          : charge.ebc !== null
                            ? `EBC ${formatNumber(charge.ebc)}`
                            : "—"}
                      </TableCell>
                      <TableCell>
                        <BestandsBadge chargeId={charge.id} mhd={charge.mhd} />
                      </TableCell>
                      <TableCell className="hidden text-right sm:table-cell">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/lager/chargen/${charge.id}`}>Details</Link>
                        </Button>
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
  );
}
