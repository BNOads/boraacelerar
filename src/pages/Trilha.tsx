import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Calendar, Eye, CheckCircle2, Clock, Target } from "lucide-react";
import { AdminTrilhaMentoradoDialog } from "@/components/AdminTrilhaMentoradoDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TrilhaMentorado {
  id: string;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  prioridade: string;
  status: string;
  mentorado_id: string;
  created_at: string;
  mentorados: {
    profiles: {
      nome_completo: string;
      apelido: string | null;
      foto_url: string | null;
    } | null;
  } | null;
  itens_trilha: { id: string; concluido: boolean }[];
}

export default function Trilha() {
  const [trilhasMentorados, setTrilhasMentorados] = useState<TrilhaMentorado[]>([]);
  const [minhasTrilhas, setMinhasTrilhas] = useState<TrilhaMentorado[]>([]);
  const [loading, setLoading] = useState(true);
  const [mentoradoId, setMentoradoId] = useState<string | null>(null);
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrilhasMentorados();
    fetchMinhasTrilhas();
  }, []);

  const fetchTrilhasMentorados = async () => {
    const { data } = await supabase
      .from("trilhas_mentorado")
      .select(`
        *,
        mentorados (
          profiles:user_id (
            nome_completo,
            apelido,
            foto_url
          )
        ),
        itens_trilha (id, concluido)
      `)
      .order("created_at", { ascending: false });

    setTrilhasMentorados(data || []);
    setLoading(false);
  };

  const fetchMinhasTrilhas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar o mentorado_id do usuário logado
    const { data: mentorado } = await supabase
      .from("mentorados")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (mentorado) {
      setMentoradoId(mentorado.id);
      
      const { data } = await supabase
        .from("trilhas_mentorado")
        .select(`
          *,
          mentorados (
            profiles:user_id (
              nome_completo,
              apelido,
              foto_url
            )
          ),
          itens_trilha (id, concluido)
        `)
        .eq("mentorado_id", mentorado.id)
        .order("created_at", { ascending: false });

      setMinhasTrilhas(data || []);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "concluida":
        return <Badge className="bg-green-500/20 text-green-500">Concluída</Badge>;
      case "em_andamento":
        return <Badge className="bg-blue-500/20 text-blue-400">Em Andamento</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "urgente":
        return <Badge variant="secondary">Urgente</Badge>;
      case "alta":
        return <Badge className="bg-orange-500/20 text-orange-400">Alta</Badge>;
      default:
        return null;
    }
  };

  // Calcular estatísticas das minhas trilhas
  const totalTrilhas = minhasTrilhas.length;
  const trilhasConcluidas = minhasTrilhas.filter(t => t.status === "concluida").length;
  const trilhasEmAndamento = minhasTrilhas.filter(t => t.status === "em_andamento").length;
  const totalItens = minhasTrilhas.reduce((acc, t) => acc + t.itens_trilha.length, 0);
  const itensConcluidos = minhasTrilhas.reduce((acc, t) => acc + t.itens_trilha.filter(i => i.concluido).length, 0);
  const progressoGeral = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-4xl font-bold text-foreground">Trilha & Conteúdo</h1>
            <p className="text-muted-foreground text-lg">
              Explore os módulos e acompanhe trilhas personalizadas
            </p>
          </div>
        </div>
        {isAdmin && (
          <AdminTrilhaMentoradoDialog onSuccess={() => { fetchTrilhasMentorados(); fetchMinhasTrilhas(); }} />
        )}
      </div>

      <Tabs defaultValue={mentoradoId && !isAdmin ? "minhas" : "mentorados"} className="space-y-6">
        <TabsList>
          {mentoradoId && <TabsTrigger value="minhas">Minhas Trilhas</TabsTrigger>}
          {isAdmin && <TabsTrigger value="mentorados">Trilhas dos Mentorados</TabsTrigger>}
        </TabsList>

        {/* Seção Minhas Trilhas - para mentorados */}
        {mentoradoId && (
          <TabsContent value="minhas" className="space-y-6">
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{totalTrilhas}</p>
                      <p className="text-xs text-muted-foreground">Total de Trilhas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{trilhasConcluidas}</p>
                      <p className="text-xs text-muted-foreground">Concluídas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Clock className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{trilhasEmAndamento}</p>
                      <p className="text-xs text-muted-foreground">Em Andamento</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Progresso Geral</p>
                      <p className="text-sm font-medium">{progressoGeral}%</p>
                    </div>
                    <Progress value={progressoGeral} className="h-2" />
                    <p className="text-xs text-muted-foreground">{itensConcluidos}/{totalItens} itens concluídos</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de trilhas */}
            {minhasTrilhas.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Você ainda não possui trilhas personalizadas.</p>
                  <p className="text-sm text-muted-foreground mt-1">Quando seu navegador criar uma trilha para você, ela aparecerá aqui.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {minhasTrilhas.map((trilha) => {
                  const total = trilha.itens_trilha.length;
                  const concluidos = trilha.itens_trilha.filter(i => i.concluido).length;
                  const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;
                  const diasRestantes = trilha.prazo ? differenceInDays(parseISO(trilha.prazo), new Date()) : null;

                  return (
                    <Card key={trilha.id} className="border-border bg-card shadow-card hover:shadow-glow transition-all">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-lg line-clamp-1">{trilha.titulo}</CardTitle>
                          <div className="flex items-center gap-1">
                            {getPrioridadeBadge(trilha.prioridade)}
                            {getStatusBadge(trilha.status)}
                          </div>
                        </div>
                        {trilha.descricao && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{trilha.descricao}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium text-foreground">{progresso}%</span>
                          </div>
                          <Progress value={progresso} className="h-2" />
                          <p className="text-xs text-muted-foreground">{concluidos} de {total} itens concluídos</p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {diasRestantes !== null && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className={diasRestantes < 0 ? "text-destructive font-medium" : diasRestantes <= 3 ? "text-orange-400" : ""}>
                                {diasRestantes < 0 
                                  ? `${Math.abs(diasRestantes)} dias atrasado` 
                                  : diasRestantes === 0 
                                  ? "Vence hoje!" 
                                  : `${diasRestantes} dias restantes`}
                              </span>
                            </div>
                          )}
                          <span>Criada em {format(parseISO(trilha.created_at), "dd/MM", { locale: ptBR })}</span>
                        </div>

                        <Button 
                          className="w-full" 
                          onClick={() => navigate(`/trilha/${trilha.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {trilha.status === "concluida" ? "Ver Trilha" : "Continuar"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="mentorados" className="space-y-4">
            {trilhasMentorados.length === 0 ? (
              <Card className="border-border bg-card">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Nenhuma trilha personalizada criada ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trilhasMentorados.map((trilha) => {
                  const total = trilha.itens_trilha.length;
                  const concluidos = trilha.itens_trilha.filter(i => i.concluido).length;
                  const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;
                  const diasRestantes = trilha.prazo ? differenceInDays(parseISO(trilha.prazo), new Date()) : null;
                  const nome = trilha.mentorados?.profiles?.apelido || trilha.mentorados?.profiles?.nome_completo?.split(' ')[0] || "Mentorado";

                  return (
                    <Card key={trilha.id} className="border-border bg-card shadow-card hover:shadow-glow transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{trilha.titulo}</CardTitle>
                          {trilha.prioridade === "urgente" && (
                            <Badge variant="secondary">Urgente</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={trilha.mentorados?.profiles?.foto_url || undefined} />
                            <AvatarFallback className="text-xs">{nome.slice(0, 1)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-foreground">{nome}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{concluidos}/{total} aulas</span>
                          </div>
                          <Progress value={progresso} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {diasRestantes !== null && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className={diasRestantes < 0 ? "text-destructive" : ""}>
                                {diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias atrasado` : `${diasRestantes} dias restantes`}
                              </span>
                            </div>
                          )}
                          <span>{total} aulas</span>
                        </div>

                        <Button 
                          className="w-full" 
                          onClick={() => navigate(`/trilha/${trilha.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Trilha
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}

      </Tabs>
    </div>
  );
}
