/**
 * SwellSync — Réactions sur les posts (T45)
 * 🤙🌊🔥🏄 au lieu de juste like
 * + Sondage dans les posts (T46)
 * + Partage de post dans les messages (T49)
 */

const REACTIONS = ['🤙', '🌊', '🔥', '🏄', '😍', '💪'];

const PostReactions = {

    // Ajouter le picker de réaction sur un post
    attachReactionPicker(postEl, postId) {
        const existingBtn = postEl.querySelector('[data-like-btn]');
        if (!existingBtn) return;

        // Remplacer le bouton like par le picker
        const pickerBtn = document.createElement('button');
        pickerBtn.type = 'button';
        pickerBtn.setAttribute('data-reaction-btn', postId);
        pickerBtn.style.cssText = 'background:none;border:none;color:#64748b;font-size:13px;cursor:pointer;padding:6px 10px;border-radius:10px;display:flex;align-items:center;gap:4px';
        pickerBtn.innerHTML = '🤙 <span id="reaction-count-' + postId + '">J\'aime</span>';

        // Picker expandable
        const picker = document.createElement('div');
        picker.id = 'reaction-picker-' + postId;
        picker.style.cssText = 'display:none;position:absolute;background:#1e293b;border:1px solid rgba(255,255,255,.1);border-radius:50px;padding:6px 12px;gap:6px;bottom:calc(100% + 8px);left:0;z-index:100;flex-direction:row;box-shadow:0 8px 32px rgba(0,0,0,.4)';

        REACTIONS.forEach(emoji => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = emoji;
            btn.style.cssText = 'background:none;border:none;font-size:22px;cursor:pointer;padding:4px;border-radius:8px;transition:transform .1s';
            btn.onmouseover = () => btn.style.transform = 'scale(1.3)';
            btn.onmouseout = () => btn.style.transform = 'scale(1)';
            btn.onclick = () => { PostReactions.react(postId, emoji); picker.style.display = 'none'; };
            picker.appendChild(btn);
        });

        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';

        // Long press sur mobile pour ouvrir le picker
        let pressTimer;
        pickerBtn.addEventListener('touchstart', () => { pressTimer = setTimeout(() => { picker.style.display = 'flex'; }, 400); });
        pickerBtn.addEventListener('touchend', () => { clearTimeout(pressTimer); });
        pickerBtn.addEventListener('click', () => { PostReactions.react(postId, '🤙'); });

        // Desktop: hover pour ouvrir
        pickerBtn.addEventListener('mouseenter', () => { pressTimer = setTimeout(() => picker.style.display = 'flex', 300); });
        wrapper.addEventListener('mouseleave', () => { clearTimeout(pressTimer); picker.style.display = 'none'; });

        document.addEventListener('click', e => { if (!wrapper.contains(e.target)) picker.style.display = 'none'; });

        wrapper.appendChild(pickerBtn);
        wrapper.appendChild(picker);
        existingBtn.replaceWith(wrapper);

        // Charger les réactions existantes
        PostReactions.loadReactions(postId);
    },

    // Réagir à un post
    async react(postId, emoji) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { if (typeof showToast !== 'undefined') showToast('Connecte-toi pour réagir', 'info'); return; }

            // Upsert la réaction (ou la supprimer si même emoji)
            const { data: existing } = await supabase.from('post_reactions').select('id,emoji').eq('post_id', postId).eq('user_id', user.id).single();

            if (existing?.emoji === emoji) {
                await supabase.from('post_reactions').delete().eq('id', existing.id);
            } else if (existing) {
                await supabase.from('post_reactions').update({ emoji }).eq('id', existing.id);
            } else {
                await supabase.from('post_reactions').insert({ post_id: postId, user_id: user.id, emoji });
            }

            PostReactions.loadReactions(postId);
        } catch (e) { console.warn('Reaction error:', e); }
    },

    // Charger et afficher les réactions d'un post
    async loadReactions(postId) {
        try {
            const { data: reactions } = await supabase.from('post_reactions').select('emoji').eq('post_id', postId);
            if (!reactions?.length) return;

            const counts = {};
            reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
            const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
            const total = reactions.length;

            const countEl = document.getElementById('reaction-count-' + postId);
            if (countEl) {
                countEl.textContent = top.map(([e, c]) => e + (c > 1 ? ' ' + c : '')).join(' ') + (total > 1 ? '  ' + total : '');
            }
        } catch { }
    }
};

// ══════════════════════════════════════════════════
// T46 — Sondage dans les posts
// ══════════════════════════════════════════════════
const PostPoll = {

    // Créer le HTML d'un sondage
    renderPoll(pollData, postId) {
        if (!pollData?.options?.length) return '';
        const total = pollData.options.reduce((s, o) => s + (o.votes || 0), 0);
        return `
      <div class="post-poll" style="margin-top:12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden">
        ${pollData.options.map((opt, i) => {
            const pct = total ? Math.round((opt.votes || 0) / total * 100) : 0;
            return `<button type="button" onclick="PostPoll.vote('${postId}', ${i})"
            style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:none;border-top:${i > 0 ? '1px solid rgba(255,255,255,.06)' : 'none'};padding:12px 14px;cursor:pointer;position:relative;overflow:hidden;text-align:left">
            <div style="position:absolute;inset:0;background:rgba(14,165,233,.12);width:${pct}%;transition:width .5s ease"></div>
            <span style="position:relative;flex:1;color:#f1f5f9;font-size:14px">${opt.text}</span>
            <span style="position:relative;color:#0ea5e9;font-weight:700;font-size:13px">${pct}%</span>
          </button>`;
        }).join('')}
        <div style="padding:8px 14px;background:rgba(255,255,255,.02);font-size:12px;color:#64748b">${total} vote${total > 1 ? 's' : ''}</div>
      </div>`;
    },

    async vote(postId, optionIndex) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { if (typeof showToast !== 'undefined') showToast('Connecte-toi pour voter', 'info'); return; }
            await supabase.from('poll_votes').upsert({ post_id: postId, user_id: user.id, option_index: optionIndex }, { onConflict: 'post_id,user_id' });
            if (typeof showToast !== 'undefined') showToast('✅ Vote enregistré !', 'success');
        } catch { }
    }
};

window.PostReactions = PostReactions;
window.PostPoll = PostPoll;
