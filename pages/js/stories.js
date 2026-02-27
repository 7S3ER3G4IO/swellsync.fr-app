/**
 * SwellSync Stories — Instagram/TikTok-style Stories
 * ─ Barre horizontale de stories (auto-injectée dans le home)
 * ─ Viewer plein écran avec navigation tap
 * ─ Création avec upload photo + texte overlay
 * ─ Suppression + compteur de vues
 */
(function () {
    'use strict';

    let allStoryGroups = [];
    let currentGroupIdx = 0;
    let currentStoryIdx = 0;
    let storyTimer = null;
    let progressInterval = null;
    const STORY_DURATION = 5000; // 5s par story
    let myMemberId = null;

    // ── Charger les stories ──
    async function loadStories() {
        try {
            if (typeof API !== 'undefined') {
                const me = await API.auth.me();
                myMemberId = me?.id || null;
            }
        } catch { }

        try {
            if (typeof API === 'undefined') return;
            const sb = await getSupabase();
            const { data } = await sb.from('stories')
                .select('*, members(name, avatar_url)')
                .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .order('created_at', { ascending: false });
            // Group by author
            const grouped = {};
            (data || []).forEach(s => {
                const key = s.member_id;
                if (!grouped[key]) grouped[key] = {
                    author_name: s.members?.name || 'Inconnu',
                    author_avatar: s.members?.avatar_url || null,
                    has_unseen: true,
                    stories: []
                };
                grouped[key].stories.push(s);
            });
            allStoryGroups = Object.values(grouped);
            renderStoriesBar();
        } catch { }
    }

    // ── Barre de Stories ──
    function renderStoriesBar() {
        // Trouver le point d'insertion (après le header, avant le main)
        const main = document.querySelector('main');
        if (!main) return;

        let bar = document.getElementById('stories-bar');
        if (!bar) {
            bar = document.createElement('section');
            bar.id = 'stories-bar';
            bar.style.cssText = 'padding:12px 16px 4px;';
            main.parentNode.insertBefore(bar, main);
        }

        // Bouton "+" pour créer
        let html = `
        <div class="flex gap-3 overflow-x-auto pb-2" style="-ms-overflow-style:none;scrollbar-width:none;">
            <div class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" onclick="window.SwellStories.create()">
                <div style="width:62px;height:62px;border-radius:50%;background:linear-gradient(135deg,#00bad6,#0077cc);display:flex;align-items:center;justify-content:center;border:2px solid transparent;">
                    <span class="material-symbols-outlined text-white text-2xl">add</span>
                </div>
                <span style="font-size:10px;color:#94a3b8;font-weight:600;">Ta story</span>
            </div>`;

        // Avatars des auteurs
        for (let i = 0; i < allStoryGroups.length; i++) {
            const g = allStoryGroups[i];
            const borderColor = g.has_unseen ? '#00bad6' : '#334155';
            const gradBorder = g.has_unseen
                ? 'background:linear-gradient(135deg,#00bad6,#a855f7);padding:2px;'
                : 'background:#334155;padding:2px;';
            const avatar = g.author_avatar
                ? `<img src="${g.author_avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/>`
                : `<div style="width:100%;height:100%;border-radius:50%;background:#0f2438;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#64748b;">${(g.author_name || '?')[0].toUpperCase()}</div>`;

            html += `
            <div class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer" onclick="window.SwellStories.open(${i})">
                <div style="width:62px;height:62px;border-radius:50%;${gradBorder}">
                    <div style="width:100%;height:100%;border-radius:50%;border:2px solid #080f1a;overflow:hidden;">
                        ${avatar}
                    </div>
                </div>
                <span style="font-size:10px;color:${g.has_unseen ? '#f1f5f9' : '#64748b'};font-weight:${g.has_unseen ? '700' : '500'};max-width:62px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g.author_name || 'Inconnu'}</span>
            </div>`;
        }
        html += '</div>';
        bar.innerHTML = html;
    }

    // ── Viewer Plein Écran ──
    function openViewer(groupIdx) {
        currentGroupIdx = groupIdx;
        currentStoryIdx = 0;
        renderViewer();
    }

    function renderViewer() {
        const group = allStoryGroups[currentGroupIdx];
        if (!group || !group.stories.length) { closeViewer(); return; }

        const story = group.stories[currentStoryIdx];
        if (!story) { closeViewer(); return; }

        // Marquer comme vue
        // Marquer comme vue via Supabase
        if (typeof getSupabase !== 'undefined') {
            getSupabase().then(sb => sb.from('story_views').upsert({ story_id: story.id, member_id: myMemberId }).catch(() => { }));
        }

        let viewer = document.getElementById('story-viewer');
        if (!viewer) {
            viewer = document.createElement('div');
            viewer.id = 'story-viewer';
            viewer.style.cssText = `position:fixed;inset:0;z-index:10000;background:#000;display:flex;flex-direction:column;`;
            document.body.appendChild(viewer);
            document.body.style.overflow = 'hidden';
        }

        const avatar = group.author_avatar
            ? `<img src="${group.author_avatar}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;"/>`
            : `<div style="width:32px;height:32px;border-radius:50%;background:#1e3a5f;display:flex;align-items:center;justify-content:center;font-weight:900;color:#94a3b8;font-size:14px;">${(group.author_name || '?')[0].toUpperCase()}</div>`;

        const timeAgo = getTimeAgo(story.created_at);
        const isOwn = story.member_id === myMemberId;

        // Progress bars
        let progressHtml = '<div style="display:flex;gap:3px;padding:8px 12px 0;">';
        for (let i = 0; i < group.stories.length; i++) {
            const cls = i < currentStoryIdx ? 'full' : i === currentStoryIdx ? 'active' : 'empty';
            progressHtml += `<div class="story-progress-seg" style="flex:1;height:2.5px;border-radius:2px;background:rgba(255,255,255,0.25);overflow:hidden;">
                <div class="story-progress-fill" data-idx="${i}" style="height:100%;background:#fff;border-radius:2px;width:${cls === 'full' ? '100' : '0'}%;transition:none;"></div>
            </div>`;
        }
        progressHtml += '</div>';

        viewer.innerHTML = `
            ${progressHtml}
            <!-- Header -->
            <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;">
                ${avatar}
                <div style="flex:1;">
                    <span style="color:#fff;font-weight:700;font-size:13px;">${group.author_name || 'Inconnu'}</span>
                    <span style="color:#94a3b8;font-size:11px;margin-left:6px;">${timeAgo}</span>
                </div>
                ${isOwn ? `<button onclick="window.SwellStories.delete(${story.id})" style="background:none;border:none;color:#ef4444;cursor:pointer;padding:4px;">
                    <span class="material-symbols-outlined" style="font-size:22px;">delete</span>
                </button>` : ''}
                ${isOwn ? `<button onclick="window.SwellStories.showViewers(${story.id})" style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;">
                    <span class="material-symbols-outlined" style="font-size:22px;">visibility</span>
                    <span style="font-size:10px;color:#94a3b8;font-weight:700;">${story.view_count || 0}</span>
                </button>` : ''}
                <button onclick="window.SwellStories.close()" style="background:none;border:none;color:#fff;cursor:pointer;padding:4px;">
                    <span class="material-symbols-outlined" style="font-size:24px;">close</span>
                </button>
            </div>
            <!-- Media -->
            <div style="flex:1;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;${story.bg_color ? 'background:' + story.bg_color : ''}">
                ${story.media_type === 'video'
                ? `<video src="${story.media_url}" autoplay muted playsinline style="max-width:100%;max-height:100%;object-fit:contain;"></video>`
                : `<img src="${story.media_url}" style="max-width:100%;max-height:100%;object-fit:contain;"/>`}
                ${story.text_overlay ? `<div style="position:absolute;${story.text_position === 'top' ? 'top:40px' : story.text_position === 'center' ? 'top:50%;transform:translateY(-50%)' : 'bottom:40px'};left:0;right:0;text-align:center;padding:12px 20px;">
                    <p style="color:${story.text_color || '#fff'};font-size:20px;font-weight:800;text-shadow:0 2px 8px rgba(0,0,0,0.7);line-height:1.3;">${story.text_overlay}</p>
                </div>` : ''}
                <!-- Tap zones -->
                <div onclick="window.SwellStories.prev()" style="position:absolute;left:0;top:0;bottom:0;width:30%;cursor:pointer;"></div>
                <div onclick="window.SwellStories.next()" style="position:absolute;right:0;top:0;bottom:0;width:70%;cursor:pointer;"></div>
            </div>`;

        // Animer la barre de progression
        startProgressAnimation();
    }

    function startProgressAnimation() {
        clearTimeout(storyTimer);
        clearInterval(progressInterval);

        const fill = document.querySelector(`.story-progress-fill[data-idx="${currentStoryIdx}"]`);
        if (!fill) return;

        fill.style.transition = 'none';
        fill.style.width = '0%';

        requestAnimationFrame(() => {
            fill.style.transition = `width ${STORY_DURATION}ms linear`;
            fill.style.width = '100%';
        });

        storyTimer = setTimeout(() => {
            nextStory();
        }, STORY_DURATION);
    }

    function nextStory() {
        const group = allStoryGroups[currentGroupIdx];
        if (currentStoryIdx < group.stories.length - 1) {
            currentStoryIdx++;
            renderViewer();
        } else if (currentGroupIdx < allStoryGroups.length - 1) {
            currentGroupIdx++;
            currentStoryIdx = 0;
            renderViewer();
        } else {
            closeViewer();
        }
    }

    function prevStory() {
        if (currentStoryIdx > 0) {
            currentStoryIdx--;
            renderViewer();
        } else if (currentGroupIdx > 0) {
            currentGroupIdx--;
            const prevGroup = allStoryGroups[currentGroupIdx];
            currentStoryIdx = prevGroup.stories.length - 1;
            renderViewer();
        }
    }

    function closeViewer() {
        clearTimeout(storyTimer);
        clearInterval(progressInterval);
        const v = document.getElementById('story-viewer');
        if (v) { v.remove(); document.body.style.overflow = ''; }
        // Refresh la barre pour mettre à jour les "vus"
        loadStories();
    }

    // ── Suppression ──
    async function deleteStory(storyId) {
        try {
            const sb = await getSupabase();
            await sb.from('stories').delete().eq('id', storyId).eq('member_id', myMemberId);
            closeViewer();
            showToast('Story supprimée 🗑️');
        } catch { showToast('Erreur', '#ef4444'); }
    }

    // ── Viewers ──
    async function showViewers(storyId) {
        clearTimeout(storyTimer);
        try {
            const sb = await getSupabase();
            const { data: viewers } = await sb.from('story_views')
                .select('*, members(name, avatar_url)')
                .eq('story_id', storyId);

            let panel = document.getElementById('story-viewers-panel');
            if (panel) panel.remove();

            panel = document.createElement('div');
            panel.id = 'story-viewers-panel';
            panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:10001;background:rgba(15,36,56,0.97);backdrop-filter:blur(16px);border-top-left-radius:24px;border-top-right-radius:24px;max-height:60vh;overflow-y:auto;padding:20px;';

            let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
                <h3 style="font-weight:900;font-size:16px;color:#fff;">👁️ Vues (${viewers.length})</h3>
                <button onclick="document.getElementById('story-viewers-panel').remove();window.SwellStories.resumeTimer();" style="background:none;border:none;color:#94a3b8;cursor:pointer;">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>`;

            if (!viewers.length) {
                html += '<p style="color:#64748b;font-size:13px;text-align:center;padding:20px 0;">Aucune vue pour le moment</p>';
            } else {
                for (const v of viewers) {
                    const vAvatar = v.avatar_url
                        ? `<img src="${v.avatar_url}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;"/>`
                        : `<div style="width:36px;height:36px;border-radius:50%;background:#1e3a5f;display:flex;align-items:center;justify-content:center;font-weight:900;color:#64748b;">${(v.name || '?')[0].toUpperCase()}</div>`;
                    html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                        ${vAvatar}
                        <span style="color:#f1f5f9;font-weight:600;font-size:13px;">${v.name || 'Inconnu'}</span>
                        <span style="margin-left:auto;color:#64748b;font-size:10px;">${getTimeAgo(v.viewed_at)}</span>
                    </div>`;
                }
            }
            panel.innerHTML = html;
            document.body.appendChild(panel);
        } catch { }
    }

    function resumeTimer() {
        startProgressAnimation();
    }

    // ── Créateur de Story ──
    function openCreator() {
        if (!myMemberId) {
            showToast('Connecte-toi pour créer une story', '#ef4444');
            return;
        }

        let creator = document.getElementById('story-creator');
        if (creator) creator.remove();

        creator = document.createElement('div');
        creator.id = 'story-creator';
        creator.style.cssText = 'position:fixed;inset:0;z-index:10000;background:#080f1a;display:flex;flex-direction:column;';
        document.body.style.overflow = 'hidden';

        creator.innerHTML = `
            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;">
                <button onclick="window.SwellStories.closeCreator()" style="background:none;border:none;color:#fff;cursor:pointer;">
                    <span class="material-symbols-outlined" style="font-size:28px;">close</span>
                </button>
                <h2 style="font-weight:900;font-size:16px;color:#fff;">Nouvelle Story</h2>
                <div style="width:28px;"></div>
            </div>

            <!-- Preview zone -->
            <div id="story-preview" style="flex:1;display:flex;align-items:center;justify-content:center;background:#0f2438;margin:0 16px;border-radius:20px;overflow:hidden;position:relative;min-height:300px;">
                <div id="story-preview-empty" style="text-align:center;padding:40px;">
                    <span class="material-symbols-outlined" style="font-size:64px;color:#1e3a5f;">add_photo_alternate</span>
                    <p style="color:#475569;font-size:13px;margin-top:12px;font-weight:600;">Ajoute une photo</p>
                </div>
                <img id="story-preview-img" style="display:none;max-width:100%;max-height:100%;object-fit:contain;"/>
                <div id="story-text-preview" style="display:none;position:absolute;bottom:40px;left:0;right:0;text-align:center;padding:12px 20px;">
                    <p id="story-text-display" style="color:#fff;font-size:20px;font-weight:800;text-shadow:0 2px 8px rgba(0,0,0,0.7);"></p>
                </div>
            </div>

            <!-- Tools -->
            <div style="padding:16px;space-y:12px;">
                <!-- Upload -->
                <div style="display:flex;gap:10px;margin-bottom:12px;">
                    <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:16px;background:#0f2438;border:1px solid rgba(0,186,214,0.2);cursor:pointer;color:#00bad6;font-weight:700;font-size:13px;">
                        <span class="material-symbols-outlined">photo_library</span> Galerie
                        <input type="file" accept="image/*,video/*" id="story-file-input" style="display:none;" onchange="window.SwellStories.onFileSelect(this)"/>
                    </label>
                    <label style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:16px;background:#0f2438;border:1px solid rgba(0,186,214,0.2);cursor:pointer;color:#00bad6;font-weight:700;font-size:13px;">
                        <span class="material-symbols-outlined">photo_camera</span> Caméra
                        <input type="file" accept="image/*" capture="environment" id="story-camera-input" style="display:none;" onchange="window.SwellStories.onFileSelect(this)"/>
                    </label>
                </div>
                <!-- Texte -->
                <div style="display:flex;gap:8px;margin-bottom:12px;">
                    <input type="text" id="story-text-input" placeholder="Ajouter du texte…" maxlength="120"
                        style="flex:1;background:#0f2438;border:1px solid rgba(0,186,214,0.15);border-radius:12px;padding:10px 14px;color:#fff;font-size:13px;font-weight:600;outline:none;"
                        oninput="window.SwellStories.updateTextPreview()"/>
                    <input type="color" id="story-text-color" value="#ffffff" style="width:40px;height:40px;border:none;border-radius:10px;cursor:pointer;background:transparent;"
                        oninput="window.SwellStories.updateTextPreview()"/>
                </div>
                <!-- Position du texte -->
                <div style="display:flex;gap:6px;margin-bottom:16px;">
                    <button onclick="window.SwellStories.setTextPos('top')" class="story-pos-btn" data-pos="top" style="flex:1;padding:8px;border-radius:10px;background:#0f2438;border:1px solid rgba(255,255,255,0.1);color:#64748b;font-size:11px;font-weight:700;cursor:pointer;">↑ Haut</button>
                    <button onclick="window.SwellStories.setTextPos('center')" class="story-pos-btn" data-pos="center" style="flex:1;padding:8px;border-radius:10px;background:#0f2438;border:1px solid rgba(255,255,255,0.1);color:#64748b;font-size:11px;font-weight:700;cursor:pointer;">⬤ Centre</button>
                    <button onclick="window.SwellStories.setTextPos('bottom')" class="story-pos-btn active" data-pos="bottom" style="flex:1;padding:8px;border-radius:10px;background:rgba(0,186,214,0.15);border:1px solid #00bad6;color:#00bad6;font-size:11px;font-weight:700;cursor:pointer;">↓ Bas</button>
                </div>
                <!-- Publier -->
                <button id="story-publish-btn" onclick="window.SwellStories.publish()" disabled
                    style="width:100%;padding:14px;border-radius:16px;background:linear-gradient(135deg,#00bad6,#0077cc);color:#fff;font-weight:900;font-size:15px;border:none;cursor:pointer;opacity:0.4;transition:opacity 0.3s;">
                    📸 Publier la Story
                </button>
            </div>`;

        document.body.appendChild(creator);
    }

    let selectedImageBase64 = null;
    let textPosition = 'bottom';

    function onFileSelect(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            selectedImageBase64 = e.target.result;
            const img = document.getElementById('story-preview-img');
            const empty = document.getElementById('story-preview-empty');
            img.src = selectedImageBase64;
            img.style.display = 'block';
            empty.style.display = 'none';
            document.getElementById('story-publish-btn').disabled = false;
            document.getElementById('story-publish-btn').style.opacity = '1';
        };
        reader.readAsDataURL(file);
    }

    function updateTextPreview() {
        const text = document.getElementById('story-text-input')?.value || '';
        const color = document.getElementById('story-text-color')?.value || '#ffffff';
        const display = document.getElementById('story-text-display');
        const container = document.getElementById('story-text-preview');
        if (display && container) {
            display.textContent = text;
            display.style.color = color;
            container.style.display = text ? 'block' : 'none';
            // Update position
            container.style.top = textPosition === 'top' ? '20px' : textPosition === 'center' ? '50%' : 'auto';
            container.style.bottom = textPosition === 'bottom' ? '20px' : 'auto';
            container.style.transform = textPosition === 'center' ? 'translateY(-50%)' : 'none';
        }
    }

    function setTextPos(pos) {
        textPosition = pos;
        document.querySelectorAll('.story-pos-btn').forEach(b => {
            if (b.dataset.pos === pos) {
                b.style.background = 'rgba(0,186,214,0.15)';
                b.style.borderColor = '#00bad6';
                b.style.color = '#00bad6';
            } else {
                b.style.background = '#0f2438';
                b.style.borderColor = 'rgba(255,255,255,0.1)';
                b.style.color = '#64748b';
            }
        });
        updateTextPreview();
    }

    async function publishStory() {
        if (!selectedImageBase64) return;

        const btn = document.getElementById('story-publish-btn');
        btn.textContent = 'Publication…';
        btn.disabled = true;

        try {
            const sb = await getSupabase();
            // Upload image to Supabase Storage
            const fileName = `stories/${myMemberId}_${Date.now()}.jpg`;
            const base64Data = selectedImageBase64.split(',')[1];
            const byteString = atob(base64Data);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            const blob = new Blob([ab], { type: 'image/jpeg' });

            const { data: uploadData, error: uploadError } = await sb.storage
                .from('avatars').upload(fileName, blob, { upsert: true });

            let mediaUrl = selectedImageBase64; // fallback
            if (!uploadError && uploadData) {
                const { data: { publicUrl } } = sb.storage.from('avatars').getPublicUrl(fileName);
                mediaUrl = publicUrl;
            }

            const { error } = await sb.from('stories').insert({
                member_id: myMemberId,
                media_url: mediaUrl,
                media_type: 'image',
                text_overlay: document.getElementById('story-text-input')?.value || '',
                text_color: document.getElementById('story-text-color')?.value || '#ffffff',
                text_position: textPosition
            });

            if (!error) {
                closeCreator();
                showToast('Story publiée ! 📸');
                loadStories();
            } else {
                showToast(error.message || 'Erreur', '#ef4444');
                btn.textContent = '📸 Publier la Story';
                btn.disabled = false;
            }
        } catch {
            showToast('Erreur réseau', '#ef4444');
            btn.textContent = '📸 Publier la Story';
            btn.disabled = false;
        }
    }

    function closeCreator() {
        const c = document.getElementById('story-creator');
        if (c) { c.remove(); document.body.style.overflow = ''; }
        selectedImageBase64 = null;
    }

    // ── Utils ──
    function getTimeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'à l\'instant';
        if (m < 60) return `${m}min`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h`;
        return `${Math.floor(h / 24)}j`;
    }

    function showToast(msg, color) {
        let t = document.getElementById('story-toast');
        if (!t) {
            t = document.createElement('div');
            t.id = 'story-toast';
            t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(15,36,56,0.95);border:1px solid rgba(0,186,214,0.3);border-radius:16px;padding:10px 20px;font-size:13px;font-weight:700;z-index:99999;color:#f1f5f9;white-space:nowrap;transition:opacity 0.3s;';
            document.body.appendChild(t);
        }
        t.textContent = msg;
        if (color) t.style.borderColor = color;
        t.style.opacity = '1';
        clearTimeout(t._timer);
        t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3000);
    }

    // ── API Publique ──
    window.SwellStories = {
        load: loadStories,
        open: openViewer,
        close: closeViewer,
        next: nextStory,
        prev: prevStory,
        create: openCreator,
        closeCreator,
        publish: publishStory,
        delete: deleteStory,
        showViewers,
        resumeTimer: resumeTimer,
        onFileSelect,
        updateTextPreview,
        setTextPos
    };

    // Auto-load si sur la page home
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadStories);
    } else {
        loadStories();
    }
})();
