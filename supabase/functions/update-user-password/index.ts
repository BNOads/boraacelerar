import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePasswordRequest {
  email: string;
  newPassword: string;
}

const isValidEmail = (email: string) => /.+@.+\..+/.test(email) && email.length <= 255;

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, newPassword }: UpdatePasswordRequest = await req.json();

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: "Senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client (service role)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Try to find the user by paginating through the users list
    const perPage = 200;
    let page = 1;
    let foundUser: any = null;

    while (!foundUser) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error("Erro ao listar usuários:", error);
        return new Response(
          JSON.stringify({ error: "Erro ao buscar usuário" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const users = data?.users ?? [];
      foundUser = users.find((u: any) => (u.email || "").toLowerCase() === email.toLowerCase());

      if (users.length < perPage) break; // no more pages
      page += 1;
      if (page > 10) break; // safety cap (2000 users)
    }

    if (foundUser) {
      // Update existing user password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(foundUser.id, { password: newPassword });
      if (updateError) {
        console.error("Erro ao atualizar senha:", updateError);
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar senha" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, action: "updated" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If not found, create the user already confirmed with the provided password
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: newPassword,
      email_confirm: true,
      user_metadata: { created_by: "update-user-password" },
    });

    if (createError) {
      console.error("Erro ao criar usuário:", createError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, action: "created", user_id: created.user?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro na função update-user-password:", error?.message || error);
    return new Response(
      JSON.stringify({ error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
