import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export function AdminBadge() {
  return (
    <Badge
      variant="secondary"
      className="bg-secondary/20 text-secondary dark:text-secondary border-secondary/30 flex items-center gap-1 font-medium text-xs"
    >
      <Shield className="h-3 w-3" />
      Admin
    </Badge>
  );
}
