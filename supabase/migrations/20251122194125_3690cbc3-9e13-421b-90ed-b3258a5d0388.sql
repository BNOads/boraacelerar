-- Criar políticas de storage para o bucket avatars permitindo admins fazerem upload

-- Admins podem fazer upload de qualquer arquivo no bucket avatars
CREATE POLICY "Admins can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (
    -- Admins podem fazer upload de qualquer coisa
    public.has_role(auth.uid(), 'admin'::app_role)
    OR
    -- Usuários podem fazer upload apenas nas suas próprias pastas
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Admins podem atualizar qualquer arquivo, usuários apenas os seus
CREATE POLICY "Admins can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Admins podem deletar qualquer arquivo, usuários apenas os seus
CREATE POLICY "Admins can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);