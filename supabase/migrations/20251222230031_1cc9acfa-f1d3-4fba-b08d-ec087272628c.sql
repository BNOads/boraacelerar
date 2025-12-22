-- Create diario_bordo table
CREATE TABLE public.diario_bordo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  lancamento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diario_bordo ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage diario_bordo"
ON public.diario_bordo
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Navegadores can view
CREATE POLICY "Navegadores view diario_bordo"
ON public.diario_bordo
FOR SELECT
USING (public.has_role(auth.uid(), 'navegador'));

-- Create trigger for updated_at
CREATE TRIGGER update_diario_bordo_updated_at
BEFORE UPDATE ON public.diario_bordo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();