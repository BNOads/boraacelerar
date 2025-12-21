import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingCart, Edit, ShoppingBag, BookOpen, Shirt, Backpack, Coffee } from "lucide-react";
import { AdminProdutoDialog } from "@/components/AdminProdutoDialog";
import { EditarProdutoDialog } from "@/components/EditarProdutoDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function Loja() {
  const { isAdmin } = useIsAdmin();
  const [editingProduto, setEditingProduto] = useState<any>(null);

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

  const categoriaLabels = {
    livros: "Livros",
    vestuario: "Vestuário",
    acessorios: "Acessórios",
    canecas: "Canecas",
  };

  const renderProdutosGrid = (produtosFiltrados: any[]) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }

    if (!produtosFiltrados || produtosFiltrados.length === 0) {
      return (
        <Card className="border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum produto disponível nesta categoria.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {produtosFiltrados.map((produto) => (
          <Card
            key={produto.id}
            className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            onClick={() => {
              if (produto.url_compra) {
                window.open(produto.url_compra, "_blank");
              }
            }}
          >
            <div className="relative aspect-square bg-muted overflow-hidden">
              {produto.imagem_url ? (
                <img
                  src={produto.imagem_url}
                  alt={produto.nome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            <CardHeader className="p-3">
              <div className="flex items-start justify-between gap-1">
                <CardTitle className="text-xs line-clamp-2 flex-1">
                  {produto.nome}
                </CardTitle>
                <div className="flex gap-1 items-center">
                  {!produto.ativo && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      Inativo
                    </Badge>
                  )}
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduto(produto);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="w-fit text-[10px] px-1 py-0">
                {categoriaLabels[produto.categoria as keyof typeof categoriaLabels]}
              </Badge>
            </CardHeader>

            <CardContent className="p-3 pt-0 space-y-2">
              {produto.descricao && (
                <p className="text-[10px] text-muted-foreground line-clamp-2">
                  {produto.descricao}
                </p>
              )}
              {produto.url_compra && (
                <Button
                  size="sm"
                  className="w-full bg-secondary hover:bg-secondary/90 h-7 text-[10px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(produto.url_compra, "_blank");
                  }}
                >
                  <ShoppingCart className="mr-1 h-3 w-3" />
                  Comprar
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-primary" strokeWidth={1.5} />
              Loja BORA
            </h1>
            <p className="text-muted-foreground">
              Produtos exclusivos para acelerar sua jornada empreendedora
            </p>
          </div>
          {isAdmin && <AdminProdutoDialog />}
        </div>
      </div>

      <Tabs defaultValue="todas" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="livros" className="flex items-center gap-1"><BookOpen className="h-4 w-4" strokeWidth={1.5} /> Livros</TabsTrigger>
          <TabsTrigger value="vestuario" className="flex items-center gap-1"><Shirt className="h-4 w-4" strokeWidth={1.5} /> Vestuário</TabsTrigger>
          <TabsTrigger value="acessorios" className="flex items-center gap-1"><Backpack className="h-4 w-4" strokeWidth={1.5} /> Acessórios</TabsTrigger>
          <TabsTrigger value="canecas" className="flex items-center gap-1"><Coffee className="h-4 w-4" strokeWidth={1.5} /> Canecas</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4">
          {renderProdutosGrid(produtos || [])}
        </TabsContent>

        <TabsContent value="livros" className="space-y-4">
          {renderProdutosGrid(
            produtos?.filter((p) => p.categoria === "livros") || []
          )}
        </TabsContent>

        <TabsContent value="vestuario" className="space-y-4">
          {renderProdutosGrid(
            produtos?.filter((p) => p.categoria === "vestuario") || []
          )}
        </TabsContent>

        <TabsContent value="acessorios" className="space-y-4">
          {renderProdutosGrid(
            produtos?.filter((p) => p.categoria === "acessorios") || []
          )}
        </TabsContent>

        <TabsContent value="canecas" className="space-y-4">
          {renderProdutosGrid(
            produtos?.filter((p) => p.categoria === "canecas") || []
          )}
        </TabsContent>
      </Tabs>

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
