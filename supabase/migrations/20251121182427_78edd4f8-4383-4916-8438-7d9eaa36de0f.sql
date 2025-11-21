-- Tornar user_id opcional e adicionar campos para navegadores externos
ALTER TABLE navegadores 
  ALTER COLUMN user_id DROP NOT NULL;

-- Adicionar campos de nome e foto para navegadores externos
ALTER TABLE navegadores 
  ADD COLUMN nome TEXT,
  ADD COLUMN foto_url TEXT;

-- Adicionar constraint para garantir que ou user_id existe ou nome existe
ALTER TABLE navegadores
  ADD CONSTRAINT navegadores_user_or_name_required 
  CHECK (
    (user_id IS NOT NULL) OR 
    (nome IS NOT NULL)
  );