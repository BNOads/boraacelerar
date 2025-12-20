-- Enum para categorias de produtos
CREATE TYPE public.categoria_produto AS ENUM (
  'livros',
  'vestuario',
  'acessorios',
  'canecas'
);

-- Tabela de produtos
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  categoria public.categoria_produto NOT NULL,
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ativar RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- Policy: usuários autenticados veem produtos ativos
CREATE POLICY "Auth users view active produtos"
ON public.produtos FOR SELECT TO authenticated
USING (ativo = true);

-- Policy: admins veem todos os produtos
CREATE POLICY "Admins view all produtos"
ON public.produtos FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: admins podem inserir
CREATE POLICY "Admins insert produtos"
ON public.produtos FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: admins podem atualizar
CREATE POLICY "Admins update produtos"
ON public.produtos FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: admins podem deletar
CREATE POLICY "Admins delete produtos"
ON public.produtos FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();