import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function AdminLinksDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: "",
    url_zoom: "",
    senha_acesso: "",
    instrucoes_html: "",
    tutorial_url: "",
    ativo: true,
  });

  const addLinkMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("zoom_info")
        .insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zoom-info"] });
      toast.success("Link adicionado com sucesso!");
      setOpen(false);
      setFormData({
        titulo: "",
        url_zoom: "",
        senha_acesso: "",
        instrucoes_html: "",
        tutorial_url: "",
        ativo: true,
      });
    },
    onError: () => {
      toast.error("Erro ao adicionar link");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Link</DialogTitle>
          <DialogDescription>
            Adicione um novo link de acesso Zoom ou recurso
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Sala de Mentorias"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url_zoom">URL do Zoom *</Label>
            <Input
              id="url_zoom"
              type="url"
              value={formData.url_zoom}
              onChange={(e) => setFormData({ ...formData, url_zoom: e.target.value })}
              placeholder="https://zoom.us/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha_acesso">Senha de Acesso</Label>
            <Input
              id="senha_acesso"
              value={formData.senha_acesso}
              onChange={(e) => setFormData({ ...formData, senha_acesso: e.target.value })}
              placeholder="Senha da sala"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrucoes_html">Instruções (HTML permitido)</Label>
            <Textarea
              id="instrucoes_html"
              value={formData.instrucoes_html}
              onChange={(e) => setFormData({ ...formData, instrucoes_html: e.target.value })}
              placeholder="Instruções de acesso..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tutorial_url">URL do Tutorial</Label>
            <Input
              id="tutorial_url"
              type="url"
              value={formData.tutorial_url}
              onChange={(e) => setFormData({ ...formData, tutorial_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => addLinkMutation.mutate(formData)}
            disabled={!formData.titulo || !formData.url_zoom || addLinkMutation.isPending}
          >
            {addLinkMutation.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
