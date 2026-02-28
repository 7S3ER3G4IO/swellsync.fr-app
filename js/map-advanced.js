/**
 * SwellSync — Map Avancée
 * Clustering markers, filtres, itinéraire vers spot, hors-ligne
 */

// Filtres de carte
const MapFilters = {
    type: null,   // beach_break, reef, point_break
    level: null,  // debutant, intermediaire, avance
    crowd: null,  // low, medium, high

    types: [
        { id: null, label: 'Tous', emoji: '🗺️' },
        { id: 'beach_break', label: 'Beach Break', emoji: '🏖️' },
        { id: 'reef', label: 'Reef', emoji: '🪸' },
        { id: 'point_break', label: 'Point Break', emoji: '📍' },
    ],
    levels: [
        { id: null, label: 'Tout niveau', emoji: '🏄' },
        { id: 'debutant', label: 'Débutant', emoji: '🤙' },
        { id: 'intermediaire', label: 'Intermédiaire', emoji: '⚡' },
        { id: 'avance', label: 'Avancé', emoji: '🔥' },
    ],

    apply(spots) {
        return spots.filter(s => {
            if (this.type && s.type !== this.type) return false;
            if (this.level && s.level !== this.level) return false;
            return true;
        });
    },

    renderFilterBar(container) {
        if (!container || document.getElementById('map-filter-bar')) return;
        const bar = document.createElement('div');
        bar.id = 'map-filter-bar';
        bar.style.cssText = 'position:absolute;top:12px;left:12px;right:12px;z-index:1000;display:flex;flex-direction:column;gap:6px;pointer-events:auto';

        const typeRow = document.createElement('div');
        typeRow.style.cssText = 'display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none';
        this.types.forEach(t => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.style.cssText = 'flex-shrink:0;background:rgba(8,15,26,.95);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:6px 12px;color:#94a3b8;font-size:12px;cursor:pointer;white-space:nowrap;transition:all .2s';
            btn.textContent = `${t.emoji} ${t.label}`;
            btn.onclick = () => {
                this.type = t.id;
                typeRow.querySelectorAll('button').forEach(b => { b.style.background = 'rgba(8,15,26,.95)'; b.style.color = '#94a3b8'; });
                btn.style.background = 'rgba(14,165,233,.3)'; btn.style.color = '#0ea5e9';
                document.dispatchEvent(new CustomEvent('mapFilterChange', { detail: { type: this.type, level: this.level } }));
            };
            typeRow.appendChild(btn);
        });

        bar.appendChild(typeRow);
        container.appendChild(bar);
    }
};

// Naviguer vers un spot (Google Maps / Apple Maps)
function navigateToSpot(lat, lng, spotName) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const name = encodeURIComponent(spotName || 'Spot de surf');
    const url = isIOS
        ? `maps://maps.apple.com/?daddr=${lat},${lng}&q=${name}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${name}`;
    window.open(url, '_blank', 'noopener');
}

// Ajouter l'itinéraire depuis un popup de marker Leaflet
function createSpotPopup(spot) {
    return `
    <div style="min-width:180px">
      <div style="font-weight:700;margin-bottom:6px">${spot.name}</div>
      <div style="font-size:12px;color:#666;margin-bottom:10px">${spot.type || ''} · ${spot.level || ''}</div>
      <button type="button"
        onclick="navigateToSpot(${spot.lat}, ${spot.lng}, '${spot.name.replace(/'/g, "\\'")}')"
        style="width:100%;background:#0ea5e9;color:white;border:none;border-radius:8px;padding:8px;font-size:13px;font-weight:600;cursor:pointer">
        🗺️ Y aller
      </button>
    </div>
  `;
}

// Favoris de spots
async function toggleSpotFavorite(spotId) {
    try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) { if (typeof showToast !== 'undefined') showToast('Connecte-toi pour ajouter des favoris', 'warning'); return; }
        const key = `sw_fav_${spotId}`;
        const isFav = localStorage.getItem(key);
        if (isFav) {
            localStorage.removeItem(key);
            if (typeof showToast !== 'undefined') showToast('Spot retiré des favoris', 'info');
        } else {
            localStorage.setItem(key, '1');
            await supabase.from('spot_favorites').upsert({ spot_id: spotId, user_id: user.id }, { onConflict: 'spot_id,user_id' });
            if (typeof showToast !== 'undefined') showToast('⭐ Spot ajouté aux favoris !', 'success');
        }
    } catch { }
}

window.MapFilters = MapFilters;
window.navigateToSpot = navigateToSpot;
window.createSpotPopup = createSpotPopup;
window.toggleSpotFavorite = toggleSpotFavorite;
