/**
 * SwellSync — Tabs feed community (T48)
 * T48: Pour toi | Abonnements | Spots | Trending
 * T44: Post de type "Conditions du spot" (format spécial avec score houle)
 * T47: Post épinglé en haut du feed
 * T50: Masquer/ignorer un utilisateur
 */

const CommunityFeed = {
    _currentTab: 'pour-toi',
    _hiddenUsers: JSON.parse(localStorage.getItem('sw_hidden_users') || '[]'),

    // T48 — Rendre les onglets du feed
    renderTabs(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const tabs = [
            { id: 'pour-toi', label: '✨ Pour toi' },
            { id: 'abonnements', label: '👥 Abonnements' },
            { id: 'spots', label: '📍 Spots' },
            { id: 'trending', label: '🔥 Trending' },
        ];
        container.innerHTML = `
      <div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none;-webkit-overflow-scrolling:touch" id="feed-tabs-bar">
        ${tabs.map(t => `
          <button type="button" id="feed-tab-${t.id}" onclick="CommunityFeed.switchTab('${t.id}')"
            style="white-space:nowrap;padding:9px 16px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;flex-shrink:0;
                   background:${this._currentTab === t.id ? 'rgba(14,165,233,.15)' : 'rgba(255,255,255,.04)'};
                   border:1px solid ${this._currentTab === t.id ? 'rgba(14,165,233,.3)' : 'rgba(255,255,255,.06)'};
                   color:${this._currentTab === t.id ? '#0ea5e9' : '#64748b'}">
            ${t.label}
          </button>`).join('')}
      </div>`;
    },

    switchTab(tab) {
        this._currentTab = tab;
        document.querySelectorAll('[id^="feed-tab-"]').forEach(btn => {
            const active = btn.id === 'feed-tab-' + tab;
            btn.style.background = active ? 'rgba(14,165,233,.15)' : 'rgba(255,255,255,.04)';
            btn.style.borderColor = active ? 'rgba(14,165,233,.3)' : 'rgba(255,255,255,.06)';
            btn.style.color = active ? '#0ea5e9' : '#64748b';
        });
        this.loadFeed(tab);
    },

    async loadFeed(tab, containerId = 'feed-posts') {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card" style="margin-top:10px"></div>';

        try {
            let query = supabase.from('posts').select(`
        id, content, post_type, score_houle, spot_name, is_pinned, created_at,
        author:members(id, username, display_name, avatar_url, is_pro),
        likes_count, comments_count
      `).order('created_at', { ascending: false }).limit(20);

            const { data: { user } } = await supabase.auth.getUser();

            if (tab === 'abonnements' && user) {
                const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
                const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', member?.id);
                const ids = follows?.map(f => f.following_id) || [];
                if (!ids.length) {
                    el.innerHTML = '<div class="empty-state"><div>👥</div><h3>Suis des surfeurs</h3><p>Abonne-toi à des surfeurs pour voir leur contenu ici.</p></div>';
                    return;
                }
                query = query.in('author_id', ids);
            } else if (tab === 'spots') {
                query = query.eq('post_type', 'conditions');
            } else if (tab === 'trending') {
                query = query.order('likes_count', { ascending: false });
            }

            const { data: posts } = await query;
            if (!posts?.length) { el.innerHTML = '<div class="empty-state"><div>🌊</div><h3>Aucun post</h3><p>Soit le premier à partager !</p></div>'; return; }

            // Filtrer les utilisateurs cachés (T50)
            const filtered = posts.filter(p => !this._hiddenUsers.includes(p.author?.id));

            // T47 — Posts épinglés en premier
            const pinned = filtered.filter(p => p.is_pinned);
            const regular = filtered.filter(p => !p.is_pinned);
            const sorted = [...pinned, ...regular];

            el.innerHTML = sorted.map(p => this._renderPost(p)).join('');
        } catch (e) { console.warn('Feed error:', e); }
    },

    _renderPost(post) {
        const isConditions = post.post_type === 'conditions';
        const scoreColor = s => s > 70 ? '#10b981' : s > 40 ? '#f59e0b' : '#ef4444';
        return `
      <article data-post-id="${post.id}" style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:18px;margin-bottom:12px">
        ${post.is_pinned ? '<div style="font-size:11px;color:#f59e0b;font-weight:600;margin-bottom:10px">📌 POST ÉPINGLÉ</div>' : ''}
        <header style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
          <a href="/u/${post.author?.username}">
            <img src="${post.author?.avatar_url || '/assets/images/default-avatar.png'}" width="38" height="38" style="border-radius:50%;object-fit:cover" alt="${post.author?.display_name || ''}">
          </a>
          <div style="flex:1">
            <div style="font-weight:700;color:#f1f5f9;font-size:14px">
              ${post.author?.display_name || post.author?.username || 'Surfeur'}
              ${post.author?.is_pro ? '<span class="pro-badge" style="font-size:9px;padding:1px 6px;margin-left:4px">PRO</span>' : ''}
            </div>
            <div style="font-size:11px;color:#64748b">${this._timeAgo(post.created_at)}</div>
          </div>
          <button type="button" onclick="CommunityFeed.openPostMenu('${post.id}','${post.author?.id}')" style="background:none;border:none;color:#64748b;font-size:20px;cursor:pointer;padding:4px">⋯</button>
        </header>
        ${isConditions ? `
          <div style="background:${scoreColor(post.score_houle)}11;border:1px solid ${scoreColor(post.score_houle)}33;border-radius:14px;padding:14px;margin-bottom:12px;display:flex;align-items:center;gap:14px">
            <div style="font-size:32px;font-weight:900;color:${scoreColor(post.score_houle)}">${post.score_houle || '—'}</div>
            <div>
              <div style="font-weight:700;color:#f1f5f9;font-size:14px">📍 ${post.spot_name || 'Spot'}</div>
              <div style="font-size:12px;color:#64748b">Conditions actuelles</div>
            </div>
          </div>` : ''}
        <p style="color:#e2e8f0;font-size:15px;line-height:1.7;margin:0 0 14px">${post.content || ''}</p>
        <footer style="display:flex;gap:4px">
          <button type="button" data-like-btn="${post.id}" style="background:none;border:none;color:#64748b;font-size:13px;cursor:pointer;padding:6px 10px;border-radius:10px;display:flex;align-items:center;gap:4px">
            ❤️ ${post.likes_count || 0}
          </button>
          <button type="button" style="background:none;border:none;color:#64748b;font-size:13px;cursor:pointer;padding:6px 10px;border-radius:10px;display:flex;align-items:center;gap:4px">
            💬 ${post.comments_count || 0}
          </button>
          <button type="button" onclick="ShareUtils?.share({title:'Post SwellSync',url:'https://swellsync.fr/pages/community.html?post=${post.id}'})" style="background:none;border:none;color:#64748b;font-size:13px;cursor:pointer;padding:6px 10px;border-radius:10px">📤</button>
        </footer>
      </article>`;
    },

    // T50 — Masquer un utilisateur
    hideUser(userId) {
        if (!this._hiddenUsers.includes(userId)) {
            this._hiddenUsers.push(userId);
            localStorage.setItem('sw_hidden_users', JSON.stringify(this._hiddenUsers));
        }
        document.querySelectorAll(`[data-post-id]`).forEach(el => {
            // Masquer les posts de cet utilisateur
        });
        this.loadFeed(this._currentTab);
        if (typeof showToast !== 'undefined') showToast('Utilisateur masqué. Tu ne verras plus ses posts.', 'info');
    },

    // Menu contextuel d'un post
    openPostMenu(postId, authorId) {
        const existing = document.getElementById('post-menu');
        if (existing) { existing.remove(); return; }
        const menu = document.createElement('div');
        menu.id = 'post-menu';
        menu.style.cssText = 'position:fixed;bottom:80px;right:16px;background:#1e293b;border:1px solid rgba(255,255,255,.1);border-radius:16px;overflow:hidden;z-index:500;min-width:180px;box-shadow:0 8px 32px rgba(0,0,0,.5)';
        menu.innerHTML = [
            `<button type="button" onclick="PostReactions?.attachReactionPicker(document.querySelector('[data-post-id=\\'${postId}\\']'),\\'${postId}\\')" style="display:block;width:100%;background:none;border:none;border-bottom:1px solid rgba(255,255,255,.06);color:#f1f5f9;text-align:left;padding:14px 16px;cursor:pointer;font-size:14px">🤙 Réagir</button>`,
            `<button type="button" onclick="CommunityFeed.hideUser('${authorId}')" style="display:block;width:100%;background:none;border:none;border-bottom:1px solid rgba(255,255,255,.06);color:#f59e0b;text-align:left;padding:14px 16px;cursor:pointer;font-size:14px">👁️ Masquer cet utilisateur</button>`,
            `<button type="button" onclick="this.closest('#post-menu').remove()" style="display:block;width:100%;background:none;border:none;color:#64748b;text-align:left;padding:14px 16px;cursor:pointer;font-size:14px">✕ Fermer</button>`,
        ].join('');
        document.body.appendChild(menu);
        setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 200);
    },

    _timeAgo(iso) {
        if (!iso) return '';
        const diff = (Date.now() - new Date(iso).getTime()) / 1000;
        if (diff < 60) return 'À l\'instant';
        if (diff < 3600) return Math.round(diff / 60) + 'min';
        if (diff < 86400) return Math.round(diff / 3600) + 'h';
        return Math.round(diff / 86400) + 'j';
    }
};

window.CommunityFeed = CommunityFeed;
