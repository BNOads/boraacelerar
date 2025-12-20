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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type CategoriaProduto = "livros" | "vestuario" | "acessorios" | "canecas";

export function AdminProdutoDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    imagem_url: "",
    categoria: "" as CategoriaProduto | "",
  });

  const addProdutoMutation = useMutation({
    mutationFn: async () => {
      if (!formData.categoria) throw new Error("Categoria é obrigatória");
      const { error } = await supabase
        .from("produtos")
        .insert([{
          nome: formData.nome,
          descricao: formData.descricao,
          imagem_url: formData.imagem_url,
          categoria: formData.categoria as CategoriaProduto,
          ativo: true,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Produto adicionado com sucesso!");
      setOpen(false);
      setFormData({
        nome: "",
        descricao: "",
        imagem_url: "",
        categoria: "",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar produto");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Adicione um novo produto à loja BORA
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Produto *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Camiseta BORA"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => setFormData({ ...formData, categoria: value as CategoriaProduto })}
            >
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="livros">Livros</SelectItem>
                <SelectItem value="vestuario">Vestuário</SelectItem>
                <SelectItem value="acessorios">Acessórios</SelectItem>
                <SelectItem value="canecas">Canecas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do produto..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imagem_url">URL da Imagem</Label>
            <Input
              id="imagem_url"
              type="url"
              value={formData.imagem_url}
              onChange={(e) => setFormData({ ...formData, imagem_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => addProdutoMutation.mutate()}
            disabled={!formData.nome || !formData.categoria || addProdutoMutation.isPending}
          >
            {addProdutoMutation.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
