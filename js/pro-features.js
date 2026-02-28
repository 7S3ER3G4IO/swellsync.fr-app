/**
 * SwellSync — Système de badges Pro + niveaux (T158, T80)
 * Badge Pro visible sur profil + à côté du pseudo dans la community
 * + T28 — Profil public partageable (swellsync.fr/u/username)
 */

const ProBadge = {

    // Rendre le badge Pro dans un élément
    render(isPro = false, size = 'sm') {
        if (!isPro) return '';
        const sizes = { sm: 'font-size:10px;padding:2px 7px', md: 'font-size:12px;padding:3px 10px', lg: 'font-size:14px;padding:4px 14px' };
        return `<span class="pro-badge" style="${sizes[size] || sizes.sm}" aria-label="Abonné Pro" role="img">👑 PRO</span>`;
    },

    // Ajouter le badge Pro sur tous les pseudos dans la page
    async injectBadges() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: member } = await supabase.from('members').select('is_pro,username').eq('auth_id', user.id).single();
            if (!member) return;

            // Stocker dans window pour ré-utilisation
            window._currentUser = member;

            // Ajouter badge Pro sur le profil si Pro
            document.querySelectorAll('[data-pro-badge-target]').forEach(el => {
                el.innerHTML = this.render(member.is_pro, el.dataset.proBadgeSize || 'md');
            });

            // Headline profil
            const profileName = document.getElementById('profile-display-name');
            if (profileName && member.is_pro) {
                profileName.insertAdjacentHTML('afterend', ' ' + this.render(true, 'sm'));
            }
        } catch { }
    },

    // T28 — Partager son profil public
    async shareProfile(username) {
        const url = `https://swellsync.fr/u/${username}`;
        const text = `🌊 Suis-moi sur SwellSync — l'app surf française ! ${url}`;
        if (navigator.share) {
            try { await navigator.share({ title: 'Mon profil SwellSync', text, url }); } catch { }
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            if (typeof showToast !== 'undefined') showToast('📋 Lien de profil copié !', 'success');
        }
    }
};

// ══════════════════════════════════════════════════
// T34 — Test push notification depuis alerts.html
// ══════════════════════════════════════════════════
const AlertsTest = {

    // Envoyer une notification test depuis la page alertes
    async sendTestPush() {
        try {
            if (!('Notification' in window)) {
                if (typeof showToast !== 'undefined') showToast('Les notifications push ne sont pas supportées sur ce navigateur.', 'error');
                return;
            }

            if (Notification.permission === 'denied') {
                if (typeof showToast !== 'undefined') showToast('Notifications bloquées. Active-les dans les paramètres de ton navigateur.', 'error');
                return;
            }

            if (Notification.permission !== 'granted') {
                const perm = await Notification.requestPermission();
                if (perm !== 'granted') {
                    if (typeof showToast !== 'undefined') showToast('Permission refusée. Pas de notifications.', 'info');
                    return;
                }
            }

            // Utiliser le SW si disponible, sinon new Notification
            const sw = await navigator.serviceWorker?.ready;
            if (sw?.showNotification) {
                await sw.showNotification('🌊 SwellSync — Conditions parfaites !', {
                    body: 'Houle 1.5m @ 12s · Vent offshore · Score: 85/100',
                    icon: '/assets/images/swellsync_logo.png',
                    badge: '/assets/images/swellsync_logo.png',
                    vibrate: [200, 100, 200],
                    tag: 'swellsync-test',
                    data: { url: '/pages/forecast.html' }
                });
            } else {
                new Notification('🌊 SwellSync — Conditions parfaites !', {
                    body: 'Houle 1.5m @ 12s · Vent offshore · Score: 85/100',
                    icon: '/assets/images/swellsync_logo.png'
                });
            }

            if (typeof showToast !== 'undefined') showToast('✅ Notification test envoyée !', 'success');
        } catch (e) {
            if (typeof showToast !== 'undefined') showToast('Erreur notification: ' + (e.message || e), 'error');
        }
    },

    // Snooze d'alerte (T36)
    async snoozeAlert(alertId, hours = 24) {
        try {
            const snoozeUntil = new Date(Date.now() + hours * 3600000).toISOString();
            await supabase.from('surf_alerts').update({ snoozed_until: snoozeUntil }).eq('id', alertId);
            if (typeof showToast !== 'undefined') showToast(`😴 Alerte mise en pause ${hours}h`, 'info');
        } catch { }
    },

    // Désactiver toutes les alertes (mode vacances, T40)
    async muteAll(days = 7) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            const muteUntil = new Date(Date.now() + days * 86400000).toISOString();
            await supabase.from('members').update({ alerts_muted_until: muteUntil }).eq('id', member.id);
            if (typeof showToast !== 'undefined') showToast(`🏖️ Mode vacances activé — ${days} jours sans alertes`, 'success');
        } catch { }
    }
};

window.ProBadge = ProBadge;
window.AlertsTest = AlertsTest;
