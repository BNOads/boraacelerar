-- Recriar a função handle_new_user com melhor tratamento de erros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_nome_completo text;
BEGIN
  -- Log para debug
  RAISE LOG 'Trigger handle_new_user iniciado para user_id: %', NEW.id;
  
  -- Extrair nome_completo, usando email como fallback
  v_nome_completo := COALESCE(
    NEW.raw_user_meta_data->>'nome_completo',
    NEW.email,
    'Usuário'
  );
  
  RAISE LOG 'Tentando inserir perfil com nome: %', v_nome_completo;
  
  -- Inserir perfil
  INSERT INTO public.profiles (id, nome_completo, apelido, foto_url)
  VALUES (
    NEW.id,
    v_nome_completo,
    NEW.raw_user_meta_data->>'apelido',
    NEW.raw_user_meta_data->>'foto_url'
  );
  
  RAISE LOG 'Perfil criado com sucesso para user_id: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha o trigger
    RAISE WARNING 'Erro ao criar perfil para user_id %: %', NEW.id, SQLERRM;
    -- Retorna NEW mesmo com erro para não bloquear a criação do usuário
    RETURN NEW;
END;
$$;