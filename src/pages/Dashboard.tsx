import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, TrendingUp, Trophy, BookOpen, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

interface Profile {
  nome_completo: string;
  apelido: string | null;
}

interface AcelerometroData {
  clientes_atuais: number;
  faturamento_acumulado: number;
  maior_faturamento: number;
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [acelerometro, setAcelerometro] = useState<AcelerometroData | null>(null);
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

        // Buscar mentorado_id
        const { data: mentoradoData } = await supabase
          .from("mentorados")
          .select("id, meta_clientes")
          .eq("user_id", user.id)
          .single();

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
      setLoading(false);
    };

    fetchData();
  }, []);

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

      {/* Acelerômetro Preview */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Acelerômetro
          </CardTitle>
        </CardHeader>
        <CardContent>
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