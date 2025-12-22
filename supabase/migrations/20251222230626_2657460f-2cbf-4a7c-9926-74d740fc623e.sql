-- Create storage bucket for diary attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('diario-anexos', 'diario-anexos', true);

-- Storage policies for diary attachments
CREATE POLICY "Admins can upload diary attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'diario-anexos' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update diary attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'diario-anexos' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete diary attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'diario-anexos' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Anyone can view diary attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'diario-anexos');

-- Add attachments column to diario_bordo
ALTER TABLE public.diario_bordo
ADD COLUMN anexos TEXT[] DEFAULT '{}';

-- Create table for replies
CREATE TABLE public.diario_bordo_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrada_id UUID NOT NULL REFERENCES public.diario_bordo(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diario_bordo_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage respostas"
ON public.diario_bordo_respostas
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Navegadores view respostas"
ON public.diario_bordo_respostas
FOR SELECT
USING (public.has_role(auth.uid(), 'navegador'));

CREATE TRIGGER update_diario_bordo_respostas_updated_at
BEFORE UPDATE ON public.diario_bordo_respostas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for reactions
CREATE TABLE public.diario_bordo_reacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrada_id UUID NOT NULL REFERENCES public.diario_bordo(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entrada_id, autor_id, emoji)
);

ALTER TABLE public.diario_bordo_reacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage reacoes"
ON public.diario_bordo_reacoes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Navegadores view reacoes"
ON public.diario_bordo_reacoes
FOR SELECT
USING (public.has_role(auth.uid(), 'navegador'));