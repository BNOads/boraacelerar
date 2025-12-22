import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Video } from "lucide-react";

interface AdminGravacaoIndividualDialogProps {
  onSuccess?: () => void;
}

export function AdminGravacaoIndividualDialog({ onSuccess }: AdminGravacaoIndividualDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    mentorado_id: "",
    titulo: "",
    url_video: "",
    descricao: "",
    thumbnail_url: "",
    duracao_min: "",
    tags: "",
    data_gravacao: new Date().toISOString().split("T")[0],
  });

  // Buscar mentorados ativos
  const { data: mentorados } = useQuery({
    queryKey: ["mentorados-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorados")
        .select(`
          id,
          profiles:user_id (
            nome_completo,
            apelido
          )
        `)
        .eq("status", "ativo")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Buscar navegadores
  const { data: navegadores } = useQuery({
    queryKey: ["navegadores-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("navegadores")
        .select("id, nome")
        .eq("ativo", true);

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.mentorado_id || !form.titulo || !form.url_video) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o mentorado, título e URL do vídeo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("gravacoes_individuais").insert({
        mentorado_id: form.mentorado_id,
        titulo: form.titulo,
        url_video: form.url_video,
        descricao: form.descricao || null,
        thumbnail_url: form.thumbnail_url || null,
        duracao_seg: form.duracao_min ? parseInt(form.duracao_min) * 60 : null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : null,
        data_gravacao: form.data_gravacao,
        ativo: true,
      });

      if (error) throw error;

      toast({
        title: "Sessão cadastrada!",
        description: "A gravação individual foi disponibilizada para o mentorado.",
      });

      // Reset form
      setForm({
        mentorado_id: "",
        titulo: "",
        url_video: "",
        descricao: "",
        thumbnail_url: "",
        duracao_min: "",
        tags: "",
        data_gravacao: new Date().toISOString().split("T")[0],
      });

      queryClient.invalidateQueries({ queryKey: ["gravacoes-individuais"] });
      queryClient.invalidateQueries({ queryKey: ["admin-gravacoes-individuais"] });
      onSuccess?.();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Video className="h-4 w-4" />
          Sessão Individual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Sessão Individual</DialogTitle>
          <DialogDescription>
            Adicione uma gravação de sessão 1:1 disponível apenas para o mentorado selecionado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mentorado">Mentorado *</Label>
            <Select
              value={form.mentorado_id}
              onValueChange={(value) => setForm({ ...form, mentorado_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mentorado" />
              </SelectTrigger>
              <SelectContent>
                {mentorados?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.profiles?.apelido || m.profiles?.nome_completo || "Sem nome"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ex: Sessão de Mentoria - Janeiro 2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url_video">URL do Vídeo *</Label>
            <Input
              id="url_video"
              value={form.url_video}
              onChange={(e) => setForm({ ...form, url_video: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Descrição ou resumo da sessão"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_gravacao">Data da Gravação</Label>
              <Input
                id="data_gravacao"
                type="date"
                value={form.data_gravacao}
                onChange={(e) => setForm({ ...form, data_gravacao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao_min">Duração (min)</Label>
              <Input
                id="duracao_min"
                type="number"
                value={form.duracao_min}
                onChange={(e) => setForm({ ...form, duracao_min: e.target.value })}
                placeholder="60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">URL da Thumbnail</Label>
            <Input
              id="thumbnail_url"
              value={form.thumbnail_url}
              onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="mentoria, 1:1, fevereiro"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar Sessão"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}