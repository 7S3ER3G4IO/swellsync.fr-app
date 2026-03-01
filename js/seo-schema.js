/**
 * SwellSync — SEO Schema.org + Sitemap (T191-T200)
 * T191: Pages spots URL sémantiques → already done (spots/biarritz.html etc.)
 * T192: Schema.org SportsEvent pour sessions partagées
 * T193: Schema.org Place pour fiches spots → already done
 * T194: Schema.org FAQPage
 * T195: Schema.org Review pour avis spots
 * T196: Sitemap XML dynamique
 * T197: Sitemap images
 * T198: Sitemap vidéo
 * T199: Optimiser h1/h2 pour mots-clés
 * T200: Soumettre sur annuaires surf FR
 */

const SEOUtils = {

    // T192 — Schema.org SportsEvent pour sessions publiques
    injectSportsEvent(session = {}) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": `Session surf — ${session.spot_name || 'SwellSync'}`,
            "sport": "Surfing",
            "location": {
                "@type": "Place",
                "name": session.spot_name || "Spot de surf",
                "address": { "@type": "PostalAddress", "addressCountry": "FR" }
            },
            "startDate": session.started_at || new Date().toISOString(),
            "organizer": { "@type": "Organization", "name": "SwellSync", "url": "https://swellsync.fr" }
        };
        this._injectSchema(schema, 'schema-sports-event');
    },

    // T194 — Schema.org FAQPage
    injectFAQSchema(faqs = []) {
        const defaultFAQs = [
            { q: "SwellSync est-il gratuit ?", a: "Oui, SwellSync est gratuit. Un abonnement Pro à 4,99€/mois débloque des fonctionnalités avancées comme les alertes conditions parfaites, l'export PDF et le coaching personnalisé." },
            { q: "Sur quels spots SwellSync donne-t-il des prévisions ?", a: "SwellSync couvre 143 spots de surf en France : Biarritz, Hossegor, La Torche, Lacanau, Capbreton, Seignosse et bien d'autres spots bretons, normands et méditerranéens." },
            { q: "Comment fonctionne le score surf ?", a: "Notre algorithme note chaque créneau de 0 à 10 en combinant la hauteur de houle, la période, la direction du vent et les marées. Un score de 7+ indique d'excellentes conditions." },
            { q: "Puis-je utiliser SwellSync sans connexion internet ?", a: "Oui ! SwellSync est une Progressive Web App (PWA). Les sessions GPS et les données récentes sont disponibles hors-ligne. La synchronisation se fait automatiquement à la reconnexion." },
            { q: "Comment installer SwellSync sur mon téléphone ?", a: "Sur Android : ouvre swellsync.fr dans Chrome et appuie sur 'Ajouter à l'écran d'accueil'. Sur iOS : ouvre dans Safari, appuie sur Partager puis 'Sur l'écran d'accueil'." }
        ];
        const faqList = faqs.length ? faqs : defaultFAQs;
        const schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqList.map(f => ({
                "@type": "Question",
                "name": f.q,
                "acceptedAnswer": { "@type": "Answer", "text": f.a }
            }))
        };
        this._injectSchema(schema, 'schema-faq');
    },

    // T195 — Schema.org Review pour les avis spots
    injectSpotReview(spot = {}, reviews = []) {
        if (!reviews.length) return;
        const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
        const schema = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": `Spot surf ${spot.name}`,
            "@id": `https://swellsync.fr/spots/${spot.slug}`,
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": avgRating.toFixed(1),
                "reviewCount": reviews.length,
                "bestRating": "5",
                "worstRating": "1"
            },
            "review": reviews.slice(0, 3).map(r => ({
                "@type": "Review",
                "author": { "@type": "Person", "name": r.username || "Surfeur SwellSync" },
                "reviewRating": { "@type": "Rating", "ratingValue": r.rating },
                "reviewBody": r.comment || "",
                "datePublished": r.created_at
            }))
        };
        this._injectSchema(schema, 'schema-review');
    },

    // T196 — Sitemap XML dynamique
    async generateSitemap() {
        const baseUrl = 'https://swellsync.fr';
        const now = new Date().toISOString().slice(0, 10);
        const staticPages = [
            { url: '/', priority: '1.0', changefreq: 'daily' },
            { url: '/fonctionnalites.html', priority: '0.9', changefreq: 'weekly' },
            { url: '/tarifs.html', priority: '0.9', changefreq: 'weekly' },
            { url: '/contact.html', priority: '0.6', changefreq: 'monthly' },
            { url: '/blog/', priority: '0.8', changefreq: 'weekly' },
            { url: '/blog/comment-lire-previsions-surf.html', priority: '0.7', changefreq: 'monthly' },
            { url: '/blog/progression-surf-debutant.html', priority: '0.7', changefreq: 'monthly' },
            { url: '/blog/meilleurs-spots-surf-france.html', priority: '0.7', changefreq: 'monthly' },
        ];
        const spotPages = ['biarritz', 'hossegor', 'la-torche', 'lacanau', 'capbreton', 'seignosse'].map(s => ({ url: `/spots/${s}.html`, priority: '0.8', changefreq: 'weekly' }));
        const allPages = [...staticPages, ...spotPages];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages.map(p => `  <url>
    <loc>${baseUrl}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
        return xml;
    },

    // T197 — Sitemap images
    generateImageSitemap() {
        const baseUrl = 'https://swellsync.fr';
        const images = [
            { page: '/spots/biarritz.html', url: '/assets/images/spots/biarritz.jpg', title: 'Surf Biarritz — Grande Plage', caption: 'Spot de surf emblématique du pays basque français' },
            { page: '/spots/hossegor.html', url: '/assets/images/spots/hossegor.jpg', title: 'Surf Hossegor — La Gravière', caption: 'Le meilleur beach break des Landes' },
            { page: '/spots/la-torche.html', url: '/assets/images/spots/la-torche.jpg', title: 'Surf La Torche — Bretagne', caption: 'Le spot de surf incontournable du Finistère' },
            { page: '/', url: '/assets/images/og-home.jpg', title: 'SwellSync — App prévisions surf France', caption: 'Application mobile de surf pour les surfeurs français' },
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${images.map(img => `  <url>
    <loc>${baseUrl}${img.page}</loc>
    <image:image>
      <image:loc>${baseUrl}${img.url}</image:loc>
      <image:title>${img.title}</image:title>
      <image:caption>${img.caption}</image:caption>
    </image:image>
  </url>`).join('\n')}
</urlset>`;
        return xml;
    },

    // T199 — Vérifier structure H1/H2 pour SEO
    auditHeadings() {
        const h1s = document.querySelectorAll('h1');
        const h2s = document.querySelectorAll('h2');
        if (h1s.length === 0) console.warn('[SEO] Aucun H1 sur cette page');
        if (h1s.length > 1) console.warn(`[SEO] ${h1s.length} H1 trouvés — devrait être exactement 1`);
        if (h2s.length === 0) console.warn('[SEO] Aucun H2 sur cette page');
        return { h1Count: h1s.length, h2Count: h2s.length, h1Text: h1s[0]?.textContent };
    },

    // Injecter Schema.org dans le <head>
    _injectSchema(schema, id) {
        const existing = document.getElementById(id);
        if (existing) existing.remove();
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = id;
        script.textContent = JSON.stringify(schema, null, 2);
        document.head.appendChild(script);
    },

    // Injection automatique Schema WebSite + Organization
    injectBaseSchemas() {
        this._injectSchema({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "SwellSync",
            "url": "https://swellsync.fr",
            "potentialAction": { "@type": "SearchAction", "target": "https://swellsync.fr/spots.html?q={search_term_string}", "query-input": "required name=search_term_string" }
        }, 'schema-website');

        this._injectSchema({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "SwellSync",
            "url": "https://swellsync.fr",
            "logo": "https://swellsync.fr/assets/icons/icon-512.png",
            "sameAs": ["https://instagram.com/swellsync_fr", "https://twitter.com/swellsync"],
            "contactPoint": { "@type": "ContactPoint", "email": "hello@swellsync.fr", "contactType": "customer service", "availableLanguage": "French" }
        }, 'schema-org');
    }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
    SEOUtils.injectBaseSchemas();
    SEOUtils.injectFAQSchema();
    SEOUtils.auditHeadings();
});

window.SEOUtils = SEOUtils;
