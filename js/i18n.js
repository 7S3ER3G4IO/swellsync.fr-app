/**
 * SwellSync — i18n Engine (A1-A4)
 * Gestion multilingue FR / EN / ES / PT
 * - Détection automatique de la langue du navigateur (A2)
 * - Persistance dans localStorage
 * - Switcher drapeau dans la navbar (A3)
 * - Traduction des éléments via data-i18n="clé.sous_clé" (A1)
 */

(function () {
    'use strict';

    const SUPPORTED = ['fr', 'en', 'es', 'pt'];
    const DEFAULT_LANG = 'fr';
    const STORAGE_KEY = 'swellsync_lang';
    const FLAGS = { fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸', pt: '🇵🇹' };
    const LABELS = { fr: 'FR', en: 'EN', es: 'ES', pt: 'PT' };

    let _translations = {};
    let _currentLang = DEFAULT_LANG;

    // ── Détection langue (A2) ─────────────────────────────────────────────────
    function detectLang() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && SUPPORTED.includes(saved)) return saved;
        const nav = navigator.language || navigator.userLanguage || 'fr';
        const code = nav.split('-')[0].toLowerCase();
        return SUPPORTED.includes(code) ? code : DEFAULT_LANG;
    }

    // ── Chargement JSON locales ───────────────────────────────────────────────
    async function loadLocale(lang) {
        // Construire l'URL correcte selon le protocole (file:// ou http://)
        let url;
        if (window.location.protocol === 'file:') {
            // En file:// on génère un chemin relatif au répertoire du site
            const base = window.location.href.replace(/\/[^/]*$/, '');
            url = `${base}/locales/${lang}.json`;
        } else {
            url = `/locales/${lang}.json`;
        }
        try {
            const resp = await fetch(url);
            if (!resp.ok) throw new Error(`locale ${lang} not found`);
            return await resp.json();
        } catch (e) {
            console.warn(`[i18n] Erreur chargement locale ${lang}:`, e.message);
            return {};
        }
    }

    // ── Résolution d'une clé "section.key" ───────────────────────────────────
    function resolve(key) {
        const parts = key.split('.');
        let obj = _translations;
        for (const p of parts) {
            if (obj && typeof obj === 'object') obj = obj[p];
            else return null;
        }
        return typeof obj === 'string' ? obj : null;
    }

    // ── Mapping CSS sélecteurs → clé i18n ────────────────────────────────────
    const SELECTOR_MAP = {
        // ── Hero (index.html) ──────────────────────────────────────────────────
        '#btn-demo-forecast span:first-child': 'hero.cta_swell',
        'a[href="#spots"]:not(.nav-link)': 'hero.cta_spots',

        // ── Navbar links (injectés par nav.js) ─────────────────────────────────
        '.nav-link[href="cotes.html"]': 'nav.cotes',
        '.nav-link[href="actu.html"]': 'nav.actu',
        '.nav-link[href="communaute.html"]': 'nav.communaute',
        '.nav-link[href="index.html#faq"]': 'nav.contact',
        '.nav-link[href="contact.html"]': 'nav.contact',
        '.nav-link[href="spot_detail.html"]': 'nav.conditions',
        '.nav-link[href="coaching.html"]': 'nav.coaching',
        '.nav-link[href="journal.html"]': 'nav.journal',
        '.nav-link[href="abonnement.html"]': 'nav.abonnement',
        '.nav-link[href="dashboard.html"]': 'nav.dashboard',
        '.nav-link[href="surf-trip.html"]': 'nav.surf_trip',
        '.nav-link[href="reseaux.html"]': 'nav.reseaux',
        '#nav-login-btn, [data-nav-auth] .nav-login-text': 'nav.login',

        // ── FAQ section (index.html) ────────────────────────────────────────────
        '#faq h2': 'home.faq_title',

        // ── Abonnement page ─────────────────────────────────────────────────────
        '#plan-monthly-btn': 'abonnement.monthly',
        '#plan-yearly-btn': 'abonnement.yearly',

        // ── Coaching page ───────────────────────────────────────────────────────
        'button[data-level="all"], #filter-all-levels': 'coaching.all_levels',
        'button[data-level="beginner"]': 'coaching.beginner',
        'button[data-level="intermediate"]': 'coaching.intermediate',
        'button[data-level="advanced"]': 'coaching.advanced',

        // ── Actu page ───────────────────────────────────────────────────────────
        'button[data-cat="all"]': 'actu.all',
        'button[data-cat="surf"]': 'actu.surf',
        'button[data-cat="competition"]': 'actu.competition',
        'button[data-cat="equipment"]': 'actu.equipment',
        'button[data-cat="environment"]': 'actu.environment',
        'button[data-cat="travel"]': 'actu.travel',
        'button[data-cat="culture"]': 'actu.culture',

        // ── Contact page ─────────────────────────────────────────────────────────
        '#contact-submit, button[type="submit"].contact-btn': 'contact.send',

        // ── Journal page ─────────────────────────────────────────────────────────
        '#btn-new-session, button.new-session-btn': 'journal.new_session',
        '#btn-export-pdf': 'journal.export_pdf',

        // ── Cotes page ───────────────────────────────────────────────────────────
        '#filter-all, button[data-filter="all"]': 'cotes.filter_all',

        // ── Common buttons ────────────────────────────────────────────────────────
        '.btn-cancel, button.cancel-btn': 'common.cancel',
        '.btn-close, button.close-btn': 'common.close',
        '#btn-refresh, .refresh-btn': 'common.refresh',

        // ── Placeholders (via data-i18n-placeholder aussi) ────────────────────────
        '#contact-name': { key: 'contact.name_placeholder', attr: 'placeholder' },
        '#contact-email': { key: 'contact.email_placeholder', attr: 'placeholder' },
        '#contact-subject': { key: 'contact.subject_placeholder', attr: 'placeholder' },
        '#contact-message': { key: 'contact.message_placeholder', attr: 'placeholder' },
        '#search-input, #global-search-input': { key: 'nav.search', attr: 'placeholder' },
        '#cotes-search, input[placeholder*="spot"]': { key: 'cotes.search_spot', attr: 'placeholder' },
        '#auth-email-input': { key: 'auth.email_placeholder', attr: 'placeholder' },

        // ── AI Labs page ──────────────────────────────────────────────────────────
        '#ai-question-input': { key: 'ai_labs.placeholder', attr: 'placeholder' },
        '#ai-submit-btn': 'ai_labs.send',

        // ── Auth modal ────────────────────────────────────────────────────────────
        '#auth-send-code-btn': 'auth.send_code',
        '#auth-verify-btn': 'auth.verify',
    };

    // ══════════════════════════════════════════════════════════════════════════
    // TEXT_MAP : Texte FR exact → clé i18n
    // Couvre TOUS les textes visibles du site, statiques ET dynamiques
    // ══════════════════════════════════════════════════════════════════════════
    const TEXT_MAP = {
        // ── NAVIGATION ──────────────────────────────────────────────────────
        'Accueil': 'nav.home',
        'Côtes': 'nav.cotes',
        'Conditions': 'nav.conditions',
        'Actualités': 'nav.actu',
        'Actu': 'nav.actu',
        'AI Labs': 'nav.ai_labs',
        'Communauté': 'nav.communaute',
        'Journal Surf': 'nav.journal',
        'Coaching': 'nav.coaching',
        'Abonnement Pro': 'nav.abonnement',
        'Pro Tools': 'nav.pro',
        'Mon Dashboard': 'nav.dashboard',
        'Contact': 'nav.contact',
        'Connexion': 'nav.login',
        'Se déconnecter': 'nav.logout',
        'Rechercher': 'nav.search',
        'Surf Trip': 'nav.surf_trip',
        'Réseaux': 'nav.reseaux',
        'IoT Network': 'nav.iot',

        // ── HERO / INDEX ─────────────────────────────────────────────────────
        'Surfez les Vagues.': 'hero.title_1',
        "Saisissez l'Instant.": 'hero.title_2',
        'Vérifier la Houle': 'hero.cta_swell',
        'Explorer les Spots': 'hero.cta_spots',
        'Prévisions surf ultra-précises': 'hero.tagline',
        'Données satellites · 12 modèles météo · Temps réel': 'hero.subtitle',
        'Voir la carte': 'hero.cta_map',
        'Conditions live': 'hero.cta_conditions',

        // ── HOME ─────────────────────────────────────────────────────────────
        'Réseau Mondial': 'home.map_title',
        'Carte En Direct': 'home.map_heading',
        'Explorez notre liste de spots de surf premiums à travers le monde.': 'home.map_desc',
        'Top Spots de Surf': 'home.spots_title',
        'Live · Spots actifs': 'home.spots_live',
        'Spots Premium': 'home.spots_subtitle',
        'IA SWELLSYNC': 'home.ai_badge',
        'Indice de Confiance': 'home.ai_title',
        'Calcul ultime basé sur 12 Bots neuronaux.': 'home.ai_desc',
        'Météo en Direct': 'home.meteo_title',
        'Système de Météorologie Marine active.': 'home.meteo_desc',
        'Actu Surf': 'home.actu_title',
        'Questions fréquentes': 'home.faq_title',
        'Tout ce que vous devez savoir sur SwellSync.': 'home.faq_subtitle',
        'Spots en Vedette': 'home.section_spots_title',
        "Les meilleurs spots sélectionnés par notre algorithme aujourd'hui.": 'home.section_spots_sub',
        'Swell Forecast': 'home.swell_forecast',
        'Vérification de la fiabilité dynamique...': 'home.swell_reliability',

        // ── ABONNEMENT ───────────────────────────────────────────────────────
        'Sans engagement — Résiliable à tout moment': 'abonnement.badge',
        'Surfez': 'abonnement.title',
        'sans limites': 'abonnement.title2',
        "Des prévisions ultra-précises, des alertes en temps réel, et des outils pros pour surfer mieux.": 'abonnement.desc',
        'Mensuel': 'abonnement.monthly',
        'Annuel': 'abonnement.yearly',
        'Économisez 20%': 'abonnement.save',
        'Gratuit': 'common.free',
        'Pro': 'common.pro',
        'Élite': 'common.elite',
        '/mois': 'abonnement.per_month',
        '/an': 'abonnement.per_year',
        'Commencer gratuitement': 'abonnement.cta_free',
        'Choisir Pro': 'abonnement.cta_pro',
        'Choisir Élite': 'abonnement.cta_elite',
        'Plus populaire': 'abonnement.popular',
        'Toutes les fonctionnalités': 'abonnement.features_title',
        'Résiliable à tout moment, sans engagement.': 'abonnement.cancel_anytime',
        'Paiement sécurisé par Stripe': 'abonnement.secure_payment',

        // ── ACTU ─────────────────────────────────────────────────────────────
        '📰 Actualités': 'actu.badge',
        'Surf · Houle · Culture': 'actu.subtitle',
        'Tout': 'actu.all',
        'Surf': 'actu.surf',
        'Compétitions': 'actu.competition',
        'Équipement': 'actu.equipment',
        'Environnement': 'actu.environment',
        'Voyage': 'actu.travel',
        'Culture': 'actu.culture',
        'Lire la suite': 'actu.read_more',
        'Sauvegarder': 'common.save',
        'Partager': 'common.share',
        'Aucun article trouvé pour ce filtre.': 'actu.no_actu',
        'Mes articles sauvegardés': 'actu.saved_title',

        // ── COACHING ─────────────────────────────────────────────────────────
        'Programme personnalisé': 'coaching.badge',
        '🏄 Coaching Surf': 'coaching.title',
        'Tous les niveaux': 'coaching.all_levels',
        'Débutant': 'coaching.beginner',
        'Intermédiaire': 'coaching.intermediate',
        'Avancé': 'coaching.advanced',
        'Marquer comme fait': 'coaching.mark_done',
        "Voir l'exercice": 'coaching.view_exercise',
        'Mes Objectifs': 'coaching.my_objectives',
        '+ Objectif': 'coaching.add_objective',
        'Conseil de la semaine': 'coaching.weekly_tip',
        'Takeoff': 'coaching.takeoff',
        'Bottom Turn': 'coaching.bottom_turn',
        'Cutback': 'coaching.cutback',
        'Mon Programme': 'coaching.program_title',
        '💡 Tip de la semaine': 'coaching.tip_label',

        // ── COMMUNAUTÉ ───────────────────────────────────────────────────────
        'Communauté SwellSync': 'communaute.title',
        'Connectez-vous avec d\'autres surfeurs passionnés.': 'communaute.subtitle',
        'Nouveau post': 'communaute.new_post',
        'Partagez votre session...': 'communaute.write_placeholder',
        'Publier': 'communaute.publish',
        "Fil d'actualité": 'communaute.feed',
        'Événements': 'communaute.events',
        'Rencontres': 'communaute.meetups',
        'Suivre': 'communaute.follow',
        'Abonné': 'communaute.following',

        // ── CONTACT ──────────────────────────────────────────────────────────
        'On vous répond sous 24h': 'contact.badge',
        'Contactez': 'contact.title',
        'Comment nous joindre': 'contact.how_title',
        'Envoyer le message': 'contact.send',
        'Message envoyé ! On revient vers vous sous 24h.': 'contact.sent',
        'Questions rapides': 'contact.faq_title',
        'Notre Discord': 'contact.discord',

        // ── COTES ────────────────────────────────────────────────────────────
        'Carte des Côtes': 'cotes.title',
        'Explorez les spots en temps réel.': 'cotes.subtitle',
        'Réseau Live': 'cotes.badge',
        'Tous les spots': 'cotes.filter_all',
        'Épique': 'cotes.filter_epic',
        'Bon': 'cotes.filter_good',
        'Plat': 'cotes.filter_flat',
        'Live': 'cotes.live',
        'Ma position': 'cotes.my_location',

        // ── DASHBOARD ────────────────────────────────────────────────────────
        'Mes spots favoris': 'dashboard.my_spots',
        'Mes alertes': 'dashboard.my_alerts',
        'Sessions récentes': 'dashboard.recent_sessions',
        'Aucune session enregistrée.': 'dashboard.no_sessions',
        '+ Ajouter une alerte': 'dashboard.add_alert',
        '+ Ajouter un spot': 'dashboard.add_spot',
        'Prochaine session': 'dashboard.next_session',
        'Planifier': 'dashboard.plan',
        'Passer Pro': 'dashboard.upgrade',
        'Mes stats': 'dashboard.stats',
        "Heures dans l'eau": 'dashboard.hours_in_water',

        // ── JOURNAL ──────────────────────────────────────────────────────────
        'Journal de Surf': 'journal.title',
        "Chaque session mérite d'être immortalisée.": 'journal.subtitle',
        'Nouvelle session': 'journal.new_session',
        'PDF': 'journal.export_pdf',
        'Sessions': 'journal.sessions',
        "Dans l'eau": 'journal.in_water',
        'Meilleur score': 'journal.best_score',
        'Score moyen': 'journal.avg_score',
        'Spot': 'journal.spot',
        'Date': 'journal.date',
        'Durée (min)': 'journal.duration',
        'Houle (m)': 'journal.wave_height',
        'Vent': 'spots.wind',
        'Crowd': 'journal.crowd',
        'Notes': 'journal.notes',
        'Enregistrer': 'journal.save',
        'Score /10': 'journal.score',
        'Supprimer': 'common.delete',
        'Modifier': 'common.edit',
        'Aucune session. Enregistrez votre première session !': 'journal.no_sessions',
        'Humeur': 'journal.mood',
        'Matériel': 'journal.equipment',
        'Photo': 'journal.photo',

        // ── MORNING REPORT ───────────────────────────────────────────────────
        '🌅 Morning Reports': 'morning_report.title',
        'Rapport quotidien 6h00': 'morning_report.badge',
        'Choisir un spot': 'morning_report.select_spot',
        'Actualiser': 'common.refresh',
        'ÉPIQUE': 'morning_report.epic',
        'BON': 'morning_report.good',
        'PASSABLE': 'morning_report.fair',
        'PLAT': 'morning_report.flat',
        '🌊 Tous les spots': 'cotes.filter_all',
        'Pays Basque': 'Pays Basque',
        'Landes': 'Landes',
        'Bretagne': 'Bretagne',
        'SPOT DU JOUR': 'SPOT DU JOUR',
        'Houle WSW': 'spots.swell',
        'Offshore': 'spots.offshore',
        'Période': 'spots.period',
        'Marée': 'spots.tide',

        // ── SURF TRIP ────────────────────────────────────────────────────────
        'Algorithme SwellSync': 'surf_trip.badge',
        '🗺️ Surf Trip Planner': 'surf_trip.title',
        '🔍 Configurer votre trip': 'surf_trip.configure',
        'Tous niveaux': 'surf_trip.all_levels',
        '🔍 Trouver mon trip': 'surf_trip.search',
        '🏄 Spots recommandés': 'surf_trip.results_title',
        'Distance': 'surf_trip.distance',
        'Trajet': 'surf_trip.drive_time',
        '🗺️ Itinéraire': 'surf_trip.itinerary',
        'Voir les conditions': 'surf_trip.details',

        // ── PRO TOOLS ────────────────────────────────────────────────────────
        'Outils Hyper-Premium': 'pro.badge',
        'Alertes houle personnalisées': 'pro.feature_alerts',
        'Accès toutes webcams': 'pro.feature_cams',
        'Export données': 'pro.feature_export',
        'Analyse IA complète': 'pro.feature_ai',
        'Historique 30 jours': 'pro.feature_history',
        'Essai gratuit 7 jours': 'pro.trial',
        'Activer Pro': 'pro.cta',

        // ── RÉSEAUX ──────────────────────────────────────────────────────────
        'Nos Réseaux Sociaux': 'reseaux.title',
        'Suivez SwellSync sur toutes les plateformes.': 'reseaux.subtitle',
        'Instagram': 'reseaux.instagram',
        'YouTube': 'reseaux.youtube',
        'TikTok': 'reseaux.tiktok',
        'Discord': 'reseaux.discord',
        'Twitter': 'reseaux.twitter',
        'abonnés': 'reseaux.followers',
        'vidéos': 'reseaux.videos',
        'Suivre': 'reseaux.follow',
        'Rejoindre': 'reseaux.join',

        // ── IOT ──────────────────────────────────────────────────────────────
        "Capteurs Actifs": "iot.badge",
        "Télémétrie & Capteurs Actifs": "iot.badge",
        'Température eau': 'iot.data_temp',
        'Hauteur houle': 'iot.data_swell',
        'Courant marin': 'iot.data_current',

        // ── AI LABS ──────────────────────────────────────────────────────────
        'Poser une question à SwellSync IA': 'ai_labs.ask_ai',
        'Envoi': 'ai_labs.send',
        'Envoyé': 'ai_labs.send',
        'Réponse IA': 'ai_labs.response_title',
        'Analyse en cours...': 'ai_labs.thinking',
        'modèles actifs': 'ai_labs.models',
        'précision': 'ai_labs.accuracy',
        'spots couverts': 'ai_labs.spots_covered',
        'Assistant Intelligent': 'Assistant Intelligent',

        // ── SPOTS ────────────────────────────────────────────────────────────
        'Houle': 'spots.swell',
        'Marée': 'spots.tide',
        'Offshore': 'spots.offshore',
        'Léger': 'spots.light',
        'Onshore': 'spots.onshore',
        'Épique': 'spots.quality_epic',
        'Excellent': 'spots.quality_excellent',
        'secondes': 'spots.seconds',
        'mètres': 'spots.meters',
        'nœuds': 'spots.knots',

        // ── AUTH ─────────────────────────────────────────────────────────────
        'Connexion': 'auth.title',
        'Recevoir le code': 'auth.send_code',
        'Entrer le code': 'auth.enter_code',
        'Se connecter': 'auth.verify',
        'Se souvenir 30 jours': 'auth.remember_me',

        // ── GÉOLOCATION ──────────────────────────────────────────────────────
        'Spots près de vous': 'geoloc.ask_title',
        'Autoriser la localisation': 'geoloc.allow',
        'Non merci, peut-être plus tard': 'geoloc.deny',
        '🔒 Votre position n\'est jamais stockée.': 'geoloc.privacy',
        'Spot le plus proche': 'geoloc.result_title',
        'km': 'geoloc.km_away',
        'min de route': 'geoloc.drive',
        'Voir les conditions': 'geoloc.see_conditions',
        'Itinéraire': 'geoloc.itinerary',
        'Qualité': 'geoloc.quality',

        // ── PAGES LÉGALES ───────────────────────────────────────────────────
        'Mentions Légales': 'legal.title',
        'Conditions Générales de Vente': 'cgv.title',
        'Politique de Confidentialité': 'privacy.title',
        'Politique de Cookies': 'cookies.title',
        'Tout accepter': 'cookies.accept',
        'Tout refuser': 'cookies.reject',
        'Personnaliser': 'cookies.customize',

        // ── COMMON ───────────────────────────────────────────────────────────
        'Chargement...': 'common.loading',
        'Erreur': 'common.error',
        'Annuler': 'common.cancel',
        'Fermer': 'common.close',
        'Ajouter': 'common.add',
        'Voir plus': 'common.see_more',
        'Retour': 'common.back',
        'Télécharger': 'common.download',
        'Actualiser': 'common.refresh',

        // ── CHATBOT ──────────────────────────────────────────────────────────
        'Connecté · Live': 'chatbot.status',
        'Réinitialiser': 'chatbot.clear_title',
        'Posez votre question...': 'chatbot.placeholder',
        'Ask me anything...': 'chatbot.placeholder',
        'Swell IA réfléchit...': 'chatbot.thinking',
    };

    // ── Walker universel sur les TextNodes ────────────────────────────────────
    // Mémorise les TextNodes traduits pour pouvoir re-traduire si la langue change
    const _nodeOriginals = new WeakMap(); // TextNode → texte FR original
    const SKIP_TAGS = new Set([
        'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'PRE', 'SVG',
        'MATH', 'CANVAS', 'HEAD', 'META', 'LINK'
    ]);

    function translateTextNode(node) {
        // Récupérer le texte d'affichage courant
        const raw = node.textContent;
        const trimmed = raw.trim();
        if (!trimmed || trimmed.length < 2) return;

        // Le FR original — mémorisé à la première traduction
        let origFr = _nodeOriginals.get(node);
        if (!origFr) {
            // Chercher si le texte actuel correspond à un texte FR connu
            if (TEXT_MAP[trimmed] !== undefined) {
                origFr = trimmed;
                _nodeOriginals.set(node, origFr);
            } else {
                return; // Pas dans notre map → on ne touche pas ce nœud
            }
        }

        // Récupérer la traduction
        const key = TEXT_MAP[origFr];
        if (!key) return;
        const translated = resolve(key);
        if (!translated) return;

        // Appliquer en préservant les espaces autour
        const leading = raw.match(/^\s*/)[0];
        const trailing = raw.match(/\s*$/)[0];
        node.textContent = leading + translated + trailing;
    }

    function walkAllTextNodes(root) {
        if (!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                // Remonter jusqu'au parent pour vérifier le tag
                let parent = node.parentNode;
                while (parent && parent !== document.body) {
                    if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
                    parent = parent.parentNode;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        const nodes = [];
        let n = walker.nextNode();
        while (n) { nodes.push(n); n = walker.nextNode(); }
        nodes.forEach(translateTextNode);
    }

    // ── MutationObserver — catch tout contenu injecté dynamiquement ───────────
    let _mutationPending = false;
    const _observer = new MutationObserver((mutations) => {
        if (_mutationPending) return;
        _mutationPending = true;
        requestAnimationFrame(() => {
            _mutationPending = false;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        translateTextNode(node);
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        walkAllTextNodes(node);
                    }
                });
                // Re-traduire aussi les CharacterData changes
                if (mutation.type === 'characterData' && mutation.target) {
                    translateTextNode(mutation.target);
                }
            });
        });
    });

    // ── Appliquer traductions au DOM ──────────────────────────────────────────
    function applyTranslations() {
        // 1. Attributs data-i18n (méthode standard)
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = resolve(key);
            if (val !== null) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = val;
                } else if (el.tagName === 'META') {
                    el.content = val;
                } else {
                    el.textContent = val;
                }
            }
        });

        // 2. data-i18n-title pour les tooltips
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const val = resolve(key);
            if (val) el.title = val;
        });

        // 3. data-i18n-placeholder
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const val = resolve(key);
            if (val) el.placeholder = val;
        });

        // 4. Mapping par sélecteurs CSS
        Object.entries(SELECTOR_MAP).forEach(([selector, keyOrObj]) => {
            try {
                const els = document.querySelectorAll(selector);
                if (!els.length) return;
                const key = typeof keyOrObj === 'string' ? keyOrObj : keyOrObj.key;
                const attr = typeof keyOrObj === 'object' ? keyOrObj.attr : 'text';
                const val = resolve(key);
                if (!val) return;
                els.forEach(el => {
                    if (attr === 'text') el.textContent = val;
                    else if (attr === 'html') el.innerHTML = val;
                    else el.setAttribute(attr, val);
                });
            } catch (e) { /* selector invalide */ }
        });

        // 5. Walker universel : parcourt TOUS les TextNodes
        walkAllTextNodes(document.body);
    }

    // ── Switcher langue ───────────────────────────────────────────────────────
    function injectLangSwitcher() {
        // Chercher la navbar (compatible nav.js)
        const nav = document.querySelector('nav .flex') || document.querySelector('.nav-bar') || document.querySelector('nav');
        if (!nav || document.getElementById('lang-switcher')) return;

        const switcher = document.createElement('div');
        switcher.id = 'lang-switcher';
        switcher.style.cssText = 'position:relative;display:inline-flex;align-items:center;';

        const btn = document.createElement('button');
        btn.id = 'lang-switcher-btn';
        btn.style.cssText = `
            display:flex;align-items:center;gap:5px;padding:6px 12px;
            border-radius:999px;background:rgba(255,255,255,0.05);
            border:1px solid rgba(255,255,255,0.1);color:#94a3b8;
            font-family:Lexend,sans-serif;font-size:11px;font-weight:800;
            cursor:pointer;transition:all 0.2s;letter-spacing:0.04em;
        `;
        btn.innerHTML = `${FLAGS[_currentLang]} ${LABELS[_currentLang]} <span style="opacity:0.5;font-size:8px;">▼</span>`;
        btn.type = 'button';

        btn.onmouseover = () => { btn.style.background = 'rgba(255,255,255,0.08)'; btn.style.color = '#fff'; };
        btn.onmouseout = () => { btn.style.background = 'rgba(255,255,255,0.05)'; btn.style.color = '#94a3b8'; };

        const dropdown = document.createElement('div');
        dropdown.id = 'lang-dropdown';
        dropdown.style.cssText = `
            position:absolute;top:calc(100% + 8px);right:0;z-index:9999;
            background:rgba(7,15,16,0.97);border:1px solid rgba(255,255,255,0.08);
            border-radius:14px;overflow:hidden;padding:6px;
            box-shadow:0 20px 60px rgba(0,0,0,0.5);backdrop-filter:blur(16px);
            display:none;min-width:120px;
        `;

        SUPPORTED.forEach(lang => {
            const item = document.createElement('button');
            item.type = 'button';
            item.style.cssText = `
                display:flex;align-items:center;gap:8px;width:100%;padding:8px 12px;
                border-radius:8px;background:${lang === _currentLang ? 'rgba(0,186,214,0.1)' : 'none'};
                border:none;color:${lang === _currentLang ? '#00bad6' : '#94a3b8'};
                font-family:Lexend,sans-serif;font-size:12px;font-weight:700;
                cursor:pointer;text-align:left;transition:background 0.15s;
            `;
            item.innerHTML = `${FLAGS[lang]} <span>${LABELS[lang]}</span>`;
            item.onmouseover = () => { if (lang !== _currentLang) item.style.background = 'rgba(255,255,255,0.05)'; };
            item.onmouseout = () => { if (lang !== _currentLang) item.style.background = 'none'; };
            item.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); setLang(lang); dropdown.style.display = 'none'; dropdown.classList.remove('swellsync-dropdown-open'); });
            dropdown.appendChild(item);
        });

        // Toggle dropdown au click (pas mousedown pour éviter conflits nav.js)
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const isOpen = dropdown.style.display !== 'none';
            dropdown.style.display = isOpen ? 'none' : 'block';
            if (!isOpen) dropdown.classList.add('swellsync-dropdown-open');
            else dropdown.classList.remove('swellsync-dropdown-open');
        });

        // Bloquer toute propagation depuis le conteneur switcher
        switcher.addEventListener('mousedown', e => e.stopPropagation());
        switcher.addEventListener('click', e => e.stopPropagation());

        // Fermer au clic ailleurs
        document.addEventListener('click', (e) => {
            if (!switcher.contains(e.target)) {
                dropdown.style.display = 'none';
                dropdown.classList.remove('swellsync-dropdown-open');
            }
        });

        switcher.appendChild(btn);
        switcher.appendChild(dropdown);


        // Insérer avant le dernier bouton (login) de la navbar
        const loginBtn = document.querySelector('#nav-login-btn, .nav-login-btn, [data-nav-auth]');
        if (loginBtn && loginBtn.parentNode) {
            loginBtn.parentNode.insertBefore(switcher, loginBtn);
        } else {
            // Fallback : insérer à la fin de la nav
            nav.appendChild(switcher);
        }
    }

    // ── Changer de langue ─────────────────────────────────────────────────────
    async function setLang(lang) {
        if (!SUPPORTED.includes(lang)) return;
        _currentLang = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        _translations = await loadLocale(lang);
        applyTranslations();
        document.documentElement.lang = lang;
        // Mettre à jour le bouton switcher
        const btn = document.getElementById('lang-switcher-btn');
        if (btn) btn.innerHTML = `${FLAGS[lang]} ${LABELS[lang]} <span style="opacity:0.5;font-size:8px;">▼</span>`;
        // Réinitialiser dropdown colors
        const items = document.querySelectorAll('#lang-dropdown button');
        items.forEach((item, idx) => {
            const itemLang = SUPPORTED[idx];
            item.style.background = itemLang === lang ? 'rgba(0,186,214,0.1)' : 'none';
            item.style.color = itemLang === lang ? '#00bad6' : '#94a3b8';
        });
        // Dispatcher un event pour les autres scripts
        document.dispatchEvent(new CustomEvent('swellsync:lang', { detail: { lang, translations: _translations } }));
    }

    // ── API publique ──────────────────────────────────────────────────────────
    window.SwellI18n = {
        t: (key) => resolve(key) || key,
        setLang,
        getLang: () => _currentLang,
        getFlag: (lang) => FLAGS[lang] || '🌐',
        isLoaded: false
    };

    // ── Init ──────────────────────────────────────────────────────────────────
    async function init() {
        _currentLang = detectLang();
        _translations = await loadLocale(_currentLang);
        document.documentElement.lang = _currentLang;
        applyTranslations();

        // Démarrer le MutationObserver pour le contenu dynamique
        if (document.body) {
            _observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                _observer.observe(document.body, { childList: true, subtree: true, characterData: true });
            });
        }

        // Injecter le switcher une fois la navbar prête
        if (document.readyState === 'complete') {
            injectLangSwitcher();
        } else {
            window.addEventListener('load', () => setTimeout(injectLangSwitcher, 500), { once: true });
        }

        window.SwellI18n.isLoaded = true;
        document.dispatchEvent(new CustomEvent('swellsync:i18n:ready', { detail: { lang: _currentLang } }));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

