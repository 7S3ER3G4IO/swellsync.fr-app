/**
 * SwellSync — i18n FR/EN translation system
 * Include on every page: <script src="js/i18n.js"></script>
 * 
 * Usage: add data-i18n="key" attributes to elements
 * Or data-i18n-placeholder="key" for placeholders
 */

const SW_I18N = {
    fr: {
        // Nav
        'nav.home': 'Home',
        'nav.spots': 'Spots',
        'nav.alerts': 'Alertes',
        'nav.community': 'Communauté',
        'nav.profile': 'Profil',

        // Home
        'home.title': 'Accueil',
        'home.greeting': 'Salut',
        'home.surf_ready': 'Prêt à surfer ?',
        'home.community': 'Communauté',
        'home.community.online': 'en ligne',
        'home.community.trending': 'Trending',
        'home.community.join': 'Rejoindre la communauté',
        'home.community.discover': 'Découvrir la discussion',
        'home.favs': 'Tes Spots Favoris',
        'home.favs.see_all': 'Voir tout',
        'home.coaching': 'Coaching & Tips',
        'home.coaching.title': 'Conseils de Pro',
        'home.coaching.see': 'Voir les tips',
        'home.wind_waves': 'Vent & Vagues — live',
        'home.wind': 'Vent',
        'home.waves': 'Houle',
        'home.temp': 'Eau',
        'home.conditions': 'Conditions du jour',
        'home.tides': 'Marées',
        'home.high_tide': 'Pleine mer',
        'home.low_tide': 'Basse mer',
        'home.uv_sun': 'UV & Soleil',
        'home.uv_index': 'Index UV',
        'home.sunrise': 'Lever',
        'home.sunset': 'Coucher',
        'home.water_quality': 'Qualité eau',
        'home.crowd': 'Fréquentation',

        // Profile
        'profile.title': 'Mon Profil',
        'profile.edit': 'Modifier le profil',
        'profile.share': 'Partager le profil',
        'profile.posts': 'Posts',
        'profile.followers': 'Abonnés',
        'profile.following': 'Abonnements',
        'profile.sessions': 'Sessions',
        'profile.favorites': 'Favoris',
        'profile.alerts': 'Alertes',
        'profile.settings': 'Paramètres',
        'profile.dark_mode': 'Mode Sombre',
        'profile.light_mode': 'Mode Clair',
        'profile.language': 'Langue',
        'profile.swell_alerts': 'Mes Alertes Houle',
        'profile.edit_profile': 'Modifier le profil',
        'profile.push': 'Notifications Push',
        'profile.sign_out': 'Se déconnecter',
        'profile.no_posts': 'Aucun post pour le moment.',
        'profile.share_first': 'Partage ta première session dans la communauté !',
        'profile.no_sessions': 'Aucune session enregistrée.',
        'profile.no_favs': 'Aucun spot favori. Explore la carte !',
        'profile.name_label': 'Prénom / Pseudo',
        'profile.bio_label': 'Bio / Description',
        'profile.level_label': 'Niveau',
        'profile.since_label': 'Année de début',
        'profile.wave_pref': 'Houle préférée',
        'profile.sig_spot': 'Spot signature',
        'profile.cancel': 'Annuler',
        'profile.save': 'Sauvegarder',
        'profile.not_connected': 'Non connecté',

        // Spots
        'spots.title': 'Spots',
        'spots.search': '🔍  Chercher un spot, une ville…',
        'spots.all': 'Tous',
        'spots.beginner': '🌊 Débutant',
        'spots.intermediate': '⚡ Inter.',
        'spots.advanced': '🔥 Avancé',
        'spots.favorites': '❤️ Favoris',
        'spots.no_results': 'Aucun spot trouvé',
        'spots.change_filters': 'Essaie de changer les filtres',

        // Community
        'community.title': 'Communauté',
        'community.online': 'en ligne',
        'community.feed': 'Feed',
        'community.ranking': 'Classement',
        'community.sessions': 'Sessions',
        'community.spots': 'Spots',
        'community.publish': 'Publier',
        'community.share_placeholder': 'Partage ta session, une houle, un spot…',
        'community.reply': 'Répondre',
        'community.reply_placeholder': 'Ta réponse…',
        'community.log_session': 'Logger une session',
        'community.save_session': 'Enregistrer la session',
        'community.shop': 'Boutique SwellSync',
        'community.badges': 'Badges',
        'community.stickers': 'Stickers',
        'community.profile_items': 'Profil',

        // Alerts
        'alerts.title': 'Mes Alertes Houle',
        'alerts.add': 'Nouvelle alerte',
        'alerts.no_alerts': 'Aucune alerte configurée.',
        'alerts.create': 'Créer une alerte',

        // General
        'general.loading': 'Chargement…',
        'general.error': 'Erreur',
        'general.close': 'Fermer',
        'general.back': 'Retour',
        'general.see_more': 'Voir plus',
        'general.ok': 'OK',
    },

    en: {
        // Nav
        'nav.home': 'Home',
        'nav.spots': 'Spots',
        'nav.alerts': 'Alerts',
        'nav.community': 'Community',
        'nav.profile': 'Profile',

        // Home
        'home.title': 'Home',
        'home.greeting': 'Hey',
        'home.surf_ready': 'Ready to surf?',
        'home.community': 'Community',
        'home.community.online': 'online',
        'home.community.trending': 'Trending',
        'home.community.join': 'Join the community',
        'home.community.discover': 'Discover the discussion',
        'home.favs': 'Your Favorite Spots',
        'home.favs.see_all': 'See all',
        'home.coaching': 'Coaching & Tips',
        'home.coaching.title': 'Pro Tips',
        'home.coaching.see': 'See tips',
        'home.wind_waves': 'Wind & Waves — live',
        'home.wind': 'Wind',
        'home.waves': 'Swell',
        'home.temp': 'Water',
        'home.conditions': 'Today\'s conditions',
        'home.tides': 'Tides',
        'home.high_tide': 'High tide',
        'home.low_tide': 'Low tide',
        'home.uv_sun': 'UV & Sun',
        'home.uv_index': 'UV Index',
        'home.sunrise': 'Sunrise',
        'home.sunset': 'Sunset',
        'home.water_quality': 'Water quality',
        'home.crowd': 'Crowd level',

        // Profile
        'profile.title': 'My Profile',
        'profile.edit': 'Edit profile',
        'profile.share': 'Share profile',
        'profile.posts': 'Posts',
        'profile.followers': 'Followers',
        'profile.following': 'Following',
        'profile.sessions': 'Sessions',
        'profile.favorites': 'Favorites',
        'profile.alerts': 'Alerts',
        'profile.settings': 'Settings',
        'profile.dark_mode': 'Dark Mode',
        'profile.light_mode': 'Light Mode',
        'profile.language': 'Language',
        'profile.swell_alerts': 'My Swell Alerts',
        'profile.edit_profile': 'Edit Profile',
        'profile.push': 'Push Notifications',
        'profile.sign_out': 'Sign Out',
        'profile.no_posts': 'No posts yet.',
        'profile.share_first': 'Share your first session with the community!',
        'profile.no_sessions': 'No sessions recorded.',
        'profile.no_favs': 'No favorite spots. Explore the map!',
        'profile.name_label': 'Name / Username',
        'profile.bio_label': 'Bio / Description',
        'profile.level_label': 'Level',
        'profile.since_label': 'Year started',
        'profile.wave_pref': 'Preferred swell',
        'profile.sig_spot': 'Signature spot',
        'profile.cancel': 'Cancel',
        'profile.save': 'Save',
        'profile.not_connected': 'Not logged in',

        // Spots
        'spots.title': 'Spots',
        'spots.search': '🔍  Search for a spot, city…',
        'spots.all': 'All',
        'spots.beginner': '🌊 Beginner',
        'spots.intermediate': '⚡ Inter.',
        'spots.advanced': '🔥 Advanced',
        'spots.favorites': '❤️ Favorites',
        'spots.no_results': 'No spots found',
        'spots.change_filters': 'Try changing the filters',

        // Community
        'community.title': 'Community',
        'community.online': 'online',
        'community.feed': 'Feed',
        'community.ranking': 'Ranking',
        'community.sessions': 'Sessions',
        'community.spots': 'Spots',
        'community.publish': 'Post',
        'community.share_placeholder': 'Share a session, swell, spot…',
        'community.reply': 'Reply',
        'community.reply_placeholder': 'Your reply…',
        'community.log_session': 'Log a session',
        'community.save_session': 'Save session',
        'community.shop': 'SwellSync Shop',
        'community.badges': 'Badges',
        'community.stickers': 'Stickers',
        'community.profile_items': 'Profile',

        // Alerts
        'alerts.title': 'My Swell Alerts',
        'alerts.add': 'New alert',
        'alerts.no_alerts': 'No alerts configured.',
        'alerts.create': 'Create an alert',

        // General
        'general.loading': 'Loading…',
        'general.error': 'Error',
        'general.close': 'Close',
        'general.back': 'Back',
        'general.see_more': 'See more',
        'general.ok': 'OK',
    }
};

/**
 * Get current language
 */
function swGetLang() {
    return localStorage.getItem('sw_lang') || 'fr';
}

/**
 * Translate a key
 */
function swT(key) {
    const lang = swGetLang();
    return SW_I18N[lang]?.[key] || SW_I18N['fr']?.[key] || key;
}

/**
 * Apply translations to all [data-i18n] elements on the page
 */
function swApplyI18n() {
    const lang = swGetLang();
    const dict = SW_I18N[lang] || SW_I18N['fr'];

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) el.textContent = dict[key];
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) el.placeholder = dict[key];
    });

    // Title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (dict[key]) el.title = dict[key];
    });

    // Update html lang
    document.documentElement.lang = lang;
}

// Auto-apply on load
document.addEventListener('DOMContentLoaded', () => {
    swApplyI18n();
});
