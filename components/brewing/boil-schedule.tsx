import { Flame } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/format";

export type BoilAddition = {
  id: number | string;
  name: string;
  menge: number;
  einheit: string;
  alphasaeureProzent?: number | null;
  zugabeNachStartMin: number | null;
  istMenge?: number | null;
  notizen?: string | null;
};

function timingLabel(vorKochende: number | null): string {
  if (vorKochende === null) {
    return "ohne Zeit";
  }
  if (vorKochende > 0) {
    return `T-${formatNumber(vorKochende)} Min.`;
  }
  if (vorKochende === 0) {
    return "Kochende";
  }
  return `T+${formatNumber(Math.abs(vorKochende))} Min.`;
}

export function BoilSchedule({
  dauerMin,
  additions,
  showActual = false,
}: {
  dauerMin: number | null;
  additions: BoilAddition[];
  showActual?: boolean;
}) {
  const sorted = [...additions].sort((a, b) => {
    const aOffset = a.zugabeNachStartMin ?? Number.POSITIVE_INFINITY;
    const bOffset = b.zugabeNachStartMin ?? Number.POSITIVE_INFINITY;
    return aOffset - bOffset || a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-4 text-muted-foreground" />
          Würzekochen
        </CardTitle>
        <CardDescription>
          Kochplan mit Zugaben relativ zum Kochende.
          {dauerMin !== null ? ` Kochdauer: ${formatNumber(dauerMin)} Minuten.` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Keine Zutaten für das Würzekochen hinterlegt.
          </p>
        ) : (
          <ol className="space-y-3">
            {sorted.map((addition) => {
              const vorKochende =
                dauerMin !== null && addition.zugabeNachStartMin !== null
                  ? dauerMin - addition.zugabeNachStartMin
                  : null;
              return (
                <li
                  key={addition.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <Badge variant="outline" className="w-fit justify-center sm:w-28">
                    {timingLabel(vorKochende)}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{addition.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(addition.menge)} {addition.einheit}
                      {addition.alphasaeureProzent !== null &&
                      addition.alphasaeureProzent !== undefined
                        ? ` · Alpha ${formatPercent(addition.alphasaeureProzent)}`
                        : ""}
                      {showActual
                        ? ` · Ist ${
                            addition.istMenge === null || addition.istMenge === undefined
                              ? "—"
                              : `${formatNumber(addition.istMenge)} ${addition.einheit}`
                          }`
                        : ""}
                    </p>
                    {addition.notizen ? (
                      <p className="mt-1 text-xs text-muted-foreground">{addition.notizen}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Die T-Minus-Zeiten werden aus der Zugabezeit relativ zum Schrittstart und der Kochdauer
          berechnet. Das Datenmodell speichert keine separaten „vor Kochende“-Werte.
        </p>
      </CardContent>
    </Card>
  );
}
