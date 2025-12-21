import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminNotifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "informacao" as "informacao" | "alerta" | "prioridade",
    priority: "normal" as "normal" | "alta",
  });

  const createNotificationMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const notification: TablesInsert<"notifications"> = {
        title: formData.title,
        message: formData.message,
        type: formData.type,
        priority: formData.priority,
        created_by: user.id,
        visible_to: "all",
        is_active: true,
      } as const;

      const { error } = await supabase
        .from("notifications")
        .insert([notification]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
      toast.success("Notificação criada com sucesso!");
      navigate("/notifications");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar notificação");
    },
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => navigate("/notifications")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          ✏️ Criar Notificação
        </h1>
        <p className="text-muted-foreground">
          Envie avisos e comunicados para todos os mentorados
        </p>
      </div>

      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle>Nova Notificação</CardTitle>
          <CardDescription>
            Preencha os dados da notificação que será enviada para todos os usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Nova aula disponível"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/100 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Descreva o aviso ou comunicado..."
              rows={6}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length}/500 caracteres
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "informacao" | "alerta" | "prioridade") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informacao">ℹ️ Informação</SelectItem>
                  <SelectItem value="alerta">⚠️ Alerta</SelectItem>
                  <SelectItem value="prioridade">🔴 Prioridade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "normal" | "alta") =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Alta prioridade aparece primeiro no popup
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1 bg-secondary hover:bg-secondary/90"
              onClick={() => createNotificationMutation.mutate()}
              disabled={
                !formData.title ||
                !formData.message ||
                createNotificationMutation.isPending
              }
            >
              {createNotificationMutation.isPending
                ? "Criando..."
                : "Criar e Enviar Notificação"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/notifications")}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
