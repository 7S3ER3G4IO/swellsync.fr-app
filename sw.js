// SwellSync Service Worker — Cache-first for assets, network-first for data
const CACHE_NAME = 'swellsync-v2';
const ASSETS = [
    '/pages/home.html',
    '/pages/splash.html',
    '/pages/forecast.html',
    '/pages/community.html',
    '/pages/profile.html',
    '/pages/map.html',
    '/pages/search.html',
    '/pages/alerts.html',
    '/pages/messages.html',
    '/pages/settings.html',
    '/pages/coaching.html',
    '/pages/css/transitions.css',
    '/pages/js/theme.js',
    '/pages/js/api.js',
    '/pages/js/ui-components.js',
    '/pages/js/notif-badge.js',
    '/pages/js/adsense.js',
    '/manifest.json'
];

// Install — cache all static assets
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch — cache-first for assets, network-first for API
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    // Network-first for API calls
    if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
        e.respondWith(
            fetch(e.request)
                .catch(() => caches.match(e.request))
        );
        return;
    }

    // Cache-first for everything else
    e.respondWith(
        caches.match(e.request)
            .then(cached => cached || fetch(e.request)
                .then(response => {
                    // Cache new resources
                    if (response.ok && e.request.method === 'GET') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                    }
                    return response;
                })
            )
    );
});
