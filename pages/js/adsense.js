/* ═══════════════════════════════════════════════════════════════
   SwellSync — Google AdSense Integration
   Revenue: CPC (cost per click) + CPM (cost per 1000 impressions)
   ═══════════════════════════════════════════════════════════════ */

(function () {
    // ── Configuration ──
    // Remplace par ton vrai ID Google AdSense quand tu l'auras
    const ADSENSE_PUB_ID = 'ca-pub-4490968258367543'; // SwellSync — MAX LOVIAT

    // ── Ne pas afficher les pubs pour les Pro ──
    const isPro = (() => {
        try {
            const member = JSON.parse(localStorage.getItem('sw_member') || '{}');
            return member.is_pro === 1 || member.is_pro === true;
        } catch { return false; }
    })();

    if (isPro) {
        // Masquer TOUS les blocs pub
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('.sw-ad-slot').forEach(el => el.remove());
        });
        return;
    }

    // ── Inject AdSense script if PUB_ID is set ──
    if (ADSENSE_PUB_ID) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUB_ID}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
    }

    // ── Inject CSS ──
    const style = document.createElement('style');
    style.textContent = `
        .sw-ad-slot {
            margin: 16px 0;
            border-radius: 16px;
            overflow: hidden;
            position: relative;
            min-height: 60px;
        }
        .sw-ad-slot .ad-label {
            position: absolute; top: 4px; right: 8px;
            font-size: 8px; color: #475569;
            text-transform: uppercase; letter-spacing: 1px;
            font-weight: 600; z-index: 2;
        }
        .sw-ad-fallback {
            background: linear-gradient(135deg, #0f2438, #0b1a2e);
            border: 1px solid rgba(0,186,214,0.06);
            border-radius: 16px; padding: 14px 16px;
            display: flex; align-items: center; gap: 12px;
            cursor: pointer; transition: all .3s ease;
        }
        .sw-ad-fallback:hover { border-color: rgba(0,186,214,0.15); }
    `;
    document.head.appendChild(style);

    /**
     * Render an AdSense ad slot or a fallback if no PUB_ID
     * @param {HTMLElement} container - The .sw-ad-slot element
     * @param {string} slotId - The AdSense ad slot ID (ex: '1234567890')
     * @param {string} format - 'auto', 'fluid', 'rectangle', 'horizontal'
     */
    window.initAdSlot = function (container, slotId, format) {
        if (!container) return;

        if (ADSENSE_PUB_ID && slotId) {
            // Real AdSense
            container.innerHTML = `
                <span class="ad-label">Publicité</span>
                <ins class="adsbygoogle"
                     style="display:block"
                     data-ad-client="${ADSENSE_PUB_ID}"
                     data-ad-slot="${slotId}"
                     data-ad-format="${format || 'auto'}"
                     data-full-width-responsive="true"></ins>`;
            try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { }
        } else {
            // Fallback — discret placeholder until AdSense is configured
            const fallbacks = [
                { icon: 'surfing', title: 'SwellSync Pro', desc: 'Passe en Pro pour profiter sans pub', color: '#00bad6,#6366f1', link: 'abonnement.html' },
                { icon: 'waves', title: 'SwellSync', desc: 'Prévisions surf en temps réel', color: '#10b981,#00bad6', link: null },
            ];
            const f = fallbacks[Math.random() > 0.5 ? 0 : 1];
            container.innerHTML = `
                <span class="ad-label">Sponsorisé</span>
                <div class="sw-ad-fallback" ${f.link ? `onclick="window.location.href='${f.link}'"` : ''}>
                    <div style="width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,${f.color});display:flex;align-items:center;justify-content:center;flex-shrink:0">
                        <span class="material-symbols-outlined" style="font-size:22px;color:white;font-variation-settings:'FILL' 1">${f.icon}</span>
                    </div>
                    <div style="flex:1">
                        <div style="font-size:12px;font-weight:700;color:#e2e8f0">${f.title}</div>
                        <div style="font-size:10px;color:#64748b;margin-top:1px">${f.desc}</div>
                    </div>
                </div>`;
        }
    };

    // ── Auto-init all ad slots on page load ──
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('.sw-ad-slot[data-ad-slot]').forEach(el => {
            initAdSlot(el, el.dataset.adSlot, el.dataset.adFormat || 'auto');
        });
    });
})();
