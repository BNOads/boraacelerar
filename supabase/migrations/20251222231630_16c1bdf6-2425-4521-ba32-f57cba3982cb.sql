-- Adicionar campo resumo_url para link de resumo das sessões individuais
ALTER TABLE public.gravacoes_individuais 
ADD COLUMN IF NOT EXISTS resumo_url text;