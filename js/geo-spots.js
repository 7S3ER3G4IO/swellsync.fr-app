/**
 * SwellSync — Géolocalisation : spots proches de moi + spot favori home
 * T8: Spots proches basé sur géoloc réelle
 * T108: Marker "Tu es ici" avec cercle de précision
 */

const GeoSpots = {
    _userPos: null,
    _watchId: null,

    // Obtenir la position utilisateur (avec cache 5 minutes)
    async getPosition(force = false) {
        if (!force && this._userPos && (Date.now() - this._userPos.ts < 300000)) {
            return this._userPos;
        }
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) { reject(new Error('Géolocalisation non supportée')); return; }
            navigator.geolocation.getCurrentPosition(
                pos => {
                    this._userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy, ts: Date.now() };
                    resolve(this._userPos);
                },
                err => reject(err),
                { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
            );
        });
    },

    // Calcul distance Haversine (km)
    distance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },

    // Trier les spots par distance depuis la position utilisateur
    async sortByDistance(spots) {
        try {
            const pos = await this.getPosition();
            return spots
                .map(s => ({ ...s, distance_km: s.lat && s.lng ? this.distance(pos.lat, pos.lng, s.lat, s.lng) : 9999 }))
                .sort((a, b) => a.distance_km - b.distance_km);
        } catch { return spots; }
    },

    // Charger et afficher les spots proches depuis Supabase
    async loadNearbySpots(containerId, limit = 5, maxKm = 100) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '<div class="skeleton" style="height:80px;border-radius:16px;margin-bottom:8px"></div><div class="skeleton" style="height:80px;border-radius:16px"></div>';

        try {
            const pos = await this.getPosition();
            // Supabase: récupérer les spots proches via bounding box
            const delta = maxKm / 111; // ~111km par degré
            const { data: spots } = await supabase
                .from('spots')
                .select('id,name,type,level,lat,lng,current_score')
                .gte('lat', pos.lat - delta)
                .lte('lat', pos.lat + delta)
                .gte('lng', pos.lng - delta)
                .lte('lng', pos.lng + delta)
                .limit(20);

            if (!spots?.length) {
                container.innerHTML = '<div class="empty-state"><div>📍</div><h3>Aucun spot trouvé</h3><p>Aucun spot référencé dans un rayon de ' + maxKm + 'km.</p></div>';
                return;
            }

            const sorted = (await this.sortByDistance(spots)).slice(0, limit);
            const scoreColor = s => s > 70 ? '#10b981' : s > 40 ? '#f59e0b' : '#ef4444';

            container.innerHTML = sorted.map(spot => `
        <a href="/pages/spot_detail.html?id=${spot.id}" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:16px;margin-bottom:8px;text-decoration:none">
          <div style="font-size:28px">${spot.type === 'reef' ? '🪸' : spot.type === 'point_break' ? '📍' : '🏖️'}</div>
          <div style="flex:1">
            <div style="font-weight:600;color:#f1f5f9;font-size:14px">${spot.name}</div>
            <div style="color:#64748b;font-size:12px;margin-top:2px">${spot.distance_km < 1 ? '<1' : Math.round(spot.distance_km)} km · ${spot.level || 'Tous niveaux'}</div>
          </div>
          ${spot.current_score ? `<div style="background:${scoreColor(spot.current_score)}22;border:1px solid ${scoreColor(spot.current_score)}44;border-radius:10px;padding:4px 10px;color:${scoreColor(spot.current_score)};font-weight:700;font-size:13px">${spot.current_score}</div>` : ''}
        </a>`).join('');
        } catch (e) {
            container.innerHTML = '<div class="empty-state"><div>📍</div><h3>Géolocalisation refusée</h3><p>Autorise la géolocalisation pour voir les spots proches.</p></div>';
        }
    },

    // Ajouter marker "Tu es ici" sur Leaflet
    addUserMarker(map) {
        this.getPosition().then(pos => {
            if (!map || typeof L === 'undefined') return;
            // Cercle de précision
            L.circle([pos.lat, pos.lng], { radius: pos.acc, color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.1, weight: 2 }).addTo(map);
            // Marker
            const icon = L.divIcon({ html: '<div style="width:14px;height:14px;background:#0ea5e9;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(14,165,233,.3)"></div>', iconSize: [14, 14], iconAnchor: [7, 7], className: '' });
            L.marker([pos.lat, pos.lng], { icon }).addTo(map).bindPopup('<b>Tu es ici</b>');
        }).catch(() => { });
    }
};

window.GeoSpots = GeoSpots;
