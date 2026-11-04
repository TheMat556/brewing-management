import { cn } from "@/lib/utils";

export function TargetActual({
  label,
  target,
  actual,
  className,
}: {
  label: string;
  target: string;
  actual: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-lg font-semibold tabular-nums">{actual}</span>
        <span className="text-xs text-muted-foreground">Ist</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Ziel: <span className="tabular-nums">{target}</span>
      </p>
    </div>
  );
}
