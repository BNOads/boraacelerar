-- Create marketing_metrics table
CREATE TABLE IF NOT EXISTS marketing_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorado_id UUID NOT NULL REFERENCES mentorados(id) ON DELETE CASCADE,
  mes_ano VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  leads_totais INTEGER NOT NULL DEFAULT 0,
  leads_qualificados INTEGER NOT NULL DEFAULT 0,
  investimento_marketing DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Constraint: each mentorado can have only one record per month
  UNIQUE(mentorado_id, mes_ano)
);

-- Create index for faster queries
CREATE INDEX idx_marketing_metrics_mentorado_id ON marketing_metrics(mentorado_id);
CREATE INDEX idx_marketing_metrics_mes_ano ON marketing_metrics(mes_ano);
