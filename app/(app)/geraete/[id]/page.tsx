import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/brewing/page-header";
import { ArchivBadge, SudStatusBadge } from "@/components/brewing/status-badge";
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
import { geraete, getGeraet, getGeraetHistorie } from "@/lib/demo";
import { formatDate, formatLiters } from "@/lib/format";

export const instant = false;

export function generateStaticParams() {
  return geraete.map((geraet) => ({ id: String(geraet.id) }));
}

export default async function GeraetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const geraet = getGeraet(Number(id));
  if (!geraet) {
    notFound();
  }
  const historie = getGeraetHistorie(geraet.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={geraet.name}
        description="Stammdaten und Einsatzhistorie dieser Gerätegruppe."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/geraete">
                <ArrowLeft />
                Zurück
              </Link>
            </Button>
            <DemoActionButton
              label="Bearbeiten"
              title="Gerät bearbeiten"
              description="Stammdaten dieser Gerätegruppe ändern. Historische Snapshots bleiben unverändert."
              submitLabel="Änderungen vorbereiten"
              icon={<Pencil />}
              successMessage="Demo-Geräteänderung vorbereitet."
              fields={[
                {
                  kind: "text",
                  name: "name",
                  label: "Name",
                  required: true,
                  defaultValue: geraet.name,
                },
                {
                  kind: "number",
                  name: "menge",
                  label: "Menge",
                  required: true,
                  min: 0,
                  defaultValue: String(geraet.menge),
                },
                {
                  kind: "select",
                  name: "lob_faehig",
                  label: "LOB-fähig",
                  defaultValue: geraet.lob_faehig ? "ja" : "nein",
                  options: [
                    { value: "nein", label: "Nein" },
                    { value: "ja", label: "Ja" },
                  ],
                },
                {
                  kind: "number",
                  name: "lob_menge",
                  label: "LOB-Menge pro Stück (L)",
                  min: 0,
                  step: "0.1",
                  defaultValue: geraet.lob_menge_l === null ? "" : String(geraet.lob_menge_l),
                },
                {
                  kind: "textarea",
                  name: "notizen",
                  label: "Notizen",
                  defaultValue: geraet.notizen ?? "",
                },
                {
                  kind: "select",
                  name: "archiviert",
                  label: "Archiviert",
                  defaultValue: geraet.archiviert ? "ja" : "nein",
                  options: [
                    { value: "nein", label: "Nein" },
                    { value: "ja", label: "Ja" },
                  ],
                },
              ]}
            />
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{geraet.menge} Stück</Badge>
        {geraet.lob_faehig ? (
          <Badge variant="outline">LOB-fähig · {formatLiters(geraet.lob_menge_l)}</Badge>
        ) : (
          <Badge variant="outline">Kein LOB</Badge>
        )}
        {geraet.archiviert ? <ArchivBadge /> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Menge</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{geraet.menge}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Gleichwertige Einzelstücke.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>LOB-Menge pro Stück</CardDescription>
            <CardTitle className="text-2xl">{formatLiters(geraet.lob_menge_l)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Wird beim Zuweisen als Snapshot gespeichert.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Einsätze</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{historie.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Zuweisungen in Sude.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notizen</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {geraet.notizen ?? "Keine Notizen hinterlegt."}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Einsatzhistorie</CardTitle>
          <CardDescription>
            Historische Zuweisungen bleiben erhalten, auch wenn sich Stammdaten später ändern.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historie.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Dieses Gerät wurde noch keinem Sud zugewiesen.
            </p>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sud</TableHead>
                    <TableHead>Braudatum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Zugewiesen</TableHead>
                    <TableHead>LOB genutzt</TableHead>
                    <TableHead className="hidden text-right md:table-cell">LOB-Snapshot</TableHead>
                    <TableHead className="hidden lg:table-cell">Notiz</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historie.map(({ eintrag, sud }) => (
                    <TableRow key={eintrag.id}>
                      <TableCell>
                        <Link href={`/sude/${sud.id}`} className="font-medium hover:underline">
                          {sud.sudnummer} · {sud.name}
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(sud.braudatum)}
                      </TableCell>
                      <TableCell>
                        <SudStatusBadge status={sud.status} />
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
                      <TableCell className="hidden text-right tabular-nums md:table-cell">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
