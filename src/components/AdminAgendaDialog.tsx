import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const tiposMentoria = ["Mentoria", "Imersão", "Live Especial"] as const;

export function AdminAgendaDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "" as (typeof tiposMentoria)[number] | "",
    data_hora: "",
    link_zoom: "",
  });

  const addMentoriaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const insertData: TablesInsert<"agenda_mentoria"> = {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo as (typeof tiposMentoria)[number],
        data_hora: data.data_hora,
        link_zoom: data.link_zoom,
      };
      const { error } = await supabase
        .from("agenda_mentoria")
        .insert([insertData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
      toast.success("Mentoria agendada com sucesso!");
      setOpen(false);
      setFormData({
        titulo: "",
        descricao: "",
        tipo: "",
        data_hora: "",
        link_zoom: "",
      });
    },
    onError: () => {
      toast.error("Erro ao agendar mentoria");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Agendar Mentoria
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agendar Nova Mentoria</DialogTitle>
          <DialogDescription>
            Adicione um novo encontro à agenda de mentorias
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título da mentoria"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={formData.tipo || undefined} onValueChange={(value) => setFormData({ ...formData, tipo: value as typeof formData.tipo })}>
              <SelectTrigger>
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
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da mentoria"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_hora">Data e Hora *</Label>
            <Input
              id="data_hora"
              type="datetime-local"
              value={formData.data_hora}
              onChange={(e) => setFormData({ ...formData, data_hora: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_zoom">Link do Zoom</Label>
            <Input
              id="link_zoom"
              type="url"
              value={formData.link_zoom}
              onChange={(e) => setFormData({ ...formData, link_zoom: e.target.value })}
              placeholder="https://zoom.us/..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => addMentoriaMutation.mutate(formData)}
            disabled={!formData.titulo || !formData.tipo || !formData.data_hora || addMentoriaMutation.isPending}
          >
            {addMentoriaMutation.isPending ? "Agendando..." : "Agendar"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
