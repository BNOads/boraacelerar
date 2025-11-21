import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Video, FileText, Clock, Play } from "lucide-react";
import { AdminMembrosDialog } from "@/components/AdminMembrosDialog";
import { AdminImportarConteudoDialog } from "@/components/AdminImportarConteudoDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function Membros() {
  const [searchTerm, setSearchTerm] = useState("");
  const { isAdmin } = useIsAdmin();

  // Buscar mentorado_id do usuário
  const { data: mentorado } = useQuery({
    queryKey: ["mentorado-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("mentorados")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Gravações de Encontros
  const { data: gravacoesEncontros, isLoading: loadingEncontros } = useQuery({
    queryKey: ["gravacoes-encontros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gravacoes_encontros")
        .select("*, encontros(*)")
        .eq("ativo", true)
        .order("data_publicacao", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Gravações Individuais
  const { data: gravacoesIndividuais, isLoading: loadingIndividuais } = useQuery({
    queryKey: ["gravacoes-individuais", mentorado?.id],
    queryFn: async () => {
      if (!mentorado?.id) return [];
      
      const { data, error } = await supabase
        .from("gravacoes_individuais")
        .select("*")
        .eq("mentorado_id", mentorado.id)
        .eq("ativo", true)
        .order("data_publicacao", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!mentorado?.id,
  });

  // Conteúdo Direcionado
  const { data: conteudoDirecionado, isLoading: loadingConteudo } = useQuery({
    queryKey: ["conteudo-direcionado", mentorado?.id],
    queryFn: async () => {
      if (!mentorado?.id) return [];
      
      const { data, error } = await supabase
        .from("conteudo_direcionado")
        .select(`
          *,
          atribuicoes:atribuicoes_conteudo(*)
        `)
        .eq("ativo", true)
        .order("data_publicacao", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!mentorado?.id,
  });

  const filteredEncontros = gravacoesEncontros?.filter(
    (g) =>
      g.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredIndividuais = gravacoesIndividuais?.filter(
    (g) =>
      g.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConteudo = conteudoDirecionado?.filter(
    (c) =>
      c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              🎥 Área de Membros
            </h1>
            <p className="text-muted-foreground">
              Acesse suas gravações, conteúdos direcionados e recomendações personalizadas
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <AdminImportarConteudoDialog />
              <AdminMembrosDialog />
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, descrição ou tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card/50 border-border"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gravacoes" className="space-y-6">
        <TabsList className="bg-card/50 border border-border">
          <TabsTrigger value="gravacoes">Minhas Gravações</TabsTrigger>
          <TabsTrigger value="conteudo">Meu Conteúdo</TabsTrigger>
          <TabsTrigger value="recomendacoes">Recomendações</TabsTrigger>
        </TabsList>

        <TabsContent value="gravacoes" className="space-y-6">
          {/* Gravações de Encontros */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">Encontros Gravados</h3>
            {loadingEncontros ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredEncontros && filteredEncontros.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredEncontros.map((gravacao) => (
                  <Card
                    key={gravacao.id}
                    className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="relative aspect-video bg-muted">
                      {gravacao.thumbnail_url ? (
                        <img
                          src={gravacao.thumbnail_url}
                          alt={gravacao.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        size="icon"
                        className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90"
                        onClick={() => window.open(gravacao.url_video, "_blank")}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-base">{gravacao.titulo}</CardTitle>
                      {gravacao.descricao && (
                        <CardDescription className="line-clamp-2">
                          {gravacao.descricao}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {gravacao.duracao_seg && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{Math.floor(gravacao.duracao_seg / 60)} min</span>
                        </div>
                      )}
                      {gravacao.tags && gravacao.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {gravacao.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma gravação encontrada.
              </p>
            )}
          </div>

          {/* Gravações 1:1 */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-foreground">Sessões Individuais</h3>
            {loadingIndividuais ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredIndividuais && filteredIndividuais.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredIndividuais.map((gravacao) => (
                  <Card
                    key={gravacao.id}
                    className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="relative aspect-video bg-muted">
                      {gravacao.thumbnail_url ? (
                        <img
                          src={gravacao.thumbnail_url}
                          alt={gravacao.titulo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Video className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        size="icon"
                        className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90"
                        onClick={() => window.open(gravacao.url_video, "_blank")}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-base">{gravacao.titulo}</CardTitle>
                      {gravacao.descricao && (
                        <CardDescription className="line-clamp-2">
                          {gravacao.descricao}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {gravacao.duracao_seg && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{Math.floor(gravacao.duracao_seg / 60)} min</span>
                        </div>
                      )}
                      {gravacao.tags && gravacao.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {gravacao.tags.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma sessão individual encontrada.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="conteudo" className="space-y-4">
          {loadingConteudo ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredConteudo && filteredConteudo.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredConteudo.map((conteudo) => (
                <Card
                  key={conteudo.id}
                  className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{conteudo.titulo}</CardTitle>
                      <Badge variant="outline" className="shrink-0">
                        {conteudo.tipo}
                      </Badge>
                    </div>
                    {conteudo.descricao && (
                      <CardDescription>{conteudo.descricao}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {conteudo.pilar && (
                      <Badge className="bg-primary/10 text-primary">
                        {conteudo.pilar}
                      </Badge>
                    )}
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => window.open(conteudo.url, "_blank")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Acessar Conteúdo
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum conteúdo direcionado no momento.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recomendacoes">
          <Card className="border-border bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Sistema de recomendações em desenvolvimento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
