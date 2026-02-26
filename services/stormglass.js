/**
 * SwellSync — Service Stormglass API
 * 
 * Quand la clé est absente → retourne des données mockées réalistes.
 * Pour activer : ajouter STORMGLASS_KEY=ta_clé dans .env
 * 
 * Doc : https://docs.stormglass.io/#/point-request
 */
const https = require('https');
const db = require('../database');

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 heures (60 spots × 6 refresh/jour = 360 req/j sur 500 max)
const API_KEY = process.env.STORMGLASS_KEY || null;
const BASE_URL = 'https://api.stormglass.io/v2';
const DAILY_LIMIT = 500;

// ── Paramètres à récupérer ─────────────────────────────────
const PARAMS = [
    'waveHeight', 'wavePeriod', 'waveDirection',
    'windSpeed', 'windDirection',
    'swellHeight', 'swellPeriod',
    'waterTemperature', 'seaLevel'
].join(',');

// ── Cache en mémoire (clé = "lat,lng,bloc4h") ─────────────
const cache = new Map();
let dailyRequestCount = 0;
let dailyResetDate = new Date().toISOString().slice(0, 10);

function getCacheKey(lat, lng) {
    const now = new Date();
    const bloc4h = Math.floor(now.getHours() / 4); // 0-5 (6 blocs/jour)
    const day = now.toISOString().slice(0, 10);
    return `${lat.toFixed(3)},${lng.toFixed(3)},${day},${bloc4h}`;
}

function checkDailyReset() {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== dailyResetDate) {
        dailyRequestCount = 0;
        dailyResetDate = today;
        console.log('🔄 [StormGlass] Compteur quotidien réinitialisé');
    }
}

// ── Fetch depuis Stormglass ────────────────────────────────
function fetchFromStormglass(lat, lng) {
    return new Promise((resolve, reject) => {
        const now = new Date().toISOString();
        const end = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
        const url = `${BASE_URL}/weather/point?lat=${lat}&lng=${lng}&params=${PARAMS}&start=${now}&end=${end}&source=sg`;

        const req = https.get(url, {
            headers: { 'Authorization': API_KEY }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch { reject(new Error('Parse error')); }
            });
        });
        req.on('error', reject);
        req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

// ── Générer données mockées réalistes ─────────────────────
function generateMock(lat, lng) {
    const seed = Math.abs(Math.sin(lat * lng * 1000));
    const hours = [];
    const now = new Date();
    now.setMinutes(0, 0, 0);

    for (let i = 0; i < 168; i++) {
        const t = new Date(now.getTime() + i * 3600000);
        const tidal = Math.sin((i / 12) * Math.PI);
        const swell = 1.0 + seed * 1.5 + tidal * 0.5 + Math.sin(i / 6) * 0.3;
        const period = 8 + seed * 6 + Math.sin(i / 24) * 2;
        const wind = 3 + seed * 12 + Math.sin(i / 18) * 4;
        hours.push({
            time: t.toISOString(),
            waveHeight: { sg: Math.max(0.2, swell).toFixed(2) - 0 },
            wavePeriod: { sg: period.toFixed(1) - 0 },
            waveDirection: { sg: 270 + seed * 60 },
            windSpeed: { sg: wind.toFixed(1) - 0 },
            windDirection: { sg: 220 + seed * 80 },
            swellHeight: { sg: (swell * 0.85).toFixed(2) - 0 },
            swellPeriod: { sg: (period * 1.1).toFixed(1) - 0 },
            waterTemperature: { sg: 16 + seed * 4 },
            seaLevel: { sg: tidal * 2.5 }
        });
    }
    return { hours, _mock: true };
}

// ── Formater la réponse ────────────────────────────────────
function formatResponse(raw) {
    if (!raw.hours) return raw;
    return raw.hours.map(h => ({
        time: h.time,
        waveHeight: h.waveHeight?.sg ?? null,
        wavePeriod: h.wavePeriod?.sg ?? null,
        waveDirection: h.waveDirection?.sg ?? null,
        windSpeed: h.windSpeed?.sg ?? null,
        windDirection: h.windDirection?.sg ?? null,
        swellHeight: h.swellHeight?.sg ?? null,
        swellPeriod: h.swellPeriod?.sg ?? null,
        waterTemp: h.waterTemperature?.sg ?? null,
        seaLevel: h.seaLevel?.sg ?? null,
        _mock: raw._mock || false
    }));
}

// ── Fonction principale exportée ──────────────────────────
async function getForecast(lat, lng) {
    const key = getCacheKey(lat, lng);
    checkDailyReset();

    // 1. Cache mémoire
    if (cache.has(key)) return cache.get(key);

    // 2. Pas de clé → mock
    if (!API_KEY) {
        const mock = { data: formatResponse(generateMock(lat, lng)), mock: true };
        cache.set(key, mock);
        setTimeout(() => cache.delete(key), CACHE_TTL_MS);
        return mock;
    }

    // 3. Limite quotidienne atteinte → mock avec warning
    if (dailyRequestCount >= DAILY_LIMIT) {
        console.warn(`⚠️ [StormGlass] Limite quotidienne atteinte (${dailyRequestCount}/${DAILY_LIMIT}), fallback mock`);
        const mock = { data: formatResponse(generateMock(lat, lng)), mock: true, limitReached: true };
        cache.set(key, mock);
        setTimeout(() => cache.delete(key), CACHE_TTL_MS);
        return mock;
    }

    // 4. Vraie API Stormglass
    try {
        dailyRequestCount++;
        console.log(`🌊 [StormGlass] Requête API #${dailyRequestCount}/${DAILY_LIMIT} — Budget restant: ${DAILY_LIMIT - dailyRequestCount}`);
        const raw = await fetchFromStormglass(lat, lng);
        const result = { data: formatResponse(raw), mock: false };
        cache.set(key, result);
        setTimeout(() => cache.delete(key), CACHE_TTL_MS);
        return result;
    } catch (err) {
        console.warn('⚠️ [Stormglass] Erreur API, fallback mock :', err.message);
        const mock = { data: formatResponse(generateMock(lat, lng)), mock: true };
        cache.set(key, mock);
        setTimeout(() => cache.delete(key), 5 * 60 * 1000); // cache 5min si erreur
        return mock;
    }
}

module.exports = { getForecast, getStats: () => ({ dailyRequestCount, dailyLimit: DAILY_LIMIT, cacheSize: cache.size }) };
