-- Criar enum para pilares de avaliação
CREATE TYPE public.pilar_avaliacao AS ENUM (
  'eu_empreendedor',
  'estruturacao_empresa',
  'processos',
  'posicionamento',
  'marketing',
  'vendas',
  'construcao_equipe',
  'gestao_equipe',
  'experiencia_cliente'
);

-- Criar enum para status de metas
CREATE TYPE public.status_meta AS ENUM (
  'ativa',
  'concluida',
  'arquivada'
);

-- Criar enum para status de objetivos
CREATE TYPE public.status_objetivo AS ENUM (
  'pendente',
  'em_progresso',
  'concluido'
);

-- Criar tabela de avaliações dos pilares
CREATE TABLE public.avaliacoes_pilares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  trimestre TEXT NOT NULL,
  pilar public.pilar_avaliacao NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 0 AND nota <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mentorado_id, trimestre, pilar)
);

-- Criar tabela de metas (OKRs)
CREATE TABLE public.metas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  progresso INTEGER NOT NULL DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  cor TEXT NOT NULL DEFAULT '#3b82f6',
  status public.status_meta NOT NULL DEFAULT 'ativa',
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de objetivos
CREATE TABLE public.objetivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_id UUID NOT NULL REFERENCES public.metas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('boolean', 'numerico')),
  status public.status_objetivo NOT NULL DEFAULT 'pendente',
  valor_atual NUMERIC,
  valor_meta NUMERIC,
  unidade TEXT,
  concluido BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS em todas as tabelas
ALTER TABLE public.avaliacoes_pilares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objetivos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para avaliacoes_pilares
CREATE POLICY "Mentorados view own avaliacoes"
ON public.avaliacoes_pilares
FOR SELECT
TO authenticated
USING (
  mentorado_id = get_mentorado_id(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'navegador'::app_role)
);

CREATE POLICY "Mentorados insert own avaliacoes"
ON public.avaliacoes_pilares
FOR INSERT
TO authenticated
WITH CHECK (mentorado_id = get_mentorado_id(auth.uid()));

CREATE POLICY "Mentorados update own avaliacoes"
ON public.avaliacoes_pilares
FOR UPDATE
TO authenticated
USING (mentorado_id = get_mentorado_id(auth.uid()));

CREATE POLICY "Admins manage all avaliacoes"
ON public.avaliacoes_pilares
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para metas
CREATE POLICY "Mentorados view own metas"
ON public.metas
FOR SELECT
TO authenticated
USING (
  mentorado_id = get_mentorado_id(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'navegador'::app_role)
);

CREATE POLICY "Mentorados insert own metas"
ON public.metas
FOR INSERT
TO authenticated
WITH CHECK (mentorado_id = get_mentorado_id(auth.uid()));

CREATE POLICY "Mentorados update own metas"
ON public.metas
FOR UPDATE
TO authenticated
USING (mentorado_id = get_mentorado_id(auth.uid()));

CREATE POLICY "Admins manage all metas"
ON public.metas
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas RLS para objetivos
CREATE POLICY "Mentorados view own objetivos"
ON public.objetivos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.metas 
    WHERE metas.id = objetivos.meta_id 
    AND (
      metas.mentorado_id = get_mentorado_id(auth.uid())
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'navegador'::app_role)
    )
  )
);

CREATE POLICY "Mentorados insert own objetivos"
ON public.objetivos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.metas 
    WHERE metas.id = objetivos.meta_id 
    AND metas.mentorado_id = get_mentorado_id(auth.uid())
  )
);

CREATE POLICY "Mentorados update own objetivos"
ON public.objetivos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.metas 
    WHERE metas.id = objetivos.meta_id 
    AND metas.mentorado_id = get_mentorado_id(auth.uid())
  )
);

CREATE POLICY "Admins manage all objetivos"
ON public.objetivos
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Função para recalcular progresso da meta
CREATE OR REPLACE FUNCTION public.recalcular_progresso_meta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_objetivos INTEGER;
  objetivos_concluidos INTEGER;
  novo_progresso INTEGER;
BEGIN
  -- Contar total de objetivos da meta
  SELECT COUNT(*) INTO total_objetivos
  FROM public.objetivos
  WHERE meta_id = COALESCE(NEW.meta_id, OLD.meta_id);
  
  -- Contar objetivos concluídos
  SELECT COUNT(*) INTO objetivos_concluidos
  FROM public.objetivos
  WHERE meta_id = COALESCE(NEW.meta_id, OLD.meta_id)
  AND (
    (tipo = 'boolean' AND concluido = true) OR
    (tipo = 'numerico' AND valor_atual >= valor_meta)
  );
  
  -- Calcular progresso
  IF total_objetivos > 0 THEN
    novo_progresso := ROUND((objetivos_concluidos::NUMERIC / total_objetivos::NUMERIC) * 100);
  ELSE
    novo_progresso := 0;
  END IF;
  
  -- Atualizar meta
  UPDATE public.metas
  SET progresso = novo_progresso,
      updated_at = now()
  WHERE id = COALESCE(NEW.meta_id, OLD.meta_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger para recalcular progresso ao inserir, atualizar ou deletar objetivo
CREATE TRIGGER trigger_recalcular_progresso_insert
AFTER INSERT ON public.objetivos
FOR EACH ROW
EXECUTE FUNCTION public.recalcular_progresso_meta();

CREATE TRIGGER trigger_recalcular_progresso_update
AFTER UPDATE ON public.objetivos
FOR EACH ROW
EXECUTE FUNCTION public.recalcular_progresso_meta();

CREATE TRIGGER trigger_recalcular_progresso_delete
AFTER DELETE ON public.objetivos
FOR EACH ROW
EXECUTE FUNCTION public.recalcular_progresso_meta();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_avaliacoes_pilares_updated_at
BEFORE UPDATE ON public.avaliacoes_pilares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metas_updated_at
BEFORE UPDATE ON public.metas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_objetivos_updated_at
BEFORE UPDATE ON public.objetivos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();