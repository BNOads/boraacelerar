import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, ExternalLink, Lock, BookOpen } from "lucide-react";

export default function Links() {
  const { data: zoomInfo, isLoading } = useQuery({
    queryKey: ["zoom-info"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zoom_info")
        .select("*")
        .eq("ativo", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const linksUteis = [
    {
      title: "BORACONecta",
      description: "Plataforma de networking e conexões do BORA Acelerar",
      icon: ExternalLink,
      url: "#",
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Suporte Técnico",
      description: "Central de ajuda e documentação",
      icon: BookOpen,
      url: "#",
      color: "from-purple-500 to-pink-500",
    },
  ];

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
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          🔗 Links Úteis
        </h1>
        <p className="text-muted-foreground">
          Acesso rápido às ferramentas e recursos essenciais da plataforma
        </p>
      </div>

      {/* Zoom Info */}
      {zoomInfo && (
        <Card className="border-border bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{zoomInfo.titulo}</CardTitle>
                <CardDescription>Sala de reuniões virtual do BORA Acelerar</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {zoomInfo.instrucoes_html && (
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: zoomInfo.instrucoes_html }}
              />
            )}
            
            {zoomInfo.senha_acesso && (
              <div className="flex items-center gap-2 p-3 bg-card/50 rounded-lg border border-border">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Senha:</span>
                <code className="px-2 py-1 bg-muted rounded font-mono text-sm font-semibold">
                  {zoomInfo.senha_acesso}
                </code>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                onClick={() => window.open(zoomInfo.url_zoom, "_blank")}
              >
                <Video className="mr-2 h-4 w-4" />
                Entrar na Sala Zoom
              </Button>
              {zoomInfo.tutorial_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(zoomInfo.tutorial_url, "_blank")}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Tutorial
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outros Links Úteis */}
      <div className="grid gap-6 md:grid-cols-2">
        {linksUteis.map((link, idx) => {
          const Icon = link.icon;
          return (
            <Card
              key={idx}
              className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 bg-gradient-to-br ${link.color} rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{link.title}</CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => window.open(link.url, "_blank")}
                >
                  Acessar
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
