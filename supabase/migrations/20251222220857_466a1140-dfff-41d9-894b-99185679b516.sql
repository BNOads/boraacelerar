-- Trilhas personalizadas para mentorados
CREATE TABLE public.trilhas_mentorado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES mentorados(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prazo DATE,
  prioridade TEXT DEFAULT 'normal', -- 'urgente', 'normal', 'baixa'
  status TEXT DEFAULT 'em_andamento', -- 'em_andamento', 'concluida', 'pausada'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);

-- Itens da trilha (tarefas, documentos, aulas, cursos, links)
CREATE TABLE public.itens_trilha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id UUID NOT NULL REFERENCES trilhas_mentorado(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'tarefa', 'documento', 'aula', 'curso', 'link_externo'
  titulo TEXT NOT NULL,
  descricao TEXT,
  url TEXT,
  duracao_min INTEGER,
  ordem INTEGER DEFAULT 0,
  concluido BOOLEAN DEFAULT false,
  concluido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trilhas_mentorado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_trilha ENABLE ROW LEVEL SECURITY;

-- Policies para trilhas_mentorado
CREATE POLICY "Admins manage all trilhas" 
ON public.trilhas_mentorado FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Navegadores view trilhas" 
ON public.trilhas_mentorado FOR SELECT 
USING (has_role(auth.uid(), 'navegador'));

CREATE POLICY "Mentorados view own trilhas" 
ON public.trilhas_mentorado FOR SELECT 
USING (mentorado_id = get_mentorado_id(auth.uid()));

-- Policies para itens_trilha
CREATE POLICY "Admins manage all itens" 
ON public.itens_trilha FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Navegadores view itens" 
ON public.itens_trilha FOR SELECT 
USING (has_role(auth.uid(), 'navegador'));

CREATE POLICY "Mentorados view own itens" 
ON public.itens_trilha FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM trilhas_mentorado t 
  WHERE t.id = itens_trilha.trilha_id 
  AND t.mentorado_id = get_mentorado_id(auth.uid())
));

CREATE POLICY "Mentorados update own itens completion" 
ON public.itens_trilha FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM trilhas_mentorado t 
  WHERE t.id = itens_trilha.trilha_id 
  AND t.mentorado_id = get_mentorado_id(auth.uid())
));

-- Trigger para updated_at
CREATE TRIGGER update_trilhas_mentorado_updated_at
BEFORE UPDATE ON public.trilhas_mentorado
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();