import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video } from "lucide-react";
import { format, parseISO, differenceInDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { AdminAgendaDialog } from "@/components/AdminAgendaDialog";
import { AdminImportarAgendaDialog } from "@/components/AdminImportarAgendaDialog";
import { AdminImportarEncontrosDialog } from "@/components/AdminImportarEncontrosDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function Agenda() {
  const { isAdmin } = useIsAdmin();

  const getDaysUntilMeeting = (dataHora: string) => {
    const today = startOfDay(new Date());
    const meetingDate = startOfDay(new Date(dataHora));
    return differenceInDays(meetingDate, today);
  };

  const getCountdownBadge = (days: number) => {
    if (days === 0) {
      return <Badge className="bg-green-500 text-white font-bold">HOJE!</Badge>;
    } else if (days === 1) {
      return <Badge className="bg-yellow-500 text-white font-bold">AMANHÃ</Badge>;
    } else if (days <= 7) {
      return <Badge variant="outline" className="font-semibold">{days} dias</Badge>;
    } else {
      return <Badge variant="secondary">{days} dias</Badge>;
    }
  };

  const { data: encontros, isLoading } = useQuery({
    queryKey: ["agenda"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agenda_mentoria")
        .select("*")
        .order("data_hora", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const proximosEncontros = encontros?.filter(
    (e) => new Date(e.data_hora) >= new Date()
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              📅 Agenda de Mentorias
            </h1>
            <p className="text-muted-foreground">
              Confira os próximos encontros e não perca nenhuma oportunidade de acelerar!
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <AdminImportarEncontrosDialog />
              <AdminImportarAgendaDialog />
              <AdminAgendaDialog />
            </div>
          )}
        </div>
      </div>

      {/* Próximos Encontros */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Próximos Encontros</h2>
        
        {proximosEncontros && proximosEncontros.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {proximosEncontros.map((encontro) => {
              const daysUntil = getDaysUntilMeeting(encontro.data_hora);
              return (
              <Card
                key={encontro.id}
                className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <CardTitle className="text-lg text-foreground">
                      {encontro.titulo}
                    </CardTitle>
                    <div className="flex gap-2 shrink-0">
                      {getCountdownBadge(daysUntil)}
                      <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        {encontro.tipo}
                      </span>
                    </div>
                  </div>
                  <CardDescription>{encontro.descricao}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(parseISO(encontro.data_hora), "dd 'de' MMMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {format(parseISO(encontro.data_hora), "HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {encontro.link_zoom && (
                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                      onClick={() => window.open(encontro.link_zoom, "_blank")}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Entrar na Sala
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
            })}
          </div>
        ) : (
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum encontro agendado no momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
