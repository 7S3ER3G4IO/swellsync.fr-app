/**
 * SwellSync — Prompt d'installation PWA (T190/T191/T192)
 * T190: Afficher le prompt d'installation sur iOS et Android
 * T191: Bannière "Installe l'app" après 2 sessions ou 3 visites
 * T192: Mémoriser le refus (ne pas réafficher pendant 30j)
 */

const PWAInstall = {

    _deferredPrompt: null,
    _dismissed: localStorage.getItem('sw_pwa_dismissed') || null,
    _visitCount: parseInt(localStorage.getItem('sw_visit_count') || '0', 10),
    _isInstalled: window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone,

    init() {
        if (this._isInstalled) return; // Déjà installée

        // Incrémenter le compteur de visites
        this._visitCount++;
        localStorage.setItem('sw_visit_count', this._visitCount.toString());

        // Écouter l'événement beforeinstallprompt (Android/Chrome)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this._deferredPrompt = e;
            // Afficher la bannière après 2 visites
            if (this._visitCount >= 2 && !this._wasDismissedRecently()) {
                setTimeout(() => this._showBanner(), 3000);
            }
        });

        // iOS: pas d'événement beforeinstallprompt, détecter manuellement
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isIOS && isSafari && this._visitCount >= 3 && !this._wasDismissedRecently()) {
            setTimeout(() => this._showIOSGuide(), 3000);
        }
    },

    _wasDismissedRecently() {
        if (!this._dismissed) return false;
        const dismissedAt = new Date(this._dismissed);
        const daysDiff = (Date.now() - dismissedAt.getTime()) / 86400000;
        return daysDiff < 30;
    },

    _showBanner() {
        if (document.getElementById('pwa-install-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.style.cssText = `
      position: fixed; bottom: 80px; left: 16px; right: 16px; z-index: 9997;
      background: linear-gradient(135deg, #0f172a, #1e293b);
      border: 1px solid rgba(14,165,233,.3); border-radius: 20px; padding: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,.6); display: flex; align-items: center; gap: 14px;
      animation: slideUp .4s ease;`;
        banner.innerHTML = `
      <style>@keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>
      <img src="/assets/icons/icon-192.png" width="48" height="48" style="border-radius:14px;flex-shrink:0" alt="SwellSync">
      <div style="flex:1">
        <div style="font-weight:800;font-size:15px;color:#f1f5f9">Installer SwellSync</div>
        <div style="font-size:13px;color:#64748b">Accès rapide · Fonctionne hors-ligne</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;flex-shrink:0">
        <button id="pwa-install-btn" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;border-radius:12px;padding:8px 16px;color:white;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap">Installer</button>
        <button id="pwa-dismiss-btn" style="background:none;border:none;color:#64748b;font-size:12px;cursor:pointer">Plus tard</button>
      </div>`;
        document.body.appendChild(banner);

        document.getElementById('pwa-install-btn').addEventListener('click', () => this._triggerInstall());
        document.getElementById('pwa-dismiss-btn').addEventListener('click', () => this._dismiss());
    },

    _showIOSGuide() {
        if (document.getElementById('pwa-ios-guide')) return;
        const guide = document.createElement('div');
        guide.id = 'pwa-ios-guide';
        guide.style.cssText = `
      position: fixed; bottom: 80px; left: 16px; right: 16px; z-index: 9997;
      background: #0f172a; border: 1px solid rgba(14,165,233,.25); border-radius: 20px; padding: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,.6); animation: slideUp .4s ease;`;
        guide.innerHTML = `
      <style>@keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <div style="font-weight:800;font-size:15px;color:#f1f5f9">📱 Installer SwellSync sur iPhone</div>
        <button onclick="PWAInstall._dismiss()" style="background:none;border:none;color:#64748b;font-size:18px;cursor:pointer">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:center;gap:10px;font-size:13px;color:#94a3b8">
          <div style="background:rgba(14,165,233,.1);border-radius:10px;padding:8px;font-size:18px">1️⃣</div>
          Appuie sur <strong>Partager</strong> <span style="font-size:16px">⬆️</span> en bas de Safari
        </div>
        <div style="display:flex;align-items:center;gap:10px;font-size:13px;color:#94a3b8">
          <div style="background:rgba(14,165,233,.1);border-radius:10px;padding:8px;font-size:18px">2️⃣</div>
          Sélectionne <strong>"Sur l'écran d'accueil"</strong> <span>📲</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;font-size:13px;color:#94a3b8">
          <div style="background:rgba(14,165,233,.1);border-radius:10px;padding:8px;font-size:18px">3️⃣</div>
          Confirme avec <strong>Ajouter</strong> → L'app est installée !
        </div>
      </div>`;
        document.body.appendChild(guide);
    },

    async _triggerInstall() {
        if (!this._deferredPrompt) return;
        this._deferredPrompt.prompt();
        const { outcome } = await this._deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            // Tracking installation
            if (typeof plausible !== 'undefined') plausible('PWA Installed');
            try { await supabase.from('analytics_events').insert({ event: 'pwa_install', timestamp: new Date().toISOString() }); } catch { }
            document.getElementById('pwa-install-banner')?.remove();
        } else {
            this._dismiss();
        }
        this._deferredPrompt = null;
    },

    _dismiss() {
        this._dismissed = new Date().toISOString();
        localStorage.setItem('sw_pwa_dismissed', this._dismissed);
        document.getElementById('pwa-install-banner')?.remove();
        document.getElementById('pwa-ios-guide')?.remove();
    }
};

document.addEventListener('DOMContentLoaded', () => PWAInstall.init());
window.PWAInstall = PWAInstall;
