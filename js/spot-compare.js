/**
 * SwellSync — Comparaison de spots (T102/T103/T104)
 * T102: Comparer 2 spots côte à côte (météo, niveau requis, type de vague)
 * T103: Score de compatibilité spot/surfeur
 * T104: "Spot du jour" recommandé IA
 */

const SpotCompare = {

    spots: {
        biarritz: { name: 'Biarritz', region: 'Pays Basque', level: 'Tous', type: 'Beach break', avg_height: 1.5, avg_period: 8, wind_sensitivity: 'Faible', crowd: 'Élevée', parking: true, webcam: true, emoji: '🌊', slug: 'biarritz' },
        hossegor: { name: 'Hossegor', region: 'Landes', level: 'Intermédiaire+', type: 'Beach break puissant', avg_height: 2.0, avg_period: 11, wind_sensitivity: 'Moyenne', crowd: 'Moyenne', parking: true, webcam: true, emoji: '💪', slug: 'hossegor' },
        latorche: { name: 'La Torche', region: 'Bretagne', level: 'Intermédiaire', type: 'Beach break', avg_height: 1.8, avg_period: 10, wind_sensitivity: 'Élevée', crowd: 'Faible', parking: true, webcam: false, emoji: '🏴', slug: 'la-torche' },
        lacanau: { name: 'Lacanau', region: 'Gironde', level: 'Tous', type: 'Beach break', avg_height: 1.6, avg_period: 9, wind_sensitivity: 'Faible', crowd: 'Élevée', parking: true, webcam: true, emoji: '🌴', slug: 'lacanau' },
        capbreton: { name: 'Capbreton', region: 'Landes', level: 'Débutant/Intermédiaire', type: 'Plage abritée', avg_height: 1.2, avg_period: 8, wind_sensitivity: 'Très faible', crowd: 'Moyenne', parking: true, webcam: true, emoji: '☀️', slug: 'capbreton' },
        seignosse: { name: 'Seignosse', region: 'Landes', level: 'Confirmé', type: 'Beach break creux', avg_height: 2.2, avg_period: 12, wind_sensitivity: 'Faible', crowd: 'Faible', parking: false, webcam: false, emoji: '🔥', slug: 'seignosse' },
    },

    compareSpots(spotA, spotB, containerId = 'spot-compare-table') {
        const a = this.spots[spotA], b = this.spots[spotB];
        if (!a || !b) return;
        const el = document.getElementById(containerId);
        if (!el) return;
        const rows = [
            ['📍 Région', a.region, b.region],
            ['🌊 Type de vague', a.type, b.type],
            ['📏 Hauteur moyenne', `${a.avg_height}m`, `${b.avg_height}m`],
            ['⏱️ Période moyenne', `${a.avg_period}s`, `${b.avg_period}s`],
            ['🎯 Niveau requis', a.level, b.level],
            ['💨 Sensibilité vent', a.wind_sensitivity, b.wind_sensitivity],
            ['👥 Fréquentation', a.crowd, b.crowd],
            ['🅿️ Parking', a.parking ? '✅' : '❌', b.parking ? '✅' : '❌'],
            ['📹 Webcam', a.webcam ? '✅' : '❌', b.webcam ? '✅' : '❌'],
        ];
        el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;margin-bottom:20px">
        <a href="/spots/${a.slug}.html" style="background:rgba(14,165,233,.1);border:2px solid rgba(14,165,233,.3);border-radius:16px;padding:16px;text-align:center;text-decoration:none">
          <div style="font-size:30px;margin-bottom:4px">${a.emoji}</div>
          <div style="font-weight:700;color:#0ea5e9;font-size:15px">${a.name}</div>
          <div style="font-size:11px;color:#64748b">${a.region}</div>
        </a>
        <div style="display:flex;align-items:center;justify-content:center;font-size:22px;color:#64748b">VS</div>
        <a href="/spots/${b.slug}.html" style="background:rgba(16,185,129,.1);border:2px solid rgba(16,185,129,.3);border-radius:16px;padding:16px;text-align:center;text-decoration:none">
          <div style="font-size:30px;margin-bottom:4px">${b.emoji}</div>
          <div style="font-weight:700;color:#10b981;font-size:15px">${b.name}</div>
          <div style="font-size:11px;color:#64748b">${b.region}</div>
        </a>
      </div>
      <div style="background:rgba(255,255,255,.03);border-radius:16px;overflow:hidden">
        ${rows.map((r, i) => `
          <div style="display:grid;grid-template-columns:1fr 160px 1fr;${i > 0 ? 'border-top:1px solid rgba(255,255,255,.05)' : ''}">
            <div style="padding:12px 14px;color:#94a3b8;font-size:13px;text-align:right">${r[1]}</div>
            <div style="padding:12px 8px;text-align:center;font-size:12px;color:#64748b;background:rgba(255,255,255,.02)">${r[0]}</div>
            <div style="padding:12px 14px;color:#94a3b8;font-size:13px;text-align:left">${r[2]}</div>
          </div>`).join('')}
      </div>`;
    },

    // T103 — Score de compatibilité surfeur/spot
    getCompatibilityScore(spotKey, userLevel = 'Intermédiaire', userPrefs = {}) {
        const spot = this.spots[spotKey];
        if (!spot) return 0;
        const levelMap = { 'Débutant': 1, 'Rookie': 2, 'Intermédiaire': 3, 'Confirmé': 4, 'Expert': 5 };
        const levelOrder = { 'Débutant/Intermédiaire': 2, 'Tous': 3, 'Intermédiaire': 3, 'Intermédiaire+': 3.5, 'Confirmé': 4, 'Expert': 5 };
        const userLv = levelMap[userLevel] || 3;
        const spotLv = levelOrder[spot.level] || 3;
        let score = 100;
        // Pénalité niveau trop haut
        if (spotLv - userLv > 1) score -= 30;
        if (spotLv - userLv > 2) score -= 20;
        // Bonus crowd si préférence spot calme
        if (userPrefs.prefer_quiet && spot.crowd === 'Faible') score += 10;
        if (userPrefs.prefer_quiet && spot.crowd === 'Élevée') score -= 15;
        // Bonus webcam, parking
        if (spot.webcam) score += 5;
        if (spot.parking) score += 5;
        return Math.max(0, Math.min(100, Math.round(score)));
    },

    // T104 — Spot du jour IA (basé heure, vent, niveau user)
    getSpotRecommendation(userLevel = 'Intermédiaire', userPrefs = {}) {
        const hour = new Date().getHours();
        const isEarlyMorning = hour < 9;
        const scores = Object.entries(this.spots).map(([k, v]) => {
            let score = this.getCompatibilityScore(k, userLevel, userPrefs);
            if (isEarlyMorning && v.crowd === 'Faible') score += 10;
            if (isEarlyMorning && v.crowd === 'Élevée') score -= 10;
            return { key: k, spot: v, score };
        }).sort((a, b) => b.score - a.score);
        return scores[0];
    },

    renderRecommendation(containerId = 'spot-recommendation') {
        const el = document.getElementById(containerId);
        if (!el) return;
        const userLevel = localStorage.getItem('sw_user_level') || 'Intermédiaire';
        const rec = this.getSpotRecommendation(userLevel);
        el.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(14,165,233,.12),rgba(16,185,129,.08));border:1px solid rgba(14,165,233,.2);border-radius:20px;padding:18px">
        <div style="font-size:12px;color:#0ea5e9;font-weight:700;letter-spacing:.5px;margin-bottom:8px">🤖 SPOT DU JOUR</div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:36px">${rec.spot.emoji}</div>
          <div style="flex:1">
            <div style="font-weight:800;font-size:18px;color:#f1f5f9">${rec.spot.name}</div>
            <div style="font-size:12px;color:#94a3b8">${rec.spot.type} · ${rec.spot.region}</div>
            <div style="margin-top:4px">
              <span style="background:rgba(16,185,129,.15);color:#10b981;border-radius:8px;padding:2px 10px;font-size:12px;font-weight:700">Match ${rec.score}%</span>
            </div>
          </div>
          <a href="/spots/${rec.spot.slug}.html" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:12px;padding:10px 16px;color:white;font-weight:700;font-size:13px;text-decoration:none">Voir →</a>
        </div>
      </div>`;
    },

    renderSelector(containerId = 'spot-selector') {
        const el = document.getElementById(containerId);
        if (!el) return;
        const options = Object.entries(this.spots).map(([k, v]) => `<option value="${k}">${v.emoji} ${v.name}</option>`).join('');
        el.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
        <select id="spot-a-sel" onchange="SpotCompare.compareSpots(this.value, document.getElementById('spot-b-sel').value)" style="flex:1;padding:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#f1f5f9">${options}</select>
        <div style="color:#64748b;font-weight:700">VS</div>
        <select id="spot-b-sel" onchange="SpotCompare.compareSpots(document.getElementById('spot-a-sel').value, this.value)" style="flex:1;padding:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#f1f5f9">${options}</select>
      </div>
      <div id="spot-compare-table"></div>`;
        // Init avec biarritz vs hossegor
        document.getElementById('spot-b-sel').value = 'hossegor';
        this.compareSpots('biarritz', 'hossegor');
    }
};

window.SpotCompare = SpotCompare;
