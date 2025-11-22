-- Permitir visualização pública de perfis de mentorados
CREATE POLICY "Public view mentorado profiles"
ON public.mentorados
FOR SELECT
USING (status = 'ativo');

-- Permitir visualização pública de desempenho mensal de mentorados ativos
CREATE POLICY "Public view mentorado desempenho"
ON public.desempenho_mensal
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mentorados
    WHERE mentorados.id = desempenho_mensal.mentorado_id
    AND mentorados.status = 'ativo'
  )
);

-- Permitir visualização pública de pilares de desempenho de mentorados ativos
CREATE POLICY "Public view mentorado pilares"
ON public.pilares_desempenho
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mentorados
    WHERE mentorados.id = pilares_desempenho.mentorado_id
    AND mentorados.status = 'ativo'
  )
);

-- Permitir visualização pública de atendimentos resolvidos de mentorados ativos
CREATE POLICY "Public view mentorado atendimentos"
ON public.atendimentos_navegador
FOR SELECT
USING (
  status = 'Resolvido' AND
  EXISTS (
    SELECT 1 FROM mentorados
    WHERE mentorados.id = atendimentos_navegador.mentorado_id
    AND mentorados.status = 'ativo'
  )
);

-- Permitir visualização pública de profiles de mentorados ativos
CREATE POLICY "Public view mentorado user profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM mentorados
    WHERE mentorados.user_id = profiles.id
    AND mentorados.status = 'ativo'
  )
);