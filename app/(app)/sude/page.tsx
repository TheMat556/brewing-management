import { FlaskConical, Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/brewing/page-header";
import { StatCard } from "@/components/brewing/stat-card";
import { SudStatusBadge } from "@/components/brewing/status-badge";
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
import { getRezeptFuerVersion, getVersion, sude } from "@/lib/demo";
import { formatDate, formatLiters, formatPlato } from "@/lib/format";

export default function SudePage() {
  const geplant = sude.filter((sud) => sud.status === "GEPLANT");
  const inArbeit = sude.filter((sud) => sud.status === "IN_ARBEIT");
  const abgeschlossen = sude.filter((sud) => sud.status === "ABGESCHLOSSEN");
  const verworfen = sude.filter((sud) => sud.status === "VERWORFEN");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sude"
        description="Sude sind unabhängige Kopien einer freigegebenen Rezeptversion. Zielwerte, Schritte, Zutaten und Geräte bleiben nach dem Anlegen editierbar."
        actions={
          <Button disabled title="Im Demo-Modus nicht verfügbar">
            <Plus />
            Neuer Sud
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Geplant" value={geplant.length} icon={FlaskConical} />
        <StatCard title="In Arbeit" value={inArbeit.length} />
        <StatCard title="Abgeschlossen" value={abgeschlossen.length} />
        <StatCard title="Verworfen" value={verworfen.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Sude</CardTitle>
          <CardDescription>
            Sortiert nach Sudnummer. Ist-Werte bleiben leer, solange sie noch nicht erfasst wurden.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sudnummer</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Rezept / Version</TableHead>
                  <TableHead>Braudatum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ausschlagmenge</TableHead>
                  <TableHead className="text-right">Stammwürze</TableHead>
                  <TableHead className="text-right">Abgefüllt</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sude.map((sud) => {
                  const version = getVersion(sud.rezeptversion_id);
                  const rezept = version ? getRezeptFuerVersion(version.id) : undefined;
                  return (
                    <TableRow key={sud.id}>
                      <TableCell className="font-medium tabular-nums">
                        <Link href={`/sude/${sud.id}`} className="hover:underline">
                          {sud.sudnummer}
                        </Link>
                      </TableCell>
                      <TableCell>{sud.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {rezept?.name ?? "—"}
                        {version ? ` · v${version.versionsnummer}` : ""}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(sud.braudatum)}
                      </TableCell>
                      <TableCell>
                        <SudStatusBadge status={sud.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        <span className="font-medium">
                          {formatLiters(sud.ist_ausschlagmenge_l)}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {formatLiters(sud.ziel_ausschlagmenge_l)}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        <span className="font-medium">
                          {formatPlato(sud.ist_stammwuerze_plato)}
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          / {formatPlato(sud.ziel_stammwuerze_plato)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatLiters(sud.abgefuellte_menge_l)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/sude/${sud.id}`}>Details</Link>
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

      <p className="text-xs text-muted-foreground">
        Beispiel: Sud 2026-004 zeigt bei ABV und IBU bewusst „—“ statt 0, weil diese Ist-Werte noch
        nicht erfasst wurden. Null und „nicht erfasst“ sind unterschiedliche Zustände.
      </p>
    </div>
  );
}
