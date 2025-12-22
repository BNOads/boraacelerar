import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Plus, 
  Copy, 
  Pencil, 
  Trash2, 
  Check, 
  X,
  User,
  Paperclip,
  MessageCircle,
  Smile,
  Image as ImageIcon,
  FileText,
  Send
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
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
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DiarioBordoProps {
  mentoradoId: string;
}

interface DiarioEntry {
  id: string;
  conteudo: string;
  anexos: string[] | null;
  created_at: string;
  updated_at: string;
  autor_id: string;
  autor?: {
    id: string;
    nome_completo: string;
    apelido: string | null;
    foto_url: string | null;
  };
}

interface Resposta {
  id: string;
  entrada_id: string;
  conteudo: string;
  created_at: string;
  autor_id: string;
  autor?: {
    id: string;
    nome_completo: string;
    apelido: string | null;
    foto_url: string | null;
  };
}

interface Reacao {
  id: string;
  entrada_id: string;
  emoji: string;
  autor_id: string;
}

const EMOJIS = ["👍", "❤️", "🎉", "🚀", "💡", "✅", "👏", "🔥"];

export function DiarioBordo({ mentoradoId }: DiarioBordoProps) {
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [novaEntrada, setNovaEntrada] = useState("");
  const [anexosPendentes, setAnexosPendentes] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Buscar entradas do diário
  const { data: entradas, isLoading } = useQuery({
    queryKey: ["diario-bordo", mentoradoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diario_bordo")
        .select(`
          *,
          autor:autor_id (
            id,
            nome_completo,
            apelido,
            foto_url
          )
        `)
        .eq("mentorado_id", mentoradoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DiarioEntry[];
    },
    enabled: !!mentoradoId,
  });

  // Buscar respostas
  const { data: respostas } = useQuery({
    queryKey: ["diario-bordo-respostas", mentoradoId],
    queryFn: async () => {
      if (!entradas?.length) return [];
      
      const entradaIds = entradas.map(e => e.id);
      const { data, error } = await supabase
        .from("diario_bordo_respostas")
        .select(`
          *,
          autor:autor_id (
            id,
            nome_completo,
            apelido,
            foto_url
          )
        `)
        .in("entrada_id", entradaIds)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Resposta[];
    },
    enabled: !!entradas?.length,
  });

  // Buscar reações
  const { data: reacoes } = useQuery({
    queryKey: ["diario-bordo-reacoes", mentoradoId],
    queryFn: async () => {
      if (!entradas?.length) return [];
      
      const entradaIds = entradas.map(e => e.id);
      const { data, error } = await supabase
        .from("diario_bordo_reacoes")
        .select("*")
        .in("entrada_id", entradaIds);

      if (error) throw error;
      return data as Reacao[];
    },
    enabled: !!entradas?.length,
  });

  // Upload de arquivos
  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${mentoradoId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from("diario-anexos")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("diario-anexos")
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
    }
    
    return urls;
  };

  // Mutation para criar entrada
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      setUploadingFiles(true);
      let anexosUrls: string[] = [];
      
      if (anexosPendentes.length > 0) {
        anexosUrls = await uploadFiles(anexosPendentes);
      }

      const { error } = await supabase
        .from("diario_bordo")
        .insert({
          mentorado_id: mentoradoId,
          autor_id: user.id,
          conteudo: novaEntrada,
          anexos: anexosUrls.length > 0 ? anexosUrls : null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario-bordo", mentoradoId] });
      setNovaEntrada("");
      setAnexosPendentes([]);
      setUploadingFiles(false);
      toast.success("Entrada adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao adicionar entrada:", error);
      toast.error("Erro ao adicionar entrada");
      setUploadingFiles(false);
    },
  });

  // Mutation para atualizar entrada
  const updateMutation = useMutation({
    mutationFn: async ({ id, conteudo }: { id: string; conteudo: string }) => {
      const { error } = await supabase
        .from("diario_bordo")
        .update({ conteudo })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario-bordo", mentoradoId] });
      setEditingId(null);
      setEditingContent("");
      toast.success("Entrada atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar entrada:", error);
      toast.error("Erro ao atualizar entrada");
    },
  });

  // Mutation para deletar entrada
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("diario_bordo")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario-bordo", mentoradoId] });
      toast.success("Entrada removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover entrada:", error);
      toast.error("Erro ao remover entrada");
    },
  });

  // Mutation para adicionar resposta
  const addReplyMutation = useMutation({
    mutationFn: async ({ entradaId, conteudo }: { entradaId: string; conteudo: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("diario_bordo_respostas")
        .insert({
          entrada_id: entradaId,
          autor_id: user.id,
          conteudo,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario-bordo-respostas", mentoradoId] });
      setReplyingTo(null);
      setReplyContent("");
      toast.success("Resposta adicionada!");
    },
    onError: (error) => {
      console.error("Erro ao adicionar resposta:", error);
      toast.error("Erro ao adicionar resposta");
    },
  });

  // Mutation para deletar resposta
  const deleteReplyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("diario_bordo_respostas")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario-bordo-respostas", mentoradoId] });
      toast.success("Resposta removida!");
    },
  });

  // Mutation para toggle reação
  const toggleReactionMutation = useMutation({
    mutationFn: async ({ entradaId, emoji }: { entradaId: string; emoji: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar se já existe a reação
      const existing = reacoes?.find(
        r => r.entrada_id === entradaId && r.autor_id === user.id && r.emoji === emoji
      );

      if (existing) {
        const { error } = await supabase
          .from("diario_bordo_reacoes")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("diario_bordo_reacoes")
          .insert({
            entrada_id: entradaId,
            autor_id: user.id,
            emoji,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario-bordo-reacoes", mentoradoId] });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAnexosPendentes(prev => [...prev, ...files]);
  };

  const removeAnexoPendente = (index: number) => {
    setAnexosPendentes(prev => prev.filter((_, i) => i !== index));
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Texto copiado!");
  };

  const handleEdit = (entry: DiarioEntry) => {
    setEditingId(entry.id);
    setEditingContent(entry.conteudo);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const handleSaveEdit = () => {
    if (editingId && editingContent.trim()) {
      updateMutation.mutate({ id: editingId, conteudo: editingContent });
    }
  };

  const handleDelete = (id: string) => {
    setEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteMutation.mutate(entryToDelete);
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const toggleReplies = (entradaId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(entradaId)) {
        next.delete(entradaId);
      } else {
        next.add(entradaId);
      }
      return next;
    });
  };

  const getReacoesForEntry = (entradaId: string) => {
    const entryReacoes = reacoes?.filter(r => r.entrada_id === entradaId) || [];
    const grouped: Record<string, string[]> = {};
    
    entryReacoes.forEach(r => {
      if (!grouped[r.emoji]) grouped[r.emoji] = [];
      grouped[r.emoji].push(r.autor_id);
    });
    
    return grouped;
  };

  const getRespostasForEntry = (entradaId: string) => {
    return respostas?.filter(r => r.entrada_id === entradaId) || [];
  };

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  if (!isAdmin) return null;

  return (
    <>
      <div className="space-y-6">
        {/* Formulário para nova entrada */}
        <div className="space-y-4">
          <Textarea
            placeholder="Escreva o que foi otimizado, testado ou ajustado..."
            value={novaEntrada}
            onChange={(e) => setNovaEntrada(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          
          {/* Anexos pendentes */}
          {anexosPendentes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {anexosPendentes.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-sm"
                >
                  {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeAnexoPendente(index)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Anexar arquivo"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!novaEntrada.trim() || createMutation.isPending || uploadingFiles}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              {uploadingFiles ? "Enviando..." : "Adicionar entrada"}
            </Button>
          </div>
        </div>

        {/* Lista de entradas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : entradas && entradas.length > 0 ? (
          <div className="space-y-4">
            {entradas.map((entrada) => {
              const entryReacoes = getReacoesForEntry(entrada.id);
              const entryRespostas = getRespostasForEntry(entrada.id);
              const isExpanded = expandedReplies.has(entrada.id);

              return (
                <div
                  key={entrada.id}
                  className="p-4 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={entrada.autor?.foto_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {entrada.autor?.nome_completo?.charAt(0) || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {entrada.autor?.apelido || entrada.autor?.nome_completo || "Usuário"}
                        </span>
                        <span className="text-sm text-primary">
                          {formatDistanceToNow(new Date(entrada.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                      
                      {editingId === entrada.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={updateMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                            {entrada.conteudo}
                          </p>
                          
                          {/* Anexos */}
                          {entrada.anexos && entrada.anexos.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {entrada.anexos.map((url, idx) => (
                                isImageUrl(url) ? (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={url}
                                      alt={`Anexo ${idx + 1}`}
                                      className="h-24 w-24 object-cover rounded-md border border-border hover:opacity-80 transition-opacity"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm hover:bg-muted/80"
                                  >
                                    <FileText className="h-4 w-4" />
                                    <span>Anexo {idx + 1}</span>
                                  </a>
                                )
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {editingId !== entrada.id && (
                      <div className="flex items-start gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleCopy(entrada.conteudo)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(entrada)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(entrada.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Reações e ações */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {/* Reações existentes */}
                    {Object.entries(entryReacoes).map(([emoji, autorIds]) => (
                      <button
                        key={emoji}
                        onClick={() => toggleReactionMutation.mutate({ entradaId: entrada.id, emoji })}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 hover:bg-muted text-sm transition-colors"
                      >
                        <span>{emoji}</span>
                        <span className="text-muted-foreground">{autorIds.length}</span>
                      </button>
                    ))}

                    {/* Botão de adicionar reação */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <Smile className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <div className="flex gap-1">
                          {EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => toggleReactionMutation.mutate({ entradaId: entrada.id, emoji })}
                              className="text-xl hover:scale-125 transition-transform p-1"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Botão de responder */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 gap-1"
                      onClick={() => {
                        setReplyingTo(entrada.id);
                        toggleReplies(entrada.id);
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs">
                        {entryRespostas.length > 0 ? entryRespostas.length : "Responder"}
                      </span>
                    </Button>
                  </div>

                  {/* Respostas */}
                  {(entryRespostas.length > 0 || replyingTo === entrada.id) && (
                    <Collapsible open={isExpanded} onOpenChange={() => toggleReplies(entrada.id)}>
                      {entryRespostas.length > 0 && (
                        <CollapsibleTrigger asChild>
                          <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-xs">
                            {isExpanded ? "Ocultar" : "Ver"} {entryRespostas.length} resposta{entryRespostas.length !== 1 ? "s" : ""}
                          </Button>
                        </CollapsibleTrigger>
                      )}

                      <CollapsibleContent className="mt-3 space-y-3 pl-8 border-l-2 border-border/50">
                        {entryRespostas.map(resposta => (
                          <div key={resposta.id} className="flex gap-2">
                            <Avatar className="h-7 w-7 shrink-0">
                              <AvatarImage src={resposta.autor?.foto_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {resposta.autor?.nome_completo?.charAt(0) || <User className="h-3 w-3" />}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {resposta.autor?.apelido || resposta.autor?.nome_completo}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(resposta.created_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 ml-auto text-destructive hover:text-destructive"
                                  onClick={() => deleteReplyMutation.mutate(resposta.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">{resposta.conteudo}</p>
                            </div>
                          </div>
                        ))}

                        {/* Input de nova resposta */}
                        {replyingTo === entrada.id && (
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="Escreva uma resposta..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="flex-1"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && replyContent.trim()) {
                                  e.preventDefault();
                                  addReplyMutation.mutate({ entradaId: entrada.id, conteudo: replyContent });
                                }
                              }}
                            />
                            <Button
                              size="icon"
                              onClick={() => addReplyMutation.mutate({ entradaId: entrada.id, conteudo: replyContent })}
                              disabled={!replyContent.trim() || addReplyMutation.isPending}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma entrada no diário de bordo ainda.</p>
            <p className="text-sm">Adicione observações sobre o progresso deste mentorado.</p>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta entrada do diário de bordo?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
