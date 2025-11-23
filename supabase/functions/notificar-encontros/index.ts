import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0'
import { format, addDays, startOfDay, endOfDay } from 'https://esm.sh/date-fns@3.6.0'
import { ptBR } from 'https://esm.sh/date-fns@3.6.0/locale'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = startOfDay(new Date())
    const tomorrow = addDays(today, 1)

    // Buscar encontros de hoje
    const { data: encontrosHoje, error: errorHoje } = await supabaseClient
      .from('agenda_mentoria')
      .select('*')
      .gte('data_hora', today.toISOString())
      .lt('data_hora', endOfDay(today).toISOString())

    if (errorHoje) throw errorHoje

    // Buscar encontros de amanhã
    const { data: encontrosAmanha, error: errorAmanha } = await supabaseClient
      .from('agenda_mentoria')
      .select('*')
      .gte('data_hora', tomorrow.toISOString())
      .lt('data_hora', endOfDay(tomorrow).toISOString())

    if (errorAmanha) throw errorAmanha

    const notificacoesCriadas = []

    // Criar notificações para encontros de hoje
    if (encontrosHoje && encontrosHoje.length > 0) {
      for (const encontro of encontrosHoje) {
        // Verificar se já existe notificação para este encontro hoje
        const { data: existente } = await supabaseClient
          .from('notifications')
          .select('id')
          .eq('title', `🚀 Encontro HOJE: ${encontro.titulo}`)
          .gte('created_at', today.toISOString())
          .single()

        if (!existente) {
          const horario = format(new Date(encontro.data_hora), "HH:mm", { locale: ptBR })
          
          const { data: adminUser } = await supabaseClient
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin')
            .limit(1)
            .single()

          const { error: insertError } = await supabaseClient
            .from('notifications')
            .insert({
              title: `🚀 Encontro HOJE: ${encontro.titulo}`,
              message: `O encontro "${encontro.titulo}" (${encontro.tipo}) acontece hoje às ${horario}. Não perca!`,
              type: 'urgente',
              priority: 'alta',
              visible_to: 'all',
              is_active: true,
              created_by: adminUser?.user_id || '00000000-0000-0000-0000-000000000000'
            })

          if (!insertError) {
            notificacoesCriadas.push(`hoje: ${encontro.titulo}`)
          }
        }
      }
    }

    // Criar notificações para encontros de amanhã
    if (encontrosAmanha && encontrosAmanha.length > 0) {
      for (const encontro of encontrosAmanha) {
        // Verificar se já existe notificação para este encontro amanhã
        const { data: existente } = await supabaseClient
          .from('notifications')
          .select('id')
          .eq('title', `📅 Lembrete: ${encontro.titulo} amanhã`)
          .gte('created_at', today.toISOString())
          .single()

        if (!existente) {
          const horario = format(new Date(encontro.data_hora), "HH:mm", { locale: ptBR })
          const data = format(tomorrow, "dd 'de' MMMM", { locale: ptBR })
          
          const { data: adminUser } = await supabaseClient
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin')
            .limit(1)
            .single()

          const { error: insertError } = await supabaseClient
            .from('notifications')
            .insert({
              title: `📅 Lembrete: ${encontro.titulo} amanhã`,
              message: `O encontro "${encontro.titulo}" (${encontro.tipo}) acontece amanhã, ${data}, às ${horario}. Prepare-se!`,
              type: 'aviso',
              priority: 'normal',
              visible_to: 'all',
              is_active: true,
              created_by: adminUser?.user_id || '00000000-0000-0000-0000-000000000000'
            })

          if (!insertError) {
            notificacoesCriadas.push(`amanhã: ${encontro.titulo}`)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        encontrosHoje: encontrosHoje?.length || 0,
        encontrosAmanha: encontrosAmanha?.length || 0,
        notificacoesCriadas: notificacoesCriadas.length,
        detalhes: notificacoesCriadas
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
