/**
 * SwellSync — Messages avancés
 * T54: Répondre à un message (reply avec preview)
 * T55: Supprimer un message
 * T57: Emoji reactions sur les messages (long press)
 * T59: Recherche dans les conversations
 * T60: Archiver une conversation
 */

const MessagesAdvanced = {

    // T54 — Réponse à un message spécifique
    renderReplyPreview(originalMessage, senderName) {
        return `
      <div style="display:flex;border-left:3px solid #0ea5e9;padding-left:10px;margin-bottom:8px;opacity:.7">
        <div>
          <div style="font-size:11px;font-weight:600;color:#0ea5e9;margin-bottom:2px">${senderName}</div>
          <div style="font-size:13px;color:#94a3b8;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${originalMessage}</div>
        </div>
      </div>`;
    },

    setReplyTo(messageId, messageText, senderName) {
        window._replyTo = { messageId, messageText, senderName };
        let bar = document.getElementById('reply-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'reply-bar';
            bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:rgba(14,165,233,.08);border-top:1px solid rgba(14,165,233,.2);gap:10px';
            const input = document.querySelector('.message-input-wrapper, #message-form, form');
            if (input) input.before(bar);
        }
        bar.innerHTML = `
      <div style="flex:1">
        <div style="font-size:11px;color:#0ea5e9;font-weight:600;margin-bottom:2px">Répondre à ${senderName}</div>
        <div style="font-size:13px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${messageText.substring(0, 60)}${messageText.length > 60 ? '…' : ''}</div>
      </div>
      <button type="button" onclick="MessagesAdvanced.cancelReply()" style="background:none;border:none;color:#64748b;font-size:20px;cursor:pointer;padding:4px">×</button>`;
    },

    cancelReply() {
        window._replyTo = null;
        document.getElementById('reply-bar')?.remove();
    },

    // T55 — Supprimer un message
    async deleteMessage(messageId, forEveryone = false) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            if (forEveryone) {
                await supabase.from('messages').update({ content: '🗑️ Message supprimé', deleted: true }).eq('id', messageId).eq('sender_id', user.id);
            } else {
                await supabase.from('message_hidden').upsert({ message_id: messageId, user_id: user.id });
            }
            document.querySelector(`[data-message-id="${messageId}"]`)?.remove();
            if (typeof showToast !== 'undefined') showToast('Message supprimé', 'info');
        } catch { }
    },

    // T57 — Emoji reactions sur les messages
    messageReactions: ['❤️', '🤙', '😂', '🔥', '👍', '😮'],

    showReactionPicker(messageEl, messageId) {
        let picker = document.getElementById('msg-reaction-picker');
        if (picker) { picker.remove(); return; }
        picker = document.createElement('div');
        picker.id = 'msg-reaction-picker';
        picker.style.cssText = 'position:absolute;background:#1e293b;border:1px solid rgba(255,255,255,.1);border-radius:50px;padding:6px 10px;display:flex;gap:4px;z-index:200;box-shadow:0 8px 32px rgba(0,0,0,.5)';
        this.messageReactions.forEach(emoji => {
            const btn = document.createElement('button');
            btn.type = 'button'; btn.textContent = emoji;
            btn.style.cssText = 'background:none;border:none;font-size:22px;cursor:pointer;border-radius:8px;padding:2px 4px';
            btn.onclick = () => { this.reactToMessage(messageId, emoji); picker.remove(); };
            picker.appendChild(btn);
        });
        messageEl.style.position = 'relative';
        messageEl.appendChild(picker);
        setTimeout(() => document.addEventListener('click', () => picker.remove(), { once: true }), 100);
    },

    async reactToMessage(messageId, emoji) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('message_reactions').upsert({ message_id: messageId, user_id: user.id, emoji }, { onConflict: 'message_id,user_id' });
        } catch { }
    },

    // T59 — Recherche dans les conversations
    filterMessages(query) {
        const messages = document.querySelectorAll('[data-message-content]');
        messages.forEach(m => {
            const text = m.dataset.messageContent?.toLowerCase() || '';
            m.style.display = text.includes(query.toLowerCase()) ? 'flex' : 'none';
        });
    },

    // T60 — Archiver une conversation
    async archiveConversation(conversationId) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('conversation_archive').upsert({ conversation_id: conversationId, user_id: user.id });
            if (typeof showToast !== 'undefined') showToast('Conversation archivée', 'info');
        } catch { }
    }
};

window.MessagesAdvanced = MessagesAdvanced;
