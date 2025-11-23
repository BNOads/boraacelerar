import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function findMentoradoByFileName(fileName: string, mentorados: any[]): string | null {
  const normalizedFileName = normalizeName(fileName);
  
  for (const mentorado of mentorados) {
    const nomeCompleto = mentorado.profiles?.nome_completo || "";
    const apelido = mentorado.profiles?.apelido || "";
    
    const normalizedNome = normalizeName(nomeCompleto);
    const normalizedApelido = normalizeName(apelido);
    
    if (normalizedFileName.includes(normalizedNome) || 
        normalizedFileName.includes(normalizedApelido) ||
        (normalizedNome && normalizedFileName.includes(normalizedNome)) ||
        (normalizedApelido && normalizedFileName.includes(normalizedApelido))) {
      return mentorado.id;
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, fileId, mentoradoId, autoImport } = await req.json();
    
    const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');
    const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        refresh_token: refreshToken!,
        grant_type: 'refresh_token',
      }),
    });

    const { access_token } = await tokenResponse.json();

    if (action === 'list') {
      // List files in the folder
      const filesResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'video'&fields=files(id,name,mimeType,size,createdTime,webViewLink,thumbnailLink)`,
        {
          headers: { 'Authorization': `Bearer ${access_token}` },
        }
      );

      const files = await filesResponse.json();
      return new Response(JSON.stringify(files), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'auto-import') {
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Get all mentorados
      const { data: mentorados, error: mentoradosError } = await supabase
        .from('mentorados')
        .select('id, user_id, profiles(nome_completo, apelido)')
        .eq('status', 'ativo');

      if (mentoradosError) throw mentoradosError;

      // List all files
      const filesResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType+contains+'video'&fields=files(id,name,mimeType,size,createdTime,webViewLink,thumbnailLink)`,
        {
          headers: { 'Authorization': `Bearer ${access_token}` },
        }
      );

      const { files } = await filesResponse.json();
      const results: { imported: number; skipped: number; errors: string[] } = { 
        imported: 0, 
        skipped: 0, 
        errors: [] 
      };

      // Process each file
      for (const file of files) {
        try {
          // Check if already imported
          const { data: existing } = await supabase
            .from('gravacoes_individuais')
            .select('id')
            .eq('titulo', file.name)
            .maybeSingle();

          if (existing) {
            results.skipped++;
            continue;
          }

          // Find mentorado by file name
          const mentoradoId = findMentoradoByFileName(file.name, mentorados);

          if (!mentoradoId) {
            results.errors.push(`Mentorado não encontrado para: ${file.name}`);
            continue;
          }

          // Import file
          const { error: insertError } = await supabase
            .from('gravacoes_individuais')
            .insert({
              mentorado_id: mentoradoId,
              titulo: file.name,
              url_video: file.webViewLink,
              thumbnail_url: file.thumbnailLink,
              data_gravacao: file.createdTime.split('T')[0],
              ativo: true,
            });

          if (insertError) {
            results.errors.push(`Erro ao importar ${file.name}: ${insertError.message}`);
          } else {
            results.imported++;
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push(`Erro processando ${file.name}: ${errorMessage}`);
        }
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'import' && fileId && mentoradoId) {
      // Get file details
      const fileResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,webViewLink,thumbnailLink`,
        {
          headers: { 'Authorization': `Bearer ${access_token}` },
        }
      );

      const file = await fileResponse.json();

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Insert into gravacoes_individuais
      const { data, error } = await supabase
        .from('gravacoes_individuais')
        .insert({
          mentorado_id: mentoradoId,
          titulo: file.name,
          url_video: file.webViewLink,
          thumbnail_url: file.thumbnailLink,
          data_gravacao: file.createdTime.split('T')[0],
          ativo: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error importing recording:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-drive-import:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
