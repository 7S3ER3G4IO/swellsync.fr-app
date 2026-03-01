/**
 * SwellSync — Mentions, réactions et fonctions communauté avancées (T42/T43/T44/T45/T46)
 * T42: Mention @utilisateur dans les commentaires avec autocomplete
 * T43: GIF dans les commentaires (Tenor/Giphy)
 * T44: Post "Conditions du spot" format spécial avec score houle
 * T45: Réactions multiples sur les posts (🤙🌊🔥🏄)
 * T46: Sondage dans les posts
 */

// ===== T42 — MENTIONS @UTILISATEUR =====
const MentionAutocomplete = {
    _cache: [],
    _activeEl: null,

    init(textareaSelector = 'textarea.mentionable, input.mentionable') {
        document.querySelectorAll(textareaSelector).forEach(el => {
            el.addEventListener('input', (e) => this._onInput(e, el));
            el.addEventListener('keydown', (e) => this._onKeydown(e));
        });
        document.addEventListener('click', () => this._closeDropdown());
    },

    async _onInput(e, el) {
        this._activeEl = el;
        const val = el.value;
        const cursorPos = el.selectionStart;
        const beforeCursor = val.substring(0, cursorPos);
        const match = beforeCursor.match(/@(\w*)$/);
        if (!match) { this._closeDropdown(); return; }
        const query = match[1];
        if (query.length < 1) { this._closeDropdown(); return; }
        await this._showDropdown(query, el);
    },

    async _showDropdown(query, el) {
        // Charger les utilisateurs depuis Supabase
        if (query.length >= 2) {
            const { data } = await supabase.from('members').select('id, username, display_name, avatar_url').ilike('username', `${query}%`).limit(6);
            this._cache = data || [];
        }
        if (!this._cache.length) { this._closeDropdown(); return; }
        let dropdown = document.getElementById('mention-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'mention-dropdown';
            dropdown.style.cssText = 'position:absolute;z-index:9999;background:#1e293b;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:6px;min-width:200px;box-shadow:0 10px 30px rgba(0,0,0,.5);max-height:220px;overflow-y:auto';
            document.body.appendChild(dropdown);
        }
        const rect = el.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        dropdown.style.left = rect.left + 'px';
        dropdown.innerHTML = this._cache.map(u => `
      <div class="mention-item" data-username="${u.username}" style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;cursor:pointer;transition:background .15s" onmouseenter="this.style.background='rgba(255,255,255,.06)'" onmouseleave="this.style.background=''" onclick="MentionAutocomplete.insertMention('${u.username}')">
        <img src="${u.avatar_url || '/assets/images/default-avatar.png'}" width="28" height="28" style="border-radius:50%" alt="">
        <div>
          <div style="font-weight:700;font-size:13px;color:#f1f5f9">${u.display_name || u.username}</div>
          <div style="font-size:11px;color:#64748b">@${u.username}</div>
        </div>
      </div>`).join('');
    },

    insertMention(username) {
        if (!this._activeEl) return;
        const val = this._activeEl.value;
        const cursorPos = this._activeEl.selectionStart;
        const beforeCursor = val.substring(0, cursorPos);
        const newBefore = beforeCursor.replace(/@\w*$/, `@${username} `);
        this._activeEl.value = newBefore + val.substring(cursorPos);
        this._activeEl.focus();
        this._closeDropdown();
    },

    _onKeydown(e) { if (e.key === 'Escape') this._closeDropdown(); },
    _closeDropdown() { document.getElementById('mention-dropdown')?.remove(); }
};

// ===== T43 — GIFS DANS COMMENTAIRES =====
const GifPicker = {
    _apiKey: 'public', // Tenor public API

    async open(onSelect) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
        modal.innerHTML = `
      <div style="background:#0f172a;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:18px;width:100%;max-width:400px;max-height:70vh;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <div style="font-weight:700;color:#f1f5f9">🎬 Choisir un GIF</div>
          <button onclick="this.closest('[style]').remove()" style="background:none;border:none;color:#64748b;font-size:20px;cursor:pointer">✕</button>
        </div>
        <input id="gif-search" placeholder="🔍 Chercher..." oninput="GifPicker.search(this.value)"
          style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px;color:#f1f5f9;font-size:14px;outline:none;margin-bottom:12px">
        <div id="gif-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;overflow-y:auto;flex:1"></div>
      </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
        this._onSelect = onSelect;
        this._modal = modal;
        await this.search('surf');
    },

    async search(q) {
        const grid = document.getElementById('gif-grid');
        if (!grid) return;
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#64748b">⏳ Chargement...</div>';
        try {
            const res = await fetch(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q || 'surf')}&key=${this._apiKey}&limit=18&media_filter=gif`);
            const data = await res.json();
            if (!data.results?.length) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#64748b">Aucun résultat</div>'; return; }
            grid.innerHTML = data.results.map(r => {
                const url = r.media_formats?.gif?.url || r.media_formats?.tinygif?.url;
                const preview = r.media_formats?.tinygif?.url || url;
                return `<img src="${preview}" loading="lazy" style="width:100%;border-radius:8px;cursor:pointer;aspect-ratio:1;object-fit:cover" onclick="GifPicker._select('${url}','${r.title}')" alt="${r.title}">`;
            }).join('');
        } catch { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#ef4444">Erreur réseau</div>'; }
    },

    _select(url, title) {
        if (this._onSelect) this._onSelect({ url, title, type: 'gif' });
        this._modal?.remove();
    }
};

// ===== T44 — POST "CONDITIONS DU SPOT" =====
const SpotConditionPost = {
    async create(spotName, conditions = {}) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            const score = conditions.score || Math.round((conditions.height || 1.5) * 2 + (conditions.period || 8) * 0.5);
            const content = `🌊 **${spotName}** — ${new Date().toLocaleDateString('fr-FR')}\n\nHoule: ${conditions.height || '?'}m · Période: ${conditions.period || '?'}s · Vent: ${conditions.wind || '?'} km/h\n\nScore: ${Math.min(10, score)}/10 ${score >= 8 ? '🔥' : score >= 6 ? '👌' : score >= 4 ? '😐' : '😴'}`;
            await supabase.from('posts').insert({ user_id: member.id, content, type: 'conditions', spot_name: spotName, conditions_data: conditions, created_at: new Date().toISOString() });
            if (typeof showToast !== 'undefined') showToast('🌊 Conditions partagées !', 'success');
        } catch { if (typeof showToast !== 'undefined') showToast('Erreur', 'error'); }
    }
};

// ===== T45 — RÉACTIONS MULTIPLES =====
const PostReactions = {
    emojis: ['🤙', '🌊', '🔥', '🏄', '😎', '💪'],

    async toggle(postId, emoji) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: member } = await supabase.from('members').select('id').eq('auth_id', user.id).single();
            const { data: existing } = await supabase.from('post_reactions').select('id').eq('post_id', postId).eq('user_id', member.id).eq('emoji', emoji).single();
            if (existing) { await supabase.from('post_reactions').delete().eq('id', existing.id); }
            else { await supabase.from('post_reactions').insert({ post_id: postId, user_id: member.id, emoji }); }
            this.refresh(postId);
        } catch { }
    },

    async refresh(postId) {
        const el = document.getElementById(`reactions-${postId}`);
        if (!el) return;
        const { data } = await supabase.from('post_reactions').select('emoji').eq('post_id', postId);
        const counts = {};
        data?.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
        el.innerHTML = this.emojis.filter(e => counts[e]).map(e => `
      <button onclick="PostReactions.toggle('${postId}','${e}')" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:4px 10px;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:4px">
        ${e} <span style="font-size:12px;color:#64748b">${counts[e]}</span>
      </button>`).join('') +
            `<button onclick="PostReactions.showPicker('${postId}')" style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:20px;padding:4px 6px;font-size:14px;cursor:pointer">+ Réagir</button>`;
    },

    showPicker(postId) {
        const existing = document.getElementById('reaction-picker');
        if (existing) existing.remove();
        const picker = document.createElement('div');
        picker.id = 'reaction-picker';
        picker.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1e293b;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:10px;display:flex;gap:6px;z-index:9999;box-shadow:0 10px 30px rgba(0,0,0,.4)';
        picker.innerHTML = this.emojis.map(e => `<button onclick="PostReactions.toggle('${postId}','${e}');this.closest('#reaction-picker').remove()" style="background:none;border:none;font-size:26px;cursor:pointer;padding:4px;border-radius:10px" onmouseenter="this.style.background='rgba(255,255,255,.08)'" onmouseleave="this.style.background=''">${e}</button>`).join('');
        document.body.appendChild(picker);
        setTimeout(() => picker.remove(), 5000);
    }
};

// ===== T46 — SONDAGES DANS LES POSTS =====
const PostPoll = {
    async create(question, options = [], userId) {
        const data = { question, options: options.map(o => ({ text: o, votes: [] })) };
        const { data: post } = await supabase.from('posts').insert({ user_id: userId, content: `📊 **${question}**`, type: 'poll', poll_data: data, created_at: new Date().toISOString() }).select().single();
        return post;
    },

    async vote(postId, optionIndex) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: post } = await supabase.from('posts').select('poll_data').eq('id', postId).single();
            const poll = post.poll_data;
            // Enlever le vote précédent de l'user sur toutes les options
            poll.options.forEach(o => { o.votes = o.votes.filter(v => v !== user.id); });
            // Ajouter le nouveau vote
            poll.options[optionIndex].votes.push(user.id);
            await supabase.from('posts').update({ poll_data: poll }).eq('id', postId);
            this.render(postId, poll);
        } catch { }
    },

    render(postId, poll) {
        const el = document.getElementById(`poll-${postId}`);
        if (!el || !poll) return;
        const total = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
        el.innerHTML = `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:14px;padding:14px">
        <div style="font-weight:700;color:#f1f5f9;margin-bottom:12px">📊 ${poll.question}</div>
        ${poll.options.map((o, i) => {
            const pct = total ? Math.round(o.votes.length / total * 100) : 0;
            return `<div onclick="PostPoll.vote('${postId}',${i})" style="margin-bottom:8px;cursor:pointer">
            <div style="display:flex;justify-content:space-between;font-size:13px;color:#f1f5f9;margin-bottom:4px">
              <span>${o.text}</span><span style="color:#64748b">${pct}%</span>
            </div>
            <div style="background:rgba(255,255,255,.05);border-radius:8px;height:8px;overflow:hidden">
              <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#0ea5e9,#0284c7);border-radius:8px;transition:width .5s"></div>
            </div>
          </div>`;
        }).join('')}
        <div style="font-size:11px;color:#64748b;margin-top:8px">${total} vote${total > 1 ? 's' : ''}</div>
      </div>`;
    }
};

window.MentionAutocomplete = MentionAutocomplete;
window.GifPicker = GifPicker;
window.SpotConditionPost = SpotConditionPost;
window.PostReactions = PostReactions;
window.PostPoll = PostPoll;
