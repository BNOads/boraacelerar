import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, BookOpen } from "lucide-react";
import { AdminTrilhaDialog } from "@/components/AdminTrilhaDialog";
import { AdminImportarTrilhaDialog } from "@/components/AdminImportarTrilhaDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface TrilhaItem {
  id: string;
  pilar: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  url: string | null;
  thumbnail_url: string | null;
}

const pilarColors: Record<string, string> = {
  Empreendedor: "bg-primary/20 text-primary",
  Estruturação: "bg-blue-500/20 text-blue-400",
  Marketing: "bg-green-500/20 text-green-400",
  Vendas: "bg-red-500/20 text-red-400",
  Gestão: "bg-purple-500/20 text-purple-400",
  Finanças: "bg-yellow-500/20 text-yellow-400",
};

export default function Trilha() {
  const [items, setItems] = useState<TrilhaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    const fetchTrilha = async () => {
      const { data } = await supabase
        .from("trilha_aceleracao")
        .select("*")
        .order("pilar", { ascending: true })
        .order("ordem", { ascending: true });

      setItems(data || []);
      setLoading(false);
    };

    fetchTrilha();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const groupedByPilar = items.reduce((acc, item) => {
    if (!acc[item.pilar]) acc[item.pilar] = [];
    acc[item.pilar].push(item);
    return acc;
  }, {} as Record<string, TrilhaItem[]>);

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-secondary" strokeWidth={1.5} />
          <div>
            <h1 className="text-4xl font-bold text-foreground">Trilha & Conteúdo</h1>
            <p className="text-muted-foreground text-lg">
              Explore os módulos organizados por pilar para acelerar seu crescimento
            </p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <AdminImportarTrilhaDialog />
            <AdminTrilhaDialog />
          </div>
        )}
      </div>

      {Object.keys(groupedByPilar).length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum conteúdo disponível no momento. Em breve novos módulos serão adicionados!
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByPilar).map(([pilar, pilarItems]) => (
          <div key={pilar} className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge className={pilarColors[pilar] || "bg-muted text-muted-foreground"}>
                {pilar}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">{pilar}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pilarItems.map((item) => (
                <Card 
                  key={item.id} 
                  className="hover:scale-105 transition-transform duration-300 border-border bg-card shadow-card"
                >
                  {item.thumbnail_url && (
                    <div className="h-40 overflow-hidden rounded-t-lg bg-muted">
                      <img 
                        src={item.thumbnail_url} 
                        alt={item.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <Badge variant="outline" className="w-fit mb-2">
                      {item.tipo}
                    </Badge>
                    <CardTitle className="text-lg text-foreground">{item.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {item.descricao && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {item.descricao}
                      </p>
                    )}
                    {item.url && (
                      <Button 
                        className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                        onClick={() => window.open(item.url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Acessar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}