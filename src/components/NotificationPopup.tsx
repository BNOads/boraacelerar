import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Info, AlertTriangle } from "lucide-react";

export function NotificationPopup() {
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: unreadNotifications } = useQuery({
    queryKey: ["notifications-popup"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      // Filtrar notificações não lidas
      const unread = data.filter(
        (notification: any) => !notification.read_by?.includes(user.id)
      );

      return unread;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: notification } = await supabase
        .from("notifications")
        .select("read_by")
        .eq("id", notificationId)
        .single();

      if (!notification) return;

      const readBy = notification.read_by || [];
      if (!readBy.includes(user.id)) {
        readBy.push(user.id);
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read_by: readBy })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-popup"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
    },
  });

  useEffect(() => {
    if (unreadNotifications && unreadNotifications.length > 0) {
      setCurrentNotification(unreadNotifications[0]);
      setOpen(true);
    }
  }, [unreadNotifications]);

  const handleClose = () => {
    if (currentNotification) {
      markAsReadMutation.mutate(currentNotification.id);
    }
    setOpen(false);
    setCurrentNotification(null);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "alerta":
        return <AlertCircle className="h-8 w-8 text-orange-500" />;
      case "prioridade":
        return <AlertTriangle className="h-8 w-8 text-red-500" />;
      default:
        return <Info className="h-8 w-8 text-blue-500" />;
    }
  };

  if (!currentNotification) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon(currentNotification.type)}
            <DialogTitle className="text-xl">{currentNotification.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base text-foreground">
            {currentNotification.message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleClose}
            className="bg-primary hover:bg-primary/90"
          >
            OK, Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
