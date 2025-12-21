import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, User, Edit, Save, X, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminCriarUsuarioDialog } from "@/components/AdminCriarUsuarioDialog";
import { AdminImportarUsuariosDialog } from "@/components/AdminImportarUsuariosDialog";
import { AdminImportarMentoradosCompleto } from "@/components/AdminImportarMentoradosCompleto";
import { AdminImportarGravacoesDialog } from "@/components/AdminImportarGravacoesDialog";

export default function Mentorados() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingMentorado, setEditingMentorado] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Verificar se usuário é admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!data);
    };
    checkAdmin();
  }, []);

  // Buscar todos os mentorados com suas informações
  const { data: mentorados, isLoading } = useQuery({
    queryKey: ["all-mentorados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorados")
        .select(`
          *,
          profiles:user_id (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Mutation para atualizar mentorado
  const updateMentoradoMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, profiles, ...mentoradoData } = data;
      
      // Atualizar mentorado
      const { error: mentoradoError } = await supabase
        .from("mentorados")
        .update(mentoradoData)
        .eq("id", id);

      if (mentoradoError) throw mentoradoError;

      // Atualizar profile
      if (profiles) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            nome_completo: profiles.nome_completo,
            apelido: profiles.apelido,
          })
          .eq("id", data.user_id);

        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Informações do mentorado atualizadas.",
      });
      queryClient.invalidateQueries({ queryKey: ["all-mentorados"] });
      setEditingMentorado(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as informações.",
        variant: "destructive",
      });
    },
  });

  const filteredMentorados = mentorados?.filter(
    (m) =>
      m.profiles?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.profiles?.apelido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.turma?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
<<<<<<< HEAD
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Users className="h-8 w-8 text-secondary" strokeWidth={1.5} />
              Gerenciar Usuários
=======
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              👥 Gerenciar Usuários
>>>>>>> 486f461a9dafad709f4a63825cc535b9b4f24deb
            </h1>
            <p className="text-muted-foreground">
              Adicione novos usuários e gerencie informações dos mentorados
            </p>
          </div>
          <div className="flex gap-2">
            <AdminImportarGravacoesDialog />
            <AdminImportarMentoradosCompleto />
            <AdminImportarUsuariosDialog />
            <AdminCriarUsuarioDialog />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, email ou turma..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-card/50 border-border"
        />
      </div>

      {/* Mentorados Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredMentorados?.map((mentorado) => (
          <Card
            key={mentorado.id}
            className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/mentorados/${mentorado.id}`)}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarImage src={mentorado.profiles?.foto_url} />
                  <AvatarFallback className="bg-secondary/10 text-secondary">
                    {mentorado.profiles?.nome_completo?.charAt(0) || <User className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-lg">
                    {mentorado.profiles?.nome_completo || mentorado.profiles?.apelido}
                  </CardTitle>
                  {mentorado.turma && (
                    <Badge variant="outline" className="text-xs">
                      {mentorado.turma}
                    </Badge>
                  )}
                  <Badge
                    variant={mentorado.status === "ativo" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {mentorado.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {mentorado.email && (
                <p className="text-sm text-muted-foreground">📧 {mentorado.email}</p>
              )}
              {mentorado.whatsapp && (
                <p className="text-sm text-muted-foreground">📱 {mentorado.whatsapp}</p>
              )}
              {mentorado.instagram && (
                <p className="text-sm text-muted-foreground">📷 {mentorado.instagram}</p>
              )}
              {mentorado.data_ingresso && (
                <p className="text-sm text-muted-foreground">
                  Ingresso: {format(new Date(mentorado.data_ingresso), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
              
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/mentorados/${mentorado.id}`);
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver Perfil
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMentorado(mentorado);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Editar Mentorado</DialogTitle>
                    <DialogDescription>
                      Atualize as informações do mentorado
                    </DialogDescription>
                  </DialogHeader>
                  {editingMentorado && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome Completo</Label>
                          <Input
                            value={editingMentorado.profiles?.nome_completo || ""}
                            onChange={(e) =>
                              setEditingMentorado({
                                ...editingMentorado,
                                profiles: {
                                  ...editingMentorado.profiles,
                                  nome_completo: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Apelido</Label>
                          <Input
                            value={editingMentorado.profiles?.apelido || ""}
                            onChange={(e) =>
                              setEditingMentorado({
                                ...editingMentorado,
                                profiles: {
                                  ...editingMentorado.profiles,
                                  apelido: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={editingMentorado.email || ""}
                          onChange={(e) =>
                            setEditingMentorado({ ...editingMentorado, email: e.target.value })
                          }
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>WhatsApp</Label>
                          <Input
                            value={editingMentorado.whatsapp || ""}
                            onChange={(e) =>
                              setEditingMentorado({ ...editingMentorado, whatsapp: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Instagram</Label>
                          <Input
                            value={editingMentorado.instagram || ""}
                            onChange={(e) =>
                              setEditingMentorado({ ...editingMentorado, instagram: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Turma</Label>
                          <Input
                            value={editingMentorado.turma || ""}
                            onChange={(e) =>
                              setEditingMentorado({ ...editingMentorado, turma: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={editingMentorado.status}
                            onValueChange={(value) =>
                              setEditingMentorado({ ...editingMentorado, status: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="inativo">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button
                          className="flex-1"
                          onClick={() => updateMentoradoMutation.mutate(editingMentorado)}
                          disabled={updateMentoradoMutation.isPending}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Alterações
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingMentorado(null)}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMentorados?.length === 0 && (
        <Card className="border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum mentorado encontrado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
