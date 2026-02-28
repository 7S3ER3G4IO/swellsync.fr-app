/**
 * SwellSync — Lazy Loading avancé (T180)
 * Intersection Observer sur tous les composants non-visibles
 * + T177: Code splitting par page (chargement conditionnel des modules)
 * + T172: Réserver l'espace des pubs pour éviter le CLS
 */

// ── T180: Lazy load images + iframes ─────────────────────────────────
const LazyLoader = {

    init() {
        if (!('IntersectionObserver' in window)) {
            // Fallback: charger tout immédiatement
            document.querySelectorAll('[data-src]').forEach(el => this._load(el));
            return;
        }

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) { this._load(entry.target); io.unobserve(entry.target); }
            });
        }, { rootMargin: '200px 0px', threshold: 0.01 });

        document.querySelectorAll('[data-src],[data-lazysrc],img[loading="lazy"]').forEach(el => io.observe(el));
        this._io = io;
    },

    _load(el) {
        if (el.dataset.src) { el.src = el.dataset.src; delete el.dataset.src; }
        if (el.dataset.lazysrc) { el.src = el.dataset.lazysrc; delete el.dataset.lazysrc; }
        el.classList.remove('skeleton');
    },

    // Observer un nouveau element ajouté dynamiquement
    observe(el) { this._io?.observe(el); }
};

// ── T177: Charger un module JS seulement si la page en a besoin ──────
const ModuleLoader = {
    _loaded: new Set(),

    async load(modulePath) {
        if (this._loaded.has(modulePath)) return;
        this._loaded.add(modulePath);
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = modulePath; s.defer = true;
            s.onload = resolve; s.onerror = reject;
            document.head.appendChild(s);
        });
    },

    // Charger Leaflet seulement sur les pages de carte
    async loadLeaflet() {
        if (window.L) return;
        await this.load('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
        // CSS Leaflet
        if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
    },

    // Charger Chart.js seulement sur les pages stats
    async loadChartJS() {
        if (window.Chart) return;
        return this.load('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js');
    },

    // Charger Leaflet.markercluster (clustering)
    async loadMarkerCluster() {
        if (L.markerClusterGroup) return;
        return this.load('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js');
    }
};

// ── T172: Réserver espace pubs pour éviter CLS ───────────────────────
const AdSpacer = {
    init() {
        document.querySelectorAll('.adsbygoogle').forEach(ad => {
            const parent = ad.closest('.ad-container, .ad-banner-top, .ad-banner-bottom');
            if (parent && !parent.style.minHeight) {
                // Réserver 90px pour les bannières, 250px pour les rectangles
                const minH = ad.dataset.adFormat === 'rectangle' ? '250px' : '90px';
                parent.style.minHeight = minH;
                parent.style.display = 'block';
            }
        });
    }
};

// ── T176: Détecter quand le CSS critique est chargé ──────────────────
const CriticalCSS = {
    // Charger les fonts Google de façon non-bloquante
    loadFonts() {
        const link = document.createElement('link');
        link.rel = 'preload'; link.as = 'style';
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
        link.onload = () => { link.rel = 'stylesheet'; };
        document.head.appendChild(link);
        // Fallback pour les navigateurs ne supportant pas preload
        const noscript = document.createElement('noscript');
        noscript.innerHTML = '<link rel="stylesheet" href="' + link.href + '">';
        document.head.appendChild(noscript);
    }
};

// Auto-init au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        LazyLoader.init();
        AdSpacer.init();
    });
} else {
    LazyLoader.init();
    AdSpacer.init();
}

window.LazyLoader = LazyLoader;
window.ModuleLoader = ModuleLoader;
window.CriticalCSS = CriticalCSS;
