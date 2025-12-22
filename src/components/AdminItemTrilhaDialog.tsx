import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, FileText, Video, Link, CheckSquare, BookOpen } from "lucide-react";

interface AdminItemTrilhaDialogProps {
  trilhaId: string;
  onSuccess?: () => void;
  itemToEdit?: {
    id: string;
    tipo: string;
    titulo: string;
    descricao: string | null;
    url: string | null;
    duracao_min: number | null;
    ordem: number;
  } | null;
  trigger?: React.ReactNode;
}

const TIPOS_ITEM = [
  { value: "tarefa", label: "Tarefa", icon: CheckSquare },
  { value: "documento", label: "Documento", icon: FileText },
  { value: "aula", label: "Aula/Vídeo", icon: Video },
  { value: "curso", label: "Curso", icon: BookOpen },
  { value: "link_externo", label: "Link Externo", icon: Link },
];

export function AdminItemTrilhaDialog({ trilhaId, onSuccess, itemToEdit, trigger }: AdminItemTrilhaDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "aula",
    titulo: "",
    descricao: "",
    url: "",
    duracao_min: "",
    ordem: "0",
  });

  useEffect(() => {
    if (open) {
      if (itemToEdit) {
        setFormData({
          tipo: itemToEdit.tipo,
          titulo: itemToEdit.titulo,
          descricao: itemToEdit.descricao || "",
          url: itemToEdit.url || "",
          duracao_min: itemToEdit.duracao_min?.toString() || "",
          ordem: itemToEdit.ordem.toString(),
        });
      } else {
        setFormData({
          tipo: "aula",
          titulo: "",
          descricao: "",
          url: "",
          duracao_min: "",
          ordem: "0",
        });
      }
    }
  }, [open, itemToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.tipo) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        trilha_id: trilhaId,
        tipo: formData.tipo,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        url: formData.url || null,
        duracao_min: formData.duracao_min ? parseInt(formData.duracao_min) : null,
        ordem: parseInt(formData.ordem) || 0,
      };

      if (itemToEdit) {
        const { error } = await supabase
          .from("itens_trilha")
          .update(payload)
          .eq("id", itemToEdit.id);

        if (error) throw error;
        toast.success("Item atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("itens_trilha")
          .insert(payload);

        if (error) throw error;
        toast.success("Item adicionado com sucesso!");
      }

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{itemToEdit ? "Editar Item" : "Adicionar Item à Trilha"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_ITEM.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    <div className="flex items-center gap-2">
                      <tipo.icon className="h-4 w-4" />
                      {tipo.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Conhecimento de marketing digital"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do item..."
            />
          </div>

          {formData.tipo !== "tarefa" && (
            <div className="space-y-2">
              <Label>URL / Link</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duração (min)</Label>
              <Input
                type="number"
                value={formData.duracao_min}
                onChange={(e) => setFormData({ ...formData, duracao_min: e.target.value })}
                placeholder="30"
              />
            </div>
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : itemToEdit ? "Salvar" : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
