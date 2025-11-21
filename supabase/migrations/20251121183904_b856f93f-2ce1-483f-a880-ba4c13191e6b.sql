-- Criar tabela de notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'informacao' CHECK (type IN ('informacao', 'alerta', 'prioridade')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'alta')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  visible_to TEXT NOT NULL DEFAULT 'all',
  read_by UUID[] DEFAULT ARRAY[]::UUID[],
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Habilitar RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Admins manage notifications"
  ON notifications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view active notifications"
  ON notifications
  FOR SELECT
  USING (is_active = true AND visible_to = 'all');

-- Índices para performance
CREATE INDEX idx_notifications_is_active ON notifications(is_active);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read_by ON notifications USING GIN(read_by);