-- Add contract and payment tracking to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS contract_signed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_url text,
ADD COLUMN IF NOT EXISTS payment_receipt_url text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
ADD COLUMN IF NOT EXISTS cache_value numeric,
ADD COLUMN IF NOT EXISTS created_by_role text DEFAULT 'admin' CHECK (created_by_role IN ('admin', 'dj')),
ADD COLUMN IF NOT EXISTS shared_with_admin boolean DEFAULT false;

-- Create event_djs junction table for multiple DJ events
CREATE TABLE IF NOT EXISTS public.event_djs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  dj_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cache_value numeric,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  payment_receipt_url text,
  contract_signed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, dj_id)
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  dj_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  producer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cache_value numeric NOT NULL,
  contract_content text,
  contract_url text,
  signed boolean DEFAULT false,
  signed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, dj_id)
);

-- Add RLS policies for event_djs
ALTER TABLE public.event_djs ENABLE ROW LEVEL SECURITY;

-- Allow admins to see all event_djs
CREATE POLICY "Admins can view all event_djs" ON public.event_djs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Allow DJs to see their own event_djs
CREATE POLICY "DJs can view own event_djs" ON public.event_djs
FOR SELECT
TO authenticated
USING (dj_id = auth.uid());

-- Allow producers to see event_djs for their events
CREATE POLICY "Producers can view event_djs for their events" ON public.event_djs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = event_djs.event_id
    AND (
      events.producer_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
      )
    )
  )
);

-- Allow admins and producers to insert/update event_djs
CREATE POLICY "Admins and producers can manage event_djs" ON public.event_djs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'producer')
  )
);

-- Add RLS policies for contracts
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view contracts they are involved in
CREATE POLICY "Users can view related contracts" ON public.contracts
FOR SELECT
TO authenticated
USING (
  dj_id = auth.uid() 
  OR producer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Allow admins and producers to manage contracts
CREATE POLICY "Admins and producers can manage contracts" ON public.contracts
FOR ALL
TO authenticated
USING (
  producer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Allow DJs to sign contracts (update only)
CREATE POLICY "DJs can sign contracts" ON public.contracts
FOR UPDATE
TO authenticated
USING (dj_id = auth.uid())
WITH CHECK (dj_id = auth.uid());

-- Update existing events table to support DJ visibility control
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS visible_to_dj boolean DEFAULT true;

-- Add function to create contract automatically when event is created
CREATE OR REPLACE FUNCTION create_contract_for_event()
RETURNS TRIGGER AS $$
DECLARE
  dj_record RECORD;
BEGIN
  -- Create contracts for each DJ in the event
  FOR dj_record IN 
    SELECT dj_id, cache_value FROM public.event_djs WHERE event_id = NEW.id
  LOOP
    INSERT INTO public.contracts (event_id, dj_id, producer_id, cache_value)
    VALUES (NEW.id, dj_record.dj_id, NEW.producer_id, COALESCE(dj_record.cache_value, NEW.budget));
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create contracts
CREATE OR REPLACE TRIGGER create_contract_trigger
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION create_contract_for_event();

-- Add payment receipts table for producer uploads
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  dj_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  producer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receipt_url text NOT NULL,
  amount numeric,
  upload_date timestamp with time zone DEFAULT now(),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, dj_id, producer_id)
);

-- Add RLS for payment_receipts
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view related payment receipts" ON public.payment_receipts
FOR SELECT
TO authenticated
USING (
  dj_id = auth.uid() 
  OR producer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Producers can manage payment receipts" ON public.payment_receipts
FOR ALL
TO authenticated
USING (
  producer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Comments
COMMENT ON TABLE public.event_djs IS 'Junction table for events with multiple DJs';
COMMENT ON TABLE public.contracts IS 'Auto-generated contracts for events with DJ cache values';
COMMENT ON TABLE public.payment_receipts IS 'Producer uploaded payment receipts for DJ payments';
COMMENT ON COLUMN public.events.created_by_role IS 'Role of user who created the event (admin or dj)';
COMMENT ON COLUMN public.events.shared_with_admin IS 'Whether DJ-created event is shared with admin';
COMMENT ON COLUMN public.events.visible_to_dj IS 'Whether event is visible to assigned DJs';