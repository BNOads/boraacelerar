import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { User, Mail, Instagram, Phone, Save, Upload, Lock, Eye, EyeOff, Sun, Moon } from "lucide-react";

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  useEffect(() => {
    if (userData?.profile) {
      setFormData({
        nome_completo: userData.profile.nome_completo || "",
        apelido: userData.profile.apelido || "",
        whatsapp: userData.mentorado?.whatsapp || "",
        instagram: userData.mentorado?.instagram || "",
      });
    }
  }, [userData]);

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

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const userId = userData?.user?.id;
      if (!userId) throw new Error("Usuário não encontrado");

      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualizar perfil com a URL da foto
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ foto_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      toast.success("Foto de perfil atualizada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao fazer upload da foto");
    },
  });

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Por favor, selecione uma imagem válida");
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
  };

  const changePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error("As senhas não coincidem");
      }

      if (data.newPassword.length < 6) {
        throw new Error("A nova senha deve ter pelo menos 6 caracteres");
      }

      // Primeiro verifica a senha atual tentando fazer login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userData?.user?.email || "",
        password: data.currentPassword,
      });

      if (signInError) {
        throw new Error("Senha atual incorreta");
      }

      // Atualiza a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

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
            <div className="relative group">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarImage src={userData.profile?.foto_url} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {userData.profile?.nome_completo?.charAt(0) || <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                disabled={uploadAvatarMutation.isPending}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Upload className="h-6 w-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-semibold text-lg">
                {userData.profile?.nome_completo || userData.profile?.apelido}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {userData.user?.email}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-7 text-xs"
                onClick={handleAvatarClick}
                disabled={uploadAvatarMutation.isPending}
              >
                {uploadAvatarMutation.isPending ? "Enviando..." : "Alterar foto"}
              </Button>
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

      {/* Segurança */}
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Segurança</CardTitle>
              <CardDescription>Altere sua senha de acesso</CardDescription>
            </div>
            {!isChangingPassword && (
              <Button
                variant="outline"
                onClick={() => setIsChangingPassword(true)}
              >
                <Lock className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            )}
          </div>
        </CardHeader>
        {isChangingPassword && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  className="bg-card/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  className="bg-card/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  className="bg-card/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => changePasswordMutation.mutate(passwordData)}
                disabled={
                  changePasswordMutation.isPending ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
              >
                {changePasswordMutation.isPending ? "Salvando..." : "Salvar Nova Senha"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Aparência */}
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Aparência</CardTitle>
          <CardDescription>
            Personalize a aparência do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Modo de Cor</Label>
            <div className="flex gap-2">
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                onClick={() => setTheme("dark")}
                className={theme === "dark" ? "bg-primary hover:bg-primary/90" : ""}
              >
                <Moon className="mr-2 h-4 w-4" />
                Modo Escuro
              </Button>
              <Button
                variant={theme === "light" ? "default" : "outline"}
                onClick={() => setTheme("light")}
                className={theme === "light" ? "bg-primary hover:bg-primary/90" : ""}
              >
                <Sun className="mr-2 h-4 w-4" />
                Modo Claro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da Conta */}
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Informações da Conta</CardTitle>
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
