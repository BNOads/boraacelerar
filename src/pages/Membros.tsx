import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Video, FileText, Clock, Play, ExternalLink, Edit, User } from "lucide-react";
import { AdminMembrosDialog } from "@/components/AdminMembrosDialog";
import { AdminImportarConteudoDialog } from "@/components/AdminImportarConteudoDialog";
import { AdminPostoIpirangaDialog } from "@/components/AdminPostoIpirangaDialog";
import { EditarPostoIpirangaDialog } from "@/components/EditarPostoIpirangaDialog";
import { AdminGravacaoIndividualDialog } from "@/components/AdminGravacaoIndividualDialog";
import { EditarGravacaoIndividualDialog } from "@/components/EditarGravacaoIndividualDialog";
import { EditarEncontroGravadoDialog } from "@/components/EditarEncontroGravadoDialog";
import { EditarConteudoDialog } from "@/components/EditarConteudoDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { getVideoThumbnail } from "@/lib/videoUtils";
import logoBora from "@/assets/logo-bora.png";

const TIPOS_FILTRO = ["Todos", "Hotseat", "Implementação", "Mentoria", "Análise Temática", "Imersões com Convidados"] as const;

export default function Membros() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchEncontros, setSearchEncontros] = useState("");
  const [searchIndividuais, setSearchIndividuais] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("Todos");
  const { isAdmin } = useIsAdmin();
  const [editingLink, setEditingLink] = useState<any>(null);
  const [editingGravacao, setEditingGravacao] = useState<any>(null);
  const [editingEncontro, setEditingEncontro] = useState<any>(null);
  const [editingConteudo, setEditingConteudo] = useState<any>(null);

  // Buscar mentorado_id do usuário
  const { data: mentorado } = useQuery({
    queryKey: ["mentorado-profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("mentorados")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

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

  // Gravações Individuais - Para mentorado normal
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
    enabled: !!mentorado?.id && !isAdmin,
  });

  // Gravações Individuais - Para admin (todas)
  const { data: todasGravacoesIndividuais, isLoading: loadingTodasIndividuais } = useQuery({
    queryKey: ["todas-gravacoes-individuais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gravacoes_individuais")
        .select(`
          *,
          mentorado:mentorados(
            id,
            user_id,
            profile:profiles(nome_completo, apelido)
          )
        `)
        .eq("ativo", true)
        .order("data_publicacao", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Conteúdo Direcionado
  const { data: conteudoDirecionado, isLoading: loadingConteudo } = useQuery({
    queryKey: ["conteudo-direcionado"],
    queryFn: async () => {
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

  // Filtragem de encontros
  const filteredEncontros = gravacoesEncontros?.filter(
    (g) =>
      g.titulo.toLowerCase().includes(searchEncontros.toLowerCase()) ||
      g.descricao?.toLowerCase().includes(searchEncontros.toLowerCase())
  );

  // Filtragem de sessões individuais (mentorado)
  const filteredIndividuais = gravacoesIndividuais?.filter(
    (g) =>
      g.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtragem de todas sessões individuais (admin)
  const filteredTodasIndividuais = todasGravacoesIndividuais?.filter((g) => {
    const mentoradoNome = g.mentorado?.profile?.nome_completo || g.mentorado?.profile?.apelido || "";
    return (
      g.titulo.toLowerCase().includes(searchIndividuais.toLowerCase()) ||
      g.descricao?.toLowerCase().includes(searchIndividuais.toLowerCase()) ||
      mentoradoNome.toLowerCase().includes(searchIndividuais.toLowerCase())
    );
  });

  const filteredConteudo = conteudoDirecionado?.filter((c) => {
    const matchSearch =
      c.titulo.toLowerCase().includes(searchEncontros.toLowerCase()) ||
      c.descricao?.toLowerCase().includes(searchEncontros.toLowerCase());
    const matchTipo = filtroTipo === "Todos" || c.tags?.[0] === filtroTipo;
    return matchSearch && matchTipo;
  });

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
              <AdminGravacaoIndividualDialog />
              <AdminImportarConteudoDialog />
              <AdminMembrosDialog />
            </div>
          )}
        </div>
      </div>


      {/* Tabs */}
      <Tabs defaultValue="gravacoes" className="space-y-6">
        <TabsList className="bg-card/50 border border-border">
          <TabsTrigger value="gravacoes">Minhas Gravações</TabsTrigger>
          <TabsTrigger value="agentes-ia">Agentes de IA</TabsTrigger>
          <TabsTrigger value="posto-ipiranga">
            <span className="mr-2">⛽️</span>
            Posto Ipiranga
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gravacoes" className="space-y-6">
          {/* Gravações de Encontros */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-foreground">Encontros Gravados</h3>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar encontro ou conteúdo..."
                    value={searchEncontros}
                    onChange={(e) => setSearchEncontros(e.target.value)}
                    className="pl-10 bg-card/50 border-border"
                  />
                </div>
              </div>
              {/* Filtros por tipo */}
              <div className="flex flex-wrap gap-2">
                {TIPOS_FILTRO.map((tipo) => (
                  <Badge
                    key={tipo}
                    variant={filtroTipo === tipo ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => setFiltroTipo(tipo)}
                  >
                    {tipo}
                  </Badge>
                ))}
              </div>
            </div>
            {loadingEncontros || loadingConteudo ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (filteredEncontros && filteredEncontros.length > 0) || (filteredConteudo && filteredConteudo.length > 0) ? (
              <div className="space-y-6">
                {/* Conteúdos Direcionados - Cards menores com scroll horizontal */}
                {filteredConteudo && filteredConteudo.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-foreground">Conteúdos</h4>
                    <div className="relative">
                      <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                          {filteredConteudo.map((conteudo) => {
                            const tipo = conteudo.tags?.[0];
                            const thumb = conteudo.url ? getVideoThumbnail(conteudo.url) : null;
                            return (
                              <Card
                                key={`conteudo-${conteudo.id}`}
                                className="w-[200px] shrink-0 border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                                onClick={() => conteudo.url && window.open(conteudo.url, "_blank")}
                              >
                                <div className="relative aspect-video bg-muted">
                                  {thumb ? (
                                    <img src={thumb} alt={conteudo.titulo} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="flex items-center justify-center h-full bg-card p-2">
                                      <img src={logoBora} alt="Logo" className="max-h-full max-w-full object-contain opacity-60" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                                    <ExternalLink className="h-6 w-6 text-white" />
                                  </div>
                                  {tipo && (
                                    <Badge variant="default" className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5">
                                      {tipo}
                                    </Badge>
                                  )}
                                </div>
                                <CardHeader className="p-3">
                                  <div className="flex items-center justify-between gap-1">
                                    <CardTitle className="text-sm line-clamp-1">{conteudo.titulo}</CardTitle>
                                    {isAdmin && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 shrink-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingConteudo(conteudo);
                                        }}
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  {conteudo.descricao && (
                                    <CardDescription className="text-xs line-clamp-1">{conteudo.descricao}</CardDescription>
                                  )}
                                </CardHeader>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Encontros Gravados - Grid normal */}
                {filteredEncontros && filteredEncontros.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-foreground">Encontros Gravados</h4>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredEncontros.map((gravacao) => {
                        const thumbnail = gravacao.thumbnail_url || getVideoThumbnail(gravacao.url_video);
                        return (
                          <Card
                            key={`encontro-${gravacao.id}`}
                            className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
                          >
                            <div
                              className="relative aspect-video bg-muted cursor-pointer"
                              onClick={() => window.open(gravacao.url_video, "_blank")}
                            >
                              {thumbnail ? (
                                <img src={thumbnail} alt={gravacao.titulo} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full bg-card p-4">
                                  <img src={logoBora} alt="Logo" className="max-h-full max-w-full object-contain opacity-60" />
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                                <Play className="h-12 w-12 text-white" />
                              </div>
                            </div>
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{gravacao.titulo}</CardTitle>
                                {isAdmin && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingEncontro(gravacao);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              {gravacao.descricao && (
                                <CardDescription className="line-clamp-2">{gravacao.descricao}</CardDescription>
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
                                  {gravacao.tags.slice(0, 3).map((tag: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhuma gravação encontrada.</p>
            )}
          </div>

          {/* Sessões Individuais - Visão do Mentorado */}
          {!isAdmin && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">Sessões Individuais</h3>
              {loadingIndividuais ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredIndividuais && filteredIndividuais.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredIndividuais.map((gravacao) => {
                    const thumbnail = getVideoThumbnail(gravacao.url_video);
                    return (
                      <Card
                        key={gravacao.id}
                        className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
                      >
                        <div 
                          className="relative aspect-video bg-muted cursor-pointer"
                          onClick={() => window.open(gravacao.url_video, "_blank")}
                        >
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={gravacao.titulo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-card p-4">
                              <img src={logoBora} alt="Logo" className="max-h-full max-w-full object-contain opacity-60" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="h-12 w-12 text-white" />
                          </div>
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
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma sessão individual encontrada.
                </p>
              )}
            </div>
          )}

          {/* Sessões Individuais - Visão do Admin (todas as sessões) */}
          {isAdmin && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-bold text-foreground">Sessões Individuais (Todas)</h3>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por mentorado..."
                    value={searchIndividuais}
                    onChange={(e) => setSearchIndividuais(e.target.value)}
                    className="pl-10 bg-card/50 border-border"
                  />
                </div>
              </div>
              {loadingTodasIndividuais ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredTodasIndividuais && filteredTodasIndividuais.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTodasIndividuais.map((gravacao) => {
                    const thumbnail = getVideoThumbnail(gravacao.url_video);
                    const mentoradoNome = gravacao.mentorado?.profile?.apelido || gravacao.mentorado?.profile?.nome_completo || "Mentorado";
                    return (
                      <Card
                        key={gravacao.id}
                        className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
                      >
                        <div 
                          className="relative aspect-video bg-muted cursor-pointer"
                          onClick={() => window.open(gravacao.url_video, "_blank")}
                        >
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={gravacao.titulo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full bg-card p-4">
                              <img src={logoBora} alt="Logo" className="max-h-full max-w-full object-contain opacity-60" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        </div>
                        <CardHeader>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground font-medium">{mentoradoNome}</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGravacao(gravacao);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
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
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma sessão individual encontrada.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="agentes-ia">
          <Card className="border-border bg-card/50">
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2">🤖 Agentes de IA</CardTitle>
                <CardDescription>
                  Coleção de agentes para apoiar metas, precificação, posicionamento, marketing, vendas, projetos e obras.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">🤖 Agentes de suporte para auxiliar na criação de Metas</h4>
                <ul className="mt-2 space-y-1 list-none">
                  <li>
                    <a href="https://chatgpt.com/g/g-693d3dfde064819191ec396762e96ee8-mba-metas-pessoais-2026" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Metas pessoais
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                  <li>
                    <a href="https://chatgpt.com/g/g-693d7baae68c8191a4ab4ed1639edd65-mba-metas-para-escritorios-e-construtora" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Metas do negócio
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">🤖 Agentes de suporte para auxiliar na Precificação</h4>
                <ul className="mt-2 space-y-1 list-none">
                  <li>
                    <a href="https://chatgpt.com/g/g-68753f363fb0819183e161707647d548-boranaobra-calculadora-da-hora-do-escritorio" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Calculadora de custo/hora do escritório
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                  <li>
                    <a href="https://chatgpt.com/g/g-68754d3406ac81918d8d55840722d725-boranaobra-precificacao-de-projeto" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Calculadora de valor de Projeto
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                  <li>
                    <a href="https://chatgpt.com/g/g-68754de919808191a4dca447e904b99f-mba-precificador-evf" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Calculadora de valor de EVF
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                  <li>
                    <a href="https://chatgpt.com/g/g-687552be41a08191993b9ad7a0ed2705-mba-precificador-de-custo-fixo-de-obra" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Calculadora de valor fixo mensal de Obra
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">🤖 Agentes para trabalhar o Posicionamento</h4>
                <ul className="mt-2 space-y-1 list-none">
                  <li>
                    <a href="https://chatgpt.com/g/g-686451db18a48191b82471c2e12b423c-mba-posicionamento-estrategico" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Posicionamento pessoal
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                  <li>
                    <a href="https://chatgpt.com/g/g-6891ed5302a0819181dd2eef80557650-mba-posicionamento-empresarial" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Agente de posicionamento de estratégia da empresa
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">🤖 Agente de suporte para facilitar o Marketing</h4>
                <ul className="mt-2 space-y-1 list-none">
                  <li>
                    <a href="https://chatgpt.com/g/g-6864770bdb0c819193664fc8e6dbec06-mba-organizador-de-perfil-profissional" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Organizador de perfil profissional (bio e posts fixados)
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                  <li>
                    <a href="https://chatgpt.com/g/g-6839cc7005f88191aa6b98d1c0f95a11-ace-agente-de-producao-de-conteudo" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Produção de Conteúdo
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                  <li>
                    <a href="https://chatgpt.com/g/g-68be3d13a8ec8191ae908402c4e7cdaa-mba-producao-de-conteudo-c1-c2-e-c3" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Produção de conteúdo (c1, c2, c3)
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">🤖 Agente de suporte para facilitar nas Vendas</h4>
                <ul className="mt-2 space-y-1 list-none">
                  <li>
                    <a href="https://chatgpt.com/g/g-6875a39fea8c819181846aca5aea3057-mba-construtor-de-jornada-do-cliente" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Criação da Jornada do Cliente
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                  <li>
                    <a href="https://chatgpt.com/g/g-684d572390cc8191a7362c85d163e0da-ace-criacao-de-campanhas-de-vendas-conteudo" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Estruturação de Campanhas de Vendas
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                  <li>
                    <a href="https://chatgpt.com/g/g-68759980cf488191bdc3adb7c3af7688-mba-assistente-de-caixa-rapido" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Estratégia de Caixa Rápido
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                  <li>
                    <a href="https://chatgpt.com/g/g-6874fca635348191a595871bb3e11ffd-mba-assistente-de-proposta-irresistivel" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Criação da Proposta Irresistível
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">🤖 Agente de suporte para facilitar o desenvolvimento de Projetos</h4>
                <ul className="mt-2 space-y-1 list-none">
                  <li>
                    <a href="https://chatgpt.com/g/g-68408938b23481918104237904e496ba-boranaobra-renderizador-de-projetos" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Renderizador de projetos
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold">🤖 Agente de suporte para facilitar o desenvolvimento das Obras</h4>
                <ul className="mt-2 space-y-1 list-none">
                  <li>
                    <a href="https://chatgpt.com/g/g-xfw2K2cNJ-agente-profissional-de-campo" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Agente profissional de campo
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                  <li>
                    <a href="https://chatgpt.com/g/g-6734b4dd282c81908061652f23285871-agente-de-planejamento-de-obra/" target="_blank" rel="noopener noreferrer" className="text-secondary inline-flex items-center gap-2">
                      Agente de planejamento de obra
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posto Ipiranga Tab */}
        <TabsContent value="posto-ipiranga" className="space-y-6">
          <Card className="border-border bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">⛽️</span>
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
                                       className="inline-flex items-center gap-2 text-sm text-secondary hover:underline"
                                     >
                                       Acessar recurso
                                       <ExternalLink className="h-4 w-4" />
                                     </a>
                                   </div>
                                   {isAdmin && (
                                     <div className="flex gap-2">
                                       <Button
                                         size="icon"
                                         variant="ghost"
                                         onClick={() => setEditingLink(link)}
                                       >
                                         <Edit className="h-4 w-4" />
                                       </Button>
                                     </div>
                                   )}
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

        {/* recomendacoes removida — agora consolidado na aba "Agentes de IA" */}
      </Tabs>

      <EditarPostoIpirangaDialog
        link={editingLink}
        open={!!editingLink}
        onOpenChange={(open) => !open && setEditingLink(null)}
      />

      <EditarGravacaoIndividualDialog
        gravacao={editingGravacao}
        open={!!editingGravacao}
        onOpenChange={(open) => !open && setEditingGravacao(null)}
      />

      <EditarEncontroGravadoDialog
        gravacao={editingEncontro}
        open={!!editingEncontro}
        onOpenChange={(open) => !open && setEditingEncontro(null)}
      />

      <EditarConteudoDialog
        conteudo={editingConteudo}
        open={!!editingConteudo}
        onOpenChange={(open) => !open && setEditingConteudo(null)}
      />
    </div>
  );
}
