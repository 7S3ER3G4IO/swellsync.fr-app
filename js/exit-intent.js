/**
 * SwellSync — Exit Intent Popup (T119)
 * Apparaît quand l'utilisateur déplace la souris vers le haut de la page
 * pour quitter → propose une offre -20% Pro
 */

const ExitIntent = {
    _shown: false,
    _modal: null,

    init() {
        // Ne montrer qu'une fois par session et pas sur mobile (pas de souris)
        if (sessionStorage.getItem('sw_exit_shown') || window.innerWidth < 768) return;

        document.addEventListener('mouseleave', e => {
            if (e.clientY <= 0 && !this._shown) {
                this._shown = true;
                sessionStorage.setItem('sw_exit_shown', '1');
                this._show();
            }
        });

        // Aussi après 60s d'inactivité
        let timer = setTimeout(() => {
            if (!this._shown) { this._shown = true; sessionStorage.setItem('sw_exit_shown', '1'); this._show(); }
        }, 60000);
        document.addEventListener('mousemove', () => { clearTimeout(timer); }, { once: true });
    },

    _show() {
        if (document.getElementById('exit-intent-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'exit-intent-modal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeInPage .3s ease';
        modal.innerHTML = `
      <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid rgba(14,165,233,.3);border-radius:28px;padding:40px 32px;max-width:440px;width:100%;text-align:center;position:relative">
        <button type="button" onclick="document.getElementById('exit-intent-modal').remove()" aria-label="Fermer" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,.08);border:none;border-radius:50%;width:32px;height:32px;color:#64748b;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>
        <div style="font-size:56px;margin-bottom:16px">🌊</div>
        <h2 style="font-size:26px;font-weight:800;color:#f1f5f9;margin:0 0 10px;line-height:1.3">Attends ! 🤙</h2>
        <p style="color:#94a3b8;font-size:16px;line-height:1.7;margin:0 0 8px">Avant de partir, profite de notre <strong style="color:#f59e0b">offre de lancement</strong></p>
        <div style="background:linear-gradient(135deg,rgba(245,158,11,.15),rgba(239,68,68,.1));border:1px solid rgba(245,158,11,.3);border-radius:16px;padding:20px;margin:20px 0">
          <div style="font-size:36px;font-weight:900;color:#f59e0b;letter-spacing:-2px">-20%</div>
          <div style="font-size:15px;color:#94a3b8;margin-top:4px">sur ton abonnement Pro annuel<br><strong style="color:#f1f5f9">Prix bloqué à vie</strong></div>
        </div>
        <div style="font-size:13px;color:#0ea5e9;margin-bottom:20px;font-weight:600">✅ Sans engagement · Résiliable à tout moment · Satisfait ou remboursé 30j</div>
        <a href="/site/tarifs.html" onclick="document.getElementById('exit-intent-modal').remove()" style="display:block;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:18px;border-radius:16px;text-decoration:none;font-weight:800;font-size:17px;margin-bottom:10px">🚀 Je profite de l'offre →</a>
        <button type="button" onclick="document.getElementById('exit-intent-modal').remove()" style="background:none;border:none;color:#475569;font-size:13px;cursor:pointer;padding:8px">Non merci, je passe</button>
      </div>`;

        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
        this._modal = modal;
    }
};

// Auto-init sur les pages vitrine
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ExitIntent.init());
} else {
    ExitIntent.init();
}

window.ExitIntent = ExitIntent;
