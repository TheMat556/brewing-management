import { ArrowLeft, CheckCircle2, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/brewing/page-header";
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
import { aktuellerBenutzer, berechtigteBenutzer, demoBenutzer } from "@/lib/demo";
import { formatDate } from "@/lib/format";

export default function ZugangPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Zugang"
        description="Single-Owner-Allowlist: Authentifizierung allein reicht nicht. Nur Benutzer in TB_BERECHTIGTER_BENUTZER erhalten Zugriff auf Domänendaten."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/einstellungen">
                <ArrowLeft />
                Zurück
              </Link>
            </Button>
            <DemoActionButton
              label="Benutzer freischalten"
              title="Benutzer freischalten"
              description="Einen authentifizierten Benutzer zur Single-Owner-Allowlist hinzufügen."
              submitLabel="Freischaltung vorbereiten"
              icon={<UserPlus />}
              successMessage="Demo-Freischaltung vorbereitet."
              fields={[
                {
                  kind: "email",
                  name: "email",
                  label: "E-Mail",
                  placeholder: "benutzer@example.com",
                  required: true,
                  hint: "Der Benutzer muss bereits über Supabase Auth existieren.",
                },
                {
                  kind: "select",
                  name: "rolle",
                  label: "Rolle",
                  required: true,
                  defaultValue: "Betrachter",
                  options: [
                    { value: "Betrachter", label: "Betrachter" },
                    { value: "Brauer", label: "Brauer" },
                    { value: "Administrator", label: "Administrator" },
                  ],
                  hint: "Rollen sind aktuell nur Demo-Metadaten; die Allowlist speichert die Benutzer-ID.",
                },
              ]}
            />
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Eigentümer</CardTitle>
            <CardDescription>Der erste Benutzer beansprucht den Zugang.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="font-medium">{aktuellerBenutzer.name}</p>
                <p className="text-muted-foreground">{aktuellerBenutzer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 className="size-4 shrink-0" />
              <span className="text-xs">Zugang wurde bereits beansprucht.</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Seit</span>
              <span className="font-medium">{formatDate(aktuellerBenutzer.erstellt_am)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Berechtigte Benutzer</CardTitle>
            <CardDescription>
              {berechtigteBenutzer.length} Einträge in der Allowlist. Weitere Benutzer sehen keine
              Domänendaten, selbst wenn sie angemeldet sind.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead className="hidden sm:table-cell">Freigeschaltet am</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoBenutzer.map((benutzer) => (
                    <TableRow key={benutzer.benutzer_id}>
                      <TableCell className="font-medium">{benutzer.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {benutzer.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={benutzer.rolle === "Eigentümer" ? "default" : "outline"}>
                          {benutzer.rolle}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                        {formatDate(benutzer.erstellt_am)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          Aktiv
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wie der Zugriff im echten System funktioniert</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="font-medium text-foreground">1. Anmelden</p>
            <p className="mt-1">Supabase Auth prüft die Anmeldedaten und setzt die Session.</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium text-foreground">2. Allowlist prüfen</p>
            <p className="mt-1">
              RLS und RPCs verlangen einen Eintrag in TB_BERECHTIGTER_BENUTZER.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="font-medium text-foreground">3. Zugang beanspruchen</p>
            <p className="mt-1">
              Der erste Benutzer ruft zugang_beanspruchen() auf, bevor Domänendaten sichtbar sind.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
