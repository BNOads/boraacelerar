import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Calendar, TrendingUp, Target, Award, Instagram, Mail, Phone, Share2, BookOpen, CheckCircle, Circle } from "lucide-react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MentoradoProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Buscar informações do mentorado
  const { data: mentorado, isLoading } = useQuery({
    queryKey: ["mentorado-profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorados")
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Buscar desempenho mensal
  const { data: desempenho } = useQuery({
    queryKey: ["mentorado-desempenho", mentorado?.id],
    queryFn: async () => {
      if (!mentorado?.id) return [];
      
      const { data, error } = await supabase
        .from("desempenho_mensal")
        .select("*")
        .eq("mentorado_id", mentorado.id)
        .order("mes_ano", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
    enabled: !!mentorado?.id,
  });

  // Buscar desempenho por pilares
  const { data: pilares } = useQuery({
    queryKey: ["mentorado-pilares", mentorado?.id],
    queryFn: async () => {
      if (!mentorado?.id) return [];
      
      const { data, error } = await supabase
        .from("pilares_desempenho")
        .select("*")
        .eq("mentorado_id", mentorado.id)
        .order("mes_ano", { ascending: false })
        .limit(1);

      if (error) throw error;
      return data;
    },
    enabled: !!mentorado?.id,
  });

  // Buscar atendimentos
  const { data: atendimentos } = useQuery({
    queryKey: ["mentorado-atendimentos", mentorado?.id],
    queryFn: async () => {
      if (!mentorado?.id) return [];
      
      const { data, error } = await supabase
        .from("atendimentos_navegador")
        .select("*")
        .eq("mentorado_id", mentorado.id)
        .order("data_hora", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!mentorado?.id,
  });

  // Buscar metas
  const { data: metas } = useQuery({
    queryKey: ["mentorado-metas", mentorado?.id],
    queryFn: async () => {
      if (!mentorado?.id) return [];
      
      const { data, error } = await supabase
        .from("metas")
        .select("*")
        .eq("mentorado_id", mentorado.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!mentorado?.id,
  });

  // Buscar métricas mensais (redes sociais)
  const { data: metricasMensais } = useQuery({
    queryKey: ["mentorado-metricas", mentorado?.id],
    queryFn: async () => {
      if (!mentorado?.id) return [];
      
      const { data, error } = await supabase
        .from("metricas_mensais")
        .select("*")
        .eq("mentorado_id", mentorado.id)
        .order("mes_ano", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!mentorado?.id,
  });

  // Buscar todo o desempenho mensal para o gráfico
  const { data: desempenhoCompleto } = useQuery({
    queryKey: ["mentorado-desempenho-completo", mentorado?.id],
    queryFn: async () => {
      if (!mentorado?.id) return [];
      
      const { data, error } = await supabase
        .from("desempenho_mensal")
        .select("*")
        .eq("mentorado_id", mentorado.id)
        .order("mes_ano", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!mentorado?.id,
  });

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${mentorado?.profiles?.nome_completo}`,
        text: `Confira o perfil e resultados de ${mentorado?.profiles?.nome_completo}`,
        url: url,
      }).then(() => {
        toast.success("Link compartilhado com sucesso!");
      }).catch((error) => {
        console.error("Erro ao compartilhar:", error);
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!mentorado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Mentorado não encontrado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalFaturamento = desempenho?.reduce((acc, d) => acc + (Number(d.faturamento_mensal) || 0), 0) || 0;
  const totalContratos = desempenho?.reduce((acc, d) => acc + (d.contratos_fechados || 0), 0) || 0;
  const ultimoDesempenho = desempenho?.[0];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header com botão voltar e compartilhar */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            variant="outline"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
        </div>

        {/* Hero Section - Perfil do Mentorado */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={mentorado.profiles?.foto_url} />
                <AvatarFallback className="bg-secondary/10 text-secondary text-3xl">
                  {mentorado.profiles?.nome_completo?.charAt(0) || <User className="h-16 w-16" />}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    {mentorado.profiles?.nome_completo || mentorado.profiles?.apelido}
                  </h1>
                  {mentorado.profiles?.apelido && mentorado.profiles?.apelido !== mentorado.profiles?.nome_completo && (
                    <p className="text-lg text-muted-foreground">@{mentorado.profiles.apelido}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {mentorado.turma && (
                    <Badge variant="outline" className="text-sm flex items-center gap-1">
                      <BookOpen className="h-3 w-3" strokeWidth={1.5} /> {mentorado.turma}
                    </Badge>
                  )}
                  <Badge
                    variant={mentorado.status === "ativo" ? "default" : "secondary"}
                    className="text-sm flex items-center gap-1"
                  >
                    {mentorado.status === "ativo" ? <><CheckCircle className="h-3 w-3" strokeWidth={1.5} /> Ativo</> : <><Circle className="h-3 w-3" strokeWidth={1.5} /> Inativo</>}
                  </Badge>
                  {mentorado.data_ingresso && (
                    <Badge variant="outline" className="text-sm">
                      <Calendar className="mr-1 h-3 w-3" />
                      Desde {format(new Date(mentorado.data_ingresso), "MMM/yyyy", { locale: ptBR })}
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground justify-center md:justify-start">
                  {mentorado.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{mentorado.email}</span>
                    </div>
                  )}
                  {mentorado.whatsapp && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{mentorado.whatsapp}</span>
                    </div>
                  )}
                  {mentorado.instagram && (
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      <span>{mentorado.instagram}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturamento Total
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                R$ {totalFaturamento.toLocaleString("pt-BR")}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contratos Fechados
              </CardTitle>
              <Award className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalContratos}</div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Meta Clientes
              </CardTitle>
              <Target className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {mentorado.meta_clientes || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Atendimentos
              </CardTitle>
              <Calendar className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {atendimentos?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Evolução */}
        <Tabs defaultValue="financeiro" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="redes">Redes Sociais</TabsTrigger>
            <TabsTrigger value="pilares">Pilares</TabsTrigger>
          </TabsList>

          {/* Tab Financeiro */}
          <TabsContent value="financeiro" className="space-y-6">
            {desempenhoCompleto && desempenhoCompleto.length > 0 && (
              <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Evolução do Faturamento</CardTitle>
                  <CardDescription>Histórico completo de faturamento mensal</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={desempenhoCompleto.map(d => ({
                      mes_formatado: format(parse(d.mes_ano, 'yyyy-MM', new Date()), 'MMM yyyy', { locale: ptBR }),
                      faturamento: Number(d.faturamento_mensal || 0),
                      meta: Number(d.meta_mensal || 0),
                      contratos: d.contratos_fechados || 0,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes_formatado" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any) => `R$ ${Number(value).toLocaleString("pt-BR")}`}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="faturamento" stroke="hsl(var(--primary))" name="Faturamento" strokeWidth={2} />
                      <Line type="monotone" dataKey="meta" stroke="hsl(var(--accent))" name="Meta" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Histórico de Desempenho */}
              {desempenho && desempenho.length > 0 && (
                <Card className="border-border bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Histórico de Resultados</CardTitle>
                    <CardDescription>Últimos 6 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {desempenho.map((d) => (
                        <div key={d.id} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {format(parse(d.mes_ano, 'yyyy-MM', new Date()), 'MMM yyyy', { locale: ptBR })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {d.contratos_fechados} contratos • {d.clientes_mes} clientes
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-secondary">
                              R$ {Number(d.faturamento_mensal || 0).toLocaleString("pt-BR")}
                            </p>
                            {d.meta_mensal && (
                              <p className="text-xs text-muted-foreground">
                                Meta: R$ {Number(d.meta_mensal).toLocaleString("pt-BR")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {desempenhoCompleto && desempenhoCompleto.length > 0 && (
                <Card className="border-border bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Evolução de Contratos</CardTitle>
                    <CardDescription>Contratos fechados por mês</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={desempenhoCompleto.map(d => ({
                        mes_formatado: format(parse(d.mes_ano, 'yyyy-MM', new Date()), 'MMM yyyy', { locale: ptBR }),
                        contratos: d.contratos_fechados || 0,
                        propostas: d.qtd_propostas || 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes_formatado" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="contratos" stroke="hsl(var(--primary))" name="Contratos" strokeWidth={2} />
                        <Line type="monotone" dataKey="propostas" stroke="hsl(var(--accent))" name="Propostas" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab Metas */}
          <TabsContent value="metas">
            {metas && metas.length > 0 ? (
              <div className="grid gap-4">
                {metas.map((meta) => (
                  <Card key={meta.id} className="border-border bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: meta.cor }}
                          />
                          <CardTitle className="text-lg">{meta.titulo}</CardTitle>
                        </div>
                        <Badge variant={meta.status === 'ativa' ? 'default' : meta.status === 'concluida' ? 'outline' : 'secondary'}>
                          {meta.status}
                        </Badge>
                      </div>
                      {meta.descricao && (
                        <CardDescription>{meta.descricao}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Progresso</span>
                          <span className="font-medium">{meta.progresso}%</span>
                        </div>
                        <Progress value={meta.progresso} className="h-2" />
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div>
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {format(new Date(meta.data_inicio), 'dd/MM/yyyy')}
                        </div>
                        {meta.data_fim && (
                          <>
                            <span>→</span>
                            <div>
                              {format(new Date(meta.data_fim), 'dd/MM/yyyy')}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-border bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Target className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma meta cadastrada ainda.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Redes Sociais */}
          <TabsContent value="redes">
            {metricasMensais && metricasMensais.length > 0 ? (
              <div className="space-y-6">
                <Card className="border-border bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Evolução de Seguidores</CardTitle>
                    <CardDescription>Crescimento nas redes sociais ao longo do tempo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={metricasMensais.map(m => ({
                        mes_formatado: format(parse(m.mes_ano, 'yyyy-MM', new Date()), 'MMM yyyy', { locale: ptBR }),
                        instagram: m.seguidores_instagram || 0,
                        tiktok: m.seguidores_tiktok || 0,
                        youtube: m.seguidores_youtube || 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes_formatado" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="instagram" stroke="#E1306C" name="Instagram" strokeWidth={2} />
                        <Line type="monotone" dataKey="tiktok" stroke="#000000" name="TikTok" strokeWidth={2} />
                        <Line type="monotone" dataKey="youtube" stroke="#FF0000" name="YouTube" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-border bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Instagram className="h-4 w-4 text-[#E1306C]" />
                        Instagram
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metricasMensais[metricasMensais.length - 1]?.seguidores_instagram?.toLocaleString("pt-BR") || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">seguidores</p>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        TikTok
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metricasMensais[metricasMensais.length - 1]?.seguidores_tiktok?.toLocaleString("pt-BR") || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">seguidores</p>
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <svg className="h-4 w-4 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        YouTube
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {metricasMensais[metricasMensais.length - 1]?.seguidores_youtube?.toLocaleString("pt-BR") || 0}
                      </div>
                      <p className="text-xs text-muted-foreground">inscritos</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="border-border bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Instagram className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma métrica de redes sociais cadastrada ainda.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Pilares */}
          <TabsContent value="pilares">
            {pilares && pilares.length > 0 ? (
              <Card className="border-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Desempenho por Pilar</CardTitle>
                  <CardDescription>Última avaliação registrada</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pilares.map((pilar) => (
                    <div key={pilar.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{pilar.pilar}</span>
                        <span className="text-muted-foreground">{pilar.nota_0_100}%</span>
                      </div>
                      <Progress value={pilar.nota_0_100 || 0} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border bg-card/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Award className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma avaliação de pilares cadastrada ainda.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Últimos Atendimentos */}
        {atendimentos && atendimentos.length > 0 && (
          <Card className="border-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Últimos Atendimentos</CardTitle>
              <CardDescription>Histórico de atendimentos com navegador</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {atendimentos.map((atendimento) => (
                  <div key={atendimento.id}>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {atendimento.canal}
                          </Badge>
                          <Badge
                            variant={
                              atendimento.status === "Resolvido"
                                ? "default"
                                : atendimento.status === "Pendente"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {atendimento.status}
                          </Badge>
                        </div>
                        {atendimento.assunto && (
                          <p className="text-sm font-medium">{atendimento.assunto}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(atendimento.data_hora), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                        {atendimento.avaliacao && (
                          <div className="flex items-center gap-1 text-xs text-secondary">
                            <span>{"⭐".repeat(atendimento.avaliacao)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mensagem quando não há dados */}
        {(!desempenho || desempenho.length === 0) &&
          (!pilares || pilares.length === 0) &&
          (!atendimentos || atendimentos.length === 0) && (
            <Card className="border-border bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Ainda não há resultados registrados para este mentorado.
                </p>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}
