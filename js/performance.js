/**
 * SwellSync — Performance & Core Web Vitals (T171-T180)
 * T171: Observer LCP
 * T172: Réserver espaces pour pubs (CLS prevention)
 * T173: Différer scripts non-critiques (FID)
 * T174: Optimiser INP
 * T175: Audit Lighthouse helpers
 * T176: CSS critical inlining helper
 * T177: Code splitting par page
 * T178: CDN assets (Cloudflare)
 * T179: Compression Brotli check
 * T180: Lazy load Intersection Observer
 */

const PerformanceUtils = {

    // T171 — Observer LCP (Largest Contentful Paint)
    observeLCP() {
        if (!('PerformanceObserver' in window)) return;
        const observer = new PerformanceObserver(list => {
            const entries = list.getEntries();
            const lcp = entries[entries.length - 1];
            if (lcp.startTime > 2500) {
                console.warn(`[SwellSync Perf] LCP trop lent: ${Math.round(lcp.startTime)}ms (cible: <2500ms)`);
                // Envoyer à Supabase analytics
                supabase.from('perf_metrics').insert({ metric: 'LCP', value: Math.round(lcp.startTime), url: location.pathname, timestamp: new Date().toISOString() }).catch(() => { });
            }
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
    },

    // T172 — Réserver espaces pub (CLS < 0.1)
    reserveAdSpaces() {
        document.querySelectorAll('.ad-placeholder, [data-ad-slot]').forEach(el => {
            if (!el.style.minHeight) el.style.minHeight = el.dataset.adHeight || '90px';
            if (!el.style.width) el.style.width = '100%';
            el.style.display = 'block';
            el.style.contain = 'layout';
        });
    },

    // T173 — Différer les scripts non-critiques (FID optimization)
    deferNonCritical(selectors = []) {
        const run = () => {
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(script => {
                    const newScript = document.createElement('script');
                    [...script.attributes].forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.removeAttribute('defer');
                    if (script.src) { newScript.src = script.src; }
                    else { newScript.textContent = script.textContent; }
                    script.parentNode.replaceChild(newScript, script);
                });
            });
        };
        if (document.readyState === 'complete') { setTimeout(run, 200); }
        else { window.addEventListener('load', () => setTimeout(run, 200)); }
    },

    // T174 — INP optimization: débounce les interactions lourdes
    optimizeINP() {
        // Remplacer les onclick lourds par des interactions snapshottées
        let scheduledWork = null;
        window.scheduleWork = (fn) => {
            if (scheduledWork) return;
            scheduledWork = true;
            requestAnimationFrame(() => { scheduledWork = null; fn(); });
        };
    },

    // T175 — Vérifications Lighthouse automatiques
    async runLighthouseChecks() {
        const results = [];
        // LCP
        const lcp = await new Promise(res => {
            const obs = new PerformanceObserver(list => { res(list.getEntries().pop().startTime); obs.disconnect(); });
            obs.observe({ type: 'largest-contentful-paint', buffered: true });
            setTimeout(() => res(null), 3000);
        });
        if (lcp) results.push({ metric: 'LCP', value: Math.round(lcp), target: 2500, pass: lcp < 2500 });
        // CLS
        const cls = await new Promise(res => {
            let value = 0;
            const obs = new PerformanceObserver(list => { list.getEntries().forEach(e => { if (!e.hadRecentInput) value += e.value; }); });
            obs.observe({ type: 'layout-shift', buffered: true });
            setTimeout(() => { obs.disconnect(); res(value); }, 2000);
        });
        results.push({ metric: 'CLS', value: cls.toFixed(4), target: 0.1, pass: cls < 0.1 });
        // Meta check
        results.push({ metric: 'Meta desc', value: document.querySelector('meta[name="description"]')?.content?.length || 0, target: 150, pass: !!document.querySelector('meta[name="description"]') });
        results.push({ metric: 'H1 unique', value: document.querySelectorAll('h1').length, target: 1, pass: document.querySelectorAll('h1').length === 1 });
        results.push({ metric: 'Images alt', value: document.querySelectorAll('img:not([alt])').length, target: 0, pass: document.querySelectorAll('img:not([alt])').length === 0 });
        console.table(results);
        return results;
    },

    // T180 — Lazy load via Intersection Observer
    initLazyLoad() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                if (el.dataset.src) { el.src = el.dataset.src; el.removeAttribute('data-src'); }
                if (el.dataset.bg) { el.style.backgroundImage = `url(${el.dataset.bg})`; el.removeAttribute('data-bg'); }
                if (el.dataset.component) { this._loadComponent(el); }
                observer.unobserve(el);
            });
        }, { rootMargin: '200px 0px', threshold: 0.01 });

        document.querySelectorAll('[data-src], [data-bg], [data-component], .lazy').forEach(el => observer.observe(el));
        return observer;
    },

    async _loadComponent(el) {
        const name = el.dataset.component;
        try {
            const script = document.createElement('script');
            script.src = `/js/${name}.js`;
            document.head.appendChild(script);
            await new Promise(res => { script.onload = res; script.onerror = res; });
            el.removeAttribute('data-component');
        } catch { }
    },

    // T178 — Helpers CDN Cloudflare (format URL)
    cdnUrl(path, opts = {}) {
        const base = 'https://swellsync.fr';
        if (!opts.width && !opts.quality) return `${base}${path}`;
        // Cloudflare Image Resizing format
        const params = [];
        if (opts.width) params.push(`width=${opts.width}`);
        if (opts.quality) params.push(`quality=${opts.quality}`);
        if (opts.format) params.push(`format=${opts.format}`);
        return `${base}/cdn-cgi/image/${params.join(',')}${path}`;
    },

    // Vérifier si Brotli est actif (T179)
    async checkBrotli() {
        try {
            const res = await fetch('/robots.txt', { headers: { 'Accept-Encoding': 'br, gzip, deflate' } });
            const encoding = res.headers.get('content-encoding');
            if (encoding !== 'br') { console.warn('[SwellSync Perf] Brotli non actif sur Vercel. Vérifier vercel.json headers.'); }
            return encoding === 'br';
        } catch { return false; }
    },

    // Initialisation globale des optimisations perf
    init() {
        this.observeLCP();
        this.reserveAdSpaces();
        this.optimizeINP();
        this.initLazyLoad();
        // Observer CLS
        if ('PerformanceObserver' in window) {
            try {
                const clsObs = new PerformanceObserver(list => {
                    let cls = 0;
                    list.getEntries().forEach(e => { if (!e.hadRecentInput) cls += e.value; });
                    if (cls > 0.1) console.warn(`[SwellSync Perf] CLS élevé: ${cls.toFixed(4)}`);
                });
                clsObs.observe({ type: 'layout-shift', buffered: true });
            } catch { }
        }
    }
};

// Auto-init après DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => PerformanceUtils.init());
window.PerformanceUtils = PerformanceUtils;
