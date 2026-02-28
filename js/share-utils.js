/**
 * SwellSync — Partage des conditions du jour (T7)
 * Génère une image des conditions actuelles + Web Share API
 * + T52: Partager sa localisation dans un message
 * + T28: Lien profil public
 */

const ShareUtils = {

    // T7: Partager les conditions du jour (génère une carte textuelle)
    async shareConditions(conditionsData) {
        const { spot, score, houle, vent, periode, maree } = conditionsData || {};
        const text = [
            `🌊 Conditions surf à ${spot || 'mon spot'} — sur SwellSync`,
            `📊 Score: ${score || '?'}/100`,
            houle ? `🌊 Houle: ${houle}` : '',
            periode ? `⏱️ Période: ${periode}` : '',
            vent ? `💨 Vent: ${vent}` : '',
            maree ? `🌙 Marée: ${maree}` : '',
            `\nVoir les prévisions: https://swellsync.fr/pages/forecast.html`
        ].filter(Boolean).join('\n');

        if (navigator.share) {
            try { await navigator.share({ title: `🌊 Conditions surf — SwellSync`, text }); return; } catch { }
        }
        // Fallback clipboard
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            if (typeof showToast !== 'undefined') showToast('📋 Conditions copiées dans le presse-papier !', 'success');
        }
    },

    // T52: Partager sa localisation dans un message (Supabase Realtime)
    async shareLocationInMessage(conversationId) {
        if (!navigator.geolocation) { if (typeof showToast !== 'undefined') showToast('Géolocalisation non supportée', 'error'); return; }

        navigator.geolocation.getCurrentPosition(async pos => {
            const { latitude, longitude } = pos.coords;
            const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
            const content = `📍 Ma position actuelle: ${mapUrl}`;
            try {
                const { data: { user } } = await supabase.auth.getUser();
                await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: user.id, content, type: 'location' });
                if (typeof showToast !== 'undefined') showToast('📍 Localisation partagée !', 'success');
            } catch { }
        }, () => { if (typeof showToast !== 'undefined') showToast('Accès à la position refusé', 'error'); });
    },

    // Copier un lien dans le presse-papier avec feedback
    async copyLink(url, message = 'Lien copié !') {
        try {
            await navigator.clipboard.writeText(url);
            if (typeof showToast !== 'undefined') showToast('📋 ' + message, 'success');
            return true;
        } catch {
            // Fallback input hidden
            const inp = document.createElement('input');
            inp.value = url; document.body.appendChild(inp);
            inp.select(); document.execCommand('copy');
            document.body.removeChild(inp);
            if (typeof showToast !== 'undefined') showToast('📋 ' + message, 'success');
            return true;
        }
    },

    // Partage natif avec fallback clipboard
    async share(data) {
        if (navigator.share) {
            try { await navigator.share(data); return true; } catch { }
        }
        if (data.url) return this.copyLink(data.url, data.title ? data.title + ' — lien copié' : 'Lien copié !');
        return false;
    },

    // QR Code pour un spot (T137)
    generateSpotQR(spotUrl) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(spotUrl)}&bgcolor=080f1a&color=0ea5e9&margin=10`;
        return `<img src="${qrUrl}" alt="QR code" width="200" height="200" style="border-radius:12px" loading="lazy">`;
    }
};

window.ShareUtils = ShareUtils;
