import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  email: string
  password: string
  nome_completo: string
  apelido?: string
  role: 'mentorado' | 'navegador' | 'admin'
  // Dados específicos de mentorado
  turma?: string
  whatsapp?: string
  instagram?: string
  meta_clientes?: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar se o usuário é admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Sem autorização')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    const { data: { user: requestUser }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !requestUser) {
      throw new Error('Usuário não autenticado')
    }

    // Verificar se o usuário tem role de admin usando o client com service role (bypassa RLS)
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestUser.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roles) {
      throw new Error('Usuário não tem permissão de administrador')
    }

    const requestData: CreateUserRequest = await req.json()
    console.log('Criando usuário:', { email: requestData.email, role: requestData.role })

    // Criar usuário usando o admin API

    // Criar o usuário no auth
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true,
      user_metadata: {
        nome_completo: requestData.nome_completo,
        apelido: requestData.apelido || null,
      },
    })

    if (createUserError) {
      console.error('Erro ao criar usuário:', createUserError)
      throw new Error(`Erro ao criar usuário: ${createUserError.message}`)
    }

    if (!newUser.user) {
      throw new Error('Usuário não foi criado')
    }

    console.log('Usuário criado com sucesso:', newUser.user.id)

    // Criar perfil (será criado automaticamente pelo trigger handle_new_user)
    // Aguardar um pouco para garantir que o trigger foi executado
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Adicionar role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: requestData.role,
      })

    if (roleError) {
      console.error('Erro ao adicionar role:', roleError)
      throw new Error(`Erro ao adicionar role: ${roleError.message}`)
    }

    console.log('Role adicionada com sucesso:', requestData.role)

    // Se for mentorado, criar entrada na tabela mentorados
    if (requestData.role === 'mentorado') {
      const { error: mentoradoError } = await supabaseAdmin
        .from('mentorados')
        .insert({
          user_id: newUser.user.id,
          turma: requestData.turma || null,
          whatsapp: requestData.whatsapp || null,
          instagram: requestData.instagram || null,
          email: requestData.email,
          meta_clientes: requestData.meta_clientes || 0,
          status: 'ativo',
        })

      if (mentoradoError) {
        console.error('Erro ao criar mentorado:', mentoradoError)
        throw new Error(`Erro ao criar mentorado: ${mentoradoError.message}`)
      }

      console.log('Mentorado criado com sucesso')
    }

    // Se for navegador, criar entrada na tabela navegadores
    if (requestData.role === 'navegador') {
      const { error: navegadorError } = await supabaseAdmin
        .from('navegadores')
        .insert({
          user_id: newUser.user.id,
          email: requestData.email,
          ativo: true,
        })

      if (navegadorError) {
        console.error('Erro ao criar navegador:', navegadorError)
        throw new Error(`Erro ao criar navegador: ${navegadorError.message}`)
      }

      console.log('Navegador criado com sucesso')
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUser.user.id,
        email: newUser.user.email,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro na função:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar usuário'
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
