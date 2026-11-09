import { ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/brewing/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { aktuellerBenutzer } from "@/lib/demo";

export default function EinstellungenPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Einstellungen"
        description="Konto- und Zugangsinformationen für die Demo-Anwendung."
        actions={
          <Button asChild>
            <Link href="/einstellungen/zugang">
              <ShieldCheck />
              Zugang verwalten
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Konto</CardTitle>
            <CardDescription>Angemeldeter Demo-Benutzer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <UserRound className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{aktuellerBenutzer.name}</p>
                <p className="text-muted-foreground">{aktuellerBenutzer.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t pt-4">
              <span className="text-muted-foreground">Rolle</span>
              <span className="font-medium">{aktuellerBenutzer.rolle}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Die echte Anmeldung läuft weiterhin über Supabase Auth. In dieser Phase werden die
              Kontoangaben aus Demo-Daten angezeigt.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anwendung</CardTitle>
            <CardDescription>Aktueller Stand der Brewing-Management-App.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Datenquelle</span>
              <span className="font-medium">Demo-Datensatz</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Supabase-Anbindung</span>
              <span className="font-medium">Noch nicht aktiv</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Berechnungen</span>
              <span className="font-medium">Keine ABV/IBU/EBC-Formeln</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Die UI zeigt ausschließlich gespeicherte Ziel- und Ist-Werte sowie abgeleitete
              Bestände aus Bewegungen.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
