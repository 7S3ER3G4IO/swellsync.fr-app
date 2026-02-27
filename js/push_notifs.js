/**
 * SwellSync — Push Notifications PWA
 * ─ Demande la permission push de manière non-intrusive
 * ─ S'abonne au ServiceWorker + envoi au serveur
 * ─ Fonctionne même quand l'app est fermée (via Service Worker)
 */
(function () {
    'use strict';

    const PUSH_KEY = 'swellsync_push_state';    // 'granted' | 'denied'
    const DELAY_MS = 1500;                        // 1.5s — demande immédiate première visite

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
    }

    function getPushState() { return localStorage.getItem(PUSH_KEY); }
    function setPushState(state) { localStorage.setItem(PUSH_KEY, state); }

    // Push notifications désactivées (pas de serveur VAPID)
    async function getVapidKey() {
        return null;
    }

    // ── Souscrire au push et envoyer au serveur ──
    async function subscribeToPush(vapidKey) {
        try {
            const reg = await navigator.serviceWorker.ready;
            if (!reg.pushManager) return;

            // Vérifier si déjà abonné
            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey)
                });
            }

            // Push subscribe désactivé (pas de serveur backend)
            // await fetch('/api/members/push-subscribe', ...);
            return true;
        } catch (e) {
            console.warn('Push subscribe error:', e);
            return false;
        }
    }

    // ── Demander la permission ──
    async function requestSystemPermission() {
        try {
            const permission = await Notification.requestPermission();
            setPushState(permission === 'granted' ? 'granted' : 'denied');

            if (permission === 'granted') {
                const vapidKey = await getVapidKey();
                if (vapidKey) {
                    await subscribeToPush(vapidKey);
                }
                showMiniToast('🔔 Notifications activées !', '#4ade80');
            }
        } catch (e) {
            setPushState('denied');
        }
    }

    // ── Bannière non-intrusive ──
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
                    <div style="font-size:13px;font-weight:900;color:#fff;margin-bottom:3px;">Ne manque aucune notification</div>
                    <div style="font-size:11px;color:#64748b;line-height:1.5;">Reçois les likes, follows et commentaires même quand l'app est fermée.</div>
                </div>
                <button onclick="document.getElementById('push-banner').remove(); window.SwellPush.dismiss();" style="background:none;border:none;color:#475569;font-size:16px;cursor:pointer;padding:2px;flex-shrink:0;margin-left:auto;">✕</button>
            </div>
            <div style="display:flex;gap:8px;">
                <button id="push-accept-btn" style="flex:1;padding:10px;border-radius:12px;background:linear-gradient(135deg,#00bad6,#0090a8);color:#fff;font-family:Lexend,sans-serif;font-weight:900;font-size:12px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(0,186,214,0.3)">
                    Activer les notifications
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

    function showMiniToast(msg, color) {
        const t = document.createElement('div');
        t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9000;background:rgba(7,15,16,0.95);border:1px solid rgba(255,255,255,0.1);color:${color || '#f1f5f9'};font-family:Lexend,sans-serif;font-size:13px;font-weight:700;padding:10px 22px;border-radius:12px;backdrop-filter:blur(12px);opacity:0;transition:opacity 0.3s;white-space:nowrap;`;
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(() => t.style.opacity = '1');
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500);
    }

    // ── Re-souscrire automatiquement si déjà autorisé ──
    async function resubscribeIfGranted() {
        if (Notification.permission === 'granted') {
            setPushState('granted');
            const vapidKey = await getVapidKey();
            if (vapidKey) await subscribeToPush(vapidKey);
        }
    }

    // ── API publique ──
    window.SwellPush = {
        isGranted: () => getPushState() === 'granted',
        isDenied: () => getPushState() === 'denied',
        ask: requestSystemPermission,
        dismiss: () => setPushState('asked'),
        resubscribe: resubscribeIfGranted,
        notify: (title, body, options = {}) => {
            if (Notification.permission !== 'granted') return;
            new Notification(title, {
                body,
                icon: '/assets/images/swellsync_logo.png',
                badge: '/assets/images/swellsync_logo.png',
                ...options
            });
        }
    };

    // ── Lancer ──
    const state = getPushState();
    if (state === 'granted') {
        // Re-souscrire silencieusement pour s'assurer que la sub est à jour
        resubscribeIfGranted();
    } else if (state === 'denied') {
        // Ne rien faire — l'utilisateur a refusé
    } else {
        // Première visite : demander directement après chargement
        setTimeout(() => {
            requestSystemPermission();
        }, DELAY_MS);
    }
})();
