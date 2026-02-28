/**
 * SwellSync — Cron Job : Refresh automatique des prévisions surf
 * 
 * Déclenché automatiquement par Vercel Cron toutes les 4 heures.
 * Récupère les données StormGlass pour tous les spots et les stocke
 * dans la table Supabase `forecast_cache`.
 * 
 * Protégé par CRON_SECRET pour éviter les appels non autorisés.
 */

const SB_URL = process.env.SUPABASE_URL || 'https://bxudysseskfpmlpagoid.supabase.co';
const SB_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_8UPKYf9eOQjX9-5bBGl1CA_XRu8ZkiU';
const SG_KEY = process.env.STORMGLASS_KEY || '91e3ecb4-0596-11f1-b82f-0242ac120004-91e3ed18-0596-11f1-b82f-0242ac120004';
const SG_BASE = 'https://api.stormglass.io/v2/weather/point';
const SG_PARAMS = 'waveHeight,wavePeriod,waveDirection,windSpeed,windDirection,swellHeight,swellPeriod,waterTemperature,seaLevel';

// Limite à consommer par exécution (500/j = ~125 req max par bloc de 4h)
const MAX_REQUESTS_PER_RUN = 120;

// En-têtes Supabase
const sbHeaders = {
    'apikey': SB_KEY,
    'Authorization': 'Bearer ' + SB_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=minimal'
};

// Liste complète des spots avec coordonnées GPS
const SPOTS = [
    { id: 1, name: 'La Gravière', lat: 43.664, lng: -1.448 },
    { id: 2, name: 'La Nord', lat: 43.670, lng: -1.450 },
    { id: 3, name: 'La Sud', lat: 43.657, lng: -1.449 },
    { id: 4, name: 'Les Culs Nuls', lat: 43.675, lng: -1.451 },
    { id: 5, name: 'La Centrale', lat: 43.661, lng: -1.447 },
    { id: 6, name: 'Les Bourdaines', lat: 43.695, lng: -1.455 },
    { id: 7, name: 'Les Estagnots', lat: 43.688, lng: -1.452 },
    { id: 8, name: 'Le Penon', lat: 43.703, lng: -1.456 },
    { id: 9, name: 'Les Casernes', lat: 43.710, lng: -1.458 },
    { id: 10, name: 'La Piste', lat: 43.642, lng: -1.445 },
    { id: 11, name: 'Le Santocha', lat: 43.648, lng: -1.444 },
    { id: 12, name: 'Moliets Plage', lat: 43.847, lng: -1.390 },
    { id: 13, name: 'Vieux Boucau', lat: 43.791, lng: -1.398 },
    { id: 14, name: 'Messanges', lat: 43.813, lng: -1.393 },
    { id: 15, name: 'Mimizan Plage', lat: 44.201, lng: -1.306 },
    { id: 16, name: 'Côte des Basques', lat: 43.476, lng: -1.568 },
    { id: 17, name: 'Grande Plage', lat: 43.483, lng: -1.558 },
    { id: 18, name: 'La Milady', lat: 43.470, lng: -1.572 },
    { id: 19, name: 'Marbella', lat: 43.465, lng: -1.575 },
    { id: 20, name: 'Parlementia', lat: 43.430, lng: -1.610 },
    { id: 21, name: 'Lafitenia', lat: 43.413, lng: -1.625 },
    { id: 22, name: 'Erretegia', lat: 43.442, lng: -1.590 },
    { id: 23, name: 'Pavillon Royal', lat: 43.455, lng: -1.580 },
    { id: 24, name: 'Ilbarritz', lat: 43.460, lng: -1.577 },
    { id: 25, name: 'Les Cavaliers', lat: 43.521, lng: -1.533 },
    { id: 26, name: 'Les Corsaires', lat: 43.518, lng: -1.534 },
    { id: 27, name: 'La Barre', lat: 43.530, lng: -1.525 },
    { id: 28, name: 'Hendaye Plage', lat: 43.368, lng: -1.768 },
    { id: 29, name: 'Lacanau Océan', lat: 45.002, lng: -1.197 },
    { id: 30, name: 'La Sud Lacanau', lat: 44.997, lng: -1.199 },
    { id: 31, name: 'Le Super Sud', lat: 44.990, lng: -1.200 },
    { id: 32, name: 'Le Porge Océan', lat: 44.868, lng: -1.171 },
    { id: 33, name: 'Hourtin Plage', lat: 45.180, lng: -1.152 },
    { id: 34, name: 'Carcans Plage', lat: 45.073, lng: -1.181 },
    { id: 35, name: 'Le Grand Crohot', lat: 44.740, lng: -1.240 },
    { id: 36, name: 'La Torche', lat: 47.842, lng: -4.348 },
    { id: 37, name: 'La Palue', lat: 48.243, lng: -4.538 },
    { id: 38, name: 'Pors Carn', lat: 47.797, lng: -4.368 },
    { id: 39, name: "La Presqu'île", lat: 48.271, lng: -4.497 },
    { id: 40, name: 'Guidel Plage', lat: 47.776, lng: -3.509 },
    { id: 41, name: 'Quiberon', lat: 47.488, lng: -3.122 },
    { id: 42, name: 'Donnant', lat: 47.327, lng: -3.205 },
    { id: 43, name: 'Sainte-Barbe', lat: 47.606, lng: -3.104 },
    { id: 44, name: 'Tronoën', lat: 47.832, lng: -4.310 },
    { id: 45, name: "Les Sables-d'Olonne", lat: 46.497, lng: -1.796 },
    { id: 46, name: 'Brétignolles-sur-Mer', lat: 46.627, lng: -1.867 },
    { id: 47, name: 'La Sauzaie', lat: 46.632, lng: -1.870 },
    { id: 48, name: 'Bud Bud', lat: 46.380, lng: -1.499 },
    { id: 49, name: 'Royan — Grande Conche', lat: 45.621, lng: -1.040 },
    { id: 50, name: 'Saint-Palais-sur-Mer', lat: 45.638, lng: -1.090 },
    { id: 51, name: 'Les Huttes', lat: 45.922, lng: -1.360 },
    { id: 52, name: 'Vert Bois', lat: 45.896, lng: -1.380 },
    { id: 53, name: 'La Côte Sauvage', lat: 45.686, lng: -1.141 },
    { id: 54, name: 'Les Boucholeurs', lat: 46.197, lng: -1.411 },
    { id: 55, name: 'Tarnos', lat: 43.553, lng: -1.471 },
    { id: 56, name: 'Labenne Océan', lat: 43.597, lng: -1.455 },
    { id: 57, name: 'Ondres Plage', lat: 43.574, lng: -1.461 },
    { id: 58, name: 'Biscarrosse Plage', lat: 44.454, lng: -1.268 },
    { id: 59, name: 'Contis Plage', lat: 44.087, lng: -1.331 },
    { id: 60, name: 'Lespécier', lat: 44.228, lng: -1.289 },
    { id: 61, name: 'Le Truc Vert', lat: 44.756, lng: -1.235 },
    { id: 62, name: 'Montalivet', lat: 45.375, lng: -1.080 },
    { id: 63, name: 'Soulac-sur-Mer', lat: 45.513, lng: -1.125 },
    { id: 64, name: 'Le Pin Sec', lat: 45.283, lng: -1.065 },
];

// Pause entre les requêtes pour éviter le rate limiting
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Arrondir lat/lng pour grouper les spots très proches (économise des requêtes)
function clusterKey(lat, lng) {
    return `${parseFloat(lat).toFixed(2)},${parseFloat(lng).toFixed(2)}`;
}

export default async function handler(req, res) {
    // Vérification sécurité : seul Vercel Cron (ou un appel manuel avec le bon secret) peut déclencher
    const authHeader = req.headers['authorization'];
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const now = new Date();
    const bloc = Math.floor(now.getHours() / 4);
    const today = now.toISOString().slice(0, 10);
    const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();

    let sgRequestCount = 0;
    let cacheHits = 0;
    let errors = 0;
    const results = [];

    // Dédupliquer les spots proches géographiquement pour économiser les requêtes
    const clusters = new Map(); // clusterKey → spot représentatif
    for (const spot of SPOTS) {
        const key = clusterKey(spot.lat, spot.lng);
        if (!clusters.has(key)) {
            clusters.set(key, { ...spot, _spots: [spot.id] });
        } else {
            clusters.get(key)._spots.push(spot.id);
        }
    }

    for (const [, cluster] of clusters) {
        if (sgRequestCount >= MAX_REQUESTS_PER_RUN) {

            break;
        }

        const { lat, lng } = cluster;
        const cacheKey = `${parseFloat(lat).toFixed(3)},${parseFloat(lng).toFixed(3)},${today},${bloc}`;

        // Vérifier si déjà en cache valide
        try {
            const checkR = await fetch(
                `${SB_URL}/rest/v1/forecast_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&expires_at=gt.${now.toISOString()}&select=id&limit=1`,
                { headers: sbHeaders }
            );
            const existing = await checkR.json();
            if (existing?.length > 0) {
                cacheHits++;
                continue; // déjà frais, on skip
            }
        } catch (e) {

        }

        // Appel StormGlass
        const start = now.toISOString();
        const end = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
        const sgUrl = `${SG_BASE}?lat=${lat}&lng=${lng}&params=${SG_PARAMS}&start=${start}&end=${end}&source=sg`;

        let forecastData = null;
        let source = 'stormglass';

        try {
            const sgRes = await fetch(sgUrl, {
                headers: { 'Authorization': SG_KEY }
            });
            sgRequestCount++;

            if (sgRes.ok) {
                const raw = await sgRes.json();
                if (raw.hours?.length) {
                    forecastData = raw.hours.map(h => ({
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
                        _mock: false
                    }));
                } else if (raw.errors) {
                    // Quota StormGlass dépassé → fallback Open-Meteo
                    throw new Error('StormGlass quota: ' + JSON.stringify(raw.errors));
                }
            } else {
                throw new Error('HTTP ' + sgRes.status);
            }
        } catch (sgErr) {

            // Fallback Open-Meteo
            try {
                const omUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_period,wave_direction,wind_wave_height,wind_wave_period&forecast_days=7&timezone=auto`;
                const omRes = await fetch(omUrl);
                if (omRes.ok) {
                    const om = await omRes.json();
                    const times = om.hourly?.time || [];
                    forecastData = times.map((t, i) => ({
                        time: t,
                        waveHeight: om.hourly.wave_height?.[i] ?? null,
                        wavePeriod: om.hourly.wave_period?.[i] ?? null,
                        waveDirection: om.hourly.wave_direction?.[i] ?? null,
                        windSpeed: null,
                        windDirection: null,
                        swellHeight: om.hourly.wind_wave_height?.[i] ?? null,
                        swellPeriod: om.hourly.wind_wave_period?.[i] ?? null,
                        waterTemp: null,
                        seaLevel: null,
                        _mock: false
                    }));
                    source = 'open-meteo';
                }
            } catch (omErr) {
                console.error(`❌ [Open-Meteo] ${cluster.name}: ${omErr.message}`);
                errors++;
                continue;
            }
        }

        if (!forecastData) { errors++; continue; }

        // Stocker en cache Supabase (valable pour tous les spots du cluster)
        try {
            await fetch(`${SB_URL}/rest/v1/forecast_cache`, {
                method: 'POST',
                headers: sbHeaders,
                body: JSON.stringify({
                    cache_key: cacheKey,
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    source,
                    data: forecastData,
                    fetched_at: now.toISOString(),
                    expires_at: expiresAt
                })
            });
            results.push({ key: cacheKey, spots: cluster._spots, source, hours: forecastData.length });
        } catch (saveErr) {
            console.error(`❌ [Supabase] Sauvegarde échouée pour ${cacheKey}:`, saveErr.message);
            errors++;
        }

        // Anti rate-limit : pause 300ms entre chaque requête StormGlass
        await sleep(300);
    }

    const summary = {
        timestamp: now.toISOString(),
        expires_at: expiresAt,
        total_spots: SPOTS.length,
        clusters: clusters.size,
        sg_requests: sgRequestCount,
        cache_hits: cacheHits,
        refreshed: results.length,
        errors,
        sg_budget_left: 500 - sgRequestCount
    };

    // ═══ Vérification des alertes & push notifications ═══
    let alertsFired = 0;
    try {
        // 1. Récupérer toutes les alertes actives
        const alertsRes = await fetch(
            `${SB_URL}/rest/v1/user_alerts?active=eq.1&select=*`,
            { headers: sbHeaders }
        );
        const userAlerts = alertsRes.ok ? await alertsRes.json() : [];

        for (const alert of userAlerts) {
            // 2. Trouver le cache météo du spot
            const spot = SPOTS.find(s => s.id === alert.spot_id);
            if (!spot) continue;
            const ck = `${parseFloat(spot.lat).toFixed(3)},${parseFloat(spot.lng).toFixed(3)},${today},${bloc}`;

            const cacheRes = await fetch(
                `${SB_URL}/rest/v1/forecast_cache?cache_key=eq.${encodeURIComponent(ck)}&select=data&limit=1`,
                { headers: sbHeaders }
            );
            if (!cacheRes.ok) continue;
            const cacheRows = await cacheRes.json();
            if (!cacheRows?.length) continue;

            const forecastData = cacheRows[0].data;
            const currentHour = forecastData?.find(h => new Date(h.time) >= now) || forecastData?.[0];
            if (!currentHour) continue;

            const waveH = parseFloat(currentHour.waveHeight) || 0;
            const period = parseFloat(currentHour.wavePeriod) || 0;
            const minH = parseFloat(alert.min_height) || 0;
            const minP = parseFloat(alert.min_period) || 0;

            // 3. Seuils dépassés ?
            if (waveH >= minH && period >= minP) {
                // 4. Récupérer les push subscriptions de l'utilisateur
                const subsRes = await fetch(
                    `${SB_URL}/rest/v1/push_subscriptions?user_id=eq.${alert.user_id}&select=*`,
                    { headers: sbHeaders }
                );
                if (!subsRes.ok) continue;
                const subs = await subsRes.json();

                for (const sub of subs) {
                    try {
                        // Envoyer via Web Push API Supabase Edge Function (ou service externe)
                        await fetch(`${SB_URL}/functions/v1/send-push`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY || SB_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                subscription: sub.subscription,
                                payload: {
                                    title: `🌊 ${alert.spot_name || 'Spot'} — Conditions idéales !`,
                                    body: `Houle ${waveH.toFixed(1)}m · Période ${period.toFixed(0)}s — C'est le bon moment ! 🤙`,
                                    icon: '/assets/images/swellsync_logo.png',
                                    badge: '/assets/images/swellsync_logo.png',
                                    url: `/pages/spot_detail.html?id=${alert.spot_id}`
                                }
                            })
                        });
                        alertsFired++;
                    } catch (pushErr) {

                    }
                }
            }
        }

    } catch (alertErr) {

    }

    summary.alerts_fired = alertsFired;

    return res.status(200).json(summary);
}
