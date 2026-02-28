const axios = require('axios');

/**
 * Service pour interagir avec des API externes de météorologie et d'océanographie.
 * Ici, nous utilisons "Open-Meteo Marine API" car c'est gratuit, précis, et sans clé d'API requise.
 * Parfait pour un projet complet de Surf "de A à Z" sans bloquer d'emblée les appels.
 */
class SurfApiService {
    /**
    /**
     * Récupère les données de vagues (Open-Meteo - GRATUIT & ILLIMITÉ)
     */
    static async getWaveData(lat, lng) {
        return this.getWaveDataFromOpenMeteo(lat, lng);
        // Note: Pour activer Stormglass plus tard, décommenter la ligne ci-dessous :
        // return this.getWaveDataFromStormglass(lat, lng);
    }

    /**
     * Open-Meteo Marine API (Fallback actuel par défaut)
     */
    static async getWaveDataFromOpenMeteo(lat, lng) {

        try {
            const response = await axios.get('https://marine-api.open-meteo.com/v1/marine', {
                params: {
                    latitude: lat,
                    longitude: lng,
                    current: 'wave_height,wave_direction,wave_period',
                    timezone: 'auto'
                },
                timeout: 3000 // Sécurité vitale contre les requêtes Axios qui freez le backend si le serveur bloque ipv6
            });

            const current = response.data.current;

            return {
                wave_height: current.wave_height,
                wave_period: current.wave_period,
                wave_direction: current.wave_direction,
                source: 'open-meteo'
            };
        } catch (error) {
            console.error(`❌ [API-MÉTÉO] Erreur Open-Meteo :`, error.message);

            return { wave_height: 1.5, wave_period: 12, wave_direction: 270, is_fallback: true, source: 'offline' };
        }
    }

    /**
     * Stormglass API (Premium - Limite 500 req/jour)
     * Prête à être utilisée : il suffira de basculer la fonction principale ci-dessus.
     */
    static async getWaveDataFromStormglass(lat, lng) {
        const apiKey = process.env.STORMGLASS_API_KEY;
        if (!apiKey) {

            return this.getWaveDataFromOpenMeteo(lat, lng);
        }

        try {
            // Stormglass nécessite de préciser les heures (actuelles) et les paramètres
            const response = await axios.get('https://api.stormglass.io/v2/weather/point', {
                params: {
                    lat: lat,
                    lng: lng,
                    params: 'waveHeight,wavePeriod,waveDirection'
                },
                headers: {
                    'Authorization': apiKey
                }
            });

            // Récupère la donnée correspondante à l'heure actuelle (première entrée du tableau par défaut)
            const current = response.data.hours[0];

            return {
                // Stormglass renvoie souvent un objet avec plusieurs sources (ex: sg, noaa, icon). On prend 'sg' par défaut.
                wave_height: current.waveHeight.sg || current.waveHeight.icon,
                wave_period: current.wavePeriod.sg || current.wavePeriod.icon,
                wave_direction: current.waveDirection.sg || current.waveDirection.icon,
                source: 'stormglass'
            };
        } catch (error) {
            console.error(`Erreur Stormglass (Limite max ?) :`, error.message);
            // En cas d'erreur ou de quota (429), on bascule silencieusement sur l'API gratuite
            return this.getWaveDataFromOpenMeteo(lat, lng);
        }
    }
}

module.exports = SurfApiService;
