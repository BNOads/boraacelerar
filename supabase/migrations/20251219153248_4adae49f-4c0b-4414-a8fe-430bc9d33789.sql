-- Add seguidores_linkedin column to metricas_mensais table
ALTER TABLE public.metricas_mensais 
ADD COLUMN seguidores_linkedin integer DEFAULT 0;