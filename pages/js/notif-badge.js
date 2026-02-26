/**
 * SwellSync — Notification Badge (auto-injecté dans la nav bar)
 * Ajoute un badge rouge avec le nombre de notifications non-lues
 * sur l'icône 🔔 de la nav bar (sur toutes les pages).
 */
(function () {
    'use strict';

    async function updateNotifBadge() {
        try {
            const r = await fetch('/api/members/notifications/count', { credentials: 'include' });
            if (!r.ok) return;
            const data = await r.json();
            const count = data.count || 0;

            // Chercher le lien alertes/notifications dans la nav
            const navLinks = document.querySelectorAll('nav a');
            for (const link of navLinks) {
                const href = link.getAttribute('href') || '';
                if (href.includes('alerts.html') || href.includes('notifications.html')) {
                    // Chercher ou créer le badge
                    let badge = link.querySelector('.sw-notif-badge');
                    if (!badge) {
                        badge = document.createElement('span');
                        badge.className = 'sw-notif-badge';
                        badge.style.cssText = `
                            position:absolute;top:-4px;right:-8px;
                            font-size:9px;line-height:1;z-index:2;
                            display:inline-flex;align-items:center;justify-content:center;
                            background:#ef4444;border-radius:50%;
                            min-width:15px;height:15px;padding:0 3px;
                            font-weight:900;color:#fff;
                            font-family:system-ui,sans-serif;
                            transition:transform 0.2s;
                        `;
                        // Trouver le conteneur d'icône
                        const iconWrap = link.querySelector('span[style*="position:relative"]') ||
                            link.querySelector('.material-symbols-outlined')?.parentElement;
                        if (iconWrap) {
                            iconWrap.style.position = 'relative';
                            iconWrap.style.display = 'inline-block';
                            iconWrap.appendChild(badge);
                        } else {
                            const icon = link.querySelector('.material-symbols-outlined');
                            if (icon) {
                                const wrap = document.createElement('span');
                                wrap.style.cssText = 'position:relative;display:inline-block;';
                                icon.parentNode.insertBefore(wrap, icon);
                                wrap.appendChild(icon);
                                wrap.appendChild(badge);
                            }
                        }
                    }
                    // Update
                    if (count > 0) {
                        badge.textContent = count > 99 ? '99+' : count;
                        badge.style.display = 'inline-flex';
                        badge.style.transform = 'scale(1)';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            }
        } catch { /* Silencieux si pas connecté */ }
    }

    // Premier chargement après 1s
    setTimeout(updateNotifBadge, 1000);
    // Refresh toutes les 60s
    setInterval(updateNotifBadge, 60000);

    // Exposer pour usage externe
    window.SwellNotifBadge = { update: updateNotifBadge };
})();
