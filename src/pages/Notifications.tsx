import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Search, AlertCircle, Info, AlertTriangle, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todas");
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUserId();
  }, []);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*, profiles:created_by(nome_completo)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      if (!userId) return;

      const { data: notification } = await supabase
        .from("notifications")
        .select("read_by")
        .eq("id", notificationId)
        .single();

      if (!notification) return;

      const readBy = notification.read_by || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
      }

      const { error } = await supabase
        .from("notifications")
        .update({ read_by: readBy })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "alerta":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "prioridade":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const filteredNotifications = notifications?.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase());

    const isRead = userId ? n.read_by?.includes(userId) : false;
    const matchesTab =
      activeTab === "todas" || (activeTab === "nao-lidas" && !isRead);

    return matchesSearch && matchesTab;
  });

  const unreadCount = notifications?.filter(
    (n) => userId && !n.read_by?.includes(userId)
  ).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              🔔 Notificações
            </h1>
            <p className="text-muted-foreground">
              Acompanhe avisos e comunicados importantes
            </p>
          </div>
          {isAdmin && (
            <Button
<<<<<<< HEAD
              className="bg-secondary hover:bg-secondary/90 text-white"
=======
              className="bg-primary hover:bg-primary/90"
>>>>>>> 486f461a9dafad709f4a63825cc535b9b4f24deb
              onClick={() => navigate("/admin/notifications/create")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Notificação
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar notificações..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card/50 border-border"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="todas">
            Todas ({notifications?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="nao-lidas">
            Não Lidas ({unreadCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredNotifications && filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const isRead = userId ? notification.read_by?.includes(userId) : false;
              return (
                <Card
                  key={notification.id}
                  className={`border-border bg-card/50 backdrop-blur-sm cursor-pointer hover:shadow-elegant transition-all ${
                    !isRead ? "border-l-4 border-l-primary" : ""
                  }`}
                  onClick={() => {
                    if (!isRead) {
                      markAsReadMutation.mutate(notification.id);
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {getIcon(notification.type)}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                              {notification.title}
                            </CardTitle>
                            {!isRead && (
                              <Badge variant="default" className="text-xs">
                                Nova
                              </Badge>
                            )}
                            {notification.priority === "alta" && (
                              <Badge variant="destructive" className="text-xs">
                                Alta Prioridade
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{notification.message}</p>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-border bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {activeTab === "nao-lidas"
                    ? "Você não tem notificações não lidas"
                    : "Nenhuma notificação encontrada"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
