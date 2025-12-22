import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Plus, 
  Copy, 
  Pencil, 
  Trash2, 
  Check, 
  X,
  User
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

interface DiarioBordoProps {
  mentoradoId: string;
}

interface DiarioEntry {
  id: string;
  conteudo: string;
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

export function DiarioBordo({ mentoradoId }: DiarioBordoProps) {
  const { isAdmin } = useIsAdmin();
  const queryClient = useQueryClient();
  
  const [novaEntrada, setNovaEntrada] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

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

  // Mutation para criar entrada
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("diario_bordo")
        .insert({
          mentorado_id: mentoradoId,
          autor_id: user.id,
          conteudo: novaEntrada,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diario-bordo", mentoradoId] });
      setNovaEntrada("");
      toast.success("Entrada adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao adicionar entrada:", error);
      toast.error("Erro ao adicionar entrada");
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
          <Button
                onClick={() => createMutation.mutate()}
                disabled={!novaEntrada.trim() || createMutation.isPending}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar entrada
        </Button>
        </div>

        {/* Lista de entradas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : entradas && entradas.length > 0 ? (
          <div className="space-y-4">
            {entradas.map((entrada) => (
              <div
                key={entrada.id}
                className="flex gap-3 p-4 rounded-lg bg-muted/30 border border-border/50"
              >
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
                    <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                      {entrada.conteudo}
                    </p>
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
            ))}
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
