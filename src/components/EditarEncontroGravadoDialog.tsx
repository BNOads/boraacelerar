import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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

interface EditarEncontroGravadoDialogProps {
  gravacao: {
    id: string;
    titulo: string;
    url_video: string;
    descricao?: string | null;
    duracao_seg?: number | null;
    tags?: string[] | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarEncontroGravadoDialog({ gravacao, open, onOpenChange }: EditarEncontroGravadoDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: "",
    url_video: "",
    descricao: "",
    duracao_min: "",
  });

  useEffect(() => {
    if (gravacao) {
      setFormData({
        titulo: gravacao.titulo || "",
        url_video: gravacao.url_video || "",
        descricao: gravacao.descricao || "",
        duracao_min: gravacao.duracao_seg ? String(Math.floor(gravacao.duracao_seg / 60)) : "",
      });
    }
  }, [gravacao]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!gravacao) throw new Error("Gravação não encontrada");
      
      const { error } = await supabase
        .from("gravacoes_encontros")
        .update({
          titulo: data.titulo,
          url_video: data.url_video,
          descricao: data.descricao || null,
          duracao_seg: data.duracao_min ? parseInt(data.duracao_min) * 60 : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", gravacao.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gravacoes-encontros"] });
      toast.success("Gravação atualizada com sucesso!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar gravação");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!gravacao) throw new Error("Gravação não encontrada");
      
      const { error } = await supabase
        .from("gravacoes_encontros")
        .update({ ativo: false })
        .eq("id", gravacao.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gravacoes-encontros"] });
      toast.success("Gravação excluída com sucesso!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao excluir gravação");
    },
  });

  if (!gravacao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Encontro Gravado</DialogTitle>
          <DialogDescription>
            Atualize as informações do encontro gravado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título da gravação"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url_video">URL do Vídeo *</Label>
            <Input
              id="url_video"
              type="url"
              value={formData.url_video}
              onChange={(e) => setFormData({ ...formData, url_video: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da gravação"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duracao_min">Duração (minutos)</Label>
            <Input
              id="duracao_min"
              type="number"
              value={formData.duracao_min}
              onChange={(e) => setFormData({ ...formData, duracao_min: e.target.value })}
              placeholder="Ex: 60"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => updateMutation.mutate(formData)}
            disabled={!formData.titulo || !formData.url_video || updateMutation.isPending}
          >
            {updateMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Gravação</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta gravação? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
