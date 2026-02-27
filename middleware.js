// Vercel Edge Middleware — Redirige les visiteurs desktop vers la vitrine
// L'app (/pages/*) est réservée aux mobiles et PWA

export const config = {
    matcher: '/pages/:path*',
};

export default function middleware(request) {
    const ua = request.headers.get('user-agent') || '';
    const url = new URL(request.url);

    // Autoriser les bots/crawlers (SEO)
    if (/bot|crawler|spider|googlebot|bingbot|yandex|duckduck/i.test(ua)) {
        return;
    }

    // Détecter mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua);

    // Détecter PWA (Referer ou sec-fetch-dest)
    const secFetchDest = request.headers.get('sec-fetch-dest');
    const secFetchMode = request.headers.get('sec-fetch-mode');
    const isPWA = secFetchMode === 'navigate' && (
        request.headers.get('referer')?.includes('/pages/') ||
        request.headers.get('sec-fetch-site') === 'same-origin'
    );

    // Si desktop et pas PWA → rediriger vers vitrine
    if (!isMobile) {
        return Response.redirect(new URL('/', request.url), 302);
    }

    // Mobile ou PWA → laisser passer
    return;
}
