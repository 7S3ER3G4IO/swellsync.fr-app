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
            const sb = await getSupabase();
            const { data, error } = await sb.from('spots').select('*').order('name');
            if (error) throw new Error(error.message);
            return data || [];
        },

        async get(id) {
            const sb = await getSupabase();
            const { data, error } = await sb.from('spots').select('*').eq('id', id).single();
            if (error) throw new Error(error.message);
            return data;
        },

        // Forecast reste via l'ancien serveur Express (API externe StormGlass)
        async forecast(spotId) {
            try {
                return await _legacyReq('GET', `/api/spots/${spotId}/forecast`);
            } catch {
                return null;
            }
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
