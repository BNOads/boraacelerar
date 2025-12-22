import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Target, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MetaCard } from "@/components/MetaCard";
import { NovaMetaDialog } from "@/components/NovaMetaDialog";
import { NovoObjetivoDialog } from "@/components/NovoObjetivoDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Mentorado {
  id: string;
  user_id: string;
  turma: string | null;
  status: string | null;
  profiles: {
    nome_completo: string;
    apelido: string | null;
    foto_url: string | null;
  } | null;
}

export default function Metas() {
  const { isAdmin } = useIsAdmin();
  const [mentoradoId, setMentoradoId] = useState<string | null>(null);
  const [metas, setMetas] = useState<any[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState<string>(new Date().getFullYear().toString());
  const [trimestreSelecionado, setTrimestreSelecionado] = useState<string>("todos");
  const [statusSelecionado, setStatusSelecionado] = useState<string>("todas");
  const [dialogNovaMetaAberto, setDialogNovaMetaAberto] = useState(false);
  const [dialogNovoObjetivoAberto, setDialogNovoObjetivoAberto] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mentorados, setMentorados] = useState<Mentorado[]>([]);
  const [mentoradoSelecionado, setMentoradoSelecionado] = useState<string | null>(null);

  useEffect(() => {
    carregarMentorado();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      carregarTodosMentorados();
    }
  }, [isAdmin]);

  useEffect(() => {
    const idParaBuscar = isAdmin && mentoradoSelecionado ? mentoradoSelecionado : mentoradoId;
    if (idParaBuscar) {
      carregarMetas(idParaBuscar);
    }
  }, [mentoradoId, mentoradoSelecionado, anoSelecionado, isAdmin]);

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

  const carregarTodosMentorados = async () => {
    const { data, error } = await supabase
      .from("mentorados")
      .select(`
        id,
        user_id,
        turma,
        status,
        profiles:user_id (nome_completo, apelido, foto_url)
      `)
      .eq("status", "ativo")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMentorados(data as Mentorado[]);
    }
  };

  const carregarMetas = async (id: string) => {
    setLoading(true);

    const anoInicio = `${anoSelecionado}-01-01`;
    const anoFim = `${anoSelecionado}-12-31`;

    const { data, error } = await supabase
      .from("metas")
      .select(`*, objetivos (*)`)
      .eq("mentorado_id", id)
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

  const anosDisponiveis = useMemo(() => {
    const anos = new Set<string>();
    anos.add(new Date().getFullYear().toString());
    for (let i = 1; i <= 3; i++) {
      anos.add((new Date().getFullYear() - i).toString());
    }
    return Array.from(anos).sort((a, b) => b.localeCompare(a));
  }, []);

  const getTrimestreFromDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const mes = date.getMonth() + 1;
    if (mes <= 3) return "Q1";
    if (mes <= 6) return "Q2";
    if (mes <= 9) return "Q3";
    return "Q4";
  };

  const metasFiltradas = useMemo(() => {
    return metas.filter(meta => {
      if (trimestreSelecionado !== "todos") {
        const trimestre = getTrimestreFromDate(meta.data_inicio);
        if (trimestre !== trimestreSelecionado) return false;
      }

      if (statusSelecionado !== "todas") {
        if (meta.status !== statusSelecionado) return false;
      }

      return true;
    });
  }, [metas, trimestreSelecionado, statusSelecionado]);

  const mentoradoAtual = mentorados.find(m => m.id === mentoradoSelecionado);
  const idParaMeta = isAdmin && mentoradoSelecionado ? mentoradoSelecionado : mentoradoId;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            🎯 Metas e Resultados Chave
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e conquistas ao longo do tempo
          </p>
        </div>
        <Button
          onClick={() => setDialogNovaMetaAberto(true)}
          className="bg-secondary hover:bg-secondary/90 text-white"
          disabled={!idParaMeta}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {/* Admin: Seletor de Mentorado */}
      {isAdmin && (
        <Card className="border-border bg-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Selecione um Mentorado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-6">
              {mentorados.map((mentorado) => (
                <div
                  key={mentorado.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    mentoradoSelecionado === mentorado.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onClick={() => setMentoradoSelecionado(mentorado.id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={mentorado.profiles?.foto_url || undefined} />
                    <AvatarFallback className="bg-secondary/10 text-secondary text-sm">
                      {mentorado.profiles?.nome_completo?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {mentorado.profiles?.apelido || mentorado.profiles?.nome_completo?.split(' ')[0]}
                    </p>
                    {mentorado.turma && (
                      <p className="text-xs text-muted-foreground truncate">{mentorado.turma}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {mentoradoAtual && (
              <div className="mt-4 p-3 bg-primary/5 rounded-lg flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={mentoradoAtual.profiles?.foto_url || undefined} />
                  <AvatarFallback className="bg-secondary/10 text-secondary">
                    {mentoradoAtual.profiles?.nome_completo?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{mentoradoAtual.profiles?.nome_completo}</p>
                  <div className="flex gap-2 mt-1">
                    {mentoradoAtual.turma && (
                      <Badge variant="outline" className="text-xs">{mentoradoAtual.turma}</Badge>
                    )}
                    <Badge variant={mentoradoAtual.status === "ativo" ? "default" : "secondary"} className="text-xs">
                      {mentoradoAtual.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
            {isAdmin && mentoradoAtual && (
              <span className="text-muted-foreground font-normal text-base ml-2">
                ({mentoradoAtual.profiles?.nome_completo})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAdmin && !mentoradoSelecionado ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione um mentorado acima para ver suas metas</p>
            </div>
          ) : loading ? (
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
                  onUpdate={() => {
                    const id = isAdmin && mentoradoSelecionado ? mentoradoSelecionado : mentoradoId;
                    if (id) carregarMetas(id);
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {idParaMeta && (
        <NovaMetaDialog
          open={dialogNovaMetaAberto}
          onOpenChange={setDialogNovaMetaAberto}
          mentoradoId={idParaMeta}
          onSuccess={() => {
            const id = isAdmin && mentoradoSelecionado ? mentoradoSelecionado : mentoradoId;
            if (id) carregarMetas(id);
          }}
        />
      )}

      <NovoObjetivoDialog
        open={dialogNovoObjetivoAberto}
        onOpenChange={setDialogNovoObjetivoAberto}
        metaId={metaSelecionada}
        onSuccess={() => {
          const id = isAdmin && mentoradoSelecionado ? mentoradoSelecionado : mentoradoId;
          if (id) carregarMetas(id);
        }}
      />
    </div>
  );
}