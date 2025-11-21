import { useState, useRef, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Upload, User, Trash2 } from "lucide-react";
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

interface EditarNavegadorDialogProps {
  navegador: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarNavegadorDialog({ navegador, open, onOpenChange }: EditarNavegadorDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    foto_url: "",
    cargo: "",
    bio_curta: "",
    email: "",
    whatsapp_url: "",
    ativo: true,
  });

  useEffect(() => {
    if (navegador) {
      setFormData({
        nome: navegador.nome || "",
        foto_url: navegador.foto_url || navegador.profiles?.foto_url || "",
        cargo: navegador.cargo || "",
        bio_curta: navegador.bio_curta || "",
        email: navegador.email || "",
        whatsapp_url: navegador.whatsapp_url || "",
        ativo: navegador.ativo ?? true,
      });
      setUploadedPhotoUrl(navegador.foto_url || navegador.profiles?.foto_url || "");
    }
  }, [navegador]);

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `navegador-${navegador.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    },
    onSuccess: (url) => {
      setUploadedPhotoUrl(url);
      setFormData({ ...formData, foto_url: url });
      toast.success("Foto atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao fazer upload: ${error.message}`);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    uploadPhotoMutation.mutate(file);
  };

  const updateNavegadorMutation = useMutation({
    mutationFn: async () => {
      const updateData: TablesUpdate<"navegadores"> = {
        cargo: formData.cargo,
        bio_curta: formData.bio_curta || null,
        email: formData.email || null,
        whatsapp_url: formData.whatsapp_url || null,
        ativo: formData.ativo,
      };

      // Só atualizar nome e foto se for navegador externo
      if (!navegador.user_id) {
        updateData.nome = formData.nome;
        updateData.foto_url = formData.foto_url || null;
      }

      const { error } = await supabase
        .from("navegadores")
        .update(updateData)
        .eq("id", navegador.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navegadores"] });
      toast.success("Navegador atualizado com sucesso!");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar navegador");
    },
  });

  const deleteNavegadorMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("navegadores")
        .delete()
        .eq("id", navegador.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navegadores"] });
      toast.success("Navegador removido com sucesso!");
      setShowDeleteAlert(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover navegador");
    },
  });

  const isExternal = !navegador?.user_id;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Navegador</DialogTitle>
            <DialogDescription>
              Atualize as informações do navegador
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isExternal && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Foto</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <AvatarImage src={uploadedPhotoUrl} />
                      <AvatarFallback className="bg-muted">
                        {formData.nome ? formData.nome.charAt(0) : <Upload className="h-8 w-8" />}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadPhotoMutation.isPending}
                      className="flex-1"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadPhotoMutation.isPending ? "Carregando..." : "Alterar Foto"}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo *</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                placeholder="Ex: Navegador Sênior"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio_curta">Bio Curta</Label>
              <Textarea
                id="bio_curta"
                value={formData.bio_curta}
                onChange={(e) => setFormData({ ...formData, bio_curta: e.target.value })}
                placeholder="Breve descrição..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_url">URL do WhatsApp</Label>
              <Input
                id="whatsapp_url"
                type="url"
                value={formData.whatsapp_url}
                onChange={(e) => setFormData({ ...formData, whatsapp_url: e.target.value })}
                placeholder="https://wa.me/..."
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
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => updateNavegadorMutation.mutate()}
              disabled={!formData.cargo || updateNavegadorMutation.isPending}
            >
              {updateNavegadorMutation.isPending ? "Salvando..." : "Salvar Alterações"}
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
              Tem certeza que deseja remover este navegador? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteNavegadorMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteNavegadorMutation.isPending ? "Removendo..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
