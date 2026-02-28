/**
 * SwellSync — Newsletter & Alertes email (T203)
 * Inscription à la newsletter hebdomadaire
 * + Plausible Analytics Goals (T206)
 */

const Newsletter = {

    // Formulaire d'inscription newsletter
    renderForm(containerId, variant = 'inline') {
        const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
        if (!container) return;

        const styles = {
            inline: 'display:flex;gap:10px;flex-wrap:wrap',
            stacked: 'display:flex;flex-direction:column;gap:12px;max-width:380px'
        };

        container.innerHTML = `
      <form id="newsletter-form" onsubmit="Newsletter.subscribe(event)" style="${styles[variant] || styles.inline}">
        <input type="email" id="newsletter-email" placeholder="ton@email.fr" required
          style="flex:1;min-width:200px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;color:#f1f5f9;font-size:15px;outline:none"
          oninvalid="this.setCustomValidity('Saisis une adresse email valide')" oninput="this.setCustomValidity('')">
        <button type="submit" id="newsletter-submit"
          style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;border-radius:12px;padding:12px 20px;color:white;font-weight:700;font-size:15px;cursor:pointer;white-space:nowrap">
          🌊 S'inscrire
        </button>
        <div id="newsletter-msg" style="width:100%;font-size:13px;display:none"></div>
      </form>`;
    },

    async subscribe(e) {
        e.preventDefault();
        const emailEl = document.getElementById('newsletter-email');
        const submitBtn = document.getElementById('newsletter-submit');
        const msgEl = document.getElementById('newsletter-msg');
        const email = emailEl?.value?.trim();
        if (!email) return;

        submitBtn.textContent = '⏳ Inscription...';
        submitBtn.disabled = true;

        try {
            // Enregistrer dans Supabase
            const { error } = await supabase.from('newsletter_subscribers').upsert(
                { email, subscribed_at: new Date().toISOString(), active: true },
                { onConflict: 'email' }
            );

            if (error && !error.message.includes('duplicate')) throw error;

            // Succès
            if (msgEl) {
                msgEl.style.display = 'block';
                msgEl.innerHTML = '<span style="color:#10b981">✅ Inscription confirmée ! Tu recevras les meilleures sessions chaque semaine.</span>';
            }
            if (emailEl) emailEl.value = '';
            if (submitBtn) { submitBtn.textContent = '✅ Inscrit !'; submitBtn.style.background = 'linear-gradient(135deg,#10b981,#059669)'; }

            // Plausible Goal
            Newsletter._trackGoal('newsletter_signup');
        } catch {
            if (msgEl) {
                msgEl.style.display = 'block';
                msgEl.innerHTML = '<span style="color:#ef4444">Erreur. Réessaie dans quelques instants.</span>';
            }
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🌊 S\'inscrire'; }
        }
    },

    _trackGoal(name) {
        // Plausible Analytics (T206)
        if (typeof window.plausible !== 'undefined') window.plausible(name);
        // Fallback GTM / dataLayer
        if (window.dataLayer) window.dataLayer.push({ event: name });
    }
};

// ── T206: Plausible Goals auto-tracking ──────────────────────────────
const PlausibleGoals = {
    init() {
        // Inscription
        document.addEventListener('click', e => {
            const btn = e.target.closest('[data-goal]');
            if (!btn) return;
            Newsletter._trackGoal(btn.dataset.goal);
        });

        // Session enregistrée (déclenché par session-live.js)
        document.addEventListener('session:saved', () => Newsletter._trackGoal('session_recorded'));

        // Upgrade Pro
        document.addEventListener('payment:success', () => Newsletter._trackGoal('upgrade_pro'));
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PlausibleGoals.init());
} else { PlausibleGoals.init(); }

window.Newsletter = Newsletter;
window.PlausibleGoals = PlausibleGoals;
