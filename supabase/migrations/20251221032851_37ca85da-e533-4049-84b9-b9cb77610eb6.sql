-- Create marketing_metrics table
CREATE TABLE IF NOT EXISTS public.marketing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES public.mentorados(id) ON DELETE CASCADE,
  mes_ano VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  leads_totais INTEGER NOT NULL DEFAULT 0,
  leads_qualificados INTEGER NOT NULL DEFAULT 0,
  investimento_marketing DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  -- Constraint: each mentorado can have only one record per month
  UNIQUE(mentorado_id, mes_ano)
);

-- Create indexes for faster queries
CREATE INDEX idx_marketing_metrics_mentorado_id ON public.marketing_metrics(mentorado_id);
CREATE INDEX idx_marketing_metrics_mes_ano ON public.marketing_metrics(mes_ano);

-- Enable RLS
ALTER TABLE public.marketing_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Admins manage all marketing metrics
CREATE POLICY "Admins manage all marketing_metrics"
ON public.marketing_metrics FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Mentorados view own metrics
CREATE POLICY "Mentorados view own marketing_metrics"
ON public.marketing_metrics FOR SELECT
USING (
  mentorado_id = get_mentorado_id(auth.uid()) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'navegador'::app_role)
);

-- Policy: Mentorados insert own metrics
CREATE POLICY "Mentorados insert own marketing_metrics"
ON public.marketing_metrics FOR INSERT
WITH CHECK (mentorado_id = get_mentorado_id(auth.uid()));

-- Policy: Mentorados update own metrics
CREATE POLICY "Mentorados update own marketing_metrics"
ON public.marketing_metrics FOR UPDATE
USING (mentorado_id = get_mentorado_id(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_marketing_metrics_updated_at
BEFORE UPDATE ON public.marketing_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();