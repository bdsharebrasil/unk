-- Adicionar políticas RLS para DJs acessarem seus próprios dados

-- Permitir DJs visualizarem seus próprios perfis
CREATE POLICY "DJs can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Permitir DJs atualizarem seus próprios perfis
CREATE POLICY "DJs can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Permitir DJs criarem eventos próprios
CREATE POLICY "DJs can create events" ON public.events
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'dj'
  )
);

-- Permitir DJs visualizarem eventos próprios
CREATE POLICY "DJs can view own events" ON public.events
FOR SELECT TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.event_djs 
    WHERE event_djs.event_id = events.id 
    AND event_djs.dj_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Permitir DJs atualizarem eventos próprios
CREATE POLICY "DJs can update own events" ON public.events
FOR UPDATE TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Permitir DJs excluírem eventos próprios
CREATE POLICY "DJs can delete own events" ON public.events
FOR DELETE TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Permitir DJs visualizarem contratos próprios
CREATE POLICY "DJs can view own contracts" ON public.contracts
FOR SELECT TO authenticated
USING (dj_id = auth.uid());

-- Permitir DJs assinarem contratos próprios
CREATE POLICY "DJs can sign own contracts" ON public.contracts
FOR UPDATE TO authenticated
USING (dj_id = auth.uid())
WITH CHECK (dj_id = auth.uid());

-- Permitir DJs visualizarem pagamentos próprios
CREATE POLICY "DJs can view own payments" ON public.payments
FOR SELECT TO authenticated
USING (dj_id = auth.uid());

-- Permitir DJs visualizarem mídia própria
CREATE POLICY "DJs can view own media" ON public.media_files
FOR SELECT TO authenticated
USING (dj_id = auth.uid());

-- Permitir DJs gerenciarem mídia própria
CREATE POLICY "DJs can manage own media" ON public.media_files
FOR ALL TO authenticated
USING (dj_id = auth.uid())
WITH CHECK (dj_id = auth.uid());
