/**
 * SwellSync — Stripe Integration Helper
 * Gestion des abonnements Pro via Stripe Checkout
 */

const STRIPE_PRICES = {
    pro_monthly: 'price_monthly_placeholder',  // À remplacer avec le vrai price_id Stripe
    pro_annual: 'price_annual_placeholder',   // À remplacer avec le vrai price_id Stripe
};

const Stripe = {
    // Rediriger vers Stripe Checkout
    async checkout(priceId, email = null) {
        try {
            if (typeof showToast !== 'undefined') showToast('Redirection vers le paiement sécurisé...', 'info');

            // Appeler l'Edge Function Stripe
            const { data: { user } } = await supabase.auth.getUser();
            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    price_id: priceId,
                    user_id: user?.id,
                    customer_email: email || user?.email,
                    success_url: window.location.origin + '/pages/pro-welcome.html',
                    cancel_url: window.location.origin + '/site/tarifs.html'
                })
            });

            if (!response.ok) throw new Error('Checkout failed');
            const { url } = await response.json();
            window.location.href = url;
        } catch (e) {
            if (typeof showToast !== 'undefined') showToast('Erreur lors de la redirection vers le paiement. Réessaie.', 'error');
        }
    },

    // Ouvrir le portail client Stripe (gérer abonnement)
    async openCustomerPortal() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const response = await fetch('/api/stripe/customer-portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user?.id, return_url: location.href })
            });
            const { url } = await response.json();
            window.location.href = url;
        } catch (e) {
            if (typeof showToast !== 'undefined') showToast('Erreur — contacte le support à hello@swellsync.fr', 'error');
        }
    },

    // Vérifier si l'utilisateur est Pro via Supabase
    async isPro() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;
            const { data } = await supabase.from('members').select('is_pro').eq('auth_id', user.id).single();
            return data?.is_pro === true;
        } catch { return false; }
    },

    // Afficher le modal d'upgrade Pro si l'utilisateur est Free
    async gateFeature(featureName) {
        const isPro = await this.isPro();
        if (isPro) return true;

        // Afficher modal d'upgrade
        const modal = document.getElementById('pro-gate-modal') || this._createProModal(featureName);
        modal.style.display = 'flex';
        return false;
    },

    _createProModal(featureName) {
        const modal = document.createElement('div');
        modal.id = 'pro-gate-modal';
        modal.role = 'dialog';
        modal.setAttribute('aria-modal', 'true');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:3000;align-items:flex-end;justify-content:center;padding:0;display:flex';
        modal.innerHTML = `
      <div style="background:#0f172a;border:1px solid rgba(14,165,233,.2);border-radius:28px 28px 0 0;padding:32px 24px;width:100%;max-width:500px;text-align:center">
        <div style="font-size:52px;margin-bottom:12px">👑</div>
        <h2 style="font-size:22px;font-weight:800;color:#f1f5f9;margin:0 0 10px">Fonctionnalité Pro</h2>
        <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;line-height:1.6">
          <strong style="color:#0ea5e9">${featureName}</strong> est réservée aux abonnés Pro.<br>
          Passe à Pro pour débloquer toutes les fonctionnalités.
        </p>
        <div style="display:flex;flex-direction:column;gap:10px">
          <a href="/site/tarifs.html" style="display:block;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:white;padding:16px;border-radius:16px;text-decoration:none;font-weight:700;font-size:16px">🚀 Voir les offres Pro</a>
          <button type="button" onclick="document.getElementById('pro-gate-modal').style.display='none'" style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:14px;color:#94a3b8;font-size:15px;cursor:pointer;width:100%">Pas maintenant</button>
        </div>
      </div>`;
        modal.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });
        document.body.appendChild(modal);
        return modal;
    }
};

window.StripeHelper = Stripe;
window.STRIPE_PRICES = STRIPE_PRICES;
