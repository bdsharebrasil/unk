-- Migration: garantir coluna dj_id, índice e FK em public.event_djs
-- Idempotente: só cria o que não existir e só torna NOT NULL se não houver valores NULL

DO $$
BEGIN
  -- adicionar coluna dj_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_djs' AND column_name = 'dj_id'
  ) THEN
    ALTER TABLE public.event_djs ADD COLUMN dj_id uuid;
  END IF;
END
$$;

-- criar índice se necessário
CREATE INDEX IF NOT EXISTS idx_event_djs_dj_id ON public.event_djs USING btree (dj_id);

-- adicionar constraint FK se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' AND t.relname = 'event_djs' AND c.conname = 'event_djs_dj_id_fkey'
  ) THEN
    ALTER TABLE public.event_djs
      ADD CONSTRAINT event_djs_dj_id_fkey FOREIGN KEY (dj_id) REFERENCES public.djs(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Tornar dj_id NOT NULL somente se não houver linhas com dj_id IS NULL
DO $$
DECLARE
  n integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_djs' AND column_name = 'dj_id'
  ) THEN
    EXECUTE 'SELECT count(*) FROM public.event_djs WHERE dj_id IS NULL' INTO n;
    IF n = 0 THEN
      ALTER TABLE public.event_djs ALTER COLUMN dj_id SET NOT NULL;
    END IF;
  END IF;
END
$$;

-- Nota: se você precisar popular dj_id a partir de outra coluna antes de tornar NOT NULL,
-- execute um UPDATE apropriado antes de rodar esta migration.
