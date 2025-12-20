-- Adicionar campo url_compra à tabela produtos
ALTER TABLE public.produtos
ADD COLUMN url_compra TEXT;

COMMENT ON COLUMN public.produtos.url_compra IS 'URL para compra do produto (link externo)';
