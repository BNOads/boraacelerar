import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, CheckCircle, ArrowUp, Trophy } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface DesempenhoData {
  mes_ano: string;
  faturamento_mensal: number;
  clientes_mes: number;
  qtd_propostas: number;
  contratos_fechados: number;
}

interface FaixaPremiacao {
  nome: string;
  min: number;
  max: number | null;
  cor: string;
  emoji: string;
}

const faixas: FaixaPremiacao[] = [
  { nome: "Bronze", min: 10000, max: 24999, cor: "bg-amber-700", emoji: "🥉" },
  { nome: "Prata", min: 25000, max: 49999, cor: "bg-slate-400", emoji: "🥈" },
  { nome: "Ouro", min: 50000, max: 99999, cor: "bg-yellow-500", emoji: "🥇" },
  { nome: "Platina", min: 100000, max: 249999, cor: "bg-cyan-400", emoji: "💎" },
  { nome: "Diamante", min: 250000, max: null, cor: "bg-blue-600", emoji: "💠" },
];

export default function Resultados() {
  const [desempenhoAtual, setDesempenhoAtual] = useState<DesempenhoData | null>(null);
  const [historico, setHistorico] = useState<DesempenhoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesempenho = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: mentoradoData } = await supabase
          .from("mentorados")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (mentoradoData) {
          const { data: allData } = await supabase
            .from("desempenho_mensal")
            .select("*")
            .eq("mentorado_id", mentoradoData.id)
            .order("mes_ano", { ascending: true });

          if (allData && allData.length > 0) {
            setHistorico(allData);
            setDesempenhoAtual(allData[allData.length - 1]);
          }
        }
      }
      setLoading(false);
    };

    fetchDesempenho();
  }, []);

  const faturamentoTotal = historico.reduce((acc, item) => acc + (item.faturamento_mensal || 0), 0);
  const contratosTotal = historico.reduce((acc, item) => acc + (item.contratos_fechados || 0), 0);
  const faturamentoMedioMensal = historico.length > 0 ? faturamentoTotal / historico.length : 0;

  const faixaAtual = faixas.find(f => 
    faturamentoMedioMensal >= f.min && (f.max === null || faturamentoMedioMensal <= f.max)
  ) || faixas[0];

  const proximaFaixa = faixas[faixas.indexOf(faixaAtual) + 1];
  const progressoFaixa = proximaFaixa 
    ? ((faturamentoMedioMensal - faixaAtual.min) / (proximaFaixa.min - faixaAtual.min)) * 100
    : 100;

  const kpis = [
    {
      title: "Faturamento Acumulado",
      value: `R$ ${faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      change: `${historico.length} meses`,
      positive: true,
    },
    {
      title: "Faturamento Médio Mensal",
      value: `R$ ${faturamentoMedioMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      change: faixaAtual.nome,
      positive: true,
    },
    {
      title: "Clientes Atuais",
      value: desempenhoAtual?.clientes_mes || 0,
      icon: Users,
      change: "Mês atual",
      positive: true,
    },
    {
      title: "Contratos Fechados (Total)",
      value: contratosTotal,
      icon: CheckCircle,
      change: "Desde o início",
      positive: true,
    },
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
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold text-foreground">Meus Resultados</h1>
      </div>
      <p className="text-muted-foreground text-lg">
        Acompanhe seu desempenho e evolução
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <kpi.icon className="h-5 w-5 text-primary" />
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ArrowUp className="h-3 w-3" />
                  {kpi.change}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground mb-1">{kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prêmio Profissional Extraordinário */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-primary" />
            <CardTitle className="text-foreground">Prêmio Profissional Extraordinário</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <div className="text-5xl mb-2">{faixaAtual.emoji}</div>
            <Badge className={`${faixaAtual.cor} text-white text-lg px-4 py-1`}>
              {faixaAtual.nome}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Faturamento médio mensal: R$ {faturamentoMedioMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {proximaFaixa && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso para {proximaFaixa.nome}</span>
                <span className="font-semibold">{progressoFaixa.toFixed(0)}%</span>
              </div>
              <Progress value={progressoFaixa} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                Faltam R$ {(proximaFaixa.min - faturamentoMedioMensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                {' '}de média mensal para atingir {proximaFaixa.nome}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-4 border-t">
            {faixas.map((faixa) => (
              <div 
                key={faixa.nome}
                className={`p-3 rounded-lg text-center border-2 ${
                  faixa.nome === faixaAtual.nome 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className="text-2xl mb-1">{faixa.emoji}</div>
                <div className="text-xs font-semibold">{faixa.nome}</div>
                <div className="text-xs text-muted-foreground">
                  R$ {(faixa.min / 1000).toFixed(0)}k{faixa.max ? ` - ${(faixa.max / 1000).toFixed(0)}k` : '+'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Evolução do Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          {historico.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historico}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="mes_ano" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
                />
                <Line 
                  type="monotone" 
                  dataKey="faturamento_mensal" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">Dados insuficientes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
