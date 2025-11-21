import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
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

const pilares = ["Empreendedor", "Estruturação", "Marketing", "Vendas", "Gestão", "Finanças"] as const;

export function AdminTrilhaDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    pilar: "" as (typeof pilares)[number] | "",
    tipo: "",
    url: "",
    thumbnail_url: "",
    ordem: 0,
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const insertData: TablesInsert<"trilha_aceleracao"> = {
        titulo: data.titulo,
        descricao: data.descricao,
        pilar: data.pilar as (typeof pilares)[number],
        tipo: data.tipo,
        url: data.url,
        thumbnail_url: data.thumbnail_url,
        ordem: data.ordem,
      };
      const { error } = await supabase
        .from("trilha_aceleracao")
        .insert([insertData]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trilha"] });
      toast.success("Conteúdo adicionado com sucesso!");
      setOpen(false);
      setFormData({
        titulo: "",
        descricao: "",
        pilar: "",
        tipo: "",
        url: "",
        thumbnail_url: "",
        ordem: 0,
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
          <DialogTitle>Adicionar Conteúdo à Trilha</DialogTitle>
          <DialogDescription>
            Adicione um novo módulo ou material à trilha de aceleração
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pilar">Pilar *</Label>
              <Select value={formData.pilar || undefined} onValueChange={(value) => setFormData({ ...formData, pilar: value as typeof formData.pilar })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o pilar" />
                </SelectTrigger>
                <SelectContent>
                  {pilares.map((pilar) => (
                    <SelectItem key={pilar} value={pilar}>
                      {pilar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Input
                id="tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                placeholder="Ex: Vídeo, PDF, Artigo"
              />
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">URL da Thumbnail</Label>
            <Input
              id="thumbnail_url"
              type="url"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ordem">Ordem de Exibição</Label>
            <Input
              id="ordem"
              type="number"
              value={formData.ordem}
              onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => addItemMutation.mutate(formData)}
            disabled={!formData.titulo || !formData.pilar || !formData.tipo || addItemMutation.isPending}
          >
            {addItemMutation.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
