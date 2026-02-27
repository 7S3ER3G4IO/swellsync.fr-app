-- ═══ SwellSync — Cache Prévisions Météo (StormGlass) ═══
-- Exécuter dans le SQL Editor du Dashboard Supabase
-- https://app.supabase.com → SQL Editor → New Query

-- ── 1. Créer la table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forecast_cache (
  id          SERIAL PRIMARY KEY,
  -- Clé de cache : arrondie au bloc de 4h pour grouper les requêtes proches
  cache_key   TEXT NOT NULL UNIQUE,   -- format : "lat,lng,YYYY-MM-DD,bloc4h"
  lat         NUMERIC(9,5) NOT NULL,
  lng         NUMERIC(9,5) NOT NULL,
  source      TEXT DEFAULT 'stormglass', -- 'stormglass' | 'open-meteo'
  data        JSONB NOT NULL,          -- tableau d'heures de prévisions
  fetched_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL    -- vide automatiquement après 4h
);

-- ── 2. Index pour les recherches rapides ──────────────────────
CREATE INDEX IF NOT EXISTS idx_forecast_cache_key     ON forecast_cache (cache_key);
CREATE INDEX IF NOT EXISTS idx_forecast_cache_expires ON forecast_cache (expires_at);

-- ── 3. Fonction de nettoyage automatique (optionnel) ──────────
-- Supprimer les entrées expirées automatiquement via pg_cron (si activé sur Supabase Pro)
-- SELECT cron.schedule('cleanup-forecast-cache', '0 * * * *', $$
--   DELETE FROM forecast_cache WHERE expires_at < NOW();
-- $$);

-- ── 4. RLS : lecture publique, écriture publique (clé anon) ───
ALTER TABLE forecast_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"   ON forecast_cache FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON forecast_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON forecast_cache FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON forecast_cache FOR DELETE USING (true);
