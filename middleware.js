// Vercel Edge Middleware — Redirige les visiteurs desktop vers la vitrine
// L'app (/pages/*) est réservée aux mobiles et PWA

export const config = {
    matcher: '/pages/:path*',
};

export default function middleware(request) {
    const ua = request.headers.get('user-agent') || '';
    const url = new URL(request.url);

    // Ne JAMAIS rediriger les fichiers statiques (JS, CSS, images, fonts, etc.)
    if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|mp4|webm|json|xml|txt|map)$/i.test(url.pathname)) {
        return;
    }

    // Autoriser les bots/crawlers (SEO)
    if (/bot|crawler|spider|googlebot|bingbot|yandex|duckduck/i.test(ua)) {
        return;
    }

    // Détecter mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua);

    // Détecter PWA ou iframe (preview-mobile.html, même origine)
    const secFetchDest = request.headers.get('sec-fetch-dest');
    const secFetchMode = request.headers.get('sec-fetch-mode');
    const referer = request.headers.get('referer') || '';
    const isIframe = secFetchDest === 'iframe';
    const isSameOriginNav = referer.includes('/pages/') || referer.includes('/preview-mobile');
    const isPWA = isIframe || isSameOriginNav;

    // Si desktop et pas PWA/iframe → rediriger vers vitrine
    if (!isMobile && !isPWA) {
        return Response.redirect(new URL('/', request.url), 302);
    }

    // Mobile ou PWA → laisser passer
    return;
}
