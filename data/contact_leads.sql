-- ═══ SwellSync — Table contact_leads ═══
-- Exécuter dans le SQL Editor du Dashboard Supabase
-- https://app.supabase.com → SQL Editor → New Query

CREATE TABLE IF NOT EXISTS contact_leads (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT,
  message    TEXT,
  source     TEXT DEFAULT 'app',   -- 'app-coaching', 'site-contact', etc.
  status     TEXT DEFAULT 'new',   -- 'new', 'replied', 'closed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour trier les demandes par date
CREATE INDEX IF NOT EXISTS idx_contact_leads_created ON contact_leads (created_at DESC);

-- RLS
ALTER TABLE contact_leads ENABLE ROW LEVEL SECURITY;

-- Écriture publique (formulaire de l'app sans auth)
CREATE POLICY "Allow public insert" ON contact_leads FOR INSERT WITH CHECK (true);
-- Lecture réservée aux admins (service_role uniquement)
CREATE POLICY "Allow service read"  ON contact_leads FOR SELECT USING (false);
