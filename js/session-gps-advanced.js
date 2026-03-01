/**
 * SwellSync — Session GPS avancée (T11-T20)
 * T11: Vitesse de vague (km/h) via GPS
 * T12: Compteur de vagues (tap + haptic)
 * T13: Timer avec pause/reprendre
 * T14: Mini-carte overlay tracé GPS live
 * T15: Mode économie batterie (GPS moins fréquent < 20%)
 * T16: Alarme géofencing (hors zone)
 * T17: Sauvegarde auto 30s
 * T18: Photo fin de session (camera API)
 * T19: Comparer avec session précédente
 * T20: Partager tracé GPS (image + Web Share API)
 */

const SessionGPS = {

    _positions: [],
    _waveCount: 0,
    _startTime: null,
    _pausedTime: 0,
    _pauseStart: null,
    _isPaused: false,
    _autoSaveInterval: null,
    _watchId: null,
    _homeBase: null,
    _geofenceRadius: 500, // mètres
    _lowBattery: false,

    // T12 — Compteur de vagues avec haptic
    countWave() {
        this._waveCount++;
        document.getElementById('wave-count-display')?.let(el => el.textContent = this._waveCount);
        // T12 haptic
        if ('vibrate' in navigator) navigator.vibrate(60);
        // Animation visuelle du bouton
        const btn = document.getElementById('wave-count-btn');
        if (btn) { btn.style.transform = 'scale(0.95)'; setTimeout(() => btn.style.transform = 'scale(1)', 150); }
        return this._waveCount;
    },

    // T13 — Timer pause/reprendre
    startTimer() {
        this._startTime = Date.now();
        this._isPaused = false;
        this._updateTimerDisplay();
        this._timerInterval = setInterval(() => this._updateTimerDisplay(), 1000);
    },

    pauseTimer() {
        if (!this._isPaused) { this._pauseStart = Date.now(); this._isPaused = true; }
        else { this._pausedTime += Date.now() - this._pauseStart; this._isPaused = false; }
        const btn = document.getElementById('timer-pause-btn');
        if (btn) btn.textContent = this._isPaused ? '▶️ Reprendre' : '⏸️ Pause';
    },

    _updateTimerDisplay() {
        if (this._isPaused) return;
        const elapsed = Math.max(0, Date.now() - this._startTime - this._pausedTime);
        const h = Math.floor(elapsed / 3600000);
        const m = Math.floor((elapsed % 3600000) / 60000);
        const s = Math.floor((elapsed % 60000) / 1000);
        const el = document.getElementById('session-timer');
        if (el) el.textContent = h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
    },

    getElapsedMinutes() {
        if (!this._startTime) return 0;
        return Math.round((Date.now() - this._startTime - this._pausedTime) / 60000);
    },

    // T11 — Vitesse de vague via GPS
    _calculateSpeed(pos1, pos2) {
        if (!pos1 || !pos2) return 0;
        const R = 6371000;
        const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
        const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dt = (pos2.t - pos1.t) / 1000;
        return dt > 0 ? Math.round((dist / dt) * 3.6 * 10) / 10 : 0;
    },

    // T14 — Mini-carte overlay tracé GPS
    initMiniMap(containerId = 'session-minimap') {
        const el = document.getElementById(containerId);
        if (!el || typeof L === 'undefined') return null;
        const map = L.map(containerId, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false }).setView([43.5, -1.5], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
        this._miniMap = map;
        this._trackLine = L.polyline([], { color: '#0ea5e9', weight: 3, opacity: 0.9 }).addTo(map);
        return map;
    },

    addTrackPoint(lat, lng) {
        const pos = { lat, lng, t: Date.now() };
        if (this._positions.length > 0) {
            const last = this._positions[this._positions.length - 1];
            const speed = this._calculateSpeed(last, pos);
            const el = document.getElementById('session-speed');
            if (el) el.textContent = `${speed} km/h`;
        }
        this._positions.push(pos);
        // T14 — Mettre à jour mini-carte
        if (this._miniMap && this._trackLine) {
            const latlng = [lat, lng];
            this._trackLine.addLatLng(latlng);
            this._miniMap.panTo(latlng);
        }
        // T16 — Géofencing
        if (this._homeBase) this._checkGeofence(lat, lng);
    },

    // T15 — Gestion batterie
    async initBatteryMonitor() {
        if ('getBattery' in navigator) {
            const bat = await navigator.getBattery();
            this._lowBattery = bat.level < 0.20;
            bat.addEventListener('levelchange', () => {
                const wasLow = this._lowBattery;
                this._lowBattery = bat.level < 0.20;
                if (!wasLow && this._lowBattery) this._activateLowBatteryMode();
            });
        }
    },

    _activateLowBatteryMode() {
        if (typeof showToast !== 'undefined') showToast('🔋 Mode économie batterie activé — GPS moins fréquent', 'warning');
        // Redémarrer la localisation avec un intervalle plus long
        if (this._watchId !== null) { navigator.geolocation.clearWatch(this._watchId); this._startLocationTracking(); }
    },

    _startLocationTracking() {
        const opts = this._lowBattery
            ? { enableHighAccuracy: false, timeout: 30000, maximumAge: 10000 } // T15 low battery
            : { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 };
        this._watchId = navigator.geolocation.watchPosition(
            pos => { this.addTrackPoint(pos.coords.latitude, pos.coords.longitude); this.autoSave(); },
            err => console.warn('GPS error:', err),
            opts
        );
    },

    // T16 — Géofencing
    setHomeBase(lat, lng) { this._homeBase = { lat, lng }; },

    _checkGeofence(lat, lng) {
        if (!this._homeBase) return;
        const dist = this._calculateSpeed(this._homeBase, { lat, lng, t: Date.now() }) / 3.6 * 1000;
        if (dist > this._geofenceRadius) {
            if (!this._geofenceAlerted) {
                this._geofenceAlerted = true;
                if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
                if (typeof showToast !== 'undefined') showToast('⚠️ Tu as quitté la zone de surf !', 'warning');
            }
        } else { this._geofenceAlerted = false; }
    },

    // T17 — Sauvegarde automatique 30s
    startAutoSave() {
        this._autoSaveInterval = setInterval(() => this.autoSave(), 30000);
    },

    async autoSave() {
        if (!this._startTime || this._positions.length < 2) return;
        const sessionData = this._buildSessionData();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            await supabase.from('surf_sessions').upsert({ ...sessionData, user_id: member.id, autosave: true }, { onConflict: 'id' });
        } catch {
            // T17 hors-ligne: sauvegarder localement
            localStorage.setItem('sw_session_draft', JSON.stringify(sessionData));
        }
    },

    _buildSessionData() {
        const elapsed = this.getElapsedMinutes();
        let totalDist = 0;
        for (let i = 1; i < this._positions.length; i++) {
            totalDist += this._calculateSpeed(this._positions[i - 1], this._positions[i]) / 3.6 * ((this._positions[i].t - this._positions[i - 1].t) / 1000);
        }
        return {
            id: this._sessionId || (this._sessionId = `sess_${Date.now()}`),
            started_at: new Date(this._startTime).toISOString(),
            duration_minutes: elapsed,
            wave_count: this._waveCount,
            distance_km: Math.round(totalDist / 100) / 10,
            track_points: this._positions.slice(-50), // last 50 points
            spot_name: localStorage.getItem('sw_quick_session_name') || 'Spot inconnu',
            spot_slug: localStorage.getItem('sw_quick_session_spot') || '',
        };
    },

    // T18 — Photo fin de session
    async captureSessionPhoto(containerId = 'session-photo-preview') {
        const el = document.getElementById(containerId);
        if (!el) return null;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            const video = document.createElement('video');
            video.srcObject = stream; video.autoplay = true; video.style.display = 'none';
            document.body.appendChild(video);
            await new Promise(r => video.onloadedmetadata = r);
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            stream.getTracks().forEach(t => t.stop());
            document.body.removeChild(video);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            el.innerHTML = `<img src="${dataURL}" style="width:100%;border-radius:14px;max-height:250px;object-fit:cover" alt="Photo session">`;
            this._sessionPhoto = dataURL;
            return dataURL;
        } catch { if (typeof showToast !== 'undefined') showToast('Caméra non disponible', 'error'); return null; }
    },

    // T19 — Comparer avec session précédente
    async renderComparison(containerId = 'session-comparison') {
        const el = document.getElementById(containerId);
        if (!el) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            const { data } = await supabase.from('surf_sessions').select('*').eq('user_id', member.id).eq('spot_slug', localStorage.getItem('sw_quick_session_spot') || '').order('started_at', { ascending: false }).limit(1).single();
            if (!data) return;
            const curr = this._buildSessionData();
            const waveDiff = curr.wave_count - (data.wave_count || 0);
            const timeDiff = curr.duration_minutes - (data.duration_minutes || 0);
            el.innerHTML = `
        <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:12px;margin-top:10px">
          <div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:8px">📊 VS SESSION PRÉCÉDENTE</div>
          <div style="display:flex;gap:12px">
            <div style="text-align:center;flex:1"><div style="font-size:10px;color:#64748b">VAGUES</div><div style="font-size:16px;font-weight:800;color:${waveDiff >= 0 ? '#10b981' : '#ef4444'}">${waveDiff >= 0 ? '+' : ''}${waveDiff}</div></div>
            <div style="text-align:center;flex:1"><div style="font-size:10px;color:#64748b">DURÉE</div><div style="font-size:16px;font-weight:800;color:${timeDiff >= 0 ? '#10b981' : '#ef4444'}">${timeDiff >= 0 ? '+' : ''}${timeDiff}min</div></div>
            <div style="text-align:center;flex:1"><div style="font-size:10px;color:#64748b">DISTANCE</div><div style="font-size:16px;font-weight:800;color:#0ea5e9">${curr.distance_km}km</div></div>
          </div>
        </div>`;
        } catch { }
    },

    // T20 — Partager tracé GPS
    async shareTrack() {
        const spotName = localStorage.getItem('sw_quick_session_name') || 'Spot';
        const waves = this._waveCount;
        const duration = this.getElapsedMinutes();
        const text = `🏄 Session surf terminée !\n📍 ${spotName}\n⏱️ ${duration} minutes · 🌊 ${waves} vagues\n\nTracé GPS enregistré sur SwellSync — swellsync.fr`;
        if (navigator.share) { try { await navigator.share({ title: `Session ${spotName}`, text, url: 'https://swellsync.fr' }); return; } catch { } }
        await navigator.clipboard.writeText(text).catch(() => { });
        if (typeof showToast !== 'undefined') showToast('📋 Session copiée à partager !', 'success');
    },

    // Initialisation globale
    async init() {
        await this.initBatteryMonitor();
        this.startTimer();
        this.startAutoSave();
        this._startLocationTracking();
        this.initMiniMap();
        // Défaut home base = position actuelle
        navigator.geolocation.getCurrentPosition(pos => this.setHomeBase(pos.coords.latitude, pos.coords.longitude));
    },

    stop() {
        clearInterval(this._timerInterval);
        clearInterval(this._autoSaveInterval);
        if (this._watchId !== null) navigator.geolocation.clearWatch(this._watchId);
        return this._buildSessionData();
    }
};

window.SessionGPS = SessionGPS;
