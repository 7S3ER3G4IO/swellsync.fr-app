/**
 * SwellSync — Coaching & Apprentissage
 * Conseils personnalisés, tutoriels, analyse post-session
 */

const COACHING_TIPS = {
    rookie: [
        { title: "La sécurité avant tout", icon: "⛑️", text: "Toujours tenir sa planche entre toi et la vague. Ne jamais lâcher ta planche vers d'autres surfeurs." },
        { title: "La position allongée", icon: "🤙", text: "Allonge-toi au centre de ta planche, les orteils à ~20cm du tail. Cambre légèrement le dos pour lever la tête." },
        { title: "Le paddle efficace", icon: "💪", text: "Bras tendus, doigts serrés. Entre bien dans l'eau, tire jusqu'à la cuisse. Alternatif et rythmé." },
        { title: "Choisir sa vague", icon: "🌊", text: "Commence par des vagues molles (1-2 pieds). Positionne-toi dans la zone de peak. Regarde venir la vague." },
        { title: "Le take-off", icon: "🏄", text: "Quand la planche accélère avec la vague, fais 2-3 coups de pagaie forts, puis pousse sur les bras et saute les pieds simultanement." },
    ],
    debutant: [
        { title: "Le dog-paddle sous les mousses", icon: "🌊", text: "Passe sous la mousse plutôt que de grimper dessus. Pointe ta planche vers le fond." },
        { title: "Lire les vagues", icon: "👁️", text: "Observe 10 min avant d'entrer à l'eau. Repère le peak, les courants et où les locaux se positionnent." },
        { title: "Le bottom turn", icon: "↩️", text: "Après le take-off, oriente-toi vers le bas de la vague pour prendre de la vitesse avant de remonter." },
        { title: "La règle de priorité", icon: "📋", text: "Priorité au surfeur le plus proche du peak. Ne drop jamais quelqu'un qui est déjà sur la vague." },
        { title: "Condition physique", icon: "🏊", text: "30 min de natation 2x/semaine améliore drastiquement ton paddle. Le stretch épaules/dos est essentiel." },
    ],
    intermediaire: [
        { title: "Le cutback", icon: "✂️", text: "Quand tu arrives à la section plate, renverse ton poids vers le talon et fais tourner la planche à 180° vers la vague." },
        { title: "Duck dive sur shortboard", icon: "🦆", text: "30cm avant la vague, pousse sur le nose, genou sur le tail. Ton corps suit naturellement sous la vague." },
        { title: "La tube reading", icon: "🎯", text: "Observe les sections creuses. Le speed est la clé: accélère dans les sections molles, freine dans les sections creuses." },
        { title: "Les rapers / snap", icon: "⚡", text: "Vise le tiers supérieur de la vague. Charge sur la backfoot, projette les épaules et tourne les hanches." },
    ],
};

const TRAINING_PROGRAMS = [
    {
        id: 'beginners_7days',
        title: '7 jours pour décoller',
        level: 'rookie',
        icon: '🚀',
        days: [
            { day: 1, task: 'Étirements surf + position allongée sur la planche (à sec)' },
            { day: 2, task: 'Session 30min : paddle uniquement, sans essayer de se lever' },
            { day: 3, task: 'Take-off à sec x 20 répétitions sur la plage' },
            { day: 4, task: 'Session 45min : 10 tentatives de take-off dans les mousses' },
            { day: 5, task: 'Repos actif — natation 20min + vidéo tutoriel take-off' },
            { day: 6, task: 'Session 1h — focus: se lever sur 50% des vagues' },
            { day: 7, task: 'Bilan : analyser les sessions de la semaine dans l\'app' },
        ]
    },
    {
        id: 'progression_30days',
        title: '30 jours pour progresser',
        level: 'debutant',
        icon: '📈',
        days: [
            { day: 1, task: 'Évaluation niveau : session libre, note ton score moyen' },
            { day: 7, task: 'Objectif : rester debout sur 70% des vagues mousses' },
            { day: 14, task: 'Objectif : 1er take-off sur vague verte réussi' },
            { day: 21, task: 'Objectif : bottom turn esquissé' },
            { day: 30, task: 'Bilan : comparer stats J1 vs J30' },
        ]
    }
];

function getCoachingTips(level) {
    return COACHING_TIPS[level] || COACHING_TIPS.rookie;
}

function renderCoachingTip(container, tip) {
    if (!container) return;
    container.innerHTML = `
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:24px;margin-bottom:12px">
      <div style="font-size:36px;margin-bottom:12px">${tip.icon}</div>
      <h3 style="font-size:18px;font-weight:700;color:#f1f5f9;margin:0 0 10px">${tip.title}</h3>
      <p style="color:#94a3b8;font-size:15px;line-height:1.7;margin:0">${tip.text}</p>
    </div>
  `;
}

// Analyse post-session
function analyzeSession(sessionData) {
    const { duration, wave_count, score } = sessionData;
    const durationMin = Math.round(duration / 60);
    const waveRate = wave_count && duration ? (wave_count / (duration / 60)).toFixed(1) : 0;

    const analysis = [];

    if (score >= 80) analysis.push('🔥 Excellente session ! Score au-dessus de 80.');
    else if (score >= 60) analysis.push('✅ Bonne session. Continue comme ça !');
    else if (score < 40) analysis.push('💪 Session difficile — les conditions étaient probablement délicates.');

    if (waveRate >= 3) analysis.push(`🌊 Super rythme : ${waveRate} vagues/min !`);
    else if (waveRate < 1 && wave_count > 0) analysis.push('⏳ Prends plus de vagues — n\'hésite pas à partir !');

    if (durationMin < 30) analysis.push('⏱️ Session courte — vise 45min+ pour vraiment progresser.');
    else if (durationMin >= 90) analysis.push('🏆 Marathon ! Plus d\'une heure et demie en eau — respect.');

    return analysis;
}

window.getCoachingTips = getCoachingTips;
window.renderCoachingTip = renderCoachingTip;
window.analyzeSession = analyzeSession;
window.TRAINING_PROGRAMS = TRAINING_PROGRAMS;
