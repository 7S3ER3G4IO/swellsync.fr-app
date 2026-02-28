/**
 * SwellSync — Recherche avancée (T63/T64/T65/T67/T69/T70)
 * Onglets Surfeurs | Spots | Posts
 * Historique local, suggestions géo, filtre "Actif cette semaine"
 */

const SearchAdvanced = {
    _searchTimeout: null,
    _currentTab: 'surfers',

    // T63 — Onglets dans la recherche
    renderTabs(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const tabs = [
            { id: 'surfers', label: '🏄 Surfeurs' },
            { id: 'spots', label: '📍 Spots' },
            { id: 'posts', label: '📝 Posts' }
        ];
        container.innerHTML = `
      <div style="display:flex;gap:6px;padding:0 4px;margin-bottom:16px">
        ${tabs.map(t => `
          <button type="button" id="tab-${t.id}" onclick="SearchAdvanced.switchTab('${t.id}')"
            style="flex:1;padding:10px;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;
                   background:${this._currentTab === t.id ? 'rgba(14,165,233,.15)' : 'rgba(255,255,255,.04)'};
                   border:1px solid ${this._currentTab === t.id ? 'rgba(14,165,233,.3)' : 'rgba(255,255,255,.06)'};
                   color:${this._currentTab === t.id ? '#0ea5e9' : '#64748b'}">
            ${t.label}
          </button>`).join('')}
      </div>
      <div id="search-results"></div>`;
    },

    switchTab(tab) {
        this._currentTab = tab;
        document.querySelectorAll('[id^="tab-"]').forEach(btn => {
            const active = btn.id === 'tab-' + tab;
            btn.style.background = active ? 'rgba(14,165,233,.15)' : 'rgba(255,255,255,.04)';
            btn.style.borderColor = active ? 'rgba(14,165,233,.3)' : 'rgba(255,255,255,.06)';
            btn.style.color = active ? '#0ea5e9' : '#64748b';
        });
        const q = document.getElementById('search-input')?.value?.trim();
        if (q) this.search(q);
    },

    // Recherche avec debounce
    onInput(value) {
        clearTimeout(this._searchTimeout);
        if (!value.trim()) { this._showRecent(); return; }
        this._searchTimeout = setTimeout(() => this.search(value.trim()), 300);
    },

    async search(query) {
        const resultsEl = document.getElementById('search-results');
        if (!resultsEl) return;
        resultsEl.innerHTML = '<div class="skeleton" style="height:60px;border-radius:14px;margin-bottom:8px"></div><div class="skeleton" style="height:60px;border-radius:14px"></div>';

        // T64 — Sauvegarder dans l'historique
        this._saveRecent(query);

        try {
            switch (this._currentTab) {
                case 'surfers': await this._searchSurfers(query, resultsEl); break;
                case 'spots': await this._searchSpots(query, resultsEl); break;
                case 'posts': await this._searchPosts(query, resultsEl); break;
            }
        } catch { resultsEl.innerHTML = '<div class="empty-state"><div>🔍</div><h3>Erreur de recherche</h3></div>'; }
    },

    async _searchSurfers(q, el) {
        const { data } = await supabase.from('members').select('id,username,display_name,avatar_url,level,surf_score,last_session_at').or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).limit(15);
        if (!data?.length) { el.innerHTML = '<div class="empty-state"><div>🏄</div><h3>Aucun surfeur trouvé</h3></div>'; return; }
        // T69: filtre actif cette semaine
        const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        el.innerHTML = data.map(u => {
            const active = u.last_session_at > oneWeekAgo;
            return `<a href="/pages/profile.html?id=${u.id}" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;margin-bottom:8px;text-decoration:none">
        <img src="${u.avatar_url || '/assets/images/default-avatar.png'}" width="40" height="40" style="border-radius:50%;object-fit:cover" alt="${u.display_name || u.username}">
        <div style="flex:1">
          <div style="font-weight:600;color:#f1f5f9;font-size:14px">${u.display_name || u.username}</div>
          <div style="color:#64748b;font-size:12px">@${u.username}${u.level ? ' · ' + u.level : ''}</div>
        </div>
        ${active ? '<span style="background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);border-radius:8px;padding:3px 8px;color:#10b981;font-size:11px;font-weight:600">Actif</span>' : ''}
      </a>`;
        }).join('');
    },

    async _searchSpots(q, el) {
        const { data } = await supabase.from('spots').select('id,name,type,level,region,current_score').or(`name.ilike.%${q}%,region.ilike.%${q}%`).limit(12);
        if (!data?.length) { el.innerHTML = '<div class="empty-state"><div>📍</div><h3>Aucun spot trouvé</h3></div>'; return; }
        const scoreColor = s => s > 70 ? '#10b981' : s > 40 ? '#f59e0b' : '#ef4444';
        el.innerHTML = data.map(s => `
      <a href="/pages/spot_detail.html?id=${s.id}" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;margin-bottom:8px;text-decoration:none">
        <div style="font-size:28px">${s.type === 'reef' ? '🪸' : s.type === 'point_break' ? '🏔️' : '🏖️'}</div>
        <div style="flex:1">
          <div style="font-weight:600;color:#f1f5f9;font-size:14px">${s.name}</div>
          <div style="color:#64748b;font-size:12px">${s.region || ''} · ${s.level || 'Tous niveaux'}</div>
        </div>
        ${s.current_score ? `<span style="color:${scoreColor(s.current_score)};font-weight:700">${s.current_score}</span>` : ''}
      </a>`).join('');
    },

    async _searchPosts(q, el) {
        const { data } = await supabase.from('posts').select('id,content,created_at,author:members(username,avatar_url)').ilike('content', `%${q}%`).order('created_at', { ascending: false }).limit(10);
        if (!data?.length) { el.innerHTML = '<div class="empty-state"><div>📝</div><h3>Aucun post trouvé</h3></div>'; return; }
        el.innerHTML = data.map(p => `
      <a href="/pages/community.html?post=${p.id}" style="display:flex;gap:10px;padding:12px 14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;margin-bottom:8px;text-decoration:none">
        <img src="${p.author?.avatar_url || '/assets/images/default-avatar.png'}" width="34" height="34" style="border-radius:50%;flex-shrink:0" alt="">
        <div>
          <div style="font-size:12px;color:#0ea5e9;margin-bottom:4px">@${p.author?.username || '?'}</div>
          <div style="color:#94a3b8;font-size:13px;line-height:1.5">${p.content?.substring(0, 100) || ''}${p.content?.length > 100 ? '…' : ''}</div>
        </div>
      </a>`).join('');
    },

    // T64 — Historique local des recherches récentes
    _saveRecent(query) {
        let history = JSON.parse(localStorage.getItem('sw_search_history') || '[]');
        history = [query, ...history.filter(q => q !== query)].slice(0, 8);
        localStorage.setItem('sw_search_history', JSON.stringify(history));
    },

    _showRecent() {
        const el = document.getElementById('search-results');
        if (!el) return;
        const history = JSON.parse(localStorage.getItem('sw_search_history') || '[]');
        if (!history.length) {
            el.innerHTML = '<div class="empty-state"><div>🔍</div><h3>Lance une recherche</h3><p>Surfeurs, spots ou posts</p></div>';
            return;
        }
        el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:13px;color:#64748b;font-weight:600">Recherches récentes</div>
        <button type="button" onclick="localStorage.removeItem('sw_search_history');SearchAdvanced._showRecent()" style="background:none;border:none;color:#ef4444;font-size:12px;cursor:pointer">Effacer</button>
      </div>
      ${history.map(q => `<button type="button" onclick="document.getElementById('search-input').value='${q.replace(/'/g, "\\'")}';SearchAdvanced.search('${q.replace(/'/g, "\\'")}');" style="display:flex;align-items:center;gap:10px;width:100%;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.04);border-radius:12px;padding:10px 14px;color:#94a3b8;font-size:14px;cursor:pointer;margin-bottom:6px">🕐 ${q}</button>`).join('')}`;
    }
};

window.SearchAdvanced = SearchAdvanced;
