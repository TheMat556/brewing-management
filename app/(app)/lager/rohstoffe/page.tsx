import { Plus, Wheat } from "lucide-react";

import { PageHeader } from "@/components/brewing/page-header";
import { StatCard } from "@/components/brewing/stat-card";
import { ArchivBadge, KategorieBadge } from "@/components/brewing/status-badge";
import { DemoActionButton } from "@/components/demo/demo-action-dialog";
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
  getBestandRohstoff,
  getChargenFuerRohstoff,
  rezeptzutaten,
  rohstoffe,
  sudzutaten,
} from "@/lib/demo";
import { formatQuantity } from "@/lib/format";
import { basiseinheitLabels } from "@/lib/labels";

export default function RohstoffePage() {
  const aktiveRohstoffe = rohstoffe.filter((rohstoff) => !rohstoff.archiviert);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rohstoffe"
        description="Stammdaten für Malz, Hopfen, Hefe, Gewürze und sonstige Zutaten. Der Bestand wird aus den Lagerchargen abgeleitet."
        actions={
          <DemoActionButton
            label="Rohstoff anlegen"
            title="Rohstoff anlegen"
            description="Stammdaten für einen neuen Rohstoff erfassen. Die Eingabe bleibt in dieser Demo lokal."
            submitLabel="Rohstoff vorbereiten"
            icon={<Plus />}
            successMessage="Demo-Rohstoff vorbereitet."
            fields={[
              {
                kind: "text",
                name: "name",
                label: "Name",
                placeholder: "z. B. Pilsner Malz",
                required: true,
              },
              {
                kind: "select",
                name: "kategorie",
                label: "Kategorie",
                required: true,
                placeholder: "Kategorie wählen",
                options: [
                  { value: "MALZ", label: "Malz" },
                  { value: "HOPFEN", label: "Hopfen" },
                  { value: "HEFE", label: "Hefe" },
                  { value: "GEWUERZ", label: "Gewürz" },
                  { value: "SONSTIGES", label: "Sonstiges" },
                ],
              },
              {
                kind: "select",
                name: "basiseinheit",
                label: "Basiseinheit",
                required: true,
                placeholder: "Einheit wählen",
                options: [
                  { value: "g", label: "Gramm (g)" },
                  { value: "ml", label: "Milliliter (ml)" },
                  { value: "Stueck", label: "Stück" },
                ],
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
        <StatCard title="Rohstoffe" value={rohstoffe.length} icon={Wheat} />
        <StatCard title="Aktiv" value={aktiveRohstoffe.length} />
        <StatCard
          title="Malz"
          value={rohstoffe.filter((rohstoff) => rohstoff.kategorie === "MALZ").length}
        />
        <StatCard
          title="Hopfen"
          value={rohstoffe.filter((rohstoff) => rohstoff.kategorie === "HOPFEN").length}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stammdaten</CardTitle>
          <CardDescription>
            Archivierte Rohstoffe bleiben in historischen Rezepten und Suden sichtbar, werden aber
            nicht mehr für neue Auswahlen angeboten.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead className="hidden sm:table-cell">Basiseinheit</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">Chargen</TableHead>
                  <TableHead className="text-right">Gesamtbestand</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Rezeptzutaten</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">Sudzutaten</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rohstoffe.map((rohstoff) => {
                  const chargen = getChargenFuerRohstoff(rohstoff.id);
                  const bestand = getBestandRohstoff(rohstoff.id);
                  const rezeptVerwendungen = rezeptzutaten.filter(
                    (zutat) => zutat.rohstoff_id === rohstoff.id,
                  ).length;
                  const sudVerwendungen = sudzutaten.filter(
                    (zutat) => zutat.rohstoff_id === rohstoff.id,
                  ).length;
                  return (
                    <TableRow key={rohstoff.id}>
                      <TableCell>
                        <div className="font-medium">{rohstoff.name}</div>
                        {rohstoff.notizen ? (
                          <div className="max-w-72 whitespace-normal text-xs text-muted-foreground">
                            {rohstoff.notizen}
                          </div>
                        ) : null}
                        <div className="text-xs text-muted-foreground sm:hidden">
                          {chargen.length} Chargen
                        </div>
                      </TableCell>
                      <TableCell>
                        <KategorieBadge kategorie={rohstoff.kategorie} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {basiseinheitLabels[rohstoff.basiseinheit]}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums sm:table-cell">
                        {chargen.length}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatQuantity(bestand, basiseinheitLabels[rohstoff.basiseinheit])}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums lg:table-cell">
                        {rezeptVerwendungen}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums lg:table-cell">
                        {sudVerwendungen}
                      </TableCell>
                      <TableCell>
                        {rohstoff.archiviert ? (
                          <ArchivBadge />
                        ) : (
                          <span className="text-sm text-muted-foreground">Aktiv</span>
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
    </div>
  );
}
