/**
 * SwellSync — Onboarding Chatbot (First Visit Only)
 * ═══════════════════════════════════════════════════
 * Affiche un chatbot conversationnel en overlay la première fois
 * que l'utilisateur visite la page d'accueil.
 *
 * 5 étapes :
 *   1. Accueil & choix de langue
 *   2. Qualification sport (multi-select)
 *   3. Géolocalisation (appât marketing)
 *   4. Tutoriel personnalisé selon le sport
 *   5. CTA final → ferme l'overlay
 */

(function () {
    'use strict';

    // ── Constants ────────────────────────────────────────────────
    const STORAGE_KEY = 'swellsync_onboarding_done';
    const SPORTS_KEY = 'swellsync_sports';
    const DELAY_TYPING = 800;
    const DELAY_MSG = 400;

    // ── Gate: première visite seulement, index.html uniquement ──
    function shouldShow() {
        if (localStorage.getItem(STORAGE_KEY)) return false;
        const path = window.location.pathname;
        const href = window.location.href;
        return path === '/' || path.endsWith('/index.html') || path.endsWith('/')
            || href.endsWith('index.html')
            || (window.location.protocol === 'file:' && href.includes('index.html'));
    }

    if (!shouldShow()) return;

    // ── i18n helper ─────────────────────────────────────────────
    function t(key, fallback) {
        if (window.SwellI18n && window.SwellI18n.isLoaded) {
            const v = window.SwellI18n.t(key);
            return (v && v !== key) ? v : fallback;
        }
        return fallback;
    }

    // ── Conversation data per language ──────────────────────────
    function getTexts(lang) {
        const texts = {
            fr: {
                welcome: 'Aloha 🤙 Bienvenue sur <strong>SwellSync</strong> ! La plateforme ocean-tech faite par des riders, pour des riders. 🌊',
                langPrompt: 'Avant de rider ensemble, dis-moi — tu préfères quelle langue ?',
                sportPrompt: 'Nice ! 🤙 Maintenant, dis-moi ce qui te fait vibrer sur l\'eau — on personnalise tout pour toi :',
                sportMulti: 'Tu peux en choisir plusieurs !',
                sportConfirm: 'C\'est parti ! 🔥',
                geoPrompt: 'Dernière chose et c\'est du lourd 🔥 — si tu nous files ta position, on te montre <strong>en temps réel</strong> les meilleurs spots avec les conditions du jour autour de toi.',
                geoReason: 'Promis, on ne te piste pas ! 🔒 Ta position reste en local, jamais stockée ni partagée.',
                geoAllow: '📍 Activer la géoloc',
                geoDeny: 'Plus tard',
                geoSuccess: 'Position reçue 📍 On te trouvera les meilleurs spots autour de toi !',
                geoDenied: 'Pas de souci ! Tu pourras activer ça plus tard 🤙',
                tutorialIntro: 'Parfait ! Voilà ce que SwellSync a dans le ventre pour toi :',
                ready: 'Tu es prêt à rider 🤙🏽 SwellSync est à toi !',
                ctaText: '🌊 Voir mes spots',
                headerTitle: 'SwellSync',
                headerSub: 'Onboarding · Live',
                features: {
                    surf: [
                        { icon: '🌊', title: 'Prévisions en temps réel', desc: '12 modèles météo fusionnés, fiabilité 98%.' },
                        { icon: '📍', title: '+60 spots en direct', desc: 'Conditions, webcams, marées sur chaque spot.' },
                        { icon: '🤖', title: 'Swell IA', desc: 'Pose n\'importe quelle question, l\'IA te répond en direct.' }
                    ],
                    kite: [
                        { icon: '💨', title: 'Alertes vent personnalisées', desc: 'Reçois une notif quand les conditions sont parfaites pour toi.' },
                        { icon: '📍', title: 'Spots kite référencés', desc: 'Direction du vent, rafales, et marée pour chaque spot.' },
                        { icon: '🤖', title: 'Swell IA', desc: 'Demande les meilleures fenêtres de vent de la semaine.' }
                    ],
                    foil: [
                        { icon: '🌊', title: 'Analyse de houle avancée', desc: 'Période, énergie en kJ et direction idéale pour le foil.' },
                        { icon: '🛹', title: 'Spots foil-friendly', desc: 'On filtre les spots adaptés au foil (houle longue, peu de monde).' },
                        { icon: '🤖', title: 'Swell IA', desc: 'Conseils conditions foil sur mesure.' }
                    ],
                    paddle: [
                        { icon: '🌤️', title: 'Météo & courants', desc: 'Vent, courant marin et température eau en temps réel.' },
                        { icon: '📍', title: 'Spots paddle sécurisés', desc: 'On te montre les zones calmes et adaptées.' },
                        { icon: '🤖', title: 'Swell IA', desc: 'Trouve le créneau parfait pour ta sortie paddle.' }
                    ],
                    bodyboard: [
                        { icon: '🌊', title: 'Shore break alerts', desc: 'Houle courte et puissante = les meilleures sessions bodyboard.' },
                        { icon: '📍', title: 'Spots bodybord', desc: 'On repère les beach breaks et shore breaks idéaux.' },
                        { icon: '🤖', title: 'Swell IA', desc: 'Analyse des conditions bodyboard en direct.' }
                    ],
                    windsurf: [
                        { icon: '💨', title: 'Wind forecast premium', desc: 'Direction, force en nœuds et rafales heure par heure.' },
                        { icon: '📍', title: 'Spots windsurf', desc: 'Les meilleurs spots vent de la côte, filtrés pour toi.' },
                        { icon: '🤖', title: 'Swell IA', desc: 'Demande quand envoyer ta prochaine session.' }
                    ],
                    default: [
                        { icon: '🌊', title: 'Prévisions en temps réel', desc: '12 modèles météo fusionnés, fiabilité 98%.' },
                        { icon: '📍', title: '+60 spots en direct', desc: 'Conditions, webcams, marées sur chaque spot.' },
                        { icon: '🤖', title: 'Swell IA', desc: 'Pose n\'importe quelle question, l\'IA te répond en direct.' }
                    ]
                }
            },
            en: {
                welcome: 'Aloha 🤙 Welcome to <strong>SwellSync</strong>! The ocean-tech platform made by riders, for riders. 🌊',
                langPrompt: 'Before we ride together, tell me — what\'s your language?',
                sportPrompt: 'Nice! 🤙 Now tell me what gets your stoke up on the water — we\'ll customize everything for you:',
                sportMulti: 'You can pick more than one!',
                sportConfirm: 'Let\'s go! 🔥',
                geoPrompt: 'Last thing and it\'s a big one 🔥 — if you share your location, we\'ll show you <strong>the best spots in real-time</strong> with today\'s conditions near you.',
                geoReason: 'We promise we don\'t track you! 🔒 Your location stays local, never stored or shared.',
                geoAllow: '📍 Enable location',
                geoDeny: 'Maybe later',
                geoSuccess: 'Location received 📍 We\'ll find the best spots around you!',
                geoDenied: 'No worries! You can enable it later 🤙',
                tutorialIntro: 'Awesome! Here\'s what SwellSync can do for you:',
                ready: 'You\'re ready to ride 🤙🏽 SwellSync is all yours!',
                ctaText: '🌊 View my spots',
                headerTitle: 'SwellSync',
                headerSub: 'Onboarding · Live',
                features: {
                    surf: [
                        { icon: '🌊', title: 'Real-time forecasts', desc: '12 weather models fused, 98% reliability.' },
                        { icon: '📍', title: '60+ live spots', desc: 'Conditions, webcams, tides on every spot.' },
                        { icon: '🤖', title: 'Swell AI', desc: 'Ask anything, the AI answers in real-time.' }
                    ],
                    kite: [
                        { icon: '💨', title: 'Custom wind alerts', desc: 'Get notified when conditions are perfect for you.' },
                        { icon: '📍', title: 'Kite spots listed', desc: 'Wind direction, gusts, and tides for each spot.' },
                        { icon: '🤖', title: 'Swell AI', desc: 'Ask for the best wind windows this week.' }
                    ],
                    foil: [
                        { icon: '🌊', title: 'Advanced swell analysis', desc: 'Period, energy in kJ and ideal direction for foiling.' },
                        { icon: '🛹', title: 'Foil-friendly spots', desc: 'Spots filtered for foil (long swell, less crowd).' },
                        { icon: '🤖', title: 'Swell AI', desc: 'Custom foil condition advice.' }
                    ],
                    paddle: [
                        { icon: '🌤️', title: 'Weather & currents', desc: 'Wind, ocean current and water temp in real-time.' },
                        { icon: '📍', title: 'Safe paddle spots', desc: 'We show you calm and suitable areas.' },
                        { icon: '🤖', title: 'Swell AI', desc: 'Find the perfect window for your paddle session.' }
                    ],
                    bodyboard: [
                        { icon: '🌊', title: 'Shore break alerts', desc: 'Short powerful swell = best bodyboard sessions.' },
                        { icon: '📍', title: 'Bodyboard spots', desc: 'We spot ideal beach breaks and shore breaks.' },
                        { icon: '🤖', title: 'Swell AI', desc: 'Live bodyboard condition analysis.' }
                    ],
                    windsurf: [
                        { icon: '💨', title: 'Premium wind forecast', desc: 'Direction, strength in knots and gusts hourly.' },
                        { icon: '📍', title: 'Windsurf spots', desc: 'Best wind spots on the coast, filtered for you.' },
                        { icon: '🤖', title: 'Swell AI', desc: 'Ask when to send your next session.' }
                    ],
                    default: [
                        { icon: '🌊', title: 'Real-time forecasts', desc: '12 weather models fused, 98% reliability.' },
                        { icon: '📍', title: '60+ live spots', desc: 'Conditions, webcams, tides on every spot.' },
                        { icon: '🤖', title: 'Swell AI', desc: 'Ask anything, the AI answers in real-time.' }
                    ]
                }
            },
            es: {
                welcome: 'Aloha 🤙 ¡Bienvenido a <strong>SwellSync</strong>! La plataforma ocean-tech hecha por riders, para riders. 🌊',
                langPrompt: 'Antes de surfear juntos, dime — ¿qué idioma prefieres?',
                sportPrompt: '¡Genial! 🤙 Ahora dime qué te apasiona en el agua — personalizamos todo para ti:',
                sportMulti: '¡Puedes elegir varios!',
                sportConfirm: '¡Vamos! 🔥',
                geoPrompt: 'Última cosa y es importante 🔥 — si nos das tu ubicación, te mostramos <strong>en tiempo real</strong> los mejores spots con las condiciones del día cerca de ti.',
                geoReason: '¡Prometemos que no te rastreamos! 🔒 Tu ubicación se queda local, nunca almacenada ni compartida.',
                geoAllow: '📍 Activar ubicación',
                geoDeny: 'Más tarde',
                geoSuccess: '¡Ubicación recibida 📍 Te encontraremos los mejores spots cerca!',
                geoDenied: '¡Sin problema! Puedes activarlo después 🤙',
                tutorialIntro: '¡Perfecto! Esto es lo que SwellSync puede hacer por ti:',
                ready: '¡Estás listo para surfear 🤙🏽 SwellSync es todo tuyo!',
                ctaText: '🌊 Ver mis spots',
                headerTitle: 'SwellSync',
                headerSub: 'Onboarding · Live',
                features: {
                    surf: [
                        { icon: '🌊', title: 'Previsiones en tiempo real', desc: '12 modelos meteorológicos fusionados, 98% de fiabilidad.' },
                        { icon: '📍', title: '+60 spots en directo', desc: 'Condiciones, webcams, mareas en cada spot.' },
                        { icon: '🤖', title: 'Swell IA', desc: 'Pregunta lo que sea, la IA responde en directo.' }
                    ],
                    default: [
                        { icon: '🌊', title: 'Previsiones en tiempo real', desc: '12 modelos meteorológicos fusionados, 98% de fiabilidad.' },
                        { icon: '📍', title: '+60 spots en directo', desc: 'Condiciones, webcams, mareas en cada spot.' },
                        { icon: '🤖', title: 'Swell IA', desc: 'Pregunta lo que sea, la IA responde en directo.' }
                    ]
                }
            },
            pt: {
                welcome: 'Aloha 🤙 Bem-vindo ao <strong>SwellSync</strong>! A plataforma ocean-tech feita por riders, para riders. 🌊',
                langPrompt: 'Antes de surfar juntos, me diz — qual idioma você prefere?',
                sportPrompt: 'Show! 🤙 Agora me conta o que te anima na água — vamos personalizar tudo pra você:',
                sportMulti: 'Pode escolher mais de um!',
                sportConfirm: 'Bora! 🔥',
                geoPrompt: 'Última coisa e é importante 🔥 — se você liberar sua localização, a gente mostra <strong>em tempo real</strong> os melhores spots com as condições do dia perto de você.',
                geoReason: 'Prometemos que não te rastreamos! 🔒 Sua localização fica local, nunca armazenada nem compartilhada.',
                geoAllow: '📍 Ativar localização',
                geoDeny: 'Depois',
                geoSuccess: 'Localização recebida 📍 Vamos encontrar os melhores spots perto de você!',
                geoDenied: 'Sem problema! Você pode ativar isso depois 🤙',
                tutorialIntro: 'Perfeito! Olha o que o SwellSync pode fazer por você:',
                ready: 'Você tá pronto pra surfar 🤙🏽 SwellSync é todo seu!',
                ctaText: '🌊 Ver meus spots',
                headerTitle: 'SwellSync',
                headerSub: 'Onboarding · Live',
                features: {
                    surf: [
                        { icon: '🌊', title: 'Previsões em tempo real', desc: '12 modelos meteorológicos fundidos, 98% de confiabilidade.' },
                        { icon: '📍', title: '+60 spots ao vivo', desc: 'Condições, webcams, marés em cada spot.' },
                        { icon: '🤖', title: 'Swell IA', desc: 'Pergunte o que quiser, a IA responde ao vivo.' }
                    ],
                    default: [
                        { icon: '🌊', title: 'Previsões em tempo real', desc: '12 modelos meteorológicos fundidos, 98% de confiabilidade.' },
                        { icon: '📍', title: '+60 spots ao vivo', desc: 'Condições, webcams, marés em cada spot.' },
                        { icon: '🤖', title: 'Swell IA', desc: 'Pergunte o que quiser, a IA responde ao vivo.' }
                    ]
                }
            }
        };
        return texts[lang] || texts.fr;
    }

    // ── Sports choices (shared across all languages) ─────────────
    const SPORTS = [
        { id: 'surf', icon: '🏄‍♂️', label: 'Surf' },
        { id: 'kite', icon: '🪁', label: 'Kitesurf' },
        { id: 'foil', icon: '🛹', label: 'Foil' },
        { id: 'paddle', icon: '🚣', label: 'Paddle' },
        { id: 'bodyboard', icon: '🌊', label: 'Bodyboard' },
        { id: 'windsurf', icon: '🪂', label: 'Windsurf' }
    ];

    const LANGS = [
        { code: 'fr', flag: '🇫🇷', label: 'Français' },
        { code: 'en', flag: '🇬🇧', label: 'English' },
        { code: 'es', flag: '🇪🇸', label: 'Español' },
        { code: 'pt', flag: '🇧🇷', label: 'Português' }
    ];

    // ── State ───────────────────────────────────────────────────
    let currentLang = (window.SwellI18n && window.SwellI18n.getLang) ? window.SwellI18n.getLang() : 'fr';
    let currentStep = 0;
    let selectedSports = [];
    let txt = getTexts(currentLang);

    // ── DOM references ──────────────────────────────────────────
    let overlay, chatWindow, messagesArea, stepsBar;

    // ── Inject HTML skeleton ────────────────────────────────────
    function injectOverlay() {
        overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';

        overlay.innerHTML = `
        <div id="onboarding-chat">
            <!-- Header -->
            <div class="ob-header">
                <div class="ob-header-avatar">🌊</div>
                <div class="ob-header-info">
                    <h3>${txt.headerTitle}</h3>
                    <p>${txt.headerSub}</p>
                </div>
            </div>
            <!-- Step indicator -->
            <div class="ob-steps" id="ob-steps-bar">
                <div class="ob-step-dot active"></div>
                <div class="ob-step-dot"></div>
                <div class="ob-step-dot"></div>
                <div class="ob-step-dot"></div>
                <div class="ob-step-dot"></div>
            </div>
            <!-- Messages -->
            <div class="ob-messages" id="ob-messages"></div>
        </div>`;

        document.body.appendChild(overlay);

        chatWindow = document.getElementById('onboarding-chat');
        messagesArea = document.getElementById('ob-messages');
        stepsBar = document.getElementById('ob-steps-bar');

        // Prevent clicks on overlay from closing (intentional — user must complete or use CTA)
        overlay.addEventListener('click', (e) => { e.stopPropagation(); });
    }

    // ── Helpers: Add messages ───────────────────────────────────
    function scrollToBottom() {
        requestAnimationFrame(() => {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        });
    }

    function addTypingIndicator() {
        const el = document.createElement('div');
        el.className = 'ob-typing';
        el.id = 'ob-typing';
        el.innerHTML = `
            <div class="ob-msg-icon">🌊</div>
            <div class="ob-typing-dots">
                <span></span><span></span><span></span>
            </div>`;
        messagesArea.appendChild(el);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const el = document.getElementById('ob-typing');
        if (el) el.remove();
    }

    function addBotMessage(html, delay) {
        return new Promise(resolve => {
            addTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                const el = document.createElement('div');
                el.className = 'ob-msg-bot';
                el.innerHTML = `
                    <div class="ob-msg-icon">🌊</div>
                    <div class="ob-msg-bubble">${html}</div>`;
                messagesArea.appendChild(el);
                scrollToBottom();
                setTimeout(resolve, 150);
            }, delay || DELAY_TYPING);
        });
    }

    function addUserMessage(text) {
        const el = document.createElement('div');
        el.className = 'ob-msg-user';
        el.innerHTML = `<div class="ob-msg-bubble">${text}</div>`;
        messagesArea.appendChild(el);
        scrollToBottom();
    }

    function addOptions(options, onClick) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ob-options';
        options.forEach(opt => {
            const chip = document.createElement('button');
            chip.className = 'ob-chip';
            chip.innerHTML = `<span class="ob-chip-icon">${opt.icon || ''}</span> ${opt.label}`;
            chip.addEventListener('click', () => onClick(opt, chip, wrapper));
            wrapper.appendChild(chip);
        });
        messagesArea.appendChild(wrapper);
        scrollToBottom();
    }

    function addMultiSelectOptions(options, confirmLabel, onConfirm) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ob-options';
        const selected = new Set();

        options.forEach(opt => {
            const chip = document.createElement('button');
            chip.className = 'ob-chip';
            chip.innerHTML = `<span class="ob-chip-icon">${opt.icon || ''}</span> ${opt.label}`;
            chip.addEventListener('click', () => {
                if (selected.has(opt.id)) {
                    selected.delete(opt.id);
                    chip.classList.remove('selected');
                } else {
                    selected.add(opt.id);
                    chip.classList.add('selected');
                }
                confirmBtn.style.display = selected.size > 0 ? 'flex' : 'none';
                confirmBtn.classList.toggle('visible', selected.size > 0);
            });
            wrapper.appendChild(chip);
        });

        messagesArea.appendChild(wrapper);

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'ob-confirm-btn';
        confirmBtn.innerHTML = `${confirmLabel} <span style="font-size:16px">→</span>`;
        confirmBtn.addEventListener('click', () => {
            onConfirm(Array.from(selected));
            // Disable further clicks
            wrapper.querySelectorAll('.ob-chip').forEach(c => { c.style.pointerEvents = 'none'; c.style.opacity = '0.5'; });
            confirmBtn.style.pointerEvents = 'none';
            confirmBtn.style.opacity = '0.5';
        });
        messagesArea.appendChild(confirmBtn);
        scrollToBottom();
    }

    function addFeatures(features) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ob-features';
        features.forEach(f => {
            wrapper.innerHTML += `
            <div class="ob-feature-card">
                <div class="ob-feature-icon">${f.icon}</div>
                <div class="ob-feature-text">
                    <h4>${f.title}</h4>
                    <p>${f.desc}</p>
                </div>
            </div>`;
        });
        messagesArea.appendChild(wrapper);
        scrollToBottom();
    }

    function addCTA(text, onClick) {
        const btn = document.createElement('button');
        btn.className = 'ob-cta-final';
        btn.innerHTML = `${text} <span style="font-size:18px">→</span>`;
        btn.addEventListener('click', onClick);
        messagesArea.appendChild(btn);
        scrollToBottom();
    }

    // ── Step progress indicator ─────────────────────────────────
    function updateStepBar(step) {
        const dots = stepsBar.querySelectorAll('.ob-step-dot');
        dots.forEach((dot, i) => {
            dot.classList.remove('active', 'done');
            if (i < step) dot.classList.add('done');
            if (i === step) dot.classList.add('active');
        });
    }

    // ── Close overlay ───────────────────────────────────────────
    function closeOverlay() {
        localStorage.setItem(STORAGE_KEY, '1');

        // Store selected sports
        if (selectedSports.length) {
            localStorage.setItem(SPORTS_KEY, JSON.stringify(selectedSports));
        }

        chatWindow.style.animation = 'obChatOut 0.4s ease forwards';
        overlay.style.animation = 'obOverlayOut 0.5s 0.15s ease forwards';
        setTimeout(() => {
            overlay.remove();
            // Scroll to spots section
            const spotsSection = document.getElementById('spots');
            if (spotsSection) {
                spotsSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 600);
    }

    // ═════════════════════════════════════════════════════════════
    // CONVERSATION STEPS
    // ═════════════════════════════════════════════════════════════

    async function step1_welcome() {
        currentStep = 0;
        updateStepBar(0);

        await addBotMessage(txt.welcome, DELAY_TYPING);
        await addBotMessage(txt.langPrompt, DELAY_MSG + 400);

        addOptions(LANGS.map(l => ({ ...l, icon: l.flag })), (opt, chip, wrapper) => {
            // Disable all chips
            wrapper.querySelectorAll('.ob-chip').forEach(c => { c.style.pointerEvents = 'none'; c.style.opacity = '0.5'; });
            chip.classList.add('selected');
            chip.style.opacity = '1';

            addUserMessage(`${opt.flag} ${opt.label}`);

            // Switch language
            currentLang = opt.code;
            txt = getTexts(currentLang);
            if (window.SwellI18n && window.SwellI18n.setLang) {
                window.SwellI18n.setLang(opt.code);
            }

            setTimeout(step2_sports, 600);
        });
    }

    async function step2_sports() {
        currentStep = 1;
        updateStepBar(1);

        await addBotMessage(txt.sportPrompt, DELAY_TYPING);
        await addBotMessage(txt.sportMulti, DELAY_MSG);

        addMultiSelectOptions(SPORTS, txt.sportConfirm, (selected) => {
            selectedSports = selected;
            const labels = selected.map(id => {
                const s = SPORTS.find(sp => sp.id === id);
                return s ? `${s.icon} ${s.label}` : id;
            });
            addUserMessage(labels.join(' · '));
            setTimeout(step3_geoloc, 600);
        });
    }

    async function step3_geoloc() {
        currentStep = 2;
        updateStepBar(2);

        await addBotMessage(txt.geoPrompt, DELAY_TYPING);
        await addBotMessage(txt.geoReason, DELAY_MSG + 200);

        addOptions([
            { icon: '', label: txt.geoAllow, id: 'allow' },
            { icon: '', label: txt.geoDeny, id: 'deny' }
        ], (opt, chip, wrapper) => {
            wrapper.querySelectorAll('.ob-chip').forEach(c => { c.style.pointerEvents = 'none'; c.style.opacity = '0.5'; });
            chip.classList.add('selected');
            chip.style.opacity = '1';

            addUserMessage(opt.label);

            if (opt.id === 'allow') {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (pos) => {
                            // Store for geoloc.js to pick up
                            sessionStorage.setItem('swellsync_geo_asked', '1');
                            sessionStorage.setItem('swellsync_ob_lat', pos.coords.latitude);
                            sessionStorage.setItem('swellsync_ob_lng', pos.coords.longitude);
                            addBotMessage(txt.geoSuccess, DELAY_MSG).then(() => {
                                setTimeout(step4_tutorial, 600);
                            });
                        },
                        () => {
                            addBotMessage(txt.geoDenied, DELAY_MSG).then(() => {
                                setTimeout(step4_tutorial, 600);
                            });
                        },
                        { timeout: 10000, maximumAge: 600000 }
                    );
                } else {
                    addBotMessage(txt.geoDenied, DELAY_MSG).then(() => {
                        setTimeout(step4_tutorial, 600);
                    });
                }
            } else {
                addBotMessage(txt.geoDenied, DELAY_MSG).then(() => {
                    setTimeout(step4_tutorial, 600);
                });
            }
        });
    }

    async function step4_tutorial() {
        currentStep = 3;
        updateStepBar(3);

        await addBotMessage(txt.tutorialIntro, DELAY_TYPING);

        // Pick features based on first selected sport (or default)
        const primarySport = selectedSports[0] || 'default';
        const featureSet = txt.features[primarySport] || txt.features.default || txt.features.surf;

        addFeatures(featureSet);

        setTimeout(step5_cta, 1200);
    }

    async function step5_cta() {
        currentStep = 4;
        updateStepBar(4);

        await addBotMessage(txt.ready, DELAY_TYPING);

        addCTA(txt.ctaText, closeOverlay);
    }

    // ── Init ────────────────────────────────────────────────────
    function init() {
        injectOverlay();

        // Small delay for the overlay animation to settle
        setTimeout(step1_welcome, 600);
    }

    // Start after DOM is ready + a short delay to let the page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1200));
    } else {
        setTimeout(init, 1200);
    }
})();
