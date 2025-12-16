import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, Trophy, BookOpen, Rocket, Users, Clock, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { format, differenceInDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
interface Profile {
  nome_completo: string;
  apelido: string | null;
}
interface AcelerometroData {
  clientes_atuais: number;
  faturamento_acumulado: number;
  maior_faturamento: number;
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
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  created_at: string;
}
export default function Dashboard() {
  const {
    isAdmin
  } = useIsAdmin();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [acelerometro, setAcelerometro] = useState<AcelerometroData | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [proximosEncontros, setProximosEncontros] = useState<AgendaItem[]>([]);
  const [notificacoes, setNotificacoes] = useState<Notification[]>([]);
  const [paginaNotificacoes, setPaginaNotificacoes] = useState(1);
  const [totalNotificacoes, setTotalNotificacoes] = useState(0);
  const [loading, setLoading] = useState(true);
  const NOTIFICACOES_POR_PAGINA = 3;
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

        // Buscar próximos encontros da agenda
        const {
          data: agendaData
        } = await supabase.from("agenda_mentoria").select("*").gte("data_hora", new Date().toISOString()).order("data_hora", {
          ascending: true
        }).limit(3);
        if (agendaData) {
          setProximosEncontros(agendaData);
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
        } else {
          // Buscar mentorado_id
          const {
            data: mentoradoData
          } = await supabase.from("mentorados").select("id, meta_clientes").eq("user_id", user.id).maybeSingle();
          if (mentoradoData) {
            // Buscar dados de desempenho
            const {
              data: desempenhoData
            } = await supabase.from("desempenho_mensal").select("faturamento_mensal, clientes_mes").eq("mentorado_id", mentoradoData.id);
            if (desempenhoData && desempenhoData.length > 0) {
              const faturamentoAcumulado = desempenhoData.reduce((acc, item) => acc + (item.faturamento_mensal || 0), 0);
              const maiorFaturamento = Math.max(...desempenhoData.map(item => item.faturamento_mensal || 0));
              const clientesAtuais = desempenhoData[desempenhoData.length - 1]?.clientes_mes || 0;
              setAcelerometro({
                clientes_atuais: clientesAtuais,
                faturamento_acumulado: faturamentoAcumulado,
                maior_faturamento: maiorFaturamento
              });
            }
          }
        }
      }
      setLoading(false);
    };
    fetchData();
    fetchNotificacoes();
  }, [isAdmin]);
  useEffect(() => {
    fetchNotificacoes();
  }, [paginaNotificacoes]);
  const fetchNotificacoes = async () => {
    // Contar total de notificações
    const {
      count
    } = await supabase.from("notifications").select("*", {
      count: "exact",
      head: true
    }).eq("is_active", true).eq("visible_to", "all");
    setTotalNotificacoes(count || 0);

    // Buscar notificações da página atual
    const {
      data: notifData
    } = await supabase.from("notifications").select("*").eq("is_active", true).eq("visible_to", "all").order("created_at", {
      ascending: false
    }).range((paginaNotificacoes - 1) * NOTIFICACOES_POR_PAGINA, paginaNotificacoes * NOTIFICACOES_POR_PAGINA - 1);
    if (notifData) {
      setNotificacoes(notifData);
    }
  };
  const totalPaginasNotificacoes = Math.ceil(totalNotificacoes / NOTIFICACOES_POR_PAGINA);
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
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "urgente":
        return "bg-destructive text-destructive-foreground";
      case "aviso":
        return "bg-yellow-500 text-white";
      case "informacao":
      default:
        return "bg-primary text-primary-foreground";
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
          <Rocket className="h-8 w-8 text-primary animate-glow-pulse" />
          <h1 className="text-4xl font-bold text-foreground">
            Bem-vindo(a), {profile?.apelido || profile?.nome_completo?.split(' ')[0]}! 🚀
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          Continue sua jornada de aceleração rumo ao sucesso
        </p>
      </div>

      {/* Quick Access Cards */}
      

      {/* Acelerômetro Preview - Admin ou Mentorado */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground flex items-center gap-2">
            {isAdmin ? <Users className="h-6 w-6 text-primary" /> : <TrendingUp className="h-6 w-6 text-primary" />}
            {isAdmin ? "Estatísticas da Mentoria" : "Acelerômetro"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAdmin && adminStats ? <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-4xl font-bold text-primary mb-2">{adminStats.total_mentorados}</p>
                  <p className="text-sm text-muted-foreground">Mentorados Ativos</p>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-4xl font-bold text-primary mb-2">
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
            </> : <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-4xl font-bold text-primary mb-2">{acelerometro?.clientes_atuais || 0}</p>
                  <p className="text-sm text-muted-foreground">Clientes Atuais</p>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="font-bold text-primary mb-2 text-4xl font-sans">
                    R$ {acelerometro?.maior_faturamento?.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                }) || '0,00'}
                  </p>
                  <p className="text-sm text-muted-foreground">Maior Faturamento Mensal</p>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-4xl font-bold text-primary mb-2">
                    R$ {acelerometro?.faturamento_acumulado?.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2
                }) || '0,00'}
                  </p>
                  <p className="text-sm text-muted-foreground">Faturamento Acumulado</p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <Link to="/resultados">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Ver Minha Evolução Completa
                  </Button>
                </Link>
              </div>
            </>}
        </CardContent>
      </Card>

      {/* Próximos Encontros */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <CardTitle className="text-foreground">Próximos Encontros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {proximosEncontros.length > 0 ? <div className="space-y-3">
              {proximosEncontros.map(encontro => {
            const daysUntil = getDaysUntilMeeting(encontro.data_hora);
            return <div key={encontro.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {encontro.tipo}
                        </Badge>
                        {getCountdownBadge(daysUntil)}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(encontro.data_hora), "dd 'de' MMMM 'às' HH:mm", {
                        locale: ptBR
                      })}
                        </div>
                      </div>
                      <h4 className="font-semibold text-foreground mb-1">{encontro.titulo}</h4>
                      {encontro.descricao && <p className="text-sm text-muted-foreground line-clamp-2">
                          {encontro.descricao}
                        </p>}
                    </div>
                    {encontro.link_zoom && <Button size="sm" asChild>
                        <a href={encontro.link_zoom} target="_blank" rel="noopener noreferrer">
                          Acessar
                        </a>
                      </Button>}
                  </div>
                </div>;
          })}
              <div className="pt-2">
                <Link to="/agenda">
                  <Button variant="outline" className="w-full">
                    Ver Agenda Completa
                  </Button>
                </Link>
              </div>
            </div> : <p className="text-muted-foreground text-center py-4">
              Nenhum encontro agendado no momento.
            </p>}
        </CardContent>
      </Card>

      {/* Feed de Novidades */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <CardTitle className="text-foreground">Novidades</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {notificacoes.length > 0 ? <div className="space-y-4">
              <div className="space-y-3">
                {notificacoes.map(notif => <div key={notif.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getNotificationColor(notif.type)}>
                            {notif.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notif.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR
                      })}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground mb-1">{notif.title}</h4>
                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                      </div>
                    </div>
                  </div>)}
              </div>

              {totalPaginasNotificacoes > 1 && <div className="flex items-center justify-between pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={() => setPaginaNotificacoes(prev => Math.max(1, prev - 1))} disabled={paginaNotificacoes === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {paginaNotificacoes} de {totalPaginasNotificacoes}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setPaginaNotificacoes(prev => Math.min(totalPaginasNotificacoes, prev + 1))} disabled={paginaNotificacoes === totalPaginasNotificacoes}>
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>}
            </div> : <p className="text-muted-foreground text-center py-4">
              Nenhuma novidade no momento.
            </p>}
        </CardContent>
      </Card>
    </div>;
}