-- Adicionar campos de recorrência à tabela agenda_mentoria
ALTER TABLE public.agenda_mentoria
ADD COLUMN recorrencia TEXT CHECK (recorrencia IN ('nenhuma', 'semanal', 'quinzenal', 'mensal')),
ADD COLUMN data_fim_recorrencia DATE,
ADD COLUMN evento_pai_id UUID REFERENCES public.agenda_mentoria(id) ON DELETE CASCADE;

-- Definir valor padrão para registros existentes
UPDATE public.agenda_mentoria
SET recorrencia = 'nenhuma'
WHERE recorrencia IS NULL;

-- Tornar campo recorrencia NOT NULL após definir valores padrão
ALTER TABLE public.agenda_mentoria
ALTER COLUMN recorrencia SET DEFAULT 'nenhuma',
ALTER COLUMN recorrencia SET NOT NULL;

-- Criar índice para melhorar performance de consultas
CREATE INDEX idx_agenda_mentoria_evento_pai ON public.agenda_mentoria(evento_pai_id);
CREATE INDEX idx_agenda_mentoria_data_hora ON public.agenda_mentoria(data_hora);