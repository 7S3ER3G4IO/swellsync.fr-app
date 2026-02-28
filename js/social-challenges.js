/**
 * SwellSync — Défis sociaux & challenges communautaires (T80/T81/T82/T83)
 * T80: Défi entre amis (challenge direct)
 * T81: Participer à un défi communautaire
 * T82: Badge spécial défi accompli
 * T83: Feed des résultats de défis
 */

const SocialChallenges = {

    challenges: [
        { id: 'ch01', title: '7 jours consécutifs', emoji: '🔥', description: 'Surfe 7 jours de suite. Au moins 1 session par jour.', metric: 'streak', target: 7, reward_badge: '🔥 Streak Master', difficulty: 'Difficile', participants: 142 },
        { id: 'ch02', title: '10 sessions en mars', emoji: '📅', description: '10 sessions de surf dans le mois de mars.', metric: 'sessions_month', target: 10, reward_badge: '🗓️ March Surfer', difficulty: 'Moyen', participants: 287 },
        { id: 'ch03', title: 'Score parfait 90+', emoji: '🏆', description: 'Obtiens un score de 90+ sur une session.', metric: 'max_score', target: 90, reward_badge: '🏆 Perfect Wave', difficulty: 'Expert', participants: 64 },
        { id: 'ch04', title: '3 spots différents', emoji: '📍', description: 'Surfe dans 3 spots différents cette semaine.', metric: 'unique_spots_week', target: 3, reward_badge: '🗺️ Spot Explorer', difficulty: 'Moyen', participants: 198 },
        { id: 'ch05', title: 'Surf à l\'aube', emoji: '🌅', description: '3 sessions commençant avant 8h du matin.', metric: 'dawn_sessions', target: 3, reward_badge: '🌅 Early Bird', difficulty: 'Facile', participants: 346 },
        { id: 'ch06', title: 'Session de 2h+', emoji: '⏱️', description: 'Reste en eau plus de 2h lors d\'une session.', metric: 'max_duration', target: 120, reward_badge: '⏱️ Endurance', difficulty: 'Moyen', participants: 211 },
    ],

    async loadChallenges(containerId = 'challenges-list') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Charger la progression de l'utilisateur si connecté
        let userProgress = {};
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
                const { data: progress } = await supabase.from('user_challenges').select('challenge_id,progress,completed').eq('user_id', member?.id);
                progress?.forEach(p => { userProgress[p.challenge_id] = p; });
            }
        } catch { }

        const diffColor = { 'Facile': '#10b981', 'Moyen': '#f59e0b', 'Difficile': '#ef4444', 'Expert': '#8b5cf6' };

        container.innerHTML = this.challenges.map(ch => {
            const prog = userProgress[ch.id];
            const pct = prog ? Math.min(100, Math.round(prog.progress / ch.target * 100)) : 0;
            const done = prog?.completed;
            return `
        <div style="background:rgba(255,255,255,.03);border:1px solid ${done ? 'rgba(16,185,129,.3)' : 'rgba(255,255,255,.06)'};border-radius:20px;padding:18px;margin-bottom:12px">
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
            <div style="font-size:30px">${ch.emoji}</div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
                <div style="font-weight:700;color:#f1f5f9;font-size:15px">${ch.title}</div>
                ${done ? '<span style="background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);border-radius:8px;padding:2px 8px;color:#10b981;font-size:11px;font-weight:700">✅ Accompli</span>' : ''}
              </div>
              <div style="font-size:12px;color:#94a3b8;line-height:1.5">${ch.description}</div>
              <div style="display:flex;gap:8px;margin-top:6px">
                <span style="background:${diffColor[ch.difficulty]}22;border-radius:6px;padding:2px 8px;color:${diffColor[ch.difficulty]};font-size:11px;font-weight:600">${ch.difficulty}</span>
                <span style="color:#64748b;font-size:11px">${ch.participants} participants</span>
              </div>
            </div>
          </div>
          ${!done ? `
          <div style="background:rgba(255,255,255,.05);border-radius:8px;height:6px;overflow:hidden;margin-bottom:10px">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#0ea5e9,#0284c7);border-radius:8px;transition:width .5s"></div>
          </div>
          <div style="font-size:12px;color:#64748b;margin-bottom:12px">${prog ? `${prog.progress}/${ch.target} · ${pct}%` : 'Pas encore commencé'}</div>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:13px;color:#f59e0b">🏅 Récompense: ${ch.reward_badge}</div>
            ${!done ? `<button type="button" onclick="SocialChallenges.joinChallenge('${ch.id}')" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;border-radius:12px;padding:8px 16px;color:white;font-size:13px;font-weight:700;cursor:pointer">
              ${prog ? '📊 Voir' : '➕ Rejoindre'}
            </button>` : ''}
          </div>
        </div>`;
        }).join('');
    },

    // T80 — Défi direct entre amis
    async challengeFriend(friendId, friendName, challengeType = 'sessions_count') {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id,display_name').eq('auth_id', user.id).single();
            await supabase.from('friend_challenges').insert({
                challenger_id: member.id,
                challenged_id: friendId,
                challenge_type: challengeType,
                starts_at: new Date().toISOString(),
                ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
                status: 'pending'
            });
            // Notif push
            await supabase.from('notifications').insert({ user_id: friendId, type: 'challenge', message: `${member.display_name || 'Un surfeur'} te challenge ! 🤙` });
            if (typeof showToast !== 'undefined') showToast(`🤙 Défi envoyé à ${friendName} !`, 'success');
        } catch { if (typeof showToast !== 'undefined') showToast('Erreur envoi défi', 'error'); }
    },

    // T81 — Rejoindre un défi communautaire
    async joinChallenge(challengeId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { window.location.href = '/index.html'; return; }
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            await supabase.from('user_challenges').upsert({ user_id: member.id, challenge_id: challengeId, progress: 0, completed: false, joined_at: new Date().toISOString() }, { onConflict: 'user_id,challenge_id' });
            // Incrémenter participants
            await supabase.rpc('increment_challenge_participants', { cid: challengeId });
            if (typeof showToast !== 'undefined') showToast('✅ Défi rejoint ! On compte sur toi 🤙', 'success');
            this.loadChallenges();
        } catch { if (typeof showToast !== 'undefined') showToast('Erreur', 'error'); }
    },

    // Feed des résultats (T83)
    async loadResultsFeed(containerId = 'challenges-feed') {
        const el = document.getElementById(containerId);
        if (!el) return;
        try {
            const { data } = await supabase
                .from('user_challenges')
                .select('challenge_id, user:members(username, display_name, avatar_url), completed_at')
                .eq('completed', true)
                .order('completed_at', { ascending: false })
                .limit(10);
            if (!data?.length) { el.innerHTML = '<div class="empty-state"><div>🏅</div><h3>Sois le premier !</h3></div>'; return; }
            el.innerHTML = data.map(r => {
                const ch = this.challenges.find(c => c.id === r.challenge_id);
                return `<div style="display:flex;gap:10px;padding:10px;border-bottom:1px solid rgba(255,255,255,.05)">
          <img src="${r.user?.avatar_url || '/assets/images/default-avatar.png'}" width="32" height="32" style="border-radius:50%" alt="">
          <div>
            <div style="font-size:13px;color:#f1f5f9"><strong>${r.user?.display_name || r.user?.username}</strong> a accompli <strong>${ch?.emoji || '🏅'} ${ch?.title || 'un défi'}</strong></div>
            <div style="font-size:11px;color:#64748b">${new Date(r.completed_at).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>`;
            }).join('');
        } catch { }
    }
};

window.SocialChallenges = SocialChallenges;
