/**
 * SwellSync — Couche API partagée (pages/js/api.js)
 * Toutes les pages Stitch importent ce fichier.
 */
const BASE = '';  // même origine (localhost:3000)

const API = {
    // ── Utilitaire fetch ────────────────────────────────────────
    async _req(method, path, body) {
        const opts = {
            method,
            credentials: 'include',           // envoie le cookie JWT auto
            headers: { 'Content-Type': 'application/json' }
        };
        if (body !== undefined) opts.body = JSON.stringify(body);
        const res = await fetch(BASE + path, opts);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || res.statusText);
        }
        return res.json();
    },
    get(path) { return this._req('GET', path); },
    post(path, body) { return this._req('POST', path, body); },
    put(path, body) { return this._req('PUT', path, body); },
    patch(path, body) { return this._req('PATCH', path, body); },
    del(path) { return this._req('DELETE', path); },

    // ── Auth ────────────────────────────────────────────────────
    auth: {
        me() { return API.get('/api/auth/me'); },
        logout() { return API.post('/api/auth/logout'); },
        updateProfile(d) { return API.put('/api/auth/profile', d); },
        uploadAvatar(b64) { return API.post('/api/auth/avatar', { avatar: b64 }); },
    },

    // ── Spots ───────────────────────────────────────────────────
    spots: {
        list() { return API.get('/api/spots'); },
        get(id) { return API.get(`/api/spots/${id}`); },
    },

    // ── Favoris ─────────────────────────────────────────────────
    favorites: {
        list() { return API.get('/api/members/favorites'); },
        add(id) { return API.post('/api/members/favorites', { spot_id: id }); },
        remove(id) { return API.del(`/api/members/favorites/${id}`); },
    },

    // ── Alertes ─────────────────────────────────────────────────
    alerts: {
        list() { return API.get('/api/members/alerts'); },
        add(d) { return API.post('/api/members/alerts', d); },
        toggle(id, active) { return API.patch(`/api/members/alerts/${id}`, { active }); },
        delete(id) { return API.del(`/api/members/alerts/${id}`); },
    },

    // ── Journal sessions ────────────────────────────────────────
    journal: {
        list() { return API.get('/api/members/journal'); },
        add(d) { return API.post('/api/members/journal', d); },
    },
};

// ── Helper: vérifier si connecté, sinon stocker destination ──
async function requireLogin(redirectBack = location.href) {
    try {
        const me = await API.auth.me();
        return me;
    } catch {
        sessionStorage.setItem('after_login', redirectBack);
        location.href = '../index.html';
        return null;
    }
}

// ── Helper: formater la hauteur de vague ─────────────────────
function fmtWave(h) { return h ? parseFloat(h).toFixed(1) + 'm' : '—'; }

// ── Helper: icône condition ──────────────────────────────────
function condBadge(rating) {
    if (!rating) return '';
    const map = { epic: 'EPIC', good: 'GOOD', fair: 'FAIR', poor: 'POOR' };
    const cl = { epic: 'text-primary', good: 'text-green-400', fair: 'text-yellow-400', poor: 'text-red-400' };
    return `<span class="text-[10px] font-bold ${cl[rating] || ''}">${map[rating] || rating.toUpperCase()}</span>`;
}

// ── Toast notification ───────────────────────────────────────
function toast(msg, type = 'ok') {
    const t = document.createElement('div');
    t.className = `fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl text-sm font-bold shadow-xl transition-all duration-300 ${type === 'ok' ? 'bg-primary text-[#080f1a]' : 'bg-red-500 text-white'
        }`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}
