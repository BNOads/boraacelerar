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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const tiposConteudo = [
  "Hotseat",
  "Implementação", 
  "Mentoria",
  "Análise Temática",
  "Imersões com Convidados"
] as const;

type TipoConteudo = (typeof tiposConteudo)[number];

export function AdminMembrosDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "" as TipoConteudo | "",
    url: "",
    data_publicacao: new Date().toISOString().split('T')[0],
    ativo: true,
  });

  const addConteudoMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error: conteudoError } = await supabase
        .from("conteudo_direcionado")
        .insert([{
          titulo: data.titulo,
          descricao: data.descricao,
          tipo: "Vídeo" as const, // Usamos Vídeo como tipo base no banco
          url: data.url,
          data_publicacao: data.data_publicacao,
          ativo: data.ativo,
          tags: [data.tipo], // Armazenamos o tipo real como tag
        }]);
      
      if (conteudoError) throw conteudoError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conteudo-direcionado"] });
      toast.success("Conteúdo adicionado com sucesso!");
      setOpen(false);
      setFormData({
        titulo: "",
        descricao: "",
        tipo: "",
        url: "",
        data_publicacao: new Date().toISOString().split('T')[0],
        ativo: true,
      });
    },
    onError: () => {
      toast.error("Erro ao adicionar conteúdo");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Conteúdo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Conteúdo para Membros</DialogTitle>
          <DialogDescription>
            Adicione um novo conteúdo direcionado aos membros
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título do conteúdo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={formData.tipo || undefined} onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoConteudo })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposConteudo.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do conteúdo"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL do Conteúdo</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => addConteudoMutation.mutate(formData)}
            disabled={!formData.titulo || !formData.tipo || addConteudoMutation.isPending}
          >
            {addConteudoMutation.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
