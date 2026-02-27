/**
 * SwellSync — App Access Guard
 * L'app est réservée aux mobiles / PWA installée.
 * Sur desktop, on redirige vers la vitrine (landing page).
 */
(function () {
    'use strict';

    // Ne jamais bloquer si on est déjà sur la landing page
    var path = window.location.pathname;
    if (path === '/' || path === '/index.html' || path.endsWith('/index.html') && !path.includes('/pages/')) return;

    // Autoriser si on est dans un iframe (preview-mobile.html)
    try { if (window.self !== window.top) return; } catch (e) { return; }

    // Détection PWA installée (standalone)
    var isStandalone = window.navigator.standalone === true ||
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        document.referrer.includes('android-app://');

    // Détection mobile (user agent)
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && window.innerWidth < 1024);

    // Capacitor / Cordova (app native)
    var isNativeApp = typeof window.Capacitor !== 'undefined' || typeof window.cordova !== 'undefined';

    // Autoriser si : mobile OU PWA OU app native
    if (isMobile || isStandalone || isNativeApp) return;

    // Desktop détecté → rediriger vers la vitrine
    window.location.replace('/');
})();
