import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, UserCheck, UserX, TrendingUp, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format, subMonths, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

type FilterType = "todos" | "atualizaram" | "nao_atualizaram";

interface MentoradoAtividade {
  id: string;
  user_id: string;
  nome: string;
  apelido: string | null;
  avatar_url: string | null;
  turma: string | null;
  atualizou: boolean;
}

export function AtividadeMentoradosCard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM"));
  const [filter, setFilter] = useState<FilterType>("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Buscar todos os mentorados
  const { data: mentorados, isLoading: isMentoradosLoading } = useQuery({
    queryKey: ["mentorados-atividade-card"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorados")
        .select(`
          id,
          user_id,
          turma,
          profiles:user_id (
            nome_completo,
            apelido,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Buscar atividades do mês selecionado
  const { data: atividadesMes, isLoading: isAtividadesLoading } = useQuery({
    queryKey: ["atividades-mes-card", selectedDate],
    queryFn: async () => {
      const inicioMes = `${selectedDate}-01`;
      const dataFim = endOfMonth(new Date(inicioMes));
      const fimMes = format(dataFim, "yyyy-MM-dd");

      // Buscar todas as atividades de todas as tabelas relevantes
      const [
        desempenho,
        pilares,
        metas,
        objetivos,
        marketing,
        atendimentos,
        avaliacoes
      ] = await Promise.all([
        supabase
          .from("desempenho_mensal")
          .select("mentorado_id")
          .eq("mes_ano", selectedDate),

        supabase
          .from("pilares_desempenho")
          .select("mentorado_id")
          .eq("mes_ano", selectedDate),

        supabase
          .from("metas")
          .select("mentorado_id")
          .gte("created_at", inicioMes)
          .lte("created_at", `${fimMes}T23:59:59`),

        supabase
          .from("objetivos")
          .select("meta_id, metas!inner(mentorado_id)")
          .gte("created_at", inicioMes)
          .lte("created_at", `${fimMes}T23:59:59`),

        supabase
          .from("marketing_metrics" as any)
          .select("mentorado_id")
          .eq("mes_ano", selectedDate) as any,

        supabase
          .from("atendimentos_navegador")
          .select("mentorado_id")
          .gte("created_at", inicioMes)
          .lte("created_at", `${fimMes}T23:59:59`),

        supabase
          .from("avaliacoes_pilares")
          .select("mentorado_id")
          .gte("created_at", inicioMes)
          .lte("created_at", `${fimMes}T23:59:59`),
      ]);

      // Coletar todos os mentorado_ids que tiveram atividade
      const mentoradosComAtividade = new Set<string>();

      desempenho.data?.forEach((d: any) => mentoradosComAtividade.add(d.mentorado_id));
      pilares.data?.forEach((p: any) => mentoradosComAtividade.add(p.mentorado_id));
      metas.data?.forEach((m: any) => mentoradosComAtividade.add(m.mentorado_id));
      objetivos.data?.forEach((o: any) => {
        if (o.metas?.mentorado_id) {
          mentoradosComAtividade.add(o.metas.mentorado_id);
        }
      });
      marketing.data?.forEach((m: any) => mentoradosComAtividade.add(m.mentorado_id));
      atendimentos.data?.forEach((a: any) => mentoradosComAtividade.add(a.mentorado_id));
      avaliacoes.data?.forEach((a: any) => mentoradosComAtividade.add(a.mentorado_id));

      return mentoradosComAtividade;
    },
  });

  // Processar dados dos mentorados com status de atividade
  const mentoradosComStatus = useMemo<MentoradoAtividade[]>(() => {
    if (!mentorados || !atividadesMes) return [];

    return mentorados.map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      nome: m.profiles?.nome_completo || "Sem nome",
      apelido: m.profiles?.apelido,
      avatar_url: m.profiles?.avatar_url,
      turma: m.turma,
      atualizou: atividadesMes.has(m.id),
    }));
  }, [mentorados, atividadesMes]);

  // Filtrar mentorados baseado no filtro selecionado
  const mentoradosFiltrados = useMemo(() => {
    if (filter === "todos") return mentoradosComStatus;
    if (filter === "atualizaram") return mentoradosComStatus.filter(m => m.atualizou);
    return mentoradosComStatus.filter(m => !m.atualizou);
  }, [mentoradosComStatus, filter]);

  // Paginação
  const totalPages = Math.ceil(mentoradosFiltrados.length / itemsPerPage);
  const mentoradosPaginados = mentoradosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Estatísticas
  const stats = useMemo(() => {
    const total = mentoradosComStatus.length;
    const atualizaram = mentoradosComStatus.filter(m => m.atualizou).length;
    const naoAtualizaram = total - atualizaram;
    const engajamento = total > 0 ? Math.round((atualizaram / total) * 100) : 0;

    return { total, atualizaram, naoAtualizaram, engajamento };
  }, [mentoradosComStatus]);

  // Dados para o gráfico
  const chartData = useMemo(() => [
    { name: "Atualizaram", value: stats.atualizaram, color: "#22c55e" },
    { name: "Não atualizaram", value: stats.naoAtualizaram, color: "#ef4444" },
  ], [stats]);

  // Gerar opções de mês/ano (últimos 12 meses)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subMonths(now, i);
      const value = format(date, "yyyy-MM");
      const label = format(date, "MMM/yyyy", { locale: ptBR });
      options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
    }
    return options;
  }, []);

  // Reset página quando filtro muda
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // Reset página quando mês muda
  const handleMonthChange = (value: string) => {
    setSelectedDate(value);
    setCurrentPage(1);
  };

  const isLoading = isMentoradosLoading || isAtividadesLoading;

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-secondary" />
            <CardTitle className="text-foreground">Atividade dos Mentorados</CardTitle>
          </div>
          <Select value={selectedDate} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Indicadores */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-blue-500/10">
            <div className="flex justify-center mb-2">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{isLoading ? "..." : stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-500/10">
            <div className="flex justify-center mb-2">
              <UserCheck className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{isLoading ? "..." : stats.atualizaram}</p>
            <p className="text-xs text-muted-foreground">Atualizaram</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-500/10">
            <div className="flex justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{isLoading ? "..." : `${stats.engajamento}%`}</p>
            <p className="text-xs text-muted-foreground">Engajamento</p>
          </div>
        </div>

        {/* Gráfico */}
        {isLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : stats.total === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Nenhum mentorado cadastrado
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value, "Mentorados"]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button
            variant={filter === "atualizaram" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("atualizaram")}
            className={filter === "atualizaram" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Atualizaram ({stats.atualizaram})
          </Button>
          <Button
            variant={filter === "nao_atualizaram" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("nao_atualizaram")}
            className={filter === "nao_atualizaram" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <UserX className="h-4 w-4 mr-1" />
            Sem atividade ({stats.naoAtualizaram})
          </Button>
          <Button
            variant={filter === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange("todos")}
          >
            Todos ({stats.total})
          </Button>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : mentoradosFiltrados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum mentorado encontrado.
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {mentoradosPaginados.map((mentorado) => (
                <div
                  key={mentorado.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                  onClick={() => navigate(`/mentorados/${mentorado.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={mentorado.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {mentorado.nome.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{mentorado.nome}</p>
                      {mentorado.turma && (
                        <p className="text-xs text-muted-foreground">{mentorado.turma}</p>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={mentorado.atualizou ? "default" : "destructive"}
                    className={`text-xs ${mentorado.atualizou ? "bg-green-600" : ""}`}
                  >
                    {mentorado.atualizou ? "Atualizou" : "Sem atividade"}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, mentoradosFiltrados.length)} de {mentoradosFiltrados.length}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
