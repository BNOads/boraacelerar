-- Atualizar policy para permitir usuários verem notificações direcionadas a eles
DROP POLICY IF EXISTS "Users view active notifications" ON public.notifications;
CREATE POLICY "Users view active notifications" 
ON public.notifications 
FOR SELECT 
USING (
  (is_active = true) AND 
  (visible_to = 'all' OR visible_to = auth.uid()::text)
);

-- Atualizar função para direcionar notificação ao mentorado
CREATE OR REPLACE FUNCTION public.notificar_nova_trilha()
RETURNS TRIGGER AS $$
DECLARE
  v_mentorado_user_id uuid;
  v_admin_id uuid;
BEGIN
  -- Buscar user_id do mentorado
  SELECT user_id INTO v_mentorado_user_id
  FROM public.mentorados
  WHERE id = NEW.mentorado_id;

  -- Buscar um admin para ser o criador da notificação
  SELECT user_id INTO v_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- Criar notificação para o mentorado específico
  IF v_admin_id IS NOT NULL AND v_mentorado_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      title,
      message,
      type,
      priority,
      created_by,
      visible_to,
      is_active
    ) VALUES (
      'Nova Trilha Disponível!',
      'Você recebeu uma nova trilha de aprendizado: "' || NEW.titulo || '". Acesse a aba Trilha para visualizar e começar seu progresso.',
      'informacao',
      CASE WHEN NEW.prioridade = 'urgente' THEN 'alta' ELSE 'normal' END,
      v_admin_id,
      v_mentorado_user_id::text,
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atualizar função para itens de trilha
CREATE OR REPLACE FUNCTION public.notificar_novo_item_trilha()
RETURNS TRIGGER AS $$
DECLARE
  v_trilha_titulo text;
  v_mentorado_user_id uuid;
  v_admin_id uuid;
BEGIN
  -- Buscar informações da trilha e user_id do mentorado
  SELECT t.titulo, m.user_id INTO v_trilha_titulo, v_mentorado_user_id
  FROM public.trilhas_mentorado t
  JOIN public.mentorados m ON m.id = t.mentorado_id
  WHERE t.id = NEW.trilha_id;

  -- Buscar um admin para ser o criador da notificação
  SELECT user_id INTO v_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- Criar notificação para o mentorado específico
  IF v_admin_id IS NOT NULL AND v_mentorado_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      title,
      message,
      type,
      priority,
      created_by,
      visible_to,
      is_active
    ) VALUES (
      'Novo Conteúdo Adicionado',
      'Um novo item foi adicionado à sua trilha "' || v_trilha_titulo || '": ' || NEW.titulo,
      'informacao',
      'normal',
      v_admin_id,
      v_mentorado_user_id::text,
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;