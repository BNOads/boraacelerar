import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";

interface GravacaoIndividual {
  id: string;
  titulo: string;
  url_video: string;
  descricao: string | null;
  duracao_seg: number | null;
  data_gravacao: string;
  mentorado?: {
    profile?: {
      nome_completo?: string;
      apelido?: string;
    };
  };
}

interface EditarGravacaoIndividualDialogProps {
  gravacao: GravacaoIndividual | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarGravacaoIndividualDialog({ 
  gravacao, 
  open, 
  onOpenChange 
}: EditarGravacaoIndividualDialogProps) {
  const [loading, setLoading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    titulo: "",
    url_video: "",
    descricao: "",
    duracao_min: "",
    data_gravacao: "",
  });

  useEffect(() => {
    if (gravacao) {
      setForm({
        titulo: gravacao.titulo || "",
        url_video: gravacao.url_video || "",
        descricao: gravacao.descricao || "",
        duracao_min: gravacao.duracao_seg ? String(Math.floor(gravacao.duracao_seg / 60)) : "",
        data_gravacao: gravacao.data_gravacao || "",
      });
    }
  }, [gravacao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!gravacao?.id || !form.titulo || !form.url_video) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e URL do vídeo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("gravacoes_individuais")
        .update({
          titulo: form.titulo,
          url_video: form.url_video,
          descricao: form.descricao || null,
          duracao_seg: form.duracao_min ? parseInt(form.duracao_min) * 60 : null,
          data_gravacao: form.data_gravacao,
        })
        .eq("id", gravacao.id);

      if (error) throw error;

      toast({
        title: "Sessão atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["gravacoes-individuais"] });
      queryClient.invalidateQueries({ queryKey: ["todas-gravacoes-individuais"] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!gravacao?.id) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("gravacoes_individuais")
        .update({ ativo: false })
        .eq("id", gravacao.id);

      if (error) throw error;

      toast({
        title: "Sessão removida",
        description: "A gravação foi removida com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: ["gravacoes-individuais"] });
      queryClient.invalidateQueries({ queryKey: ["todas-gravacoes-individuais"] });
      setShowDeleteAlert(false);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const mentoradoNome = gravacao?.mentorado?.profile?.apelido || 
    gravacao?.mentorado?.profile?.nome_completo || 
    "Mentorado";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Sessão Individual</DialogTitle>
            <DialogDescription>
              Sessão de: <strong>{mentoradoNome}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Sessão de Mentoria - Janeiro 2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url_video">URL do Vídeo *</Label>
              <Input
                id="url_video"
                value={form.url_video}
                onChange={(e) => setForm({ ...form, url_video: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descrição ou resumo da sessão"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_gravacao">Data da Gravação</Label>
                <Input
                  id="data_gravacao"
                  type="date"
                  value={form.data_gravacao}
                  onChange={(e) => setForm({ ...form, data_gravacao: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracao_min">Duração (min)</Label>
                <Input
                  id="duracao_min"
                  type="number"
                  value={form.duracao_min}
                  onChange={(e) => setForm({ ...form, duracao_min: e.target.value })}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => setShowDeleteAlert(true)}
                disabled={loading}
              >
                Excluir
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta sessão individual? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
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
