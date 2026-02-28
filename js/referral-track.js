/**
 * SwellSync — Tracking parrainage & referral (T115/T116/T117)
 * T115: Lien de parrainage unique (ref=code) dans l'URL
 * T116: Attribuer le parrain au signup si ref= présent
 * T117: Widget parrainage avec compteur + récompenses
 */

const ReferralTrack = {

    // Extraire le code de parrainage depuis l'URL
    getReferralCode() {
        const params = new URLSearchParams(window.location.search);
        return params.get('ref') || null;
    },

    // T115 — Sauvegarder le code parrain dès l'arrivée
    captureReferral() {
        const code = this.getReferralCode();
        if (code) {
            sessionStorage.setItem('sw_referral_code', code);
            // Tracking analytics
            if (typeof plausible !== 'undefined') plausible('Referral Click', { props: { code } });
            // Nettoyage URL sans rechargement
            const url = new URL(window.location);
            url.searchParams.delete('ref');
            window.history.replaceState({}, '', url.toString());
        }
        return code;
    },

    // T116 — Attribuer le parrain au moment du signup
    async attributeReferral(newUserId) {
        const code = sessionStorage.getItem('sw_referral_code');
        if (!code) return false;
        try {
            // Trouver le parrain via son code
            const { data: referrer } = await supabase
                .from('members')
                .select('id, display_name')
                .eq('referral_code', code)
                .single();
            if (!referrer) return false;
            // Enregistrer la relation de parrainage
            await supabase.from('referrals').insert({
                referrer_id: referrer.id,
                referred_id: newUserId,
                code,
                status: 'pending',
                created_at: new Date().toISOString()
            });
            // Notification au parrain
            await supabase.from('notifications').insert({
                user_id: referrer.id,
                type: 'referral',
                message: 'Quelqu\'un a rejoint SwellSync grâce à ton lien ! 🤙',
                created_at: new Date().toISOString()
            });
            sessionStorage.removeItem('sw_referral_code');
            // Tracking
            if (typeof plausible !== 'undefined') plausible('Referral Converted');
            return true;
        } catch { return false; }
    },

    // Valider un parrainage (ex: après 30j d'activité du filleul)
    async validateReferral(referralId) {
        try {
            await supabase.from('referrals').update({ status: 'validated', validated_at: new Date().toISOString() }).eq('id', referralId);
            // Créditer le parrain (1 mois Pro)
            const { data: ref } = await supabase.from('referrals').select('referrer_id').eq('id', referralId).single();
            if (ref) {
                await supabase.from('members').update({ pro_expires_at: new Date(Date.now() + 30 * 86400000).toISOString() }).eq('id', ref.referrer_id);
                await supabase.from('notifications').insert({ user_id: ref.referrer_id, type: 'reward', message: '🎉 +1 mois Pro offert pour ton parrainage !' });
            }
        } catch { }
    },

    // T117 — Widget parrainage avec compteur
    async renderWidget(containerId) {
        const el = document.getElementById(containerId);
        if (!el) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { el.innerHTML = '<div class="empty-state"><div>🔒</div><h3>Connecte-toi pour parrainer</h3></div>'; return; }

            const { data: member } = await supabase.from('members').select('id, referral_code, display_name').eq('auth_id', user.id).single();
            if (!member) return;

            // Générer un code si absent
            let code = member.referral_code;
            if (!code) {
                code = (member.display_name || 'surf').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8) + Math.floor(Math.random() * 1000);
                await supabase.from('members').update({ referral_code: code }).eq('id', member.id);
            }

            const referralLink = `https://swellsync.fr/?ref=${code}`;

            // Compter les filleuls
            const { count: pending } = await supabase.from('referrals').select('*', { count: 'exact' }).eq('referrer_id', member.id).eq('status', 'pending');
            const { count: validated } = await supabase.from('referrals').select('*', { count: 'exact' }).eq('referrer_id', member.id).eq('status', 'validated');
            const total = (pending || 0) + (validated || 0);
            const rewards = validated || 0;

            el.innerHTML = `
        <div style="background:linear-gradient(135deg,rgba(14,165,233,.08),rgba(16,185,129,.05));border:1px solid rgba(14,165,233,.2);border-radius:24px;padding:24px">
          <div style="text-align:center;margin-bottom:20px">
            <div style="font-size:40px;margin-bottom:8px">🤙</div>
            <div style="font-size:20px;font-weight:900;color:#f1f5f9">Invite tes amis surfeurs</div>
            <div style="font-size:14px;color:#94a3b8;margin-top:4px">1 filleul validé = 1 mois Pro offert</div>
          </div>

          <!-- Compteurs -->
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
            <div style="background:rgba(255,255,255,.04);border-radius:16px;padding:14px;text-align:center">
              <div style="font-size:28px;font-weight:900;color:#0ea5e9">${total}</div>
              <div style="font-size:12px;color:#64748b">Invités</div>
            </div>
            <div style="background:rgba(255,255,255,.04);border-radius:16px;padding:14px;text-align:center">
              <div style="font-size:28px;font-weight:900;color:#10b981">${validated || 0}</div>
              <div style="font-size:12px;color:#64748b">Validés</div>
            </div>
            <div style="background:rgba(255,255,255,.04);border-radius:16px;padding:14px;text-align:center">
              <div style="font-size:28px;font-weight:900;color:#f59e0b">${rewards}</div>
              <div style="font-size:12px;color:#64748b">Mois Pro</div>
            </div>
          </div>

          <!-- Lien -->
          <div style="margin-bottom:16px">
            <div style="font-size:12px;color:#64748b;margin-bottom:6px;font-weight:600">TON LIEN UNIQUE</div>
            <div style="display:flex;gap:8px">
              <input id="referral-link-input" value="${referralLink}" readonly style="flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px 14px;color:#f1f5f9;font-size:13px;outline:none" onclick="this.select()">
              <button onclick="ReferralTrack.copyLink('${referralLink}')" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;border-radius:12px;padding:10px 16px;color:white;font-weight:700;font-size:13px;cursor:pointer;white-space:nowrap">📋 Copier</button>
            </div>
          </div>

          <!-- Partage -->
          <div style="display:flex;gap:10px">
            <button onclick="ReferralTrack.shareLink('${referralLink}','${member.display_name || 'un ami'}')" style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px;color:#f1f5f9;font-weight:600;font-size:14px;cursor:pointer">
              📤 Partager
            </button>
            <a href="/pages/referral.html" style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:12px;color:#f1f5f9;font-weight:600;font-size:14px;text-align:center;text-decoration:none">
              📊 Détails
            </a>
          </div>
        </div>`;
        } catch {
            el.innerHTML = '<div class="empty-state"><div>⚠️</div><h3>Erreur chargement</h3></div>';
        }
    },

    async copyLink(link) {
        try {
            await navigator.clipboard.writeText(link);
            if (typeof showToast !== 'undefined') showToast('✅ Lien copié !', 'success');
            if (typeof plausible !== 'undefined') plausible('Referral Link Copied');
        } catch {
            const input = document.getElementById('referral-link-input');
            if (input) { input.select(); document.execCommand('copy'); }
        }
    },

    async shareLink(link, name) {
        const text = `🌊 Rejoins-moi sur SwellSync, l'app des surfeurs ! Prévisions surf, sessions GPS, communauté... Inscris-toi gratuitement : ${link}`;
        if (navigator.share) {
            try { await navigator.share({ title: 'SwellSync', text, url: link }); }
            catch { }
        } else { this.copyLink(link); }
    }
};

// Capturer le referral dès le chargement
document.addEventListener('DOMContentLoaded', () => ReferralTrack.captureReferral());
window.ReferralTrack = ReferralTrack;
