-- Add missing fields to profiles table for DJ information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS genre text,
ADD COLUMN IF NOT EXISTS base_price numeric,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS real_name text,
ADD COLUMN IF NOT EXISTS rider_requirements text,
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS rating integer DEFAULT 5;

-- Add comment to explain the fields
COMMENT ON COLUMN public.profiles.genre IS 'Musical genre(s) of the DJ';
COMMENT ON COLUMN public.profiles.base_price IS 'Base fee/cache for the DJ';
COMMENT ON COLUMN public.profiles.status IS 'DJ status: ativo, inativo, ocupado';
COMMENT ON COLUMN public.profiles.real_name IS 'DJ real name (different from full_name)';
COMMENT ON COLUMN public.profiles.rider_requirements IS 'Technical requirements and rider';
COMMENT ON COLUMN public.profiles.cpf IS 'CPF document number';
COMMENT ON COLUMN public.profiles.whatsapp IS 'WhatsApp contact number';
COMMENT ON COLUMN public.profiles.rating IS 'DJ rating (1-5 stars)';