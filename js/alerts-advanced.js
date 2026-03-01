/**
 * SwellSync — Alertes surf avancées (T31-T40)
 * T31: Alerte par plage horaire (ex: alerter entre 6h-12h seulement)
 * T32: Alerte multi-spots (alerter si Lacanau OU Hossegor est bon)
 * T33: Alerte "surf de groupe" — notifier des amis en même temps
 * T34: Test push notification depuis l'écran alertes
 * T35: Historique des alertes déclenchées (conditions exactes)
 * T36: Snooze d'alerte 24h/48h
 * T37: Alertes "conditions parfaites" (3+ critères simultanément)
 * T38: Export alertes en .ics (calendrier)
 * T39: Alerte "Session amis" — notifié quand un ami enregistre une session
 * T40: Désactiver toutes les alertes (mode vacances)
 */

const AlertsAdvanced = {

    // Structure d'une alerte avancée
    createAlert(config = {}) {
        return {
            id: `alert_${Date.now()}`,
            name: config.name || 'Mon alerte',
            spots: config.spots || [], // T32: multi-spots
            min_height: config.min_height || 1.0,
            max_wind: config.max_wind || 25,
            min_period: config.min_period || 7,
            time_from: config.time_from || '06:00', // T31: plage horaire
            time_to: config.time_to || '12:00',
            friends: config.friends || [], // T33: amis à notifier
            perfect_mode: config.perfect_mode || false, // T37: 3+ critères
            enabled: true,
            snoozed_until: null, // T36: snooze
            created_at: new Date().toISOString()
        };
    },

    // T37 — Vérifier si les conditions sont "parfaites" (3+ critères)
    checkPerfectConditions(forecast, alert) {
        const criteria = [
            forecast.wave_height >= alert.min_height,
            forecast.wind_speed <= alert.max_wind,
            forecast.wave_period >= alert.min_period,
            forecast.swell_direction_ok !== false,
            (forecast.score || 0) >= 7
        ];
        return criteria.filter(Boolean).length >= 3;
    },

    // T31 — Vérifier si dans la plage horaire
    isInTimeRange(alert) {
        const now = new Date();
        const [fromH, fromM] = (alert.time_from || '00:00').split(':').map(Number);
        const [toH, toM] = (alert.time_to || '23:59').split(':').map(Number);
        const nowMins = now.getHours() * 60 + now.getMinutes();
        return nowMins >= fromH * 60 + fromM && nowMins <= toH * 60 + toM;
    },

    // T36 — Snooze d'alerte
    async snooze(alertId, hours = 24) {
        const snoozeUntil = new Date(Date.now() + hours * 3600000).toISOString();
        await supabase.from('alerts').update({ snoozed_until: snoozeUntil }).eq('id', alertId);
        if (typeof showToast !== 'undefined') showToast(`😴 Alerte en pause ${hours}h`, 'info');
    },

    isSnoozeActive(alert) {
        return alert.snoozed_until && new Date(alert.snoozed_until) > new Date();
    },

    // T34 — Test push notification
    async testPush(alertName) {
        if (!('Notification' in window)) { if (typeof showToast !== 'undefined') showToast('Notifications non supportées', 'error'); return; }
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') { if (typeof showToast !== 'undefined') showToast('Autorisation refusée', 'error'); return; }
        new Notification('🌊 SwellSync — Test Alerte', {
            body: `Conditions parfaites pour "${alertName}" ! Houle 1.8m, vent 12 km/h, score 8/10`,
            icon: '/assets/icons/icon-192.png',
            badge: '/assets/icons/icon-72.png',
            tag: 'sw-test'
        });
        if (typeof showToast !== 'undefined') showToast('📲 Notification test envoyée !', 'success');
    },

    // T35 — Historique des alertes déclenchées
    async loadHistory(containerId = 'alerts-history') {
        const el = document.getElementById(containerId);
        if (!el) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            const { data } = await supabase.from('alert_triggers').select('id, alert_name, spot_name, conditions, triggered_at').eq('user_id', member.id).order('triggered_at', { ascending: false }).limit(20);
            if (!data?.length) { el.innerHTML = '<div class="empty-state"><div>🔔</div><h3>Aucune alerte déclenchée</h3><p>Tes alertes s\'afficheront ici quand les conditions sont bonnes</p></div>'; return; }
            el.innerHTML = data.map(t => {
                const cond = t.conditions || {};
                return `<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:14px;margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <div style="font-weight:700;color:#f1f5f9">${t.alert_name}</div>
            <div style="font-size:11px;color:#64748b">${new Date(t.triggered_at).toLocaleDateString('fr-FR')}</div>
          </div>
          <div style="font-size:13px;color:#0ea5e9;font-weight:600;margin-bottom:4px">📍 ${t.spot_name}</div>
          <div style="font-size:12px;color:#94a3b8">🌊 ${cond.wave_height || '?'}m · 💨 ${cond.wind_speed || '?'} km/h · ⏱️ ${cond.wave_period || '?'}s · ⭐ ${cond.score || '?'}/10</div>
        </div>`;
            }).join('');
        } catch { el.innerHTML = '<div class="empty-state"><div>⚠️</div><h3>Erreur chargement</h3></div>'; }
    },

    // T38 — Export en .ics (calendrier)
    async exportToICS(alerts) {
        const lines = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SwellSync//FR',
            'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'
        ];
        alerts.forEach(alert => {
            if (!alert.enabled) return;
            const uid = `${alert.id}@swellsync.fr`;
            const dtstart = alert.time_from?.replace(':', '') || '060000';
            const summary = `🌊 ${alert.name} — ${alert.spots.join(', ')}`;
            const desc = `Alerte SwellSync\\nSpots: ${alert.spots.join(', ')}\\nHoule min: ${alert.min_height}m · Vent max: ${alert.max_wind} km/h · Période min: ${alert.min_period}s`;
            // Événement récurrent tous les jours dans la plage horaire
            lines.push(
                'BEGIN:VEVENT',
                `UID:${uid}`,
                `DTSTART;TZID=Europe/Paris:${new Date().toISOString().slice(0, 10).replace(/-/g, '')}T${dtstart}`,
                `RRULE:FREQ=DAILY`,
                `SUMMARY:${summary}`,
                `DESCRIPTION:${desc}`,
                'STATUS:TENTATIVE',
                'END:VEVENT'
            );
        });
        lines.push('END:VCALENDAR');
        const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'alertes-surf.ics';
        a.click(); URL.revokeObjectURL(url);
        if (typeof showToast !== 'undefined') showToast('📅 Calendrier exporté !', 'success');
    },

    // T39 — Alerte "Session amis"
    async setupFriendSessionAlert(enable = true) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            await supabase.from('alert_preferences').upsert({ user_id: member.id, friend_session_notif: enable }, { onConflict: 'user_id' });
            if (typeof showToast !== 'undefined') showToast(enable ? '🤙 Alertes sessions amis activées !' : 'Alertes sessions amis désactivées', enable ? 'success' : 'info');
        } catch { }
    },

    // T40 — Mode vacances (désactiver tout)
    async toggleVacationMode(enable = true) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            await supabase.from('members').update({ vacation_mode: enable }).eq('id', member.id);
            if (enable) {
                await supabase.from('alerts').update({ enabled: false }).eq('user_id', member.id);
            }
            if (typeof showToast !== 'undefined') showToast(enable ? '🏖️ Mode vacances activé — Toutes les alertes coupées' : '🔔 Alertes réactivées !', enable ? 'info' : 'success');
        } catch { }
    },

    // T33 — Notifier des amis en même temps
    async notifyFriends(alertId, friendIds, conditions, spotName) {
        if (!friendIds?.length) return;
        const messages = friendIds.map(friendId => ({
            user_id: friendId, type: 'friend_alert',
            message: `🌊 Conditions parfaites à ${spotName} ! Houle ${conditions.wave_height}m · Score ${conditions.score}/10. Ton ami te le signale 🤙`,
            created_at: new Date().toISOString()
        }));
        await supabase.from('notifications').insert(messages);
    },

    // Widget alerte avancée (modal)
    renderAlertForm(config = {}) {
        const spots = ['Biarritz', 'Hossegor', 'La Torche', 'Lacanau', 'Capbreton', 'Seignosse'];
        return `
      <div class="alert-form">
        <div style="margin-bottom:14px">
          <label style="font-size:12px;color:#64748b;font-weight:600;display:block;margin-bottom:6px">📍 SPOTS (T32 — Multi-spots)</label>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${spots.map(s => `<label style="display:flex;align-items:center;gap:4px;cursor:pointer"><input type="checkbox" name="spots" value="${s}" style="accent-color:#0ea5e9"> <span style="font-size:13px;color:#94a3b8">${s}</span></label>`).join('')}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          <div>
            <label style="font-size:12px;color:#64748b;font-weight:600;display:block;margin-bottom:4px">⏰ Heure début (T31)</label>
            <input type="time" value="06:00" name="time_from" style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px;color:#f1f5f9;font-size:14px">
          </div>
          <div>
            <label style="font-size:12px;color:#64748b;font-weight:600;display:block;margin-bottom:4px">⏰ Heure fin</label>
            <input type="time" value="12:00" name="time_to" style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px;color:#f1f5f9;font-size:14px">
          </div>
        </div>
        <div style="margin-bottom:14px">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
            <input type="checkbox" name="perfect_mode" style="accent-color:#0ea5e9;width:16px;height:16px">
            <div>
              <div style="font-size:14px;color:#f1f5f9;font-weight:600">🔥 Mode conditions parfaites (T37)</div>
              <div style="font-size:12px;color:#64748b">Alerter seulement si 3+ critères remplis simultanément</div>
            </div>
          </label>
        </div>
        <button onclick="AlertsAdvanced.testPush('Mon alerte')" style="width:100%;background:rgba(14,165,233,.1);border:1px solid rgba(14,165,233,.2);border-radius:12px;padding:10px;color:#0ea5e9;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px">📲 Test push (T34)</button>
      </div>`;
    }
};

window.AlertsAdvanced = AlertsAdvanced;
