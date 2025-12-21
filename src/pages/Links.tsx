import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Edit } from "lucide-react";
import { AdminLinksDialog } from "@/components/AdminLinksDialog";
import { AdminImportarLinksDialog } from "@/components/AdminImportarLinksDialog";
import { EditarLinkDialog } from "@/components/EditarLinkDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function Links() {
  const { isAdmin } = useIsAdmin();
  const [editingLink, setEditingLink] = useState<any>(null);

  // Buscar todos os links (ativos para usuários, todos para admins)
  const { data: links, isLoading } = useQuery({
    queryKey: ["links-uteis", isAdmin],
    queryFn: async () => {
      let query = supabase
        .from("zoom_info")
        .select("*")
        .order("created_at", { ascending: false });

      // Se não for admin, filtrar apenas ativos
      if (!isAdmin) {
        query = query.eq("ativo", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

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
              🔗 Links Úteis
            </h1>
            <p className="text-muted-foreground">
              Acesso rápido às ferramentas e recursos essenciais da plataforma
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <AdminImportarLinksDialog />
              <AdminLinksDialog />
            </div>
          )}
        </div>
      </div>

      {/* Lista de Links */}
      {links && links.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Card
              key={link.id}
              className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl flex-1">{link.titulo}</CardTitle>
                  <div className="flex gap-2 items-center">
                    {!link.ativo && (
                      <Badge variant="secondary" className="text-xs">
                        Inativo
                      </Badge>
                    )}
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingLink(link)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
<<<<<<< HEAD
                  className="w-full bg-secondary hover:bg-secondary/90 text-white"
=======
                  className="w-full bg-primary hover:bg-primary/90"
>>>>>>> 486f461a9dafad709f4a63825cc535b9b4f24deb
                  onClick={() => window.open(link.url_zoom, "_blank")}
                >
                  Acessar
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-card/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ExternalLink className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum link disponível no momento.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Edição */}
      {editingLink && (
        <EditarLinkDialog
          link={editingLink}
          open={!!editingLink}
          onOpenChange={(open) => !open && setEditingLink(null)}
        />
      )}
    </div>
  );
}
