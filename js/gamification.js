/**
 * SwellSync — Gamification Module
 * Leaderboard, défis hebdomadaires, titres surf, streaks
 */

const SURF_TITLES = [
  { min: 0, title: 'Rookie', icon: '🤙', bg: '#64748b' },
  { min: 5, title: 'Débutant', icon: '🌊', bg: '#22c55e' },
  { min: 20, title: 'Local', icon: '🏄', bg: '#3b82f6' },
  { min: 50, title: 'Habitué', icon: '⚡', bg: '#8b5cf6' },
  { min: 100, title: 'Avancé', icon: '🔥', bg: '#ef4444' },
  { min: 200, title: 'Expert', icon: '👑', bg: '#f59e0b' },
  { min: 365, title: 'Légende', icon: '🌟', bg: '#0ea5e9' },
];

const WEEKLY_CHALLENGES = [
  { id: 'surf_5', label: '5 sessions en 7 jours', target: 5, icon: '🏄' },
  { id: 'early_bird', label: 'Surfer avant 8h du matin', target: 1, icon: '🌅' },
  { id: 'score_80', label: 'Score > 80 en une session', target: 80, icon: '🎯' },
  { id: 'new_spot', label: 'Découvrir un nouveau spot', target: 1, icon: '📍' },
  { id: 'share', label: 'Partager une session', target: 1, icon: '📤' },
];

function getSurfTitle(totalSessions) {
  let current = SURF_TITLES[0];
  for (const t of SURF_TITLES) {
    if (totalSessions >= t.min) current = t;
  }
  const idx = SURF_TITLES.indexOf(current);
  const next = SURF_TITLES[idx + 1];
  return {
    ...current,
    nextAt: next?.min,
    nextTitle: next?.title,
    progress: next ? ((totalSessions - current.min) / (next.min - current.min)) * 100 : 100
  };
}

async function loadLeaderboard(region = null, limit = 10) {
  try {
    let q = supabase.from('members')
      .select('id, name, avatar_url, total_sessions')
      .order('total_sessions', { ascending: false })
      .limit(limit);
    if (region) q = q.eq('region', region);
    const { data } = await q;
    return data || [];
  } catch { return []; }
}

function renderLeaderboard(container, users) {
  if (!container) return;
  if (!users.length) {
    container.innerHTML = '<div class="empty-state"><div>🏆</div><h3>Classement vide</h3><p>Sois le premier à enregistrer une session !</p></div>';
    return;
  }
  container.innerHTML = users.map((u, i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:12px;background:rgba(255,255,255,.03);border-radius:12px;margin-bottom:8px">
      <div style="font-size:20px;width:32px;text-align:center">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</div>
      <img src="${u.avatar_url || '/assets/icons/icon-72x72.png'}" alt="${u.name}" width="36" height="36" style="border-radius:50%;object-fit:cover" loading="lazy">
      <div style="flex:1">
        <div style="font-weight:600;color:#f1f5f9;font-size:14px">${u.name || 'Surfeur'}</div>
        <div style="color:#64748b;font-size:12px">${u.total_sessions || 0} sessions</div>
      </div>
      <div style="font-size:13px;color:#0ea5e9;font-weight:700">${u.total_sessions || 0}</div>
    </div>
  `).join('');
}

async function checkWeeklyChallenges(memberId) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  try {
    const { data } = await supabase.from('surf_sessions')
      .select('score, spot_name, created_at')
      .eq('member_id', memberId)
      .gte('created_at', weekStart.toISOString());
    return WEEKLY_CHALLENGES.map(c => {
      let prog = 0;
      if (data) {
        if (c.id === 'surf_5') prog = data.length;
        else if (c.id === 'early_bird') prog = data.filter(s => new Date(s.created_at).getHours() < 8).length;
        else if (c.id === 'score_80') prog = Math.max(0, ...data.map(s => s.score || 0)) >= 80 ? 1 : 0;
      }
      return { ...c, progress: prog, completed: prog >= c.target };
    });
  } catch { return WEEKLY_CHALLENGES.map(c => ({ ...c, progress: 0, completed: false })); }
}

window.getSurfTitle = getSurfTitle;
window.loadLeaderboard = loadLeaderboard;
window.renderLeaderboard = renderLeaderboard;
window.checkWeeklyChallenges = checkWeeklyChallenges;
window.SURF_TITLES = SURF_TITLES;
window.WEEKLY_CHALLENGES = WEEKLY_CHALLENGES;
