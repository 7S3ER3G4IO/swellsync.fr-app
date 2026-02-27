/**
 * SwellSync — API Layer (Supabase)
 * pages/js/api.js — Toutes les pages importent ce fichier.
 * 
 * Migration Express → Supabase
 * - Même interface API que l'ancien fichier (API.auth.me(), API.spots.list(), etc.)
 * - Utilise le client Supabase JS v2
 */

// ── Supabase Config ─────────────────────────────────────────
const SUPABASE_URL = 'https://bxudysseskfpmlpagoid.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_8UPKYf9eOQjX9-5bBGl1CA_XRu8ZkiU';

// ── StormGlass ──────────────────────────────────────────────
const STORMGLASS_KEY = '91e3ecb4-0596-11f1-b82f-0242ac120004-91e3ed18-0596-11f1-b82f-0242ac120004';
const _sgCache = new Map(); // cache mémoire 4h

// Charger le client Supabase
let _supabase = null;
async function getSupabase() {
    if (_supabase) return _supabase;
    // Utiliser le CDN pour charger le client
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return _supabase;
    }
    // Fallback : charger dynamiquement
    await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
    _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return _supabase;
}

// ── Ancien fallback Express (garder compatible pendant la migration) ──
const BASE = '';
async function _legacyReq(method, path, body) {
    const opts = {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(BASE + path, opts);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
    }
    return res.json();
}

// ── Helper : obtenir le member_id courant ───────────────────
async function _getMemberId() {
    const sb = await getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error('Non connecté');
    // Chercher le member dans la table members par email
    const { data: member } = await sb.from('members').select('id').eq('email', user.email).single();
    return member?.id || null;
}

// ══════════════════════════════════════════════════════════════
// Fallback spots — utilisé quand la table Supabase est vide
// ══════════════════════════════════════════════════════════════
const FALLBACK_SPOTS = [
    { id: 1, name: 'La Gravière', location: 'Hossegor, Landes', difficulty: 'expert', lat: 43.664, lng: -1.448 },
    { id: 2, name: 'La Nord', location: 'Hossegor, Landes', difficulty: 'avance', lat: 43.670, lng: -1.450 },
    { id: 3, name: 'La Sud', location: 'Hossegor, Landes', difficulty: 'intermediaire', lat: 43.657, lng: -1.449 },
    { id: 4, name: 'Les Culs Nuls', location: 'Hossegor, Landes', difficulty: 'avance', lat: 43.675, lng: -1.451 },
    { id: 5, name: 'La Centrale', location: 'Hossegor, Landes', difficulty: 'intermediaire', lat: 43.661, lng: -1.447 },
    { id: 6, name: 'Les Bourdaines', location: 'Seignosse, Landes', difficulty: 'avance', lat: 43.695, lng: -1.455 },
    { id: 7, name: 'Les Estagnots', location: 'Seignosse, Landes', difficulty: 'avance', lat: 43.688, lng: -1.452 },
    { id: 8, name: 'Le Penon', location: 'Seignosse, Landes', difficulty: 'intermediaire', lat: 43.703, lng: -1.456 },
    { id: 9, name: 'Les Casernes', location: 'Seignosse, Landes', difficulty: 'intermediaire', lat: 43.710, lng: -1.458 },
    { id: 10, name: 'La Piste', location: 'Capbreton, Landes', difficulty: 'debutant', lat: 43.642, lng: -1.445 },
    { id: 11, name: 'Le Santocha', location: 'Capbreton, Landes', difficulty: 'intermediaire', lat: 43.648, lng: -1.444 },
    { id: 12, name: 'Moliets Plage', location: 'Moliets, Landes', difficulty: 'intermediaire', lat: 43.847, lng: -1.390 },
    { id: 13, name: 'Vieux Boucau', location: 'Vieux-Boucau, Landes', difficulty: 'debutant', lat: 43.791, lng: -1.398 },
    { id: 14, name: 'Messanges', location: 'Messanges, Landes', difficulty: 'intermediaire', lat: 43.813, lng: -1.393 },
    { id: 15, name: 'Mimizan Plage', location: 'Mimizan, Landes', difficulty: 'intermediaire', lat: 44.201, lng: -1.306 },
    { id: 16, name: 'Côte des Basques', location: 'Biarritz, Pays Basque', difficulty: 'debutant', lat: 43.476, lng: -1.568 },
    { id: 17, name: 'Grande Plage', location: 'Biarritz, Pays Basque', difficulty: 'debutant', lat: 43.483, lng: -1.558 },
    { id: 18, name: 'La Milady', location: 'Biarritz, Pays Basque', difficulty: 'intermediaire', lat: 43.470, lng: -1.572 },
    { id: 19, name: 'Marbella', location: 'Biarritz, Pays Basque', difficulty: 'intermediaire', lat: 43.465, lng: -1.575 },
    { id: 20, name: 'Parlementia', location: 'Guéthary, Pays Basque', difficulty: 'expert', lat: 43.430, lng: -1.610 },
    { id: 21, name: 'Lafitenia', location: 'Saint-Jean-de-Luz, Pays Basque', difficulty: 'avance', lat: 43.413, lng: -1.625 },
    { id: 22, name: 'Erretegia', location: 'Bidart, Pays Basque', difficulty: 'intermediaire', lat: 43.442, lng: -1.590 },
    { id: 23, name: 'Pavillon Royal', location: 'Bidart, Pays Basque', difficulty: 'intermediaire', lat: 43.455, lng: -1.580 },
    { id: 24, name: 'Ilbarritz', location: 'Bidart, Pays Basque', difficulty: 'debutant', lat: 43.460, lng: -1.577 },
    { id: 25, name: 'Les Cavaliers', location: 'Anglet, Pays Basque', difficulty: 'avance', lat: 43.521, lng: -1.533 },
    { id: 26, name: 'Les Corsaires', location: 'Anglet, Pays Basque', difficulty: 'intermediaire', lat: 43.518, lng: -1.534 },
    { id: 27, name: 'La Barre', location: 'Anglet, Pays Basque', difficulty: 'avance', lat: 43.530, lng: -1.525 },
    { id: 28, name: 'Hendaye Plage', location: 'Hendaye, Pays Basque', difficulty: 'debutant', lat: 43.368, lng: -1.768 },
    { id: 29, name: 'Lacanau Océan', location: 'Lacanau, Gironde', difficulty: 'intermediaire', lat: 45.002, lng: -1.197 },
    { id: 30, name: 'La Sud Lacanau', location: 'Lacanau, Gironde', difficulty: 'avance', lat: 44.997, lng: -1.199 },
    { id: 31, name: 'Le Super Sud', location: 'Lacanau, Gironde', difficulty: 'avance', lat: 44.990, lng: -1.200 },
    { id: 32, name: 'Le Porge Océan', location: 'Le Porge, Gironde', difficulty: 'intermediaire', lat: 44.868, lng: -1.171 },
    { id: 33, name: 'Hourtin Plage', location: 'Hourtin, Gironde', difficulty: 'intermediaire', lat: 45.180, lng: -1.152 },
    { id: 34, name: 'Carcans Plage', location: 'Carcans, Gironde', difficulty: 'intermediaire', lat: 45.073, lng: -1.181 },
    { id: 35, name: 'Le Grand Crohot', location: 'Lège-Cap-Ferret, Gironde', difficulty: 'intermediaire', lat: 44.740, lng: -1.240 },
    { id: 36, name: 'La Torche', location: 'Plomeur, Bretagne', difficulty: 'intermediaire', lat: 47.842, lng: -4.348 },
    { id: 37, name: 'La Palue', location: 'Crozon, Bretagne', difficulty: 'avance', lat: 48.243, lng: -4.538 },
    { id: 38, name: 'Pors Carn', location: 'Penmarch, Bretagne', difficulty: 'intermediaire', lat: 47.797, lng: -4.368 },
    { id: 39, name: "La Presqu'île", location: 'Crozon, Bretagne', difficulty: 'avance', lat: 48.271, lng: -4.497 },
    { id: 40, name: 'Guidel Plage', location: 'Guidel, Bretagne', difficulty: 'intermediaire', lat: 47.776, lng: -3.509 },
    { id: 41, name: 'Quiberon', location: 'Quiberon, Bretagne', difficulty: 'intermediaire', lat: 47.488, lng: -3.122 },
    { id: 42, name: 'Donnant', location: 'Belle-Île, Bretagne', difficulty: 'avance', lat: 47.327, lng: -3.205 },
    { id: 43, name: 'Sainte-Barbe', location: 'Plouharnel, Bretagne', difficulty: 'intermediaire', lat: 47.606, lng: -3.104 },
    { id: 44, name: 'Tronoën', location: 'Saint-Jean-Trolimon, Bretagne', difficulty: 'intermediaire', lat: 47.832, lng: -4.310 },
    { id: 45, name: "Les Sables-d'Olonne", location: "Les Sables-d'Olonne, Vendée", difficulty: 'debutant', lat: 46.497, lng: -1.796 },
    { id: 46, name: 'Brétignolles-sur-Mer', location: 'Brétignolles, Vendée', difficulty: 'intermediaire', lat: 46.627, lng: -1.867 },
    { id: 47, name: 'La Sauzaie', location: 'Brétignolles, Vendée', difficulty: 'avance', lat: 46.632, lng: -1.870 },
    { id: 48, name: 'Bud Bud', location: 'Longeville, Vendée', difficulty: 'intermediaire', lat: 46.380, lng: -1.499 },
    { id: 49, name: 'Royan — Grande Conche', location: 'Royan, Charente-Maritime', difficulty: 'debutant', lat: 45.621, lng: -1.040 },
    { id: 50, name: 'Saint-Palais-sur-Mer', location: 'Saint-Palais, Charente-Maritime', difficulty: 'intermediaire', lat: 45.638, lng: -1.090 },
    { id: 51, name: 'Les Huttes', location: "Île d'Oléron, Charente-Maritime", difficulty: 'intermediaire', lat: 45.922, lng: -1.360 },
    { id: 52, name: 'Vert Bois', location: "Île d'Oléron, Charente-Maritime", difficulty: 'intermediaire', lat: 45.896, lng: -1.380 },
    { id: 53, name: 'La Côte Sauvage', location: 'La Palmyre, Charente-Maritime', difficulty: 'avance', lat: 45.686, lng: -1.141 },
    { id: 54, name: 'Les Boucholeurs', location: 'Île de Ré, Charente-Maritime', difficulty: 'debutant', lat: 46.197, lng: -1.411 },
    { id: 55, name: 'Tarnos', location: 'Tarnos, Landes', difficulty: 'intermediaire', lat: 43.553, lng: -1.471 },
    { id: 56, name: 'Labenne Océan', location: 'Labenne, Landes', difficulty: 'debutant', lat: 43.597, lng: -1.455 },
    { id: 57, name: 'Ondres Plage', location: 'Ondres, Landes', difficulty: 'intermediaire', lat: 43.574, lng: -1.461 },
    { id: 58, name: 'Biscarrosse Plage', location: 'Biscarrosse, Landes', difficulty: 'intermediaire', lat: 44.454, lng: -1.268 },
    { id: 59, name: 'Contis Plage', location: 'Saint-Julien-en-Born, Landes', difficulty: 'intermediaire', lat: 44.087, lng: -1.331 },
    { id: 60, name: 'Lespécier', location: 'Mimizan, Landes', difficulty: 'avance', lat: 44.228, lng: -1.289 },
    { id: 61, name: 'Le Truc Vert', location: 'Lège-Cap-Ferret, Gironde', difficulty: 'avance', lat: 44.756, lng: -1.235 },
    { id: 62, name: 'Montalivet', location: 'Vendays-Montalivet, Gironde', difficulty: 'intermediaire', lat: 45.375, lng: -1.080 },
    { id: 63, name: 'Soulac-sur-Mer', location: 'Soulac, Gironde', difficulty: 'debutant', lat: 45.513, lng: -1.125 },
    { id: 64, name: 'Le Pin Sec', location: 'Naujac, Gironde', difficulty: 'intermediaire', lat: 45.283, lng: -1.065 },
];

// ══════════════════════════════════════════════════════════════
// API — Même interface que l'ancien fichier
// ══════════════════════════════════════════════════════════════
const API = {

    // ── Auth ──────────────────────────────────────────────────
    auth: {
        async sendCode(email) {
            const sb = await getSupabase();
            const { error } = await sb.auth.signInWithOtp({ email });
            if (error) throw new Error(error.message);
            return { ok: true };
        },

        async verifyCode(email, code) {
            const sb = await getSupabase();
            const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: 'email' });
            if (error) throw new Error(error.message);
            // Créer le profil membre si premier login
            const { data: existing } = await sb.from('members').select('id').eq('email', email).single();
            if (!existing) {
                await sb.from('members').insert({ email, name: email.split('@')[0] });
            }
            return data;
        },

        async me() {
            const sb = await getSupabase();
            const { data: { user } } = await sb.auth.getUser();
            if (!user) throw new Error('Non connecté');
            const { data: profile } = await sb.from('members')
                .select('*')
                .eq('email', user.email)
                .single();
            return { ...user, ...(profile || {}), email: user.email };
        },

        async logout() {
            const sb = await getSupabase();
            await sb.auth.signOut();
            localStorage.removeItem('swellsync_token');
            localStorage.removeItem('swellsync_user');
            return { ok: true };
        },

        async updateProfile(d) {
            const sb = await getSupabase();
            const { data: { user } } = await sb.auth.getUser();
            if (!user) throw new Error('Non connecté');
            const { error } = await sb.from('members').update(d).eq('email', user.email);
            if (error) throw new Error(error.message);
            return { ok: true };
        },

        async uploadAvatar(b64orFile) {
            const sb = await getSupabase();
            const { data: { user } } = await sb.auth.getUser();
            if (!user) throw new Error('Non connecté');

            // Si c'est du base64, convertir en blob
            let file = b64orFile;
            if (typeof b64orFile === 'string' && b64orFile.startsWith('data:')) {
                const response = await fetch(b64orFile);
                file = await response.blob();
            }

            const path = `avatars/${user.id}_${Date.now()}.jpg`;
            const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true });
            if (error) throw new Error(error.message);

            const { data: urlData } = sb.storage.from('avatars').getPublicUrl(path);
            await sb.from('members').update({ avatar_url: urlData.publicUrl }).eq('email', user.email);
            return { avatar_url: urlData.publicUrl };
        },
    },

    // ── Spots ─────────────────────────────────────────────────
    spots: {
        async list() {
            try {
                const sb = await getSupabase();
                const { data, error } = await sb.from('spots').select('*').order('name');
                if (error) throw error;
                // Si la table Supabase est vide, utiliser les données fallback
                if (data && data.length > 0) return data;
            } catch (e) {
                console.warn('Supabase spots.list fallback:', e.message);
            }
            return [...FALLBACK_SPOTS];
        },

        async get(id) {
            try {
                const sb = await getSupabase();
                const { data, error } = await sb.from('spots').select('*').eq('id', id).single();
                if (error) throw error;
                if (data) return data;
            } catch (e) {
                console.warn('Supabase spots.get fallback:', e.message);
            }
            // Fallback
            const numId = typeof id === 'string' ? parseInt(id, 10) : id;
            return FALLBACK_SPOTS.find(s => s.id === numId) || FALLBACK_SPOTS[0];
        },

        // Forecast : cache Supabase (4h) → StormGlass → Open-Meteo → mock
        async forecast(spotId) {
            // 1. Récupérer les coordonnées du spot
            let lat, lng;
            try {
                const spot = await API.spots.get(spotId);
                lat = spot.lat;
                lng = spot.lng;
            } catch { }
            if (!lat || !lng) {
                const numId = typeof spotId === 'string' ? parseInt(spotId, 10) : spotId;
                const fb = FALLBACK_SPOTS.find(s => s.id === numId) || FALLBACK_SPOTS[0];
                lat = fb.lat; lng = fb.lng;
            }

            // 2. Clé de cache basée sur des blocs de 4h
            const bloc = Math.floor(new Date().getHours() / 4);
            const today = new Date().toISOString().slice(0, 10);
            const cacheKey = `${parseFloat(lat).toFixed(3)},${parseFloat(lng).toFixed(3)},${today},${bloc}`;

            // 3. Cache mémoire (évite des requêtes Supabase répétées dans la même session)
            if (_sgCache.has(cacheKey)) {
                console.log(`⚡ [Cache-RAM] Hit pour ${cacheKey}`);
                return _sgCache.get(cacheKey);
            }

            // 4. Cache Supabase (partagé entre tous les utilisateurs, persiste entre les sessions)
            try {
                const sb = await getSupabase();
                const { data: row } = await sb
                    .from('forecast_cache')
                    .select('data, source, expires_at')
                    .eq('cache_key', cacheKey)
                    .gt('expires_at', new Date().toISOString()) // pas encore expiré
                    .maybeSingle();

                if (row && row.data && row.data.length > 0) {
                    console.log(`🗄️ [Cache-Supabase] Hit — source: ${row.source} — expire: ${row.expires_at}`);
                    const result = { data: row.data, mock: false, source: row.source, cached: true };
                    _sgCache.set(cacheKey, result); // mémoriser en RAM aussi
                    return result;
                }
            } catch (cacheErr) {
                console.warn('⚠️ [Cache-Supabase] Lecture impossible :', cacheErr.message);
            }

            // 5. Pas en cache → appel StormGlass
            const sgParams = 'waveHeight,wavePeriod,waveDirection,windSpeed,windDirection,swellHeight,swellPeriod,waterTemperature,seaLevel';
            const start = new Date().toISOString();
            const end = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
            const sgUrl = `https://api.stormglass.io/v2/weather/point?lat=${lat}&lng=${lng}&params=${sgParams}&start=${start}&end=${end}&source=sg`;

            let forecastData = null;
            let forecastSource = null;

            try {
                const res = await fetch(sgUrl, { headers: { 'Authorization': STORMGLASS_KEY } });
                if (!res.ok) throw new Error('StormGlass HTTP ' + res.status);
                const raw = await res.json();
                if (!raw.hours?.length) throw new Error('No hours in response');

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
                forecastSource = 'stormglass';
                console.log(`🌊 [StormGlass] ${forecastData.length} points reçus → stockage en cache`);
            } catch (sgErr) {
                console.warn('⚠️ [StormGlass] Erreur :', sgErr.message, '— fallback Open-Meteo');
            }

            // 6. Fallback Open-Meteo si StormGlass a échoué
            if (!forecastData) {
                try {
                    const omUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_period,wave_direction,wind_wave_height,wind_wave_period&forecast_days=7&timezone=auto`;
                    const res = await fetch(omUrl);
                    if (!res.ok) throw new Error('Open-Meteo HTTP ' + res.status);
                    const om = await res.json();
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
                    forecastSource = 'open-meteo';
                    console.log(`🌐 [Open-Meteo] ${forecastData.length} points reçus → stockage en cache`);
                } catch (omErr) {
                    console.warn('⚠️ [Open-Meteo] Erreur :', omErr.message);
                }
            }

            // 7. Stocker en cache Supabase si on a des données réelles
            if (forecastData) {
                const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
                try {
                    const sb = await getSupabase();
                    await sb.from('forecast_cache').upsert({
                        cache_key: cacheKey,
                        lat: parseFloat(lat),
                        lng: parseFloat(lng),
                        source: forecastSource,
                        data: forecastData,
                        fetched_at: new Date().toISOString(),
                        expires_at: expiresAt
                    }, { onConflict: 'cache_key' });
                    console.log(`✅ [Cache-Supabase] Stocké — expire à ${expiresAt}`);
                } catch (saveErr) {
                    console.warn('⚠️ [Cache-Supabase] Écriture impossible :', saveErr.message);
                }

                const result = { data: forecastData, mock: false, source: forecastSource };
                _sgCache.set(cacheKey, result);
                setTimeout(() => _sgCache.delete(cacheKey), 4 * 60 * 60 * 1000);
                return result;
            }

            // 8. Dernier recours : données mockées (aucune API disponible)
            console.warn('🔴 [Forecast] Toutes les sources ont échoué — données mockées');
            return { data: _generateMock(lat, lng), mock: true, source: 'mock' };
        },
    },

    // ── Favoris ───────────────────────────────────────────────
    favorites: {
        async list() {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) return [];
            const { data } = await sb.from('favorites').select('*, spots(*)').eq('member_id', memberId);
            return data || [];
        },

        async add(spotId) {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) throw new Error('Non connecté');
            const { error } = await sb.from('favorites').insert({ member_id: memberId, spot_id: spotId });
            if (error) throw new Error(error.message);
            return { ok: true };
        },

        async remove(spotId) {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) throw new Error('Non connecté');
            const { error } = await sb.from('favorites').delete().eq('member_id', memberId).eq('spot_id', spotId);
            if (error) throw new Error(error.message);
            return { ok: true };
        },
    },

    // ── Alertes ───────────────────────────────────────────────
    alerts: {
        async list() {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) return [];
            const { data } = await sb.from('alerts').select('*').eq('member_id', memberId);
            return data || [];
        },

        async add(d) {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) throw new Error('Non connecté');
            const { error } = await sb.from('alerts').insert({ ...d, member_id: memberId });
            if (error) throw new Error(error.message);
            return { ok: true };
        },

        async toggle(id, enabled) {
            const sb = await getSupabase();
            const { error } = await sb.from('alerts').update({ enabled }).eq('id', id);
            if (error) throw new Error(error.message);
            return { ok: true };
        },

        async delete(id) {
            const sb = await getSupabase();
            const { error } = await sb.from('alerts').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return { ok: true };
        },
    },

    // ── Journal sessions ──────────────────────────────────────
    journal: {
        async list() {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) return [];
            const { data } = await sb.from('journal')
                .select('*')
                .eq('member_id', memberId)
                .order('created_at', { ascending: false });
            return data || [];
        },

        async add(d) {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) throw new Error('Non connecté');
            const { error } = await sb.from('journal').insert({ ...d, member_id: memberId });
            if (error) throw new Error(error.message);
            return { ok: true };
        },

        async delete(id) {
            const sb = await getSupabase();
            const { error } = await sb.from('journal').delete().eq('id', id);
            if (error) throw new Error(error.message);
            return { ok: true };
        },
    },

    // ── Notifications ─────────────────────────────────────────
    notifications: {
        async list() {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) return [];
            const { data } = await sb.from('notifications')
                .select('*')
                .eq('member_id', memberId)
                .order('created_at', { ascending: false })
                .limit(50);
            return data || [];
        },

        async count() {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) return { count: 0 };
            const { count } = await sb.from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('member_id', memberId)
                .eq('is_read', false);
            return { count: count || 0 };
        },

        async markRead() {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) return;
            await sb.from('notifications').update({ is_read: true }).eq('member_id', memberId);
            return { ok: true };
        },

        async delete(id) {
            const sb = await getSupabase();
            await sb.from('notifications').delete().eq('id', id);
            return { ok: true };
        },
    },

    // ── Stories ────────────────────────────────────────────────
    stories: {
        async list() {
            const sb = await getSupabase();
            const { data } = await sb.from('stories')
                .select('*, members(name, avatar_url)')
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });
            return data || [];
        },

        async create(story) {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) throw new Error('Non connecté');
            const { error } = await sb.from('stories').insert({ ...story, member_id: memberId });
            if (error) throw new Error(error.message);
            return { ok: true };
        },

        async delete(id) {
            const sb = await getSupabase();
            await sb.from('stories').delete().eq('id', id);
            return { ok: true };
        },

        async view(storyId) {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) return;
            await sb.from('story_views').upsert({ story_id: storyId, viewer_id: memberId });
            return { ok: true };
        },
    },

    // ── Community Posts ───────────────────────────────────────
    community: {
        async posts(tag) {
            const sb = await getSupabase();
            let query = sb.from('community_posts')
                .select('*, members(name, avatar_url)')
                .order('created_at', { ascending: false })
                .limit(50);
            if (tag && tag !== 'all') query = query.eq('tag', tag);
            const { data } = await query;
            return data || [];
        },

        async createPost(content, tag, imageUrl) {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) throw new Error('Non connecté');
            const { error } = await sb.from('community_posts').insert({
                member_id: memberId, content, tag, image_url: imageUrl
            });
            if (error) throw new Error(error.message);
            return { ok: true };
        },

        async like(postId) {
            const sb = await getSupabase();
            const { data } = await sb.from('community_posts').select('likes').eq('id', postId).single();
            await sb.from('community_posts').update({ likes: (data?.likes || 0) + 1 }).eq('id', postId);
            return { ok: true };
        },
    },

    // ── Messages ──────────────────────────────────────────────
    messages: {
        async conversations() {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) return [];
            const { data } = await sb.from('messages')
                .select('*')
                .or(`from_id.eq.${memberId},to_id.eq.${memberId}`)
                .order('created_at', { ascending: false });
            return data || [];
        },

        async getThread(userId) {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) return [];
            const { data } = await sb.from('messages')
                .select('*')
                .or(`and(from_id.eq.${memberId},to_id.eq.${userId}),and(from_id.eq.${userId},to_id.eq.${memberId})`)
                .order('created_at');
            return data || [];
        },

        async send(userId, content) {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) throw new Error('Non connecté');
            const { error } = await sb.from('messages').insert({
                from_id: memberId, to_id: userId, content
            });
            if (error) throw new Error(error.message);
            return { ok: true };
        },
    },

    // ── Badges ────────────────────────────────────────────────
    badges: {
        async list() {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) return [];
            const { data } = await sb.from('member_badges').select('*').eq('member_id', memberId);
            return data || [];
        },

        async equip(badgeId) {
            const sb = await getSupabase();
            const memberId = await _getMemberId();
            if (!memberId) throw new Error('Non connecté');
            // Déséquiper tous les autres
            await sb.from('member_badges').update({ equipped: false }).eq('member_id', memberId);
            // Équiper celui-ci
            await sb.from('member_badges').update({ equipped: true }).eq('member_id', memberId).eq('badge_id', badgeId);
            return { ok: true };
        },
    },

    // ── Contact ───────────────────────────────────────────────
    contact: {
        async send(data) {
            const sb = await getSupabase();
            const { error } = await sb.from('contact_leads').insert(data);
            if (error) throw new Error(error.message);
            return { ok: true };
        },
    },

    // ── Legacy wrappers (pour les anciennes pages pas encore migrées) ──
    get(path) { return _legacyReq('GET', path); },
    post(path, body) { return _legacyReq('POST', path, body); },
    put(path, body) { return _legacyReq('PUT', path, body); },
    patch(path, body) { return _legacyReq('PATCH', path, body); },
    del(path) { return _legacyReq('DELETE', path); },
};

// ── Données mockées de secours ────────────────────────────────
function _generateMock(lat, lng) {
    const seed = Math.abs(Math.sin(lat * lng * 1000));
    const hours = [];
    const now = new Date(); now.setMinutes(0, 0, 0);
    for (let i = 0; i < 168; i++) {
        const t = new Date(now.getTime() + i * 3600000);
        const swell = 1.0 + seed * 1.5 + Math.sin((i / 12) * Math.PI) * 0.5;
        const period = 8 + seed * 6 + Math.sin(i / 24) * 2;
        const wind = 3 + seed * 12 + Math.sin(i / 18) * 4;
        hours.push({
            time: t.toISOString(),
            waveHeight: parseFloat(Math.max(0.2, swell).toFixed(2)),
            wavePeriod: parseFloat(period.toFixed(1)),
            waveDirection: 270 + seed * 60,
            windSpeed: parseFloat(wind.toFixed(1)),
            windDirection: 220 + seed * 80,
            swellHeight: parseFloat((swell * 0.85).toFixed(2)),
            swellPeriod: parseFloat((period * 1.1).toFixed(1)),
            waterTemp: 16 + seed * 4,
            seaLevel: Math.sin((i / 12) * Math.PI) * 2.5,
            _mock: true
        });
    }
    return hours;
}

// ── Helper: vérifier si connecté ─────────────────────────────
async function requireLogin(redirectBack = location.href) {
    try {
        const me = await API.auth.me();
        return me;
    } catch {
        sessionStorage.setItem('after_login', redirectBack);
        location.href = 'home.html';
        return null;
    }
}

// ── Helpers UI ──────────────────────────────────────────────
function fmtWave(h) { return h ? parseFloat(h).toFixed(1) + 'm' : '—'; }

function condBadge(rating) {
    if (!rating) return '';
    const map = { epic: 'EPIC', good: 'GOOD', fair: 'FAIR', poor: 'POOR' };
    const cl = { epic: 'text-primary', good: 'text-green-400', fair: 'text-yellow-400', poor: 'text-red-400' };
    return `<span class="text-[10px] font-bold ${cl[rating] || ''}">${map[rating] || rating.toUpperCase()}</span>`;
}

function toast(msg, type = 'ok') {
    const t = document.createElement('div');
    t.className = `fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl text-sm font-bold shadow-xl transition-all duration-300 ${type === 'ok' ? 'bg-primary text-[#080f1a]' : 'bg-red-500 text-white'}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

// ── Initialiser Supabase au chargement ───────────────────────
getSupabase().catch(err => console.warn('Supabase init:', err.message));
