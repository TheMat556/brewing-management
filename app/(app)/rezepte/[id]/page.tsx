import { ArrowLeft, FilePlus2, LockKeyhole, Trash2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/brewing/page-header";
import { RecipeVersionEditor } from "@/components/brewing/recipe-version-editor";
import { ArchivBadge, RezeptStatusBadge } from "@/components/brewing/status-badge";
import { DemoActionButton } from "@/components/demo/demo-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getRezept,
  getSchritteFuerVersion,
  getVersionenFuerRezept,
  getZutatenFuerVersion,
  rezepte,
  rohstoffe,
} from "@/lib/demo";
import {
  formatDate,
  formatDateTime,
  formatLiters,
  formatNumber,
  formatPercent,
  formatPlato,
} from "@/lib/format";

export const instant = false;

export function generateStaticParams() {
  return rezepte.map((rezept) => ({ id: String(rezept.id) }));
}

export default async function RezeptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rezept = getRezept(Number(id));
  if (!rezept) {
    notFound();
  }
  const versionen = getVersionenFuerRezept(rezept.id);
  if (versionen.length === 0) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={rezept.name}
        description={rezept.beschreibung ?? "Keine Beschreibung hinterlegt."}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/rezepte">
                <ArrowLeft />
                Zurück
              </Link>
            </Button>
            <DemoActionButton
              label="Neue Version"
              title="Neue Rezeptversion"
              description="Eine neue Entwurfsversion vorbereiten. Name, Beschreibung und Zielwerte werden aus der aktuellen Version übernommen und danach im Entwurf bearbeitet."
              submitLabel="Version vorbereiten"
              icon={<FilePlus2 />}
              successMessage="Demo-Rezeptversion vorbereitet."
              fields={[
                {
                  kind: "textarea",
                  name: "notizen",
                  label: "Änderungshinweis",
                  placeholder: "Was ändert sich in dieser Version?",
                },
              ]}
            />
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{versionen.length} Versionen</Badge>
        {rezept.archiviert ? <ArchivBadge /> : null}
        <span className="text-sm text-muted-foreground">
          Erstellt am {formatDate(rezept.erstellt_am)}
        </span>
      </div>

      <Tabs defaultValue={String(versionen[0].id)} className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-fit">
          {versionen.map((version) => (
            <TabsTrigger key={version.id} value={String(version.id)} className="gap-2">
              v{version.versionsnummer}
              <RezeptStatusBadge status={version.status} />
            </TabsTrigger>
          ))}
        </TabsList>

        {versionen.map((version) => {
          const zutaten = getZutatenFuerVersion(version.id);
          const schritte = getSchritteFuerVersion(version.id);
          return (
            <TabsContent key={version.id} value={String(version.id)} className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <RezeptStatusBadge status={version.status} />
                <span className="text-sm text-muted-foreground">
                  Erstellt am {formatDateTime(version.erstellt_am)}
                </span>
                {version.freigegeben_am ? (
                  <span className="text-sm text-muted-foreground">
                    Freigegeben am {formatDateTime(version.freigegeben_am)}
                  </span>
                ) : null}
                {version.status === "FREIGEGEBEN" ? (
                  <Badge variant="outline" className="gap-1">
                    <LockKeyhole className="size-3" />
                    unveränderlich
                  </Badge>
                ) : (
                  <Badge variant="outline">Entwurf bearbeitbar</Badge>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Ausschlagmenge</CardDescription>
                    <CardTitle className="text-xl">
                      {formatLiters(version.ziel_ausschlagmenge_l)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Stammwürze</CardDescription>
                    <CardTitle className="text-xl">
                      {formatPlato(version.ziel_stammwuerze_plato)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>ABV</CardDescription>
                    <CardTitle className="text-xl">
                      {formatPercent(version.ziel_abv_prozent)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>IBU</CardDescription>
                    <CardTitle className="text-xl tabular-nums">
                      {version.ziel_ibu === null ? "—" : formatNumber(version.ziel_ibu)}
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>EBC</CardDescription>
                    <CardTitle className="text-xl tabular-nums">
                      {version.ziel_ebc === null ? "—" : formatNumber(version.ziel_ebc)}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {version.infos ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Informationen</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {version.infos}
                  </CardContent>
                </Card>
              ) : null}

              <RecipeVersionEditor
                version={version}
                zutaten={zutaten}
                schritte={schritte}
                rohstoffe={rohstoffe}
              />

              <div className="flex flex-wrap gap-2">
                <DemoActionButton
                  label="Freigeben"
                  title="Rezeptversion freigeben"
                  description="Die Version würde freigegeben und danach unveränderlich. Dies ist nur eine Demo-Bestätigung."
                  submitLabel="Freigeben"
                  icon={<LockKeyhole />}
                  successMessage="Demo: Rezeptversion freigegeben."
                  fields={[]}
                />
                <DemoActionButton
                  label="Entwurf löschen"
                  title="Entwurf löschen"
                  description="Diese Aktion würde den Entwurf dauerhaft entfernen. Dies ist nur eine Demo-Bestätigung."
                  submitLabel="Entwurf löschen"
                  icon={<Trash2 />}
                  variant="destructive"
                  successMessage="Demo: Entwurf würde gelöscht."
                  fields={[]}
                />
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
