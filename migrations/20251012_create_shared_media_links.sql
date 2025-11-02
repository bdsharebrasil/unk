-- Create shared_media_links table
CREATE TABLE IF NOT EXISTS shared_media_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_token UUID NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accessed_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_media_links_token ON shared_media_links(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_media_links_dj_id ON shared_media_links(dj_id);
CREATE INDEX IF NOT EXISTS idx_shared_media_links_producer_id ON shared_media_links(producer_id);

-- Enable RLS
ALTER TABLE shared_media_links ENABLE ROW LEVEL SECURITY;

-- Policy: Producers can create links for their DJs
CREATE POLICY "Producers can create share links"
  ON shared_media_links
  FOR INSERT
  WITH CHECK (
    auth.uid() = producer_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'producer'
    )
  );

-- Policy: Producers can view their own links
CREATE POLICY "Producers can view own links"
  ON shared_media_links
  FOR SELECT
  USING (auth.uid() = producer_id);

-- Policy: Anyone can read valid links (for public access)
CREATE POLICY "Public can read valid links"
  ON shared_media_links
  FOR SELECT
  USING (expires_at > now());

-- Policy: Anyone can update access count (for tracking)
CREATE POLICY "Public can update access count"
  ON shared_media_links
  FOR UPDATE
  USING (expires_at > now())
  WITH CHECK (expires_at > now());

-- Policy: Producers can delete their own links
CREATE POLICY "Producers can delete own links"
  ON shared_media_links
  FOR DELETE
  USING (auth.uid() = producer_id);

-- Create function to clean expired links
CREATE OR REPLACE FUNCTION cleanup_expired_share_links()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM shared_media_links
  WHERE expires_at < now() - INTERVAL '30 days';
END;
$$;
