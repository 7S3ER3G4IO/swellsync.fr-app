/**
 * SwellSync — Notifications Push avancées
 * Gestion des permissions, inscription VAPID, envoi de push
 */

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjZkXs0Pffc2B5UXoEWLp9t3yQ4Co';

const PushNotifications = {
    _subscription: null,

    // Vérifier si les push sont supportées et activées
    isSupported() {
        return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    },

    isGranted() {
        return Notification.permission === 'granted';
    },

    // Demander la permission
    async requestPermission() {
        if (!this.isSupported()) return false;
        const result = await Notification.requestPermission();
        return result === 'granted';
    },

    // S'abonner aux push via le Service Worker
    async subscribe() {
        if (!this.isGranted()) {
            const granted = await this.requestPermission();
            if (!granted) return null;
        }

        try {
            const sw = await navigator.serviceWorker.ready;
            let sub = await sw.pushManager.getSubscription();

            if (!sub) {
                sub = await sw.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this._urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
            }

            this._subscription = sub;

            // Sauvegarder dans Supabase
            if (typeof supabase !== 'undefined') {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const subJSON = sub.toJSON();
                    await supabase.from('push_subscriptions').upsert({
                        user_id: user.id,
                        endpoint: subJSON.endpoint,
                        p256dh: subJSON.keys?.p256dh,
                        auth: subJSON.keys?.auth,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'endpoint' });
                }
            }

            return sub;
        } catch (e) {
            console.warn('Push subscription failed:', e);
            return null;
        }
    },

    // Se désabonner
    async unsubscribe() {
        try {
            const sw = await navigator.serviceWorker.ready;
            const sub = await sw.pushManager.getSubscription();
            if (sub) {
                await sub.unsubscribe();
                // Supprimer de Supabase
                if (typeof supabase !== 'undefined') {
                    await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
                }
            }
            this._subscription = null;
            return true;
        } catch { return false; }
    },

    // Envoyer une notif locale (test)
    sendLocalNotification(title, body, icon = '/assets/icons/icon-192x192.png') {
        if (!this.isGranted()) return;
        const sw = navigator.serviceWorker?.controller;
        if (sw) {
            sw.postMessage({ type: 'SHOW_NOTIFICATION', title, body, icon });
        } else {
            new Notification(title, { body, icon });
        }
    },

    // Helper: convertir clé VAPID
    _urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
    }
};

window.PushNotifications = PushNotifications;
