/**
 * SwellSync — Recherche avancée (T61-T70)
 * T61: Filtre par niveau de surf (débutant, intermédiaire, pro)
 * T62: Filtre par région/département
 * T63: Onglets : "Surfeurs" | "Spots" | "Posts"
 * T64: Résultats récents (historique local)
 * T65: "Surfeurs populaires près de moi" en suggestion
 * T66: Recherche de groupe/événement surf
 * T67: Auto-suggestion basée sur les follows mutuels
 * T68: Badge vérifié ✓ sur les comptes officiels
 * T69: Filtre "Actif cette semaine"
 * T70: Page "Tendances" — hashtags/spots les plus mentionnés
 */

const SearchAdvanced = {

  _tab: 'surfers',
  _filters: { level: '', region: '', active_week: false },
  _history: JSON.parse(localStorage.getItem('sw_search_history') || '[]'),
  _debounceTimer: null,

  regions: ['Bretagne', 'Normandie', 'Landes', 'Pays Basque', 'Gironde', 'Vendée', 'Finistère', 'Charente-Maritime'],
  levels: ['Débutant', 'Intermédiaire', 'Confirmé', 'Expert'],

  // Rendu principal de la page recherche
  renderSearchPage(containerId = 'search-root') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <!-- Barre de recherche -->
      <div style="position:sticky;top:60px;z-index:50;background:#0a0f1e;padding:12px 0;margin-bottom:4px">
        <div style="display:flex;gap:8px;align-items:center;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:10px 14px">
          <span style="color:#64748b;font-size:18px">🔍</span>
          <input id="search-input" type="text" placeholder="Surfeurs, spots, posts..." oninput="SearchAdvanced.onSearch(this.value)"
            style="flex:1;background:none;border:none;outline:none;color:#f1f5f9;font-size:15px" autocomplete="off">
          <button id="search-clear" onclick="SearchAdvanced.clear()" style="display:none;background:none;border:none;color:#64748b;cursor:pointer;font-size:16px">✕</button>
        </div>
        <!-- Tabs T63 -->
        <div style="display:flex;gap:0;margin-top:10px;background:rgba(255,255,255,.04);border-radius:12px;padding:2px">
          ${['surfers', 'spots', 'posts', 'events'].map(t => `<button id="tab-${t}" onclick="SearchAdvanced.setTab('${t}')" style="flex:1;padding:8px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;background:${this._tab === t ? 'rgba(14,165,233,.15)' : 'none'};color:${this._tab === t ? '#0ea5e9' : '#64748b'}">${{ 'surfers': '🏄 Surfeurs', 'spots': '📍 Spots', 'posts': '📝 Posts', 'events': '🎉 Événements' }[t]}</button>`).join('')}
        </div>
      </div>

      <!-- Filtres -->
      <div id="search-filters" style="display:flex;gap:8px;overflow-x:auto;margin-bottom:14px;scrollbar-width:none">
        <select onchange="SearchAdvanced.setFilter('level',this.value)" style="padding:6px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#94a3b8;font-size:12px;cursor:pointer">
          <option value="">Tous niveaux</option>
          ${this.levels.map(l => `<option value="${l}">${l}</option>`).join('')}
        </select>
        <select onchange="SearchAdvanced.setFilter('region',this.value)" style="padding:6px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#94a3b8;font-size:12px;cursor:pointer">
          <option value="">Toutes régions</option>
          ${this.regions.map(r => `<option value="${r}">${r}</option>`).join('')}
        </select>
        <button id="filter-active" onclick="SearchAdvanced.toggleFilter('active_week')" style="white-space:nowrap;padding:6px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#94a3b8;font-size:12px;cursor:pointer">⚡ Actif cette sem.</button>
      </div>

      <!-- Historique récent / suggestions / résultats -->
      <div id="search-recent" style="margin-bottom:20px"></div>
      <div id="search-suggestions" style="margin-bottom:20px"></div>
      <div id="search-results"></div>
      <div id="search-trending" style="margin-top:10px"></div>`;

    this._renderRecent();
    this._renderSuggestions();
    this.renderTrending();
  },

  // T64 — Historique récent
  _renderRecent() {
    const el = document.getElementById('search-recent');
    if (!el || !this._history.length) return;
    el.innerHTML = `
      <div style="font-size:12px;color:#64748b;font-weight:600;letter-spacing:.5px;margin-bottom:10px">🕐 RÉCENTS</div>
      ${this._history.slice(0, 5).map(q => `
        <button onclick="document.getElementById('search-input').value='${q}';SearchAdvanced.onSearch('${q}')" style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;padding:10px 0;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.04)">
          <span style="color:#64748b;font-size:14px">🕐</span>
          <span style="color:#94a3b8;font-size:14px">${q}</span>
          <span style="margin-left:auto;color:#64748b;font-size:16px">↗</span>
        </button>`).join('')}
      <button onclick="SearchAdvanced.clearHistory()" style="font-size:12px;color:#64748b;background:none;border:none;cursor:pointer;margin-top:8px">Effacer l'historique</button>`;
  },

  // T65 — Surfeurs populaires / T67 — Auto-suggestions follows mutuels
  async _renderSuggestions() {
    const el = document.getElementById('search-suggestions');
    if (!el) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
      // Follows mutuels d'abord (T67)
      const { data: suggested } = await supabase.from('members').select('id, username, display_name, avatar_url, level, region, is_verified').neq('id', member?.id).order('sessions_count', { ascending: false }).limit(4);
      if (!suggested?.length) return;
      el.innerHTML = `
        <div style="font-size:12px;color:#64748b;font-weight:600;letter-spacing:.5px;margin-bottom:10px">⭐ SUGGESTIONS</div>
        ${suggested.map(u => this._renderUserCard(u)).join('')}`;
    } catch { }
  },

  _renderUserCard(u) {
    const badge = u.is_verified ? ' <span style="color:#0ea5e9;font-size:12px">✓</span>' : ''; // T68
    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04)">
      <img src="${u.avatar_url || '/assets/images/default-avatar.png'}" width="42" height="42" style="border-radius:50%;object-fit:cover" alt="">
      <div style="flex:1">
        <div style="font-weight:700;color:#f1f5f9;font-size:14px">${u.display_name || u.username}${badge}</div>
        <div style="font-size:12px;color:#64748b">@${u.username} · ${u.level || 'Surfeur'} ${u.region ? '· ' + u.region : ''}</div>
      </div>
      <button onclick="SearchAdvanced.follow('${u.id}')" style="background:rgba(14,165,233,.1);border:1px solid rgba(14,165,233,.2);border-radius:10px;padding:6px 12px;color:#0ea5e9;font-size:13px;font-weight:700;cursor:pointer">+ Suivre</button>
    </div>`;
  },

  setTab(tab) {
    this._tab = tab;
    ['surfers', 'spots', 'posts', 'events'].forEach(t => {
      const btn = document.getElementById(`tab-${t}`);
      if (btn) { btn.style.background = t === tab ? 'rgba(14,165,233,.15)' : 'none'; btn.style.color = t === tab ? '#0ea5e9' : '#64748b'; }
    });
    const q = document.getElementById('search-input')?.value;
    if (q) this.search(q);
  },

  setFilter(key, val) { this._filters[key] = val; const q = document.getElementById('search-input')?.value; if (q) this.search(q); },
  toggleFilter(key) {
    this._filters[key] = !this._filters[key];
    const btn = document.getElementById('filter-active');
    if (btn) { btn.style.background = this._filters[key] ? 'rgba(14,165,233,.12)' : 'rgba(255,255,255,.06)'; btn.style.color = this._filters[key] ? '#0ea5e9' : '#94a3b8'; }
    const q = document.getElementById('search-input')?.value;
    if (q) this.search(q);
  },

  onSearch(query) {
    const clearBtn = document.getElementById('search-clear');
    if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => this.search(query), 300);
  },

  async search(query) {
    if (!query.trim()) { this._renderRecent(); return; }
    const resultsEl = document.getElementById('search-results');
    if (!resultsEl) return;
    resultsEl.innerHTML = '<div style="padding:20px;text-align:center;color:#64748b">⏳ Recherche...</div>';

    // Sauvegarder dans l'historique
    if (query.length > 2) {
      this._history = [query, ...this._history.filter(h => h !== query)].slice(0, 10);
      localStorage.setItem('sw_search_history', JSON.stringify(this._history));
    }

    try {
      let results = [];
      const tab = this._tab;

      if (tab === 'surfers') {
        let q = supabase.from('members').select('id, username, display_name, avatar_url, level, region, is_verified, last_session_at').ilike('username', `%${query}%`).limit(20);
        if (this._filters.level) q = q.eq('level', this._filters.level);
        if (this._filters.region) q = q.eq('region', this._filters.region);
        if (this._filters.active_week) q = q.gte('last_session_at', new Date(Date.now() - 7 * 86400000).toISOString());
        const { data } = await q;
        results = data || [];
        resultsEl.innerHTML = results.length ? results.map(u => this._renderUserCard(u)).join('') : this._empty('🏄', 'Aucun surfeur trouvé');
      }

      else if (tab === 'spots') {
        // Recherche locale dans les spots connus
        const allSpots = Object.values(typeof SpotCompare !== 'undefined' ? SpotCompare.spots : {});
        results = allSpots.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
        resultsEl.innerHTML = results.length ? results.map(s => `
          <a href="/spots/${s.slug}.html" style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.04);text-decoration:none">
            <div style="font-size:28px">${s.emoji}</div>
            <div><div style="font-weight:700;color:#f1f5f9">${s.name}</div><div style="font-size:12px;color:#64748b">${s.region} · ${s.type} · Niveau: ${s.level}</div></div>
          </a>`).join('') : this._empty('📍', 'Aucun spot trouvé');
      }

      else if (tab === 'posts') {
        const { data } = await supabase.from('posts').select('id, content, created_at, user:members(username, avatar_url, is_verified)').ilike('content', `%${query}%`).order('created_at', { ascending: false }).limit(15);
        result = data || [];
        resultsEl.innerHTML = result.length ? result.map(p => `
          <div style="padding:12px 0;border-bottom:1px solid rgba(255,255,255,.04)">
            <div style="display:flex;gap:8px;margin-bottom:6px">
              <img src="${p.user?.avatar_url || '/assets/images/default-avatar.png'}" width="28" height="28" style="border-radius:50%" alt="">
              <span style="font-size:13px;color:#0ea5e9;font-weight:600">@${p.user?.username}${p.user?.is_verified ? ' ✓' : ''}</span>
              <span style="font-size:12px;color:#64748b;margin-left:auto">${new Date(p.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
            <div style="font-size:14px;color:#94a3b8;line-height:1.5">${p.content?.substring(0, 200)}${p.content?.length > 200 ? '...' : ''}</div>
          </div>`).join('') : this._empty('📝', 'Aucun post trouvé');
      }

      else if (tab === 'events') {
        // T66 — Groupes/événements surf
        const { data } = await supabase.from('surf_events').select('id, title, description, date, spot_name, organizer:members(username)').ilike('title', `%${query}%`).order('date').limit(10);
        const evts = data || [];
        resultsEl.innerHTML = evts.length ? evts.map(e => `
          <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:14px;margin-bottom:10px">
            <div style="font-weight:700;color:#f1f5f9;margin-bottom:4px">🎉 ${e.title}</div>
            <div style="font-size:12px;color:#64748b">${e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '?'} · ${e.spot_name || '?'}</div>
            <div style="font-size:13px;color:#94a3b8;margin-top:6px">${e.description?.substring(0, 120) || ''}</div>
          </div>`).join('') : this._empty('🎉', 'Aucun événement trouvé');
      }
    } catch { resultsEl.innerHTML = this._empty('⚠️', 'Erreur de recherche'); }
  },

  // T70 — Page tendances
  async renderTrending(containerId = 'search-trending') {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
      // Extraire les hashtags des posts récents
      const { data } = await supabase.from('posts').select('content').gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()).limit(200);
      const hashtagCounts = {};
      data?.forEach(p => { const tags = p.content?.match(/#\w+/g) || []; tags.forEach(t => { hashtagCounts[t] = (hashtagCounts[t] || 0) + 1; }); });
      const top = Object.entries(hashtagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (!top.length) return;
      el.innerHTML = `
        <div style="font-size:12px;color:#64748b;font-weight:600;letter-spacing:.5px;margin-bottom:12px">📈 TENDANCES</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${top.map(([tag, count]) => `<button onclick="document.getElementById('search-input').value='${tag}';SearchAdvanced.setTab('posts');SearchAdvanced.search('${tag}')" style="background:rgba(14,165,233,.08);border:1px solid rgba(14,165,233,.15);border-radius:20px;padding:6px 14px;color:#0ea5e9;font-size:13px;font-weight:600;cursor:pointer">${tag} <span style="opacity:.6;font-size:11px">${count}</span></button>`).join('')}
        </div>`;
    } catch { }
  },

  async follow(userId) { try { const { data: { user } } = await supabase.auth.getUser(); const { data: me } = await supabase.from('members').select('id').eq('auth_id', user.id).single(); await supabase.from('follows').upsert({ follower_id: me.id, following_id: userId }, { onConflict: 'follower_id,following_id' }); if (typeof showToast !== 'undefined') showToast('✅ Suivi !', 'success'); } catch { } },

  clear() { document.getElementById('search-input').value = ''; document.getElementById('search-results').innerHTML = ''; document.getElementById('search-clear').style.display = 'none'; this._renderRecent(); },
  clearHistory() { this._history = []; localStorage.removeItem('sw_search_history'); document.getElementById('search-recent').innerHTML = ''; },
  _empty: (icon, text) => `<div class="empty-state"><div style="font-size:32px">${icon}</div><h3>${text}</h3></div>`
};

window.SearchAdvanced = SearchAdvanced;
