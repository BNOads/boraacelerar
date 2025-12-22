import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Mentorado {
  id: string;
  profiles: {
    nome_completo: string;
    apelido: string | null;
  } | null;
}

interface AdminTrilhaMentoradoDialogProps {
  onSuccess?: () => void;
  trilhaToEdit?: {
    id: string;
    mentorado_id: string;
    titulo: string;
    descricao: string | null;
    prazo: string | null;
    prioridade: string;
  } | null;
  trigger?: React.ReactNode;
}

export function AdminTrilhaMentoradoDialog({ onSuccess, trilhaToEdit, trigger }: AdminTrilhaMentoradoDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mentorados, setMentorados] = useState<Mentorado[]>([]);
  const [formData, setFormData] = useState({
    mentorado_id: "",
    titulo: "",
    descricao: "",
    prazo: "",
    prioridade: "normal",
  });

  useEffect(() => {
    if (open) {
      fetchMentorados();
      if (trilhaToEdit) {
        setFormData({
          mentorado_id: trilhaToEdit.mentorado_id,
          titulo: trilhaToEdit.titulo,
          descricao: trilhaToEdit.descricao || "",
          prazo: trilhaToEdit.prazo || "",
          prioridade: trilhaToEdit.prioridade,
        });
      } else {
        setFormData({
          mentorado_id: "",
          titulo: "",
          descricao: "",
          prazo: "",
          prioridade: "normal",
        });
      }
    }
  }, [open, trilhaToEdit]);

  const fetchMentorados = async () => {
    const { data } = await supabase
      .from("mentorados")
      .select(`
        id,
        profiles:user_id (
          nome_completo,
          apelido
        )
      `)
      .eq("status", "ativo");
    
    setMentorados(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.mentorado_id || !formData.titulo) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (trilhaToEdit) {
        const { error } = await supabase
          .from("trilhas_mentorado")
          .update({
            titulo: formData.titulo,
            descricao: formData.descricao || null,
            prazo: formData.prazo || null,
            prioridade: formData.prioridade,
          })
          .eq("id", trilhaToEdit.id);

        if (error) throw error;
        toast.success("Trilha atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("trilhas_mentorado")
          .insert({
            mentorado_id: formData.mentorado_id,
            titulo: formData.titulo,
            descricao: formData.descricao || null,
            prazo: formData.prazo || null,
            prioridade: formData.prioridade,
            created_by: user?.id,
          });

        if (error) throw error;
        toast.success("Trilha criada com sucesso!");
      }

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar trilha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Nova Trilha
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{trilhaToEdit ? "Editar Trilha" : "Nova Trilha para Mentorado"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Mentorado *</Label>
            <Select
              value={formData.mentorado_id}
              onValueChange={(value) => setFormData({ ...formData, mentorado_id: value })}
              disabled={!!trilhaToEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mentorado" />
              </SelectTrigger>
              <SelectContent>
                {mentorados.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.profiles?.apelido || m.profiles?.nome_completo || "Sem nome"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Título da Trilha *</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Desenvolvimento em estratégia de tráfego"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Objetivo da trilha..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prazo</Label>
              <Input
                type="date"
                value={formData.prazo}
                onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => setFormData({ ...formData, prioridade: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : trilhaToEdit ? "Salvar" : "Criar Trilha"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
