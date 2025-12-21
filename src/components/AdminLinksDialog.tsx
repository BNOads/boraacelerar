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
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function AdminLinksDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: "",
    url_zoom: "",
  });

  const addLinkMutation = useMutation({
    mutationFn: async () => {
      const linkData: TablesInsert<"zoom_info"> = {
        titulo: formData.titulo,
        url_zoom: formData.url_zoom,
        ativo: true,
        senha_acesso: null,
        instrucoes_html: null,
        tutorial_url: null,
      } as const;

      const { error } = await supabase
        .from("zoom_info")
        .insert([linkData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links-uteis"] });
      toast.success("Link adicionado com sucesso!");
      setOpen(false);
      setFormData({
        titulo: "",
        url_zoom: "",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar link");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-secondary hover:bg-secondary/90 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Link
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Link</DialogTitle>
          <DialogDescription>
            Adicione um novo link útil para os mentorados
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Plataforma de Marketing"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url_zoom">URL *</Label>
            <Input
              id="url_zoom"
              type="url"
              value={formData.url_zoom}
              onChange={(e) => setFormData({ ...formData, url_zoom: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-secondary hover:bg-secondary/90 text-white"
            onClick={() => addLinkMutation.mutate()}
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
