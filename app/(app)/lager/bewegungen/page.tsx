import { ArrowDownUp, Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/brewing/page-header";
import { StatCard } from "@/components/brewing/stat-card";
import { BewegungTypBadge } from "@/components/brewing/status-badge";
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
import { getBewegungDetails, lagerbewegungen } from "@/lib/demo";
import { formatDateTime, formatSignedNumber } from "@/lib/format";
import { basiseinheitLabels } from "@/lib/labels";

export default function LagerbewegungenPage() {
  const bewegungen = [...lagerbewegungen].sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt));
  const zugaenge = bewegungen.filter((bewegung) => bewegung.typ === "ZUGANG");
  const verbraeuche = bewegungen.filter((bewegung) => bewegung.typ === "VERBRAUCH");
  const korrekturen = bewegungen.filter((bewegung) => bewegung.typ === "KORREKTUR");
  const entsorgungen = bewegungen.filter((bewegung) => bewegung.typ === "ENTSORGUNG");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lagerbewegungen"
        description="Vollständige, append-only Historie. Bestandskorrekturen werden als neue Bewegung erfasst."
        actions={
          <Button disabled title="Im Demo-Modus nicht verfügbar">
            <Plus />
            Bewegung erfassen
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Zugänge" value={zugaenge.length} icon={ArrowDownUp} />
        <StatCard title="Verbräuche" value={verbraeuche.length} />
        <StatCard title="Korrekturen" value={korrekturen.length} />
        <StatCard title="Entsorgungen" value={entsorgungen.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Bewegungen</CardTitle>
          <CardDescription>
            Jede Zeile verändert den Bestand genau einer Lagercharge. Verknüpfte Sude zeigen die
            Herkunft eines Verbrauchs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Zeitpunkt</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Rohstoff / Charge</TableHead>
                  <TableHead className="text-right">Delta</TableHead>
                  <TableHead className="hidden md:table-cell">Sud</TableHead>
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
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
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
                      <TableCell className="hidden md:table-cell">
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
                      <TableCell className="hidden max-w-72 whitespace-normal text-muted-foreground lg:table-cell">
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
  );
}
