/**
 * SwellSync — Widgets Home avancés (T1-T10)
 * T1: Afficher la houle du spot préféré EN PREMIER
 * T2: Widget "Meilleur créneau du jour"
 * T3: Bouton Quick-launch "Session maintenant"
 * T6: Indicateur visuel de vent (direction + beaufort)
 * T7: Partager les conditions du jour (Web Share API)
 * T8: Spots proches de moi (géolocalisation)
 * T9: Badge "Trending" sur les spots
 * T10: Animation skeleton loading
 */

const HomeWidgets = {

    // T10 — Skeleton loading animation
    showSkeleton(containerId, count = 3) {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = Array.from({ length: count }, () => `
      <div style="background:rgba(255,255,255,.04);border-radius:20px;padding:18px;margin-bottom:12px;animation:skeleton-pulse 1.5s ease-in-out infinite">
        <div style="background:rgba(255,255,255,.06);border-radius:8px;height:14px;width:60%;margin-bottom:10px"></div>
        <div style="background:rgba(255,255,255,.06);border-radius:8px;height:40px;width:40%;margin-bottom:8px"></div>
        <div style="background:rgba(255,255,255,.06);border-radius:8px;height:10px;width:80%"></div>
      </div>`).join('') + `<style>@keyframes skeleton-pulse{0%,100%{opacity:.6}50%{opacity:1}}</style>`;
    },

    // T1 — Widget spot préféré en premier
    async renderFavoriteSpotWidget(containerId = 'home-fav-spot') {
        const el = document.getElementById(containerId);
        if (!el) return;
        this.showSkeleton(containerId, 1);
        const favSpot = localStorage.getItem('sw_fav_spot') || 'hossegor';
        try {
            const { data } = await supabase.from('spot_forecasts').select('*').eq('spot_slug', favSpot).order('forecast_date').limit(1).single();
            if (!data) { el.innerHTML = this._noDataWidget(); return; }
            const scoreColor = data.score >= 8 ? '#10b981' : data.score >= 5 ? '#f59e0b' : '#ef4444';
            el.innerHTML = `
        <div style="background:linear-gradient(135deg,rgba(14,165,233,.1),rgba(16,185,129,.05));border:1px solid rgba(14,165,233,.2);border-radius:20px;padding:18px;margin-bottom:14px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
            <div>
              <div style="font-size:11px;color:#0ea5e9;font-weight:700;letter-spacing:.5px">⭐ TON SPOT PRÉFÉRÉ</div>
              <div style="font-size:20px;font-weight:900;color:#f1f5f9;margin-top:2px">${data.spot_name || favSpot}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:36px;font-weight:900;color:${scoreColor}">${data.score}/10</div>
              <div style="font-size:11px;color:#64748b">maintenant</div>
            </div>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <span style="font-size:13px;color:#94a3b8">🌊 ${data.wave_height || '?'}m</span>
            <span style="font-size:13px;color:#94a3b8">⏱️ ${data.wave_period || '?'}s</span>
            <span style="font-size:13px;color:#94a3b8">💨 ${data.wind_speed || '?'} km/h</span>
          </div>
          <button onclick="HomeWidgets.quickLaunchSession('${favSpot}','${data.spot_name || favSpot}')" style="width:100%;margin-top:12px;background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;border-radius:14px;padding:12px;color:white;font-weight:700;font-size:15px;cursor:pointer">
            🏄 Session maintenant →
          </button>
        </div>`;
        } catch { el.innerHTML = this._noDataWidget(); }
    },

    // T2 — Meilleur créneau du jour
    async renderBestSlot(containerId = 'home-best-slot') {
        const el = document.getElementById(containerId);
        if (!el) return;
        const favSpot = localStorage.getItem('sw_fav_spot') || 'hossegor';
        try {
            const { data } = await supabase.from('spot_forecasts').select('*').eq('spot_slug', favSpot).order('score', { ascending: false }).limit(1).single();
            if (!data) return;
            const hour = new Date(data.forecast_date).getHours();
            el.innerHTML = `
        <div style="background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.15);border-radius:16px;padding:14px;margin-bottom:14px;display:flex;align-items:center;gap:12px">
          <div style="font-size:32px">⏰</div>
          <div>
            <div style="font-size:12px;color:#f59e0b;font-weight:700">MEILLEUR CRÉNEAU DU JOUR</div>
            <div style="font-size:20px;font-weight:800;color:#f1f5f9">${hour}h00 — ${hour + 2}h00</div>
            <div style="font-size:12px;color:#94a3b8">Score prévu: ${data.score}/10 · ${data.wave_height}m · ${data.wind_speed} km/h</div>
          </div>
        </div>`;
        } catch { }
    },

    // T3 — Quick-launch session
    quickLaunchSession(spotSlug, spotName) {
        localStorage.setItem('sw_quick_session_spot', spotSlug);
        localStorage.setItem('sw_quick_session_name', spotName);
        if (typeof showToast !== 'undefined') showToast(`🏄 Spot sélectionné: ${spotName}`, 'success');
        setTimeout(() => window.location.href = '/pages/session-live.html', 600);
    },

    // T6 — Indicateur vent Beaufort
    renderWindWidget(windKmh, direction = 'NW', containerId = 'home-wind') {
        const el = document.getElementById(containerId);
        if (!el) return;
        const beaufort = windKmh < 2 ? 0 : windKmh < 6 ? 1 : windKmh < 12 ? 2 : windKmh < 20 ? 3 : windKmh < 29 ? 4 : windKmh < 39 ? 5 : windKmh < 50 ? 6 : windKmh < 62 ? 7 : 8;
        const labels = ['Calme', 'Très légère brise', 'Légère brise', 'Petite brise', 'Jolie brise', 'Bonne brise', 'Grand fraîchit', 'Grand vent frais', 'Coup de vent'];
        const colors = ['#10b981', '#10b981', '#10b981', '#10b981', '#f59e0b', '#f59e0b', '#f97316', '#ef4444', '#ef4444'];
        const dirAngles = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
        const angle = dirAngles[direction.replace('O', 'W')] || 0;
        el.innerHTML = `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:14px;display:flex;align-items:center;gap:12px">
        <div style="width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.04);border:2px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:22px;transform:rotate(${angle}deg)">🧭</div>
        <div>
          <div style="font-size:11px;color:#64748b;font-weight:600">💨 VENT</div>
          <div style="font-size:20px;font-weight:900;color:${colors[beaufort]}">${windKmh} km/h <span style="font-size:13px">${direction}</span></div>
          <div style="font-size:12px;color:#94a3b8">Beaufort ${beaufort} — ${labels[beaufort]}</div>
        </div>
      </div>`;
    },

    // T7 — Partager conditions du jour
    async shareConditions(spotName, score, height, wind) {
        const text = `🌊 Conditions surf aujourd'hui à ${spotName} sur SwellSync :\n⭐ Score: ${score}/10\n🌊 Houle: ${height}m\n💨 Vent: ${wind} km/h\n\nSuis tes spots favoris sur swellsync.fr`;
        if (navigator.share) {
            try { await navigator.share({ title: `Conditions surf — ${spotName}`, text, url: 'https://swellsync.fr' }); return; } catch { }
        }
        await navigator.clipboard.writeText(text).catch(() => { });
        if (typeof showToast !== 'undefined') showToast('📋 Conditions copiées !', 'success');
    },

    // T8 — Spots proches (géolocalisation)
    async renderNearbySpots(containerId = 'home-nearby') {
        const el = document.getElementById(containerId);
        if (!el) return;
        if (!navigator.geolocation) return;
        el.innerHTML = '<div style="padding:12px;text-align:center;color:#64748b;font-size:13px">📍 Localisation en cours...</div>';
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            const { latitude, longitude } = coords;
            const spotsWithCoords = [
                { slug: 'biarritz', name: 'Biarritz', lat: 43.4833, lng: -1.5584, emoji: '🌊' },
                { slug: 'hossegor', name: 'Hossegor', lat: 43.6667, lng: -1.4333, emoji: '💪' },
                { slug: 'lacanau', name: 'Lacanau', lat: 44.9667, lng: -1.2000, emoji: '🌴' },
                { slug: 'capbreton', name: 'Capbreton', lat: 43.6373, lng: -1.4400, emoji: '☀️' },
                { slug: 'la-torche', name: 'La Torche', lat: 47.8333, lng: -4.3500, emoji: '🏴' },
                { slug: 'seignosse', name: 'Seignosse', lat: 43.6833, lng: -1.4000, emoji: '🔥' },
            ];
            const dist = (lat1, lng1, lat2, lng2) => Math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2) * 111;
            const nearby = spotsWithCoords.map(s => ({ ...s, distance: dist(latitude, longitude, s.lat, s.lng) })).sort((a, b) => a.distance - b.distance).slice(0, 3);
            el.innerHTML = `
        <div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:10px">📍 SPOTS PROCHES DE TOI</div>
        ${nearby.map(s => `
          <a href="/spots/${s.slug}.html" style="display:flex;align-items:center;gap:10px;padding:10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;margin-bottom:8px;text-decoration:none">
            <span style="font-size:22px">${s.emoji}</span>
            <div style="flex:1"><div style="font-weight:700;color:#f1f5f9;font-size:14px">${s.name}</div></div>
            <div style="font-size:12px;color:#64748b">${Math.round(s.distance)} km</div>
          </a>`).join('')}`;
        }, () => { if (el) el.innerHTML = ''; });
    },

    // T9 — Badge "Trending" (spots avec le plus de sessions du jour)
    async renderTrendingBadges(containerId = 'home-trending') {
        const el = document.getElementById(containerId);
        if (!el) return;
        try {
            const today = new Date().toISOString().slice(0, 10);
            const { data } = await supabase.from('surf_sessions').select('spot_name').gte('started_at', today).limit(500);
            const counts = {};
            data?.forEach(s => { if (s.spot_name) counts[s.spot_name] = (counts[s.spot_name] || 0) + 1; });
            const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
            el.innerHTML = top.map(([name, cnt]) => `<div style="display:inline-flex;align-items:center;gap:4px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:20px;padding:4px 10px;margin-right:6px;margin-bottom:6px"><span style="color:#ef4444;font-size:12px;font-weight:700">🔥 TRENDING</span><span style="font-size:12px;color:#f1f5f9">${name}</span><span style="font-size:11px;color:#64748b">${cnt} sessions</span></div>`).join('');
        } catch { }
    },

    _noDataWidget: () => `<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:20px;text-align:center;margin-bottom:14px"><div style="font-size:24px;margin-bottom:8px">🌊</div><div style="font-size:14px;color:#64748b">Données en cours de chargement...</div></div>`
};

window.HomeWidgets = HomeWidgets;
