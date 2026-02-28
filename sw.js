// SwellSync Service Worker — Cache-first for assets, network-first for data
const CACHE_NAME = 'swellsync-v5';
const OFFLINE_URL = '/offline.html';
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
    '/pages/stats.html',
    '/pages/referral.html',
    '/pages/pro-welcome.html',
    '/pages/session-live.html',
    '/pages/history.html',
    '/offline.html',
    '/404.html',
    '/css/styles.css',
    '/js/toast.js',
    '/js/gamification.js',
    '/js/stats.js',
    '/js/coaching.js',
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

// Fetch — cache-first for assets, network-first for API, offline fallback for HTML
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);

    // Skip non-GET requests
    if (e.request.method !== 'GET') return;

    // Network-first for API / Supabase / AdSense
    if (url.pathname.startsWith('/api/') ||
        url.hostname.includes('supabase') ||
        url.hostname.includes('googlesyndication')) {
        e.respondWith(
            fetch(e.request)
                .catch(() => caches.match(e.request) || new Response('', { status: 503 }))
        );
        return;
    }

    // For HTML navigation: network-first with offline fallback
    if (e.request.mode === 'navigate' || e.request.headers.get('accept')?.includes('text/html')) {
        e.respondWith(
            fetch(e.request)
                .then(response => {
                    if (response.ok) {
                        caches.open(CACHE_NAME).then(c => c.put(e.request, response.clone()));
                    }
                    return response;
                })
                .catch(() => caches.match(e.request) || caches.match(OFFLINE_URL))
        );
        return;
    }

    // Cache-first for static assets (CSS, JS, images)
    e.respondWith(
        caches.match(e.request)
            .then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(response => {
                    if (response.ok) {
                        caches.open(CACHE_NAME).then(c => c.put(e.request, response.clone()));
                    }
                    return response;
                }).catch(() => new Response('', { status: 404 }));
            })
    );
});

// ── Push Notifications ──────────────────────────────────────────────────────
self.addEventListener('push', e => {
    let data = {
        title: 'SwellSync 🌊',
        body: 'Les conditions sont idéales pour surfer !',
        icon: '/assets/images/swellsync_logo.png',
        badge: '/assets/images/swellsync_logo.png',
        url: '/pages/alerts.html'
    };

    try {
        const payload = e.data?.json();
        if (payload) {
            data.title = payload.title || data.title;
            data.body = payload.body || data.body;
            data.url = payload.url || data.url;
        }
    } catch { }

    e.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.badge,
            vibrate: [200, 100, 200],
            tag: 'swellsync-alert',
            renotify: true,
            data: { url: data.url }
        })
    );
});

// Ouvre l'app au clic sur la notification
self.addEventListener('notificationclick', e => {
    e.notification.close();
    const target = e.notification.data?.url || '/pages/alerts.html';
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            for (const client of list) {
                if (client.url.includes('swellsync') && 'focus' in client) {
                    client.navigate(target);
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(target);
        })
    );
});
