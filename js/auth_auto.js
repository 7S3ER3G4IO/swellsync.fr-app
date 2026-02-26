/**
 * SwellSync — Auth Auto (C2/C6)
 * Reconnexion automatique via JWT stocké en cookie ou localStorage.
 * - Au chargement : tente de valider le token silencieusement
 * - Si expiré : nettoie le localStorage + affiche toast discret
 * - Expose window.SwellAuth pour les autres scripts
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'swellsync_user';
    const TOKEN_KEY = 'swellsync_token';

    // ── Helpers ────────────────────────────────────────────────────────────
    function getCookie(name) {
        return document.cookie.split(';')
            .map(c => c.trim().split('='))
            .find(([k]) => k === name)?.[1] || null;
    }

    function getToken() {
        return localStorage.getItem(TOKEN_KEY) || getCookie('swellsync_token');
    }

    function parseJwt(token) {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        } catch { return null; }
    }

    function isTokenExpired(token) {
        const payload = parseJwt(token);
        if (!payload?.exp) return true;
        return Date.now() / 1000 > payload.exp;
    }

    function clearSession() {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(TOKEN_KEY);
        document.cookie = 'swellsync_token=; Max-Age=0; path=/';
    }

    function showToast(msg, type = 'info') {
        if (typeof Toast !== 'undefined') {
            Toast.show(msg, type, 3500);
        } else {
            // Fallback mini-toast
            const t = document.createElement('div');
            t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999;background:rgba(7,15,16,0.95);border:1px solid rgba(255,255,255,0.1);color:#f1f5f9;font-family:Lexend,sans-serif;font-size:13px;font-weight:600;padding:10px 20px;border-radius:12px;backdrop-filter:blur(12px);opacity:0;transition:opacity 0.3s;`;
            t.textContent = msg;
            document.body.appendChild(t);
            requestAnimationFrame(() => { t.style.opacity = '1'; });
            setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500);
        }
    }

    // ── Reconnexion automatique ────────────────────────────────────────────
    async function autoReconnect() {
        const token = getToken();

        // Cas 1 : Pas de token → utilisateur non connecté
        if (!token) {
            window.SwellAuth = { user: null, token: null, isLoggedIn: false };
            return;
        }

        // Cas 2 : Token expiré → nettoyer + notifier
        if (isTokenExpired(token)) {
            clearSession();
            window.SwellAuth = { user: null, token: null, isLoggedIn: false };
            // Notifier seulement si l'utilisateur était "connecté" selon le localStorage
            const hadUser = sessionStorage.getItem('swellsync_had_session');
            if (hadUser) {
                showToast('🔒 Session expirée — reconnectez-vous', 'warning');
                sessionStorage.removeItem('swellsync_had_session');
            }
            updateNavUI(null);
            return;
        }

        // Cas 3 : Token valide en local → tenter validation silencieuse côté serveur
        const cachedUser = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (cachedUser) {
            sessionStorage.setItem('swellsync_had_session', '1');
            window.SwellAuth = { user: cachedUser, token, isLoggedIn: true };
            updateNavUI(cachedUser);
        }

        // Validation serveur (silencieuse, ne bloque pas l'affichage)
        try {
            const r = await fetch('/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
                signal: AbortSignal.timeout(4000)
            });
            if (r.ok) {
                const user = await r.json();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
                sessionStorage.setItem('swellsync_had_session', '1');
                window.SwellAuth = { user, token, isLoggedIn: true };
                updateNavUI(user);
                document.dispatchEvent(new CustomEvent('swellsync:auth', { detail: { user, token } }));
            } else if (r.status === 401) {
                clearSession();
                window.SwellAuth = { user: null, token: null, isLoggedIn: false };
                updateNavUI(null);
                if (cachedUser) showToast('🔒 Session expirée — reconnectez-vous', 'warning');
            }
        } catch (_) {
            // Réseau down → on garde l'utilisateur du cache local
        }
    }

    // ── Mise à jour UI de la navbar ────────────────────────────────────────
    function updateNavUI(user) {
        const loginBtn = document.querySelector('#btn-login, #nav-login-btn, .nav-login-btn, [data-nav-auth]');
        if (!loginBtn) return;
        if (user) {
            const initials = (user.name || user.email || '?')[0].toUpperCase();
            const planBadge = user.plan && user.plan !== 'free'
                ? `<span style="font-size:9px;background:#00bad6;color:#fff;padding:1px 5px;border-radius:4px;font-weight:800;margin-left:4px;">${user.plan.toUpperCase()}</span>`
                : '';
            loginBtn.innerHTML = `<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#00bad6,#0090a8);display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:14px;">${initials}</div>${planBadge}`;
            loginBtn.title = `Connecté : ${user.name || user.email}`;
            loginBtn.onclick = () => { window.location.href = 'dashboard.html'; };
        } else {
            loginBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:20px">person</span> Connexion`;
            loginBtn.onclick = () => { if (typeof openAuthModal === 'function') openAuthModal(); };
        }
    }

    // ── Route /api/auth/me dans server.js si absente ───────────────────────
    // (Vérifiée côté serveur — si la route n'existe pas, la validation silencieuse échoue
    //  mais l'utilisateur du cache local reste connecté)

    // ── Lancer au chargement ───────────────────────────────────────────────
    window.SwellAuth = { user: null, token: null, isLoggedIn: false }; // défaut
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoReconnect);
    } else {
        autoReconnect();
    }

    // ── API publique ───────────────────────────────────────────────────────
    window.SwellAuth = window.SwellAuth || {};
    window.SwellAuth.logout = function () {
        clearSession();
        window.SwellAuth = { user: null, token: null, isLoggedIn: false };
        updateNavUI(null);
        showToast('👋 Déconnecté avec succès', 'success');
        document.dispatchEvent(new CustomEvent('swellsync:logout'));
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
    };
    window.SwellAuth.requireAuth = function (callback) {
        if (window.SwellAuth?.isLoggedIn) {
            callback(window.SwellAuth.user);
        } else {
            if (typeof openAuthModal === 'function') openAuthModal();
        }
    };

    // C4 : requirePremium — redirige vers login si pas connecté, ou vers abonnement si pas pro
    window.SwellAuth.requirePremium = function (callback) {
        const auth = window.SwellAuth;
        if (!auth?.isLoggedIn) {
            // Pas connecté → ouvrir modal login
            if (typeof openAuthModal === 'function') {
                openAuthModal();
            } else {
                sessionStorage.setItem('swellsync_redirect_after_login', window.location.href);
                window.location.href = 'index.html';
            }
            return;
        }
        const plan = auth.user?.plan || (auth.user?.is_pro ? 'pro' : 'free');
        if (plan === 'free') {
            // Connecté mais pas premium → rediriger vers abonnement
            window.location.href = 'abonnement.html?upgrade=1&from=' + encodeURIComponent(window.location.pathname);
            return;
        }
        if (typeof callback === 'function') callback(auth.user);
    };

})();
