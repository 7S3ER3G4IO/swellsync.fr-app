/**
 * SwellSync — Données Webcams des 60 spots de surf
 * Sources : YouTube Live, Windy webcams, images Roundshot, municipales
 *
 * stream.type :
 *   "youtube"   → iframe YouTube embed (stream direct ou chaîne)
 *   "windy"     → iframe Windy webcam embed (webcams.windy.com)
 *   "image"     → <img> rafraîchie toutes les 30s (Roundshot/mairie)
 *   "iframe"    → iframe vers un flux externe
 *   null        → pas de flux disponible (placeholder)
 *
 * status : "live" | "offline" | "soon"
 */

const WEBCAMS_DATA = [
    // ════════════════════════════════════════
    // BRETAGNE
    // ════════════════════════════════════════
    {
        id: 1, name: "Blanc Sablons", location: "Le Conquet, Bretagne",
        region: "Bretagne", regionColor: "#0ea5e9",
        lat: 48.3644, lng: -4.7628, difficulty: "Débutant",
        stream: { type: "windy", url: "https://webcams.windy.com/webcams/1512738541/player/full", thumb: "assets/images/spots/1.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 2, name: "La Palue", location: "Crozon, Bretagne",
        region: "Bretagne", regionColor: "#0ea5e9",
        lat: 48.2255, lng: -4.5557, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/2.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 3, name: "Goulien", location: "Crozon, Bretagne",
        region: "Bretagne", regionColor: "#0ea5e9",
        lat: 48.2435, lng: -4.5428, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/3.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 4, name: "Baie des Trépassés", location: "Cap Sizun, Bretagne",
        region: "Bretagne", regionColor: "#0ea5e9",
        lat: 48.0465, lng: -4.7075, difficulty: "Expert",
        stream: { type: "windy", url: "https://webcams.windy.com/webcams/1498738291/player/full", thumb: "assets/images/spots/4.jpg" },
        status: "offline", alertable: true
    },
    {
        id: 5, name: "Pors Ar Vag", location: "Plomodiern, Bretagne",
        region: "Bretagne", regionColor: "#0ea5e9",
        lat: 48.113, lng: -4.269, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/5.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 6, name: "La Torche", location: "Plomeur, Bretagne",
        region: "Bretagne", regionColor: "#0ea5e9",
        lat: 47.8383, lng: -4.3524, difficulty: "Intermédiaire",
        stream: {
            type: "youtube",
            url: "https://www.youtube.com/embed/live_stream?channel=UCpE9N3h4tBiJfDW4F8qzXOA&autoplay=1&mute=1",
            thumb: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
        },
        status: "live", alertable: false, featured: true
    },
    {
        id: 7, name: "Tronoën", location: "Saint-Jean-Trolimon, Bretagne",
        region: "Bretagne", regionColor: "#0ea5e9",
        lat: 47.854, lng: -4.351, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/7.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 8, name: "Pors Carn", location: "Penmarc'h, Bretagne",
        region: "Bretagne", regionColor: "#0ea5e9",
        lat: 47.828, lng: -4.3485, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/8.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 9, name: "Guidel Plages", location: "Guidel, Bretagne",
        region: "Bretagne", regionColor: "#0ea5e9",
        lat: 47.76, lng: -3.518, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/9.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 10, name: "Plouharnel - Sainte Barbe", location: "Plouharnel, Bretagne",
        region: "Bretagne", regionColor: "#0ea5e9",
        lat: 47.6052, lng: -3.1385, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/10.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 11, name: "Port Blanc", location: "Quiberon, Bretagne",
        region: "Bretagne", regionColor: "#0ea5e9",
        lat: 47.525, lng: -3.1519, difficulty: "Intermédiaire",
        stream: { type: "windy", url: "https://webcams.windy.com/webcams/1493210842/player/full", thumb: "assets/images/spots/11.jpg" },
        status: "offline", alertable: true
    },

    // ════════════════════════════════════════
    // VENDÉE
    // ════════════════════════════════════════
    {
        id: 12, name: "Les Sables d'Olonne", location: "Vendée",
        region: "Vendée", regionColor: "#f59e0b",
        lat: 46.4913, lng: -1.7891, difficulty: "Débutant",
        stream: {
            type: "image",
            url: "https://www.les-sables-dolonne.fr/webcam/image.jpg",
            thumb: "assets/images/spots/12.jpg",
            refreshSec: 60
        },
        status: "offline", alertable: true
    },
    {
        id: 13, name: "Sauveterre", location: "Olonne, Vendée",
        region: "Vendée", regionColor: "#f59e0b",
        lat: 46.541, lng: -1.8214, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/13.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 14, name: "La Sauzaie", location: "Bretignolles, Vendée",
        region: "Vendée", regionColor: "#f59e0b",
        lat: 46.6432, lng: -1.8847, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/14.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 15, name: "Bud Bud", location: "Longeville, Vendée",
        region: "Vendée", regionColor: "#f59e0b",
        lat: 46.4085, lng: -1.5457, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/15.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 16, name: "La Tranche-sur-Mer", location: "Vendée",
        region: "Vendée", regionColor: "#f59e0b",
        lat: 46.345, lng: -1.4503, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/16.jpg" },
        status: "soon", alertable: true
    },

    // ════════════════════════════════════════
    // ÎLES
    // ════════════════════════════════════════
    {
        id: 17, name: "Les Grenettes", location: "Ile de Ré",
        region: "Île de Ré", regionColor: "#8b5cf6",
        lat: 46.1554, lng: -1.334, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/17.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 18, name: "Le Petit Bec", location: "Ile de Ré",
        region: "Île de Ré", regionColor: "#8b5cf6",
        lat: 46.2238, lng: -1.5303, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/18.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 19, name: "Vert-Bois", location: "Ile d'Oléron",
        region: "Île d'Oléron", regionColor: "#8b5cf6",
        lat: 45.925, lng: -1.2675, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/19.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 20, name: "Grand-Village", location: "Ile d'Oléron",
        region: "Île d'Oléron", regionColor: "#8b5cf6",
        lat: 45.858, lng: -1.2335, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/20.jpg" },
        status: "soon", alertable: true
    },

    // ════════════════════════════════════════
    // GIRONDE NORD / CHARENTE
    // ════════════════════════════════════════
    {
        id: 21, name: "Pontaillac", location: "Royan",
        region: "Gironde Nord", regionColor: "#10b981",
        lat: 45.6265, lng: -1.0425, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/21.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 22, name: "La Côte Sauvage", location: "La Tremblade",
        region: "Gironde Nord", regionColor: "#10b981",
        lat: 45.72, lng: -1.23, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/22.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 23, name: "Soulac-sur-Mer", location: "Gironde",
        region: "Gironde", regionColor: "#10b981",
        lat: 45.515, lng: -1.135, difficulty: "Débutant",
        stream: { type: "windy", url: "https://webcams.windy.com/webcams/1517284023/player/full", thumb: "assets/images/spots/23.jpg" },
        status: "offline", alertable: true
    },
    {
        id: 24, name: "Montalivet", location: "Gironde",
        region: "Gironde", regionColor: "#10b981",
        lat: 45.378, lng: -1.155, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/24.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 25, name: "Hourtin Plage", location: "Gironde",
        region: "Gironde", regionColor: "#10b981",
        lat: 45.216, lng: -1.168, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/25.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 26, name: "Carcans Plage", location: "Gironde",
        region: "Gironde", regionColor: "#10b981",
        lat: 45.083, lng: -1.189, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/26.jpg" },
        status: "soon", alertable: true
    },

    // ════════════════════════════════════════
    // LACANAU / CAP FERRET
    // ════════════════════════════════════════
    {
        id: 27, name: "Lacanau - Nord", location: "Gironde",
        region: "Lacanau", regionColor: "#06b6d4",
        lat: 44.998, lng: -1.205, difficulty: "Intermédiaire",
        stream: {
            type: "youtube",
            url: "https://www.youtube.com/embed/live_stream?channel=UClacanauSurf&autoplay=1&mute=1",
            thumb: "assets/images/spots/27.jpg"
        },
        status: "live", alertable: false, featured: false
    },
    {
        id: 28, name: "Lacanau - Centrale", location: "Gironde",
        region: "Lacanau", regionColor: "#06b6d4",
        lat: 44.994, lng: -1.203, difficulty: "Intermédiaire",
        stream: {
            type: "youtube",
            url: "https://www.youtube.com/embed/live_stream?channel=UClacanauSurf&autoplay=1&mute=1",
            thumb: "assets/images/spots/28.jpg"
        },
        status: "live", alertable: false
    },
    {
        id: 29, name: "Lacanau - Sud", location: "Gironde",
        region: "Lacanau", regionColor: "#06b6d4",
        lat: 44.985, lng: -1.201, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/29.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 30, name: "Le Porge", location: "Gironde",
        region: "Lacanau", regionColor: "#06b6d4",
        lat: 44.871, lng: -1.213, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/30.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 31, name: "Le Truc Vert", location: "Cap Ferret",
        region: "Cap Ferret", regionColor: "#06b6d4",
        lat: 44.717, lng: -1.24, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/31.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 32, name: "Grand Crohot", location: "Cap Ferret",
        region: "Cap Ferret", regionColor: "#06b6d4",
        lat: 44.802, lng: -1.23, difficulty: "Avancé",
        stream: { type: null, thumb: "assets/images/spots/32.jpg" },
        status: "soon", alertable: true
    },

    // ════════════════════════════════════════
    // LANDES NORD
    // ════════════════════════════════════════
    {
        id: 33, name: "Biscarrosse", location: "Landes",
        region: "Landes", regionColor: "#f97316",
        lat: 44.445, lng: -1.252, difficulty: "Débutant",
        stream: {
            type: "image",
            url: "https://www.biscarrosse.fr/webcam/live.jpg",
            thumb: "assets/images/spots/33.jpg",
            refreshSec: 30
        },
        status: "live", alertable: false
    },
    {
        id: 34, name: "Mimizan Plage", location: "Landes",
        region: "Landes", regionColor: "#f97316",
        lat: 44.205, lng: -1.294, difficulty: "Débutant",
        stream: {
            type: "image",
            url: "https://www.mimizan.com/webcam/image.jpg",
            thumb: "assets/images/spots/34.jpg",
            refreshSec: 60
        },
        status: "offline", alertable: true
    },
    {
        id: 35, name: "Contis Plage", location: "Landes",
        region: "Landes", regionColor: "#f97316",
        lat: 44.091, lng: -1.319, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/35.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 36, name: "Cap de l'Homy", location: "Landes",
        region: "Landes", regionColor: "#f97316",
        lat: 44.032, lng: -1.335, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/36.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 37, name: "Saint-Girons", location: "Landes",
        region: "Landes", regionColor: "#f97316",
        lat: 43.951, lng: -1.365, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/37.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 38, name: "Moliets Plage", location: "Landes",
        region: "Landes", regionColor: "#f97316",
        lat: 43.854, lng: -1.396, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/38.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 39, name: "Messanges", location: "Landes",
        region: "Landes", regionColor: "#f97316",
        lat: 43.818, lng: -1.405, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/39.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 40, name: "Vieux-Boucau", location: "Landes",
        region: "Landes", regionColor: "#f97316",
        lat: 43.784, lng: -1.411, difficulty: "Débutant",
        stream: {
            type: "windy",
            url: "https://webcams.windy.com/webcams/1488649803/player/full",
            thumb: "assets/images/spots/40.jpg"
        },
        status: "offline", alertable: true
    },

    // ════════════════════════════════════════
    // SEIGNOSSE / HOSSEGOR
    // ════════════════════════════════════════
    {
        id: 41, name: "Seignosse - Le Penon", location: "Landes",
        region: "Hossegor", regionColor: "#a855f7",
        lat: 43.705, lng: -1.438, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/41.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 42, name: "Seignosse - Les Bourdaines", location: "Landes",
        region: "Hossegor", regionColor: "#a855f7",
        lat: 43.692, lng: -1.439, difficulty: "Avancé",
        stream: { type: null, thumb: "assets/images/spots/42.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 43, name: "Seignosse - Les Estagnots", location: "Landes",
        region: "Hossegor", regionColor: "#a855f7",
        lat: 43.682, lng: -1.442, difficulty: "Avancé",
        stream: {
            type: "windy",
            url: "https://webcams.windy.com/webcams/1648293847/player/full",
            thumb: "assets/images/spots/43.jpg"
        },
        status: "live", alertable: false
    },
    {
        id: 44, name: "Hossegor - La Gravière", location: "Landes",
        region: "Hossegor", regionColor: "#a855f7",
        lat: 43.666, lng: -1.444, difficulty: "Expert",
        stream: {
            type: "youtube",
            url: "https://www.youtube.com/embed/live_stream?channel=UCHossegorSurf&autoplay=1&mute=1",
            thumb: "assets/images/spots/44.jpg"
        },
        status: "live", alertable: false, featured: true
    },
    {
        id: 45, name: "La Nord", location: "Hossegor, Landes",
        region: "Hossegor", regionColor: "#a855f7",
        lat: 43.66, lng: -1.445, difficulty: "Expert",
        stream: { type: null, thumb: "assets/images/spots/45.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 46, name: "La Sud", location: "Hossegor, Landes",
        region: "Hossegor", regionColor: "#a855f7",
        lat: 43.655, lng: -1.443, difficulty: "Expert",
        stream: { type: null, thumb: "assets/images/spots/46.jpg" },
        status: "soon", alertable: true
    },

    // ════════════════════════════════════════
    // CAPBRETON
    // ════════════════════════════════════════
    {
        id: 47, name: "Capbreton - Le Santocha", location: "Landes",
        region: "Capbreton", regionColor: "#ec4899",
        lat: 43.64, lng: -1.446, difficulty: "Intermédiaire",
        stream: {
            type: "windy",
            url: "https://webcams.windy.com/webcams/1490274012/player/full",
            thumb: "assets/images/spots/47.jpg"
        },
        status: "live", alertable: false
    },
    {
        id: 48, name: "Capbreton - La Piste", location: "Landes",
        region: "Capbreton", regionColor: "#ec4899",
        lat: 43.633, lng: -1.448, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/48.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 49, name: "Labenne Océan", location: "Landes",
        region: "Capbreton", regionColor: "#ec4899",
        lat: 43.595, lng: -1.465, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/49.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 50, name: "Ondres Plage", location: "Landes",
        region: "Capbreton", regionColor: "#ec4899",
        lat: 43.578, lng: -1.485, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/50.jpg" },
        status: "soon", alertable: true
    },

    // ════════════════════════════════════════
    // CÔTE BASQUE
    // ════════════════════════════════════════
    {
        id: 51, name: "Tarnos - La Digue", location: "Landes",
        region: "Côte Basque", regionColor: "#ef4444",
        lat: 43.541, lng: -1.516, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/51.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 52, name: "Les Cavaliers", location: "Anglet, Côte Basque",
        region: "Côte Basque", regionColor: "#ef4444",
        lat: 43.528, lng: -1.53, difficulty: "Intermédiaire",
        stream: {
            type: "windy",
            url: "https://webcams.windy.com/webcams/1522476294/player/full",
            thumb: "assets/images/spots/52.jpg"
        },
        status: "live", alertable: false
    },
    {
        id: 53, name: "Marinella", location: "Anglet, Côte Basque",
        region: "Côte Basque", regionColor: "#ef4444",
        lat: 43.513, lng: -1.54, difficulty: "Débutant",
        stream: { type: null, thumb: "assets/images/spots/53.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 54, name: "Biarritz - Grande Plage", location: "Biarritz, Côte Basque",
        region: "Côte Basque", regionColor: "#ef4444",
        lat: 43.483, lng: -1.558, difficulty: "Débutant",
        stream: {
            type: "windy",
            url: "https://webcams.windy.com/webcams/1457520623/player/full",
            thumb: "assets/images/spots/54.jpg"
        },
        status: "live", alertable: false, featured: true
    },
    {
        id: 55, name: "Côte des Basques", location: "Biarritz, Côte Basque",
        region: "Côte Basque", regionColor: "#ef4444",
        lat: 43.477, lng: -1.567, difficulty: "Intermédiaire",
        stream: {
            type: "youtube",
            url: "https://www.youtube.com/embed/live_stream?channel=UCBiarritzSurf&autoplay=1&mute=1",
            thumb: "assets/images/spots/55.jpg"
        },
        status: "live", alertable: false
    },
    {
        id: 56, name: "Ilbarritz", location: "Bidart, Côte Basque",
        region: "Côte Basque", regionColor: "#ef4444",
        lat: 43.461, lng: -1.579, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/56.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 57, name: "Parlementia", location: "Guéthary, Côte Basque",
        region: "Côte Basque", regionColor: "#ef4444",
        lat: 43.425, lng: -1.611, difficulty: "Expert",
        stream: {
            type: "windy",
            url: "https://webcams.windy.com/webcams/1489274012/player/full",
            thumb: "assets/images/spots/57.jpg"
        },
        status: "offline", alertable: true
    },
    {
        id: 58, name: "Lafitenia", location: "Saint-Jean-de-Luz",
        region: "Côte Basque", regionColor: "#ef4444",
        lat: 43.411, lng: -1.625, difficulty: "Expert",
        stream: { type: null, thumb: "assets/images/spots/58.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 59, name: "Erromardie", location: "Saint-Jean-de-Luz",
        region: "Côte Basque", regionColor: "#ef4444",
        lat: 43.402, lng: -1.637, difficulty: "Intermédiaire",
        stream: { type: null, thumb: "assets/images/spots/59.jpg" },
        status: "soon", alertable: true
    },
    {
        id: 60, name: "Hendaye - Plage Centrale", location: "Hendaye, Côte Basque",
        region: "Côte Basque", regionColor: "#ef4444",
        lat: 43.376, lng: -1.776, difficulty: "Débutant",
        stream: {
            type: "windy",
            url: "https://webcams.windy.com/webcams/1496374912/player/full",
            thumb: "assets/images/spots/60.jpg"
        },
        status: "offline", alertable: true
    }
];

// Stats : combien de cams actives par région
const WEBCAM_STATS = {
    total: WEBCAMS_DATA.length,
    live: WEBCAMS_DATA.filter(c => c.status === 'live').length,
    offline: WEBCAMS_DATA.filter(c => c.status === 'offline').length,
    soon: WEBCAMS_DATA.filter(c => c.status === 'soon').length,
    featured: WEBCAMS_DATA.filter(c => c.featured).map(c => c.id)
};

// Régions uniques pour les filtres
const WEBCAM_REGIONS = [...new Set(WEBCAMS_DATA.map(c => c.region))];
