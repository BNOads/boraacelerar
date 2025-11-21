import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

console.log("Edge function create-admin-user iniciada");

serve(async (req) => {
  console.log("Requisição recebida:", req.method);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Iniciando criação do usuário admin");
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const adminEmail = "ferramentas@boranaobra.com.br";
    const adminPassword = "Admin@Bora2025!";
    
    console.log("Tentando criar usuário:", adminEmail);

    // Criar usuário admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        nome_completo: "Administrador BORA",
        apelido: "Admin",
      },
    });

    if (authError) {
      console.log("Erro ao criar usuário, verificando se já existe:", authError.message);
      
      // Se usuário já existe, buscar o ID
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      const user = existingUser.users.find((u) => u.email === adminEmail);
      
      if (user) {
        console.log("Usuário encontrado, verificando profile:", user.id);
        
        // Verificar se o profile existe
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        // Se não existe, criar o profile
        if (!profile) {
          console.log("Profile não existe, criando:", user.id);
          const { error: profileError } = await supabaseAdmin
            .from("profiles")
            .insert({
              id: user.id,
              nome_completo: "Administrador BORA",
              apelido: "Admin"
            });

          if (profileError) {
            console.error("Erro ao criar profile:", profileError);
            throw profileError;
          }
        }
        
        console.log("Adicionando role de admin:", user.id);
        
        // Adicionar role de admin
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });

        if (roleError) {
          console.error("Erro ao adicionar role:", roleError);
          throw roleError;
        }

        console.log("Role de admin adicionada com sucesso!");
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Usuário admin já existia. Role de admin adicionada/confirmada.",
            user_id: user.id,
            email: adminEmail,
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      console.error("Usuário não encontrado após erro:", authError);
      throw authError;
    }

    console.log("Usuário criado com sucesso:", authData.user.id);

    // Criar profile
    console.log("Criando profile:", authData.user.id);
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        nome_completo: "Administrador BORA",
        apelido: "Admin"
      });

    if (profileError) {
      console.error("Erro ao criar profile:", profileError);
      // Não falhar se o profile já existe
      if (profileError.code !== "23505") {
        throw profileError;
      }
    }

    // Aguardar um momento
    await new Promise(resolve => setTimeout(resolve, 500));

    // Adicionar role de admin
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authData.user.id, role: "admin" });

    if (roleError) {
      console.error("Erro ao adicionar role:", roleError);
      throw roleError;
    }

    console.log("Role de admin adicionada com sucesso!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário admin criado com sucesso!",
        email: adminEmail,
        user_id: authData.user.id,
        temporary_password: adminPassword,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Erro no edge function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }), 
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
