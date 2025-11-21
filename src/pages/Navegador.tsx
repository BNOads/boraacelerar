import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Mail, User, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminNavegadorDialog } from "@/components/AdminNavegadorDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export default function Navegador() {
  const { isAdmin } = useIsAdmin();
  // Buscar navegadores ativos
  const { data: navegadores, isLoading: loadingNavegadores } = useQuery({
    queryKey: ["navegadores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("navegadores")
        .select("id, user_id, nome, foto_url, cargo, bio_curta, email, whatsapp_url, ativo, profiles(id, nome_completo, apelido, foto_url)")
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
  });

  // Buscar mentorado_id do usuário
  const { data: mentorado } = useQuery({
    queryKey: ["mentorado-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("mentorados")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Buscar histórico de atendimentos
  const { data: atendimentos, isLoading: loadingAtendimentos } = useQuery({
    queryKey: ["atendimentos", mentorado?.id],
    queryFn: async () => {
      if (!mentorado?.id) return [];
      
      const { data, error } = await supabase
        .from("atendimentos_navegador")
        .select("*, navegadores(id, user_id, nome, foto_url, cargo, profiles(id, nome_completo, apelido, foto_url))")
        .eq("mentorado_id", mentorado.id)
        .order("data_hora", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!mentorado?.id,
  });

  if (loadingNavegadores) {
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
              🤝 Navegador
            </h1>
            <p className="text-muted-foreground">
              Seu time de suporte está aqui para te ajudar a acelerar ainda mais!
            </p>
          </div>
          {isAdmin && <AdminNavegadorDialog />}
        </div>
      </div>

      {/* Navegadores */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Equipe de Navegadores</h2>
        {navegadores && navegadores.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {navegadores.map((nav) => {
              // Se for navegador externo, usar campos diretos; senão usar do profile
              const nome = nav.nome || nav.profiles?.nome_completo || nav.profiles?.apelido || "Navegador";
              const fotoUrl = nav.foto_url || nav.profiles?.foto_url;
              
              return (
                <Card
                  key={nav.id}
                  className="border-border bg-card/50 backdrop-blur-sm hover:shadow-elegant hover:scale-[1.02] transition-all duration-300"
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <Avatar className="h-24 w-24 border-4 border-primary/20">
                        <AvatarImage src={fotoUrl || ""} alt={nome} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                          {nome.charAt(0) || <User className="h-8 w-8" />}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <CardTitle className="text-xl">
                      {nome}
                    </CardTitle>
                    {nav.cargo && (
                      <CardDescription className="font-medium text-primary">
                        {nav.cargo}
                      </CardDescription>
                    )}
                  </CardHeader>
                <CardContent className="space-y-4">
                  {nav.bio_curta && (
                    <p className="text-sm text-muted-foreground text-center">
                      {nav.bio_curta}
                    </p>
                  )}
                  <div className="space-y-2">
                    {nav.whatsapp_url && (
                      <Button
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                        onClick={() => window.open(nav.whatsapp_url, "_blank")}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Falar no WhatsApp
                      </Button>
                    )}
                    {nav.email && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(`mailto:${nav.email}`, "_blank")}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar E-mail
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        ) : (
          <Card className="border-border bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum navegador disponível no momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Histórico de Atendimentos */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Histórico de Atendimentos</h2>
        {loadingAtendimentos ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : atendimentos && atendimentos.length > 0 ? (
          <div className="space-y-3">
            {atendimentos.map((atendimento) => (
              <Card
                key={atendimento.id}
                className="border-border bg-card/50 backdrop-blur-sm"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">
                        {atendimento.assunto || "Atendimento"}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(atendimento.data_hora), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          atendimento.status === "Resolvido"
                            ? "default"
                            : atendimento.status === "Pendente"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {atendimento.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {atendimento.canal}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                {atendimento.nota && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{atendimento.nota}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum atendimento registrado ainda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
