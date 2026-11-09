import { Plus, Wrench } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/brewing/page-header";
import { StatCard } from "@/components/brewing/stat-card";
import { ArchivBadge } from "@/components/brewing/status-badge";
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
          <DemoActionButton
            label="Gerät anlegen"
            title="Gerätegruppe anlegen"
            description="Eine Gruppe gleichwertiger Gegenstände erfassen."
            submitLabel="Gerät vorbereiten"
            icon={<Plus />}
            successMessage="Demo-Gerät vorbereitet."
            fields={[
              {
                kind: "text",
                name: "name",
                label: "Name",
                placeholder: "z. B. 30-Liter-Gärtank",
                required: true,
              },
              {
                kind: "number",
                name: "menge",
                label: "Menge",
                required: true,
                min: 0,
                defaultValue: "1",
              },
              {
                kind: "select",
                name: "lob_faehig",
                label: "LOB-fähig",
                options: [
                  { value: "nein", label: "Nein" },
                  { value: "ja", label: "Ja" },
                ],
                defaultValue: "nein",
              },
              {
                kind: "number",
                name: "lob_menge",
                label: "LOB-Menge pro Stück (L)",
                placeholder: "Optional",
                min: 0,
                step: "0.1",
              },
              { kind: "textarea", name: "notizen", label: "Notizen", placeholder: "Optional" },
              {
                kind: "select",
                name: "archiviert",
                label: "Archiviert",
                defaultValue: "nein",
                options: [
                  { value: "nein", label: "Nein" },
                  { value: "ja", label: "Ja" },
                ],
              },
            ]}
          />
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
          <div className="w-full min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Menge</TableHead>
                  <TableHead>LOB-fähig</TableHead>
                  <TableHead className="hidden text-right md:table-cell">
                    LOB-Menge / Stück
                  </TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Einsätze</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell" />
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
                          <div className="max-w-72 whitespace-normal text-xs text-muted-foreground">
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
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
                        {formatLiters(geraet.lob_menge_l)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">
                        {historie.length}
                      </TableCell>
                      <TableCell>
                        {geraet.archiviert ? (
                          <ArchivBadge />
                        ) : (
                          <span className="text-sm text-muted-foreground">Aktiv</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-right sm:table-cell">
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
