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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminCriarUsuarioDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nome_completo: "",
    apelido: "",
    role: "mentorado" as "mentorado" | "navegador" | "admin",
    // Dados específicos de mentorado
    turma: "",
    whatsapp: "",
    instagram: "",
    meta_clientes: 0,
  });

  const criarUsuarioMutation = useMutation({
    mutationFn: async () => {
      const email = formData.email.trim();
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        throw new Error("Email inválido. Verifique o endereço informado.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const payload = { ...formData, email };

      const { data, error } = await supabase.functions.invoke('criar-usuario', {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorados"] });
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success("Usuário criado com sucesso! Credenciais enviadas por email.");
      setOpen(false);
      setFormData({
        email: "",
        password: "",
        nome_completo: "",
        apelido: "",
        role: "mentorado",
        turma: "",
        whatsapp: "",
        instagram: "",
        meta_clientes: 0,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar usuário");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <UserPlus className="mr-2 h-4 w-4" />
          Criar Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Usuário</DialogTitle>
          <DialogDescription>
            Adicione um novo usuário ao sistema com credenciais e permissões
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basico" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basico">Dados Básicos</TabsTrigger>
            <TabsTrigger value="especificos">Dados Específicos</TabsTrigger>
          </TabsList>

          <TabsContent value="basico" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
              <p className="text-xs text-muted-foreground">
                A senha será enviada por email ao usuário
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                value={formData.nome_completo}
                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                placeholder="Nome completo do usuário"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apelido">Apelido</Label>
              <Input
                id="apelido"
                value={formData.apelido}
                onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                placeholder="Como prefere ser chamado"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Nível de Permissão *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: "mentorado" | "navegador" | "admin") => 
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mentorado">Mentorado</SelectItem>
                  <SelectItem value="navegador">Navegador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.role === "mentorado" && "Acesso básico à plataforma"}
                {formData.role === "navegador" && "Pode gerenciar atendimentos"}
                {formData.role === "admin" && "Acesso completo ao sistema"}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="especificos" className="space-y-4">
            {formData.role === "mentorado" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="turma">Turma</Label>
                  <Input
                    id="turma"
                    value={formData.turma}
                    onChange={(e) => setFormData({ ...formData, turma: e.target.value })}
                    placeholder="Ex: Turma 2024.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="Ex: +55 11 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@usuario"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_clientes">Meta de Clientes</Label>
                  <Input
                    id="meta_clientes"
                    type="number"
                    min="0"
                    value={formData.meta_clientes}
                    onChange={(e) => setFormData({ ...formData, meta_clientes: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </>
            )}

            {formData.role === "navegador" && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Dados específicos do navegador podem ser adicionados após a criação</p>
              </div>
            )}

            {formData.role === "admin" && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Administradores têm acesso completo ao sistema</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => criarUsuarioMutation.mutate()}
            disabled={
              !formData.email ||
              !formData.password ||
              !formData.nome_completo ||
              formData.password.length < 6 ||
              criarUsuarioMutation.isPending
            }
          >
            {criarUsuarioMutation.isPending ? "Criando..." : "Criar Usuário"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
