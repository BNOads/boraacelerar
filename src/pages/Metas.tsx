import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MetaCard } from "@/components/MetaCard";
import { NovaMetaDialog } from "@/components/NovaMetaDialog";
import { NovoObjetivoDialog } from "@/components/NovoObjetivoDialog";

export default function Metas() {
  const [mentoradoId, setMentoradoId] = useState<string | null>(null);
  const [metas, setMetas] = useState<any[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState<string>(new Date().getFullYear().toString());
  const [trimestreSelecionado, setTrimestreSelecionado] = useState<string>("todos");
  const [statusSelecionado, setStatusSelecionado] = useState<string>("todas");
  const [dialogNovaMetaAberto, setDialogNovaMetaAberto] = useState(false);
  const [dialogNovoObjetivoAberto, setDialogNovoObjetivoAberto] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarMentorado();
  }, []);

  useEffect(() => {
    if (mentoradoId) {
      carregarMetas();
    }
  }, [mentoradoId, anoSelecionado]);

  const carregarMentorado = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("mentorados")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (data) setMentoradoId(data.id);
    }
  };

  const carregarMetas = async () => {
    if (!mentoradoId) return;

    setLoading(true);

    // Buscar metas do ano selecionado
    const anoInicio = `${anoSelecionado}-01-01`;
    const anoFim = `${anoSelecionado}-12-31`;

    const { data, error } = await supabase
      .from("metas")
      .select(`*, objetivos (*)`)
      .eq("mentorado_id", mentoradoId)
      .gte("data_inicio", anoInicio)
      .lte("data_inicio", anoFim)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar metas:", error);
    } else {
      setMetas(data || []);
    }

    setLoading(false);
  };

  // Extrair anos únicos das metas (para dropdown)
  const anosDisponiveis = useMemo(() => {
    const anos = new Set<string>();
    // Adicionar ano atual sempre
    anos.add(new Date().getFullYear().toString());
    // Adicionar últimos 3 anos
    for (let i = 1; i <= 3; i++) {
      anos.add((new Date().getFullYear() - i).toString());
    }
    return Array.from(anos).sort((a, b) => b.localeCompare(a));
  }, []);

  // Calcular trimestre de uma data
  const getTrimestreFromDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const mes = date.getMonth() + 1;
    if (mes <= 3) return "Q1";
    if (mes <= 6) return "Q2";
    if (mes <= 9) return "Q3";
    return "Q4";
  };

  // Filtrar metas por trimestre e status
  const metasFiltradas = useMemo(() => {
    return metas.filter(meta => {
      // Filtro por trimestre
      if (trimestreSelecionado !== "todos") {
        const trimestre = getTrimestreFromDate(meta.data_inicio);
        if (trimestre !== trimestreSelecionado) return false;
      }

      // Filtro por status
      if (statusSelecionado !== "todas") {
        if (meta.status !== statusSelecionado) return false;
      }

      return true;
    });
  }, [metas, trimestreSelecionado, statusSelecionado]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
            <Target className="h-8 w-8 text-secondary" strokeWidth={1.5} />
            Metas e Resultados Chave
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e conquistas ao longo do tempo
          </p>
        </div>
        <Button
          onClick={() => setDialogNovaMetaAberto(true)}
          className="bg-secondary hover:bg-secondary/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Filtro de Ano */}
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Trimestre */}
            <div className="space-y-2">
              <Label>Trimestre</Label>
              <Select value={trimestreSelecionado} onValueChange={setTrimestreSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os trimestres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                  <SelectItem value="Q2">Q2 (Abr-Jun)</SelectItem>
                  <SelectItem value="Q3">Q3 (Jul-Set)</SelectItem>
                  <SelectItem value="Q4">Q4 (Out-Dez)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusSelecionado} onValueChange={setStatusSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="concluida">Concluídas</SelectItem>
                  <SelectItem value="arquivada">Arquivadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Metas */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle>
            Metas de {anoSelecionado}
            {trimestreSelecionado !== "todos" && ` - ${trimestreSelecionado}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : metasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma meta encontrada para os filtros selecionados</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setDialogNovaMetaAberto(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Nova Meta
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {metasFiltradas.map((meta) => (
                <MetaCard
                  key={meta.id}
                  meta={meta}
                  onAddObjetivo={(metaId) => {
                    setMetaSelecionada(metaId);
                    setDialogNovoObjetivoAberto(true);
                  }}
                  onUpdate={carregarMetas}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {mentoradoId && (
        <NovaMetaDialog
          open={dialogNovaMetaAberto}
          onOpenChange={setDialogNovaMetaAberto}
          mentoradoId={mentoradoId}
          onSuccess={carregarMetas}
        />
      )}

      <NovoObjetivoDialog
        open={dialogNovoObjetivoAberto}
        onOpenChange={setDialogNovoObjetivoAberto}
        metaId={metaSelecionada}
        onSuccess={carregarMetas}
      />
    </div>
  );
}
