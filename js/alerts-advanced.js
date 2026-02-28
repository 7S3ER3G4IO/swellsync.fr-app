/**
 * SwellSync — Alertes avancées (T31-T39)
 * T31: Alerte par plage horaire
 * T32: Alerte multi-spots
 * T33: Alerte groupe d'amis
 * T37: Alertes conditions parfaites (3+ critères)
 * T38: Export .ics calendrier
 * T39: Alerte session amis
 */

const AlertsAdvanced = {

    // T31 — Créer alerte avec plage horaire
    async createTimedAlert({ spotId, spotName, minScore = 60, timeFrom = '06:00', timeTo = '12:00', days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            const { error } = await supabase.from('surf_alerts').insert({
                user_id: member.id,
                spot_id: spotId,
                spot_name: spotName,
                min_score: minScore,
                time_from: timeFrom,
                time_to: timeTo,
                active_days: days,
                active: true,
                created_at: new Date().toISOString()
            });
            if (!error && typeof showToast !== 'undefined') showToast(`🔔 Alerte créée pour ${spotName} (${timeFrom}–${timeTo})`, 'success');
            return !error;
        } catch { return false; }
    },

    // T32 — Alerte multi-spots (OR logic)
    async createMultiSpotAlert(spots, minScore = 65) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            const spotsLabel = spots.map(s => s.name).join(' ou ');
            const { error } = await supabase.from('surf_alerts').insert({
                user_id: member.id,
                multi_spots: spots.map(s => s.id),
                spot_name: spotsLabel,
                min_score: minScore,
                active: true,
                alert_type: 'multi'
            });
            if (!error && typeof showToast !== 'undefined') showToast(`🔔 Alerte multi-spots créée : ${spotsLabel}`, 'success');
            return !error;
        } catch { return false; }
    },

    // T33 — Alerte groupe : notifier des amis en même temps
    async createGroupAlert(alertId, friendIds) {
        try {
            const inserts = friendIds.map(fid => ({ original_alert_id: alertId, recipient_user_id: fid }));
            await supabase.from('alert_group_recipients').insert(inserts);
            if (typeof showToast !== 'undefined') showToast(`👥 ${friendIds.length} ami(s) seront notifiés avec toi !`, 'success');
        } catch { }
    },

    // T37 — Alerte conditions parfaites (3+ critères simultanément)
    buildPerfectConditionsAlert({ minScore = 75, minHoule = 1.0, maxVent = 15, minPeriod = 10 }) {
        return { conditions_type: 'perfect', min_score: minScore, min_houle: minHoule, max_vent_kmh: maxVent, min_period: minPeriod };
    },

    // T38 — Export alerte en .ics (abonnement calendrier)
    exportToICS(alert) {
        const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const ics = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SwellSync//FR',
            'BEGIN:VEVENT',
            `UID:swellsync-${alert.id || Date.now()}@swellsync.fr`,
            `DTSTAMP:${now}`,
            `DTSTART:${now}`,
            `SUMMARY:🌊 Alerte surf — ${alert.spot_name || 'Mon spot'}`,
            `DESCRIPTION:Score minimum: ${alert.min_score}/100. ${alert.time_from ? 'Horaire: ' + alert.time_from + '-' + alert.time_to : ''}`,
            `URL:https://swellsync.fr/pages/alerts.html`,
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([ics], { type: 'text/calendar' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `alerte-surf-${(alert.spot_name || 'spot').toLowerCase().replace(/\s+/g, '-')}.ics`;
        a.click();
        if (typeof showToast !== 'undefined') showToast('📅 Alerte exportée vers ton calendrier !', 'success');
    },

    // T39 — Être notifié quand un ami enregistre une session
    async subscribeFriendSession(friendId, friendName) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            await supabase.from('friend_session_alerts').upsert({ watcher_id: member.id, friend_id: friendId });
            if (typeof showToast !== 'undefined') showToast(`🏄 Tu seras notifié quand ${friendName} enregistre une session !`, 'success');
        } catch { }
    },

    // Rendu HTML pour le formulaire de création d'alerte avancée
    renderAdvancedForm(containerId, spotId, spotName) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:24px">
        <h3 style="font-size:16px;font-weight:700;color:#f1f5f9;margin:0 0 20px">🔔 Alerte avancée — ${spotName}</h3>
        <div style="margin-bottom:16px">
          <label style="display:block;font-size:13px;color:#94a3b8;margin-bottom:6px">Score minimum</label>
          <div style="display:flex;align-items:center;gap:10px">
            <input type="range" id="alert-score" min="40" max="90" value="65" style="flex:1;accent-color:#0ea5e9">
            <span id="alert-score-val" style="color:#0ea5e9;font-weight:700;width:40px">65</span>
          </div>
        </div>
        <div style="margin-bottom:16px">
          <label style="display:block;font-size:13px;color:#94a3b8;margin-bottom:6px">Plage horaire (T31)</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="time" id="alert-from" value="06:00" style="flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px;color:#f1f5f9">
            <span style="color:#64748b">→</span>
            <input type="time" id="alert-to" value="12:00" style="flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:8px;color:#f1f5f9">
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px" id="alert-days">
          ${['L', 'M', 'Me', 'J', 'V', 'S', 'D'].map((d, i) => `<label style="cursor:pointer"><input type="checkbox" value="${['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][i]}" checked style="display:none" class="day-cb"><div style="width:36px;height:36px;border-radius:50%;background:rgba(14,165,233,.2);border:1px solid rgba(14,165,233,.4);display:flex;align-items:center;justify-content:center;color:#0ea5e9;font-size:13px;font-weight:700">${d}</div></label>`).join('')}
        </div>
        <button type="button" onclick="AlertsAdvanced._submitForm('${spotId}', '${spotName}')" style="width:100%;background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;border-radius:14px;padding:14px;color:white;font-weight:700;font-size:15px;cursor:pointer">
          🔔 Créer l'alerte
        </button>
      </div>`;

        // Sync slider display
        document.getElementById('alert-score').addEventListener('input', e => {
            document.getElementById('alert-score-val').textContent = e.target.value;
        });
    },

    _submitForm(spotId, spotName) {
        const score = parseInt(document.getElementById('alert-score')?.value || '65');
        const from = document.getElementById('alert-from')?.value || '06:00';
        const to = document.getElementById('alert-to')?.value || '12:00';
        const days = [...document.querySelectorAll('.day-cb:checked')].map(c => c.value);
        this.createTimedAlert({ spotId, spotName, minScore: score, timeFrom: from, timeTo: to, days });
    }
};

window.AlertsAdvanced = AlertsAdvanced;
