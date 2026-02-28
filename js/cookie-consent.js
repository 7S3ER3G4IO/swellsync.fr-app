/**
 * SwellSync — Bandeau Cookie Consent RGPD
 * Conforme ePrivacy + RGPD — Sans consentement requis pour analytics first-party (Plausible)
 * Affichage au premier accès, mémorisé en localStorage
 */
(function () {
    'use strict';

    const KEY = 'sw_cookie_consent';
    const consent = localStorage.getItem(KEY);

    // Plausible est privacy-first (no cookies, no personal data) — pas besoin de consentement
    // Mais on affiche quand même le bandeau pour compliance EU ePrivacy
    if (consent) return;

    function createBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Politique de cookies');
        banner.setAttribute('aria-live', 'polite');
        banner.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 12px;
            right: 12px;
            max-width: 480px;
            margin: 0 auto;
            background: #111;
            border: 1px solid rgba(0,186,214,.25);
            border-radius: 16px;
            padding: 16px;
            z-index: 9999;
            box-shadow: 0 8px 32px rgba(0,0,0,.5);
            font-family: 'Space Grotesk', 'Inter', sans-serif;
            animation: slideUp .3s ease;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            #cookie-banner p { margin: 0 0 12px; font-size: 12px; color: #94a3b8; line-height: 1.5; }
            #cookie-banner strong { color: #fff; }
            #cookie-banner a { color: #00bad6; text-decoration: underline; }
            #cookie-banner .cookie-btns { display: flex; gap: 8px; flex-wrap: wrap; }
            #cookie-banner button {
                font-size: 12px; font-weight: 700; padding: 8px 16px; border-radius: 10px;
                border: none; cursor: pointer; transition: all .15s; flex: 1;
            }
            #cookie-accept {
                background: linear-gradient(135deg, #00bad6, #0077cc);
                color: #000;
            }
            #cookie-reject {
                background: rgba(255,255,255,.06);
                color: #94a3b8;
                border: 1px solid rgba(255,255,255,.1) !important;
            }
        `;
        document.head.appendChild(style);

        banner.innerHTML = `
            <p>
                <strong>🍪 Cookies & confidentialité</strong><br>
                SwellSync utilise des cookies essentiels pour ton compte, et des analytics anonymes (<a href="https://plausible.io" target="_blank" rel="noopener">Plausible</a> — sans données personnelles).<br>
                <a href="/cookies.html">Politique cookies</a> · <a href="/privacy.html">Vie privée</a>
            </p>
            <div class="cookie-btns">
                <button id="cookie-accept">Accepter</button>
                <button id="cookie-reject">Refuser les optionnels</button>
            </div>
        `;

        document.body.appendChild(banner);

        document.getElementById('cookie-accept').addEventListener('click', () => {
            localStorage.setItem(KEY, JSON.stringify({ analytics: true, date: Date.now() }));
            banner.style.animation = 'slideUp .2s ease reverse';
            setTimeout(() => banner.remove(), 200);
            // Activer Plausible si CE n'était pas encore chargé
            if (!window.plausible) loadPlausible();
        });

        document.getElementById('cookie-reject').addEventListener('click', () => {
            localStorage.setItem(KEY, JSON.stringify({ analytics: false, date: Date.now() }));
            banner.remove();
        });
    }

    function loadPlausible() {
        // Plausible — RGPD compliant (no cookies, no fingerprinting)
        const s = document.createElement('script');
        s.defer = true;
        s.setAttribute('data-domain', 'swellsync.fr');
        s.src = 'https://plausible.io/js/script.js';
        document.head.appendChild(s);
    }

    // Charger Plausible si consentement déjà donné (analytics: true)
    const storedConsent = localStorage.getItem(KEY);
    if (storedConsent) {
        try {
            const parsed = JSON.parse(storedConsent);
            if (parsed.analytics) loadPlausible();
        } catch { }
        return;
    }

    // Afficher le bandeau après chargement DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createBanner);
    } else {
        createBanner();
    }
})();

// Gestion AdSense selon consentement RGPD
function manageAdSenseConsent(hasConsent) {
  if (hasConsent) {
    // Activer les pubs personnalisées
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.pauseAdRequests = 0;
  } else {
    // Désactiver les pubs personnalisées (non-personalized ads)
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.requestNonPersonalizedAds = 1;
  }
}

// Appeler selon le consentement actuel
const _existingConsent = localStorage.getItem('sw_cookie_consent');
if (_existingConsent === 'accepted') {
  manageAdSenseConsent(true);
} else if (_existingConsent === 'refused') {
  manageAdSenseConsent(false);
}
