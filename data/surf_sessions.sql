-- SwellSync — Table surf_sessions
-- À exécuter dans le SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS surf_sessions (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users NOT NULL,
  spot_id     INT,
  spot_name   TEXT,
  duration    INT DEFAULT 0,        -- en secondes
  waves       INT DEFAULT 0,         -- nombre de vagues estimées
  note        TEXT,                  -- note libre
  wave_height FLOAT,                 -- hauteur au moment de la session (m)
  wind_speed  FLOAT,                 -- vitesse vent (km/h)
  score       INT,                   -- score auto 0-100
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  ended_at    TIMESTAMPTZ
);

-- Index pour les requêtes user
CREATE INDEX IF NOT EXISTS surf_sessions_user_idx ON surf_sessions (user_id, started_at DESC);

-- Row Level Security
ALTER TABLE surf_sessions ENABLE ROW LEVEL SECURITY;

-- Chaque user voit uniquement ses sessions
CREATE POLICY "Users see own sessions"
  ON surf_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Chaque user peut insérer ses propres sessions
CREATE POLICY "Users insert own sessions"
  ON surf_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chaque user peut modifier/supprimer ses sessions
CREATE POLICY "Users update own sessions"
  ON surf_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own sessions"
  ON surf_sessions FOR DELETE
  USING (auth.uid() = user_id);
