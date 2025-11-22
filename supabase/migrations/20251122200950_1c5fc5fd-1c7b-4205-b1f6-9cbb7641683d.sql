-- Criar tabela para links do Posto Ipiranga
CREATE TABLE public.posto_ipiranga_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL CHECK (categoria IN ('Empreededorismo', 'Gestão', 'Projetos', 'Obras')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  url TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.posto_ipiranga_links ENABLE ROW LEVEL SECURITY;

-- Admins manage links
CREATE POLICY "Admins manage posto ipiranga links"
ON public.posto_ipiranga_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users view active links
CREATE POLICY "Auth users view active posto ipiranga links"
ON public.posto_ipiranga_links
FOR SELECT
USING (ativo = true);

-- Trigger para updated_at
CREATE TRIGGER update_posto_ipiranga_links_updated_at
BEFORE UPDATE ON public.posto_ipiranga_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();