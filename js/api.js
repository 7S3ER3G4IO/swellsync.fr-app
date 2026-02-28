/**
 * SwellSync - Service API Centralisé
 * Ce fichier gère toutes les communications avec le Back-End de façon sécurisée (avec gestion des Tokens).
 */

class ApiService {
    constructor() {
        // En développement, l'API est sur la même URL (sur le port 3000)
        // En production, on pourrait utiliser une URL d'API distincte
        this.baseUrl = '/api';
    }

    /**
     * Méthode générique pour effectuer des requêtes sécurisées
     * @param {string} endpoint - La route (ex: '/spots')
     * @param {object} options - Options fetch (method, body, etc.)
     * @returns {Promise<any>}
     */
    async fetchAPI(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Si l'utilisateur est connecté, injecter le Token JWT
        const token = localStorage.getItem('swellsync_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                // Gestion centralisée des erreurs API 
                // Ex: Si Token expiré (401), on déconnecte automatiquement
                if (response.status === 401 && token) {

                    this.logout();
                }
                throw new Error(data.error || 'Erreur inconnue lors de la requête API');
            }

            return data;
        } catch (error) {
            console.error(`[API Error] ${endpoint}:`, error.message);
            throw error;
        }
    }

    // --- SPOTS ---
    async getSpots() {
        return this.fetchAPI('/spots');
    }

    // --- CAMS ---
    async getCams() {
        return this.fetchAPI('/cams');
    }

    // --- AUTH ---
    async login(username, password) {
        const data = await this.fetchAPI('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        // Stockage sécurisé du token
        if (data.token) {
            localStorage.setItem('swellsync_token', data.token);
            localStorage.setItem('swellsync_user', JSON.stringify({ username: data.username, role: data.role }));
        }
        return data;
    }

    logout() {
        localStorage.removeItem('swellsync_token');
        localStorage.removeItem('swellsync_user');
        window.location.reload(); // Rafraichissement pour nettoyer l'interface
    }

    isAuthenticated() {
        return !!localStorage.getItem('swellsync_token');
    }
}

// Instance globale (Singleton)
const api = new ApiService();
