import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import logo from "@/assets/logo-bora.png";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional(),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [userEmailFromSession, setUserEmailFromSession] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
        setUserEmailFromSession(session?.user.email ?? null);
        return;
      }
      if (session) {
        navigate("/dashboard");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const isRecoveryLink = window.location.hash.includes("type=recovery");
      if (isRecoveryLink) {
        setIsRecovery(true);
        setUserEmailFromSession(session?.user.email ?? null);
        return;
      }
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationData = isSignUp 
        ? { email, password, nome_completo: nomeCompleto }
        : { email, password };
      
      authSchema.parse(validationData);

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              nome_completo: nomeCompleto,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered") || error.message.includes("User already registered")) {
            toast.error("Este email já está cadastrado");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Conta criada! Você já pode fazer login 🚀");
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Email ou senha incorretos");
          } else if (error.message.includes("Database error")) {
            toast.error("Erro ao acessar o sistema. Por favor, tente novamente.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Bem-vindo de volta! 🎉");
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleMagicLink = async () => {
    if (!email) {
      toast.error("Informe seu email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Enviamos um link de acesso para seu email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      toast.error("Informe seu email para redefinir a senha");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Enviamos um link para redefinir sua senha.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetPasswordToEmail = async () => {
    const targetEmail = userEmailFromSession || email;
    if (!targetEmail) {
      toast.error("Não foi possível obter o email.");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Sessão inválida. Use o link do email para redefinir.");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: targetEmail });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Senha atualizada com sucesso.");
        setIsRecovery(false);
        navigate("/dashboard");
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="text-center space-y-4">
          <img src={logo} alt="BORA Acelerar" className="h-16 mx-auto" />
          <CardTitle className="text-2xl font-bold text-foreground">
            {isSignUp ? "Criar Conta" : "Bem-vindo de volta"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isSignUp ? "Junte-se à Mentoria BORA Acelerar" : "Entre para continuar sua jornada"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRecovery ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Detectamos um link de recuperação. Podemos definir sua senha igual ao seu email para facilitar o acesso neste teste.
              </p>
              <div className="text-sm">
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="text-foreground font-medium">{userEmailFromSession || email || "seu email"}</span>
              </div>
              <Button className="w-full" onClick={handleSetPasswordToEmail} disabled={updatingPassword}>
                {updatingPassword ? "Atualizando..." : "Definir senha = seu email"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome completo"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    required
                    className="bg-background border-input"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background border-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-background border-input"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? "Carregando..." : isSignUp ? "Criar Conta" : "Entrar"}
              </Button>
              {!isSignUp && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleMagicLink}
                  disabled={loading || !email}
                >
                  Entrar com link mágico
                </Button>
              )}
            </form>
          )}
          <div className="mt-4 text-center space-y-2">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Esqueci minha senha
            </button>
            <div>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isSignUp ? "Já tem uma conta? Entrar" : "Não tem conta? Criar uma"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}