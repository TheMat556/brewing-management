import { Plus, Wheat } from "lucide-react";

import { PageHeader } from "@/components/brewing/page-header";
import { StatCard } from "@/components/brewing/stat-card";
import { ArchivBadge, KategorieBadge } from "@/components/brewing/status-badge";
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
          <Button disabled title="Im Demo-Modus nicht verfügbar">
            <Plus />
            Rohstoff anlegen
          </Button>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Basiseinheit</TableHead>
                  <TableHead className="text-right">Chargen</TableHead>
                  <TableHead className="text-right">Gesamtbestand</TableHead>
                  <TableHead className="text-right">Rezeptzutaten</TableHead>
                  <TableHead className="text-right">Sudzutaten</TableHead>
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
                          <div className="max-w-72 text-xs text-muted-foreground">
                            {rohstoff.notizen}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <KategorieBadge kategorie={rohstoff.kategorie} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {basiseinheitLabels[rohstoff.basiseinheit]}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{chargen.length}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatQuantity(bestand, basiseinheitLabels[rohstoff.basiseinheit])}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {rezeptVerwendungen}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{sudVerwendungen}</TableCell>
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
