-- Tables pour les votes Roadmap SwellSync
-- Exécuter dans le SQL Editor de Supabase Dashboard

CREATE TABLE IF NOT EXISTS roadmap_votes (
  feature_id TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roadmap_voter_log (
  id SERIAL PRIMARY KEY,
  feature_id TEXT NOT NULL,
  voter_ip TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(feature_id, voter_ip)
);

-- Seed initial vote counts
INSERT INTO roadmap_votes (feature_id, count) VALUES
  ('0', 47), ('1', 38), ('2', 29), ('3', 61), ('4', 22)
ON CONFLICT (feature_id) DO NOTHING;

-- Enable RLS
ALTER TABLE roadmap_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_voter_log ENABLE ROW LEVEL SECURITY;

-- Allow read for everyone
CREATE POLICY "Allow read roadmap_votes" ON roadmap_votes FOR SELECT USING (true);
CREATE POLICY "Allow read roadmap_voter_log" ON roadmap_voter_log FOR SELECT USING (true);
CREATE POLICY "Allow insert roadmap_votes" ON roadmap_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update roadmap_votes" ON roadmap_votes FOR UPDATE USING (true);
CREATE POLICY "Allow insert roadmap_voter_log" ON roadmap_voter_log FOR INSERT WITH CHECK (true);
