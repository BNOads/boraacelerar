import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function UpdatePassword() {
  const [email, setEmail] = useState("flaviacecilia@gmail.com");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("update-user-password", {
        body: { email, newPassword: email },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Senha atualizada! Use email e senha iguais para entrar.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Atualizar Senha</CardTitle>
          <CardDescription>Define a senha igual ao email (para teste)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email do usuário"
          />
          <Button onClick={handleUpdatePassword} disabled={loading} className="w-full">
            {loading ? "Atualizando..." : "Definir senha = email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
