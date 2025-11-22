import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Calendar, TrendingUp, Target, Award, Instagram, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
        {/* Header com botão voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {/* Hero Section - Perfil do Mentorado */}
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={mentorado.profiles?.foto_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl">
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
                    <Badge variant="outline" className="text-sm">
                      📚 {mentorado.turma}
                    </Badge>
                  )}
                  <Badge
                    variant={mentorado.status === "ativo" ? "default" : "secondary"}
                    className="text-sm"
                  >
                    {mentorado.status === "ativo" ? "✓ Ativo" : "○ Inativo"}
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
              <TrendingUp className="h-4 w-4 text-primary" />
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
              <Target className="h-4 w-4 text-primary" />
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Desempenho por Pilares */}
          {pilares && pilares.length > 0 && (
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
          )}

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
                        <p className="text-sm font-medium">{d.mes_ano}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.contratos_fechados} contratos • {d.clientes_mes} clientes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">
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
        </div>

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
                          <div className="flex items-center gap-1 text-xs text-primary">
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
