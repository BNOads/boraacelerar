-- Adicionar coluna seguidores_linkedin à tabela metricas_mensais
ALTER TABLE public.metricas_mensais
ADD COLUMN seguidores_linkedin INTEGER DEFAULT 0;
