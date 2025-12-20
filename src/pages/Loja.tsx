import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Package, Edit } from "lucide-react";
import { AdminProdutoDialog } from "@/components/AdminProdutoDialog";
import { EditarProdutoDialog } from "@/components/EditarProdutoDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function Loja() {
  const { isAdmin } = useIsAdmin();
  const [editingProduto, setEditingProduto] = useState<any>(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");

  const { data: produtos, isLoading } = useQuery({
    queryKey: ["produtos", isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("produtos")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const produtosFiltrados = produtos?.filter(p =>
    categoriaFiltro === "todas" || p.categoria === categoriaFiltro
  );

  const categoriaLabels = {
    livros: "Livros",
    vestuario: "Vestuário",
    acessorios: "Acessórios",
    canecas: "Canecas",
  };

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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              🛍️ Loja BORA
            </h1>
            <p className="text-muted-foreground">
              Produtos exclusivos para acelerar sua jornada empreendedora
            </p>
          </div>
          {isAdmin && <AdminProdutoDialog />}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Categoria:</label>
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            <SelectItem value="livros">Livros</SelectItem>
            <SelectItem value="vestuario">Vestuário</SelectItem>
            <SelectItem value="acessorios">Acessórios</SelectItem>
            <SelectItem value="canecas">Canecas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      {produtosFiltrados && produtosFiltrados.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {produtosFiltrados.map((produto) => (
            <Card
              key={produto.id}
              className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-muted overflow-hidden">
                {produto.imagem_url ? (
                  <img
                    src={produto.imagem_url}
                    alt={produto.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2 flex-1">
                    {produto.nome}
                  </CardTitle>
                  <div className="flex gap-2 items-center">
                    {!produto.ativo && (
                      <Badge variant="secondary" className="text-xs">
                        Inativo
                      </Badge>
                    )}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingProduto(produto)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="w-fit">
                  {categoriaLabels[produto.categoria as keyof typeof categoriaLabels]}
                </Badge>
              </CardHeader>

              <CardContent>
                {produto.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {produto.descricao}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {categoriaFiltro === "todas"
                ? "Nenhum produto disponível no momento."
                : `Nenhum produto na categoria "${categoriaLabels[categoriaFiltro as keyof typeof categoriaLabels]}".`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingProduto && (
        <EditarProdutoDialog
          produto={editingProduto}
          open={!!editingProduto}
          onOpenChange={(open) => !open && setEditingProduto(null)}
        />
      )}
    </div>
  );
}
