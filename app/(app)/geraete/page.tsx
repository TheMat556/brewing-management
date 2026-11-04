import { Plus, Wrench } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/brewing/page-header";
import { StatCard } from "@/components/brewing/stat-card";
import { ArchivBadge } from "@/components/brewing/status-badge";
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
import { geraete, getGeraetHistorie } from "@/lib/demo";
import { formatLiters } from "@/lib/format";

export default function GeraetePage() {
  const lobFaehig = geraete.filter((geraet) => geraet.lob_faehig);
  const archiviert = geraete.filter((geraet) => geraet.archiviert);
  const gesamtMenge = geraete.reduce((summe, geraet) => summe + geraet.menge, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geräte"
        description="Geräte sind Gruppen gleichwertiger Gegenstände, keine einzelnen Seriennummern. Einsätze werden pro Sud mit Mengen- und LOB-Snapshots festgehalten."
        actions={
          <Button disabled title="Im Demo-Modus nicht verfügbar">
            <Plus />
            Gerät anlegen
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Gerätegruppen" value={geraete.length} icon={Wrench} />
        <StatCard title="Einzelstücke" value={gesamtMenge} />
        <StatCard title="LOB-fähig" value={lobFaehig.length} />
        <StatCard title="Archiviert" value={archiviert.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerätegruppen</CardTitle>
          <CardDescription>
            Die Verfügbarkeit wird nicht aus historischen Zuweisungen berechnet; ein
            Reservierungssystem ist nicht Teil des Modells.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Menge</TableHead>
                  <TableHead>LOB-fähig</TableHead>
                  <TableHead className="text-right">LOB-Menge / Stück</TableHead>
                  <TableHead className="text-right">Einsätze</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {geraete.map((geraet) => {
                  const historie = getGeraetHistorie(geraet.id);
                  return (
                    <TableRow key={geraet.id}>
                      <TableCell>
                        <Link
                          href={`/geraete/${geraet.id}`}
                          className="font-medium hover:underline"
                        >
                          {geraet.name}
                        </Link>
                        {geraet.notizen ? (
                          <div className="max-w-72 text-xs text-muted-foreground">
                            {geraet.notizen}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{geraet.menge}</TableCell>
                      <TableCell>
                        {geraet.lob_faehig ? (
                          <Badge variant="outline">Ja</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">Nein</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatLiters(geraet.lob_menge_l)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{historie.length}</TableCell>
                      <TableCell>
                        {geraet.archiviert ? (
                          <ArchivBadge />
                        ) : (
                          <span className="text-sm text-muted-foreground">Aktiv</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/geraete/${geraet.id}`}>Details</Link>
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
