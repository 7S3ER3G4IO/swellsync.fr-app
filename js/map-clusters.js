/**
 * SwellSync — Clustering de markers Leaflet (T101)
 * + Filtres sur la carte (T102)
 * + Overlay conditions météo (T103)
 * + Geofencing session GPS (T16)
 */

// ══════════════════════════════════════════════════
// T101 — Clusters de markers Leaflet
// ══════════════════════════════════════════════════
const MapClustering = {

    _clusterGroups: {},

    // Créer un groupe de clusters coloré
    createClusterGroup(color = '#0ea5e9') {
        if (typeof L === 'undefined' || typeof L.markerClusterGroup === 'undefined') return null;
        return L.markerClusterGroup({
            maxClusterRadius: 60,
            iconCreateFunction: cluster => {
                const count = cluster.getChildCount();
                const size = count < 10 ? 36 : count < 50 ? 44 : 52;
                return L.divIcon({
                    html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,.3)">${count}</div>`,
                    iconSize: [size, size],
                    iconAnchor: [size / 2, size / 2],
                    className: ''
                });
            },
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true
        });
    },

    // Ajouter tous les spots dans un cluster group
    async addSpotsToMap(map, filters = {}) {
        try {
            let query = supabase.from('spots').select('id,name,lat,lng,type,level,current_score');
            if (filters.type) query = query.eq('type', filters.type);
            if (filters.level) query = query.eq('level', filters.level);
            const { data: spots } = await query.limit(200);
            if (!spots?.length) return;

            const cluster = this.createClusterGroup('#0ea5e9');
            if (!cluster) return;

            const scoreColor = s => s > 70 ? '#10b981' : s > 40 ? '#f59e0b' : '#ef4444';

            spots.filter(s => s.lat && s.lng).forEach(spot => {
                const col = spot.current_score ? scoreColor(spot.current_score) : '#0ea5e9';
                const icon = L.divIcon({
                    html: `<div style="background:${col};border:2px solid white;border-radius:50%;width:12px;height:12px;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
                    iconSize: [12, 12], iconAnchor: [6, 6], className: ''
                });
                const marker = L.marker([spot.lat, spot.lng], { icon });
                marker.bindPopup(`
          <div style="background:#1e293b;border-radius:12px;padding:14px;min-width:180px;color:#f1f5f9">
            <div style="font-weight:700;font-size:15px;margin-bottom:6px">${spot.name}</div>
            <div style="font-size:12px;color:#94a3b8;margin-bottom:10px">${spot.type || ''} · ${spot.level || 'Tous niveaux'}</div>
            ${spot.current_score ? `<div style="font-size:20px;font-weight:800;color:${col}">${spot.current_score}<span style="font-size:12px;color:#64748b">/100</span></div>` : ''}
            <a href="/pages/spot_detail.html?id=${spot.id}" style="display:block;margin-top:10px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;padding:8px;border-radius:8px;text-align:center;text-decoration:none;font-size:13px;font-weight:600">Voir les prévisions →</a>
          </div>`);
                cluster.addLayer(marker);
            });

            map.addLayer(cluster);
            return cluster;
        } catch (e) { console.warn('Clustering error:', e); }
    }
};

// ══════════════════════════════════════════════════
// T16 — Géofencing session GPS
// ══════════════════════════════════════════════════
const GeoFencing = {
    _zone: null,
    _watchId: null,
    _alertCooldown: false,

    // Définir la zone de surf (cercle autour du spot)
    setZone(lat, lng, radiusKm = 2) {
        this._zone = { lat, lng, radius: radiusKm };
    },

    // Commencer la surveillance
    startWatch(onExit) {
        if (!navigator.geolocation || !this._zone) return;
        this._watchId = navigator.geolocation.watchPosition(pos => {
            const dist = this._distance(pos.coords.latitude, pos.coords.longitude, this._zone.lat, this._zone.lng);
            if (dist > this._zone.radius && !this._alertCooldown) {
                this._alertCooldown = true;
                if (typeof onExit === 'function') onExit(Math.round(dist * 1000));
                setTimeout(() => { this._alertCooldown = false; }, 60000); // cooldown 1min
            }
        }, null, { enableHighAccuracy: true, maximumAge: 10000 });
    },

    stopWatch() {
        if (this._watchId !== null) { navigator.geolocation.clearWatch(this._watchId); this._watchId = null; }
    },

    _distance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
};

// ══════════════════════════════════════════════════
// T103 — Overlay conditions météo (vent) sur la carte
// ══════════════════════════════════════════════════
const WeatherOverlay = {
    _layer: null,

    addWindLayer(map) {
        if (typeof L === 'undefined') return;
        // OpenWeatherMap Wind layer (tile overlay gratuit)
        const apiKey = 'OPENWEATHER_API_KEY'; // à remplacer
        if (apiKey === 'OPENWEATHER_API_KEY') return; // skip si pas de key
        this._layer = L.tileLayer(
            `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${apiKey}`,
            { opacity: 0.5, attribution: '© OpenWeatherMap' }
        );
    },

    toggle(map) {
        if (!this._layer) return;
        if (map.hasLayer(this._layer)) map.removeLayer(this._layer);
        else map.addLayer(this._layer);
    }
};

window.MapClustering = MapClustering;
window.GeoFencing = GeoFencing;
window.WeatherOverlay = WeatherOverlay;
