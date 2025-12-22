import { useState } from "react";
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
import { Edit, Trash2 } from "lucide-react";

const tiposMentoria = ["Mentoria", "Imersão", "Live Especial"] as const;

interface EditarAgendaDialogProps {
  encontro: {
    id: string;
    titulo: string;
    descricao: string | null;
    tipo: string;
    data_hora: string;
    link_zoom: string | null;
  };
  onOpenChange?: (open: boolean) => void;
}

export function EditarAgendaDialog({ encontro, onOpenChange }: EditarAgendaDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: encontro.titulo,
    descricao: encontro.descricao || "",
    tipo: encontro.tipo as (typeof tiposMentoria)[number],
    data_hora: encontro.data_hora.slice(0, 16),
    link_zoom: encontro.link_zoom || "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("agenda_mentoria")
        .update({
          titulo: data.titulo,
          descricao: data.descricao || null,
          tipo: data.tipo,
          data_hora: new Date(data.data_hora).toISOString(),
          link_zoom: data.link_zoom || null,
        })
        .eq("id", encontro.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["agenda-mentoria"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-agenda"] });
      setOpen(false);
      onOpenChange?.(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar o evento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("agenda_mentoria")
        .delete()
        .eq("id", encontro.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["agenda-mentoria"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-agenda"] });
      setOpen(false);
      onOpenChange?.(false);
    },
    onError: () => {
      toast.error("Erro ao remover o evento");
    },
  });

  const handleSave = () => {
    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!formData.tipo) {
      toast.error("Tipo de mentoria é obrigatório");
      return;
    }

    if (!formData.data_hora) {
      toast.error("Data e hora são obrigatórias");
      return;
    }

    updateMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja remover este evento?")) {
      setIsDeleting(true);
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          title="Editar evento"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          title="Remover evento"
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do evento de mentoria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Mentoria com João Silva"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Mentoria *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) =>
                setFormData({ ...formData, tipo: value as (typeof tiposMentoria)[number] })
              }
            >
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposMentoria.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Data e Hora *</Label>
            <Input
              id="data"
              type="datetime-local"
              value={formData.data_hora}
              onChange={(e) => setFormData({ ...formData, data_hora: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva o evento..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link Zoom</Label>
            <Input
              id="link"
              type="url"
              value={formData.link_zoom}
              onChange={(e) => setFormData({ ...formData, link_zoom: e.target.value })}
              placeholder="https://zoom.us/j/..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1 bg-secondary hover:bg-secondary/90 text-white"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
