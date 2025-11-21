import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function AdminNavegadorDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [formData, setFormData] = useState({
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
        .select("id, nome_completo, apelido");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const addNavegadorMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error("Selecione um usuário");
      
      // Criar navegador
      const { error: navError } = await supabase
        .from("navegadores")
        .insert({
          user_id: selectedUserId,
          ...formData,
        });
      if (navError) throw navError;

      // Adicionar role de navegador
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: selectedUserId,
          role: "navegador",
        });
      if (roleError && roleError.code !== "23505") throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["navegadores"] });
      toast.success("Navegador adicionado com sucesso!");
      setOpen(false);
      setSelectedUserId("");
      setFormData({
        cargo: "",
        bio_curta: "",
        email: "",
        whatsapp_url: "",
        ativo: true,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar navegador");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Navegador
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Navegador</DialogTitle>
          <DialogDescription>
            Adicione um usuário como navegador da plataforma
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="user">Usuário *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
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
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => addNavegadorMutation.mutate()}
            disabled={!selectedUserId || !formData.cargo || addNavegadorMutation.isPending}
          >
            {addNavegadorMutation.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
