/**
 * SwellSync — Stats Module Avancé
 * Distance totale, temps eau, vagues, streak, spots favoris
 */

async function loadAdvancedStats(memberId) {
  try {
    const { data: sessions } = await supabase
      .from('surf_sessions')
      .select('duration, score, wave_count, distance_m, created_at, spot_name')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });

    if (!sessions?.length) return null;

    const now = new Date();
    const thisYear = sessions.filter(s => new Date(s.created_at).getFullYear() === now.getFullYear());
    const thisMonth = sessions.filter(s => {
      const d = new Date(s.created_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    return {
      total_sessions: sessions.length,
      total_time_hours: (sessions.reduce((a, s) => a + (s.duration || 0), 0) / 3600).toFixed(1),
      total_distance_km: (sessions.reduce((a, s) => a + (s.distance_m || 0), 0) / 1000).toFixed(1),
      total_waves: sessions.reduce((a, s) => a + (s.wave_count || 0), 0),
      avg_score: Math.round(sessions.reduce((a, s) => a + (s.score || 0), 0) / sessions.length),
      best_score: Math.max(...sessions.map(s => s.score || 0)),
      this_year_sessions: thisYear.length,
      this_month_sessions: thisMonth.length,
      favorite_spots: getFavoriteSpots(sessions, 3),
      streak: getCurrentStreak(sessions),
    };
  } catch { return null; }
}

function getFavoriteSpots(sessions, limit = 3) {
  const counts = {};
  sessions.forEach(s => { if (s.spot_name) counts[s.spot_name] = (counts[s.spot_name] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([spot, count]) => ({ spot, count }));
}

function getCurrentStreak(sessions) {
  const days = [...new Set(sessions.map(s => new Date(s.created_at).toDateString()))].sort((a, b) => new Date(b) - new Date(a));
  if (!days.length) return 0;
  let streak = 1;
  for (let i = 0; i < days.length - 1; i++) {
    const diff = (new Date(days[i]) - new Date(days[i + 1])) / 86400000;
    if (diff <= 7) streak++; else break;
  }
  return streak;
}

function renderStatCard(container, stats) {
  if (!container) return;
  if (!stats) {
    container.innerHTML = '<div class="empty-state"><div>📊</div><h3>Aucune session</h3><p>Enregistre ta première session pour voir tes stats !</p></div>';
    return;
  }
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px">
      <div style="background:rgba(14,165,233,.1);border:1px solid rgba(14,165,233,.2);border-radius:16px;padding:16px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#0ea5e9">${stats.total_sessions}</div>
        <div style="font-size:12px;color:#94a3b8">Sessions totales</div>
      </div>
      <div style="background:rgba(16,185,129,.1);border:1px solid rgba(16,185,129,.2);border-radius:16px;padding:16px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#10b981">${stats.total_time_hours}h</div>
        <div style="font-size:12px;color:#94a3b8">Temps en eau</div>
      </div>
      <div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.2);border-radius:16px;padding:16px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#f59e0b">${stats.total_waves}</div>
        <div style="font-size:12px;color:#94a3b8">Vagues surfées</div>
      </div>
      <div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);border-radius:16px;padding:16px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#ef4444">${stats.streak}🔥</div>
        <div style="font-size:12px;color:#94a3b8">Série en cours</div>
      </div>
    </div>
    ${stats.favorite_spots.length ? `
    <div style="padding:0 16px 16px">
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:16px">
        <div style="font-size:13px;font-weight:600;color:#f1f5f9;margin-bottom:12px">🏖️ Tes spots préférés</div>
        ${stats.favorite_spots.map((s, i) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05)">
            <span style="color:#94a3b8;font-size:14px">${['🥇', '🥈', '🥉'][i] || '•'} ${s.spot}</span>
            <span style="color:#0ea5e9;font-size:13px;font-weight:600">${s.count}x</span>
          </div>`).join('')}
      </div>
    </div>` : ''}
  `;
}

window.loadAdvancedStats = loadAdvancedStats;
window.renderStatCard = renderStatCard;
window.getCurrentStreak = getCurrentStreak;
window.getFavoriteSpots = getFavoriteSpots;
