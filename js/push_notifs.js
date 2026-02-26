/**
 * SwellSync — Push Notifications PWA (P1)
 * Gère la demande de permission pour les notifications push.
 * - Demande la permission de manière non-intrusive (avec délai)
 * - S'abonne au ServiceWorker si disponible
 * - Envoie l'abonnement à /api/push/subscribe
 * - Expose window.SwellPush pour les autres scripts
 */

(function () {
    'use strict';

    const PUSH_KEY = 'swellsync_push_state';    // 'asked' | 'granted' | 'denied'
    const DELAY_MS = 8000;                        // Attendre 8s avant de demander

    // Clé VAPID publique (à remplacer par la vraie clé générée côté serveur)
    const VAPID_PUBLIC_KEY = 'BEl62iU__jMCLgz-SsSi_RFRb0cDnHoNZQoL0RBJbXFXVfwCOlgFDOkqQJa7nEkVALOUdUJhE-7iY0FJeyXi0M';

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
    }

    function getPushState() { return localStorage.getItem(PUSH_KEY); }
    function setPushState(state) { localStorage.setItem(PUSH_KEY, state); }

    async function subscribeToServer(subscription) {
        try {
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription }),
                signal: AbortSignal.timeout(5000)
            });
        } catch (e) { /* Silencieux si réseau down */ }
    }

    async function askPushPermission() {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
        if (getPushState() === 'asked' || getPushState() === 'denied') return;

        // Afficher une mini-bannière non intrusive avant la vraie demande système
        showPushBanner();
    }

    function showPushBanner() {
        if (document.getElementById('push-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'push-banner';
        banner.style.cssText = `
            position:fixed; bottom:24px; right:24px; z-index:8000;
            background:rgba(7,15,16,0.96); border:1px solid rgba(0,186,214,0.2);
            border-radius:20px; padding:16px 20px; max-width:320px;
            box-shadow:0 20px 60px rgba(0,0,0,0.6); backdrop-filter:blur(16px);
            font-family:Lexend,sans-serif;
            transform:translateY(20px); opacity:0; transition:all 0.4s cubic-bezier(0.4,0,0.2,1);
        `;
        banner.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;">
                <div style="font-size:26px;flex-shrink:0;">🔔</div>
                <div>
                    <div style="font-size:13px;font-weight:900;color:#fff;margin-bottom:3px;">Alertes houle en temps réel</div>
                    <div style="font-size:11px;color:#64748b;line-height:1.5;">Reçois une notification dès que tes spots favoris dépassent tes seuils.</div>
                </div>
                <button onclick="document.getElementById('push-banner').remove(); window.SwellPush.dismiss();" style="background:none;border:none;color:#475569;font-size:16px;cursor:pointer;padding:2px;flex-shrink:0;margin-left:auto;">✕</button>
            </div>
            <div style="display:flex;gap:8px;">
                <button id="push-accept-btn" style="flex:1;padding:10px;border-radius:12px;background:linear-gradient(135deg,#00bad6,#0090a8);color:#fff;font-family:Lexend,sans-serif;font-weight:900;font-size:12px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(0,186,214,0.3)">
                    Activer les alertes
                </button>
                <button onclick="document.getElementById('push-banner').remove(); window.SwellPush.dismiss();" style="flex:1;padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#64748b;font-family:Lexend,sans-serif;font-weight:700;font-size:12px;cursor:pointer;">
                    Plus tard
                </button>
            </div>
        `;
        document.body.appendChild(banner);

        requestAnimationFrame(() => {
            banner.style.transform = 'translateY(0)';
            banner.style.opacity = '1';
        });

        document.getElementById('push-accept-btn').addEventListener('click', async () => {
            banner.remove();
            await requestSystemPermission();
        });

        // Auto-dismiss après 12s
        setTimeout(() => {
            if (document.getElementById('push-banner')) {
                banner.style.opacity = '0';
                banner.style.transform = 'translateY(16px)';
                setTimeout(() => banner.remove(), 400);
            }
        }, 12000);
    }

    async function requestSystemPermission() {
        try {
            const permission = await Notification.requestPermission();
            setPushState(permission === 'granted' ? 'granted' : 'denied');

            if (permission === 'granted') {
                // S'abonner au SW
                const reg = await navigator.serviceWorker.ready;
                if (reg.pushManager) {
                    try {
                        const sub = await reg.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                        });
                        await subscribeToServer(sub);
                    } catch (e) { /* VAPID key placeholder, ignore */ }
                }
                showMiniToast('🔔 Alertes houle activées !', '#4ade80');
            }
        } catch (e) {
            setPushState('denied');
        }
    }

    function showMiniToast(msg, color) {
        const t = document.createElement('div');
        t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9000;background:rgba(7,15,16,0.95);border:1px solid rgba(255,255,255,0.1);color:${color || '#f1f5f9'};font-family:Lexend,sans-serif;font-size:13px;font-weight:700;padding:10px 22px;border-radius:12px;backdrop-filter:blur(12px);opacity:0;transition:opacity 0.3s;white-space:nowrap;`;
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.style.opacity = '1');
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500);
    }

    // ── API publique ──────────────────────────────────────────────────────────
    window.SwellPush = {
        isGranted: () => getPushState() === 'granted',
        isDenied: () => getPushState() === 'denied',
        ask: requestSystemPermission,
        dismiss: () => setPushState('asked'),

        // Envoyer une notification locale (sans serveur)
        notify: (title, body, options = {}) => {
            if (Notification.permission !== 'granted') return;
            new Notification(title, {
                body,
                icon: '/assets/images/swellsync_icon.svg',
                badge: '/assets/images/swellsync_icon.svg',
                ...options
            });
        }
    };

    // ── Lancer après délai si pas déjà décidé ────────────────────────────────
    const state = getPushState();
    if (!state || state === '') {
        setTimeout(() => {
            if (document.readyState === 'complete') {
                askPushPermission();
            } else {
                window.addEventListener('load', askPushPermission, { once: true });
            }
        }, DELAY_MS);
    }
})();
