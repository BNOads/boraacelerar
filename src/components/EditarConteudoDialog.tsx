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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const tiposConteudo = [
  "Hotseat",
  "Implementação",
  "Mentoria",
  "Análise Temática",
  "Imersões com Convidados"
] as const;

type TipoConteudo = (typeof tiposConteudo)[number];

interface EditarConteudoDialogProps {
  conteudo: {
    id: string;
    titulo: string;
    url?: string | null;
    descricao?: string | null;
    tags?: string[] | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarConteudoDialog({ conteudo, open, onOpenChange }: EditarConteudoDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: "",
    url: "",
    descricao: "",
    tipo: "" as TipoConteudo | "",
  });

  useEffect(() => {
    if (conteudo) {
      setFormData({
        titulo: conteudo.titulo || "",
        url: conteudo.url || "",
        descricao: conteudo.descricao || "",
        tipo: (conteudo.tags?.[0] as TipoConteudo) || "",
      });
    }
  }, [conteudo]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!conteudo) throw new Error("Conteúdo não encontrado");

      const { error } = await supabase
        .from("conteudo_direcionado")
        .update({
          titulo: data.titulo,
          url: data.url || null,
          descricao: data.descricao || null,
          tags: data.tipo ? [data.tipo] : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conteudo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conteudo-direcionado"] });
      toast.success("Conteúdo atualizado com sucesso!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar conteúdo");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!conteudo) throw new Error("Conteúdo não encontrado");

      const { error } = await supabase
        .from("conteudo_direcionado")
        .update({ ativo: false })
        .eq("id", conteudo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conteudo-direcionado"] });
      toast.success("Conteúdo excluído com sucesso!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao excluir conteúdo");
    },
  });

  if (!conteudo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Conteúdo</DialogTitle>
          <DialogDescription>Atualize as informações do conteúdo</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título do conteúdo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select
              value={formData.tipo || undefined}
              onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoConteudo })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposConteudo.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL do Conteúdo</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do conteúdo"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => updateMutation.mutate(formData)}
            disabled={!formData.titulo || !formData.tipo || updateMutation.isPending}
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
                <AlertDialogTitle>Excluir Conteúdo</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este conteúdo? Esta ação não pode ser desfeita.
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
