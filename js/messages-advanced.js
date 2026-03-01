/**
 * SwellSync — Messages avancés (T51-T60)
 * T51: Indicateur "Lu" ✓✓ sous les messages
 * T52: Message vocal (enregistrement 30s)
 * T53: Partager sa localisation dans un message
 * T54: Répondre à un message (reply avec preview)
 * T55: Supprimer un message
 * T56: Visualisation onde audio message vocal
 * T57: Emoji reactions sur messages (long press)
 * T58: "En train d'écrire..." indicateur (Supabase presence)
 * T59: Recherche dans l'historique de conversation
 * T60: Archiver une conversation
 */

const MessagesAdvanced = {

    // T51 — Marquer messages comme lus
    async markAsRead(conversationId, userId) {
        await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('conversation_id', conversationId).neq('sender_id', userId).is('read_at', null);
    },

    renderReadStatus(message, currentUserId) {
        if (message.sender_id !== currentUserId) return '';
        if (message.read_at) return '<span style="font-size:10px;color:#0ea5e9" title="Lu">✓✓</span>';
        return '<span style="font-size:10px;color:#64748b" title="Envoyé">✓</span>';
    },

    // T52 — Enregistrement vocal
    VoiceRecorder: {
        _mediaRecorder: null,
        _chunks: [],
        _stream: null,

        async start() {
            try {
                this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this._chunks = [];
                this._mediaRecorder = new MediaRecorder(this._stream);
                this._mediaRecorder.ondataavailable = e => this._chunks.push(e.data);
                this._mediaRecorder.start();
                return true;
            } catch { if (typeof showToast !== 'undefined') showToast('Micro non disponible', 'error'); return false; }
        },

        async stop() {
            return new Promise(resolve => {
                this._mediaRecorder.onstop = () => {
                    const blob = new Blob(this._chunks, { type: 'audio/webm' });
                    this._stream?.getTracks().forEach(t => t.stop());
                    resolve(blob);
                };
                this._mediaRecorder.stop();
            });
        },

        async uploadAndSend(conversationId, senderId) {
            const blob = await this.stop();
            if (blob.size === 0) return;
            const filename = `voice_${Date.now()}.webm`;
            const { data, error } = await supabase.storage.from('messages-media').upload(`voice/${filename}`, blob, { contentType: 'audio/webm' });
            if (error) return;
            const { data: { publicUrl } } = supabase.storage.from('messages-media').getPublicUrl(`voice/${filename}`);
            await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: senderId, type: 'voice', voice_url: publicUrl, created_at: new Date().toISOString() });
        },

        // T56 — Visualisation onde audio
        renderWaveform(audioUrl) {
            return `
        <div style="display:flex;align-items:center;gap:10px;background:rgba(14,165,233,.08);border-radius:14px;padding:10px 14px;cursor:pointer" onclick="this.querySelector('audio').play()">
          <div style="font-size:20px">🎙️</div>
          <div style="flex:1;display:flex;align-items:center;gap:2px;height:26px">
            ${Array.from({ length: 20 }, (_, i) => `<div style="flex:1;background:rgba(14,165,233,${0.3 + Math.random() * 0.5});border-radius:2px;height:${20 + Math.random() * 40}%"></div>`).join('')}
          </div>
          <audio src="${audioUrl}" style="display:none"></audio>
          <span style="font-size:11px;color:#64748b">🔊</span>
        </div>`;
        }
    },

    // T53 — Partage de localisation dans un message
    async shareLocation(conversationId, senderId) {
        if (!navigator.geolocation) { if (typeof showToast !== 'undefined') showToast('Géolocalisation non disponible', 'error'); return; }
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
            await supabase.from('messages').insert({
                conversation_id: conversationId, sender_id: senderId, type: 'location',
                content: `📍 Ma position: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                location: { lat: latitude, lng: longitude, maps_url: mapsUrl }, created_at: new Date().toISOString()
            });
        }, () => { if (typeof showToast !== 'undefined') showToast('Erreur position', 'error'); });
    },

    // T54 — Répondre à un message
    _replyTo: null,

    setReplyTo(message) {
        this._replyTo = message;
        const preview = document.getElementById('reply-preview');
        if (!preview) return;
        preview.style.display = 'flex';
        preview.innerHTML = `
      <div style="flex:1;font-size:12px;color:#94a3b8;border-left:3px solid #0ea5e9;padding-left:8px;overflow:hidden">
        <div style="font-weight:700;color:#0ea5e9;font-size:11px">${message.sender_name || 'Utilisateur'}</div>
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${message.content || '[Media]'}</div>
      </div>
      <button onclick="MessagesAdvanced.clearReply()" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:16px">✕</button>`;
    },

    clearReply() { this._replyTo = null; const p = document.getElementById('reply-preview'); if (p) p.style.display = 'none'; },

    async sendWithReply(conversationId, senderId, content) {
        await supabase.from('messages').insert({
            conversation_id: conversationId, sender_id: senderId, content,
            reply_to: this._replyTo?.id, created_at: new Date().toISOString()
        });
        this.clearReply();
    },

    // T55 — Supprimer un message
    async deleteMessage(messageId, forEveryone = false) {
        if (forEveryone) { await supabase.from('messages').update({ deleted_at: new Date().toISOString(), content: 'Message supprimé' }).eq('id', messageId); }
        else { await supabase.from('messages').update({ deleted_for_sender: true }).eq('id', messageId); }
        if (typeof showToast !== 'undefined') showToast('Message supprimé', 'info');
    },

    // T57 — Emoji reactions sur messages
    async addReaction(messageId, emoji, userId) {
        const { data } = await supabase.from('message_reactions').select('id').eq('message_id', messageId).eq('user_id', userId).eq('emoji', emoji).single();
        if (data) { await supabase.from('message_reactions').delete().eq('id', data.id); }
        else { await supabase.from('message_reactions').insert({ message_id: messageId, user_id: userId, emoji }); }
    },

    // T58 — Typing indicator via Supabase presence
    _typingChannel: null,

    initTyping(conversationId, userId) {
        this._typingChannel = supabase.channel(`typing:${conversationId}`)
            .on('presence', { event: 'sync' }, () => {
                const state = this._typingChannel.presenceState();
                const typingUsers = Object.values(state).flat().filter(u => u.user_id !== userId && u.is_typing);
                const el = document.getElementById('typing-indicator');
                if (el) el.textContent = typingUsers.length ? `✍️ ${typingUsers.map(u => u.name).join(', ')} écrit...` : '';
            });
        this._typingChannel.subscribe();
        return this._typingChannel;
    },

    async setTyping(isTyping, userName) {
        await this._typingChannel?.track({ user_id: null, name: userName, is_typing: isTyping });
    },

    // T59 — Recherche dans l'historique
    async searchHistory(conversationId, query) {
        const { data } = await supabase.from('messages').select('id, content, created_at, sender:members(username, avatar_url)').eq('conversation_id', conversationId).ilike('content', `%${query}%`).order('created_at', { ascending: false }).limit(20);
        return data || [];
    },

    renderSearchResults(results, containerId) {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = results.length ? results.map(m => `
      <div style="padding:10px;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer" onclick="document.getElementById('msg-${m.id}')?.scrollIntoView({behavior:'smooth'})">
        <div style="font-size:11px;color:#64748b;margin-bottom:2px">${new Date(m.created_at).toLocaleDateString('fr-FR')} · @${m.sender?.username}</div>
        <div style="font-size:13px;color:#f1f5f9">${m.content}</div>
      </div>`).join('') : '<div style="padding:16px;text-align:center;color:#64748b">Aucun résultat</div>';
    },

    // T60 — Archiver une conversation
    async archive(conversationId, userId) {
        await supabase.from('conversation_members').update({ archived: true }).eq('conversation_id', conversationId).eq('user_id', userId);
        if (typeof showToast !== 'undefined') showToast('📦 Conversation archivée', 'info');
    },

    async unarchive(conversationId, userId) {
        await supabase.from('conversation_members').update({ archived: false }).eq('conversation_id', conversationId).eq('user_id', userId);
    }
};

window.MessagesAdvanced = MessagesAdvanced;
