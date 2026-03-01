/**
 * SwellSync — Profil avancé (T21-T30)
 * T21: Niveau de surf auto-calculé selon les sessions
 * T22: Graphique d'évolution score moyen 30 jours (Chart.js)
 * T23: Spots favoris — 3 spots les plus surfés
 * T24: Compteur "Sessions ce mois" visible profil
 * T25: Badge "En série" — semaines consécutives
 * T26: Voir tracés GPS du profil sur la carte
 * T27: Niveau basé sur distance totale
 * T28: Partager son profil (lien public)
 * T29: Option profil privé/public
 * T30: "Abonnés en commun" sur profils autres users
 */

const ProfileAdvanced = {

    // T21 / T27 — Calculer le niveau de surf
    calculateLevel(stats = {}) {
        const { sessions_count = 0, total_distance_km = 0, avg_score = 0, streak_weeks = 0 } = stats;
        let points = 0;
        // Sessions
        if (sessions_count >= 200) points += 40;
        else if (sessions_count >= 100) points += 30;
        else if (sessions_count >= 50) points += 20;
        else if (sessions_count >= 20) points += 10;
        else points += Math.floor(sessions_count / 5);
        // Distance totale (T27)
        if (total_distance_km >= 500) points += 30;
        else if (total_distance_km >= 200) points += 20;
        else if (total_distance_km >= 50) points += 10;
        else points += Math.floor(total_distance_km / 10);
        // Score moyen
        if (avg_score >= 8) points += 20;
        else if (avg_score >= 6) points += 12;
        else if (avg_score >= 4) points += 6;
        // Régularité
        if (streak_weeks >= 20) points += 10;
        else if (streak_weeks >= 8) points += 6;

        const levels = [
            { min: 0, label: 'Rookie', emoji: '🌱', color: '#10b981' },
            { min: 15, label: 'Local', emoji: '🏄', color: '#0ea5e9' },
            { min: 35, label: 'Intermédiaire', emoji: '⚙️', color: '#f59e0b' },
            { min: 55, label: 'Confirmé', emoji: '🔥', color: '#f97316' },
            { min: 75, label: 'Expert', emoji: '⚡', color: '#8b5cf6' },
            { min: 90, label: 'Legend', emoji: '🏆', color: '#f59e0b' },
        ];
        const level = [...levels].reverse().find(l => points >= l.min) || levels[0];
        return { ...level, points, next: levels[levels.findIndex(l => l.label === level.label) + 1] };
    },

    // Rendre le badge de niveau
    renderLevelBadge(level) {
        const next = level.next;
        const pct = next ? Math.round((level.points - level.min) / (next.min - level.min) * 100) : 100;
        return `
      <div style="background:linear-gradient(135deg,rgba(14,165,233,.08),rgba(16,185,129,.05));border:1px solid ${level.color}33;border-radius:18px;padding:16px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <div style="font-size:32px">${level.emoji}</div>
          <div>
            <div style="font-size:12px;color:#64748b;font-weight:600">NIVEAU SURF</div>
            <div style="font-size:22px;font-weight:900;color:${level.color}">${level.label}</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:24px;font-weight:900;color:#f1f5f9">${level.points}</div>
            <div style="font-size:11px;color:#64748b">points</div>
          </div>
        </div>
        ${next ? `
        <div style="font-size:11px;color:#64748b;margin-bottom:4px">→ ${next.label} dans ${next.min - level.points} pts</div>
        <div style="background:rgba(255,255,255,.05);border-radius:8px;height:6px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${level.color},${level.color}88);border-radius:8px;transition:width 1s"></div>
        </div>` : '<div style="font-size:13px;color:#f59e0b;font-weight:700">🏆 Niveau maximum atteint !</div>'}
      </div>`;
    },

    // T22 — Graphique évolution score 30 jours (Chart.js)
    renderScoreChart(canvasId, sessions = []) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;
        // Grouper par jour
        const last30 = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().slice(0, 10);
            const daySessions = sessions.filter(s => s.started_at?.slice(0, 10) === dateStr);
            last30.push({ date: dateStr, score: daySessions.length ? Math.round(daySessions.reduce((sum, s) => sum + (s.score || 0), 0) / daySessions.length) : null });
        }
        const labels = last30.map(d => new Date(d.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
        const data = last30.map(d => d.score);
        new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Score moyen', data,
                    borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,.08)',
                    borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#0ea5e9',
                    spanGaps: true, fill: true, tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 7 }, grid: { display: false } },
                    y: { min: 0, max: 10, ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,.04)' } }
                }
            }
        });
    },

    // T23 — Spots favoris (3 plus surfés)
    async loadFavoriteSpots(userId, containerId = 'profile-fav-spots') {
        const el = document.getElementById(containerId);
        if (!el) return;
        try {
            const { data } = await supabase.from('surf_sessions').select('spot_name').eq('user_id', userId).limit(200);
            const counts = {};
            data?.forEach(s => { if (s.spot_name) counts[s.spot_name] = (counts[s.spot_name] || 0) + 1; });
            const top3 = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
            el.innerHTML = `
        <div style="font-size:12px;color:#64748b;font-weight:600;letter-spacing:.5px;margin-bottom:10px">🏄 SPOTS FAVORIS</div>
        ${top3.map(([name, count], i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:8px 0;${i < top3.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,.04)' : ''}">
            <div style="font-size:18px">${['🥇', '🥈', '🥉'][i]}</div>
            <div style="flex:1;font-weight:600;color:#f1f5f9">${name}</div>
            <div style="font-size:12px;color:#64748b">${count} session${count > 1 ? 's' : ''}</div>
          </div>`).join('')}`;
        } catch { el.innerHTML = ''; }
    },

    // T24 — Compteur sessions du mois
    async loadMonthStats(userId, containerId = 'profile-month-stats') {
        const el = document.getElementById(containerId);
        if (!el) return;
        const firstOfMonth = new Date(); firstOfMonth.setDate(1); firstOfMonth.setHours(0, 0, 0, 0);
        try {
            const { count } = await supabase.from('surf_sessions').select('*', { count: 'exact' }).eq('user_id', userId).gte('started_at', firstOfMonth.toISOString());
            el.innerHTML = `
        <div style="text-align:center;background:rgba(14,165,233,.08);border:1px solid rgba(14,165,233,.15);border-radius:14px;padding:14px">
          <div style="font-size:36px;font-weight:900;color:#0ea5e9">${count || 0}</div>
          <div style="font-size:12px;color:#64748b">sessions ce mois de ${new Date().toLocaleDateString('fr-FR', { month: 'long' })}</div>
        </div>`;
        } catch { }
    },

    // T25 — Badge "En série" (semaines consécutives)
    calculateStreak(sessions = []) {
        const weeks = {};
        sessions.forEach(s => {
            const d = new Date(s.started_at);
            const week = `${d.getFullYear()}-W${String(Math.ceil((d.getDate() - d.getDay() + 7) / 7)).padStart(2, '0')}`;
            weeks[week] = true;
        });
        const sortedWeeks = Object.keys(weeks).sort().reverse();
        let streak = 0;
        let currentWeek = new Date();
        for (const week of sortedWeeks) {
            const expected = `${currentWeek.getFullYear()}-W${String(Math.ceil((currentWeek.getDate() - currentWeek.getDay() + 7) / 7)).padStart(2, '0')}`;
            if (week !== expected) break;
            streak++;
            currentWeek.setDate(currentWeek.getDate() - 7);
        }
        return streak;
    },

    renderStreakBadge(streak, containerId = 'profile-streak') {
        const el = document.getElementById(containerId);
        if (!el) return;
        const fire = streak >= 10 ? '🔥🔥' : streak >= 4 ? '🔥' : '💧';
        el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:14px;padding:12px 16px">
        <div style="font-size:28px">${fire}</div>
        <div>
          <div style="font-size:22px;font-weight:900;color:#f59e0b">${streak} semaine${streak > 1 ? 's' : ''}</div>
          <div style="font-size:12px;color:#64748b">de surf consécutives</div>
        </div>
      </div>`;
    },

    // T28 — Partager profil
    async shareProfile(username) {
        const url = `https://swellsync.fr/u/${username}`;
        if (navigator.share) {
            try { await navigator.share({ title: `${username} sur SwellSync`, url }); return; } catch { }
        }
        await navigator.clipboard.writeText(url).catch(() => { });
        if (typeof showToast !== 'undefined') showToast('🔗 Lien profil copié !', 'success');
    },

    // T29 — Profil privé/public
    async togglePrivacy(isPublic) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('members').update({ is_public: isPublic }).eq('auth_id', user.id);
            if (typeof showToast !== 'undefined') showToast(isPublic ? '🌐 Profil public' : '🔒 Profil privé', 'success');
        } catch { }
    },

    // T30 — Abonnés en commun
    async loadMutualFollowers(targetUserId, containerId = 'mutual-followers') {
        const el = document.getElementById(containerId);
        if (!el) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: me } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            // Mes abonnements
            const { data: myFollows } = await supabase.from('follows').select('following_id').eq('follower_id', me.id);
            const myFollowIds = myFollows?.map(f => f.following_id) || [];
            // Abonnements de la cible
            const { data: theirFollows } = await supabase.from('follows').select('following_id').eq('follower_id', targetUserId);
            const theirFollowIds = theirFollows?.map(f => f.following_id) || [];
            // Intersection
            const mutualIds = myFollowIds.filter(id => theirFollowIds.includes(id)).slice(0, 5);
            if (!mutualIds.length) { el.innerHTML = ''; return; }
            const { data: mutuals } = await supabase.from('members').select('username, avatar_url').in('id', mutualIds);
            el.innerHTML = `
        <div style="font-size:12px;color:#64748b;margin-bottom:6px">👥 <strong style="color:#f1f5f9">${mutuals.length}</strong> abonné${mutuals.length > 1 ? 's' : ''} en commun</div>
        <div style="display:flex;gap:-6px">
          ${mutuals.map(m => `<img src="${m.avatar_url || '/assets/images/default-avatar.png'}" width="28" height="28" style="border-radius:50%;border:2px solid #0a0f1e;margin-left:-6px" title="@${m.username}" alt="">`).join('')}
        </div>`;
        } catch { }
    }
};

window.ProfileAdvanced = ProfileAdvanced;
