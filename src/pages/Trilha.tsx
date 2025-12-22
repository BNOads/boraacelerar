import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, BookOpen, Calendar, Eye } from "lucide-react";
import { AdminTrilhaDialog } from "@/components/AdminTrilhaDialog";
import { AdminImportarTrilhaDialog } from "@/components/AdminImportarTrilhaDialog";
import { AdminTrilhaMentoradoDialog } from "@/components/AdminTrilhaMentoradoDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { differenceInDays, parseISO } from "date-fns";

interface TrilhaItem {
  id: string;
  pilar: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  url: string | null;
  thumbnail_url: string | null;
}

interface TrilhaMentorado {
  id: string;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  prioridade: string;
  status: string;
  mentorado_id: string;
  mentorados: {
    profiles: {
      nome_completo: string;
      apelido: string | null;
      foto_url: string | null;
    } | null;
  } | null;
  itens_trilha: { id: string; concluido: boolean }[];
}

const pilarColors: Record<string, string> = {
  Empreendedor: "bg-secondary/20 text-secondary",
  Estruturação: "bg-blue-500/20 text-blue-400",
  Marketing: "bg-green-500/20 text-green-400",
  Vendas: "bg-red-500/20 text-red-400",
  Gestão: "bg-purple-500/20 text-purple-400",
  Finanças: "bg-secondary/20 text-secondary",
};

export default function Trilha() {
  const [items, setItems] = useState<TrilhaItem[]>([]);
  const [trilhasMentorados, setTrilhasMentorados] = useState<TrilhaMentorado[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrilha();
    fetchTrilhasMentorados();
  }, []);

  const fetchTrilha = async () => {
    const { data } = await supabase
      .from("trilha_aceleracao")
      .select("*")
      .order("pilar", { ascending: true })
      .order("ordem", { ascending: true });

    setItems(data || []);
    setLoading(false);
  };

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
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const groupedByPilar = items.reduce((acc, item) => {
    if (!acc[item.pilar]) acc[item.pilar] = [];
    acc[item.pilar].push(item);
    return acc;
  }, {} as Record<string, TrilhaItem[]>);

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
          <div className="flex gap-2">
            <AdminImportarTrilhaDialog />
            <AdminTrilhaDialog />
            <AdminTrilhaMentoradoDialog onSuccess={fetchTrilhasMentorados} />
          </div>
        )}
      </div>

      <Tabs defaultValue={isAdmin ? "mentorados" : "conteudo"} className="space-y-6">
        <TabsList>
          {isAdmin && <TabsTrigger value="mentorados">Trilhas dos Mentorados</TabsTrigger>}
          <TabsTrigger value="conteudo">Conteúdo Geral</TabsTrigger>
        </TabsList>

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

        <TabsContent value="conteudo" className="space-y-6">
          {Object.keys(groupedByPilar).length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Nenhum conteúdo disponível no momento.</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedByPilar).map(([pilar, pilarItems]) => (
              <div key={pilar} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge className={pilarColors[pilar] || "bg-muted text-muted-foreground"}>{pilar}</Badge>
                  <h2 className="text-2xl font-bold text-foreground">{pilar}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pilarItems.map((item) => (
                    <Card key={item.id} className="hover:scale-105 transition-transform border-border bg-card shadow-card">
                      {item.thumbnail_url && (
                        <div className="h-40 overflow-hidden rounded-t-lg bg-muted">
                          <img src={item.thumbnail_url} alt={item.titulo} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <CardHeader>
                        <Badge variant="outline" className="w-fit mb-2">{item.tipo}</Badge>
                        <CardTitle className="text-lg text-foreground">{item.titulo}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {item.descricao && <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{item.descricao}</p>}
                        {item.url && (
                          <Button className="w-full" onClick={() => window.open(item.url!, '_blank')}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Acessar
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
