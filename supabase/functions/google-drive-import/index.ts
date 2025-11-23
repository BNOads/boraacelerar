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

async function listDriveFolderFiles(folderId: string, accessToken: string) {
  const query = `'${folderId}' in parents and trashed = false`;
  const fields = 'files(id,name,mimeType,size,createdTime,webViewLink,thumbnailLink)';
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${fields}&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Drive API error:', response.status, errorText);
    throw new Error(`Google Drive API error (${response.status})`);
  }

  const data = await response.json();
  const files = data.files || [];

  if (!Array.isArray(files)) {
    throw new Error('Invalid response from Google Drive API');
  }

  return files;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, fileId, mentoradoId, encontroId } = await req.json();
    
    const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');
    const folderId = Deno.env.get('GOOGLE_DRIVE_FOLDER_ID');
    const encontrosFolderId = Deno.env.get('GOOGLE_DRIVE_ENCONTROS_FOLDER_ID');

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
      const files = await listDriveFolderFiles(folderId!, access_token);

      return new Response(JSON.stringify({ files }), {
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

       const files = await listDriveFolderFiles(folderId!, access_token);

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
         `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,webViewLink,thumbnailLink&supportsAllDrives=true&includeItemsFromAllDrives=true`,
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

    if (action === 'list-encontros') {
      const files = await listDriveFolderFiles(encontrosFolderId!, access_token);

      return new Response(JSON.stringify({ files }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auto-import encontros
    if (action === 'auto-import-encontros') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

       const files = await listDriveFolderFiles(encontrosFolderId!, access_token);

      const results = { 
        imported: [] as string[], 
        skipped: [] as string[], 
        errors: [] as string[] 
      };

      // Process each file
      for (const file of files) {
        try {
          // Check if already imported
          const { data: existing } = await supabase
            .from('gravacoes_encontros')
            .select('id')
            .eq('url_video', file.webViewLink)
            .maybeSingle();

          if (existing) {
            results.skipped.push(file.name);
            continue;
          }

          // Create encontro
          const { data: encontro, error: encontroError } = await supabase
            .from('encontros')
            .insert({
              titulo: file.name.replace(/\.[^/.]+$/, ''),
              data_hora: file.createdTime,
              tipo: 'Mentoria Livre',
              descricao: 'Importado automaticamente do Google Drive'
            })
            .select()
            .single();

          if (encontroError || !encontro) {
            results.errors.push(`Erro ao criar encontro para ${file.name}: ${encontroError?.message}`);
            continue;
          }

          // Insert gravacao
          const { error: gravacaoError } = await supabase
            .from('gravacoes_encontros')
            .insert({
              encontro_id: encontro.id,
              titulo: file.name.replace(/\.[^/.]+$/, ''),
              url_video: file.webViewLink,
              thumbnail_url: file.thumbnailLink,
              data_publicacao: file.createdTime,
              ativo: true,
            });

          if (gravacaoError) {
            results.errors.push(`Erro ao importar gravação ${file.name}: ${gravacaoError.message}`);
          } else {
            results.imported.push(file.name);
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

    // Import specific encontro
    if (action === 'import-encontro' && fileId && encontroId) {
       const fileResponse = await fetch(
         `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,createdTime,webViewLink,thumbnailLink&supportsAllDrives=true&includeItemsFromAllDrives=true`,
         {
           headers: { 'Authorization': `Bearer ${access_token}` },
         }
       );

      const file = await fileResponse.json();

      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('gravacoes_encontros')
        .insert({
          encontro_id: encontroId,
          titulo: file.name.replace(/\.[^/.]+$/, ''),
          url_video: file.webViewLink,
          thumbnail_url: file.thumbnailLink,
          data_publicacao: file.createdTime,
          ativo: true,
        })
        .select()
        .single();

      if (error) {
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
