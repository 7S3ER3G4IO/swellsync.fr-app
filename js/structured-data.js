/**
 * SwellSync — Données Structurées JSON-LD
 * Injecter Organization + WebApplication + WebSite schema sur chaque page
 */
(function () {
    function injectSchema(schema) {
        const el = document.createElement('script');
        el.type = 'application/ld+json';
        el.textContent = JSON.stringify(schema);
        document.head.appendChild(el);
    }

    // Schema: Organization
    injectSchema({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "SwellSync",
        "url": "https://swellsync.fr",
        "logo": "https://swellsync.fr/assets/images/swellsync_logo.png",
        "description": "Application de prévisions surf en temps réel pour 60+ spots de la côte Atlantique française.",
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": "contact@swellsync.fr",
            "availableLanguage": "French"
        },
        "sameAs": [
            "https://instagram.com/swellsync",
            "https://twitter.com/swellsync"
        ]
    });

    // Schema: WebSite avec SearchAction
    injectSchema({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "SwellSync",
        "url": "https://swellsync.fr",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://swellsync.fr/pages/search.html?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
        }
    });

    // Schema: MobileApplication (si page app)
    const isAppPage = window.location.pathname.includes('/pages/');
    if (isAppPage) {
        injectSchema({
            "@context": "https://schema.org",
            "@type": "MobileApplication",
            "name": "SwellSync",
            "operatingSystem": "Android, iOS",
            "applicationCategory": "SportsApplication",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR"
            },
            "description": "Prévisions surf en temps réel, journal de sessions, communauté de surfeurs.",
            "screenshot": "https://swellsync.fr/assets/images/swellsync_logo.png"
        });
    }
})();
