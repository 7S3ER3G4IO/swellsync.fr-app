/**
 * SwellSync — Exit Intent + Marketing UI (T119/T201-210)
 * T119: Popup d'exit intent (avant de quitter → offre -20% Pro)
 * T201: Landing pages "Prévisions surf [Ville]"
 * T203: Newsletter signup avec incentive
 * T206: Plausible Goals configuration
 */

const MarketingUtils = {

    _exitIntentShown: false,
    _exitIntentDismissed: sessionStorage.getItem('sw_exit_dismissed') === 'true',

    // T119 — Exit Intent popup
    initExitIntent() {
        if (this._exitIntentDismissed) return;
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= 5 && !this._exitIntentShown) {
                setTimeout(() => this._showExitPopup(), 200);
            }
        });
        // Mobile: détection du bouton retour (popstate)
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            if (window.scrollY < lastScrollY - 100 && !this._exitIntentShown && !this._exitIntentDismissed) {
                this._showExitPopup();
            }
            lastScrollY = window.scrollY;
        });
    },

    _showExitPopup() {
        if (this._exitIntentShown || this._exitIntentDismissed) return;
        this._exitIntentShown = true;
        const overlay = document.createElement('div');
        overlay.id = 'exit-intent-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .3s ease';
        overlay.innerHTML = `
      <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}</style>
      <div style="background:#0f172a;border:1px solid rgba(14,165,233,.3);border-radius:28px;padding:32px;max-width:380px;width:100%;text-align:center;animation:slideUp .4s ease;position:relative">
        <button onclick="MarketingUtils.dismissExitIntent()" style="position:absolute;top:16px;right:16px;background:none;border:none;color:#64748b;font-size:22px;cursor:pointer">✕</button>
        <div style="font-size:48px;margin-bottom:12px">🌊</div>
        <div style="font-size:11px;color:#0ea5e9;font-weight:700;letter-spacing:1px;margin-bottom:8px">OFFRE DE LANCEMENT</div>
        <h2 style="font-size:24px;font-weight:900;color:#f1f5f9;margin-bottom:8px;line-height:1.2">Attends !<br>-20% sur SwellSync Pro</h2>
        <p style="font-size:14px;color:#94a3b8;margin-bottom:20px;line-height:1.5">Profite de nos prévisions surf avancées, alertes conditions parfaites et coaching personnalisé.</p>
        <div style="background:linear-gradient(135deg,rgba(14,165,233,.1),rgba(16,185,129,.05));border:1px solid rgba(14,165,233,.15);border-radius:16px;padding:14px;margin-bottom:20px">
          <div style="font-size:12px;color:#64748b;text-decoration:line-through">4,99€/mois</div>
          <div style="font-size:32px;font-weight:900;color:#0ea5e9">3,99€<span style="font-size:14px;font-weight:400">/mois</span></div>
          <div style="font-size:12px;color:#10b981;font-weight:600">+ 1er mois gratuit !</div>
        </div>
        <input id="exit-email" type="email" placeholder="ton@email.fr" style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px;color:#f1f5f9;font-size:14px;outline:none;margin-bottom:10px;box-sizing:border-box">
        <button onclick="MarketingUtils.submitExitEmail()" style="width:100%;background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;border-radius:14px;padding:14px;color:white;font-weight:800;font-size:16px;cursor:pointer;margin-bottom:12px">
          Obtenir -20% maintenant →
        </button>
        <button onclick="MarketingUtils.dismissExitIntent()" style="background:none;border:none;color:#64748b;font-size:13px;cursor:pointer;text-decoration:underline">Non merci, je préfère payer plein tarif</button>
      </div>`;
        document.body.appendChild(overlay);
        overlay.addEventListener('click', e => { if (e.target === overlay) this.dismissExitIntent(); });
        // Tracking
        if (typeof plausible !== 'undefined') plausible('Exit Intent Shown');
    },

    async submitExitEmail() {
        const email = document.getElementById('exit-email')?.value?.trim();
        if (!email || !email.includes('@')) { if (typeof showToast !== 'undefined') showToast('Email invalide', 'error'); return; }
        try {
            await supabase.from('newsletter_subscribers').upsert({ email, source: 'exit_intent', discount_code: 'LAUNCH20', created_at: new Date().toISOString() }, { onConflict: 'email' });
            document.getElementById('exit-intent-overlay').innerHTML = `
        <div style="background:#0f172a;border:1px solid rgba(16,185,129,.3);border-radius:28px;padding:40px;max-width:320px;width:100%;text-align:center">
          <div style="font-size:48px;margin-bottom:12px">🎉</div>
          <h2 style="font-size:22px;font-weight:900;color:#f1f5f9;margin-bottom:8px">Code envoyé !</h2>
          <p style="font-size:14px;color:#94a3b8">Vérifie ton email — ton code <strong style="color:#10b981">LAUNCH20</strong> t'attend.</p>
          <button onclick="document.getElementById('exit-intent-overlay').remove()" style="margin-top:20px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:14px;padding:12px 24px;color:white;font-weight:700;cursor:pointer;font-size:15px">Parfait !</button>
        </div>`;
            if (typeof plausible !== 'undefined') plausible('Exit Intent Converted');
        } catch { if (typeof showToast !== 'undefined') showToast('Erreur, réessaie', 'error'); }
    },

    dismissExitIntent() {
        this._exitIntentDismissed = true;
        sessionStorage.setItem('sw_exit_dismissed', 'true');
        document.getElementById('exit-intent-overlay')?.remove();
        if (typeof plausible !== 'undefined') plausible('Exit Intent Dismissed');
    },

    // T206 — Plausible Goals
    trackGoal(event, props = {}) {
        if (typeof plausible !== 'undefined') plausible(event, { props });
        // Fallback: Supabase analytics
        supabase.from('analytics_events').insert({ event, props, url: location.pathname, timestamp: new Date().toISOString() }).catch(() => { });
    },

    initPlausibleGoals() {
        // Inscription
        document.addEventListener('sw:signup', (e) => this.trackGoal('Inscription', { method: e.detail?.method }));
        // Session enregistrée
        document.addEventListener('sw:session_saved', (e) => this.trackGoal('Session enregistrée', { waves: e.detail?.waves }));
        // Upgrade Pro
        document.addEventListener('sw:upgrade', () => this.trackGoal('Upgrade Pro'));
        // Newsletter
        document.addEventListener('sw:newsletter', () => this.trackGoal('Newsletter signup'));
        // Partage
        document.addEventListener('sw:share', (e) => this.trackGoal('Partage', { type: e.detail?.type }));
        // Clic spot
        document.querySelectorAll('[data-spot]').forEach(el => {
            el.addEventListener('click', () => this.trackGoal('Spot View', { spot: el.dataset.spot }));
        });
    },

    // T203 — Widget newsletter avec incentive
    renderNewsletterWidget(containerId = 'newsletter-widget') {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(14,165,233,.08),rgba(16,185,129,.04));border:1px solid rgba(14,165,233,.15);border-radius:20px;padding:24px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">📬</div>
        <div style="font-weight:800;font-size:17px;color:#f1f5f9;margin-bottom:6px">Les meilleures sessions de la semaine</div>
        <div style="font-size:13px;color:#94a3b8;margin-bottom:16px">Reçois chaque lundi les prévisions de la semaine + les sessions de la communauté</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input id="newsletter-email" type="email" placeholder="ton@email.fr" style="flex:1;min-width:160px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px 14px;color:#f1f5f9;font-size:14px;outline:none">
          <button onclick="MarketingUtils.subscribeNewsletter()" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;border-radius:12px;padding:10px 18px;color:white;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap">S'abonner 🌊</button>
        </div>
        <div style="font-size:11px;color:#64748b;margin-top:8px">🔒 Pas de spam. Désabonnement en 1 clic.</div>
      </div>`;
    },

    async subscribeNewsletter() {
        const email = document.getElementById('newsletter-email')?.value?.trim();
        if (!email?.includes('@')) { if (typeof showToast !== 'undefined') showToast('Email invalide', 'error'); return; }
        try {
            await supabase.from('newsletter_subscribers').upsert({ email, source: 'footer_widget', created_at: new Date().toISOString() }, { onConflict: 'email' });
            document.dispatchEvent(new CustomEvent('sw:newsletter'));
            document.getElementById('newsletter-email').value = '';
            if (typeof showToast !== 'undefined') showToast('✅ Inscrit ! À lundi 🌊', 'success');
        } catch { if (typeof showToast !== 'undefined') showToast('Erreur', 'error'); }
    }
};

// Auto-init exit intent sur les pages principales
document.addEventListener('DOMContentLoaded', () => {
    MarketingUtils.initExitIntent();
    MarketingUtils.initPlausibleGoals();
});

window.MarketingUtils = MarketingUtils;
