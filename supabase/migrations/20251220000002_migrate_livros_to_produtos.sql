-- Migrar dados de livros_recomendados para produtos
INSERT INTO public.produtos (nome, descricao, imagem_url, categoria, url_compra, ativo, created_at, updated_at)
SELECT
  titulo as nome,
  descricao_curta as descricao,
  capa_url as imagem_url,
  'livros'::categoria_produto as categoria,
  url_compra,
  true as ativo,
  created_at,
  now() as updated_at
FROM public.livros_recomendados
WHERE NOT EXISTS (
  SELECT 1 FROM public.produtos p
  WHERE p.nome = livros_recomendados.titulo
  AND p.categoria = 'livros'
);

-- Nota: Não vamos deletar a tabela livros_recomendados imediatamente
-- para manter histórico, mas ela não será mais usada no frontend
