CREATE TABLE disclaimer_acceptances (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version     TEXT NOT NULL DEFAULT 'wfg_v1',
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent  TEXT,
  UNIQUE(user_id, version)
);

ALTER TABLE disclaimer_acceptances ENABLE ROW LEVEL SECURITY;

-- Authenticated users: view own rows
CREATE POLICY "users_view_own_disclaimer" ON disclaimer_acceptances
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone (including anonymous) can insert
CREATE POLICY "public_insert_disclaimer" ON disclaimer_acceptances
  FOR INSERT WITH CHECK (true);
