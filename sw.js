// SwellSync Service Worker — Cache-first for assets, network-first for data
const CACHE_NAME = 'swellsync-v3';
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
    '/js/offline-banner.js',
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
                    if (response.ok && e.request.method === 'GET') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                    }
                    return response;
                })
            )
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
