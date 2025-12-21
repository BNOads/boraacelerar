import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesUpdate } from "@/integrations/supabase/types";
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
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/alert-dialog";

interface EditarLinkDialogProps {
  link: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarLinkDialog({ link, open, onOpenChange }: EditarLinkDialogProps) {
  const queryClient = useQueryClient();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    url_zoom: "",
    ativo: true,
  });

  useEffect(() => {
    if (link) {
      setFormData({
        titulo: link.titulo || "",
        url_zoom: link.url_zoom || "",
        ativo: link.ativo ?? true,
      });
    }
  }, [link]);

  const updateLinkMutation = useMutation({
    mutationFn: async () => {
      const updateData: TablesUpdate<"zoom_info"> = {
        titulo: formData.titulo,
        url_zoom: formData.url_zoom,
        ativo: formData.ativo,
      };

      const { error } = await supabase
        .from("zoom_info")
        .update(updateData)
        .eq("id", link.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links-uteis"] });
      toast.success("Link atualizado com sucesso!");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar link");
    },
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("zoom_info")
        .delete()
        .eq("id", link.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links-uteis"] });
      toast.success("Link removido com sucesso!");
      setShowDeleteAlert(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover link");
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Link</DialogTitle>
            <DialogDescription>
              Atualize as informações do link
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título do link"
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

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Status Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Desativar remove da listagem pública
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-secondary hover:bg-secondary/90 text-white"
              onClick={() => updateLinkMutation.mutate()}
              disabled={!formData.titulo || !formData.url_zoom || updateLinkMutation.isPending}
            >
              {updateLinkMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteAlert(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este link? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteLinkMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLinkMutation.isPending ? "Removendo..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
