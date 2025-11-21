import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export function AdminBadge() {
  return (
    <Badge 
      variant="secondary" 
      className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 flex items-center gap-1 font-medium"
    >
      <Shield className="h-3 w-3" />
      Administrador
    </Badge>
  );
}
