-- Adicionar constraint única para evitar duplicatas de desempenho mensal
-- Isso permite upsert (INSERT ... ON CONFLICT) funcionar corretamente
ALTER TABLE public.desempenho_mensal 
ADD CONSTRAINT desempenho_mensal_mentorado_mes_unique 
UNIQUE (mentorado_id, mes_ano);