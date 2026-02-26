#!/usr/bin/env python3
"""
SwellSync — Injection massive data-i18n + enrichissement locales
Exécuter depuis le répertoire racine du site.
"""
import json, re, os

BASE = os.path.dirname(os.path.abspath(__file__))
LOCALES = os.path.join(BASE, 'locales')

# ══════════════════════════════════════════════════════════════════
# 1. DICTIONNAIRE COMPLET DES TRADUCTIONS
# ══════════════════════════════════════════════════════════════════
TRANSLATIONS = {
    "fr": {
        "nav": {
            "home":"Accueil","cotes":"Côtes","conditions":"Conditions",
            "actu":"Actualités","ai_labs":"AI Labs","communaute":"Communauté",
            "journal":"Journal Surf","coaching":"Coaching","abonnement":"Abonnement Pro",
            "pro":"Pro Tools","dashboard":"Mon Dashboard","contact":"Contact",
            "login":"Connexion","logout":"Se déconnecter","search":"Rechercher",
            "surf_trip":"Surf Trip","reseaux":"Réseaux","iot":"IoT Network"
        },
        "hero": {
            "title_1":"Surfez les Vagues.","title_2":"Saisissez l'Instant.",
            "desc":"Prévisions de surf de pointe propulsées par l'intelligence océanique en temps réel et l'analyse avancée de la houle.",
            "cta_swell":"Vérifier la Houle","cta_spots":"Explorer les Spots",
            "tagline":"Prévisions surf ultra-précises",
            "subtitle":"Données satellites · 12 modèles météo · Temps réel",
            "cta_map":"Voir la carte","cta_conditions":"Conditions live"
        },
        "home": {
            "map_title":"Réseau Mondial","map_heading":"Carte En Direct",
            "map_desc":"Explorez notre liste de spots de surf premiums à travers le monde.",
            "spots_title":"Top Spots de Surf","spots_live":"Live · Spots actifs",
            "spots_subtitle":"Spots Premium","ai_badge":"IA SWELLSYNC",
            "ai_title":"Indice de Confiance","ai_desc":"Calcul ultime basé sur 12 Bots neuronaux.",
            "meteo_title":"Météo en Direct","meteo_desc":"Système de Météorologie Marine active.",
            "actu_title":"Actu Surf","actu_badge":"Actualités",
            "faq_title":"Questions fréquentes","faq_subtitle":"Tout ce que vous devez savoir sur SwellSync.",
            "section_spots_title":"Spots en Vedette",
            "section_spots_sub":"Les meilleurs spots sélectionnés par notre algorithme aujourd'hui.",
            "swell_forecast":"Swell Forecast","swell_reliability":"Vérification de la fiabilité dynamique..."
        },
        "abonnement": {
            "badge":"Sans engagement — Résiliable à tout moment",
            "title":"Surfez","title2":"sans limites",
            "desc":"Des prévisions ultra-précises, des alertes en temps réel, et des outils pros pour surfer mieux.",
            "monthly":"Mensuel","yearly":"Annuel","save":"Économisez 20%",
            "free":"Gratuit","pro":"Pro","elite":"Élite",
            "free_price":"0€","pro_price":"9.90€","elite_price":"24.90€",
            "per_month":"/mois","per_year":"/an",
            "cta_free":"Commencer gratuitement","cta_pro":"Choisir Pro","cta_elite":"Choisir Élite",
            "popular":"Plus populaire","current":"Votre plan actuel",
            "features_title":"Toutes les fonctionnalités",
            "faq_title":"Questions fréquentes sur l'abonnement",
            "cancel_anytime":"Résiliable à tout moment, sans engagement.",
            "secure_payment":"Paiement sécurisé par Stripe"
        },
        "actu": {
            "title":"Actualités","subtitle":"Surf · Houle · Culture",
            "badge":"Actualités","breaking":"🌊 Breaking",
            "all":"Tout","surf":"Surf","competition":"Compétitions",
            "equipment":"Équipement","environment":"Environnement","travel":"Voyage","culture":"Culture",
            "read_more":"Lire la suite","save":"Sauvegarder","share":"Partager",
            "no_actu":"Aucun article trouvé pour ce filtre.",
            "saved_title":"Mes articles sauvegardés","no_saved":"Aucun article sauvegardé."
        },
        "coaching": {
            "badge":"Programme personnalisé","title":"🏄 Coaching Surf",
            "subtitle":"Exercices ciblés, technique vidéo et objectifs pour progresser à chaque session.",
            "all_levels":"Tous les niveaux","beginner":"Débutant","intermediate":"Intermédiaire","advanced":"Avancé",
            "mark_done":"Marquer comme fait","view_exercise":"Voir l'exercice",
            "my_objectives":"Mes Objectifs","add_objective":"+ Objectif","weekly_tip":"Conseil de la semaine",
            "takeoff":"Takeoff","bottom_turn":"Bottom Turn","cutback":"Cutback",
            "exercises":"exercices","done":"fait","score":"Score",
            "program_title":"Mon Programme","tip_label":"💡 Tip de la semaine"
        },
        "communaute": {
            "title":"Communauté SwellSync","subtitle":"Connectez-vous avec d'autres surfeurs passionnés.",
            "badge":"Communauté","members":"membres","online":"en ligne",
            "share":"Partager","like":"J'aime","comment":"Commenter",
            "new_post":"Nouveau post","write_placeholder":"Partagez votre session...",
            "publish":"Publier","cancel":"Annuler",
            "feed":"Fil d'actualité","events":"Événements","meetups":"Rencontres",
            "search_members":"Rechercher des membres...",
            "follow":"Suivre","following":"Abonné",
            "sessions":"sessions","spots":"spots visités"
        },
        "contact": {
            "badge":"On vous répond sous 24h","title":"Contactez","title2":"l'équipe SwellSync",
            "desc":"Une question sur vos conditions, votre abonnement ou un partenariat ? On est là pour vous.",
            "how_title":"Comment nous joindre",
            "name_label":"Nom","name_placeholder":"Votre nom...",
            "email_label":"Email","email_placeholder":"votre@email.com",
            "subject_label":"Sujet","subject_placeholder":"De quoi s'agit-il ?",
            "message_label":"Message","message_placeholder":"Votre message...",
            "send":"Envoyer le message","sent":"Message envoyé ! On revient vers vous sous 24h.",
            "error":"Erreur d'envoi. Réessayez.",
            "faq_title":"Questions rapides",
            "discord":"Notre Discord","twitter":"Twitter","instagram":"Instagram"
        },
        "cotes": {
            "title":"Carte des Côtes","subtitle":"Explorez les spots en temps réel.",
            "badge":"Réseau Live","filter_all":"Tous les spots","filter_epic":"Épique",
            "filter_good":"Bon","filter_flat":"Plat","live":"Live",
            "conditions":"Conditions","swell":"Houle","wind":"Vent",
            "tide":"Marée","period":"Période","search_spot":"Rechercher un spot...",
            "my_location":"Ma position","zoom_in":"Zoom +","zoom_out":"Zoom -",
            "spot_count":"spots actifs"
        },
        "dashboard": {
            "title":"Mon Dashboard","welcome":"Bienvenue,",
            "my_spots":"Mes spots favoris","my_alerts":"Mes alertes",
            "recent_sessions":"Sessions récentes","no_sessions":"Aucune session enregistrée.",
            "add_alert":"+ Ajouter une alerte","add_spot":"+ Ajouter un spot",
            "swell_height":"Hauteur de houle","period":"Période","wind_speed":"Vitesse du vent",
            "next_session":"Prochaine session","plan":"Planifier",
            "pro_badge":"Pro","elite_badge":"Élite","free_badge":"Gratuit",
            "upgrade":"Passer Pro","stats":"Mes stats","hours_in_water":"Heures dans l'eau"
        },
        "journal": {
            "title":"Journal de Surf","subtitle":"Chaque session mérite d'être immortalisée.",
            "new_session":"Nouvelle session","export_pdf":"PDF",
            "sessions":"Sessions","in_water":"Dans l'eau","best_score":"Meilleur score","avg_score":"Score moyen",
            "spot":"Spot","date":"Date","duration":"Durée (min)","wave_height":"Houle (m)",
            "wind":"Vent","crowd":"Crowd","notes":"Notes","save":"Enregistrer",
            "score":"Score /10","delete":"Supprimer","edit":"Modifier",
            "no_sessions":"Aucune session. Enregistrez votre première session !",
            "mood":"Humeur","equipment":"Matériel","photo":"Photo"
        },
        "morning_report": {
            "title":"Morning Report","subtitle":"Conditions du matin par spot.",
            "badge":"Rapport quotidien 6h00","generated":"Généré à","by_ai":"par SwellSync IA",
            "select_spot":"Choisir un spot","refresh":"Actualiser",
            "swell_analysis":"Analyse de houle","wind_analysis":"Analyse du vent",
            "tide_info":"Info marée","recommendation":"Recommandation",
            "epic":"ÉPIQUE","good":"BON","fair":"PASSABLE","flat":"PLAT"
        },
        "surf_trip": {
            "badge":"Algorithme SwellSync","title":"🗺️ Surf Trip Planner",
            "desc":"Trouvez les meilleurs spots du moment selon la houle, la marée et le vent.",
            "configure":"🔍 Configurer votre trip","region":"Région de départ",
            "all_coast":"🌊 Toute la côte","duration":"Durée","level":"Niveau",
            "all_levels":"Tous niveaux","beginner":"Débutant","intermediate":"Intermédiaire","advanced":"Expert",
            "search":"🔍 Trouver mon trip","results_title":"🏄 Spots recommandés",
            "distance":"Distance","drive_time":"Trajet",
            "itinerary":"🗺️ Itinéraire","details":"Voir les conditions"
        },
        "pro": {
            "title":"SwellSync Pro Tools","subtitle":"Les outils avancés pour les surfeurs sérieux.",
            "badge":"Outils Pro","feature_alerts":"Alertes houle personnalisées",
            "feature_cams":"Accès toutes webcams","feature_export":"Export données",
            "feature_ai":"Analyse IA complète","feature_history":"Historique 30 jours",
            "trial":"Essai gratuit 7 jours","cta":"Activer Pro"
        },
        "communaute_page": {
            "title":"Communauté","subtitle":"Surfeurs du monde entier."
        },
        "reseaux": {
            "title":"Nos Réseaux Sociaux","subtitle":"Suivez SwellSync sur toutes les plateformes.",
            "badge":"Social","instagram":"Instagram","youtube":"YouTube",
            "tiktok":"TikTok","discord":"Discord","twitter":"Twitter",
            "followers":"abonnés","videos":"vidéos","follow":"Suivre","join":"Rejoindre"
        },
        "iot": {
            "title":"IoT Network","subtitle":"Notre réseau de capteurs marins en temps réel.",
            "badge":"Réseau de capteurs","sensors":"capteurs actifs","coverage":"de couverture côtière",
            "accuracy":"précision données","uptime":"disponibilité",
            "data_temp":"Température eau","data_swell":"Hauteur houle","data_wind":"Vent",
            "data_current":"Courant marin"
        },
        "ai_labs": {
            "title":"SwellSync AI Labs","subtitle":"La technologie derrière nos prévisions.",
            "badge":"Beta","models":"modèles actifs","accuracy":"précision",
            "data_points":"points de données","spots_covered":"spots couverts",
            "ask_ai":"Poser une question à SwellSync IA",
            "placeholder":"Ex: Quelles seront les conditions à Hossegor ce week-end ?",
            "send":"Envoyer","response_title":"Réponse IA","thinking":"Analyse en cours..."
        },
        "legal": {
            "title":"Mentions Légales","last_updated":"Dernière mise à jour",
            "editor":"Éditeur du site","host":"Hébergeur","contact":"Contact"
        },
        "cgv": {
            "title":"Conditions Générales de Vente","acceptance":"Acceptation des CGV",
            "services":"Services","pricing":"Tarifs","payment":"Paiement","cancellation":"Résiliation"
        },
        "privacy": {
            "title":"Politique de Confidentialité","intro":"Nous respectons votre vie privée.",
            "data_collected":"Données collectées","data_use":"Utilisation","rights":"Vos droits","contact":"Contact DPO"
        },
        "cookies": {
            "title":"Politique de Cookies","intro":"Nous utilisons des cookies pour améliorer votre expérience.",
            "essential":"Cookies essentiels","analytics":"Cookies analytiques","marketing":"Cookies marketing",
            "accept":"Tout accepter","reject":"Tout refuser","customize":"Personnaliser"
        },
        "chatbot": {
            "status":"Connecté · Live","clear_title":"Réinitialiser",
            "intro":"Aloha 🤙! Je suis Swell IA, propulsé par SwellSync Live.\n\nTape /aide pour mes commandes ou pose-moi une question sur les conditions, le matos, ou les spots !",
            "placeholder":"Posez votre question...","chip_spots":"/spots",
            "chip_meteo":"/météo hossegor","chip_fav":"/monfavori","chip_help":"/aide",
            "thinking":"Swell IA réfléchit...","error":"Désolé, une erreur est survenue. Réessaie !"
        },
        "spots": {
            "swell":"Houle","wind":"Vent","period":"Période","tide":"Marée",
            "offshore":"Offshore","light":"Léger","onshore":"Onshore",
            "quality_epic":"Épique","quality_excellent":"Excellent","quality_good":"Bon","quality_flat":"Plat",
            "seconds":"secondes","meters":"mètres","knots":"nœuds"
        },
        "auth": {
            "title":"Connexion","email_placeholder":"Votre email...","send_code":"Recevoir le code",
            "enter_code":"Entrer le code","verify":"Se connecter","remember_me":"Se souvenir 30 jours",
            "no_account":"Première visite ? Entrez votre email pour créer un compte.",
            "session_expired":"Session expirée — reconnectez-vous","logged_in_as":"Connecté en tant que"
        },
        "common": {
            "loading":"Chargement...","error":"Erreur","save":"Sauvegarder","cancel":"Annuler",
            "close":"Fermer","add":"Ajouter","delete":"Supprimer","all":"Tout","none":"Aucun",
            "pro":"Pro","free":"Gratuit","elite":"Élite","see_more":"Voir plus","back":"Retour",
            "share":"Partager","download":"Télécharger","refresh":"Actualiser","search":"Rechercher"
        },
        "geoloc": {
            "ask_title":"Spots près de vous","ask_desc":"Autorisez SwellSync à accéder à votre position pour voir les conditions des spots les plus proches.",
            "allow":"Autoriser la localisation","deny":"Non merci, peut-être plus tard",
            "privacy":"🔒 Votre position n'est jamais stockée.",
            "result_title":"Spot le plus proche","km_away":"km","drive":"min de route",
            "see_conditions":"Voir les conditions","itinerary":"Itinéraire","quality":"Qualité"
        }
    },
    "en": {
        "nav": {
            "home":"Home","cotes":"Coastline","conditions":"Conditions",
            "actu":"News","ai_labs":"AI Labs","communaute":"Community",
            "journal":"Surf Journal","coaching":"Coaching","abonnement":"Pro Plan",
            "pro":"Pro Tools","dashboard":"My Dashboard","contact":"Contact",
            "login":"Log In","logout":"Log Out","search":"Search",
            "surf_trip":"Surf Trip","reseaux":"Social","iot":"IoT Network"
        },
        "hero": {
            "title_1":"Ride the Waves.","title_2":"Seize the Moment.",
            "desc":"Cutting-edge surf forecasts powered by real-time ocean intelligence and advanced swell analysis.",
            "cta_swell":"Check the Swell","cta_spots":"Explore Spots",
            "tagline":"Ultra-precise surf forecasts",
            "subtitle":"Satellite data · 12 weather models · Real-time",
            "cta_map":"View map","cta_conditions":"Live conditions"
        },
        "home": {
            "map_title":"Global Network","map_heading":"Live Map",
            "map_desc":"Explore our list of premium surf spots around the world.",
            "spots_title":"Top Surf Spots","spots_live":"Live · Active spots",
            "spots_subtitle":"Premium Spots","ai_badge":"SWELLSYNC AI",
            "ai_title":"Confidence Index","ai_desc":"Ultimate calculation based on 12 neural bots.",
            "meteo_title":"Live Weather","meteo_desc":"Active Marine Meteorology system.",
            "actu_title":"Surf News","actu_badge":"News",
            "faq_title":"Frequently Asked Questions","faq_subtitle":"Everything you need to know about SwellSync.",
            "section_spots_title":"Featured Spots","section_spots_sub":"The best spots selected by our algorithm today.",
            "swell_forecast":"Swell Forecast","swell_reliability":"Checking dynamic reliability..."
        },
        "abonnement": {
            "badge":"No commitment — Cancel anytime",
            "title":"Surf","title2":"without limits",
            "desc":"Ultra-precise forecasts, real-time alerts, and pro tools to surf better.",
            "monthly":"Monthly","yearly":"Yearly","save":"Save 20%",
            "free":"Free","pro":"Pro","elite":"Elite",
            "free_price":"€0","pro_price":"€9.90","elite_price":"€24.90",
            "per_month":"/mo","per_year":"/yr",
            "cta_free":"Start for free","cta_pro":"Choose Pro","cta_elite":"Choose Elite",
            "popular":"Most popular","current":"Your current plan",
            "features_title":"All features",
            "faq_title":"Subscription FAQs",
            "cancel_anytime":"Cancel anytime, no commitment.",
            "secure_payment":"Secure payment by Stripe"
        },
        "actu": {
            "title":"News","subtitle":"Surf · Swell · Culture",
            "badge":"News","breaking":"🌊 Breaking",
            "all":"All","surf":"Surf","competition":"Competitions",
            "equipment":"Equipment","environment":"Environment","travel":"Travel","culture":"Culture",
            "read_more":"Read more","save":"Save","share":"Share",
            "no_actu":"No articles found for this filter.",
            "saved_title":"My saved articles","no_saved":"No saved articles."
        },
        "coaching": {
            "badge":"Personalized program","title":"🏄 Surf Coaching",
            "subtitle":"Targeted exercises, video technique and objectives to improve every session.",
            "all_levels":"All levels","beginner":"Beginner","intermediate":"Intermediate","advanced":"Advanced",
            "mark_done":"Mark as done","view_exercise":"View exercise",
            "my_objectives":"My Objectives","add_objective":"+ Objective","weekly_tip":"Tip of the week",
            "takeoff":"Takeoff","bottom_turn":"Bottom Turn","cutback":"Cutback",
            "exercises":"exercises","done":"done","score":"Score",
            "program_title":"My Program","tip_label":"💡 Tip of the week"
        },
        "communaute": {
            "title":"SwellSync Community","subtitle":"Connect with other passionate surfers.",
            "badge":"Community","members":"members","online":"online",
            "share":"Share","like":"Like","comment":"Comment",
            "new_post":"New post","write_placeholder":"Share your session...",
            "publish":"Publish","cancel":"Cancel",
            "feed":"Feed","events":"Events","meetups":"Meetups",
            "search_members":"Search members...","follow":"Follow","following":"Following",
            "sessions":"sessions","spots":"spots visited"
        },
        "contact": {
            "badge":"We reply within 24h","title":"Contact","title2":"the SwellSync team",
            "desc":"A question about your conditions, subscription or partnership? We're here for you.",
            "how_title":"How to reach us",
            "name_label":"Name","name_placeholder":"Your name...",
            "email_label":"Email","email_placeholder":"your@email.com",
            "subject_label":"Subject","subject_placeholder":"What is it about?",
            "message_label":"Message","message_placeholder":"Your message...",
            "send":"Send message","sent":"Message sent! We'll get back to you within 24h.",
            "error":"Send error. Please try again.",
            "faq_title":"Quick questions",
            "discord":"Our Discord","twitter":"Twitter","instagram":"Instagram"
        },
        "cotes": {
            "title":"Coastline Map","subtitle":"Explore spots in real time.",
            "badge":"Live Network","filter_all":"All spots","filter_epic":"Epic",
            "filter_good":"Good","filter_flat":"Flat","live":"Live",
            "conditions":"Conditions","swell":"Swell","wind":"Wind",
            "tide":"Tide","period":"Period","search_spot":"Search a spot...",
            "my_location":"My location","zoom_in":"Zoom +","zoom_out":"Zoom -",
            "spot_count":"active spots"
        },
        "dashboard": {
            "title":"My Dashboard","welcome":"Welcome,",
            "my_spots":"My favorite spots","my_alerts":"My alerts",
            "recent_sessions":"Recent sessions","no_sessions":"No sessions recorded.",
            "add_alert":"+ Add alert","add_spot":"+ Add spot",
            "swell_height":"Swell height","period":"Period","wind_speed":"Wind speed",
            "next_session":"Next session","plan":"Plan",
            "pro_badge":"Pro","elite_badge":"Elite","free_badge":"Free",
            "upgrade":"Go Pro","stats":"My stats","hours_in_water":"Hours in the water"
        },
        "journal": {
            "title":"Surf Journal","subtitle":"Every session deserves to be remembered.",
            "new_session":"New session","export_pdf":"PDF",
            "sessions":"Sessions","in_water":"In the water","best_score":"Best score","avg_score":"Avg score",
            "spot":"Spot","date":"Date","duration":"Duration (min)","wave_height":"Swell (m)",
            "wind":"Wind","crowd":"Crowd","notes":"Notes","save":"Save",
            "score":"Score /10","delete":"Delete","edit":"Edit",
            "no_sessions":"No sessions. Record your first session!",
            "mood":"Mood","equipment":"Equipment","photo":"Photo"
        },
        "morning_report": {
            "title":"Morning Report","subtitle":"Morning conditions by spot.",
            "badge":"Daily report 6am","generated":"Generated at","by_ai":"by SwellSync AI",
            "select_spot":"Choose a spot","refresh":"Refresh",
            "swell_analysis":"Swell analysis","wind_analysis":"Wind analysis",
            "tide_info":"Tide info","recommendation":"Recommendation",
            "epic":"EPIC","good":"GOOD","fair":"FAIR","flat":"FLAT"
        },
        "surf_trip": {
            "badge":"SwellSync Algorithm","title":"🗺️ Surf Trip Planner",
            "desc":"Find the best spots right now based on swell, tide and wind.",
            "configure":"🔍 Configure your trip","region":"Starting region",
            "all_coast":"🌊 Full coastline","duration":"Duration","level":"Level",
            "all_levels":"All levels","beginner":"Beginner","intermediate":"Intermediate","advanced":"Expert",
            "search":"🔍 Find my trip","results_title":"🏄 Recommended spots",
            "distance":"Distance","drive_time":"Drive",
            "itinerary":"🗺️ Directions","details":"View conditions"
        },
        "pro": {
            "title":"SwellSync Pro Tools","subtitle":"Advanced tools for serious surfers.",
            "badge":"Pro Tools","feature_alerts":"Custom swell alerts",
            "feature_cams":"All webcam access","feature_export":"Data export",
            "feature_ai":"Full AI analysis","feature_history":"30-day history",
            "trial":"7-day free trial","cta":"Activate Pro"
        },
        "reseaux": {
            "title":"Our Social Networks","subtitle":"Follow SwellSync on all platforms.",
            "badge":"Social","instagram":"Instagram","youtube":"YouTube",
            "tiktok":"TikTok","discord":"Discord","twitter":"Twitter",
            "followers":"followers","videos":"videos","follow":"Follow","join":"Join"
        },
        "iot": {
            "title":"IoT Network","subtitle":"Our real-time marine sensor network.",
            "badge":"Sensor network","sensors":"active sensors","coverage":"coastal coverage",
            "accuracy":"data accuracy","uptime":"uptime",
            "data_temp":"Water temperature","data_swell":"Swell height","data_wind":"Wind","data_current":"Marine current"
        },
        "ai_labs": {
            "title":"SwellSync AI Labs","subtitle":"The technology behind our forecasts.",
            "badge":"Beta","models":"active models","accuracy":"accuracy",
            "data_points":"data points","spots_covered":"spots covered",
            "ask_ai":"Ask SwellSync AI a question",
            "placeholder":"E.g. What will the conditions be at Hossegor this weekend?",
            "send":"Send","response_title":"AI Response","thinking":"Analyzing..."
        },
        "legal": {
            "title":"Legal Notice","last_updated":"Last updated",
            "editor":"Site editor","host":"Hosting","contact":"Contact"
        },
        "cgv": {
            "title":"Terms and Conditions","acceptance":"Acceptance",
            "services":"Services","pricing":"Pricing","payment":"Payment","cancellation":"Cancellation"
        },
        "privacy": {
            "title":"Privacy Policy","intro":"We respect your privacy.",
            "data_collected":"Data collected","data_use":"Usage","rights":"Your rights","contact":"DPO Contact"
        },
        "cookies": {
            "title":"Cookie Policy","intro":"We use cookies to improve your experience.",
            "essential":"Essential cookies","analytics":"Analytics cookies","marketing":"Marketing cookies",
            "accept":"Accept all","reject":"Reject all","customize":"Customize"
        },
        "chatbot": {
            "status":"Connected · Live","clear_title":"Reset",
            "intro":"Aloha 🤙! I'm Swell AI, powered by SwellSync Live.\n\nType /help for commands or ask me anything about conditions, gear, or spots!",
            "placeholder":"Ask me anything...","chip_spots":"/spots",
            "chip_meteo":"/weather hossegor","chip_fav":"/myfav","chip_help":"/help",
            "thinking":"Swell AI is thinking...","error":"Sorry, an error occurred. Try again!"
        },
        "spots": {
            "swell":"Swell","wind":"Wind","period":"Period","tide":"Tide",
            "offshore":"Offshore","light":"Light","onshore":"Onshore",
            "quality_epic":"Epic","quality_excellent":"Excellent","quality_good":"Good","quality_flat":"Flat",
            "seconds":"seconds","meters":"meters","knots":"knots"
        },
        "auth": {
            "title":"Sign In","email_placeholder":"Your email...","send_code":"Get the code",
            "enter_code":"Enter the code","verify":"Sign In","remember_me":"Remember me for 30 days",
            "no_account":"First visit? Enter your email to create an account.",
            "session_expired":"Session expired — please sign in again","logged_in_as":"Signed in as"
        },
        "common": {
            "loading":"Loading...","error":"Error","save":"Save","cancel":"Cancel",
            "close":"Close","add":"Add","delete":"Delete","all":"All","none":"None",
            "pro":"Pro","free":"Free","elite":"Elite","see_more":"See more","back":"Back",
            "share":"Share","download":"Download","refresh":"Refresh","search":"Search"
        },
        "geoloc": {
            "ask_title":"Spots near you","ask_desc":"Allow SwellSync to access your location to see conditions at the nearest spots.",
            "allow":"Allow location","deny":"No thanks, maybe later",
            "privacy":"🔒 Your location is never stored.",
            "result_title":"Nearest spot","km_away":"km","drive":"min drive",
            "see_conditions":"View conditions","itinerary":"Directions","quality":"Quality"
        }
    },
    "es": {
        "nav": {
            "home":"Inicio","cotes":"Costa","conditions":"Condiciones",
            "actu":"Noticias","ai_labs":"AI Labs","communaute":"Comunidad",
            "journal":"Diario Surf","coaching":"Coaching","abonnement":"Plan Pro",
            "pro":"Pro Tools","dashboard":"Mi Dashboard","contact":"Contacto",
            "login":"Iniciar sesión","logout":"Cerrar sesión","search":"Buscar",
            "surf_trip":"Surf Trip","reseaux":"Redes","iot":"IoT Network"
        },
        "hero": {
            "title_1":"Surfea las Olas.","title_2":"Vive el Momento.",
            "desc":"Pronósticos de surf de vanguardia impulsados por inteligencia oceánica en tiempo real.",
            "cta_swell":"Verificar el Oleaje","cta_spots":"Explorar Spots",
            "tagline":"Pronósticos de surf ultra-precisos",
            "subtitle":"Datos satelitales · 12 modelos meteorológicos · Tiempo real",
            "cta_map":"Ver el mapa","cta_conditions":"Condiciones en vivo"
        },
        "home": {
            "map_title":"Red Mundial","map_heading":"Mapa en Vivo",
            "map_desc":"Explora nuestra lista de spots de surf premium en todo el mundo.",
            "spots_title":"Top Spots de Surf","spots_live":"En vivo · Spots activos",
            "spots_subtitle":"Spots Premium","ai_badge":"IA SWELLSYNC",
            "ai_title":"Índice de Confianza","ai_desc":"Cálculo final basado en 12 bots neurales.",
            "meteo_title":"Clima en Vivo","meteo_desc":"Sistema de Meteorología Marina activo.",
            "actu_title":"Noticias de Surf","actu_badge":"Actualidad",
            "faq_title":"Preguntas Frecuentes","faq_subtitle":"Todo lo que necesitas saber sobre SwellSync.",
            "section_spots_title":"Spots Destacados","section_spots_sub":"Los mejores spots seleccionados hoy.",
            "swell_forecast":"Previsión de Oleaje","swell_reliability":"Verificación de fiabilidad..."
        },
        "abonnement": {
            "badge":"Sin compromiso — Cancela cuando quieras",
            "title":"Surfea","title2":"sin límites",
            "desc":"Pronósticos ultra-precisos, alertas en tiempo real y herramientas pro.",
            "monthly":"Mensual","yearly":"Anual","save":"Ahorra 20%",
            "free":"Gratis","pro":"Pro","elite":"Élite",
            "free_price":"0€","pro_price":"9.90€","elite_price":"24.90€",
            "per_month":"/mes","per_year":"/año",
            "cta_free":"Empezar gratis","cta_pro":"Elegir Pro","cta_elite":"Elegir Élite",
            "popular":"Más popular","current":"Tu plan actual",
            "cancel_anytime":"Cancela cuando quieras, sin compromiso.",
            "secure_payment":"Pago seguro con Stripe"
        },
        "actu": {
            "title":"Noticias","subtitle":"Surf · Oleaje · Cultura",
            "badge":"Noticias","breaking":"🌊 Últimas noticias",
            "all":"Todo","surf":"Surf","competition":"Competiciones",
            "equipment":"Equipamiento","environment":"Medio ambiente","travel":"Viaje","culture":"Cultura",
            "read_more":"Leer más","save":"Guardar","share":"Compartir",
            "no_actu":"No se encontraron artículos."
        },
        "coaching": {
            "badge":"Programa personalizado","title":"🏄 Coaching de Surf",
            "subtitle":"Ejercicios dirigidos, técnica en vídeo y objetivos para mejorar.",
            "all_levels":"Todos los niveles","beginner":"Principiante","intermediate":"Intermedio","advanced":"Avanzado",
            "mark_done":"Marcar como hecho","view_exercise":"Ver ejercicio",
            "my_objectives":"Mis Objetivos","add_objective":"+ Objetivo","weekly_tip":"Consejo de la semana"
        },
        "communaute": {
            "title":"Comunidad SwellSync","subtitle":"Conecta con otros surfistas apasionados.",
            "badge":"Comunidad","members":"miembros","online":"en línea",
            "share":"Compartir","like":"Me gusta","comment":"Comentar",
            "new_post":"Nueva publicación","write_placeholder":"Comparte tu sesión...",
            "publish":"Publicar","cancel":"Cancelar","follow":"Seguir","following":"Siguiendo"
        },
        "contact": {
            "badge":"Respondemos en 24h","title":"Contacta","title2":"al equipo SwellSync",
            "desc":"¿Una pregunta sobre tus condiciones, tu suscripción o una colaboración? Estamos aquí.",
            "name_label":"Nombre","name_placeholder":"Tu nombre...",
            "email_label":"Email","email_placeholder":"tu@email.com",
            "subject_label":"Asunto","message_label":"Mensaje",
            "send":"Enviar mensaje","sent":"¡Mensaje enviado! Te respondemos en 24h."
        },
        "cotes": {
            "title":"Mapa de Costa","subtitle":"Explora spots en tiempo real.",
            "badge":"Red en Vivo","filter_all":"Todos los spots",
            "conditions":"Condiciones","swell":"Oleaje","wind":"Viento","tide":"Marea"
        },
        "journal": {
            "title":"Diario de Surf","subtitle":"Cada sesión merece ser recordada.",
            "new_session":"Nueva sesión","export_pdf":"PDF",
            "sessions":"Sesiones","in_water":"En el agua","best_score":"Mejor puntuación",
            "spot":"Spot","date":"Fecha","duration":"Duración (min)","wave_height":"Oleaje (m)",
            "wind":"Viento","notes":"Notas","save":"Guardar","score":"Puntuación /10"
        },
        "surf_trip": {
            "badge":"Algoritmo SwellSync","title":"🗺️ Planificador de Surf Trip",
            "desc":"Encuentra los mejores spots según el oleaje, la marea y el viento.",
            "configure":"🔍 Configurar tu trip","region":"Región de salida",
            "search":"🔍 Encontrar mi trip","results_title":"🏄 Spots recomendados"
        },
        "chatbot": {
            "status":"Conectado · En vivo","clear_title":"Reiniciar",
            "intro":"¡Aloha 🤙! Soy Swell AI, impulsado por SwellSync Live.\n\nEscribe /ayuda para mis comandos o hazme una pregunta sobre condiciones, equipamiento o spots.",
            "placeholder":"Pregúntame algo...","chip_help":"/ayuda",
            "thinking":"Swell AI está pensando...","error":"Lo siento, ocurrió un error. ¡Inténtalo de nuevo!"
        },
        "spots": {
            "swell":"Oleaje","wind":"Viento","period":"Período","tide":"Marea",
            "quality_epic":"Épico","quality_excellent":"Excelente","quality_good":"Bueno","quality_flat":"Plano"
        },
        "auth": {
            "title":"Iniciar sesión","email_placeholder":"Tu email...","send_code":"Recibir código",
            "enter_code":"Introducir código","verify":"Iniciar sesión","remember_me":"Recordarme 30 días"
        },
        "common": {
            "loading":"Cargando...","error":"Error","save":"Guardar","cancel":"Cancelar",
            "close":"Cerrar","all":"Todo","see_more":"Ver más","back":"Volver","share":"Compartir"
        },
        "geoloc": {
            "ask_title":"Spots cerca de ti",
            "ask_desc":"Permite que SwellSync acceda a tu ubicación para ver las condiciones más cercanas.",
            "allow":"Permitir ubicación","deny":"No gracias","privacy":"🔒 Tu ubicación nunca se almacena.",
            "see_conditions":"Ver condiciones","itinerary":"Itinerario"
        },
        "legal":{"title":"Aviso Legal"},"cgv":{"title":"Términos y Condiciones"},
        "privacy":{"title":"Política de Privacidad"},
        "cookies":{"title":"Política de Cookies","accept":"Aceptar todo","reject":"Rechazar todo"},
        "morning_report":{"title":"Morning Report","badge":"Informe diario 6am"},
        "pro":{"title":"SwellSync Pro Tools","cta":"Activar Pro"},
        "reseaux":{"title":"Nuestras Redes Sociales","follow":"Seguir"},
        "iot":{"title":"Red IoT","badge":"Red de sensores"},
        "ai_labs":{"title":"SwellSync AI Labs","badge":"Beta","placeholder":"¿Qué condiciones esperan en...?","send":"Enviar"},
        "dashboard":{"title":"Mi Dashboard","welcome":"Bienvenido,"}
    },
    "pt": {
        "nav": {
            "home":"Início","cotes":"Costa","conditions":"Condições",
            "actu":"Notícias","ai_labs":"AI Labs","communaute":"Comunidade",
            "journal":"Diário Surf","coaching":"Coaching","abonnement":"Plano Pro",
            "pro":"Pro Tools","dashboard":"Meu Dashboard","contact":"Contato",
            "login":"Entrar","logout":"Sair","search":"Pesquisar",
            "surf_trip":"Surf Trip","reseaux":"Redes","iot":"IoT Network"
        },
        "hero": {
            "title_1":"Surfe as Ondas.","title_2":"Viva o Momento.",
            "desc":"Previsões de surf de ponta impulsionadas pela inteligência oceânica em tempo real.",
            "cta_swell":"Verificar o Swell","cta_spots":"Explorar Spots",
            "tagline":"Previsões de surf ultra-precisas",
            "subtitle":"Dados de satélite · 12 modelos meteorológicos · Tempo real",
            "cta_map":"Ver o mapa","cta_conditions":"Condições ao vivo"
        },
        "home": {
            "map_title":"Rede Mundial","map_heading":"Mapa ao Vivo",
            "map_desc":"Explore nossa lista de spots de surf premium ao redor do mundo.",
            "spots_title":"Top Spots de Surf","spots_live":"Ao vivo · Spots ativos",
            "spots_subtitle":"Spots Premium","ai_badge":"IA SWELLSYNC",
            "ai_title":"Índice de Confiança","ai_desc":"Cálculo final baseado em 12 bots neurais.",
            "meteo_title":"Clima ao Vivo","meteo_desc":"Sistema de Meteorologia Marinha ativo.",
            "actu_title":"Notícias de Surf","actu_badge":"Notícias",
            "faq_title":"Perguntas Frequentes","faq_subtitle":"Tudo que você precisa saber sobre SwellSync.",
            "section_spots_title":"Spots em Destaque","section_spots_sub":"Os melhores spots selecionados hoje.",
            "swell_forecast":"Previsão de Swell","swell_reliability":"Verificação da confiabilidade..."
        },
        "abonnement": {
            "badge":"Sem compromisso — Cancele quando quiser",
            "title":"Surfe","title2":"sem limites",
            "desc":"Previsões ultra-precisas, alertas em tempo real e ferramentas pro.",
            "monthly":"Mensal","yearly":"Anual","save":"Economize 20%",
            "free":"Gratuito","pro":"Pro","elite":"Elite",
            "free_price":"€0","pro_price":"€9,90","elite_price":"€24,90",
            "per_month":"/mês","per_year":"/ano",
            "cta_free":"Começar grátis","cta_pro":"Escolher Pro","cta_elite":"Escolher Elite",
            "popular":"Mais popular","current":"Seu plano atual",
            "cancel_anytime":"Cancele quando quiser, sem compromisso.",
            "secure_payment":"Pagamento seguro pelo Stripe"
        },
        "actu": {
            "title":"Notícias","subtitle":"Surf · Ondulação · Cultura",
            "badge":"Notícias","breaking":"🌊 Últimas notícias",
            "all":"Tudo","surf":"Surf","competition":"Competições",
            "read_more":"Ler mais","save":"Guardar","share":"Partilhar",
            "no_actu":"Nenhum artigo encontrado."
        },
        "coaching": {
            "badge":"Programa personalizado","title":"🏄 Coaching de Surf",
            "subtitle":"Exercícios direcionados, técnica em vídeo e objetivos para melhorar.",
            "all_levels":"Todos os níveis","beginner":"Iniciante","intermediate":"Intermediário","advanced":"Avançado",
            "mark_done":"Marcar como feito","view_exercise":"Ver exercício",
            "my_objectives":"Meus Objetivos","add_objective":"+ Objetivo","weekly_tip":"Dica da semana"
        },
        "communaute": {
            "title":"Comunidade SwellSync","subtitle":"Conecte-se com outros surfistas.",
            "badge":"Comunidade","members":"membros","online":"online",
            "new_post":"Nova publicação","write_placeholder":"Compartilhe sua sessão...",
            "publish":"Publicar","cancel":"Cancelar","follow":"Seguir","following":"Seguindo"
        },
        "contact": {
            "badge":"Respondemos em 24h","title":"Contacte","title2":"a equipa SwellSync",
            "desc":"Uma pergunta sobre as suas condições, subscrição ou parceria? Estamos aqui.",
            "name_label":"Nome","name_placeholder":"O seu nome...",
            "email_label":"Email","send":"Enviar mensagem","sent":"Mensagem enviada! Respondemos em 24h."
        },
        "cotes": {
            "title":"Mapa da Costa","subtitle":"Explore spots em tempo real.",
            "badge":"Rede ao Vivo","conditions":"Condições","swell":"Ondulação","wind":"Vento","tide":"Maré"
        },
        "journal": {
            "title":"Diário de Surf","subtitle":"Cada sessão merece ser lembrada.",
            "new_session":"Nova sessão","export_pdf":"PDF",
            "sessions":"Sessões","in_water":"Na água","best_score":"Melhor pontuação",
            "spot":"Spot","date":"Data","duration":"Duração (min)","wave_height":"Ondulação (m)",
            "notes":"Notas","save":"Guardar","score":"Pontuação /10"
        },
        "surf_trip": {
            "badge":"Algoritmo SwellSync","title":"🗺️ Planejador de Surf Trip",
            "desc":"Encontre os melhores spots segundo a ondulação, a maré e o vento.",
            "configure":"🔍 Configurar a sua viagem","region":"Região de partida",
            "search":"🔍 Encontrar minha viagem","results_title":"🏄 Spots recomendados"
        },
        "chatbot": {
            "status":"Conectado · Ao vivo","clear_title":"Reiniciar",
            "intro":"Aloha 🤙! Sou o Swell IA, desenvolvido pela SwellSync Live.\n\nDigite /ajuda para os comandos ou faça-me uma pergunta sobre condições, equipamentos ou spots!",
            "placeholder":"Pergunte-me algo...","chip_help":"/ajuda",
            "thinking":"Swell IA está a pensar...","error":"Desculpe, ocorreu um erro. Tente novamente!"
        },
        "spots": {
            "swell":"Ondulação","wind":"Vento","period":"Período","tide":"Maré",
            "quality_epic":"Épico","quality_excellent":"Excelente","quality_good":"Bom","quality_flat":"Plano"
        },
        "auth": {
            "title":"Entrar","email_placeholder":"O seu email...","send_code":"Receber código",
            "enter_code":"Introduzir código","verify":"Entrar","remember_me":"Lembrar-me 30 dias"
        },
        "common": {
            "loading":"Carregando...","error":"Erro","save":"Guardar","cancel":"Cancelar",
            "close":"Fechar","all":"Tudo","see_more":"Ver mais","back":"Voltar","share":"Partilhar"
        },
        "geoloc": {
            "ask_title":"Spots perto de si",
            "ask_desc":"Permita que SwellSync aceda à sua localização para ver as condições mais próximas.",
            "allow":"Permitir localização","deny":"Não obrigado","privacy":"🔒 A sua localização nunca é guardada.",
            "see_conditions":"Ver condições","itinerary":"Itinerário"
        },
        "legal":{"title":"Avisos Legais"},"cgv":{"title":"Termos e Condições"},
        "privacy":{"title":"Política de Privacidade"},
        "cookies":{"title":"Política de Cookies","accept":"Aceitar tudo","reject":"Rejeitar tudo"},
        "morning_report":{"title":"Morning Report","badge":"Relatório diário 6h"},
        "pro":{"title":"SwellSync Pro Tools","cta":"Ativar Pro"},
        "reseaux":{"title":"As Nossas Redes Sociais","follow":"Seguir"},
        "iot":{"title":"Rede IoT","badge":"Rede de sensores"},
        "ai_labs":{"title":"SwellSync AI Labs","badge":"Beta","placeholder":"Ex: Que condições haverá em Hossegor...?","send":"Enviar"},
        "dashboard":{"title":"Meu Dashboard","welcome":"Bem-vindo,"}
    }
}

# ══════════════════════════════════════════════════════════════════
# 2. ÉCRIRE LES LOCALES
# ══════════════════════════════════════════════════════════════════
for lang, data in TRANSLATIONS.items():
    path = os.path.join(LOCALES, f'{lang}.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f'✅ {lang}.json écrit ({sum(len(v) for v in data.values())} clés)')

# ══════════════════════════════════════════════════════════════════
# 3. MAP TEXTE FR → CLÉ I18N (pour injection dans le HTML)
# ══════════════════════════════════════════════════════════════════
TEXT_TO_KEY = {
    # index.html
    "Surfez les Vagues.": "hero.title_1",
    "Saisissez l'Instant.": "hero.title_2",
    "Vérifier la Houle": "hero.cta_swell",
    "Explorer les Spots": "hero.cta_spots",
    "Réseau Mondial": "home.map_title",
    "Swell Forecast": "home.swell_forecast",
    "Vérification de la fiabilité dynamique...": "home.swell_reliability",
    "Top Spots de Surf": "home.spots_title",
    "Live · Spots actifs": "home.spots_live",
    "Météo en Direct": "home.meteo_title",
    "Système de Météorologie Marine active.": "home.meteo_desc",
    # abonnement.html
    "Sans engagement — Résiliable à tout moment": "abonnement.badge",
    "Mensuel": "abonnement.monthly",
    "Annuel": "abonnement.yearly",
    "Économisez 20%": "abonnement.save",
    "Commencer gratuitement": "abonnement.cta_free",
    "Choisir Pro": "abonnement.cta_pro",
    "Choisir Élite": "abonnement.cta_elite",
    "Plus populaire": "abonnement.popular",
    "Résiliable à tout moment, sans engagement.": "abonnement.cancel_anytime",
    "Paiement sécurisé par Stripe": "abonnement.secure_payment",
    # actu.html
    "📰 Actualités": "actu.badge",
    "Actu Surf": "home.actu_title",
    "Aucun article trouvé pour ce filtre.": "actu.no_actu",
    "Mes articles sauvegardés": "actu.saved_title",
    # coaching.html
    "Programme personnalisé": "coaching.badge",
    "🏄 Coaching Surf": "coaching.title",
    "Tous les niveaux": "coaching.all_levels",
    "Débutant": "coaching.beginner",
    "Intermédiaire": "coaching.intermediate",
    "Avancé": "coaching.advanced",
    "Marquer comme fait": "coaching.mark_done",
    "Voir l'exercice": "coaching.view_exercise",
    "Mes Objectifs": "coaching.my_objectives",
    "Conseil de la semaine": "coaching.weekly_tip",
    # communaute.html
    "Nouveau post": "communaute.new_post",
    "Partagez votre session...": "communaute.write_placeholder",
    "Publier": "communaute.publish",
    "Fil d'actualité": "communaute.feed",
    "Événements": "communaute.events",
    # contact.html
    "On vous répond sous 24h": "contact.badge",
    "Votre nom...": "contact.name_placeholder",
    "votre@email.com": "contact.email_placeholder",
    "De quoi s'agit-il ?": "contact.subject_placeholder",
    "Votre message...": "contact.message_placeholder",
    "Envoyer le message": "contact.send",
    "Message envoyé ! On revient vers vous sous 24h.": "contact.sent",
    # cotes.html
    "Tous les spots": "cotes.filter_all",
    "Rechercher un spot...": "cotes.search_spot",
    # dashboard.html
    "Mes spots favoris": "dashboard.my_spots",
    "Mes alertes": "dashboard.my_alerts",
    "Heures dans l'eau": "dashboard.hours_in_water",
    # journal.html
    "Journal de Surf": "journal.title",
    "Chaque session mérite d'être immortalisée.": "journal.subtitle",
    "Nouvelle session": "journal.new_session",
    "Dans l'eau": "journal.in_water",
    "Meilleur score": "journal.best_score",
    "Score moyen": "journal.avg_score",
    "Enregistrer": "journal.save",
    "Aucune session. Enregistrez votre première session !": "journal.no_sessions",
    # surf-trip.html
    "Algorithme SwellSync": "surf_trip.badge",
    "🗺️ Surf Trip Planner": "surf_trip.title",
    "🔍 Configurer votre trip": "surf_trip.configure",
    "🔍 Trouver mon trip": "surf_trip.search",
    "🏄 Spots recommandés": "surf_trip.results_title",
    # morning-report.html
    "Morning Report": "morning_report.title",
    "Rapport quotidien 6h00": "morning_report.badge",
    # common
    "Chargement...": "common.loading",
    "Fermer": "common.close",
    "Annuler": "common.cancel",
    "Sauvegarder": "common.save",
    "Voir plus": "common.see_more",
    "Retour": "common.back",
    "Rechercher": "common.search",
    "Actualiser": "common.refresh",
    # legal pages
    "Mentions Légales": "legal.title",
    "Conditions Générales de Vente": "cgv.title",
    "Politique de Confidentialité": "privacy.title",
    "Politique de Cookies": "cookies.title",
    "Tout accepter": "cookies.accept",
    "Tout refuser": "cookies.reject",
    # reseaux
    "Nos Réseaux Sociaux": "reseaux.title",
    # iot
    "IoT Network": "iot.title",
    # ai_labs
    "SwellSync AI Labs": "ai_labs.title",
}

# ══════════════════════════════════════════════════════════════════
# 4. INJECTION data-i18n DANS TOUS LES HTML
# ══════════════════════════════════════════════════════════════════
import re

def inject_data_i18n(html_content, page_name):
    count = 0
    for fr_text, key in TEXT_TO_KEY.items():
        # Ignorer les textes déjà traduits
        escaped = re.escape(fr_text)
        
        # Pattern 1: textContent simple dans des balises h1-h6, p, span, button, a, label, td, li, div
        # Ajoute data-i18n si pas déjà présent
        patterns = [
            # <tag ...>TEXT</tag> ou <tag ...>  TEXT  </tag>
            (rf'(<(?:h[1-6]|p|span|button|a|label|td|li|strong|em|small)(?:[^>]*)(?<!data-i18n="\S+")>)\s*{escaped}\s*(</)', 
             lambda m, k=key: f'{m.group(1).rstrip(">").rstrip()} data-i18n="{k}">{fr_text}{m.group(2)}'),
            # placeholder="TEXT"
            (rf'placeholder="{escaped}"', f'placeholder="{fr_text}" data-i18n-placeholder="{key}"'),
            # title="TEXT"  
            (rf'title="{escaped}"', f'title="{fr_text}" data-i18n-title="{key}"'),
        ]
        
        # Pattern simple : cherche le texte brut dans des tags courants
        # On évite les attributs (src=, href=, class=, id=)
        new_content = re.sub(
            rf'(>)\s*({escaped})\s*(<\/(?:h[1-6]|p|span|button|a|label|td|li|strong|em|small|div)>)',
            lambda m, k=key: f' data-i18n="{k}">'.join([m.group(1), m.group(2) + m.group(3)]),
            html_content,
            flags=re.IGNORECASE
        )
        if new_content != html_content:
            html_content = new_content
            count += 1
        
        # Placeholder
        new_content = html_content.replace(
            f'placeholder="{fr_text}"',
            f'data-i18n-placeholder="{key}" placeholder="{fr_text}"'
        )
        if new_content != html_content:
            html_content = new_content
            count += 1
            
    return html_content, count

html_files = [f for f in os.listdir(BASE) if f.endswith('.html')]
total_injected = 0

for html_file in sorted(html_files):
    path = os.path.join(BASE, html_file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content, count = inject_data_i18n(content, html_file)
    
    if count > 0:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        total_injected += count
        print(f'  📄 {html_file}: +{count} data-i18n injectés')
    else:
        print(f'  ⬜ {html_file}: aucun texte correspondant')

print(f'\n✅ Total: {total_injected} attributs data-i18n injectés dans {len(html_files)} pages')
