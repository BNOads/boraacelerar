import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Trash2, 
  Edit2,
  DollarSign,
  Target,
  Users,
  LineChart as LineChartIcon
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MarketingMetric {
  id: string;
  mentorado_id: string;
  mes_ano: string;
  leads_totais: number;
  leads_qualificados: number;
  investimento_marketing: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  mes_ano: string;
  leads_totais: number;
  leads_qualificados: number;
  investimento_marketing: number;
}

export function TaxasMarketing({ mentoradoId }: { mentoradoId: string | null }) {
  const [metrics, setMetrics] = useState<MarketingMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    mes_ano: new Date().toISOString().slice(0, 7),
    leads_totais: 0,
    leads_qualificados: 0,
    investimento_marketing: 0,
  });

  // Buscar métricas de marketing
  useEffect(() => {
    if (!mentoradoId) return;
    
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase
          .from("marketing_metrics" as any)
          .select("*")
          .eq("mentorado_id", mentoradoId)
          .order("mes_ano", { ascending: true }) as any);

        if (error) throw error;
        setMetrics(data || []);
      } catch (error) {
        console.error("Erro ao buscar métricas de marketing:", error);
        toast.error("Erro ao carregar métricas de marketing");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [mentoradoId]);

  // Calcular MQL (Custo por Lead Qualificado)
  const calculateMQL = (investimento: number, leadsQualificados: number) => {
    if (leadsQualificados === 0) return 0;
    return investimento / leadsQualificados;
  };

  // Calcular taxa de qualificação
  const calculateQualificationRate = (leadsQualificados: number, leadsTotais: number) => {
    if (leadsTotais === 0) return 0;
    return (leadsQualificados / leadsTotais) * 100;
  };

  const handleSalvar = async () => {
    if (!mentoradoId) {
      toast.error("Erro ao identificar mentorado");
      return;
    }

    // Validações
    if (!formData.mes_ano) {
      toast.error("Selecione um mês/ano");
      return;
    }

    if (formData.leads_totais < 0 || formData.leads_qualificados < 0 || formData.investimento_marketing < 0) {
      toast.error("Os valores não podem ser negativos");
      return;
    }

    if (formData.leads_qualificados > formData.leads_totais) {
      toast.error("Leads qualificados não podem ser maiores que leads totais");
      return;
    }

    try {
      if (editingId) {
        // Atualizar
        const { error } = await (supabase
          .from("marketing_metrics" as any)
          .update({
            leads_totais: formData.leads_totais,
            leads_qualificados: formData.leads_qualificados,
            investimento_marketing: formData.investimento_marketing,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId) as any);

        if (error) throw error;
        toast.success("Métrica atualizada com sucesso!");
      } else {
        // Criar novo
        const { error } = await (supabase
          .from("marketing_metrics" as any)
          .upsert({
            mentorado_id: mentoradoId,
            mes_ano: formData.mes_ano,
            leads_totais: formData.leads_totais,
            leads_qualificados: formData.leads_qualificados,
            investimento_marketing: formData.investimento_marketing,
          }) as any);

        if (error) throw error;
        toast.success("Métrica salva com sucesso!");
      }

      // Recarregar dados
      const { data } = await (supabase
        .from("marketing_metrics" as any)
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .order("mes_ano", { ascending: true }) as any);

      if (data) setMetrics(data);

      // Resetar formulário
      setFormData({
        mes_ano: new Date().toISOString().slice(0, 7),
        leads_totais: 0,
        leads_qualificados: 0,
        investimento_marketing: 0,
      });
      setEditingId(null);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar métrica de marketing");
    }
  };

  const handleEditar = (metric: MarketingMetric) => {
    setEditingId(metric.id);
    setFormData({
      mes_ano: metric.mes_ano,
      leads_totais: metric.leads_totais,
      leads_qualificados: metric.leads_qualificados,
      investimento_marketing: metric.investimento_marketing,
    });
  };

  const handleDeletar = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta métrica?")) return;

    try {
      const { error } = await (supabase
        .from("marketing_metrics" as any)
        .delete()
        .eq("id", id) as any);

      if (error) throw error;
      toast.success("Métrica deletada com sucesso!");

      setMetrics(metrics.filter(m => m.id !== id));
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao deletar métrica");
    }
  };

  const handleCancelar = () => {
    setEditingId(null);
    setFormData({
      mes_ano: new Date().toISOString().slice(0, 7),
      leads_totais: 0,
      leads_qualificados: 0,
      investimento_marketing: 0,
    });
  };

  // Formatar dados para gráfico
  const chartData = useMemo(() => {
    return metrics.map(metric => ({
      ...metric,
      mes_formatado: format(parse(metric.mes_ano, 'yyyy-MM', new Date()), 'MMM yyyy', { locale: ptBR }),
      mql: calculateMQL(metric.investimento_marketing, metric.leads_qualificados),
      taxa_qualificacao: calculateQualificationRate(metric.leads_qualificados, metric.leads_totais),
    }));
  }, [metrics]);

  // Estatísticas
  const stats = useMemo(() => {
    if (metrics.length === 0) return null;

    const investimentoTotal = metrics.reduce((acc, m) => acc + m.investimento_marketing, 0);
    const leadsQualificadosTotal = metrics.reduce((acc, m) => acc + m.leads_qualificados, 0);
    const leadsTotaisTotal = metrics.reduce((acc, m) => acc + m.leads_totais, 0);
    
    return {
      investimentoTotal,
      leadsQualificadosTotal,
      leadsTotaisTotal,
      mqlMedio: leadsQualificadosTotal > 0 ? investimentoTotal / leadsQualificadosTotal : 0,
      taxaQualificacaoMedia: leadsTotaisTotal > 0 ? (leadsQualificadosTotal / leadsTotaisTotal) * 100 : 0,
    };
  }, [metrics]);

  if (!mentoradoId) {
    return (
      <Card className="border-border bg-card shadow-card">
        <CardContent className="p-6">
          <p className="text-muted-foreground">Erro ao carregar dados do mentorado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-foreground">
                {editingId ? "Editar Métrica de Marketing" : "Registrar Métrica de Marketing"}
              </CardTitle>
              <CardDescription>
                Acompanhe seus leads, investimentos e calcule automaticamente MQL
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="mes_ano">Mês/Ano</Label>
              <Input
                id="mes_ano"
                type="month"
                value={formData.mes_ano}
                onChange={(e) => setFormData({ ...formData, mes_ano: e.target.value })}
                disabled={!!editingId}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leads_totais" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Leads Totais
              </Label>
              <Input
                id="leads_totais"
                type="number"
                value={formData.leads_totais}
                onChange={(e) => setFormData({ ...formData, leads_totais: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leads_qualificados" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Leads Qualificados
              </Label>
              <Input
                id="leads_qualificados"
                type="number"
                value={formData.leads_qualificados}
                onChange={(e) => setFormData({ ...formData, leads_qualificados: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="investimento" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Investimento (R$)
              </Label>
              <Input
                id="investimento"
                type="number"
                value={formData.investimento_marketing}
                onChange={(e) => setFormData({ ...formData, investimento_marketing: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleSalvar} className="w-full flex-1">
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
              {editingId && (
                <Button onClick={handleCancelar} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Investimento Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                R$ {stats.investimentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4" />
                MQL Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                R$ {stats.mqlMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-muted-foreground mt-1">por lead qualificado</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Leads Qualificados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {stats.leadsQualificadosTotal}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Leads Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {stats.leadsTotaisTotal}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Taxa Qualificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {stats.taxaQualificacaoMedia.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico */}
      {metrics.length > 0 && (
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-primary" />
              Evolução das Métricas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="mes_formatado"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  yAxisId="left"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Leads / Investimento', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Taxa (%)', angle: 90, position: 'insideRight' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'leads_totais' || name === 'leads_qualificados') {
                      return [value, name === 'leads_totais' ? 'Leads Totais' : 'Leads Qualificados'];
                    }
                    if (name === 'investimento_marketing') {
                      return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Investimento'];
                    }
                    if (name === 'taxa_qualificacao') {
                      return [`${(value as number).toFixed(1)}%`, 'Taxa Qualificação'];
                    }
                    return [value, name];
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="leads_totais"
                  name="Leads Totais"
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(221, 83%, 53%)', r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="leads_qualificados"
                  name="Leads Qualificados"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142, 76%, 36%)', r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="investimento_marketing"
                  name="Investimento (R$)"
                  stroke="hsl(280, 83%, 53%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(280, 83%, 53%)', r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="taxa_qualificacao"
                  name="Taxa Qualificação (%)"
                  stroke="hsl(0, 0%, 100%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(0, 0%, 100%)', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Histórico */}
      {metrics.length > 0 ? (
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Histórico de Métricas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Mês</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Leads Totais</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Leads Qualif.</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Taxa Qualif.</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">Investimento</th>
                    <th className="text-right py-3 px-4 text-muted-foreground font-medium">MQL</th>
                    <th className="text-center py-3 px-4 text-muted-foreground font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((metric) => (
                    <tr key={metric.id} className="border-b border-border hover:bg-muted/30">
                      <td className="py-3 px-4 text-foreground">
                        {format(parse(metric.mes_ano, 'yyyy-MM', new Date()), 'MMM yyyy', { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4 text-right text-foreground">{metric.leads_totais}</td>
                      <td className="py-3 px-4 text-right text-foreground">{metric.leads_qualificados}</td>
                      <td className="py-3 px-4 text-right text-foreground">
                        {metric.taxa_qualificacao.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right text-foreground">
                        R$ {metric.investimento_marketing.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-right text-foreground">
                        {metric.leads_qualificados === 0 ? '-' : `R$ ${metric.mql.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditar(metric)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeletar(metric.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        !loading && (
          <Card className="border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-2">Nenhuma métrica de marketing registrada</p>
              <p className="text-sm text-muted-foreground">Comece adicionando dados de leads e investimentos acima</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
