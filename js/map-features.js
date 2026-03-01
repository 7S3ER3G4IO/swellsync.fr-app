/**
 * SwellSync — Fonctionnalités carte avancées (T101-T110)
 * T101: Clustering des markers (regroupement si trop proches)
 * T102: Filtres sur la carte (type de vague, niveau, foule) — via SpotCompare
 * T103: Overlay conditions météo (couches vent/houle)
 * T104: Sessions des autres sur la carte (anonymisées)
 * T105: Bouton "Itinéraire" vers le spot (Google Maps/Apple Maps)
 * T106: Mode hors-ligne de la carte (tiles en cache Service Worker)
 * T107: Layer "densité sessions" (heatmap des zones surfées)
 * T108: Marker "Tu es ici" avec cercle de précision GPS
 * T109: Signaler un nouveau spot
 * T110: Mettre en favoris un spot depuis la carte
 */

const MapFeatures = {

    _map: null,
    _userMarker: null,
    _clusters: {},
    _heatmapLayer: null,

    // T108 — Marker "Tu es ici"
    showUserPosition(map, lat, lng, accuracy) {
        this._map = map;
        // Cercle de précision
        const circle = L.circle([lat, lng], {
            radius: accuracy || 50, color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.08, weight: 1
        }).addTo(map);
        // Marker personnalisé
        const icon = L.divIcon({
            html: '<div style="width:16px;height:16px;border-radius:50%;background:#0ea5e9;border:3px solid white;box-shadow:0 2px 8px rgba(14,165,233,.5)"></div>',
            className: '',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        });
        if (this._userMarker) this._userMarker.remove();
        this._userMarker = L.marker([lat, lng], { icon }).addTo(map).bindPopup('📍 Tu es ici');
        return { circle, marker: this._userMarker };
    },

    // T101 — Clustering des markers
    createClusteredMarkers(map, spots) {
        // MarkerClusterGroup si Leaflet.markercluster disponible
        const group = (typeof L.markerClusterGroup !== 'undefined')
            ? L.markerClusterGroup({ maxClusterRadius: 40, showCoverageOnHover: false, zoomToBoundsOnClick: true })
            : L.layerGroup();
        spots.forEach(spot => {
            if (!spot.lat || !spot.lng) return;
            const scoreColor = spot.score >= 8 ? '#10b981' : spot.score >= 5 ? '#f59e0b' : '#ef4444';
            const icon = L.divIcon({
                html: `<div style="background:${scoreColor};border:2px solid white;border-radius:10px;padding:2px 6px;font-size:11px;font-weight:800;color:white;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.4)">${spot.score || '?'}</div>`,
                className: '',
                iconAnchor: [20, 12]
            });
            const marker = L.marker([spot.lat, spot.lng], { icon });
            marker.bindPopup(this._buildPopup(spot));
            group.addLayer(marker);
        });
        map.addLayer(group);
        return group;
    },

    _buildPopup(spot) {
        const scoreColor = spot.score >= 8 ? '#10b981' : spot.score >= 5 ? '#f59e0b' : '#ef4444';
        return `<div style="font-family:'Inter',sans-serif;min-width:160px">
      <strong style="font-size:14px">${spot.name || spot.slug}</strong>
      <div style="font-size:12px;color:#64748b;margin-bottom:6px">${spot.region || ''} · ${spot.type || ''}</div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
        <span style="background:${scoreColor};color:white;border-radius:6px;padding:2px 8px;font-weight:700;font-size:13px">${spot.score || '?'}/10</span>
        <span style="font-size:12px;color:#64748b">${spot.height || '?'}m · ${spot.period || '?'}s</span>
      </div>
      <div style="display:flex;gap:6px">
        <button onclick="MapFeatures.navigateTo(${spot.lat},${spot.lng},'${spot.name}')" style="flex:1;background:#0ea5e9;border:none;border-radius:8px;padding:6px;color:white;font-size:12px;cursor:pointer;font-weight:600">🗺️ Itinéraire</button>
        <button onclick="MapFeatures.toggleFavorite('${spot.slug}')" style="background:rgba(255,255,255,.1);border:1px solid rgba(0,0,0,.1);border-radius:8px;padding:6px 8px;cursor:pointer;font-size:14px">❤️</button>
      </div>
    </div>`;
    },

    // T105 — Itinéraire vers le spot
    navigateTo(lat, lng, name) {
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const url = isIOS
            ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
            : `https://maps.google.com/?daddr=${lat},${lng}&travelmode=driving`;
        if (typeof showToast !== 'undefined') showToast(`🗺️ Ouverture de l'itinéraire vers ${name}...`, 'info');
        setTimeout(() => window.open(url, '_blank'), 500);
    },

    // T103 — Overlay conditions météo (simulation avec tuiles colorées)
    toggleWindLayer(map) {
        if (this._windLayer) { map.removeLayer(this._windLayer); this._windLayer = null; return false; }
        // Utiliser une couche colorée basée sur les vents (simulation)
        this._windLayer = L.tileLayer('https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=DEMO', {
            opacity: 0.5, attribution: '© OpenWeatherMap'
        }).addTo(map);
        return true;
    },

    // T107 — Heatmap des sessions
    renderSessionHeatmap(map, sessions) {
        if (!sessions?.length) return;
        // Utiliser Leaflet.heat si disponible
        if (typeof L.heatLayer !== 'undefined') {
            const points = sessions.map(s => [s.spot_lat, s.spot_lng, 1]);
            if (this._heatmapLayer) map.removeLayer(this._heatmapLayer);
            this._heatmapLayer = L.heatLayer(points, { radius: 25, blur: 15, maxZoom: 17, gradient: { 0.4: '#0ea5e9', 0.7: '#f59e0b', 1.0: '#ef4444' } }).addTo(map);
        }
    },

    // T104 — Sessions anonymisées des autres surfeurs
    async loadCommunitySessions(map) {
        try {
            const since = new Date(Date.now() - 7 * 86400000).toISOString();
            const { data } = await supabase.from('surf_sessions').select('spot_lat, spot_lng, spot_name, score').gte('created_at', since).eq('is_public', true).limit(100);
            if (!data?.length) return;
            const icon = L.divIcon({ html: '<div style="width:8px;height:8px;border-radius:50%;background:rgba(16,185,129,.6);border:1px solid #10b981"></div>', className: '', iconSize: [8, 8] });
            const layer = L.layerGroup();
            data.forEach(s => {
                if (s.spot_lat && s.spot_lng) {
                    L.marker([s.spot_lat, s.spot_lng], { icon }).bindPopup(`🏄 Session récente — ${s.spot_name || 'Spot'}`).addTo(layer);
                }
            });
            map.addLayer(layer);
            return layer;
        } catch { }
    },

    // T110 — Favoris depuis la carte
    toggleFavorite(spotSlug) {
        const favs = JSON.parse(localStorage.getItem('sw_fav_spots') || '[]');
        const idx = favs.indexOf(spotSlug);
        if (idx >= 0) { favs.splice(idx, 1); if (typeof showToast !== 'undefined') showToast('💔 Retiré des favoris', 'info'); }
        else { favs.push(spotSlug); if (typeof showToast !== 'undefined') showToast('❤️ Spot ajouté aux favoris !', 'success'); }
        localStorage.setItem('sw_fav_spots', JSON.stringify(favs));
    },

    isFavorite: (slug) => JSON.parse(localStorage.getItem('sw_fav_spots') || '[]').includes(slug),
    getFavorites: () => JSON.parse(localStorage.getItem('sw_fav_spots') || '[]'),

    // T109 — Signaler un nouveau spot
    async reportNewSpot(lat, lng) {
        const name = prompt('Nom du spot ?');
        if (!name) return;
        const type = prompt('Type de vague ? (beach break, reef, point break)') || 'beach break';
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('spot_reports').insert({ latitude: lat, longitude: lng, name, type, reported_by: user?.id, status: 'pending', created_at: new Date().toISOString() });
            if (typeof showToast !== 'undefined') showToast('🗺️ Spot signalé ! Merci 🤙', 'success');
        } catch { if (typeof showToast !== 'undefined') showToast('Erreur, réessaie', 'error'); }
    },

    // T106 — Mode hors-ligne carte (tiles en cache SW)
    cacheTiles(map, bounds, zooms = [8, 9, 10, 11]) {
        // Le Service Worker intercepte les requêtes de tuiles Leaflet
        // On peut précharger en faisant défiler la zone
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CACHE_MAP_TILES', bounds: bounds.toBBoxString(), zooms });
            if (typeof showToast !== 'undefined') showToast('🗺️ Carte mise en cache hors-ligne', 'success');
        }
    },

    // Contrôles sur la carte (filtres visuels)
    addFilterControls(map) {
        const control = L.control({ position: 'topright' });
        control.onAdd = () => {
            const div = L.DomUtil.create('div');
            div.style.cssText = 'background:#0f172a;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:8px;display:flex;flex-direction:column;gap:6px';
            div.innerHTML = `
        <button id="ctrl-heatmap" onclick="MapFeatures._toggleCtrl('heatmap')" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:6px 10px;color:#94a3b8;font-size:11px;cursor:pointer;text-align:left">🌡️ Heatmap</button>
        <button id="ctrl-wind" onclick="MapFeatures._toggleCtrl('wind')" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:6px 10px;color:#94a3b8;font-size:11px;cursor:pointer;text-align:left">💨 Vent</button>
        <button id="ctrl-sessions" onclick="MapFeatures._toggleCtrl('sessions')" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:6px 10px;color:#94a3b8;font-size:11px;cursor:pointer;text-align:left">👥 Sessions</button>
        <button onclick="navigator.geolocation.getCurrentPosition(p=>MapFeatures.showUserPosition(map,p.coords.latitude,p.coords.longitude,p.coords.accuracy))" style="background:rgba(14,165,233,.1);border:1px solid rgba(14,165,233,.2);border-radius:8px;padding:6px 10px;color:#0ea5e9;font-size:11px;cursor:pointer;font-weight:700">📍 Ma position</button>`;
            L.DomEvent.disableClickPropagation(div);
            return div;
        };
        control.addTo(map);
    },

    _activeControls: {},
    async _toggleCtrl(type) {
        const btn = document.getElementById(`ctrl-${type}`);
        const active = !this._activeControls[type];
        this._activeControls[type] = active;
        if (btn) btn.style.background = active ? 'rgba(14,165,233,.15)' : 'rgba(255,255,255,.04)';
        if (type === 'wind') this.toggleWindLayer(this._map);
        if (type === 'sessions') await this.loadCommunitySessions(this._map);
    }
};

window.MapFeatures = MapFeatures;
