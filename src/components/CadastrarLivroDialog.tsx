import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function CadastrarLivroDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    titulo: "",
    autor: "",
    descricao_curta: "",
    url_compra: "",
    capa_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("livros_recomendados")
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Livro cadastrado com sucesso.",
      });

      setFormData({
        titulo: "",
        autor: "",
        descricao_curta: "",
        url_compra: "",
        capa_url: "",
      });
      setOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao cadastrar livro:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o livro.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-secondary hover:bg-secondary/90">
          <Plus className="mr-2 h-4 w-4" />
          Cadastrar Livro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Livro</DialogTitle>
          <DialogDescription>
            Adicione um novo livro à biblioteca recomendada
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="autor">Autor *</Label>
              <Input
                id="autor"
                value={formData.autor}
                onChange={(e) => setFormData({ ...formData, autor: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao_curta">Descrição Curta</Label>
              <Textarea
                id="descricao_curta"
                value={formData.descricao_curta}
                onChange={(e) => setFormData({ ...formData, descricao_curta: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url_compra">Link para Compra</Label>
              <Input
                id="url_compra"
                type="url"
                placeholder="https://..."
                value={formData.url_compra}
                onChange={(e) => setFormData({ ...formData, url_compra: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capa_url">URL da Capa</Label>
              <Input
                id="capa_url"
                type="url"
                placeholder="https://..."
                value={formData.capa_url}
                onChange={(e) => setFormData({ ...formData, capa_url: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
