import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Rocket, Clock, Video, Plus, Bell, AlertCircle, Info, AlertTriangle, ExternalLink, Edit, Link as LinkIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useQuery } from "@tanstack/react-query";
import { format, differenceInDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminAgendaDialog } from "@/components/AdminAgendaDialog";
import { AdminImportarAgendaDialog } from "@/components/AdminImportarAgendaDialog";
import { AdminImportarEncontrosDialog } from "@/components/AdminImportarEncontrosDialog";
import { AdminLinksDialog } from "@/components/AdminLinksDialog";
import { AdminImportarLinksDialog } from "@/components/AdminImportarLinksDialog";
import { EditarLinkDialog } from "@/components/EditarLinkDialog";
interface Profile {
  nome_completo: string;
  apelido: string | null;
}
interface AgendaItem {
  id: string;
  titulo: string;
  data_hora: string;
  tipo: string;
  link_zoom: string | null;
  descricao: string | null;
}
export default function Dashboard() {
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [proximosEncontros, setProximosEncontros] = useState<AgendaItem[]>([]);
  const [encontrosPassados, setEncontrosPassados] = useState<AgendaItem[]>([]);
  const [filtroAgenda, setFiltroAgenda] = useState<'proximos' | 'passados' | 'todos'>('proximos');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<any>(null);

  // Query para notificacoes
  const { data: notifications } = useQuery({
    queryKey: ["dashboard-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  // Query para links úteis
  const { data: links } = useQuery({
    queryKey: ["dashboard-links", isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("zoom_info")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alerta":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "prioridade":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("nome_completo, apelido")
          .eq("id", user.id)
          .single();
        setProfile(profileData);

        // Buscar todos os encontros da agenda
        const now = new Date().toISOString();
        const { data: agendaFutura } = await supabase
          .from("agenda_mentoria")
          .select("*")
          .gte("data_hora", now)
          .order("data_hora", { ascending: true });
        const { data: agendaPassada } = await supabase
          .from("agenda_mentoria")
          .select("*")
          .lt("data_hora", now)
          .order("data_hora", { ascending: false });

        if (agendaFutura) {
          setProximosEncontros(agendaFutura);
        }
        if (agendaPassada) {
          setEncontrosPassados(agendaPassada);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);
  const getDaysUntilMeeting = (dataHora: string) => {
    const today = startOfDay(new Date());
    const meetingDate = startOfDay(new Date(dataHora));
    return differenceInDays(meetingDate, today);
  };
  const getCountdownBadge = (days: number) => {
    if (days === 0) {
      return <Badge className="bg-green-500 text-white font-bold">HOJE!</Badge>;
    } else if (days === 1) {
      return <Badge className="bg-secondary text-white font-bold">AMANHÃ</Badge>;
    } else if (days <= 7) {
      return <Badge variant="outline" className="font-semibold">{days} dias</Badge>;
    } else {
      return <Badge variant="secondary">{days} dias</Badge>;
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>;
  }
  return <div className="space-y-6 animate-slide-in">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-card to-card/50 border border-border rounded-lg p-8 shadow-glow">
        <div className="flex items-center gap-3 mb-2">
          <Rocket className="h-8 w-8 text-secondary" strokeWidth={1.5} />
          <h1 className="text-4xl font-bold text-foreground">
            Bem-vindo(a), {profile?.apelido || profile?.nome_completo?.split(' ')[0]}! 🚀
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Continue sua jornada de aceleração rumo ao sucesso
        </p>
      </div>

      {/* Notificações */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Bell className="h-6 w-6 text-primary" />
              <CardTitle className="text-foreground">Avisos e Comunicados</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => navigate("/admin/notifications/create")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Notificação
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/notifications")}
              >
                Ver Todas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification: any) => {
                const isRead = userId ? notification.read_by?.includes(userId) : false;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                      !isRead ? "border-l-4 border-l-primary bg-primary/5" : ""
                    }`}
                    onClick={() => navigate("/notifications")}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-foreground">{notification.title}</h4>
                          {!isRead && (
                            <Badge variant="default" className="text-xs">Nova</Badge>
                          )}
                          {notification.priority === "alta" && (
                            <Badge variant="destructive" className="text-xs">Alta Prioridade</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum aviso no momento</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agenda Completa */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="h-6 w-6 text-secondary" />
              <CardTitle className="text-foreground">Agenda de Mentorias</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <div className="flex gap-2">
                  <AdminImportarEncontrosDialog />
                  <AdminImportarAgendaDialog />
                  <AdminAgendaDialog />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant={filtroAgenda === 'proximos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroAgenda('proximos')}
            >
              Próximos ({proximosEncontros.length})
            </Button>
            <Button
              variant={filtroAgenda === 'passados' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroAgenda('passados')}
            >
              Passados ({encontrosPassados.length})
            </Button>
            <Button
              variant={filtroAgenda === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroAgenda('todos')}
            >
              Todos ({proximosEncontros.length + encontrosPassados.length})
            </Button>
          </div>

          {/* Lista de Encontros */}
          {(() => {
            const encontrosExibir =
              filtroAgenda === 'proximos' ? proximosEncontros :
              filtroAgenda === 'passados' ? encontrosPassados :
              [...proximosEncontros, ...encontrosPassados].sort((a, b) =>
                new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime()
              );

            return encontrosExibir.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {encontrosExibir.map(encontro => {
                  const daysUntil = getDaysUntilMeeting(encontro.data_hora);
                  const isPast = new Date(encontro.data_hora) < new Date();

                  return (
                    <div
                      key={encontro.id}
                      className={`p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors ${isPast ? 'opacity-75' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {encontro.tipo}
                            </Badge>
                            {!isPast && getCountdownBadge(daysUntil)}
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(encontro.data_hora), "dd 'de' MMMM 'às' HH:mm", {
                                locale: ptBR
                              })}
                            </div>
                          </div>
                          <h4 className="font-semibold text-foreground mb-1">{encontro.titulo}</h4>
                          {encontro.descricao && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {encontro.descricao}
                            </p>
                          )}
                        </div>
                        {encontro.link_zoom && !isPast && (
                          <Button size="sm" asChild>
                            <a href={encontro.link_zoom} target="_blank" rel="noopener noreferrer">
                              <Video className="h-4 w-4 mr-1" />
                              Acessar
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhum encontro encontrado.
              </p>
            );
          })()}
        </CardContent>
      </Card>

      {/* Links Úteis */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LinkIcon className="h-6 w-6 text-primary" />
              <CardTitle className="text-foreground">Links Úteis</CardTitle>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <AdminImportarLinksDialog />
                <AdminLinksDialog />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {links && links.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {links.map((link: any) => (
                <div
                  key={link.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h4 className="font-semibold text-foreground">{link.titulo}</h4>
                    <div className="flex gap-1 items-center">
                      {!link.ativo && (
                        <Badge variant="secondary" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingLink(link)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    size="sm"
                    onClick={() => window.open(link.url_zoom, "_blank")}
                  >
                    Acessar
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum link disponível no momento</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição de Link */}
      {editingLink && (
        <EditarLinkDialog
          link={editingLink}
          open={!!editingLink}
          onOpenChange={(open) => !open && setEditingLink(null)}
        />
      )}

    </div>;
}