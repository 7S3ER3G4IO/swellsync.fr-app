/**
 * SwellSync — Coaching vidéo intégré (T90/T91/T92)
 * T90: Bibliothèque vidéos techniques par niveau et type de manœuvre
 * T91: Vidéo YT embed + timestamp au moment clé
 * T92: Marquer une vidéo comme "vue" + favoris
 */

const VideoCoaching = {

    library: [
        // DÉBUTANT
        { id: 'v01', title: 'Le Take-Off parfait', emoji: '🚀', level: 'Rookie', category: 'Technique de base', duration: '8min', yt_id: 'CpEzm7CQZGE', timestamp: 45, tips: 'Positionne tes mains sous les pectoraux, pas les épaules.' },
        { id: 'v02', title: 'Duck Dive efficace', emoji: '🦆', level: 'Rookie', category: 'Technique de base', duration: '6min', yt_id: 'xYr7fvRXjGA', timestamp: 30, tips: 'Plonge 2-3m avant que la vague t\'atteigne.' },
        { id: 'v03', title: 'Pagayer sans se fatiguer', emoji: '🏊', level: 'Rookie', category: 'Paddle', duration: '10min', yt_id: '2vMxHNKgU_A', timestamp: 60, tips: 'Rentre complètement tes doigts dans l\'eau, coude en premier.' },
        { id: 'v04', title: 'Lire les vagues', emoji: '🌊', level: 'Rookie', category: 'Stratégie', duration: '12min', yt_id: 'PKJZ0FhGVYw', timestamp: 90, tips: 'Observe les sets depuis la plage 10min avant d\'entrer.' },
        // INTERMÉDIAIRE
        { id: 'v05', title: 'Bottom Turn puissant', emoji: '↩️', level: 'Intermédiaire', category: 'Manœuvres', duration: '9min', yt_id: '4-5z-SVIT_E', timestamp: 120, tips: 'Plie le genou avant génèreusement, regarde l\'épaule.' },
        { id: 'v06', title: 'Cutback étape par étape', emoji: '🔄', level: 'Intermédiaire', category: 'Manœuvres', duration: '11min', yt_id: 'qWF_L-GorMI', timestamp: 80, tips: 'Commence par des cutbacks larges avant de les serrer.' },
        { id: 'v07', title: 'Snap sur la lèvre', emoji: '⚡', level: 'Intermédiaire', category: 'Manœuvres', duration: '8min', yt_id: 'jgwi3pMWwCY', timestamp: 55, tips: 'Rotation des hanches + bras tendus vers le bas.' },
        { id: 'v08', title: 'Floater pour les nuls', emoji: '🌊', level: 'Intermédiaire', category: 'Manœuvres', duration: '7min', yt_id: 'PKv2Wd8r4hE', timestamp: 40, tips: 'Monte à 45° sur la lèvre, saute à plat sur la mousse.' },
        // CONFIRMÉ
        { id: 'v09', title: 'Tube riding — s\'engager', emoji: '🌀', level: 'Confirmé', category: 'Figures avancées', duration: '15min', yt_id: 'dPxB4JNR4DE', timestamp: 200, tips: 'Traine ta main dans la face, regarde la sortie.' },
        { id: 'v10', title: 'Aérien reverse', emoji: '✈️', level: 'Confirmé', category: 'Figures avancées', duration: '14min', yt_id: 'KCcMmwHuRzE', timestamp: 150, tips: 'Vitesse + rampe + rotation des épaules.' },
        // STRATEGIE
        { id: 'v11', title: 'Étude du spot', emoji: '📍', level: 'Tous niveaux', category: 'Stratégie', duration: '13min', yt_id: 'VG_4F8Hzxzw', timestamp: 0, tips: 'Localise le peak, observe les courants, entre par le canal.' },
        { id: 'v12', title: 'Priorité et étiquette surf', emoji: '👑', level: 'Tous niveaux', category: 'Étiquette', duration: '8min', yt_id: 'f9bY3yRv-Q4', timestamp: 30, tips: 'Jamais sur quelqu\'un qui est déjà debout. Toujours.' },
    ],

    _filter: { level: 'Tous', cat: 'Tous', search: '' },
    _watched: JSON.parse(localStorage.getItem('sw_watched_videos') || '[]'),
    _favorites: JSON.parse(localStorage.getItem('sw_fav_videos') || '[]'),

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const levels = ['Tous', 'Rookie', 'Intermédiaire', 'Confirmé'];
        const cats = ['Tous', 'Technique de base', 'Manœuvres', 'Figures avancées', 'Paddle', 'Stratégie', 'Étiquette'];
        container.innerHTML = `
      <input type="text" id="vid-search" placeholder="🔍 Chercher une vidéo..." oninput="VideoCoaching.search(this.value)"
        style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 16px;color:#f1f5f9;font-size:14px;outline:none;box-sizing:border-box;margin-bottom:14px">
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
        ${levels.map(l => `<button type="button" onclick="VideoCoaching.setFilter('level','${l}')" style="padding:6px 14px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#64748b;font-size:12px;cursor:pointer">${l}</button>`).join('')}
      </div>
      <div style="display:flex;gap:6px;overflow-x:auto;margin-bottom:20px;scrollbar-width:none">
        ${cats.map(c => `<button type="button" onclick="VideoCoaching.setFilter('cat','${c}')" style="white-space:nowrap;padding:6px 14px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#64748b;font-size:12px;cursor:pointer;flex-shrink:0">${c}</button>`).join('')}
      </div>
      <div id="vid-list"></div>`;
        this._renderList();
    },

    setFilter(key, val) { this._filter[key] = val; this._renderList(); },
    search(val) { this._filter.search = val; this._renderList(); },

    _renderList() {
        const el = document.getElementById('vid-list');
        if (!el) return;
        const { level, cat, search } = this._filter;
        const filtered = this.library.filter(v =>
            (level === 'Tous' || v.level === level || v.level === 'Tous niveaux') &&
            (cat === 'Tous' || v.category === cat) &&
            (!search || v.title.toLowerCase().includes(search.toLowerCase()))
        );
        if (!filtered.length) { el.innerHTML = '<div class="empty-state"><div>🎬</div><h3>Aucune vidéo</h3></div>'; return; }
        el.innerHTML = filtered.map(v => {
            const watched = this._watched.includes(v.id);
            const fav = this._favorites.includes(v.id);
            return `<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:16px;margin-bottom:10px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <div style="font-size:28px">${v.emoji}</div>
          <div style="flex:1">
            <div style="font-weight:700;color:#f1f5f9;font-size:14px">${v.title}${watched ? '<span style="margin-left:6px;color:#10b981;font-size:11px">✅ Vu</span>' : ''}</div>
            <div style="font-size:12px;color:#64748b">${v.level} · ${v.category} · ${v.duration}</div>
          </div>
          <button type="button" onclick="VideoCoaching.toggleFavorite('${v.id}')" style="background:none;border:none;font-size:20px;cursor:pointer">${fav ? '❤️' : '🤍'}</button>
        </div>
        <div style="background:rgba(0,0,0,.4);border-radius:12px;overflow:hidden;margin-bottom:10px;position:relative;cursor:pointer" onclick="VideoCoaching.openVideo('${v.id}')">
          <img src="https://img.youtube.com/vi/${v.yt_id}/mqdefault.jpg" alt="${v.title}" style="width:100%;display:block;height:160px;object-fit:cover" loading="lazy">
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3)"><div style="font-size:48px">▶️</div></div>
        </div>
        <div style="background:rgba(14,165,233,.06);border:1px solid rgba(14,165,233,.12);border-radius:10px;padding:10px;font-size:12px;color:#94a3b8">
          💡 <em>${v.tips}</em>
        </div>
      </div>`;
        }).join('');
    },

    openVideo(id) {
        const v = this.library.find(x => x.id === id);
        if (!v) return;
        // Marquer comme vu
        if (!this._watched.includes(id)) { this._watched.push(id); localStorage.setItem('sw_watched_videos', JSON.stringify(this._watched)); }
        // Ouvrir modal YouTube
        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
        modal.innerHTML = `
      <div style="width:100%;max-width:700px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-weight:700;color:#f1f5f9">${v.emoji} ${v.title}</div>
          <button onclick="this.closest('[style]').remove()" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer">✕</button>
        </div>
        <div style="border-radius:16px;overflow:hidden;aspect-ratio:16/9">
          <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${v.yt_id}?start=${v.timestamp}&autoplay=1" frameborder="0" allow="autoplay;fullscreen" style="display:block"></iframe>
        </div>
        <p style="color:#94a3b8;font-size:13px;margin-top:12px">💡 ${v.tips}</p>
      </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    },

    toggleFavorite(id) {
        if (this._favorites.includes(id)) { this._favorites.splice(this._favorites.indexOf(id), 1); }
        else { this._favorites.push(id); }
        localStorage.setItem('sw_fav_videos', JSON.stringify(this._favorites));
        this._renderList();
    }
};

window.VideoCoaching = VideoCoaching;
