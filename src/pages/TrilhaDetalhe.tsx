import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { AdminItemTrilhaDialog } from "@/components/AdminItemTrilhaDialog";
import { AdminTrilhaMentoradoDialog } from "@/components/AdminTrilhaMentoradoDialog";
import { 
  ArrowLeft, Calendar, Clock, ExternalLink, CheckCircle2, Circle, 
  Pencil, Trash2, FileText, Video, Link as LinkIcon, CheckSquare, BookOpen 
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TrilhaDetalhe {
  id: string;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  prioridade: string;
  status: string;
  mentorado_id: string;
  mentorados: {
    id: string;
    turma: string | null;
    profiles: {
      nome_completo: string;
      apelido: string | null;
      foto_url: string | null;
    } | null;
  } | null;
}

interface ItemTrilha {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  url: string | null;
  duracao_min: number | null;
  ordem: number;
  concluido: boolean;
  concluido_em: string | null;
}

const tipoIcons: Record<string, any> = {
  tarefa: CheckSquare,
  documento: FileText,
  aula: Video,
  curso: BookOpen,
  link_externo: LinkIcon,
};

const tipoLabels: Record<string, string> = {
  tarefa: "Tarefa",
  documento: "Documento",
  aula: "Aula",
  curso: "Curso",
  link_externo: "Link Externo",
};

export default function TrilhaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [trilha, setTrilha] = useState<TrilhaDetalhe | null>(null);
  const [itens, setItens] = useState<ItemTrilha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTrilha();
      fetchItens();
    }
  }, [id]);

  const fetchTrilha = async () => {
    const { data, error } = await supabase
      .from("trilhas_mentorado")
      .select(`
        *,
        mentorados (
          id,
          turma,
          profiles:user_id (
            nome_completo,
            apelido,
            foto_url
          )
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      toast.error("Erro ao carregar trilha");
      return;
    }

    setTrilha(data);
    setLoading(false);
  };

  const fetchItens = async () => {
    const { data } = await supabase
      .from("itens_trilha")
      .select("*")
      .eq("trilha_id", id)
      .order("ordem", { ascending: true });

    setItens(data || []);
  };

  const toggleConcluido = async (itemId: string, concluido: boolean) => {
    const { error } = await supabase
      .from("itens_trilha")
      .update({ 
        concluido: !concluido,
        concluido_em: !concluido ? new Date().toISOString() : null
      })
      .eq("id", itemId);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }

    toast.success(!concluido ? "Marcado como concluído!" : "Marcado como pendente");
    fetchItens();
  };

  const deleteItem = async (itemId: string) => {
    const { error } = await supabase
      .from("itens_trilha")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast.error("Erro ao remover item");
      return;
    }

    toast.success("Item removido");
    fetchItens();
  };

  const deleteTrilha = async () => {
    const { error } = await supabase
      .from("trilhas_mentorado")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao remover trilha");
      return;
    }

    toast.success("Trilha removida");
    navigate("/trilha");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!trilha) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/trilha")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Trilha não encontrada</p>
        </div>
      </div>
    );
  }

  const totalItens = itens.length;
  const itensConcluidos = itens.filter(i => i.concluido).length;
  const progresso = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;
  const diasRestantes = trilha.prazo 
    ? differenceInDays(parseISO(trilha.prazo), new Date())
    : null;

  const mentoradoNome = trilha.mentorados?.profiles?.apelido || 
    trilha.mentorados?.profiles?.nome_completo?.split(' ')[0] || 
    "Mentorado";

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/trilha")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{trilha.titulo}</h1>
            {trilha.descricao && (
              <p className="text-muted-foreground">{trilha.descricao}</p>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <AdminTrilhaMentoradoDialog
              trilhaToEdit={{
                id: trilha.id,
                mentorado_id: trilha.mentorado_id,
                titulo: trilha.titulo,
                descricao: trilha.descricao,
                prazo: trilha.prazo,
                prioridade: trilha.prioridade,
              }}
              onSuccess={fetchTrilha}
              trigger={
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deletar trilha?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Todos os itens da trilha serão removidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteTrilha}>Deletar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Progress Card */}
      <Card className="border-border bg-card shadow-card">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={trilha.mentorados?.profiles?.foto_url || undefined} />
                <AvatarFallback>
                  {mentoradoNome.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{mentoradoNome}</p>
                {trilha.mentorados?.turma && (
                  <p className="text-xs text-muted-foreground">{trilha.mentorados.turma}</p>
                )}
              </div>
            </div>
            <Badge 
              variant={trilha.prioridade === "urgente" ? "destructive" : "secondary"}
              className="capitalize"
            >
              {trilha.prioridade}
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progresso Geral</span>
              <span className="text-sm font-medium">{itensConcluidos}/{totalItens} módulos concluídos</span>
            </div>
            <Progress value={progresso} className="h-3" />
          </div>

          {trilha.prazo && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Prazo: {format(parseISO(trilha.prazo), "dd/MM/yyyy", { locale: ptBR })}
                {diasRestantes !== null && (
                  <span className={diasRestantes < 0 ? "text-destructive" : diasRestantes <= 7 ? "text-yellow-500" : ""}>
                    {" "}({diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias atrasado` : `${diasRestantes} dias restantes`})
                  </span>
                )}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="conteudo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>

        <TabsContent value="conteudo" className="space-y-4">
          {isAdmin && (
            <div className="flex justify-end">
              <AdminItemTrilhaDialog trilhaId={id!} onSuccess={fetchItens} />
            </div>
          )}

          {itens.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum item adicionado ainda
                </p>
                {isAdmin && (
                  <AdminItemTrilhaDialog 
                    trilhaId={id!} 
                    onSuccess={fetchItens}
                    trigger={
                      <Button className="mt-4">Adicionar primeiro item</Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {itens.map((item) => {
                const Icon = tipoIcons[item.tipo] || FileText;
                return (
                  <Card 
                    key={item.id} 
                    className={`border-border transition-colors ${
                      item.concluido 
                        ? "bg-green-500/10 border-green-500/30" 
                        : "bg-card hover:bg-muted/50"
                    }`}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${item.concluido ? "bg-green-500/20" : "bg-muted"}`}>
                            <Icon className={`h-5 w-5 ${item.concluido ? "text-green-500" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <p className={`font-medium ${item.concluido ? "line-through text-muted-foreground" : "text-foreground"}`}>
                              {item.titulo}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{tipoLabels[item.tipo]}</span>
                              {item.duracao_min && (
                                <>
                                  <span>•</span>
                                  <Clock className="h-3 w-3" />
                                  <span>{item.duracao_min}min</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.url && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => window.open(item.url!, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Abrir
                            </Button>
                          )}
                          
                          <Button
                            variant={item.concluido ? "outline" : "default"}
                            size="sm"
                            onClick={() => toggleConcluido(item.id, item.concluido)}
                            className={item.concluido ? "" : "bg-primary text-primary-foreground"}
                          >
                            {item.concluido ? (
                              <>
                                <Circle className="h-4 w-4 mr-1" />
                                Desfazer
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Concluir
                              </>
                            )}
                          </Button>

                          {isAdmin && (
                            <>
                              <AdminItemTrilhaDialog
                                trilhaId={id!}
                                itemToEdit={item}
                                onSuccess={fetchItens}
                                trigger={
                                  <Button variant="ghost" size="icon">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {item.descricao && (
                        <p className="text-sm text-muted-foreground mt-2 ml-12">
                          {item.descricao}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="info">
          <Card className="border-border bg-card">
            <CardContent className="pt-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Título</p>
                <p className="font-medium">{trilha.titulo}</p>
              </div>
              {trilha.descricao && (
                <div>
                  <p className="text-sm text-muted-foreground">Descrição</p>
                  <p>{trilha.descricao}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Prioridade</p>
                  <p className="capitalize">{trilha.prioridade}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="capitalize">{trilha.status.replace('_', ' ')}</p>
                </div>
              </div>
              {trilha.prazo && (
                <div>
                  <p className="text-sm text-muted-foreground">Prazo</p>
                  <p>{format(parseISO(trilha.prazo), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
