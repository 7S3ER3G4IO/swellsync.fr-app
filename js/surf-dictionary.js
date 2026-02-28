/**
 * SwellSync — Dictionnaire surf illustré (T97)
 * + Quiz techniques de base (T99)
 */

const SurfDictionary = {

    terms: [
        { term: 'Drop', emoji: '🏄', cat: 'Manoeuvre', def: 'Prise de la vague et descente initiale de la face. La première phase du ride.' },
        { term: 'Bottom Turn', emoji: '↩️', cat: 'Manoeuvre', def: 'Virage en bas de la vague pour prendre de la vitesse et s\'engager dans la partie creuse.' },
        { term: 'Cutback', emoji: '🔄', cat: 'Manoeuvre', def: 'Virage prononcé ramenant le surfeur vers la partie la plus puissante de la vague (le curl).' },
        { term: 'Tube / Barrel', emoji: '🌀', cat: 'Figure', def: 'Passage dans le tunnel formé par la vague qui se referme. Le Graal du surf.' },
        { term: 'Floater', emoji: '🌊', cat: 'Figure', def: 'Montée sur la lèvre de la vague qui dégringole pour finir de l\'autre côté.' },
        { term: 'Snap', emoji: '⚡', cat: 'Manoeuvre', def: 'Virage très rapide et agressif sur la lèvre, générant des gerbes d\'eau.' },
        { term: 'Aérien', emoji: '✈️', cat: 'Figure avancée', def: 'Décoller de la vague et atterrir après une figure dans les airs.' },
        { term: 'Duck Dive', emoji: '🦆', cat: 'Technique', def: 'Passer sous une vague en plongeant avec sa planche pour éviter d\'être renvoyé.' },
        { term: 'Take-off', emoji: '🚀', cat: 'Technique', def: 'Pop-up : action de se lever sur la planche pour prendre la vague.' },
        { term: 'Paddle', emoji: '🏊', cat: 'Technique', def: 'Rame à plat ventre sur la planche pour avancer et prendre les vagues.' },
        { term: 'Peak', emoji: '⛰️', cat: 'Vague', def: 'Point le plus haut de la vague, là où elle commence à déferler.' },
        { term: 'Close Out', emoji: '🚫', cat: 'Vague', def: 'Vague qui déferle d\'un seul coup sur toute la longueur, impossible à surfer.' },
        { term: 'Set', emoji: '📦', cat: 'Vague', def: 'Série de vagues plus grosses qui arrivent en groupe (généralement 3 à 8 vagues).' },
        { term: 'Lull', emoji: '😴', cat: 'Vague', def: 'Période entre deux sets, calme plat momentané.' },
        { term: 'Line Up', emoji: '📍', cat: 'Spot', def: 'Zone d\'attente des surfeurs, là où les vagues commencent à casser.' },
        { term: 'Inside', emoji: '🌊', cat: 'Spot', def: 'Zone dans laquelle les vagues ont déjà déferlé, entre la plage et le line up.' },
        { term: 'Offshore', emoji: '🌬️', cat: 'Conditions', def: 'Vent soufflant de la terre vers la mer : creuse et lisse les vagues. Condition idéale.' },
        { term: 'Onshore', emoji: '💨', cat: 'Conditions', def: 'Vent soufflant de la mer vers la terre : écrase et détériore les vagues.' },
        { term: 'Houle', emoji: '🌊', cat: 'Conditions', def: 'Ondulations de la mer générées par des tempêtes lointaines. Caractérisée par sa hauteur et sa période.' },
        { term: 'Période (swell)', emoji: '⏱️', cat: 'Conditions', def: 'Temps en secondes entre deux vagues. Plus c\'est haut, plus les vagues ont de l\'énergie.' },
        { term: 'Leash', emoji: '🔗', cat: 'Équipement', def: 'Cordon élastique reliant la planche à la cheville du surfeur.' },
        { term: 'Wax', emoji: '🕯️', cat: 'Équipement', def: 'Cire appliquée sur le pont de la planche pour éviter de glisser.' },
        { term: 'Kook', emoji: '😅', cat: 'Humour', def: 'Débutant ou surfeur inexpérimenté. Ne pas prendre la priorité = comportement de kook !' },
        { term: 'Priority', emoji: '👑', cat: 'Étiquette', def: 'En compétition : droit de prendre la prochaine vague sans opposition. Sur les spots : le surfeur le plus proche du peak passe en premier.' },
    ],

    _filter: '',
    _cat: 'Tous',

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const cats = ['Tous', 'Manoeuvre', 'Figure', 'Technique', 'Vague', 'Spot', 'Conditions', 'Équipement', 'Étiquette'];
        container.innerHTML = `
      <div style="margin-bottom:20px">
        <input type="text" id="dict-search" placeholder="🔍 Chercher un terme..." oninput="SurfDictionary.filter(this.value)"
          style="width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px 16px;color:#f1f5f9;font-size:15px;outline:none;box-sizing:border-box">
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px">
        ${cats.map(c => `<button type="button" onclick="SurfDictionary.setCategory('${c}')" id="cat-${c.replace(/\s/g, '_')}"
          style="padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:${c === 'Tous' ? 'rgba(14,165,233,.2)' : 'rgba(255,255,255,.04)'};color:${c === 'Tous' ? '#0ea5e9' : '#64748b'}">${c}</button>`).join('')}
      </div>
      <div id="dict-terms"></div>`;

        this._renderTerms();
    },

    filter(query) {
        this._filter = query;
        this._renderTerms();
    },

    setCategory(cat) {
        this._cat = cat;
        document.querySelectorAll('[id^="cat-"]').forEach(btn => {
            const active = btn.id === 'cat-' + cat.replace(/\s/g, '_');
            btn.style.background = active ? 'rgba(14,165,233,.2)' : 'rgba(255,255,255,.04)';
            btn.style.color = active ? '#0ea5e9' : '#64748b';
        });
        this._renderTerms();
    },

    _renderTerms() {
        const el = document.getElementById('dict-terms');
        if (!el) return;
        const filtered = this.terms.filter(t => {
            const matchCat = this._cat === 'Tous' || t.cat === this._cat;
            const matchSearch = !this._filter || t.term.toLowerCase().includes(this._filter.toLowerCase()) || t.def.toLowerCase().includes(this._filter.toLowerCase());
            return matchCat && matchSearch;
        });
        if (!filtered.length) { el.innerHTML = '<div class="empty-state"><div>📖</div><h3>Aucun terme trouvé</h3></div>'; return; }
        el.innerHTML = filtered.map(t => `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:16px;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:24px">${t.emoji}</span>
          <div>
            <div style="font-weight:700;color:#f1f5f9;font-size:15px">${t.term}</div>
            <div style="font-size:11px;background:rgba(14,165,233,.1);border-radius:6px;padding:2px 8px;color:#0ea5e9;display:inline-block;margin-top:2px">${t.cat}</div>
          </div>
        </div>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0">${t.def}</p>
      </div>`).join('');
    }
};

// ── T99 — Quiz techniques de base ────────────────────────────────────
const SurfQuiz = {
    questions: [
        { q: 'Quel vent est idéal pour surfer ?', options: ['Onshore', 'Offshore', 'Cross-shore', 'Calme plat'], answer: 1, explanation: 'L\'offshore (vent de terre) creuse et lisse les vagues.' },
        { q: 'Qu\'est-ce qu\'un "set" ?', options: ['Un type de planche', 'Une série de grosses vagues', 'Un mouvement de surf', 'La zone d\'attente'], answer: 1, explanation: 'Un set est un groupe de vagues plus grosses qui arrivent ensemble.' },
        { q: 'Le "duck dive" sert à :', options: ['Prendre une vague', 'Passer sous une vague', 'Faire un tube', 'Ramer plus vite'], answer: 1, explanation: 'Le duck dive permet de passer sous les vagues sans être renvoyé vers la plage.' },
        { q: 'Une période de 14 secondes signifie :', options: ['Des vagues faibles', 'Des vagues organisées et puissantes', 'Du vent fort', 'Peu de vagues'], answer: 1, explanation: 'Une haute période indique une houle de fond avec beaucoup d\'énergie.' },
        { q: 'La "priorité" dans un spot signifie :', options: ['Tu es le meilleur', 'Tu as le droit de prendre la prochaine vague', 'Tu paies pour surfer', 'Tu connais les locaux'], answer: 1 },
    ],
    _current: 0, _score: 0,

    start(containerId) {
        this._current = 0; this._score = 0;
        this._render(containerId);
    },

    _render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (this._current >= this.questions.length) { this._showResult(container); return; }
        const q = this.questions[this._current];
        container.innerHTML = `
      <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:24px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:#64748b;margin-bottom:16px"><span>Question ${this._current + 1}/${this.questions.length}</span><span>Score: ${this._score}</span></div>
        <h3 style="font-size:17px;font-weight:700;color:#f1f5f9;margin:0 0 20px">${q.q}</h3>
        ${q.options.map((opt, i) => `<button type="button" onclick="SurfQuiz._answer(${i},'${containerId}')" style="display:block;width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:12px 16px;color:#f1f5f9;text-align:left;cursor:pointer;margin-bottom:8px;font-size:14px">${String.fromCharCode(65 + i)}. ${opt}</button>`).join('')}
      </div>`;
    },

    _answer(chosen, containerId) {
        const q = this.questions[this._current];
        const correct = chosen === q.answer;
        if (correct) this._score++;
        const container = document.getElementById(containerId);
        const buttons = container.querySelectorAll('button');
        buttons.forEach((btn, i) => {
            btn.disabled = true;
            if (i === q.answer) btn.style.background = 'rgba(16,185,129,.2)';
            else if (i === chosen && !correct) btn.style.background = 'rgba(239,68,68,.2)';
        });
        if (q.explanation) {
            const exp = document.createElement('p');
            exp.style.cssText = 'color:#94a3b8;font-size:13px;padding:12px;background:rgba(14,165,233,.06);border-radius:10px;margin-top:8px';
            exp.textContent = '💡 ' + q.explanation;
            container.querySelector('div').appendChild(exp);
        }
        setTimeout(() => { this._current++; this._render(containerId); }, 1500);
    },

    _showResult(container) {
        const pct = Math.round(this._score / this.questions.length * 100);
        const grade = pct >= 80 ? ['🏆', 'Excellent ! Tu maîtrises les bases.'] : pct >= 60 ? ['👍', 'Bien ! Encore un peu de pratique.'] : ['📖', 'Continue à apprendre — lis le dictionnaire !'];
        container.innerHTML = `<div style="text-align:center;padding:32px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px">
      <div style="font-size:52px;margin-bottom:16px">${grade[0]}</div>
      <div style="font-size:32px;font-weight:900;color:#0ea5e9;margin-bottom:8px">${this._score}/${this.questions.length}</div>
      <div style="color:#94a3b8;margin-bottom:24px">${grade[1]}</div>
      <button type="button" onclick="SurfQuiz.start('${container.id}')" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;border-radius:14px;padding:14px 28px;color:white;font-weight:700;cursor:pointer">🔄 Recommencer</button>
    </div>`;
    }
};

window.SurfDictionary = SurfDictionary;
window.SurfQuiz = SurfQuiz;
