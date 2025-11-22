-- Criar tabela para métricas mensais
CREATE TABLE public.metricas_mensais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  mes_ano TEXT NOT NULL,
  qtd_colaboradores INTEGER DEFAULT 0,
  seguidores_instagram INTEGER DEFAULT 0,
  seguidores_youtube INTEGER DEFAULT 0,
  seguidores_tiktok INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(mentorado_id, mes_ano)
);

-- Enable RLS
ALTER TABLE public.metricas_mensais ENABLE ROW LEVEL SECURITY;

-- Mentorados podem visualizar apenas suas próprias métricas
CREATE POLICY "Mentorados view own metricas"
ON public.metricas_mensais
FOR SELECT
TO authenticated
USING (
  mentorado_id = get_mentorado_id(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'navegador'::app_role)
);

-- Mentorados podem inserir suas próprias métricas
CREATE POLICY "Mentorados insert own metricas"
ON public.metricas_mensais
FOR INSERT
TO authenticated
WITH CHECK (mentorado_id = get_mentorado_id(auth.uid()));

-- Mentorados podem atualizar suas próprias métricas
CREATE POLICY "Mentorados update own metricas"
ON public.metricas_mensais
FOR UPDATE
TO authenticated
USING (mentorado_id = get_mentorado_id(auth.uid()));

-- Admins podem gerenciar todas as métricas
CREATE POLICY "Admins manage all metricas"
ON public.metricas_mensais
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_metricas_mensais_updated_at
BEFORE UPDATE ON public.metricas_mensais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();