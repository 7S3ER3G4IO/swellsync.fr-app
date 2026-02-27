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
// Fallback spots — utilisé quand la table Supabase est vide
// ══════════════════════════════════════════════════════════════
const FALLBACK_SPOTS = [
    { id: 1, name: 'La Gravière', location: 'Hossegor, Landes', difficulty: 'expert' },
    { id: 2, name: 'La Nord', location: 'Hossegor, Landes', difficulty: 'avance' },
    { id: 3, name: 'La Sud', location: 'Hossegor, Landes', difficulty: 'intermediaire' },
    { id: 4, name: 'Les Culs Nuls', location: 'Hossegor, Landes', difficulty: 'avance' },
    { id: 5, name: 'La Centrale', location: 'Hossegor, Landes', difficulty: 'intermediaire' },
    { id: 6, name: 'Les Bourdaines', location: 'Seignosse, Landes', difficulty: 'avance' },
    { id: 7, name: 'Les Estagnots', location: 'Seignosse, Landes', difficulty: 'avance' },
    { id: 8, name: 'Le Penon', location: 'Seignosse, Landes', difficulty: 'intermediaire' },
    { id: 9, name: 'Les Casernes', location: 'Seignosse, Landes', difficulty: 'intermediaire' },
    { id: 10, name: 'La Piste', location: 'Capbreton, Landes', difficulty: 'debutant' },
    { id: 11, name: 'Le Santocha', location: 'Capbreton, Landes', difficulty: 'intermediaire' },
    { id: 12, name: 'Moliets Plage', location: 'Moliets, Landes', difficulty: 'intermediaire' },
    { id: 13, name: 'Vieux Boucau', location: 'Vieux-Boucau, Landes', difficulty: 'debutant' },
    { id: 14, name: 'Messanges', location: 'Messanges, Landes', difficulty: 'intermediaire' },
    { id: 15, name: 'Mimizan Plage', location: 'Mimizan, Landes', difficulty: 'intermediaire' },
    { id: 16, name: 'Côte des Basques', location: 'Biarritz, Pays Basque', difficulty: 'debutant' },
    { id: 17, name: 'Grande Plage', location: 'Biarritz, Pays Basque', difficulty: 'debutant' },
    { id: 18, name: 'La Milady', location: 'Biarritz, Pays Basque', difficulty: 'intermediaire' },
    { id: 19, name: 'Marbella', location: 'Biarritz, Pays Basque', difficulty: 'intermediaire' },
    { id: 20, name: 'Parlementia', location: 'Guéthary, Pays Basque', difficulty: 'expert' },
    { id: 21, name: 'Lafitenia', location: 'Saint-Jean-de-Luz, Pays Basque', difficulty: 'avance' },
    { id: 22, name: 'Erretegia', location: 'Bidart, Pays Basque', difficulty: 'intermediaire' },
    { id: 23, name: 'Pavillon Royal', location: 'Bidart, Pays Basque', difficulty: 'intermediaire' },
    { id: 24, name: 'Ilbarritz', location: 'Bidart, Pays Basque', difficulty: 'debutant' },
    { id: 25, name: 'Les Cavaliers', location: 'Anglet, Pays Basque', difficulty: 'avance' },
    { id: 26, name: 'Les Corsaires', location: 'Anglet, Pays Basque', difficulty: 'intermediaire' },
    { id: 27, name: 'La Barre', location: 'Anglet, Pays Basque', difficulty: 'avance' },
    { id: 28, name: 'Hendaye Plage', location: 'Hendaye, Pays Basque', difficulty: 'debutant' },
    { id: 29, name: 'Lacanau Océan', location: 'Lacanau, Gironde', difficulty: 'intermediaire' },
    { id: 30, name: 'La Sud Lacanau', location: 'Lacanau, Gironde', difficulty: 'avance' },
    { id: 31, name: 'Le Super Sud', location: 'Lacanau, Gironde', difficulty: 'avance' },
    { id: 32, name: 'Le Porge Océan', location: 'Le Porge, Gironde', difficulty: 'intermediaire' },
    { id: 33, name: 'Hourtin Plage', location: 'Hourtin, Gironde', difficulty: 'intermediaire' },
    { id: 34, name: 'Carcans Plage', location: 'Carcans, Gironde', difficulty: 'intermediaire' },
    { id: 35, name: 'Le Grand Crohot', location: 'Lège-Cap-Ferret, Gironde', difficulty: 'intermediaire' },
    { id: 36, name: 'La Torche', location: 'Plomeur, Bretagne', difficulty: 'intermediaire' },
    { id: 37, name: 'La Palue', location: 'Crozon, Bretagne', difficulty: 'avance' },
    { id: 38, name: 'Pors Carn', location: 'Penmarch, Bretagne', difficulty: 'intermediaire' },
    { id: 39, name: "La Presqu'île", location: 'Crozon, Bretagne', difficulty: 'avance' },
    { id: 40, name: 'Guidel Plage', location: 'Guidel, Bretagne', difficulty: 'intermediaire' },
    { id: 41, name: 'Quiberon', location: 'Quiberon, Bretagne', difficulty: 'intermediaire' },
    { id: 42, name: 'Donnant', location: 'Belle-Île, Bretagne', difficulty: 'avance' },
    { id: 43, name: 'Sainte-Barbe', location: 'Plouharnel, Bretagne', difficulty: 'intermediaire' },
    { id: 44, name: 'Tronoën', location: 'Saint-Jean-Trolimon, Bretagne', difficulty: 'intermediaire' },
    { id: 45, name: "Les Sables-d'Olonne", location: "Les Sables-d'Olonne, Vendée", difficulty: 'debutant' },
    { id: 46, name: 'Brétignolles-sur-Mer', location: 'Brétignolles, Vendée', difficulty: 'intermediaire' },
    { id: 47, name: 'La Sauzaie', location: 'Brétignolles, Vendée', difficulty: 'avance' },
    { id: 48, name: 'Bud Bud', location: 'Longeville, Vendée', difficulty: 'intermediaire' },
    { id: 49, name: 'Royan — Grande Conche', location: 'Royan, Charente-Maritime', difficulty: 'debutant' },
    { id: 50, name: 'Saint-Palais-sur-Mer', location: 'Saint-Palais, Charente-Maritime', difficulty: 'intermediaire' },
    { id: 51, name: 'Les Huttes', location: "Île d'Oléron, Charente-Maritime", difficulty: 'intermediaire' },
    { id: 52, name: 'Vert Bois', location: "Île d'Oléron, Charente-Maritime", difficulty: 'intermediaire' },
    { id: 53, name: 'La Côte Sauvage', location: 'La Palmyre, Charente-Maritime', difficulty: 'avance' },
    { id: 54, name: 'Les Boucholeurs', location: 'Île de Ré, Charente-Maritime', difficulty: 'debutant' },
    { id: 55, name: 'Tarnos', location: 'Tarnos, Landes', difficulty: 'intermediaire' },
    { id: 56, name: 'Labenne Océan', location: 'Labenne, Landes', difficulty: 'debutant' },
    { id: 57, name: 'Ondres Plage', location: 'Ondres, Landes', difficulty: 'intermediaire' },
    { id: 58, name: 'Biscarrosse Plage', location: 'Biscarrosse, Landes', difficulty: 'intermediaire' },
    { id: 59, name: 'Contis Plage', location: 'Saint-Julien-en-Born, Landes', difficulty: 'intermediaire' },
    { id: 60, name: 'Lespécier', location: 'Mimizan, Landes', difficulty: 'avance' },
    { id: 61, name: 'Le Truc Vert', location: 'Lège-Cap-Ferret, Gironde', difficulty: 'avance' },
    { id: 62, name: 'Montalivet', location: 'Vendays-Montalivet, Gironde', difficulty: 'intermediaire' },
    { id: 63, name: 'Soulac-sur-Mer', location: 'Soulac, Gironde', difficulty: 'debutant' },
    { id: 64, name: 'Le Pin Sec', location: 'Naujac, Gironde', difficulty: 'intermediaire' },
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
