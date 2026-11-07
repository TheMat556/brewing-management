"use client";

import { Plus } from "lucide-react";
import { useRef, useState } from "react";

import { BoilSchedule } from "@/components/brewing/boil-schedule";
import { DemoActionButton } from "@/components/demo/demo-action-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Rezeptschritt, Rezeptversion, Rezeptzutat, Rohstoff } from "@/lib/demo";
import { formatLiters, formatMinutes, formatNumber, formatPercent } from "@/lib/format";
import { basiseinheitLabels, prozessschrittTypLabels } from "@/lib/labels";

function optionalNumber(value: string | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function zugabeLabel(
  zutat: { zugabe_nach_min: number | null },
  schritt?: { typ: string; dauer_min: number | null },
): string {
  if (zutat.zugabe_nach_min === null) {
    return "—";
  }
  if (schritt?.typ === "KOCHEN" && schritt.dauer_min !== null) {
    const vorKochende = schritt.dauer_min - zutat.zugabe_nach_min;
    if (vorKochende > 0) {
      return `T-${formatNumber(vorKochende)} Min.`;
    }
    if (vorKochende === 0) {
      return "Kochende";
    }
    return `T+${formatNumber(Math.abs(vorKochende))} Min.`;
  }
  if (zutat.zugabe_nach_min === 0) {
    return "zu Beginn";
  }
  return `+${formatMinutes(zutat.zugabe_nach_min)}`;
}

export function RecipeVersionEditor({
  version,
  zutaten,
  schritte,
  rohstoffe,
}: {
  version: Rezeptversion;
  zutaten: Rezeptzutat[];
  schritte: Rezeptschritt[];
  rohstoffe: Rohstoff[];
}) {
  const [localZutaten, setLocalZutaten] = useState(zutaten);
  const [localSchritte, setLocalSchritte] = useState(schritte);
  const nextIngredientId = useRef(-1);
  const nextStepId = useRef(-1);

  const kochschritt = localSchritte.find((schritt) => schritt.typ === "KOCHEN");
  const kochzutaten = kochschritt
    ? localZutaten.filter((zutat) => zutat.rezeptschritt_id === kochschritt.id)
    : [];

  function addIngredient(values: Record<string, string>) {
    const rohstoff = rohstoffe.find((item) => String(item.id) === values.rohstoff);
    if (!rohstoff) {
      return;
    }
    const stepId =
      values.schritt && values.schritt !== "kein-schritt" ? Number(values.schritt) : null;
    const newIngredient: Rezeptzutat = {
      id: nextIngredientId.current--,
      rezeptversion_id: version.id,
      rohstoff_id: rohstoff.id,
      rezeptschritt_id: stepId,
      rohstoffname_snapshot: rohstoff.name,
      einheit_snapshot: values.einheit as Rezeptzutat["einheit_snapshot"],
      menge: Number(values.menge),
      alphasaeure_prozent: optionalNumber(values.alpha),
      ebc: optionalNumber(values.ebc),
      zugabe_nach_min: stepId === null ? null : optionalNumber(values.zugabe),
      notizen: values.notizen?.trim() || null,
    };
    setLocalZutaten((current) => [...current, newIngredient]);
  }

  function addStep(values: Record<string, string>) {
    const nextPosition = Math.max(0, ...localSchritte.map((schritt) => schritt.position)) + 1;
    const newStep: Rezeptschritt = {
      id: nextStepId.current--,
      rezeptversion_id: version.id,
      position: optionalNumber(values.position) ?? nextPosition,
      typ: values.typ as Rezeptschritt["typ"],
      name: values.name.trim(),
      temperatur_c: optionalNumber(values.temperatur),
      dauer_min: optionalNumber(values.dauer),
      wassermenge_l: optionalNumber(values.wasser),
      anweisung: values.anweisung?.trim() || null,
    };
    setLocalSchritte((current) => [...current, newStep].sort((a, b) => a.position - b.position));
  }

  return (
    <>
      <BoilSchedule
        dauerMin={kochschritt?.dauer_min ?? null}
        additions={kochzutaten.map((zutat) => ({
          id: zutat.id,
          name: zutat.rohstoffname_snapshot,
          menge: zutat.menge,
          einheit: basiseinheitLabels[zutat.einheit_snapshot],
          alphasaeureProzent: zutat.alphasaeure_prozent,
          zugabeNachStartMin: zutat.zugabe_nach_min,
          notizen: zutat.notizen,
        }))}
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Zutaten</CardTitle>
              <CardDescription>Mengen und Rohstoff-Snapshots dieser Version.</CardDescription>
            </div>
            <DemoActionButton
              label="Zutat hinzufügen"
              title="Rezeptzutat hinzufügen"
              description="Eine Zutat für diese Rezeptversion vorbereiten. Name und Einheit werden als Snapshot aus dem Rohstoff übernommen."
              submitLabel="Zutat übernehmen"
              icon={<Plus />}
              variant="outline"
              successMessage="Demo-Rezeptzutat hinzugefügt."
              onSubmit={addIngredient}
              fields={[
                {
                  kind: "select",
                  name: "rohstoff",
                  label: "Rohstoff",
                  required: true,
                  placeholder: "Rohstoff wählen",
                  options: rohstoffe
                    .filter((rohstoff) => !rohstoff.archiviert)
                    .map((rohstoff) => ({
                      value: String(rohstoff.id),
                      label: rohstoff.name,
                    })),
                  hint: "Name und Basiseinheit werden beim Speichern als Snapshot übernommen.",
                },
                {
                  kind: "number",
                  name: "menge",
                  label: "Menge",
                  required: true,
                  min: 0,
                  step: "0.0001",
                },
                {
                  kind: "select",
                  name: "einheit",
                  label: "Einheit",
                  required: true,
                  placeholder: "Einheit wählen",
                  options: [
                    { value: "g", label: "Gramm (g)" },
                    { value: "ml", label: "Milliliter (ml)" },
                    { value: "Stueck", label: "Stück" },
                  ],
                  hint: "Muss der Basiseinheit des gewählten Rohstoffs entsprechen.",
                },
                {
                  kind: "select",
                  name: "schritt",
                  label: "Prozessschritt",
                  placeholder: "Kein Schritt",
                  options: [
                    { value: "kein-schritt", label: "Kein Schritt" },
                    ...localSchritte.map((schritt) => ({
                      value: String(schritt.id),
                      label: `P${schritt.position} ${schritt.name}`,
                    })),
                  ],
                  hint: "Optional. Die Zugabezeit bezieht sich auf den Start dieses Schritts.",
                },
                {
                  kind: "number",
                  name: "alpha",
                  label: "Alpha-Säure (%)",
                  min: 0,
                  step: "0.1",
                  hint: "Optional; Hopfen-Annahme für diese Rezeptversion.",
                },
                {
                  kind: "number",
                  name: "ebc",
                  label: "EBC",
                  min: 0,
                  step: "0.1",
                  hint: "Optional; Malz-Farbe für diese Rezeptversion.",
                },
                {
                  kind: "number",
                  name: "zugabe",
                  label: "Zugabe nach Schrittstart (Min.)",
                  min: 0,
                  step: "0.1",
                  hint: "Bei Würzekochen wird daraus T-minus relativ zum Kochende berechnet.",
                },
                {
                  kind: "textarea",
                  name: "notizen",
                  label: "Notizen",
                  placeholder: "Optional",
                },
              ]}
            />
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rohstoff</TableHead>
                    <TableHead className="text-right">Menge</TableHead>
                    <TableHead>Schritt</TableHead>
                    <TableHead className="hidden sm:table-cell">Alpha / EBC</TableHead>
                    <TableHead className="hidden text-right md:table-cell">Zugabe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localZutaten.map((zutat) => {
                    const schritt = localSchritte.find(
                      (item) => item.id === zutat.rezeptschritt_id,
                    );
                    return (
                      <TableRow key={zutat.id}>
                        <TableCell className="font-medium">{zutat.rohstoffname_snapshot}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatNumber(zutat.menge)} {basiseinheitLabels[zutat.einheit_snapshot]}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {schritt ? `P${schritt.position} ${schritt.name}` : "—"}
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap text-muted-foreground sm:table-cell">
                          {zutat.alphasaeure_prozent !== null
                            ? formatPercent(zutat.alphasaeure_prozent)
                            : zutat.ebc !== null
                              ? `EBC ${formatNumber(zutat.ebc)}`
                              : "—"}
                        </TableCell>
                        <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                          {zugabeLabel(zutat, schritt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Schritte</CardTitle>
              <CardDescription>Reihenfolge und Prozesswerte der Rezeptversion.</CardDescription>
            </div>
            <DemoActionButton
              label="Schritt hinzufügen"
              title="Rezeptschritt hinzufügen"
              description="Einen weiteren Prozessschritt für diese Rezeptversion vorbereiten."
              submitLabel="Schritt übernehmen"
              icon={<Plus />}
              variant="outline"
              successMessage="Demo-Rezeptschritt hinzugefügt."
              onSubmit={addStep}
              fields={[
                {
                  kind: "number",
                  name: "position",
                  label: "Position",
                  required: true,
                  min: 1,
                  step: "1",
                  defaultValue: String(
                    Math.max(0, ...localSchritte.map((schritt) => schritt.position)) + 1,
                  ),
                },
                {
                  kind: "select",
                  name: "typ",
                  label: "Schritt-Typ",
                  required: true,
                  defaultValue: "RAST",
                  options: (
                    Object.keys(prozessschrittTypLabels) as Array<
                      keyof typeof prozessschrittTypLabels
                    >
                  ).map((typ) => ({
                    value: typ,
                    label: prozessschrittTypLabels[typ],
                  })),
                },
                {
                  kind: "text",
                  name: "name",
                  label: "Name",
                  required: true,
                  placeholder: "z. B. Läuterrast",
                },
                {
                  kind: "number",
                  name: "temperatur",
                  label: "Temperatur (°C)",
                  step: "0.1",
                  hint: "Optional; negative Temperaturen sind zulässig.",
                },
                {
                  kind: "number",
                  name: "dauer",
                  label: "Dauer (Min.)",
                  min: 0,
                  step: "0.1",
                },
                {
                  kind: "number",
                  name: "wasser",
                  label: "Wassermenge (L)",
                  min: 0,
                  step: "0.1",
                },
                {
                  kind: "textarea",
                  name: "anweisung",
                  label: "Anweisung",
                  placeholder: "Optional",
                },
              ]}
            />
          </CardHeader>
          <CardContent>
            <div className="w-full min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pos.</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Temperatur</TableHead>
                    <TableHead className="text-right">Dauer</TableHead>
                    <TableHead className="hidden text-right lg:table-cell">Wasser</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localSchritte.map((schritt) => (
                    <TableRow key={schritt.id}>
                      <TableCell className="tabular-nums">{schritt.position}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{prozessschrittTypLabels[schritt.typ]}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{schritt.name}</div>
                        {schritt.anweisung ? (
                          <div className="max-w-72 whitespace-normal text-xs text-muted-foreground">
                            {schritt.anweisung}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {schritt.temperatur_c === null
                          ? "—"
                          : `${formatNumber(schritt.temperatur_c)} °C`}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMinutes(schritt.dauer_min)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums lg:table-cell">
                        {formatLiters(schritt.wassermenge_l)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
