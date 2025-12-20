import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type CategoriaProduto = "livros" | "vestuario" | "acessorios" | "canecas";

interface EditarProdutoDialogProps {
  produto: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditarProdutoDialog({
  produto,
  open,
  onOpenChange
}: EditarProdutoDialogProps) {
  const queryClient = useQueryClient();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    imagem_url: "",
    categoria: "" as CategoriaProduto | "",
    ativo: true,
  });

  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome || "",
        descricao: produto.descricao || "",
        imagem_url: produto.imagem_url || "",
        categoria: produto.categoria || "",
        ativo: produto.ativo ?? true,
      });
    }
  }, [produto]);

  const updateProdutoMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("produtos")
        .update({
          nome: formData.nome,
          descricao: formData.descricao,
          imagem_url: formData.imagem_url,
          categoria: formData.categoria,
          ativo: formData.ativo,
        })
        .eq("id", produto.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Produto atualizado com sucesso!");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar produto");
    },
  });

  const deleteProdutoMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", produto.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["produtos"] });
      toast.success("Produto removido com sucesso!");
      setShowDeleteAlert(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover produto");
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize as informações do produto
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do produto"
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

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Status Ativo</Label>
                <p className="text-sm text-muted-foreground">
                  Desativar remove da listagem pública
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={() => updateProdutoMutation.mutate()}
              disabled={!formData.nome || !formData.categoria || updateProdutoMutation.isPending}
            >
              {updateProdutoMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteAlert(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProdutoMutation.mutate()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteProdutoMutation.isPending ? "Removendo..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
