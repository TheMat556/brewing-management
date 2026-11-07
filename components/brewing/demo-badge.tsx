import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DemoBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-dashed">
      <FlaskConical className="size-3" />
      Demo-Daten
    </Badge>
  );
}
