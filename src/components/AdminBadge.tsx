import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

export function AdminBadge() {
  return (
    <Badge
      variant="destructive"
      className="bg-red-600 text-white border-red-700 flex items-center gap-1 font-medium text-xs"
    >
      <Shield className="h-3 w-3" />
      Admin
    </Badge>
  );
}
