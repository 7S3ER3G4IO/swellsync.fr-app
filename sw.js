// ── SwellSync Service Worker v5 — Optimisé pour /pages/ ──────────────────
const CACHE_NAME = 'swellsync-v5';
const STATIC_ASSETS = [
    '/pages/home.html',
    '/pages/map.html',
    '/pages/community.html',
    '/pages/alerts.html',
    '/pages/profile.html',
    '/pages/settings.html',
    '/pages/badges.html',
    '/pages/search.html',
    '/pages/support.html',
    '/pages/abonnement.html',
    '/pages/js/api.js',
    '/pages/js/theme.js',
    '/manifest.json',
];

// ── Installation : pré-cache des pages principales ────────────────────────
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return Promise.allSettled(
                    STATIC_ASSETS.map(url => cache.add(new Request(url, { cache: 'reload' })).catch(() => { }))
                );
            })
            .then(() => self.skipWaiting())
    );
});

// ── Activation : purge des anciens caches ────────────────────────────────
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// ── Fetch : stratégie hybride ─────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // ① APIs → Network only, offline fallback JSON
    if (url.pathname.startsWith('/api/')) {
        e.respondWith(fetch(e.request).catch(() =>
            new Response(JSON.stringify({ error: 'Hors ligne' }), {
                headers: { 'Content-Type': 'application/json' }
            })
        ));
        return;
    }

    // ② CDN externes → network first, cache fallback
    if (!url.origin.includes(self.location.origin)) {
        e.respondWith(
            fetch(e.request)
                .then(resp => {
                    if (resp.ok) {
                        const cloned = resp.clone();
                        caches.open(CACHE_NAME).then(c => c.put(e.request, cloned));
                    }
                    return resp;
                })
                .catch(() => caches.match(e.request))
        );
        return;
    }

    // ③ Assets locaux → stale-while-revalidate
    e.respondWith(
        caches.match(e.request).then(cached => {
            const fetchPromise = fetch(e.request)
                .then(resp => {
                    if (resp.ok) {
                        caches.open(CACHE_NAME).then(c => c.put(e.request, resp.clone()));
                    }
                    return resp;
                })
                .catch(() => cached || new Response('<h1>SwellSync — Hors ligne</h1><p>Reconnecte-toi pour accéder à l\'app.</p>', {
                    headers: { 'Content-Type': 'text/html' }
                }));
            return cached || fetchPromise;
        })
    );
});

// ── Push Notifications ────────────────────────────────────────────────────
self.addEventListener('push', (e) => {
    let data = { title: 'SwellSync 🏄', body: 'Nouvelles conditions disponibles !' };
    try { data = e.data?.json() || data; } catch { }
    e.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/assets/images/swellsync_logo.png',
            badge: '/assets/images/swellsync_logo.png',
            tag: 'swellsync-notif',
            requireInteraction: false,
            data: { url: data.url || '/pages/home.html' }
        })
    );
});

self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    const url = e.notification.data?.url || '/pages/home.html';
    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clients => {
                const existing = clients.find(c => c.url.includes(url) && 'focus' in c);
                return existing ? existing.focus() : self.clients.openWindow(url);
            })
    );
});
