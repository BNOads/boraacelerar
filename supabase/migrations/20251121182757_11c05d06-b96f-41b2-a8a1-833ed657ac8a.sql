-- Adicionar campo de avaliação aos atendimentos existentes
ALTER TABLE atendimentos_navegador
  ADD COLUMN avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  ADD COLUMN comentario_avaliacao TEXT;

-- Criar tabela para solicitações de agendamento
CREATE TABLE solicitacoes_agendamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES mentorados(id) ON DELETE CASCADE,
  navegador_id UUID NOT NULL REFERENCES navegadores(id) ON DELETE CASCADE,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  tipo_atendimento TEXT NOT NULL,
  canal canal_atendimento NOT NULL,
  assunto TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'concluido')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE solicitacoes_agendamento ENABLE ROW LEVEL SECURITY;

-- Políticas para solicitações de agendamento
CREATE POLICY "Mentorados view own solicitacoes"
  ON solicitacoes_agendamento
  FOR SELECT
  USING (
    mentorado_id = get_mentorado_id(auth.uid()) OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'navegador')
  );

CREATE POLICY "Mentorados create solicitacoes"
  ON solicitacoes_agendamento
  FOR INSERT
  WITH CHECK (mentorado_id = get_mentorado_id(auth.uid()));

CREATE POLICY "Admins and Navegadores manage solicitacoes"
  ON solicitacoes_agendamento
  FOR ALL
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'navegador')
  );

-- Trigger para updated_at
CREATE TRIGGER update_solicitacoes_agendamento_updated_at
  BEFORE UPDATE ON solicitacoes_agendamento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();