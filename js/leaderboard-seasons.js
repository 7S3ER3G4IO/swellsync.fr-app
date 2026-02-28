/**
 * SwellSync — Leaderboard saisonnier (T73/T74/T75/T78/T79)
 * T73: Saisons surf (trimestres) avec classements réinitialisés
 * T74: Badge "Légende locale" surfeur le + actif par région
 * T75: Streaks (jours consécutifs avec 1 session)
 * T76: Points bonus nouvelles zones (exploration)
 * T78: Tournoi mensuel classement auto
 * T79: Médailles or/argent/bronze
 */

const LeaderboardSeasons = {

    // Saison en cours (trimestre)
    getCurrentSeason() {
        const now = new Date();
        const q = Math.ceil((now.getMonth() + 1) / 3);
        const year = now.getFullYear();
        return { label: `${year} Q${q}`, start: `${year}-${String((q - 1) * 3 + 1).padStart(2, '0')}-01`, year, quarter: q };
    },

    // T78/T73 — Classement saisonnier par région
    async loadSeasonLeaderboard(region = null, containerId = 'leaderboard-list') {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card" style="margin-top:8px"></div><div class="skeleton skeleton-card" style="margin-top:8px"></div>';

        const season = this.getCurrentSeason();
        try {
            let query = supabase
                .from('season_scores')
                .select('rank, score, sessions_count, user:members(id, username, display_name, avatar_url, level, region)')
                .eq('season', season.label)
                .order('rank', { ascending: true })
                .limit(20);

            if (region) query = query.eq('region', region);

            const { data } = await query;

            if (!data?.length) {
                container.innerHTML = '<div class="empty-state"><div>🏆</div><h3>Classement vide</h3><p>Enregistre des sessions pour apparaître dans le classement !</p></div>';
                return;
            }

            const medals = ['🥇', '🥈', '🥉'];
            container.innerHTML = data.map((entry, i) => {
                const rank = entry.rank || i + 1;
                const medal = rank <= 3 ? medals[rank - 1] : `#${rank}`;
                const isTop3 = rank <= 3;
                return `
          <div style="display:flex;align-items:center;gap:12px;padding:14px;background:${isTop3 ? 'rgba(14,165,233,.06)' : 'rgba(255,255,255,.02)'};border:1px solid ${isTop3 ? 'rgba(14,165,233,.15)' : 'rgba(255,255,255,.05)'};border-radius:16px;margin-bottom:8px">
            <div style="font-size:${isTop3 ? '24' : '16'}px;font-weight:800;min-width:36px;text-align:center;color:${isTop3 ? ['#f59e0b', '#94a3b8', '#cd7c3a'][rank - 1] : '#64748b'}">${medal}</div>
            <a href="/u/${entry.user?.username}" style="text-decoration:none;flex:1;display:flex;align-items:center;gap:10px">
              <img src="${entry.user?.avatar_url || '/assets/images/default-avatar.png'}" width="36" height="36" style="border-radius:50%;object-fit:cover" alt="${entry.user?.display_name || ''}">
              <div>
                <div style="font-weight:700;color:#f1f5f9;font-size:14px">${entry.user?.display_name || entry.user?.username || 'Surfeur'}</div>
                <div style="font-size:12px;color:#64748b">${entry.sessions_count || 0} sessions · ${entry.user?.region || ''}</div>
              </div>
            </a>
            <div style="text-align:right">
              <div style="font-size:18px;font-weight:800;color:${isTop3 ? '#0ea5e9' : '#94a3b8'}">${entry.score || 0}</div>
              <div style="font-size:10px;color:#64748b">pts</div>
            </div>
          </div>`;
            }).join('');
        } catch (e) { console.warn('Leaderboard error:', e); }
    },

    // T74 — Badge "Légende locale" par région
    async getRegionalLegend(region) {
        try {
            const season = this.getCurrentSeason();
            const { data } = await supabase
                .from('season_scores')
                .select('score, user:members(username, display_name, avatar_url)')
                .eq('season', season.label)
                .eq('region', region)
                .order('score', { ascending: false })
                .limit(1)
                .single();
            return data;
        } catch { return null; }
    },

    // T79 — Médailles
    getMedal(rank) {
        const medals = {
            1: { emoji: '🥇', label: 'Or', color: '#f59e0b' },
            2: { emoji: '🥈', label: 'Argent', color: '#94a3b8' },
            3: { emoji: '🥉', label: 'Bronze', color: '#cd7c3a' },
        };
        return medals[rank] || null;
    },

    // T75 — Calculer les streaks
    calculateStreak(sessionDates) {
        if (!sessionDates?.length) return 0;
        const sorted = [...new Set(sessionDates.map(d => d.substring(0, 10)))].sort().reverse();
        let streak = 0;
        let checkDate = new Date(); checkDate.setHours(0, 0, 0, 0);
        for (const dateStr of sorted) {
            const d = new Date(dateStr);
            const diff = Math.round((checkDate - d) / 86400000);
            if (diff === 0 || diff === 1) { streak++; checkDate = d; }
            else break;
        }
        return streak;
    },

    // T76 — Points bonus exploration (nouveaux spots)
    async checkExplorationBonus(userId) {
        try {
            const { data } = await supabase
                .from('surf_sessions')
                .select('spot_id')
                .eq('user_id', userId)
                .not('spot_id', 'is', null);
            const uniqueSpots = new Set(data?.map(s => s.spot_id) || []);
            const bonus = Math.floor(uniqueSpots.size / 5) * 50; // +50pts par tranche de 5 spots uniques
            return { unique_spots: uniqueSpots.size, bonus_points: bonus };
        } catch { return { unique_spots: 0, bonus_points: 0 }; }
    },

    // Rendu complet du module leaderboard avec filtre régions
    renderFull(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const season = this.getCurrentSeason();
        const regions = ['France', 'Bretagne', 'Landes', 'Pays Basque', 'Normandie', 'Méditerranée'];

        container.innerHTML = `
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2 style="font-size:18px;font-weight:800;color:#f1f5f9;margin:0">🏆 ${season.label}</h2>
          <div style="font-size:12px;color:#64748b">Se réinitialise le 1er ${['jan', 'avr', 'juil', 'oct'][season.quarter - 1]}.</div>
        </div>
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none">
          ${regions.map((r, i) => `<button type="button" onclick="LeaderboardSeasons.loadSeasonLeaderboard('${i === 0 ? 'null' : r}','leaderboard-list')" style="white-space:nowrap;padding:7px 14px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#64748b;font-size:12px;cursor:pointer;flex-shrink:0">${r}</button>`).join('')}
        </div>
      </div>
      <div id="leaderboard-list"></div>`;

        this.loadSeasonLeaderboard(null, 'leaderboard-list');
    }
};

window.LeaderboardSeasons = LeaderboardSeasons;
