/**
 * SwellSync — Offline Banner
 * Affiche une bannière "Hors-ligne" quand la connexion est perdue
 * et la masque au retour du réseau.
 */
(function () {
    'use strict';

    let banner = null;

    function createBanner() {
        if (banner) return banner;
        banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
            background: linear-gradient(135deg, #1e293b, #0f172a);
            border-bottom: 2px solid rgba(239,68,68,0.5);
            color: #f87171; font-size: 12px; font-weight: 700;
            text-align: center; padding: 8px 16px;
            font-family: 'Inter', system-ui, sans-serif;
            display: none; gap: 6px; align-items: center; justify-content: center;
            backdrop-filter: blur(12px);
        `;
        banner.innerHTML = `
            <span style="font-size:14px">📡</span>
            <span>Tu es hors-ligne — certaines fonctionnalités sont désactivées</span>
        `;
        document.body.prepend(banner);
        return banner;
    }

    function showBanner() {
        const b = createBanner();
        b.style.display = 'flex';
        // Décaler le contenu de la page
        document.body.style.paddingTop = (parseInt(getComputedStyle(document.body).paddingTop) || 0) + 36 + 'px';
    }

    function hideBanner() {
        if (banner) {
            banner.style.display = 'none';
            document.body.style.paddingTop = '';
        }
    }

    // Initial check
    if (!navigator.onLine) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showBanner);
        } else {
            showBanner();
        }
    }

    // Listen for online/offline events
    window.addEventListener('offline', showBanner);
    window.addEventListener('online', () => {
        hideBanner();
        // Toast feedback
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:10000;background:#10b981;color:#000;font-weight:700;font-size:12px;padding:8px 16px;border-radius:16px;box-shadow:0 4px 16px rgba(16,185,129,0.3);font-family:Inter,system-ui,sans-serif';
        t.textContent = '✅ Connexion rétablie';
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    });
})();
