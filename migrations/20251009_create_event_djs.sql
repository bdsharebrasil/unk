-- Habilita gen_random_uuid (pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.event_djs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  dj_id uuid NOT NULL,
  fee numeric(10,2) NULL,
  created_at timestamptz NULL DEFAULT now(),
  CONSTRAINT event_djs_pkey PRIMARY KEY (id),
  CONSTRAINT event_djs_dj_id_fkey FOREIGN KEY (dj_id) REFERENCES public.djs (id) ON DELETE CASCADE,
  CONSTRAINT event_djs_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_djs_event_id ON public.event_djs USING btree (event_id);
CREATE INDEX IF NOT EXISTS idx_event_djs_dj_id ON public.event_djs USING btree (dj_id);

-- Adiciona uma VIEW que agrega event_djs com os dados do dj em JSONB
CREATE OR REPLACE VIEW public.events_with_djs AS
SELECT
  e.*,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ed.id,
        'fee', ed.fee,
        'created_at', ed.created_at,
        'dj', jsonb_build_object(
          'id', d.id,
          'name', d.name,
          'company_name', d.company_name,
          'email', d.email,
          'profile_id', d.profile_id
        )
      ) ORDER BY ed.created_at DESC
    ) FILTER (WHERE ed.id IS NOT NULL),
    '[]'::jsonb
  ) AS event_djs
FROM public.events e
LEFT JOIN public.event_djs ed ON ed.event_id = e.id
LEFT JOIN public.djs d ON d.id = ed.dj_id
GROUP BY e.id;
