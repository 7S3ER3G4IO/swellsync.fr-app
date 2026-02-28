/**
 * SwellSync — Export stats & session (T88/T89)
 * Export PDF bilan de saison + recap annuel type Spotify Wrapped
 */

const SessionExport = {

    // T88 — Export PDF du bilan de saison
    async exportSeasonPDF(userId) {
        if (typeof showToast !== 'undefined') showToast('📄 Génération du PDF...', 'info');

        try {
            const { data: member } = await supabase.from('members').select('display_name,username,level,total_sessions,total_hours,total_waves').eq('auth_id', userId).single();
            const { data: sessions } = await supabase.from('surf_sessions').select('date,spot_name,score,duration_min,waves_count').eq('user_id', userId).order('date', { ascending: false }).limit(50);

            // Construire un HTML imprimable
            const html = this._buildPrintableHTML(member, sessions);
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(html);
                win.document.close();
                setTimeout(() => win.print(), 500);
            }
        } catch (e) {
            if (typeof showToast !== 'undefined') showToast('Erreur export PDF', 'error');
        }
    },

    _buildPrintableHTML(member, sessions) {
        const total_h = Math.round((sessions?.reduce((s, r) => s + (r.duration_min || 0), 0) || 0) / 60);
        const avg_score = sessions?.length ? Math.round(sessions.reduce((s, r) => s + (r.score || 0), 0) / sessions.length) : 0;
        const top_spot = sessions?.length ? (() => {
            const counts = {};
            sessions.forEach(s => { counts[s.spot_name] = (counts[s.spot_name] || 0) + 1; });
            return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
        })() : '—';

        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bilan SwellSync — ${member?.display_name || 'Surfeur'}</title>
<style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto}h1{color:#0ea5e9}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:10px;border:1px solid #e2e8f0;text-align:left}th{background:#f1f5f9}@media print{.no-print{display:none}}</style>
</head><body>
<div class="no-print" style="margin-bottom:20px"><button onclick="window.print()">🖨️ Imprimer</button></div>
<h1>🌊 Bilan de saison SwellSync</h1>
<p><strong>${member?.display_name || member?.username || 'Surfeur'}</strong> · Niveau : ${member?.level || '—'}</p>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:24px 0">
  <div style="padding:16px;background:#f8fafc;border-radius:8px;text-align:center"><div style="font-size:28px;font-weight:800;color:#0ea5e9">${sessions?.length || 0}</div><div>Sessions</div></div>
  <div style="padding:16px;background:#f8fafc;border-radius:8px;text-align:center"><div style="font-size:28px;font-weight:800;color:#10b981">${total_h}h</div><div>En eau</div></div>
  <div style="padding:16px;background:#f8fafc;border-radius:8px;text-align:center"><div style="font-size:28px;font-weight:800;color:#f59e0b">${avg_score}</div><div>Score moy.</div></div>
  <div style="padding:16px;background:#f8fafc;border-radius:8px;text-align:center"><div style="font-size:20px;font-weight:700;color:#8b5cf6">${top_spot}</div><div>Spot favori</div></div>
</div>
<h2>Sessions récentes</h2>
<table><thead><tr><th>Date</th><th>Spot</th><th>Score</th><th>Durée</th><th>Vagues</th></tr></thead><tbody>
${(sessions || []).slice(0, 20).map(s => `<tr><td>${s.date?.substring(0, 10) || '—'}</td><td>${s.spot_name || '—'}</td><td>${s.score || '—'}</td><td>${s.duration_min ? Math.round(s.duration_min / 60 * 10) / 10 + 'h' : '—'}</td><td>${s.waves_count || '—'}</td></tr>`).join('')}
</tbody></table>
<p style="margin-top:40px;color:#94a3b8;font-size:12px">Généré le ${new Date().toLocaleDateString('fr-FR')} par SwellSync · swellsync.fr</p>
</body></html>`;
    },

    // T89 — Recap annuel type Spotify Wrapped
    async generateYearlyRecap(userId, year = new Date().getFullYear()) {
        try {
            const start = `${year}-01-01`, end = `${year}-12-31`;
            const { data: sessions } = await supabase
                .from('surf_sessions').select('date,spot_name,duration_min,waves_count,score')
                .eq('user_id', userId).gte('date', start).lte('date', end);

            if (!sessions?.length) { if (typeof showToast !== 'undefined') showToast('Pas encore de sessions cette année.', 'info'); return null; }

            const total_h = Math.round(sessions.reduce((s, r) => s + (r.duration_min || 0), 0) / 60);
            const total_waves = sessions.reduce((s, r) => s + (r.waves_count || 0), 0);
            const best_score = Math.max(...sessions.map(s => s.score || 0));
            const best_month = (() => {
                const months = {}; const names = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                sessions.forEach(s => { const m = new Date(s.date).getMonth(); months[m] = (months[m] || 0) + 1; });
                const best = Object.entries(months).sort((a, b) => b[1] - a[1])[0];
                return best ? names[best[0]] : '—';
            })();
            const top_spot = (() => {
                const c = {}; sessions.forEach(s => { c[s.spot_name] = (c[s.spot_name] || 0) + 1; });
                return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
            })();

            return { year, sessions: sessions.length, total_h, total_waves, best_score, best_month, top_spot };
        } catch { return null; }
    },

    // Afficher le recap sous forme de carte narrative
    renderRecapCard(recap, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !recap) return;
        container.innerHTML = `
      <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid rgba(14,165,233,.2);border-radius:24px;padding:32px;text-align:center">
        <div style="font-size:36px;margin-bottom:8px">🌊</div>
        <h2 style="font-size:22px;font-weight:800;margin:0 0 24px">${recap.year} en chiffres</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
          <div style="background:rgba(14,165,233,.1);border-radius:16px;padding:16px"><div style="font-size:32px;font-weight:900;color:#0ea5e9">${recap.sessions}</div><div style="color:#64748b;font-size:13px">sessions</div></div>
          <div style="background:rgba(16,185,129,.1);border-radius:16px;padding:16px"><div style="font-size:32px;font-weight:900;color:#10b981">${recap.total_h}h</div><div style="color:#64748b;font-size:13px">en eau</div></div>
          <div style="background:rgba(245,158,11,.1);border-radius:16px;padding:16px"><div style="font-size:32px;font-weight:900;color:#f59e0b">${recap.total_waves}</div><div style="color:#64748b;font-size:13px">vagues</div></div>
          <div style="background:rgba(139,92,246,.1);border-radius:16px;padding:16px"><div style="font-size:28px;font-weight:900;color:#8b5cf6">${recap.best_score}</div><div style="color:#64748b;font-size:13px">meilleur score</div></div>
        </div>
        <div style="background:rgba(255,255,255,.04);border-radius:14px;padding:14px;margin-bottom:14px;font-size:15px;color:#f1f5f9">📍 Spot préféré : <strong>${recap.top_spot}</strong></div>
        <div style="background:rgba(255,255,255,.04);border-radius:14px;padding:14px;margin-bottom:20px;font-size:15px;color:#f1f5f9">🗓️ Meilleur mois : <strong>${recap.best_month}</strong></div>
        <button type="button" onclick="SessionExport.exportSeasonPDF(window._currentUser?.id)" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;border-radius:14px;padding:14px 24px;color:white;font-weight:700;cursor:pointer;font-size:15px">📄 Exporter en PDF</button>
      </div>`;
    }
};

window.SessionExport = SessionExport;
