import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Upload, User } from "lucide-react";

export function AdminNavegadorDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExternal, setIsExternal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
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

  // Buscar todos os usuários para selecionar
  const { data: users } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome_completo, apelido, foto_url");
      if (error) throw error;
      return data;
    },
    enabled: open && !isExternal,
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `navegador-${Math.random()}.${fileExt}`;
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
      toast.success("Foto carregada com sucesso!");
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

  const addNavegadorMutation = useMutation({
    mutationFn: async () => {
      if (!isExternal && !selectedUserId) {
        throw new Error("Selecione um usuário");
      }
      if (isExternal && !formData.nome) {
        throw new Error("Preencha o nome do navegador");
      }
      
      const navegadorData: TablesInsert<"navegadores"> = {
        user_id: isExternal ? null : selectedUserId,
        nome: isExternal ? formData.nome : null,
        foto_url: isExternal ? formData.foto_url : null,
        cargo: formData.cargo,
        bio_curta: formData.bio_curta || null,
        email: formData.email || null,
        whatsapp_url: formData.whatsapp_url || null,
        ativo: formData.ativo,
      } as const;

      const { error: navError } = await supabase
        .from("navegadores")
        .insert([navegadorData]);
      if (navError) throw navError;

      // Se for usuário do sistema, adicionar role
      if (!isExternal && selectedUserId) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert([{
            user_id: selectedUserId,
            role: "navegador" as const,
          }]);
        if (roleError && roleError.code !== "23505") throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navegadores"] });
      toast.success("Navegador adicionado com sucesso!");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar navegador");
    },
  });

  const resetForm = () => {
    setOpen(false);
    setIsExternal(false);
    setSelectedUserId("");
    setUploadedPhotoUrl("");
    setFormData({
      nome: "",
      foto_url: "",
      cargo: "",
      bio_curta: "",
      email: "",
      whatsapp_url: "",
      ativo: true,
    });
  };

  const selectedUser = users?.find(u => u.id === selectedUserId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Navegador
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Navegador</DialogTitle>
          <DialogDescription>
            Adicione um usuário do sistema ou cadastre um navegador externo
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Toggle entre Usuário do Sistema e Navegador Externo */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label htmlFor="external-mode" className="text-base">
                Navegador Externo
              </Label>
              <p className="text-sm text-muted-foreground">
                Pessoa que não possui conta no sistema
              </p>
            </div>
            <Switch
              id="external-mode"
              checked={isExternal}
              onCheckedChange={setIsExternal}
            />
          </div>

          {/* Se for usuário do sistema */}
          {!isExternal && (
            <>
              <div className="space-y-2">
                <Label htmlFor="user">Usuário do Sistema *</Label>
                <Select value={selectedUserId || undefined} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nome_completo || user.apelido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedUser.foto_url || ""} />
                    <AvatarFallback>
                      {selectedUser.nome_completo?.charAt(0) || <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.nome_completo}</p>
                    {selectedUser.apelido && (
                      <p className="text-sm text-muted-foreground">{selectedUser.apelido}</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Se for navegador externo */}
          {isExternal && (
            <>
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label>Foto do Navegador</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <AvatarImage src={uploadedPhotoUrl} />
                    <AvatarFallback className="bg-muted">
                      {formData.nome ? formData.nome.charAt(0) : <Upload className="h-8 w-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadPhotoMutation.isPending}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploadPhotoMutation.isPending ? "Carregando..." : "Fazer Upload da Foto"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Máximo 5MB • JPG, PNG ou WEBP
                    </p>
                  </div>
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

          {/* Campos comuns */}
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
              placeholder="Breve descrição sobre o navegador..."
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
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-secondary hover:bg-secondary/90"
            onClick={() => addNavegadorMutation.mutate()}
            disabled={
              (!isExternal && !selectedUserId) || 
              (isExternal && !formData.nome) || 
              !formData.cargo || 
              addNavegadorMutation.isPending
            }
          >
            {addNavegadorMutation.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
          <Button variant="outline" onClick={() => resetForm()}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
