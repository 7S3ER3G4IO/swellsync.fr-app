/**
 * SwellSync — Auth State Manager
 * 
 * Vérifie si l'utilisateur est connecté via Supabase Auth.
 * 
 * - Si connecté : affiche le lien Profil normalement
 * - Si non connecté : remplace l'onglet Profil par "Créer un compte"
 *   et masque les éléments qui nécessitent un compte
 * 
 * Injecter ce script sur toutes les pages app après le DOM.
 */
(function () {
    'use strict';

    const SB_URL = 'https://bxudysseskfpmlpagoid.supabase.co';
    const SB_KEY = 'sb_publishable_8UPKYf9eOQjX9-5bBGl1CA_XRu8ZkiU';

    // ── Éléments qui nécessitent d'être connecté ────────────────
    // Classes CSS à masquer si non connecté
    const AUTH_REQUIRED_CLASSES = [
        '.auth-required',       // Classe générique (à ajouter si besoin)
    ];

    // ── Obtenir la session Supabase ──────────────────────────────
    async function getSession() {
        try {
            // Attendre que supabase-js soit chargé
            if (typeof window.supabase === 'undefined') {
                await new Promise((resolve) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
                    s.onload = resolve;
                    s.onerror = resolve; // continuer même en cas d'erreur réseau
                    document.head.appendChild(s);
                });
            }
            if (!window.supabase?.createClient) return null;
            const sb = window.supabase.createClient(SB_URL, SB_KEY);
            const { data } = await sb.auth.getSession();
            return data?.session || null;
        } catch {
            return null;
        }
    }

    // ── Adapter la nav bottom selon l'état d'auth ────────────────
    function applyUnauthenticatedUI() {
        // 1. Remplacer le lien Profil dans la nav bottom par "Créer un compte"
        const navLinks = document.querySelectorAll(
            'nav a[href="profile.html"], nav a[href="/pages/profile.html"], nav a[href*="profile.html"]'
        );

        navLinks.forEach(link => {
            // Créer le nouveau bouton "Créer un compte"
            const btn = document.createElement('a');
            btn.href = 'login.html';
            btn.className = link.className
                .replace('text-[#00bad6]', 'text-white')
                .replace('font-bold', '')
                + ' auth-cta-btn';
            btn.innerHTML = `
                <span class="material-symbols-outlined text-white">person_add</span>
                <span class="text-[10px] font-bold text-white">Compte</span>
            `;
            btn.style.cssText = `
                background: linear-gradient(135deg, #00bad6, #0077cc);
                border-radius: 12px;
                padding: 4px 8px;
                flex-direction: column;
                align-items: center;
                gap: 2px;
            `;
            // Supprimer le point d'activité si présent
            const dot = link.querySelector('div[class*="bg-[#00bad6]"][class*="rounded-full"]');
            if (dot) dot.remove();

            link.parentNode.replaceChild(btn, link);
        });

        // 2. Masquer les éléments marqués auth-required
        AUTH_REQUIRED_CLASSES.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                el.style.display = 'none';
            });
        });

        // 3. Masquer le bouton "Mes sessions" ou les widgets de stats qui nécessitent un compte
        const profileWidgets = document.querySelectorAll(
            '.profile-widget, .sessions-widget, #recentSessions'
        );
        profileWidgets.forEach(el => {
            // On n'efface pas complètement — on remplace par un CTA connexion
            if (el.id === 'recentSessions') {
                el.innerHTML = `
                    <div class="card rounded-2xl p-4 text-center border border-[#00bad6]/20">
                        <p class="text-sm font-bold text-white mb-1">🏄 Rejoins SwellSync</p>
                        <p class="text-[11px] text-slate-400 mb-3">Connecte-toi pour voir tes sessions et rejoindre la communauté.</p>
                        <a href="login.html" class="inline-block bg-gradient-to-r from-[#00bad6] to-[#0077cc] text-black font-black text-xs px-4 py-2 rounded-xl">
                            Créer un compte gratuit →
                        </a>
                    </div>
                `;
            }
        });

        // 4. Adapter les stories : si non connecté, la story "+" disparaît
        const addStory = document.querySelector('.story-ring-add');
        if (addStory) {
            const storyWrapper = addStory.closest('div[class*="cursor-pointer"]') || addStory.parentElement;
            if (storyWrapper) storyWrapper.style.display = 'none';
        }

        // 5. Afficher un bandeau discret non-connecté en haut des pages (optionnel)
        // (Commenté pour ne pas être intrusif)
        /*
        const banner = document.createElement('div');
        banner.style.cssText = 'background:rgba(0,186,214,.1);border-bottom:1px solid rgba(0,186,214,.2);padding:6px 16px;text-align:center;font-size:11px;color:#94a3b8;';
        banner.innerHTML = '🏄 <a href="login.html" style="color:#00bad6;font-weight:700;">Connecte-toi</a> pour accéder à toutes les fonctionnalités';
        document.body.prepend(banner);
        */
    }

    function applyAuthenticatedUI(session) {
        // Stocker les infos user dans le localStorage pour d'autres scripts
        const user = session.user;
        if (user) {
            localStorage.setItem('sw_uid', user.id);
            localStorage.setItem('sw_email', user.email || '');
        }
    }

    // ── Supprimer toute connexion automatique résiduelle ─────────
    function clearDefaultAccount() {
        // Supprimer les clés de mock/demo user
        const MOCK_KEYS = ['swellsync_user', 'sw_mock_user', 'sw_demo', 'default_user', 'mock_session'];
        MOCK_KEYS.forEach(k => localStorage.removeItem(k));
    }

    // ── Init ─────────────────────────────────────────────────────
    async function init() {
        clearDefaultAccount();

        const session = await getSession();

        if (session) {
            applyAuthenticatedUI(session);
        } else {
            // Nettoyer les clés obsolètes aussi
            localStorage.removeItem('sw_uid');
            applyUnauthenticatedUI();
        }

        // ── Écouter les changements d'auth en temps réel ──
        try {
            if (!window.supabase?.createClient) return;
            const sb = window.supabase.createClient(SB_URL, SB_KEY);
            sb.auth.onAuthStateChange((event, newSession) => {
                if (event === 'SIGNED_IN' && newSession) {
                    // Recharger la page pour appliquer l'UI authentifiée
                    window.location.reload();
                } else if (event === 'SIGNED_OUT') {
                    localStorage.removeItem('sw_uid');
                    localStorage.removeItem('sw_email');
                    // Recharger pour afficher l'UI non-auth
                    window.location.reload();
                } else if (event === 'TOKEN_REFRESHED' && newSession) {
                    // Silently update stored user info
                    localStorage.setItem('sw_uid', newSession.user?.id || '');
                    localStorage.setItem('sw_email', newSession.user?.email || '');
                }
            });
        } catch { }
    }

    // Lancer après le DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
