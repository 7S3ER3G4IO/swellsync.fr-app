/**
 * SwellSync — Géolocalisation & Spot le plus proche
 * 1. Affiche un pop-up custom premium pour demander la permission
 * 2. Au clic "Autoriser" → déclenche navigator.geolocation (popup natif Chrome)
 * 3. Si accordé → affiche le spot le plus proche
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'swellsync_geo_dismissed';
    const CACHE_KEY = 'swellsync_nearest_spot';
    const CACHE_TTL = 30 * 60 * 1000; // 30 min
    const ASK_KEY = 'swellsync_geo_asked';

    // ─────────────────────────────────────────────────────────────
    // Helper i18n — fallback FR si SwellI18n pas encore chargé
    // ─────────────────────────────────────────────────────────────
    function t(key, fallback) {
        if (window.SwellI18n && window.SwellI18n.isLoaded) return window.SwellI18n.t(key) || fallback;
        return fallback;
    }

    // ─────────────────────────────────────────────────────────────
    // Utilitaires
    // ─────────────────────────────────────────────────────────────
    function haversineKm(lat1, lon1, lat2, lon2) {
        const R = 6371, toRad = d => d * Math.PI / 180;
        const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function minutesToDrive(km) {
        const mins = Math.round((km / 80) * 60);
        if (mins < 60) return `${mins} ${t('geoloc.min_drive', 'min')}`;
        return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}`;
    }

    function removeById(id) {
        const el = document.getElementById(id);
        if (el) {
            el.style.animation = 'geoSlideDown 0.3s cubic-bezier(0.4,0,1,1) forwards';
            setTimeout(() => el.remove(), 300);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Pop-up résultat : Spot le plus proche
    // ─────────────────────────────────────────────────────────────
    function injectResultPopup(spot, distKm) {
        if (document.getElementById('geo-result-popup')) return;
        removeById('geo-ask-popup');

        const drivetime = minutesToDrive(distKm);
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;

        const qualityColor = (spot.quality || 7) >= 8 ? '#4ade80' : (spot.quality || 7) >= 6 ? '#fbbf24' : '#f87171';
        const qualityLabel = (spot.quality || 7) >= 8
            ? t('spots.quality_excellent', 'Excellent')
            : (spot.quality || 7) >= 6
                ? t('spots.quality_good', 'Bon')
                : t('spots.quality_flat', 'Calme');


        const el = document.createElement('div');
        el.id = 'geo-result-popup';
        el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9800;width:min(440px,calc(100vw - 32px));animation:geoSlideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;`;

        el.innerHTML = `
        <style>
            @keyframes geoSlideUp   { from{opacity:0;transform:translateX(-50%) translateY(32px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
            @keyframes geoSlideDown { from{opacity:1;transform:translateX(-50%) translateY(0)} to{opacity:0;transform:translateX(-50%) translateY(32px)} }
            @keyframes geoPulse     { 0%,100%{box-shadow:0 0 0 0 rgba(0,186,214,0.4)} 50%{box-shadow:0 0 0 8px rgba(0,186,214,0)} }
            #geo-result-popup .geo-card {
                background: rgba(4,12,15,0.96);
                border: 1px solid rgba(0,186,214,0.25);
                border-radius: 24px;
                padding: 20px;
                backdrop-filter: blur(28px);
                -webkit-backdrop-filter: blur(28px);
                box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,186,214,0.08), inset 0 1px 0 rgba(255,255,255,0.05);
            }
            #geo-result-popup .geo-btn { display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:12px;font-size:12px;font-weight:800;font-family:Lexend,sans-serif;cursor:pointer;text-decoration:none;transition:all 0.2s;border:none; }
            #geo-result-popup .geo-btn-primary { background:linear-gradient(135deg,#00bad6,#0090a8);color:#fff;box-shadow:0 4px 16px rgba(0,186,214,0.3); }
            #geo-result-popup .geo-btn-primary:hover { box-shadow:0 8px 24px rgba(0,186,214,0.5);transform:translateY(-1px); }
            #geo-result-popup .geo-btn-ghost { background:rgba(255,255,255,0.05);color:#94a3b8;border:1px solid rgba(255,255,255,0.08); }
            #geo-result-popup .geo-btn-ghost:hover { background:rgba(255,255,255,0.1);color:#fff; }
            #geo-result-popup .geo-close { position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.06);border:none;color:#64748b;cursor:pointer;border-radius:10px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;transition:all 0.2s;font-family:sans-serif; }
            #geo-result-popup .geo-close:hover { background:rgba(255,255,255,0.12);color:#e2e8f0; }
        </style>
        <div class="geo-card" style="position:relative">
            <button class="geo-close" onclick="(function(){var e=document.getElementById('geo-result-popup');if(e){e.style.animation='geoSlideDown 0.3s forwards';setTimeout(function(){e.remove()},300);}localStorage.setItem('${STORAGE_KEY}',Date.now())})()">✕</button>

            <!-- Header -->
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
                <div style="width:48px;height:48px;border-radius:16px;background:linear-gradient(135deg,rgba(0,186,214,0.2),rgba(0,144,168,0.1));display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;animation:geoPulse 2s infinite;border:1px solid rgba(0,186,214,0.25)">📍</div>
                <div>
                    <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;color:#00bad6;margin-bottom:3px;font-family:Lexend,sans-serif">📡 ${t('geoloc.result_badge', 'Spot le plus proche de toi')}</div>
                    <div style="font-weight:900;color:#fff;font-size:17px;font-family:Lexend,sans-serif;line-height:1.2">${spot.name || 'Inconnu'}</div>
                    <div style="font-size:11px;color:#475569;margin-top:1px">${spot.location || spot.region || ''}</div>
                </div>
            </div>

            <!-- Stats -->
            <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
                <div style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;background:rgba(0,186,214,0.08);border:1px solid rgba(0,186,214,0.15)">
                    <span style="font-size:14px">🌊</span>
                    <span style="font-size:12px;font-weight:800;color:#00bad6;font-family:Lexend,sans-serif">${distKm < 1 ? '<1' : Math.round(distKm)} km</span>
                    <span style="font-size:11px;color:#475569">${t('geoloc.from_you', 'de toi')}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07)">
                    <span style="font-size:14px">🚗</span>
                    <span style="font-size:12px;font-weight:800;color:#e2e8f0;font-family:Lexend,sans-serif">${drivetime}</span>
                </div>
                ${spot.quality ? `<div style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07)">
                    <span style="width:8px;height:8px;border-radius:50%;background:${qualityColor};display:inline-block"></span>
                    <span style="font-size:12px;font-weight:800;color:${qualityColor};font-family:Lexend,sans-serif">${qualityLabel}</span>
                </div>` : ''}
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <a href="spot_detail.html?id=${spot.id}" class="geo-btn geo-btn-primary">
                    <span style="font-size:15px">🌊</span> ${t('geoloc.see_conditions', 'Voir les conditions')}
                </a>
                <a href="${mapsUrl}" target="_blank" rel="noopener" class="geo-btn geo-btn-ghost">
                    <span style="font-size:15px">🗺️</span> ${t('geoloc.itinerary', 'Itinéraire')}
                </a>
            </div>
        </div>`;

        document.body.appendChild(el);

        // Auto-close 15s
        setTimeout(() => removeById('geo-result-popup'), 15000);
    }

    // ─────────────────────────────────────────────────────────────
    // Pop-up de demande custom (avant la permission native)
    // ─────────────────────────────────────────────────────────────
    function injectAskPopup() {
        if (document.getElementById('geo-ask-popup')) return;

        const el = document.createElement('div');
        el.id = 'geo-ask-popup';
        el.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9800;width:min(420px,calc(100vw - 32px));animation:geoAskIn 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards;`;

        el.innerHTML = `
        <style>
            @keyframes geoAskIn   { from{opacity:0;transform:translateX(-50%) translateY(40px) scale(0.95)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
            @keyframes geoAskOut  { from{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} to{opacity:0;transform:translateX(-50%) translateY(40px) scale(0.95)} }
            @keyframes waveAnim   { 0%,100%{transform:scaleY(0.5)} 50%{transform:scaleY(1)} }
            @keyframes gpsRing    { 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(2.2);opacity:0} }
            #geo-ask-popup .ask-card {
                background: rgba(4,12,15,0.97);
                border: 1px solid rgba(0,186,214,0.3);
                border-radius: 26px;
                padding: 24px;
                backdrop-filter: blur(32px);
                -webkit-backdrop-filter: blur(32px);
                box-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,186,214,0.06), inset 0 1px 0 rgba(255,255,255,0.06);
            }
            #geo-ask-popup .ask-allow {
                display:flex;align-items:center;justify-content:center;gap:8px;
                width:100%;padding:13px;border-radius:14px;
                background:linear-gradient(135deg,#00bad6 0%,#0090a8 100%);
                color:#fff;font-size:13px;font-weight:900;font-family:Lexend,sans-serif;
                cursor:pointer;border:none;transition:all 0.2s;
                box-shadow: 0 6px 20px rgba(0,186,214,0.35);
                letter-spacing:0.02em;
            }
            #geo-ask-popup .ask-allow:hover { box-shadow:0 10px 30px rgba(0,186,214,0.5);transform:translateY(-2px); }
            #geo-ask-popup .ask-allow:active { transform:translateY(0);box-shadow:0 4px 12px rgba(0,186,214,0.3); }
            #geo-ask-popup .ask-deny {
                display:flex;align-items:center;justify-content:center;
                width:100%;padding:10px;border-radius:12px;
                background:transparent;color:#475569;
                font-size:12px;font-weight:700;font-family:Lexend,sans-serif;
                cursor:pointer;border:none;transition:color 0.2s;margin-top:8px;
            }
            #geo-ask-popup .ask-deny:hover { color:#94a3b8; }
            .geo-wave-bar { display:inline-block;width:4px;border-radius:99px;background:#00bad6;animation:waveAnim 1s ease-in-out infinite; }
        </style>
        <div class="ask-card">

            <!-- GPS icon animé -->
            <div style="display:flex;justify-content:center;margin-bottom:20px">
                <div style="position:relative;width:64px;height:64px">
                    <div style="position:absolute;inset:0;border-radius:50%;background:rgba(0,186,214,0.15);animation:gpsRing 1.8s ease-out infinite"></div>
                    <div style="position:absolute;inset:8px;border-radius:50%;background:rgba(0,186,214,0.2);animation:gpsRing 1.8s ease-out 0.6s infinite"></div>
                    <div style="position:relative;z-index:1;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,rgba(0,186,214,0.25),rgba(0,144,168,0.15));border:1px solid rgba(0,186,214,0.4);display:flex;align-items:center;justify-content:center">
                        <span class="material-symbols-outlined" style="font-size:28px;color:#00bad6">my_location</span>
                    </div>
                </div>
            </div>

            <!-- Titre -->
            <div style="text-align:center;margin-bottom:6px">
                <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.14em;color:#00bad6;font-family:Lexend,sans-serif;margin-bottom:8px">SwellSync · Géolocalisation</div>
                <div style="font-size:20px;font-weight:900;color:#fff;font-family:Lexend,sans-serif;line-height:1.2;margin-bottom:10px">${t('geoloc.ask_title', 'Trouve ton spot')}<br><span style="color:#00bad6">${t('geoloc.ask_subtitle', 'le plus proche 🌊')}</span></div>
                <div style="font-size:12px;color:#64748b;line-height:1.6;font-family:Lexend,sans-serif">
                    ${t('geoloc.ask_desc', 'Autorise SwellSync à accéder à ta position pour afficher les conditions de surf')} <strong style="color:#94a3b8">${t('geoloc.ask_radius', 'à moins de 30 km')}</strong> ${t('geoloc.ask_desc2', 'de toi en temps réel.')}
                </div>
            </div>

            <!-- Bénéfices -->
            <div style="display:flex;gap:8px;margin:18px 0;justify-content:center;flex-wrap:wrap">
                <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;background:rgba(0,186,214,0.07);border:1px solid rgba(0,186,214,0.12)">
                    <span style="font-size:13px">📍</span>
                    <span style="font-size:11px;font-weight:700;color:#94a3b8;font-family:Lexend,sans-serif">${t('geoloc.nearest_spot', 'Spot le plus proche')}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.12)">
                    <span style="font-size:13px">🌊</span>
                    <span style="font-size:11px;font-weight:700;color:#94a3b8;font-family:Lexend,sans-serif">${t('geoloc.live_conditions', 'Conditions en direct')}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;background:rgba(251,191,36,0.07);border:1px solid rgba(251,191,36,0.12)">
                    <span style="font-size:13px">🚗</span>
                    <span style="font-size:11px;font-weight:700;color:#94a3b8;font-family:Lexend,sans-serif">${t('geoloc.drive_time', 'Temps de trajet')}</span>
                </div>
            </div>

            <!-- Equalizer vague -->
            <div style="display:flex;align-items:flex-end;justify-content:center;gap:4px;height:24px;margin-bottom:20px;opacity:0.6">
                ${[1, 1.5, 0.7, 1.8, 0.9, 1.4, 0.6, 1.7, 0.8, 1.3, 0.5, 1.6, 0.7, 1.9, 1, 1.4, 0.8, 1.6, 0.6, 1.2].map((h, i) =>
            `<div class="geo-wave-bar" style="height:${h * 12}px;animation-delay:${i * 0.07}s;opacity:${0.4 + h * 0.3}"></div>`
        ).join('')}
            </div>

            <!-- Boutons -->
            <button class="ask-allow" id="geo-allow-btn">
                <span class="material-symbols-outlined" style="font-size:18px">my_location</span>
                ${t('geoloc.allow', 'Autoriser la localisation')}
            </button>
            <button class="ask-deny" id="geo-deny-btn">${t('geoloc.deny', 'Non merci, peut-être plus tard')}</button>

            <div style="text-align:center;margin-top:14px;font-size:10px;color:#1e293b;font-family:Lexend,sans-serif">
                ${t('geoloc.privacy', '🔒 Position jamais stockée ni partagée · Utilisée uniquement en local')}
            </div>
        </div>`;

        document.body.appendChild(el);

        // Bouton Autoriser
        document.getElementById('geo-allow-btn').addEventListener('click', () => {
            const btn = document.getElementById('geo-allow-btn');
            if (btn) {
                btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;animation:spin 1s linear infinite">sync</span> ${t('geoloc.loading', 'Localisation en cours…')}`;
                btn.style.opacity = '0.7';
                btn.disabled = true;
            }
            // Ajouter @keyframes spin si pas déjà présent
            if (!document.getElementById('geo-spin-style')) {
                const s = document.createElement('style');
                s.id = 'geo-spin-style';
                s.textContent = '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
                document.head.appendChild(s);
            }
            sessionStorage.setItem(ASK_KEY, '1');
            navigator.geolocation.getCurrentPosition(
                pos => findNearestSpot(pos.coords.latitude, pos.coords.longitude),
                () => removeById('geo-ask-popup'),
                { timeout: 10000, maximumAge: 600000 }
            );
        });

        // Bouton Refus
        document.getElementById('geo-deny-btn').addEventListener('click', () => {
            localStorage.setItem(STORAGE_KEY, Date.now());
            removeById('geo-ask-popup');
        });
    }

    // ─────────────────────────────────────────────────────────────
    // Trouver le spot le plus proche
    // ─────────────────────────────────────────────────────────────
    async function findNearestSpot(lat, lng) {
        // Cache
        try {
            const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            if (cached && Date.now() - cached.ts < CACHE_TTL && cached.lat === Math.round(lat * 10) / 10) {
                injectResultPopup(cached.spot, cached.dist);
                return;
            }
        } catch (e) { }

        // Charger spots
        let spots;
        try {
            const r = await fetch('/api/spots');
            spots = await r.json();
        } catch (e) {
            // fallback spots statiques
            spots = [
                { id: 'hossegor', name: 'Hossegor — La Gravière', location: 'Landes', lat: 43.66, lng: -1.44, quality: 9 },
                { id: 'biarritz', name: 'Biarritz — Grande Plage', location: 'Pays Basque', lat: 43.48, lng: -1.55, quality: 7 },
                { id: 'lacanau', name: 'Lacanau Océan', location: 'Gironde', lat: 44.98, lng: -1.20, quality: 7 },
                { id: 'latorche', name: 'La Torche', location: 'Bretagne', lat: 47.84, lng: -4.36, quality: 8 },
            ];
        }

        if (!Array.isArray(spots) || !spots.length) { removeById('geo-ask-popup'); return; }

        let nearest = null, minDist = Infinity;
        spots.forEach(s => {
            if (!s.lat || !s.lng) return;
            const d = haversineKm(lat, lng, s.lat, s.lng);
            if (d < minDist) { minDist = d; nearest = s; }
        });

        if (!nearest) { removeById('geo-ask-popup'); return; }

        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ spot: nearest, dist: minDist, ts: Date.now(), lat: Math.round(lat * 10) / 10 }));
        } catch (e) { }

        injectResultPopup(nearest, minDist);
    }

    // ─────────────────────────────────────────────────────────────
    // Init
    // ─────────────────────────────────────────────────────────────
    function initGeoLoc() {
        if (sessionStorage.getItem(ASK_KEY)) return;

        try {
            const dismissed = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
            if (Date.now() - dismissed < 24 * 3600 * 1000) return;
        } catch (e) { }

        const path = window.location.pathname;
        const href = window.location.href;
        const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/') ||
            href.endsWith('index.html') ||
            (window.location.protocol === 'file:' && href.includes('index.html'));

        if (!isHome) return;
        if (!navigator.geolocation) return;

        // Afficher le pop-up custom après 2.5s
        setTimeout(injectAskPopup, 2500);
    }

    if (!window._geolocInitDone) {
        window._geolocInitDone = true;
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initGeoLoc, { once: true });
        } else {
            initGeoLoc();
        }
    }
})();
