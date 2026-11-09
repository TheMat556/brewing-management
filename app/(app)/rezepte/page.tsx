"use client";

import { BookOpen, FlaskConical, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PageHeader } from "@/components/brewing/page-header";
import { StatCard } from "@/components/brewing/stat-card";
import { ArchivBadge, RezeptStatusBadge } from "@/components/brewing/status-badge";
import { RecipeWizard } from "@/components/demo/recipe-wizard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Rezept, Rezeptversion } from "@/lib/demo";
import { rezepte, rezeptversionen, rohstoffe } from "@/lib/demo";
import { formatLiters, formatPercent, formatPlato } from "@/lib/format";

function sortVersions(versions: Rezeptversion[]): Rezeptversion[] {
  return [...versions].sort((a, b) => b.versionsnummer - a.versionsnummer);
}

export default function RezeptePage() {
  const [recipes, setRecipes] = useState<Rezept[]>(rezepte);
  const [versions, setVersions] = useState<Rezeptversion[]>(rezeptversionen);

  const freigegeben = versions.filter((version) => version.status === "FREIGEGEBEN");
  const entwuerfe = versions.filter((version) => version.status === "ENTWURF");
  const archiviert = recipes.filter((rezept) => rezept.archiviert);

  function handleCreated(recipe: Rezept, version: Rezeptversion) {
    setRecipes((current) => [recipe, ...current]);
    setVersions((current) => [version, ...current]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rezepte"
        description="Rezepte sind versioniert. Freigegebene Versionen sind unveränderlich; Änderungen entstehen als neue Entwurfsversion."
        actions={<RecipeWizard rohstoffe={rohstoffe} onCreated={handleCreated} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Rezepte" value={recipes.length} icon={BookOpen} />
        <StatCard title="Freigegebene Versionen" value={freigegeben.length} icon={LockKeyhole} />
        <StatCard title="Entwürfe" value={entwuerfe.length} icon={FlaskConical} />
        <StatCard title="Archiviert" value={archiviert.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {recipes.map((rezept) => {
          const rezeptVersionen = sortVersions(
            versions.filter((version) => version.rezept_id === rezept.id),
          );
          const aktuelleVersion = rezeptVersionen[0];
          const isLocalDemo = rezept.id < 0;
          return (
            <Card key={rezept.id} className={rezept.archiviert ? "opacity-80" : undefined}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      {isLocalDemo ? (
                        rezept.name
                      ) : (
                        <Link href={`/rezepte/${rezept.id}`} className="hover:underline">
                          {rezept.name}
                        </Link>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {rezeptVersionen.length} Version{rezeptVersionen.length === 1 ? "" : "en"}
                      {aktuelleVersion ? ` · neueste v${aktuelleVersion.versionsnummer}` : ""}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {aktuelleVersion ? <RezeptStatusBadge status={aktuelleVersion.status} /> : null}
                    {rezept.archiviert ? <ArchivBadge /> : null}
                    {isLocalDemo ? <Badge variant="outline">Demo</Badge> : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {rezept.beschreibung ?? "Keine Beschreibung."}
                </p>
                {aktuelleVersion ? (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {formatLiters(aktuelleVersion.ziel_ausschlagmenge_l)}
                    </Badge>
                    <Badge variant="outline">
                      {formatPlato(aktuelleVersion.ziel_stammwuerze_plato)}
                    </Badge>
                    <Badge variant="outline">
                      {formatPercent(aktuelleVersion.ziel_abv_prozent)} ABV
                    </Badge>
                    <Badge variant="outline">{aktuelleVersion.ziel_ibu ?? "—"} IBU</Badge>
                    <Badge variant="outline">{aktuelleVersion.ziel_ebc ?? "—"} EBC</Badge>
                  </div>
                ) : null}
                {isLocalDemo ? (
                  <Button variant="outline" className="w-full" disabled>
                    Lokales Demo-Rezept
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/rezepte/${rezept.id}`}>Rezept öffnen</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
