import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Video, FileText, Clock, Play, BookOpen, ShoppingCart, ExternalLink, Building2 } from "lucide-react";
import { AdminMembrosDialog } from "@/components/AdminMembrosDialog";
import { AdminImportarConteudoDialog } from "@/components/AdminImportarConteudoDialog";
import { CadastrarLivroDialog } from "@/components/CadastrarLivroDialog";
import { AdminImportarLivrosDialog } from "@/components/AdminImportarLivrosDialog";
import { AdminPostoIpirangaDialog } from "@/components/AdminPostoIpirangaDialog";
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

  // Livros Recomendados
  const { data: livros, isLoading: loadingLivros } = useQuery({
    queryKey: ["livros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("livros_recomendados")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Links do Posto Ipiranga
  const { data: postoIpirangaLinks, isLoading: loadingPostoIpiranga, refetch: refetchPostoIpiranga } = useQuery({
    queryKey: ["posto-ipiranga-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posto_ipiranga_links")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data;
    },
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

  const filteredLivros = livros?.filter(
    (l) =>
      l.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.autor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.descricao_curta?.toLowerCase().includes(searchTerm.toLowerCase())
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
          placeholder="Buscar por título, descrição, tag, livro ou autor..."
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
          <TabsTrigger value="livraria">Livraria BORA</TabsTrigger>
          <TabsTrigger value="posto-ipiranga">
            <Building2 className="h-4 w-4 mr-2" />
            Posto Ipiranga
          </TabsTrigger>
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

        <TabsContent value="livraria" className="space-y-4">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">📖 Livraria BORA</h3>
              <p className="text-muted-foreground">
                Livros cuidadosamente selecionados para acelerar sua jornada empreendedora
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <AdminImportarLivrosDialog />
                <CadastrarLivroDialog />
              </div>
            )}
          </div>
          
          {loadingLivros ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredLivros && filteredLivros.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredLivros.map((livro) => (
                <Card
                  key={livro.id}
                  className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                    {livro.capa_url ? (
                      <img
                        src={livro.capa_url}
                        alt={livro.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{livro.titulo}</CardTitle>
                    <CardDescription className="font-medium">{livro.autor}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {livro.descricao_curta && (
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {livro.descricao_curta}
                      </p>
                    )}
                    {livro.url_compra && (
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        onClick={() => window.open(livro.url_compra, "_blank")}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Comprar Agora
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-border bg-card/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum livro cadastrado no momento. Em breve teremos recomendações incríveis!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Posto Ipiranga Tab */}
        <TabsContent value="posto-ipiranga" className="space-y-6">
          <Card className="border-border bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Posto Ipiranga
                  </CardTitle>
                  <CardDescription>
                    Recursos e materiais organizados por categoria para apoiar sua jornada
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="Empreededorismo" className="space-y-6">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="Empreededorismo">Empreededorismo</TabsTrigger>
                  <TabsTrigger value="Gestão">Gestão</TabsTrigger>
                  <TabsTrigger value="Projetos">Projetos</TabsTrigger>
                  <TabsTrigger value="Obras">Obras</TabsTrigger>
                </TabsList>

                {["Empreededorismo", "Gestão", "Projetos", "Obras"].map((categoria) => (
                  <TabsContent key={categoria} value={categoria} className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{categoria}</h3>
                        <p className="text-sm text-muted-foreground">
                          {categoria === "Empreededorismo" && "Recursos para desenvolver sua mentalidade e visão empreendedora"}
                          {categoria === "Gestão" && "Ferramentas e materiais para aprimorar sua gestão"}
                          {categoria === "Projetos" && "Guias e templates para gerenciamento de projetos"}
                          {categoria === "Obras" && "Materiais específicos para gestão de obras e construção"}
                        </p>
                      </div>
                      {isAdmin && (
                        <AdminPostoIpirangaDialog 
                          categoria={categoria}
                          onSuccess={() => refetchPostoIpiranga()}
                        />
                      )}
                    </div>

                    {loadingPostoIpiranga ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {postoIpirangaLinks
                          ?.filter((link) => link.categoria === categoria)
                          .map((link) => (
                            <Card key={link.id} className="border-border bg-card hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-foreground mb-1">{link.titulo}</h4>
                                    {link.descricao && (
                                      <p className="text-sm text-muted-foreground mb-3">{link.descricao}</p>
                                    )}
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                      Acessar recurso
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        {(!postoIpirangaLinks?.some((link) => link.categoria === categoria)) && (
                          <Card className="border-border bg-muted/30">
                            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                              <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Nenhum recurso disponível nesta categoria ainda.
                              </p>
                              {isAdmin && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Clique em "Adicionar Link" para começar.
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
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
