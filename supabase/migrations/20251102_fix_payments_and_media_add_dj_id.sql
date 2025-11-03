-- Migration: garantir coluna dj_id, índices e FKs em public.payments e public.media_files
-- Idempotente: só cria o que não existir e só torna NOT NULL se não houver valores NULL

-- === payments.dj_id ===
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'dj_id'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN dj_id uuid;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_payments_dj_id ON public.payments USING btree (dj_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' AND t.relname = 'payments' AND c.conname = 'payments_dj_id_fkey'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_dj_id_fkey FOREIGN KEY (dj_id) REFERENCES public.djs(id) ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
DECLARE n integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'dj_id'
  ) THEN
    EXECUTE 'SELECT count(*) FROM public.payments WHERE dj_id IS NULL' INTO n;
    IF n = 0 THEN
      ALTER TABLE public.payments ALTER COLUMN dj_id SET NOT NULL;
    END IF;
  END IF;
END
$$;

-- === media_files.dj_id ===
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'media_files' AND column_name = 'dj_id'
  ) THEN
    ALTER TABLE public.media_files ADD COLUMN dj_id uuid;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_media_files_dj_id ON public.media_files USING btree (dj_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public' AND t.relname = 'media_files' AND c.conname = 'media_files_dj_id_fkey'
  ) THEN
    ALTER TABLE public.media_files
      ADD CONSTRAINT media_files_dj_id_fkey FOREIGN KEY (dj_id) REFERENCES public.djs(id) ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
DECLARE m integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'media_files' AND column_name = 'dj_id'
  ) THEN
    EXECUTE 'SELECT count(*) FROM public.media_files WHERE dj_id IS NULL' INTO m;
    IF m = 0 THEN
      ALTER TABLE public.media_files ALTER COLUMN dj_id SET NOT NULL;
    END IF;
  END IF;
END
$$;

-- Nota: se precisa popular dj_id antes de definir NOT NULL, execute um UPDATE antes de rodar esta migration.
