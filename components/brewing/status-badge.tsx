import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/database.types";
import {
  lagerbewegungTypLabels,
  rezeptversionStatusLabels,
  rohstoffKategorieLabels,
  sudStatusLabels,
} from "@/lib/labels";
import { cn } from "@/lib/utils";

type SudStatus = Database["public"]["Enums"]["sud_status"];
type RezeptversionStatus = Database["public"]["Enums"]["rezeptversion_status"];
type LagerbewegungTyp = Database["public"]["Enums"]["lagerbewegung_typ"];
type RohstoffKategorie = Database["public"]["Enums"]["rohstoff_kategorie"];

const sudStatusClasses: Record<SudStatus, string> = {
  GEPLANT:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  IN_ARBEIT:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  ABGESCHLOSSEN:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  VERWORFEN: "border-destructive/30 bg-destructive/10 text-destructive",
};

const rezeptStatusClasses: Record<RezeptversionStatus, string> = {
  ENTWURF:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  FREIGEGEBEN:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
};

const bewegungClasses: Record<LagerbewegungTyp, string> = {
  ZUGANG:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  VERBRAUCH: "border-border bg-muted text-foreground",
  KORREKTUR:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  ENTSORGUNG: "border-destructive/30 bg-destructive/10 text-destructive",
};

const kategorieClasses: Record<RohstoffKategorie, string> = {
  MALZ: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  HOPFEN:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  HEFE: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
  GEWUERZ:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300",
  SONSTIGES: "border-border bg-muted text-muted-foreground",
};

export function SudStatusBadge({ status }: { status: SudStatus }) {
  return (
    <Badge variant="outline" className={cn(sudStatusClasses[status])}>
      {sudStatusLabels[status]}
    </Badge>
  );
}

export function RezeptStatusBadge({ status }: { status: RezeptversionStatus }) {
  return (
    <Badge variant="outline" className={cn(rezeptStatusClasses[status])}>
      {rezeptversionStatusLabels[status]}
    </Badge>
  );
}

export function BewegungTypBadge({ typ }: { typ: LagerbewegungTyp }) {
  return (
    <Badge variant="outline" className={cn(bewegungClasses[typ])}>
      {lagerbewegungTypLabels[typ]}
    </Badge>
  );
}

export function KategorieBadge({ kategorie }: { kategorie: RohstoffKategorie }) {
  return (
    <Badge variant="outline" className={cn(kategorieClasses[kategorie])}>
      {rohstoffKategorieLabels[kategorie]}
    </Badge>
  );
}

export function ArchivBadge() {
  return (
    <Badge variant="outline" className="border-border bg-muted text-muted-foreground">
      Archiviert
    </Badge>
  );
}
