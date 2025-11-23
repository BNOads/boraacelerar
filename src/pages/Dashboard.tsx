import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, Trophy, BookOpen, Rocket, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";

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

export default function Dashboard() {
  const { isAdmin } = useIsAdmin();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [acelerometro, setAcelerometro] = useState<AcelerometroData | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("nome_completo, apelido")
          .eq("id", user.id)
          .single();
        
        setProfile(profileData);

        if (isAdmin) {
          // Buscar estatísticas para admin
          
          // Total de mentorados ativos
          const { count: totalMentorados } = await supabase
            .from("mentorados")
            .select("*", { count: "exact", head: true })
            .eq("status", "ativo");

          // Faturamento total e médio
          const { data: allDesempenho } = await supabase
            .from("desempenho_mensal")
            .select("faturamento_mensal, mentorado_id");

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

          // Buscar faixas de premiação
          const { data: premiacoes } = await supabase
            .from("premiacoes")
            .select("*")
            .order("min_faturamento", { ascending: true });

          // Para cada mentorado, pegar o faturamento mais recente
          const { data: mentoradosAtivos } = await supabase
            .from("mentorados")
            .select("id")
            .eq("status", "ativo");

          const distribuicaoFaixas: Record<string, number> = {};
          
          if (premiacoes) {
            premiacoes.forEach(p => {
              distribuicaoFaixas[p.faixa] = 0;
            });
          }

          if (mentoradosAtivos && premiacoes) {
            for (const mentorado of mentoradosAtivos) {
              const { data: ultimoDesempenho } = await supabase
                .from("desempenho_mensal")
                .select("faturamento_mensal")
                .eq("mentorado_id", mentorado.id)
                .order("mes_ano", { ascending: false })
                .limit(1)
                .maybeSingle();

              const faturamento = ultimoDesempenho?.faturamento_mensal || 0;

              // Encontrar faixa correspondente
              const faixa = premiacoes.find(p => {
                const acimaDe = faturamento >= p.min_faturamento;
                const abaixoDe = p.max_faturamento === null || faturamento <= p.max_faturamento;
                return acimaDe && abaixoDe;
              });

              if (faixa) {
                distribuicaoFaixas[faixa.faixa]++;
              }
            }
          }

          const distribuicaoArray = premiacoes?.map(p => ({
            faixa: p.faixa,
            quantidade: distribuicaoFaixas[p.faixa] || 0,
            min_faturamento: p.min_faturamento,
            max_faturamento: p.max_faturamento,
          })) || [];

          setAdminStats({
            total_mentorados: totalMentorados || 0,
            faturamento_medio_mensal: faturamentoMedio,
            faturamento_acumulado_total: faturamentoTotal,
            distribuicao_faixas: distribuicaoArray,
          });
        } else {
          // Buscar mentorado_id
          const { data: mentoradoData } = await supabase
            .from("mentorados")
            .select("id, meta_clientes")
            .eq("user_id", user.id)
            .maybeSingle();

          if (mentoradoData) {
            // Buscar dados de desempenho
            const { data: desempenhoData } = await supabase
              .from("desempenho_mensal")
              .select("faturamento_mensal, clientes_mes")
              .eq("mentorado_id", mentoradoData.id);

            if (desempenhoData && desempenhoData.length > 0) {
              const faturamentoAcumulado = desempenhoData.reduce(
                (acc, item) => acc + (item.faturamento_mensal || 0),
                0
              );
              const maiorFaturamento = Math.max(
                ...desempenhoData.map(item => item.faturamento_mensal || 0)
              );
              const clientesAtuais = desempenhoData[desempenhoData.length - 1]?.clientes_mes || 0;

              setAcelerometro({
                clientes_atuais: clientesAtuais,
                faturamento_acumulado: faturamentoAcumulado,
                maior_faturamento: maiorFaturamento,
              });
            }
          }
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [isAdmin]);

  const quickAccessCards = [
    { title: "Próximo Encontro", icon: Calendar, link: "/agenda", color: "from-primary/20 to-primary/5" },
    { title: "Trilha de Aceleração", icon: BookOpen, link: "/trilha", color: "from-primary/20 to-primary/5" },
    { title: "Meus Resultados", icon: TrendingUp, link: "/resultados", color: "from-primary/20 to-primary/5" },
    { title: "Prêmio Profissional", icon: Trophy, link: "/premio", color: "from-primary/20 to-primary/5" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickAccessCards.map((card) => (
          <Link key={card.title} to={card.link}>
            <Card className="hover:scale-105 transition-transform duration-300 cursor-pointer bg-gradient-to-br border-border shadow-card hover:shadow-glow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <card.icon className="h-8 w-8 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg text-foreground">{card.title}</CardTitle>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Acelerômetro Preview - Admin ou Mentorado */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground flex items-center gap-2">
            {isAdmin ? <Users className="h-6 w-6 text-primary" /> : <TrendingUp className="h-6 w-6 text-primary" />}
            {isAdmin ? "Estatísticas da Mentoria" : "Acelerômetro"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAdmin && adminStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-4xl font-bold text-primary mb-2">{adminStats.total_mentorados}</p>
                  <p className="text-sm text-muted-foreground">Mentorados Ativos</p>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-4xl font-bold text-primary mb-2">
                    R$ {adminStats.faturamento_acumulado_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-4xl font-bold text-primary mb-2">{acelerometro?.clientes_atuais || 0}</p>
                  <p className="text-sm text-muted-foreground">Clientes Atuais</p>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-4xl font-bold text-primary mb-2">
                    R$ {acelerometro?.maior_faturamento?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </p>
                  <p className="text-sm text-muted-foreground">Maior Faturamento Mensal</p>
                </div>
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <p className="text-4xl font-bold text-primary mb-2">
                    R$ {acelerometro?.faturamento_acumulado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Feed de Novidades */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Novidades 📰</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Fique ligado! Em breve novos conteúdos e gravações serão liberados aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}