import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle, Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EstatisticasNavegadorDialogProps {
  navegadorId: string;
  navegadorNome: string;
}

export function EstatisticasNavegadorDialog({ navegadorId, navegadorNome }: EstatisticasNavegadorDialogProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["navegador-stats", navegadorId],
    queryFn: async () => {
      // Total de atendimentos
      const { count: totalAtendimentos } = await supabase
        .from("atendimentos_navegador")
        .select("*", { count: "exact", head: true })
        .eq("navegador_id", navegadorId);

      // Atendimentos resolvidos
      const { count: atendimentosResolvidos } = await supabase
        .from("atendimentos_navegador")
        .select("*", { count: "exact", head: true })
        .eq("navegador_id", navegadorId)
        .eq("status", "Resolvido");

      // Atendimentos pendentes
      const { count: atendimentosPendentes } = await supabase
        .from("atendimentos_navegador")
        .select("*", { count: "exact", head: true })
        .eq("navegador_id", navegadorId)
        .eq("status", "Pendente");

      // Avaliações
      const { data: avaliacoes } = await supabase
        .from("atendimentos_navegador")
        .select("avaliacao")
        .eq("navegador_id", navegadorId)
        .not("avaliacao", "is", null);

      const mediaAvaliacao = avaliacoes && avaliacoes.length > 0
        ? avaliacoes.reduce((sum, item) => sum + (item.avaliacao || 0), 0) / avaliacoes.length
        : 0;

      // Solicitações de agendamento
      const { count: solicitacoesPendentes } = await supabase
        .from("solicitacoes_agendamento")
        .select("*", { count: "exact", head: true })
        .eq("navegador_id", navegadorId)
        .eq("status", "pendente");

      const taxaResolucao = totalAtendimentos && totalAtendimentos > 0
        ? ((atendimentosResolvidos || 0) / totalAtendimentos) * 100
        : 0;

      return {
        totalAtendimentos: totalAtendimentos || 0,
        atendimentosResolvidos: atendimentosResolvidos || 0,
        atendimentosPendentes: atendimentosPendentes || 0,
        solicitacoesPendentes: solicitacoesPendentes || 0,
        mediaAvaliacao: Math.round(mediaAvaliacao * 10) / 10,
        totalAvaliacoes: avaliacoes?.length || 0,
        taxaResolucao: Math.round(taxaResolucao),
      };
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="mr-2 h-4 w-4" />
          Estatísticas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Estatísticas - {navegadorNome}</DialogTitle>
          <DialogDescription>
            Métricas de desempenho e avaliações do navegador
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : stats ? (
          <div className="space-y-4 py-4">
            {/* Cards de Métricas Principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Atendimentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAtendimentos}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taxa de Resolução
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.taxaResolucao}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avaliação Média
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-secondary text-secondary" />
                    <span className="text-2xl font-bold">{stats.mediaAvaliacao}</span>
                    <span className="text-sm text-muted-foreground">({stats.totalAvaliacoes})</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Solicitações Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.solicitacoesPendentes}</div>
                </CardContent>
              </Card>
            </div>

            {/* Detalhamento de Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status dos Atendimentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Resolvidos</span>
                  </div>
                  <Badge variant="default">{stats.atendimentosResolvidos}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-sm">Pendentes</span>
                  </div>
                  <Badge variant="secondary">{stats.atendimentosPendentes}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Indicador de Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Indicador de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taxa de Resolução</span>
                    <span className="font-medium">{stats.taxaResolucao}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${stats.taxaResolucao}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.taxaResolucao >= 80
                      ? "Excelente desempenho! 🎉"
                      : stats.taxaResolucao >= 60
                      ? "Bom desempenho, continue assim! 👍"
                      : "Continue trabalhando para melhorar! 💪"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            Nenhuma estatística disponível
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
