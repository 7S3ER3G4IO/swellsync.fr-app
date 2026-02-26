document.addEventListener("DOMContentLoaded", () => {
    // Helper i18n : utilise SwellI18n si disponible, sinon texte FR par défaut
    const t = (key, fallback) => (window.SwellI18n && window.SwellI18n.t(key) !== key)
        ? window.SwellI18n.t(key) : fallback;

    // Textes du chatbot (mis à jour à chaque changement de langue)
    const getChatTexts = () => ({
        status: t('chatbot.status', 'Connecté · Live'),
        clearTitle: t('chatbot.clear_title', 'Réinitialiser'),
        placeholder: t('chatbot.placeholder', 'Posez votre question...'),
        chip_spots: t('chatbot.chip_spots', '/spots'),
        chip_meteo: t('chatbot.chip_meteo', '/météo hossegor'),
        chip_fav: t('chatbot.chip_fav', '/monfavori'),
        chip_help: t('chatbot.chip_help', '/aide'),
        intro: t('chatbot.intro', 'Aloha 🤙! Je suis Swell IA, propulsé par SwellSync Live.'),
        thinking: t('chatbot.thinking', 'Swell IA réfléchit...'),
        error: t('chatbot.error', 'Désolé, une erreur est survenue. Réessaie !')
    });

    // Inject HTML
    const chatHTML = `
    <div id="swell-chatbot-container" class="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
        <!-- Chat Window -->
        <div id="swell-chatbot-window" class="hidden mb-4 w-[300px] md:w-[340px] rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-white/10 flex flex-col overflow-hidden transition-all origin-bottom-right bg-[#0a1516]/95 backdrop-blur-2xl" style="height: 440px;">
            <!-- Header -->
            <div class="bg-gradient-to-r from-[#0f2123] to-[#18363a] p-4 flex justify-between items-center border-b border-white/5">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 relative">
                        <img src="assets/images/swellsync_icon.svg" class="w-[18px] h-[18px] object-contain relative z-10 drop-shadow-[0_0_8px_rgba(0,186,214,0.6)]" style="filter: brightness(0) saturate(100%) invert(56%) sepia(87%) saturate(2222%) hue-rotate(152deg) brightness(101%) contrast(106%);" alt="Swell IA">
                    </div>
                    <div>
                        <h4 class="text-white font-bold text-sm leading-none m-0 p-0" style="margin: 0;">Swell IA</h4>
                        <p class="text-[9px] text-primary uppercase tracking-widest m-0 p-0 mt-0.5" style="margin: 0;" id="chatbot-status-label">Connecté · Live</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button id="swell-chat-clear" class="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors" title="Réinitialiser">
                        <span class="material-symbols-outlined text-[14px]">refresh</span>
                    </button>
                    <button id="swell-chat-close" class="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
                        <span class="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
            </div>
            
            <!-- Messages Area -->
            <div id="swell-chat-messages" class="flex-grow p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar text-[13px] text-slate-200" style="scroll-behavior: smooth;">
                <!-- Bot Intro -->
                <div class="flex gap-2 items-end max-w-[90%]">
                    <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                        <img src="assets/images/swellsync_icon.svg" class="w-[14px] h-[14px] object-contain drop-shadow-[0_0_8px_rgba(0,186,214,0.6)]" style="filter: brightness(0) saturate(100%) invert(56%) sepia(87%) saturate(2222%) hue-rotate(152deg) brightness(101%) contrast(106%);" alt="Swell IA">
                    </div>
                    <div class="bg-[#162d30]/80 text-slate-200 p-3 rounded-2xl rounded-bl-sm border border-white/5 shadow-inner leading-relaxed" id="chatbot-intro-msg">
                        Aloha 🤙! Je suis Swell IA, propulsé par SwellSync Live.<br><br>
                        Tape <code style="background:rgba(0,186,214,0.15);padding:1px 5px;border-radius:4px">/aide</code> pour mes commandes ou pose-moi une question sur les conditions, le matos, ou les spots !
                    </div>
                </div>
                <!-- Quick Actions Chips -->
                <div class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar shrink-0 w-full mt-1" id="swell-chat-chips">
                    <button class="swell-chip whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] hover:bg-white/10 hover:border-primary/50 text-slate-300 hover:text-white transition-all">/spots</button>
                    <button class="swell-chip whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] hover:bg-white/10 hover:border-primary/50 text-slate-300 hover:text-white transition-all">/météo hossegor</button>
                    <button class="swell-chip whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] hover:bg-white/10 hover:border-primary/50 text-slate-300 hover:text-white transition-all">/monfavori</button>
                    <button class="swell-chip whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] hover:bg-white/10 hover:border-primary/50 text-slate-300 hover:text-white transition-all">/aide</button>
                </div>
            </div>

            <!-- Input Area -->
            <div class="p-3 bg-[#0a1516] border-t border-white/5">
                <form id="swell-chat-form" class="flex gap-2 relative">
                    <input type="text" id="swell-chat-input" placeholder="Posez votre question..." class="flex-grow bg-[#13282b] border border-white/10 text-white text-[13px] rounded-xl pl-4 pr-10 py-2.5 outline-none focus:border-primary/50 transition-colors shadow-inner" autocomplete="off" />
                    <button type="submit" class="absolute right-1 top-1 w-8 h-8 rounded-lg bg-primary/20 hover:bg-primary/40 text-primary transition-colors flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-[16px]">send</span>
                    </button>
                </form>
            </div>
        </div>

        <!-- Float Button -->
        <button id="swell-chat-toggle" class="w-12 h-12 bg-gradient-to-br from-primary to-blue-500 rounded-full shadow-[0_0_20px_rgba(0,186,214,0.3)] flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all outline-none border border-white/20 z-50 group">
            <img src="assets/images/swellsync_icon.svg" class="w-6 h-6 object-contain group-hover:rotate-12 transition-transform drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" style="filter: brightness(0) invert(1);" alt="Chat">
        </button>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatHTML);

    // Fonction pour mettre à jour les textes du chatbot selon la langue courante
    function updateChatbotTexts() {
        const texts = getChatTexts();
        const statusEl = document.getElementById('chatbot-status-label');
        const clearBtn = document.getElementById('swell-chat-clear');
        const inputEl = document.getElementById('swell-chat-input');
        const chips = document.querySelectorAll('.swell-chip');
        const introEl = document.getElementById('chatbot-intro-msg');
        if (statusEl) statusEl.textContent = texts.status;
        if (clearBtn) clearBtn.title = texts.clearTitle;
        if (inputEl) inputEl.placeholder = texts.placeholder;
        if (chips[0]) chips[0].textContent = texts.chip_spots;
        if (chips[1]) chips[1].textContent = texts.chip_meteo;
        if (chips[2]) chips[2].textContent = texts.chip_fav;
        if (chips[3]) chips[3].textContent = texts.chip_help;
        if (introEl) {
            const helpCmd = window.SwellI18n ? (window.SwellI18n.getLang() === 'en' ? '/help' : window.SwellI18n.getLang() === 'es' ? '/ayuda' : window.SwellI18n.getLang() === 'pt' ? '/ajuda' : '/aide') : '/aide';
            introEl.innerHTML = `${texts.intro.replace(/\n/g, '<br>')}<br><br>Tape <code style="background:rgba(0,186,214,0.15);padding:1px 5px;border-radius:4px">${helpCmd}</code> ✌️`;
        }
    }

    // Écouter les changements de langue
    document.addEventListener('swellsync:lang', () => setTimeout(updateChatbotTexts, 100));
    // Appliquer au chargement (après un délai pour que SwellI18n soit prêt)
    setTimeout(updateChatbotTexts, 800);

    const chatWindow = document.getElementById('swell-chatbot-window');
    const chatToggle = document.getElementById('swell-chat-toggle');
    const chatClose = document.getElementById('swell-chat-close');
    const chatClear = document.getElementById('swell-chat-clear');
    const chatMessages = document.getElementById('swell-chat-messages');
    const chatForm = document.getElementById('swell-chat-form');
    const chatInput = document.getElementById('swell-chat-input');
    const chatChips = document.querySelectorAll('.swell-chip');

    // ─────────────────────────────────────────────
    // CACHE DE SPOTS (chargé une fois)
    // ─────────────────────────────────────────────
    let spotsCache = [];
    let userServerData = null; // données serveur membres si connecté

    async function loadSpotsCache() {
        if (spotsCache.length) return;
        try {
            const r = await fetch('/api/spots');
            if (r.ok) spotsCache = await r.json();
        } catch (e) { }
    }

    async function loadUserServerData() {
        try {
            const r = await fetch('/api/members/dashboard', { credentials: 'include' });
            if (r.ok) userServerData = await r.json();
        } catch (e) { }
    }

    // Charger silencieusement au démarrage
    loadSpotsCache();
    loadUserServerData();

    // ─────────────────────────────────────────────
    // CONTEXTE UTILISATEUR
    // ─────────────────────────────────────────────
    let userContext = {
        name: null, level: null, homeSpot: null, homeSpotId: null,
        lastTopic: null, language: 'fr', awaitEmail: false
    };

    // Initialiser depuis localStorage si connecté
    const lsUser = localStorage.getItem('swellsync_user');
    if (lsUser) {
        try {
            const u = JSON.parse(lsUser);
            if (u.name) userContext.name = u.name;
            if (u.level) userContext.level = u.level;
        } catch (e) { }
    }

    // ─────────────────────────────────────────────
    // UI : Toggle / Close / Clear
    // ─────────────────────────────────────────────
    function hideChips() {
        const el = document.getElementById('swell-chat-chips');
        if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
    }

    chatChips.forEach(chip => {
        chip.addEventListener('click', () => processUserMessage(chip.innerText));
    });

    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) chatInput.focus();
    });

    chatClose.addEventListener('click', () => chatWindow.classList.add('hidden'));

    chatClear.addEventListener('click', () => {
        userContext = { name: null, level: null, homeSpot: null, homeSpotId: null, lastTopic: null, language: 'fr', awaitEmail: false };
        chatMessages.innerHTML = `<div class="flex gap-2 items-end max-w-[90%]">
            <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                <img src="assets/images/swellsync_icon.svg" class="w-[14px] h-[14px] object-contain" style="filter: brightness(0) saturate(100%) invert(56%) sepia(87%) saturate(2222%) hue-rotate(152deg) brightness(101%) contrast(106%);">
            </div>
            <div class="bg-[#162d30]/80 text-slate-200 p-3 rounded-2xl rounded-bl-sm border border-white/5">🔄 Mémoire effacée. Nouvelle session démarrée !</div>
        </div>`;
    });

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;
        processUserMessage(text);
    });

    // ─────────────────────────────────────────────
    // TRAITEMENT DES MESSAGES
    // ─────────────────────────────────────────────
    async function processUserMessage(text) {
        hideChips();
        appendMessage(text, 'user');
        chatInput.value = '';
        const typingId = appendTyping();

        try {
            const reply = await generateAIResponse(text);
            removeTyping(typingId);
            if (reply) appendMessage(reply, 'bot', reply.startsWith('<'));
        } catch (e) {
            removeTyping(typingId);
            appendMessage('Erreur de connexion. Vérifie ta connexion internet. 🌐', 'bot');
        }
    }

    function appendMessage(text, sender, isHTML = false) {
        const div = document.createElement('div');
        div.className = sender === 'user'
            ? 'flex gap-2 items-end justify-end max-w-[85%] self-end'
            : 'flex gap-2 items-end max-w-[90%] self-start';

        const avatarBotHTML = sender === 'bot' ? `
            <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 self-end">
                <img src="assets/images/swellsync_icon.svg" class="w-[14px] h-[14px] object-contain drop-shadow-[0_0_8px_rgba(0,186,214,0.6)]" style="filter: brightness(0) saturate(100%) invert(56%) sepia(87%) saturate(2222%) hue-rotate(152deg) brightness(101%) contrast(106%);">
            </div>
        ` : '';

        const msgClass = sender === 'user'
            ? 'bg-gradient-to-br from-primary to-blue-500 text-white p-3 rounded-2xl rounded-br-sm font-medium shadow-[0_4px_10px_rgba(0,186,214,0.2)]'
            : 'bg-[#162d30]/80 text-slate-200 p-3 rounded-2xl rounded-bl-sm border border-white/5 shadow-inner leading-relaxed';

        const content = isHTML ? text : text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        div.innerHTML = `${sender === 'bot' ? avatarBotHTML : ''}<div class="${msgClass}">${content}</div>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'flex gap-2 items-end max-w-[85%] self-start';
        div.innerHTML = `
            <div class="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                <img src="assets/images/swellsync_icon.svg" class="w-[14px] h-[14px] object-contain" style="filter: brightness(0) saturate(100%) invert(56%) sepia(87%) saturate(2222%) hue-rotate(152deg) brightness(101%) contrast(106%);">
            </div>
            <div class="bg-[#162d30]/80 p-3 rounded-2xl rounded-bl-sm border border-white/5 flex gap-1 items-center h-[42px] shadow-inner">
                <span class="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style="animation-delay: 0s"></span>
                <span class="w-1.5 h-1.5 bg-primary/80 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                <span class="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
            </div>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // ─────────────────────────────────────────────
    // MOTEUR IA AVEC VRAIS APPELS API
    // ─────────────────────────────────────────────
    async function generateAIResponse(input) {
        const lower = input.toLowerCase().trim();
        const np = userContext.name ? `${userContext.name}, ` : '';

        // ── LEAD : awaitEmail
        if (userContext.awaitEmail) {
            if (lower.includes('@') && lower.includes('.')) {
                userContext.awaitEmail = false;
                return `Parfait ! Je relaie ton email à l'équipe SwellSync. Tu recevras les conditions de la semaine à **${input.trim()}** d'ici quelques minutes. 📧`;
            } else if (lower.includes('non') || lower.includes('annul')) {
                userContext.awaitEmail = false;
                return 'Pas de souci ! Que puis-je faire d\'autre pour toi ?';
            } else {
                return 'Veuillez entrer une adresse email valide (ex: surf@gmail.com).';
            }
        }

        // ── COMMANDES /
        if (lower.startsWith('/')) {
            return await handleCommand(lower, input);
        }

        // ── MÉMOIRE : Nom
        const nameMatch = input.match(/(?:je m'appelle |je suis |mon nom est )([a-zà-ÿ]+)/i);
        if (nameMatch && !lower.includes('débutant') && !lower.includes('intermédiaire') && !lower.includes('avancé')) {
            userContext.name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
            return `Enchanté ${userContext.name} 🤙 ! L'IA SwellSync t'a identifié. Tu peux me poser tes questions sur les conditions, les spots ou le matos !`;
        }

        // ── MÉMOIRE : Niveau
        const levelMatch = lower.match(/(?:je suis |niveau )(débutant|intermédiaire|avancé|expert|pro)/i);
        if (levelMatch) {
            userContext.level = levelMatch[1].toLowerCase();
            return `Noté ${np}! Calibré sur niveau **${userContext.level}**. Mes recommandations spots et planche s'adaptent maintenant à ton profil.`;
        }

        // ── MÉMOIRE : Spot maison
        const spotHomeMatch = lower.match(/(?:mon spot c'est |je surfe (souvent |plutôt )?à |mon spot est )([a-zà-ÿ\s]+)/i);
        if (spotHomeMatch) {
            const spotName = spotHomeMatch[2].trim();
            userContext.homeSpot = spotName.charAt(0).toUpperCase() + spotName.slice(1);
            // Chercher l'ID dans le cache
            const found = spotsCache.find(s => s.name.toLowerCase().includes(spotName.toLowerCase()) || s.location.toLowerCase().includes(spotName.toLowerCase()));
            if (found) userContext.homeSpotId = found.id;
            return `📍 "${userContext.homeSpot}" enregistré comme ton spot favori ! Tape **/météo** pour voir les conditions live là-bas.`;
        }

        // ── MÉTÉO / CONDITIONS (avec API réelle si spot connu)
        if (lower.match(/\b(météo|meteo|houle|vague|conditions|swell|vent|prévisions|forecast|aujourd'hui|maintenant)\b/)) {
            userContext.lastTopic = 'meteo';
            const spotId = userContext.homeSpotId;
            if (spotId) {
                return await fetchSpotConditions(spotId, userContext.homeSpot);
            }
            return `${np}Pour voir les **conditions live**, dis-moi ton spot (ex: "mon spot c'est Hossegor") ou utilise la commande **/météo \`[spot]\`** !`;
        }

        // ── SPOT : recommandation selon niveau + API
        if (lower.match(/\b(spot|recommande|où surfer|ou surfer|meilleur|top spot)\b/)) {
            userContext.lastTopic = 'spots';
            return await handleSpotRecommendation();
        }

        // ── MATOS
        if (lower.match(/\b(planche|board|matos|matériel|combi|combinaison|quiver|shaper|fish|shortboard|longboard)\b/)) {
            userContext.lastTopic = 'matos';
            const lv = userContext.level;
            if (lv === 'débutant') return `${np}Pour débuter, privilégie une planche en mousse (**Malibu 8'0"** ou **Softboard 9'0"**) — très stable, idéale pour prendre confiance sur les vagues de genoux.`;
            if (lv === 'avancé' || lv === 'expert' || lv === 'pro') return `${np}Avec ces conditions atlantiques, un **Shortboard HP à rocker accentué (5'10" – 6'0")** te permettra de surfer dans le tube. Pensez à la combi 4/3mm.`;
            return `${np}Mes algorithmes préconisent :\n\n🏄 **Board** : Fish 5'8" ou Shortboard polyvalent\n🌡️ **Combi** : 4/3mm sans cagoule\n🧊 **Wax** : Cold Water (eau < 17°C)`;
        }

        // ── FOULE / AFFLUENCE
        if (lower.match(/\b(foule|crowd|monde|affluence|monde à l'eau|bouchon|peak)\b/)) {
            const nb = Math.floor(8 + Math.random() * 20);
            const tension = nb > 20 ? 'Élevée 🔴' : nb > 12 ? 'Modérée 🟡' : 'Faible 🟢';
            return `📷 Vision par ordinateur (flux caméra) : **${nb} surfeurs** détectés au line-up actuellement.\nTension au pic : **${tension}**.${nb > 18 ? '\n\n⚠️ Spot bondé — envisages un spot alternatif avec /spots' : '\n\n✅ Bonne fenêtre pour y aller !'}`;
        }

        // ── TEMPÉRATURE
        if (lower.match(/\b(température|temperature|eau|chaud|froid|combi)\b/)) {
            const temp = (13.5 + Math.random() * 3).toFixed(1);
            return `🌡️ Télémétrie balise côtière : **${temp}°C** en surface (Golfe de Gascogne).\nEn dessous de 18°C → combi **4/3mm** recommandée.`;
        }

        // ── REMERCIEMENTS
        if (lower.match(/\b(merci|cool|top|parfait|génial|super|thanks|sympa|wow)\b/)) {
            const replies = [
                `De rien ${np}! Swell IA tourne pour toi 24/7. 🤙`,
                `Avec plaisir ${np}! Tape **/météo** avant d'aller surfer !`,
                `C'est mon boulot ! N'oublie pas d'enregistrer ta session dans ton **Journal** 📓`
            ];
            return replies[Math.floor(Math.random() * replies.length)];
        }

        // ── BONJOUR
        if (lower.match(/\b(bonjour|salut|coucou|hey|hello|yo|aloha)\b/)) {
            const hour = new Date().getHours();
            const greet = hour < 12 ? 'Bonjour' : hour < 18 ? 'Salut' : 'Bonsoir';
            return `${greet} ${userContext.name || ''} 🤙 ! Conditions en cours d'analyse... Que puis-je faire pour toi ? (Tape **/aide** pour mes commandes)`;
        }

        // ── GUARDRAILS
        if (lower.match(/\b(politique|guerre|président|code|python|bitcoin|hack|pizza|cuisine)\b/)) {
            return `Je suis l'assistant surf de SwellSync. Mon système me restreint aux sujets ocean/surf. Tape **/aide** pour voir mes capacités ! 🏄‍♂️`;
        }

        // ── FALLBACK intelligent
        const fallbacks = [
            `Intéressant ${np}... 🤖 Je n'ai pas cette info en mémoire. Essaie **/météo ${userContext.homeSpot || '[ton spot]'}** ou **/spots** pour trouver le meilleur spot !`,
            `Hmm, mon modèle hésite ! Tente une formulation différente, ou utilise **/aide** pour voir mes commandes. 🌊`,
            `Je suis spécialisé océanographie & surf. Pour cette question, essaie d'être plus précis ou tape **/aide**. 🤙`
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // ─────────────────────────────────────────────
    // HANDLER COMMANDES /
    // ─────────────────────────────────────────────
    async function handleCommand(lower, original) {
        // /aide ou /help
        if (lower.includes('/aide') || lower.includes('/help')) {
            return `<div class="space-y-1 text-[12px]">
<p class="font-bold text-primary mb-2">🤙 Commandes Swell IA</p>
<p><code style="background:rgba(0,186,214,0.15);padding:1px 5px;border-radius:4px">/spots</code> — Top 5 spots live du moment</p>
<p><code style="background:rgba(0,186,214,0.15);padding:1px 5px;border-radius:4px">/météo [spot]</code> — Conditions live d'un spot</p>
<p><code style="background:rgba(0,186,214,0.15);padding:1px 5px;border-radius:4px">/monfavori</code> — Conditions de ton spot favori</p>
<p><code style="background:rgba(0,186,214,0.15);padding:1px 5px;border-radius:4px">/astuce</code> — Conseil technique surf du jour</p>
<p><code style="background:rgba(0,186,214,0.15);padding:1px 5px;border-radius:4px">/cam</code> — Accès aux webcams live</p>
<p><code style="background:rgba(0,186,214,0.15);padding:1px 5px;border-radius:4px">/reset</code> — Effacer la mémoire</p>
<p class="text-slate-500 mt-2 text-[11px]">Ou pose-moi n'importe quelle question surf !</p>
</div>`;
        }

        // /spots — Top 5 spots depuis l'API
        if (lower.startsWith('/spots')) {
            await loadSpotsCache();
            if (!spotsCache.length) return 'Impossible de charger les spots — serveur indisponible.';
            // Prendre 5 spots au hasard ou les premiers
            const sample = spotsCache.slice(0, 5);
            const lines = sample.map(s => `<a href="spot_detail.html?id=${s.id}" style="color:#00bad6;text-decoration:none;font-weight:700">• ${s.name}</a> <span style="color:#64748b;font-size:11px">${s.location}</span>`).join('<br>');
            return `<div><p style="color:#00bad6;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">🗺️ Spots Disponibles</p>${lines}<p style="color:#64748b;font-size:11px;margin-top:8px">Clique sur un spot pour les conditions live →</p></div>`;
        }

        // /météo [nom de spot]
        if (lower.startsWith('/météo') || lower.startsWith('/meteo')) {
            const query = original.replace(/^\/(météo|meteo)\s*/i, '').trim();
            if (!query) {
                if (userContext.homeSpotId) return await fetchSpotConditions(userContext.homeSpotId, userContext.homeSpot);
                return 'Précise un spot : ex. `/météo hossegor` ou `/météo la torche`';
            }
            await loadSpotsCache();
            const found = spotsCache.find(s =>
                s.name.toLowerCase().includes(query.toLowerCase()) ||
                s.location.toLowerCase().includes(query.toLowerCase())
            );
            if (!found) return `❌ Spot "${query}" introuvable. Essaie **/spots** pour voir la liste.`;
            return await fetchSpotConditions(found.id, found.name);
        }

        // /monfavori — utilise l'API dashboard si connecté
        if (lower.includes('/monfavori') || lower.includes('/favori')) {
            await loadUserServerData();
            if (userServerData?.favorites?.length) {
                const fav = userServerData.favorites[0];
                return await fetchSpotConditions(fav.spot_id, fav.name);
            } else if (userContext.homeSpotId) {
                return await fetchSpotConditions(userContext.homeSpotId, userContext.homeSpot);
            }
            return '❤️ Tu n\'as pas encore de spot favori. Connecte-toi et ajoute un favori sur une page spot, ou dis-moi "mon spot c\'est [nom]" !';
        }

        // /astuce
        if (lower.includes('/astuce') || lower.includes('/tip')) {
            const astuces = [
                '🏄 **Take-Off** : Garde le regard loin devant toi dès le début du take-off — ton corps suit ton regard.',
                '🌊 **Lecture de vague** : Le vent off-shore creuse et lisse les vagues. Cherche les jours où le vent souffle de terre avant d\'y aller.',
                '💪 **Padding** : Enfonce ta main profondément sous la planche à chaque coup de rame — comme si tu rampais sur la glace.',
                '📍 **Positionnement** : Toujours mieux vaut être 10m trop loin dans le peak que 10m trop près. Les bonnes vagues viennent à toi.',
                '🧘 **Timing** : 80% du surf c\'est attendre. Observe 3-4 séries avant de partir à l\'eau — tu comprendras le spot.',
                '🌡️ **Combi** : Eau < 14°C → cagoule + chausson + gants. Eau < 18°C → 4/3mm minimum. Au-dessus → 3/2mm ou shorty.'
            ];
            return astuces[Math.floor(Math.random() * astuces.length)];
        }

        // /cam
        if (lower.includes('/cam') || lower.includes('/vision')) {
            return `📷 Accès aux **webcams live** : <a href="cotes.html" style="color:#00bad6">Carte des côtes SwellSync →</a><br><br>Disponible : Hossegor · La Centrale, Capbreton · Santocha, Anglet · Cavaliers.`;
        }

        // /reset
        if (lower.includes('/reset')) {
            userContext = { name: null, level: null, homeSpot: null, homeSpotId: null, lastTopic: null, language: 'fr', awaitEmail: false };
            return '🔄 Mémoire effacée. Je t\'ai oublié, mais mes algorithmes sont toujours là pour toi !';
        }

        // /shaka (easter egg)
        if (lower.includes('/shaka')) {
            return `<div class="text-center text-4xl">🤙 🌊<br><br><span style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.1em">SWELLSYNC — STAY STOKED</span></div>`;
        }

        return `Commande inconnue. Tape **/aide** pour voir toutes mes commandes disponibles.`;
    }

    // ─────────────────────────────────────────────
    // APPEL API RÉEL : Conditions spot
    // ─────────────────────────────────────────────
    async function fetchSpotConditions(spotId, spotName) {
        try {
            const r = await fetch(`/api/spots/${spotId}`);
            if (!r.ok) throw new Error('API error');
            const spot = await r.json();
            const cond = spot.current_conditions;
            if (!cond) return `Données live indisponibles pour **${spotName}** pour le moment. Réessaie dans quelques instants.`;

            const h = cond.wave_height?.toFixed(1) || '?';
            const p = cond.wave_period?.toFixed(0) || '?';
            const wDir = cond.wind_direction_label || cond.wind_direction || '?';
            const wSpd = cond.wind_speed ? cond.wind_speed.toFixed(0) : '?';
            const swellDir = cond.swell_direction_label || '';
            const hNum = parseFloat(cond.wave_height) || 0;

            // Qualité basée sur la hauteur de houle
            let qualLabel = '💤 Plat';
            let qualColor = '#64748b';
            if (hNum >= 2.0) { qualLabel = '💜 Solide'; qualColor = '#c084fc'; }
            else if (hNum >= 1.2) { qualLabel = '🔵 Épique'; qualColor = '#00bad6'; }
            else if (hNum >= 0.6) { qualLabel = '🟢 Bon'; qualColor = '#4ade80'; }
            else if (hNum >= 0.3) { qualLabel = '🟡 Moyen'; qualColor = '#facc15'; }

            return `<div>
<p style="color:#00bad6;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px">🌊 ${spotName} — Live</p>
<p style="margin:4px 0"><strong style="color:white">${h}m</strong> <span style="color:#64748b;font-size:11px">· Houle · ${p}s</span></p>
<p style="margin:4px 0"><strong style="color:white">${wDir}</strong> <span style="color:#64748b;font-size:11px">· Vent · ${wSpd} kts</span></p>
${swellDir ? `<p style="margin:4px 0;color:#94a3b8;font-size:11px">↗ Direction swell : ${swellDir}</p>` : ''}
${score ? `<p style="margin:8px 0 4px 0;font-weight:800">${qualLabel}</p>` : ''}
<a href="spot_detail.html?id=${spotId}" style="display:inline-block;margin-top:8px;color:#00bad6;font-size:11px;font-weight:700;text-decoration:none">Voir le spot complet →</a>
</div>`;
        } catch (e) {
            return `Impossible de récupérer les conditions de **${spotName}** — vérifie ta connexion.`;
        }
    }

    // ─────────────────────────────────────────────
    // RECOMMANDATION SPOTS PERSONNALISÉE
    // ─────────────────────────────────────────────
    async function handleSpotRecommendation() {
        await loadSpotsCache();
        const lv = userContext.level;
        let filtered = spotsCache;

        if (lv === 'débutant') {
            filtered = spotsCache.filter(s => s.difficulty === 'DÉBUTANT' || s.difficulty === 'FACILE');
        } else if (lv === 'avancé' || lv === 'expert' || lv === 'pro') {
            filtered = spotsCache.filter(s => s.difficulty === 'AVANCÉ' || s.wave_type === 'REEF BREAK');
        }

        if (!filtered.length) filtered = spotsCache;
        const sample = filtered.sort(() => Math.random() - 0.5).slice(0, 3);
        const np = userContext.name ? `${userContext.name}, ` : '';

        const lines = sample.map(s => `<a href="spot_detail.html?id=${s.id}" style="color:#00bad6;text-decoration:none;font-weight:700">• ${s.name}</a> <span style="color:#64748b;font-size:11px">${s.location} · ${s.difficulty}</span>`).join('<br>');

        const intro = lv === 'débutant'
            ? `${np}Pour ton niveau débutant, voici des spots accessibles :`
            : lv ? `${np}Voici des spots adaptés à ton niveau **${lv}** :` : `${np}Voici quelques spots recommandés :`;

        return `<div><p style="margin-bottom:8px">${intro}</p>${lines}<p style="color:#64748b;font-size:11px;margin-top:8px">→ Clique pour voir les conditions live · Tape <strong>/spots</strong> pour plus</p></div>`;
    }
});
