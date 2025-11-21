import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Mail, Instagram, Phone, Save } from "lucide-react";

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Buscar dados do usuário e perfil
  const { data: userData } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      const { data: mentorado } = await supabase
        .from("mentorados")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      return { user, profile, mentorado };
    },
  });

  const [formData, setFormData] = useState({
    nome_completo: "",
    apelido: "",
    whatsapp: "",
    instagram: "",
  });

  // Atualizar formData quando os dados chegarem
  useState(() => {
    if (userData?.profile) {
      setFormData({
        nome_completo: userData.profile.nome_completo || "",
        apelido: userData.profile.apelido || "",
        whatsapp: userData.mentorado?.whatsapp || "",
        instagram: userData.mentorado?.instagram || "",
      });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const userId = userData?.user?.id;
      if (!userId) throw new Error("Usuário não encontrado");

      // Atualizar profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nome_completo: data.nome_completo,
          apelido: data.apelido,
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Atualizar mentorado se existir
      if (userData.mentorado) {
        const { error: mentoradoError } = await supabase
          .from("mentorados")
          .update({
            whatsapp: data.whatsapp,
            instagram: data.instagram,
          })
          .eq("id", userData.mentorado.id);

        if (mentoradoError) throw mentoradoError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar perfil");
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          ⚙️ Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {/* Perfil Card */}
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Informações do Perfil</CardTitle>
              <CardDescription>
                Atualize seus dados pessoais e de contato
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarImage src={userData.profile?.foto_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {userData.profile?.nome_completo?.charAt(0) || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">
                {userData.profile?.nome_completo || userData.profile?.apelido}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {userData.user?.email}
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome_completo">Nome Completo</Label>
                <Input
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) =>
                    setFormData({ ...formData, nome_completo: e.target.value })
                  }
                  disabled={!isEditing}
                  className="bg-card/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apelido">Apelido</Label>
                <Input
                  id="apelido"
                  value={formData.apelido}
                  onChange={(e) =>
                    setFormData({ ...formData, apelido: e.target.value })
                  }
                  disabled={!isEditing}
                  className="bg-card/50"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  WhatsApp
                </Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                  disabled={!isEditing}
                  placeholder="+55 11 99999-9999"
                  className="bg-card/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  value={formData.instagram}
                  onChange={(e) =>
                    setFormData({ ...formData, instagram: e.target.value })
                  }
                  disabled={!isEditing}
                  placeholder="@seuusuario"
                  className="bg-card/50"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    nome_completo: userData.profile?.nome_completo || "",
                    apelido: userData.profile?.apelido || "",
                    whatsapp: userData.mentorado?.whatsapp || "",
                    instagram: userData.mentorado?.instagram || "",
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>Detalhes da sua conta no BORA Acelerar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {userData.mentorado && (
            <>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Turma:</span>
                <span className="font-medium">{userData.mentorado.turma || "Não definida"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Data de Ingresso:</span>
                <span className="font-medium">
                  {new Date(userData.mentorado.data_ingresso).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-green-500">{userData.mentorado.status}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
