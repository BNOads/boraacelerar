import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { TrendingUp, Users, CheckCircle, Target, ArrowUpDown, Search, Settings2, Activity, Eye, CheckCircle2, XCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { FAIXAS_PREMIACAO, determinarFaixa } from "@/constants/faixas";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { format, parse, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MentoradoRanking {
  id: string;
  nome: string;
  apelido: string | null;
  foto_url: string | null;
  turma: string | null;
  faturamentoTotal: number;
  faturamentoMedio: number;
  contratosTotal: number;
  propostasTotal: number;
  taxaConversao: number;
  clientesAtuais: number;
  progressoMedioOKR: number;
  notaMediaPilares: number;
  faixa: {
    nome: string;
    cor: string;
    emoji: string;
  };
}

type SortKey = 'nome' | 'faturamentoTotal' | 'faturamentoMedio' | 'contratosTotal' | 'taxaConversao' | 'clientesAtuais' | 'progressoMedioOKR' | 'notaMediaPilares';
type SortOrder = 'asc' | 'desc';

const getPerformanceColor = (valor: number): string => {
  if (valor >= 90) return "text-blue-500";
  if (valor >= 75) return "text-green-500";
  if (valor >= 50) return "text-secondary";
  return "text-red-500";
};

const ITEMS_PER_PAGE = 20;

// Configuração das colunas disponíveis
const COLUNAS_DISPONIVEIS = [
  { key: 'faturamentoTotal', label: 'Fat. Total', defaultVisible: false },
  { key: 'faturamentoMedio', label: 'Fat. Médio', defaultVisible: true },
  { key: 'contratosTotal', label: 'Contratos', defaultVisible: false },
  { key: 'taxaConversao', label: 'Conversão', defaultVisible: true },
  { key: 'clientesAtuais', label: 'Clientes', defaultVisible: true },
  { key: 'progressoMedioOKR', label: 'OKRs', defaultVisible: false },
  { key: 'notaMediaPilares', label: 'Pilares', defaultVisible: false },
] as const;

export function ResultadosAdmin() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTurma, setFiltroTurma] = useState<string>("todas");
  const [filtroFaixa, setFiltroFaixa] = useState<string>("todas");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({
    key: 'faturamentoMedio',
    order: 'desc'
  });
  const [colunasVisiveis, setColunasVisiveis] = useState<Record<string, boolean>>(
    COLUNAS_DISPONIVEIS.reduce((acc, col) => ({ ...acc, [col.key]: col.defaultVisible }), {})
  );

  // Query para dados de evolução temporal
  const { data: evolucaoTemporal } = useQuery({
    queryKey: ["evolucao-temporal"],
    queryFn: async () => {
      // Buscar todos os dados de desempenho mensal
      const { data: desempenhoData, error } = await supabase
        .from("desempenho_mensal")
        .select("mes_ano, faturamento_mensal, mentorado_id")
        .order("mes_ano", { ascending: true });

      if (error) throw error;
      if (!desempenhoData) return [];

      // Agrupar por mês
      const dadosPorMes = desempenhoData.reduce((acc, item) => {
        if (!acc[item.mes_ano]) {
          acc[item.mes_ano] = {
            mes_ano: item.mes_ano,
            mentorados_unicos: new Set(),
            faturamento_total: 0,
          };
        }
        acc[item.mes_ano].mentorados_unicos.add(item.mentorado_id);
        acc[item.mes_ano].faturamento_total += item.faturamento_mensal || 0;
        return acc;
      }, {} as Record<string, { mes_ano: string; mentorados_unicos: Set<string>; faturamento_total: number; }>);

      // Converter para array e formatar
      const resultado = Object.values(dadosPorMes).map(item => ({
        mes_ano: item.mes_ano,
        mes_formatado: format(parse(item.mes_ano, 'yyyy-MM', new Date()), 'MMM yyyy', { locale: ptBR }),
        total_mentorados: item.mentorados_unicos.size,
        faturamento_total: item.faturamento_total,
      }));

      return resultado;
    },
  });

  // Query para taxa de atualização de dados
  const { data: taxaAtualizacao } = useQuery({
    queryKey: ["taxa-atualizacao-dados"],
    queryFn: async () => {
      // Buscar total de mentorados ativos com dados do profile
      const { data: mentorados, error: mentoradosError } = await supabase
        .from("mentorados")
        .select(`
          id,
          turma,
          profiles:user_id (
            nome_completo,
            apelido,
            foto_url
          )
        `)
        .eq("status", "ativo");

      if (mentoradosError) throw mentoradosError;
      const totalMentorados = mentorados?.length || 0;

      // Buscar desempenho mensal dos últimos 12 meses
      const { data: desempenhoData, error: desempenhoError } = await supabase
        .from("desempenho_mensal")
        .select("mes_ano, mentorado_id")
        .order("mes_ano", { ascending: true });

      if (desempenhoError) throw desempenhoError;

      // Agrupar por mês
      const atualizacoesPorMes = desempenhoData?.reduce((acc, item) => {
        if (!acc[item.mes_ano]) {
          acc[item.mes_ano] = new Set();
        }
        acc[item.mes_ano].add(item.mentorado_id);
        return acc;
      }, {} as Record<string, Set<string>>) || {};

      // Converter para array com percentuais
      const mesAtual = format(new Date(), 'yyyy-MM');
      const resultado = Object.entries(atualizacoesPorMes)
        .map(([mes, mentoradosSet]) => ({
          mes_ano: mes,
          mes_formatado: format(parse(mes, 'yyyy-MM', new Date()), 'MMM yyyy', { locale: ptBR }),
          quantidade: mentoradosSet.size,
          percentual: totalMentorados > 0 ? Math.round((mentoradosSet.size / totalMentorados) * 100) : 0,
          totalMentorados,
          mentoradosQueAtualizaram: Array.from(mentoradosSet),
        }))
        .sort((a, b) => a.mes_ano.localeCompare(b.mes_ano))
        .slice(-12); // Últimos 12 meses

      // Dados do mês atual
      const dadosMesAtual = resultado.find(r => r.mes_ano === mesAtual) || {
        quantidade: 0,
        percentual: 0,
        totalMentorados,
        mentoradosQueAtualizaram: [] as string[],
      };

      // Lista de mentorados com status de atualização
      const mentoradosComStatus = mentorados?.map(m => {
        const atualizou = dadosMesAtual.mentoradosQueAtualizaram.includes(m.id);
        return {
          id: m.id,
          nome: m.profiles?.nome_completo || 'Sem nome',
          apelido: m.profiles?.apelido,
          foto_url: m.profiles?.foto_url,
          turma: m.turma,
          atualizou,
        };
      }).sort((a, b) => {
        // Primeiro os que não atualizaram, depois os que atualizaram
        if (a.atualizou !== b.atualizou) return a.atualizou ? 1 : -1;
        return a.nome.localeCompare(b.nome);
      }) || [];

      // Calcular índice de engajamento (média ponderada dos últimos 3 meses)
      const ultimos3Meses = resultado.slice(-3);
      const indiceEngajamento = ultimos3Meses.length > 0
        ? Math.round(ultimos3Meses.reduce((acc, h) => acc + h.percentual, 0) / ultimos3Meses.length)
        : 0;

      return {
        historico: resultado,
        mesAtual: {
          ...dadosMesAtual,
          mesFormatado: format(new Date(), 'MMMM yyyy', { locale: ptBR }),
        },
        mentoradosComStatus,
        indiceEngajamento,
      };
    },
  });

  const { data: mentoradosRanking, isLoading } = useQuery({
    queryKey: ["mentorados-ranking"],
    queryFn: async () => {
      // Buscar todos os mentorados ativos
      const { data: mentorados, error: mentoradosError } = await supabase
        .from("mentorados")
        .select(`
          id,
          turma,
          meta_clientes,
          profiles:user_id (
            nome_completo,
            apelido,
            foto_url
          )
        `)
        .eq("status", "ativo");

      if (mentoradosError) throw mentoradosError;
      if (!mentorados) return [];

      // Buscar dados agregados para cada mentorado
      const mentoradosComDados = await Promise.all(
        mentorados.map(async (mentorado) => {
          // Desempenho mensal
          const { data: desempenho } = await supabase
            .from("desempenho_mensal")
            .select("*")
            .eq("mentorado_id", mentorado.id);

          // Metas ativas
          const { data: metas } = await supabase
            .from("metas")
            .select("progresso")
            .eq("mentorado_id", mentorado.id)
            .eq("status", "ativa");

          // Avaliações pilares (últimas 9)
          const { data: avaliacoes } = await supabase
            .from("avaliacoes_pilares")
            .select("nota")
            .eq("mentorado_id", mentorado.id)
            .order("trimestre", { ascending: false })
            .limit(9);

          // Calcular métricas
          const faturamentoTotal = desempenho?.reduce((acc, d) => acc + (d.faturamento_mensal || 0), 0) || 0;
          const contratosTotal = desempenho?.reduce((acc, d) => acc + (d.contratos_fechados || 0), 0) || 0;
          const propostasTotal = desempenho?.reduce((acc, d) => acc + (d.qtd_propostas || 0), 0) || 0;
          const faturamentoMedio = desempenho?.length ? faturamentoTotal / desempenho.length : 0;
          const taxaConversao = propostasTotal ? (contratosTotal / propostasTotal) * 100 : 0;
          const progressoMedioOKR = metas?.length ? metas.reduce((acc, m) => acc + m.progresso, 0) / metas.length : 0;
          const notaMediaPilares = avaliacoes?.length ? avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length : 0;
          const clientesAtuais = desempenho?.[desempenho.length - 1]?.clientes_mes || 0;

          const faixa = determinarFaixa(faturamentoMedio);

          return {
            id: mentorado.id,
            nome: mentorado.profiles?.nome_completo || "Sem nome",
            apelido: mentorado.profiles?.apelido || null,
            foto_url: mentorado.profiles?.foto_url || null,
            turma: mentorado.turma,
            faturamentoTotal,
            faturamentoMedio,
            contratosTotal,
            propostasTotal,
            taxaConversao,
            clientesAtuais,
            progressoMedioOKR,
            notaMediaPilares,
            faixa,
          } as MentoradoRanking;
        })
      );

      return mentoradosComDados;
    },
  });

  // Filtrar e ordenar mentorados
  const mentoradosFiltrados = useMemo(() => {
    if (!mentoradosRanking) return [];

    let resultado = [...mentoradosRanking];

    // Filtro de busca
    if (searchTerm) {
      resultado = resultado.filter(m => 
        m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.apelido?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de turma
    if (filtroTurma !== "todas") {
      resultado = resultado.filter(m => m.turma === filtroTurma);
    }

    // Filtro de faixa
    if (filtroFaixa !== "todas") {
      resultado = resultado.filter(m => m.faixa.nome === filtroFaixa);
    }

    // Ordenação
    resultado.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'nome') {
        return sortConfig.order === 'asc' 
          ? aVal.toString().localeCompare(bVal.toString())
          : bVal.toString().localeCompare(aVal.toString());
      }
      
      return sortConfig.order === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    return resultado;
  }, [mentoradosRanking, searchTerm, filtroTurma, filtroFaixa, sortConfig]);

  // Cálculos de paginação
  const totalPages = Math.ceil(mentoradosFiltrados.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const mentoradosPaginados = mentoradosFiltrados.slice(startIndex, endIndex);

  // Reset para primeira página quando filtros mudarem
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroTurma, filtroFaixa]);

  // KPIs agregados
  const kpisAgregados = useMemo(() => {
    if (!mentoradosRanking) return null;

    const totalMentorados = mentoradosRanking.length;
    const faturamentoTotal = mentoradosRanking.reduce((acc, m) => acc + m.faturamentoTotal, 0);
    const contratosTotal = mentoradosRanking.reduce((acc, m) => acc + m.contratosTotal, 0);
    const progressoMedio = mentoradosRanking.length > 0 
      ? mentoradosRanking.reduce((acc, m) => acc + m.progressoMedioOKR, 0) / mentoradosRanking.length 
      : 0;

    return {
      totalMentorados,
      faturamentoTotal,
      contratosTotal,
      progressoMedio,
    };
  }, [mentoradosRanking]);

  // Turmas únicas
  const turmasUnicas = useMemo(() => {
    if (!mentoradosRanking) return [];
    return [...new Set(mentoradosRanking.map(m => m.turma).filter(Boolean))].sort();
  }, [mentoradosRanking]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'desc' ? 'asc' : 'desc'
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-slide-in">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Painel Administrativo - Resultados</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-4xl font-bold text-foreground">Painel Administrativo - Resultados</h1>
          <p className="text-muted-foreground text-lg">Visão consolidada de performance de todos os mentorados</p>
        </div>
      </div>

      {/* Gráfico de Evolução */}
      {evolucaoTemporal && evolucaoTemporal.length > 0 && (
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Evolução da Mentoria ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={evolucaoTemporal}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="mes_formatado" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  yAxisId="left"
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  label={{ 
                    value: 'Mentorados Ativos', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--muted-foreground))' }
                  }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  label={{ 
                    value: 'Faturamento Total (R$)', 
                    angle: 90, 
                    position: 'insideRight',
                    style: { fill: 'hsl(var(--muted-foreground))' }
                  }}
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Faturamento Total') {
                      return [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="total_mentorados" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Mentorados Ativos"
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="faturamento_total" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Faturamento Total"
                  dot={{ fill: 'hsl(var(--chart-2))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Taxa de Atualização de Dados */}
      {taxaAtualizacao && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Card de Índice de Engajamento */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Índice de Engajamento</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">Média dos últimos 3 meses</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-center">
                <div className={`text-5xl font-bold ${
                  taxaAtualizacao.indiceEngajamento >= 80 ? 'text-green-500' :
                  taxaAtualizacao.indiceEngajamento >= 60 ? 'text-primary' :
                  taxaAtualizacao.indiceEngajamento >= 40 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {taxaAtualizacao.indiceEngajamento}%
                </div>
              </div>
              <div className="text-center">
                <Badge variant={
                  taxaAtualizacao.indiceEngajamento >= 80 ? 'default' :
                  taxaAtualizacao.indiceEngajamento >= 60 ? 'secondary' :
                  taxaAtualizacao.indiceEngajamento >= 40 ? 'outline' : 'destructive'
                } className="text-xs">
                  {taxaAtualizacao.indiceEngajamento >= 80 ? 'Excelente' :
                   taxaAtualizacao.indiceEngajamento >= 60 ? 'Bom' :
                   taxaAtualizacao.indiceEngajamento >= 40 ? 'Regular' : 'Baixo'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Card do Mês Atual com botão */}
          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Mês Atual</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground capitalize">{taxaAtualizacao.mesAtual.mesFormatado}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Atualizaram:</span>
                <span className="text-xl font-bold text-foreground">
                  {taxaAtualizacao.mesAtual.quantidade} / {taxaAtualizacao.mesAtual.totalMentorados}
                </span>
              </div>
              <Progress value={taxaAtualizacao.mesAtual.percentual} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-500 font-medium">+{taxaAtualizacao.mesAtual.quantidade}</span>
                <span className="text-red-500 font-medium">-{taxaAtualizacao.mesAtual.totalMentorados - taxaAtualizacao.mesAtual.quantidade}</span>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Lista
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="capitalize">
                      Mentorados - {taxaAtualizacao.mesAtual.mesFormatado}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Atualizaram: {taxaAtualizacao.mentoradosComStatus.filter(m => m.atualizou).length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>Pendentes: {taxaAtualizacao.mentoradosComStatus.filter(m => !m.atualizou).length}</span>
                      </div>
                    </div>
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-2">
                        {taxaAtualizacao.mentoradosComStatus.map((mentorado) => (
                          <div 
                            key={mentorado.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              mentorado.atualizou 
                                ? 'bg-green-500/10 border-green-500/30' 
                                : 'bg-red-500/10 border-red-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={mentorado.foto_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {mentorado.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {mentorado.apelido || mentorado.nome.split(' ')[0]}
                                </p>
                                {mentorado.turma && (
                                  <p className="text-xs text-muted-foreground">{mentorado.turma}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {mentorado.atualizou ? (
                                <Badge variant="default" className="bg-green-500 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Atualizado
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Pendente
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Gráfico de Histórico */}
          <Card className="border-border bg-card shadow-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Atualizações (Últimos 12 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={taxaAtualizacao.historico}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="mes_formatado" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'Taxa (%)') {
                        return [`${value}%`, 'Taxa de Atualização'];
                      }
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Bar 
                    dataKey="percentual" 
                    fill="hsl(var(--primary))" 
                    name="Taxa (%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Média: <span className="font-semibold text-foreground">
                    {taxaAtualizacao.historico.length > 0 
                      ? Math.round(taxaAtualizacao.historico.reduce((acc, h) => acc + h.percentual, 0) / taxaAtualizacao.historico.length) 
                      : 0}%
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Base: {taxaAtualizacao.mesAtual.totalMentorados} mentorados
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {kpisAgregados && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground mb-1">{kpisAgregados.totalMentorados}</p>
              <p className="text-sm text-muted-foreground">Mentorados Ativos</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground mb-1">
                R$ {(kpisAgregados.faturamentoTotal / 1000000).toFixed(2)}M
              </p>
              <p className="text-sm text-muted-foreground">Faturamento Total</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground mb-1">{kpisAgregados.contratosTotal}</p>
              <p className="text-sm text-muted-foreground">Contratos Totais</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Target className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground mb-1">{kpisAgregados.progressoMedio.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Média OKRs</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      <Card className="border-border bg-card shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou apelido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroTurma} onValueChange={setFiltroTurma}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todas as turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as turmas</SelectItem>
                {turmasUnicas.map(turma => (
                  <SelectItem key={turma} value={turma!}>{turma}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroFaixa} onValueChange={setFiltroFaixa}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todas as faixas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as faixas</SelectItem>
                {FAIXAS_PREMIACAO.map(faixa => (
                  <SelectItem key={faixa.nome} value={faixa.nome}>
                    {faixa.emoji} {faixa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Ranking */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground">Ranking de Mentorados</CardTitle>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} - {Math.min(endIndex, mentoradosFiltrados.length)} de {mentoradosFiltrados.length}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings2 className="h-4 w-4 mr-2" />
                    Colunas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Exibir colunas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {COLUNAS_DISPONIVEIS.map((coluna) => (
                    <DropdownMenuCheckboxItem
                      key={coluna.key}
                      checked={colunasVisiveis[coluna.key]}
                      onCheckedChange={(checked) =>
                        setColunasVisiveis((prev) => ({ ...prev, [coluna.key]: checked }))
                      }
                    >
                      {coluna.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('nome')}
                      className="hover:bg-muted"
                    >
                      Mentorado
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  {colunasVisiveis.faturamentoTotal && (
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('faturamentoTotal')}
                        className="hover:bg-muted float-right"
                      >
                        Fat. Total
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  )}
                  {colunasVisiveis.faturamentoMedio && (
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('faturamentoMedio')}
                        className="hover:bg-muted float-right"
                      >
                        Fat. Médio
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  )}
                  {colunasVisiveis.contratosTotal && (
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('contratosTotal')}
                        className="hover:bg-muted float-right"
                      >
                        Contratos
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  )}
                  {colunasVisiveis.taxaConversao && (
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('taxaConversao')}
                        className="hover:bg-muted float-right"
                      >
                        Conversão
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  )}
                  {colunasVisiveis.clientesAtuais && (
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('clientesAtuais')}
                        className="hover:bg-muted float-right"
                      >
                        Clientes
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  )}
                  {colunasVisiveis.progressoMedioOKR && (
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('progressoMedioOKR')}
                        className="hover:bg-muted float-right"
                      >
                        OKRs
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  )}
                  {colunasVisiveis.notaMediaPilares && (
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('notaMediaPilares')}
                        className="hover:bg-muted float-right"
                      >
                        Pilares
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  )}
                  <TableHead>Premiação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mentoradosPaginados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Nenhum mentorado encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  mentoradosPaginados.map((mentorado) => (
                    <TableRow 
                      key={mentorado.id} 
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        <button
                          onClick={() => navigate(`/mentorados/${mentorado.id}`)}
                          className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity w-full"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={mentorado.foto_url || undefined} />
                            <AvatarFallback>{mentorado.nome[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground hover:text-primary transition-colors">
                              {mentorado.nome}
                            </div>
                            {mentorado.apelido && (
                              <div className="text-sm text-muted-foreground">@{mentorado.apelido}</div>
                            )}
                          </div>
                        </button>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {(mentorado.faturamentoTotal / 1000).toFixed(0)}k
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {(mentorado.faturamentoMedio / 1000).toFixed(0)}k
                      </TableCell>
                      <TableCell className="text-right">{mentorado.contratosTotal}</TableCell>
                      <TableCell className="text-right">
                        <span className={getPerformanceColor(mentorado.taxaConversao)}>
                          {mentorado.taxaConversao.toFixed(0)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{mentorado.clientesAtuais}</TableCell>
                      <TableCell>
                        <Badge className={`${mentorado.faixa.cor} text-white`}>
                          {mentorado.faixa.emoji} {mentorado.faixa.nome}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* Primeira página */}
                  {currentPage > 2 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(1)} className="cursor-pointer">
                          1
                        </PaginationLink>
                      </PaginationItem>
                      {currentPage > 3 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                    </>
                  )}

                  {/* Páginas ao redor da atual */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === currentPage || 
                             page === currentPage - 1 || 
                             page === currentPage + 1;
                    })
                    .map(page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={page === currentPage}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                  {/* Última página */}
                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink onClick={() => setCurrentPage(totalPages)} className="cursor-pointer">
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
