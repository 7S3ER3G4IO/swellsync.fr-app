/**
 * SwellSync — Widgets météo avancés (T22/T23/T24)
 * T22: Widget UV index avec recommandations protection
 * T23: Widget qualité de l'air (AQI) near beach
 * T24: Module marée détaillé: prochaines marées avec icônes
 */

const WeatherWidgets = {

    // T22 — Widget UV Index
    renderUVWidget(containerId, uvIndex = null) {
        const el = document.getElementById(containerId);
        if (!el) return;
        const uv = uvIndex ?? Math.floor(Math.random() * 10) + 1; // Simule si pas de données
        const levels = [
            { max: 2, label: 'Faible', color: '#10b981', emoji: '😊', advice: 'Protection normale. Crème 30+ recommandée.' },
            { max: 5, label: 'Modéré', color: '#f59e0b', emoji: '🕶️', advice: 'SPF 30+ minimum, chapeau. Réduire l\'exposition 11h-16h.' },
            { max: 7, label: 'Élevé', color: '#f97316', emoji: '⚠️', advice: 'SPF 50+ obligatoire ! Couvre-chef + T-shirt anti-UV en eau.' },
            { max: 10, label: 'Très élevé', color: '#ef4444', emoji: '🔥', advice: 'SPF 50+ toutes les 2h. Évite 10h-16h. Combinaison UV.' },
            { max: 20, label: 'Extrême', color: '#8b5cf6', emoji: '☠️', advice: 'Reste à l\'ombre. Si surf: full combi UV + crème waterproof.' },
        ];
        const level = levels.find(l => uv <= l.max) || levels[levels.length - 1];
        const pct = Math.min(100, uv / 12 * 100);
        el.innerHTML = `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:12px;color:#64748b;font-weight:600;letter-spacing:.5px">☀️ INDICE UV</div>
          <div style="font-size:11px;color:#64748b">${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">
          <div style="font-size:42px">${level.emoji}</div>
          <div>
            <div style="font-size:36px;font-weight:900;color:${level.color}">${uv}</div>
            <div style="font-size:14px;font-weight:700;color:${level.color}">${level.label}</div>
          </div>
        </div>
        <div style="background:rgba(255,255,255,.05);border-radius:8px;height:8px;overflow:hidden;margin-bottom:10px">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#10b981,#f59e0b,#ef4444);border-radius:8px;transition:width 1s"></div>
        </div>
        <div style="font-size:12px;color:#94a3b8;line-height:1.5">💡 ${level.advice}</div>
      </div>`;
    },

    // T23 — Widget qualité de l'air (AQI simulé pour les plages françaises)
    renderAQIWidget(containerId, aqi = null) {
        const el = document.getElementById(containerId);
        if (!el) return;
        // L'AQI des zones côtières françaises est généralement excellent (15-35)
        const val = aqi ?? Math.floor(Math.random() * 50) + 10;
        const levels = [
            { max: 50, label: 'Excellent', color: '#10b981', emoji: '🌿', advice: 'Air pur ! Conditions idéales pour surfer.' },
            { max: 100, label: 'Bon', color: '#84cc16', emoji: '👍', advice: 'Air sain. Aucune restriction.' },
            { max: 150, label: 'Moyen', color: '#f59e0b', emoji: '🤔', advice: 'Personnes sensibles: sessions courtes.' },
            { max: 200, label: 'Mauvais', color: '#f97316', emoji: '😷', advice: 'Réduire l\'effort physique en eau.' },
            { max: 999, label: 'Dangereux', color: '#ef4444', emoji: '☠️', advice: 'Éviter toute activité sportive en extérieur.' },
        ];
        const level = levels.find(l => val <= l.max) || levels[levels.length - 1];
        el.innerHTML = `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-size:12px;color:#64748b;font-weight:600;letter-spacing:.5px">🌱 QUALITÉ AIR</div>
          <div style="font-size:11px;color:#64748b">IQA</div>
        </div>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:12px">
          <div style="font-size:36px">${level.emoji}</div>
          <div>
            <div style="font-size:36px;font-weight:900;color:${level.color}">${val}</div>
            <div style="font-size:14px;font-weight:700;color:${level.color}">${level.label}</div>
          </div>
        </div>
        <div style="font-size:12px;color:#94a3b8">💡 ${level.advice}</div>
      </div>`;
    },

    // T24 — Module marées détaillé
    renderTidesWidget(containerId, tides = null) {
        const el = document.getElementById(containerId);
        if (!el) return;
        const now = new Date();
        const h = now.getHours();
        // Simuler 4 marées (pleine/basse alternées)
        const defaultTides = tides || [
            { time: new Date(now.setHours(h - 2, 15)).toISOString(), type: 'low', height: 0.8 },
            { time: new Date(now.setHours(h + 4, 30)).toISOString(), type: 'high', height: 3.8 },
            { time: new Date(now.setHours(h + 10, 45)).toISOString(), type: 'low', height: 0.6 },
            { time: new Date(now.setHours(h + 17, 0)).toISOString(), type: 'high', height: 4.1 },
        ];
        const nowMs = Date.now();
        const next = defaultTides.find(t => new Date(t.time) > nowMs);

        el.innerHTML = `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:18px;padding:18px">
        <div style="font-size:12px;color:#64748b;font-weight:600;letter-spacing:.5px;margin-bottom:12px">🌊 MARÉES</div>
        ${next ? `<div style="background:linear-gradient(135deg,rgba(14,165,233,.1),rgba(14,165,233,.05));border:1px solid rgba(14,165,233,.15);border-radius:12px;padding:12px;margin-bottom:14px">
          <div style="font-size:11px;color:#0ea5e9;font-weight:600;margin-bottom:2px">PROCHAINE MARÉE</div>
          <div style="font-size:22px;font-weight:800;color:#f1f5f9">${next.type === 'high' ? '📈 Pleine mer' : '📉 Basse mer'}</div>
          <div style="font-size:16px;color:#94a3b8">${new Date(next.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · ${next.height}m</div>
        </div>` : ''}
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
          ${defaultTides.map(t => {
            const isPast = new Date(t.time) < nowMs;
            return `<div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:12px;padding:10px;opacity:${isPast ? 0.5 : 1}">
              <div style="font-size:18px;margin-bottom:2px">${t.type === 'high' ? '📈' : '📉'}</div>
              <div style="font-size:13px;font-weight:700;color:${t.type === 'high' ? '#0ea5e9' : '#f59e0b'}">${t.type === 'high' ? 'Pleine' : 'Basse'}</div>
              <div style="font-size:12px;color:#64748b">${new Date(t.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
              <div style="font-size:11px;color:#94a3b8">${t.height}m</div>
            </div>`;
        }).join('')}
        </div>
      </div>`;
    },

    // Rendu d'une grille complète de widgets météo
    renderWeatherGrid(containerId, data = {}) {
        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div id="ww-uv"></div>
        <div id="ww-aqi"></div>
        <div id="ww-tides" style="grid-column:1/-1"></div>
      </div>`;
        this.renderUVWidget('ww-uv', data.uvIndex);
        this.renderAQIWidget('ww-aqi', data.aqi);
        this.renderTidesWidget('ww-tides', data.tides);
    }
};

window.WeatherWidgets = WeatherWidgets;
