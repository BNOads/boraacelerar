-- Função para criar notificação quando uma trilha é criada para um mentorado
CREATE OR REPLACE FUNCTION public.notificar_nova_trilha()
RETURNS TRIGGER AS $$
DECLARE
  v_mentorado_nome text;
  v_admin_id uuid;
BEGIN
  -- Buscar nome do mentorado
  SELECT p.nome_completo INTO v_mentorado_nome
  FROM public.mentorados m
  JOIN public.profiles p ON p.id = m.user_id
  WHERE m.id = NEW.mentorado_id;

  -- Buscar um admin para ser o criador da notificação
  SELECT user_id INTO v_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- Criar notificação para o mentorado
  IF v_admin_id IS NOT NULL THEN
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
      'trilha',
      CASE WHEN NEW.prioridade = 'urgente' THEN 'alta' ELSE 'normal' END,
      v_admin_id,
      'all',
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para notificar quando nova trilha é criada
DROP TRIGGER IF EXISTS trigger_notificar_nova_trilha ON public.trilhas_mentorado;
CREATE TRIGGER trigger_notificar_nova_trilha
  AFTER INSERT ON public.trilhas_mentorado
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_nova_trilha();

-- Função para notificar quando um novo item é adicionado a uma trilha
CREATE OR REPLACE FUNCTION public.notificar_novo_item_trilha()
RETURNS TRIGGER AS $$
DECLARE
  v_trilha_titulo text;
  v_mentorado_id uuid;
  v_admin_id uuid;
BEGIN
  -- Buscar informações da trilha
  SELECT titulo, mentorado_id INTO v_trilha_titulo, v_mentorado_id
  FROM public.trilhas_mentorado
  WHERE id = NEW.trilha_id;

  -- Buscar um admin para ser o criador da notificação
  SELECT user_id INTO v_admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- Criar notificação para o mentorado
  IF v_admin_id IS NOT NULL AND v_mentorado_id IS NOT NULL THEN
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
      'conteudo',
      'normal',
      v_admin_id,
      'all',
      true
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para notificar quando novo item é adicionado
DROP TRIGGER IF EXISTS trigger_notificar_novo_item_trilha ON public.itens_trilha;
CREATE TRIGGER trigger_notificar_novo_item_trilha
  AFTER INSERT ON public.itens_trilha
  FOR EACH ROW
  EXECUTE FUNCTION public.notificar_novo_item_trilha();