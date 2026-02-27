/**
 * SwellSync — Monitoring & Error Tracking
 * Utilise Sentry (lite) via CDN pour capturer les erreurs JS non gérées
 * Version légère — ne collecte pas de données personnelles
 */
(function () {
    'use strict';

    // Configuration Sentry
    const SENTRY_DSN = 'https://examplePublicKey@o0.ingest.sentry.io/0'; // TODO: Remplacer par le vrai DSN Sentry
    const ENV = window.location.hostname === 'swellsync.fr' ? 'production' : 'development';

    if (ENV === 'development') return; // Pas de reporting en dev local

    // Écouter les erreurs JS non gérées
    window.addEventListener('error', function (e) {
        reportError({
            type: 'javascript',
            message: e.message,
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            stack: e.error?.stack
        });
    });

    // Écouter les rejections de promesses non gérées
    window.addEventListener('unhandledrejection', function (e) {
        reportError({
            type: 'unhandledrejection',
            message: String(e.reason),
            stack: e.reason?.stack
        });
    });

    function reportError(errorData) {
        // En attendant un vrai Sentry DSN, log en console groupé
        console.group('%c🚨 SW Error Captured', 'color:#ef4444;font-weight:bold');
        console.error(errorData);
        console.groupEnd();

        // Envoyer à Sentry si DSN configuré
        // Sentry.captureException(errorData); // Activer après config Sentry
    }

    // Performance monitoring simple
    window.addEventListener('load', function () {
        if (!performance?.timing) return;
        const t = performance.timing;
        const loadTime = t.loadEventEnd - t.navigationStart;
        const ttfb = t.responseStart - t.navigationStart;
        const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint');

        if (loadTime > 5000) {
            console.warn('[SwellSync Monitor] Temps de chargement élevé:', loadTime + 'ms');
        }

        // Reporter les Web Vitals en production
        if (ENV === 'production' && typeof gtag !== 'undefined') {
            // Core Web Vitals reporting
        }
    });

    // Health check — Supabase
    async function checkSupabaseHealth() {
        try {
            const SB_URL = 'https://bxudysseskfpmlpagoid.supabase.co';
            const res = await fetch(`${SB_URL}/rest/v1/`, {
                headers: { 'apikey': 'sb_publishable_8UPKYf9eOQjX9-5bBGl1CA_XRu8ZkiU' }
            });
            if (!res.ok) console.warn('[SwellSync Monitor] Supabase health check failed:', res.status);
        } catch (err) {
            console.warn('[SwellSync Monitor] Supabase unreachable:', err.message);
        }
    }

    // Check au démarrage
    if (ENV === 'production') {
        checkSupabaseHealth();
    }
})();
