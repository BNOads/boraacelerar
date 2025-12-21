import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, Trophy, BookOpen, Rocket, Users, Clock, Video, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { format, differenceInDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminAgendaDialog } from "@/components/AdminAgendaDialog";
import { AdminImportarAgendaDialog } from "@/components/AdminImportarAgendaDialog";
import { AdminImportarEncontrosDialog } from "@/components/AdminImportarEncontrosDialog";
interface Profile {
  nome_completo: string;
  apelido: string | null;
}
interface AdminStats {
  total_mentorados: number;
  faturamento_medio_mensal: number;
  faturamento_acumulado_total: number;
  distribuicao_faixas: {
    faixa: string;
    quantidade: number;
    min_faturamento: number;
    max_faturamento: number | null;
  }[];
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
  const {
    isAdmin
  } = useIsAdmin();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [proximosEncontros, setProximosEncontros] = useState<AgendaItem[]>([]);
  const [encontrosPassados, setEncontrosPassados] = useState<AgendaItem[]>([]);
  const [filtroAgenda, setFiltroAgenda] = useState<'proximos' | 'passados' | 'todos'>('proximos');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        const {
          data: profileData
        } = await supabase.from("profiles").select("nome_completo, apelido").eq("id", user.id).single();
        setProfile(profileData);

        // Buscar todos os encontros da agenda
        const now = new Date().toISOString();
        const {
          data: agendaFutura
        } = await supabase.from("agenda_mentoria").select("*").gte("data_hora", now).order("data_hora", {
          ascending: true
        });
        const {
          data: agendaPassada
        } = await supabase.from("agenda_mentoria").select("*").lt("data_hora", now).order("data_hora", {
          ascending: false
        });
        if (agendaFutura) {
          setProximosEncontros(agendaFutura);
        }
        if (agendaPassada) {
          setEncontrosPassados(agendaPassada);
        }
        if (isAdmin) {
          // Buscar estatísticas para admin - queries paralelas para performance
          const [
            { count: totalMentorados },
            { data: allDesempenho },
            { data: premiacoes },
            { data: mentoradosAtivos }
          ] = await Promise.all([
            supabase.from("mentorados").select("*", { count: "exact", head: true }).eq("status", "ativo"),
            supabase.from("desempenho_mensal").select("faturamento_mensal, mentorado_id, mes_ano"),
            supabase.from("premiacoes").select("*").order("min_faturamento", { ascending: true }),
            supabase.from("mentorados").select("id").eq("status", "ativo")
          ]);

          // Calcular faturamento total
          let faturamentoTotal = 0;
          let countRegistros = 0;
          if (allDesempenho) {
            allDesempenho.forEach(item => {
              if (item.faturamento_mensal) {
                faturamentoTotal += item.faturamento_mensal;
                countRegistros++;
              }
            });
          }
          const faturamentoMedio = countRegistros > 0 ? faturamentoTotal / countRegistros : 0;

          // Calcular distribuição de faixas usando dados já carregados
          const distribuicaoFaixas: Record<string, number> = {};
          if (premiacoes) {
            premiacoes.forEach(p => {
              distribuicaoFaixas[p.faixa] = 0;
            });
          }

          if (mentoradosAtivos && premiacoes && allDesempenho) {
            // Agrupar por mentorado e pegar o mais recente
            const ultimosPorMentorado: Record<string, { mes_ano: string; faturamento: number }> = {};
            allDesempenho.forEach(item => {
              const current = ultimosPorMentorado[item.mentorado_id];
              if (!current || item.mes_ano > current.mes_ano) {
                ultimosPorMentorado[item.mentorado_id] = {
                  mes_ano: item.mes_ano,
                  faturamento: item.faturamento_mensal || 0
                };
              }
            });

            // Calcular faixas apenas para mentorados ativos
            const mentoradosAtivosIds = new Set(mentoradosAtivos.map(m => m.id));
            Object.entries(ultimosPorMentorado).forEach(([mentoradoId, data]) => {
              if (!mentoradosAtivosIds.has(mentoradoId)) return;
              
              const faixa = premiacoes.find(p => {
                const acimaDe = data.faturamento >= p.min_faturamento;
                const abaixoDe = p.max_faturamento === null || data.faturamento <= p.max_faturamento;
                return acimaDe && abaixoDe;
              });
              if (faixa) {
                distribuicaoFaixas[faixa.faixa]++;
              }
            });
          }

          const distribuicaoArray = premiacoes?.map(p => ({
            faixa: p.faixa,
            quantidade: distribuicaoFaixas[p.faixa] || 0,
            min_faturamento: p.min_faturamento,
            max_faturamento: p.max_faturamento
          })) || [];

          setAdminStats({
            total_mentorados: totalMentorados || 0,
            faturamento_medio_mensal: faturamentoMedio,
            faturamento_acumulado_total: faturamentoTotal,
            distribuicao_faixas: distribuicaoArray
          });
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [isAdmin]);
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
  const quickAccessCards = [{
    title: "Próximo Encontro",
    icon: Calendar,
    link: "/agenda",
    color: "from-primary/20 to-primary/5"
  }, {
    title: "Trilha de Aceleração",
    icon: BookOpen,
    link: "/trilha",
    color: "from-primary/20 to-primary/5"
  }, {
    title: "Meus Resultados",
    icon: TrendingUp,
    link: "/resultados",
    color: "from-primary/20 to-primary/5"
  }, {
    title: "Prêmio Profissional",
    icon: Trophy,
    link: "/premio",
    color: "from-primary/20 to-primary/5"
  }];
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>;
  }
  return <div className="space-y-6 animate-slide-in">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-card to-card/50 border border-border rounded-lg p-8 shadow-glow">
        <div className="flex items-center gap-3 mb-2">
<<<<<<< HEAD
          <Rocket className="h-8 w-8 text-secondary" strokeWidth={1.5} />
=======
          <Rocket className="h-8 w-8 text-primary animate-glow-pulse" />
>>>>>>> 486f461a9dafad709f4a63825cc535b9b4f24deb
          <h1 className="text-4xl font-bold text-foreground">
            Bem-vindo(a), {profile?.apelido || profile?.nome_completo?.split(' ')[0]}! 🚀
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Continue sua jornada de aceleração rumo ao sucesso
        </p>
      </div>

      {/* Quick Access Cards */}


      {/* Estatísticas da Mentoria - Admin Only */}
      {isAdmin && adminStats && (
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-secondary" />
              Estatísticas da Mentoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-muted/30 rounded-lg">
                <p className="text-4xl font-bold text-secondary mb-2">{adminStats.total_mentorados}</p>
                <p className="text-sm text-muted-foreground">Mentorados Ativos</p>
              </div>
              <div className="text-center p-6 bg-muted/30 rounded-lg">
                <p className="text-4xl font-bold text-secondary mb-2">
                  R$ {adminStats.faturamento_acumulado_total.toLocaleString('pt-BR', {
                minimumFractionDigits: 2
              })}
                </p>
                <p className="text-sm text-muted-foreground">Faturamento Acumulado da Mentoria</p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/resultados">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Ver Resultados da Mentoria
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

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

    </div>;
}