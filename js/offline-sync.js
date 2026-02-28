/**
 * SwellSync — Sync hors-ligne & gestion connexion (T183/T184/T185)
 * T183: Détecter connexion offline/online et afficher banner
 * T184: Queue d'actions hors-ligne (sessions, posts) auto-sync au retour
 * T185: Indicateur "données sauvegardées localement"
 */

const OfflineSync = {

    _queue: JSON.parse(localStorage.getItem('sw_offline_queue') || '[]'),
    _isOnline: navigator.onLine,
    _banner: null,
    _syncRunning: false,

    init() {
        // Écouter les changements de connectivité
        window.addEventListener('online', () => this._setStatus(true));
        window.addEventListener('offline', () => this._setStatus(false));

        // Créer le banner offline
        this._createBanner();

        // Si on démarre offline
        if (!this._isOnline) this._setStatus(false);

        // Au retour en ligne, sync
        if (this._isOnline && this._queue.length > 0) {
            setTimeout(() => this._syncQueue(), 2000);
        }
    },

    _createBanner() {
        if (this._banner) return;
        const banner = document.createElement('div');
        banner.id = 'offline-banner';
        banner.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 99998;
      background: #1e293b; border-bottom: 1px solid rgba(239,68,68,.3);
      padding: 8px 16px; display: flex; align-items: center; gap: 10px;
      transform: translateY(-100%); transition: transform 0.3s ease;
      font-size: 13px; color: #f1f5f9;`;
        banner.innerHTML = `
      <div id="offline-icon" style="font-size:16px">📶</div>
      <div id="offline-text" style="flex:1">Connexion perdue — Les données sont sauvegardées localement</div>
      <div id="offline-queue-count" style="background:rgba(239,68,68,.15);border-radius:8px;padding:2px 8px;font-size:12px;color:#ef4444"></div>`;
        document.body.insertBefore(banner, document.body.firstChild);
        this._banner = banner;
    },

    _setStatus(isOnline) {
        this._isOnline = isOnline;
        if (!this._banner) this._createBanner();
        const icon = document.getElementById('offline-icon');
        const text = document.getElementById('offline-text');
        const queueEl = document.getElementById('offline-queue-count');

        if (!isOnline) {
            // Offline
            this._banner.style.transform = 'translateY(0)';
            this._banner.style.borderColor = 'rgba(239,68,68,.3)';
            if (icon) icon.textContent = '📵';
            if (text) text.textContent = 'Hors-ligne — Les actions seront synchronisées à la reconnexion';
            if (queueEl) queueEl.textContent = this._queue.length > 0 ? `${this._queue.length} en attente` : '';

            // Notifier les autres composants
            document.dispatchEvent(new CustomEvent('swellsync:offline'));

        } else {
            // Retour en ligne
            if (icon) icon.textContent = '✅';
            if (text) text.textContent = `Reconnecté ! Synchronisation en cours...`;
            this._banner.style.borderColor = 'rgba(16,185,129,.3)';

            // Syncer puis cacher le banner
            this._syncQueue().then(() => {
                setTimeout(() => {
                    if (this._banner) this._banner.style.transform = 'translateY(-100%)';
                }, 2500);
            });

            document.dispatchEvent(new CustomEvent('swellsync:online'));
        }
    },

    // T184 — Ajouter une action dans la queue offline
    queueAction(type, payload) {
        const action = { id: Date.now(), type, payload, timestamp: new Date().toISOString() };
        this._queue.push(action);
        localStorage.setItem('sw_offline_queue', JSON.stringify(this._queue));

        // Mettre à jour le compteur dans le banner
        const queueEl = document.getElementById('offline-queue-count');
        if (queueEl) queueEl.textContent = `${this._queue.length} en attente`;

        // T185 — Toast "données sauvegardées localement"
        if (!this._isOnline && typeof showToast !== 'undefined') {
            showToast('💾 Sauvegardé hors-ligne', 'info');
        }
        return action.id;
    },

    // Synchroniser la queue avec Supabase
    async _syncQueue() {
        if (this._syncRunning || !this._isOnline || !this._queue.length) return;
        this._syncRunning = true;
        const toProcess = [...this._queue];
        const failed = [];

        for (const action of toProcess) {
            try {
                await this._processAction(action);
            } catch {
                failed.push(action);
            }
        }

        this._queue = failed;
        localStorage.setItem('sw_offline_queue', JSON.stringify(this._queue));
        this._syncRunning = false;

        // Notification résultat
        const synced = toProcess.length - failed.length;
        if (synced > 0 && typeof showToast !== 'undefined') {
            showToast(`✅ ${synced} action${synced > 1 ? 's' : ''} synchronisée${synced > 1 ? 's' : ''}`, 'success');
        }
        if (failed.length > 0 && typeof showToast !== 'undefined') {
            showToast(`⚠️ ${failed.length} action${failed.length > 1 ? 's' : ''} échouée${failed.length > 1 ? 's' : ''}`, 'warning');
        }
    },

    async _processAction(action) {
        switch (action.type) {
            case 'save_session':
                await supabase.from('sessions').upsert(action.payload, { onConflict: 'id' });
                break;
            case 'create_post':
                await supabase.from('posts').insert(action.payload);
                break;
            case 'like_post':
                await supabase.from('post_likes').upsert(action.payload, { onConflict: 'user_id,post_id' });
                break;
            case 'follow_user':
                await supabase.from('follows').upsert(action.payload, { onConflict: 'follower_id,following_id' });
                break;
            case 'newsletter_signup':
                await supabase.from('newsletter_subscribers').upsert(action.payload, { onConflict: 'email' });
                break;
            default:
                // Action générique: envoyer à la table appropriée
                if (action.payload.table && action.payload.data) {
                    await supabase.from(action.payload.table).upsert(action.payload.data);
                }
        }
    },

    // API publique — Wrapper qui queue si offline
    async saveOrQueue(type, payload) {
        if (this._isOnline) {
            try {
                await this._processAction({ type, payload });
                return true;
            } catch {
                this.queueAction(type, payload);
                return false;
            }
        } else {
            this.queueAction(type, payload);
            return false;
        }
    },

    getQueueCount: () => OfflineSync._queue.length,
    isOnline: () => OfflineSync._isOnline
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => OfflineSync.init());
window.OfflineSync = OfflineSync;
