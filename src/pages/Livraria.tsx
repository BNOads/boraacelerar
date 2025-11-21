import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ShoppingCart } from "lucide-react";
import { CadastrarLivroDialog } from "@/components/CadastrarLivroDialog";
import { useEffect, useState } from "react";

export default function Livraria() {
  const [isAdmin, setIsAdmin] = useState(false);

  const { data: livros, isLoading } = useQuery({
    queryKey: ["livros"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("livros_recomendados")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!data);
      }
    };
    checkAdmin();
  }, []);

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
              📖 Livraria BORA
            </h1>
            <p className="text-muted-foreground">
              Livros cuidadosamente selecionados para acelerar sua jornada empreendedora
            </p>
          </div>
          {isAdmin && <CadastrarLivroDialog />}
        </div>
      </div>

      {/* Grid de Livros */}
      {livros && livros.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {livros.map((livro) => (
            <Card
              key={livro.id}
              className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
            >
              <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                {livro.capa_url ? (
                  <img
                    src={livro.capa_url}
                    alt={livro.titulo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{livro.titulo}</CardTitle>
                <CardDescription className="font-medium">{livro.autor}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {livro.descricao_curta && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {livro.descricao_curta}
                  </p>
                )}
                {livro.url_compra && (
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                    onClick={() => window.open(livro.url_compra, "_blank")}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Comprar Agora
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum livro cadastrado no momento. Em breve teremos recomendações incríveis!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
