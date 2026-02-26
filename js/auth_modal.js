// /js/auth_modal.js

let currentAuthMethod = '';
let currentAuthIdentifier = '';

// ──────────────────────────────────────────────────
// SESSION : au chargement, vérifier si un cookie JWT est valide
// ──────────────────────────────────────────────────
async function checkServerSession() {
    try {
        const r = await fetch('/api/auth/me', { credentials: 'include' });
        if (r.ok) {
            const user = await r.json();
            // Synchroniser le localStorage avec les données serveur
            const userData = {
                identifier: user.email,
                name: user.name || user.email.split('@')[0],
                is_pro: user.is_pro,
                id: user.id,
                loggedInAt: Date.now(),
                from_server: true
            };
            localStorage.setItem('swellsync_user', JSON.stringify(userData));
            updateProfileUI(userData);
        }
    } catch (e) {
        // Pas connecté ou serveur indisponible — silencieux
    }
}

function openAuthOrProfileModal() {
    const savedUser = localStorage.getItem('swellsync_user');
    if (savedUser) {
        openProfileModal(JSON.parse(savedUser));
    } else {
        openAuthModal();
    }
}

function openAuthModal() {
    const backdrop = document.getElementById('auth-modal-backdrop');
    const container = document.getElementById('auth-modal-container');

    if (!backdrop) return;

    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex');

    // Animation d'entrée
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        container.classList.remove('scale-95');
        container.classList.add('scale-100');
    }, 10);
}

function openProfileModal(userData) {
    const backdrop = document.getElementById('profile-modal-backdrop');
    const container = document.getElementById('profile-modal-container');

    if (!backdrop) return;

    // Mise à jour du contenu dynamique
    const initial = userData.identifier.charAt(0).toUpperCase();
    document.getElementById('profile-avatar-letter').textContent = initial;

    // Générer un pseudo basé sur la partie gauche de l'email
    let pseudo = "Surfeur";
    if (userData.identifier.includes('@')) {
        pseudo = userData.identifier.split('@')[0];
        pseudo = pseudo.charAt(0).toUpperCase() + pseudo.slice(1);
    }

    document.getElementById('profile-name').textContent = pseudo;
    document.getElementById('profile-email').textContent = userData.identifier;

    backdrop.classList.remove('hidden');
    backdrop.classList.add('flex');

    // Animation d'entrée
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        container.classList.remove('scale-95');
        container.classList.add('scale-100');
    }, 10);
}

function closeProfileModal() {
    const backdrop = document.getElementById('profile-modal-backdrop');
    const container = document.getElementById('profile-modal-container');

    if (!backdrop) return;

    // Animation de sortie
    backdrop.classList.add('opacity-0');
    container.classList.remove('scale-100');
    container.classList.add('scale-95');

    setTimeout(() => {
        backdrop.classList.remove('flex');
        backdrop.classList.add('hidden');
        // Reset view back to main menu
        hideProfileViews();
    }, 300);
}

// ==========================================
// INTERACTIONS PROFIL (SOUS-VUES)
// ==========================================
function showProfileFavorites() {
    document.getElementById('profile-main-menu').classList.add('hidden');
    document.getElementById('profile-favorites-view').classList.remove('hidden');
    renderFavorites();
}

function showProfileAIPrefs() {
    document.getElementById('profile-main-menu').classList.add('hidden');
    document.getElementById('profile-ai-view').classList.remove('hidden');
}

function hideProfileViews() {
    // Hide sub-views
    const favView = document.getElementById('profile-favorites-view');
    const aiView = document.getElementById('profile-ai-view');
    if (favView && !favView.classList.contains('hidden')) favView.classList.add('hidden');
    if (aiView && !aiView.classList.contains('hidden')) aiView.classList.add('hidden');

    // Show main menu
    const mainMenu = document.getElementById('profile-main-menu');
    if (mainMenu) mainMenu.classList.remove('hidden');
}

function showProfileAlerts() {
    Toast.show('🔒 Les alertes SMS sont réservées aux membres PRO.', 'error');
    setTimeout(() => {
        window.location.href = 'abonnement.html';
    }, 1500);
}

// ==========================================
// GESTION DES FAVORIS
// ==========================================

function toggleFavorite(spotId, spotName, spotLocation) {
    const savedUser = localStorage.getItem('swellsync_user');
    if (!savedUser) {
        Toast.show("Veuillez vous connecter pour ajouter un favori.", "error");
        openAuthModal();
        return;
    }

    let user = JSON.parse(savedUser);
    if (!user.favorites) user.favorites = [];

    const existingIndex = user.favorites.findIndex(f => f.id === spotId);

    if (existingIndex > -1) {
        // Enlever des favoris
        user.favorites.splice(existingIndex, 1);
        Toast.show("Spot retiré de vos favoris.", "info");
    } else {
        // Ajouter aux favoris (limite 3 sauf Premium)
        if (user.favorites.length >= 3) {
            Toast.show("Limite atteinte. Passez PRO pour des favoris illimités !", "error");
            setTimeout(() => {
                window.location.href = "abonnement.html";
            }, 1500);
            return;
        }
        user.favorites.push({ id: spotId, name: spotName, location: spotLocation });
        Toast.show("Spot ajouté à vos favoris ❤️", "success");
    }

    localStorage.setItem('swellsync_user', JSON.stringify(user));

    updateAllFavoriteButtons();
    renderFavorites();
}

function updateAllFavoriteButtons() {
    const savedUser = localStorage.getItem('swellsync_user');
    let favorites = [];
    if (savedUser) {
        favorites = JSON.parse(savedUser).favorites || [];
    }

    document.querySelectorAll('.btn-favorite-spot').forEach(btn => {
        const spotId = btn.dataset.spotid;
        const icon = btn.querySelector('i');
        const isFav = favorites.some(f => String(f.id) === String(spotId));

        if (isFav) {
            btn.classList.remove('text-white/30');
            btn.classList.add('text-red-500');
        } else {
            btn.classList.add('text-white/30');
            btn.classList.remove('text-red-500');
        }
    });
}

function renderFavorites() {
    const container = document.getElementById('profile-favorites-container');
    if (!container) return;

    const savedUser = localStorage.getItem('swellsync_user');
    if (!savedUser) return;

    const user = JSON.parse(savedUser);
    const favorites = user.favorites || [];

    if (favorites.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-sm text-center py-4 font-medium italic">Aucun spot favori pour le moment.</p>`;
        return;
    }

    container.innerHTML = favorites.map(spot => `
        <div id="fav-spot-${spot.id}" class="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group transition-all duration-300 relative overflow-hidden">
            <div class="relative z-10">
                <h4 class="text-white font-bold leading-tight text-sm md:text-base">${spot.name}</h4>
                <p class="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">${spot.location}</p>
            </div>
            <button onclick="toggleFavorite('${spot.id}', '${spot.name.replace(/'/g, "\\'")}', '${spot.location.replace(/'/g, "\\'")}')" class="text-red-500 relative z-10 hover:text-red-400 hover:scale-110 w-8 h-8 shrink-0 flex items-center justify-center transition-all cursor-pointer bg-white/5 rounded-full ml-3">
                <i class="fa-solid fa-heart"></i>
            </button>
        </div>
    `).join('');
}

async function logoutProfile() {
    try {
        // Effacer le cookie JWT côté serveur
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) { }
    localStorage.removeItem('swellsync_user');
    Toast.show('Déconnexion réussie ! A bientôt. 🌊', 'info');
    // Reset UI
    const btnAvatar = document.getElementById('btn-login-avatar');
    const statusIcon = document.getElementById('login-status-icon');
    const btn = document.getElementById('btn-login');
    if (btnAvatar) { btnAvatar.textContent = ''; btnAvatar.className = 'material-symbols-outlined text-[20px]'; btnAvatar.textContent = 'person'; }
    if (statusIcon) { statusIcon.classList.add('bg-red-500'); statusIcon.classList.remove('bg-green-500'); statusIcon.innerHTML = '<i class="fa-solid fa-xmark text-[8px] text-white"></i>'; }
    if (btn) { btn.classList.remove('ring-2', 'ring-primary', 'shadow-[0_0_15px_rgba(0,186,214,0.3)]'); }
    setTimeout(() => { closeProfileModal(); }, 800);
}

function closeAuthModal() {
    const backdrop = document.getElementById('auth-modal-backdrop');
    const container = document.getElementById('auth-modal-container');

    if (!backdrop) return;

    // Animation de sortie
    backdrop.classList.add('opacity-0');
    container.classList.remove('scale-100');
    container.classList.add('scale-95');

    setTimeout(() => {
        backdrop.classList.remove('flex');
        backdrop.classList.add('hidden');
        resetAuthModal(); // Reset form when closing
    }, 300);
}

function resetAuthModal() {
    document.getElementById('auth-step-1').classList.remove('hidden');
    document.getElementById('auth-step-1').classList.add('flex');
    document.getElementById('auth-step-2').classList.add('hidden');
    document.getElementById('auth-step-2').classList.remove('flex');
    document.getElementById('auth-identifier').value = '';

    // Reset code inputs
    const inputs = document.querySelectorAll('.code-input');
    inputs.forEach(input => input.value = '');

    currentAuthMethod = '';
    currentAuthIdentifier = '';
}

async function submitLead(provider, identifier, code = null) {
    try {
        const response = await fetch('/api/auth/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ provider, identifier, code })
        });

        const data = await response.json();

        if (response.ok) {
            const userData = {
                provider,
                identifier: data.user ? data.user.email : identifier,
                name: data.user ? data.user.name : null,
                is_pro: data.user ? data.user.is_pro : 0,
                id: data.user ? data.user.id : null,
                loggedInAt: Date.now(),
                from_server: true
            };
            localStorage.setItem('swellsync_user', JSON.stringify(userData));
            updateProfileUI(userData);
            Toast.show(`Bienvenue sur SwellSync ! 🏄‍♂️`, 'success');
            setTimeout(() => closeAuthModal(), 1200);
        } else {
            Toast.show(`Oups: ${data.error || 'Erreur inconnue.'}`, 'error');
        }
    } catch (e) {
        Toast.show(`Erreur réseau lors de la transaction.`, 'error');
    }
}

async function handleAuthForm(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = "Envoi...";
    btn.disabled = true;

    const identifier = document.getElementById('auth-identifier').value;

    let provider = 'Email (A2F)';
    if (/^\+?[\d\s]+$/.test(identifier)) {
        provider = 'SMS (A2F)';
    }

    currentAuthMethod = provider;
    currentAuthIdentifier = identifier;

    try {
        const response = await fetch('/api/auth/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier })
        });

        const data = await response.json();

        if (response.ok) {
            Toast.show(`Code de sécurité envoyé au ${identifier}... 🔒`, 'info');

            // Switch UI to Step 2
            document.getElementById('auth-step-1').classList.add('hidden');
            document.getElementById('auth-step-1').classList.remove('flex');

            document.getElementById('auth-identifier-display').textContent = identifier;

            document.getElementById('auth-step-2').classList.remove('hidden');
            document.getElementById('auth-step-2').classList.add('flex');

            document.querySelectorAll('.code-input')[0].focus();
        } else {
            Toast.show(`Erreur: ${data.error}`, 'error');
        }
    } catch (error) {
        Toast.show(`Impossible de contacter le serveur.`, 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function verifyAuthCode(e) {
    e.preventDefault();

    const inputs = document.querySelectorAll('.code-input');
    let code = '';
    inputs.forEach(input => code += input.value);

    if (code.length < 6) {
        Toast.show(`Veuillez entrer les 6 chiffres du code.`, 'error');
        return;
    }

    Toast.show(`Vérification du code... ⏳`, 'info');
    submitLead(currentAuthMethod, currentAuthIdentifier, code);
}

// Gérer l'auto-focus pour les cases du code A2F et la persistance de l'UI
document.addEventListener('DOMContentLoaded', () => {
    // 1. Vérifier d'abord si un cookie JWT serveur est valide
    checkServerSession();

    // 2. Fallback localStorage uniquement si pas de session serveur
    const savedUser = localStorage.getItem('swellsync_user');
    if (savedUser) {
        try {
            updateProfileUI(JSON.parse(savedUser));
        } catch (e) {
            localStorage.removeItem('swellsync_user');
        }
    }

    // 3. Comportement des cases OTP A2F
    const inputs = document.querySelectorAll('.code-input');
    inputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
                inputs[index - 1].focus();
            }
        });
    });
});

// ==========================================
// GESTION UI : ETAT CONNECTÉ
// ==========================================
function updateProfileUI(userData) {
    const btnAvatar = document.getElementById('btn-login-avatar');
    const statusIcon = document.getElementById('login-status-icon');

    if (!btnAvatar || !statusIcon) return;

    // Récupérer la première lettre de l'identifiant pour faire un bel avatar
    const initial = userData.identifier.charAt(0).toUpperCase();

    // Remplacer l'icône par l'initiale
    btnAvatar.textContent = initial;
    btnAvatar.classList.remove('material-symbols-outlined');
    btnAvatar.classList.add('text-lg', 'font-black', 'font-display', 'text-primary');

    // Changer la petite croix rouge en flèche verte
    statusIcon.classList.remove('bg-red-500');
    statusIcon.classList.add('bg-green-500');
    statusIcon.innerHTML = `<i class="fa-solid fa-arrow-right text-[8px] text-white"></i>`;

    // Animer un peu le conteneur du bouton pour montrer un changement d'état
    const btn = document.getElementById('btn-login');
    btn.classList.add('ring-2', 'ring-primary', 'shadow-[0_0_15px_rgba(0,186,214,0.3)]');

    // Mettre à jour les boutons favoris du site
    if (typeof updateAllFavoriteButtons === 'function') {
        updateAllFavoriteButtons();
    }
}

// ==========================================
// OFFICIEL : GOOGLE SIGN-IN TRIGGER
// ==========================================
function triggerGoogleAuth() {
    Toast.show("Vérification Google OAuth en cours...", "info");

    // Le client ID de production (à remplacer via Google Cloud Console)
    const CLIENT_ID = "10463943445-votre_client_id_ici.apps.googleusercontent.com";

    if (CLIENT_ID.includes("votre_client_id")) {
        // Mode Développement : On ne lance pas la page Google pour éviter l'erreur 401
        setTimeout(() => {
            submitLead('Google', 'surfeur_expert@gmail.com', 'verified_oauth');
        }, 1500);
        return;
    }

    // Processus OAuth 2.0 (Implicit Flow) avec fenêtre popup native sécurisée
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=token&scope=email profile`;

    const top = window.screenY + (window.outerHeight - 600) / 2.5;
    const left = window.screenX + (window.outerWidth - 500) / 2;
    // Ouvre la VRAIE page de Google OAuth
    window.open(authUrl, "Google Sign In", `width=500,height=600,top=${top},left=${left}`);
}

// ==========================================
// OFFICIEL : APPLE SIGN-IN TRIGGER
// ==========================================
async function triggerAppleAuth() {
    Toast.show("Initialisation sécurisée avec Apple... 🍏", "info");

    // Configuration requise par Apple JS
    AppleID.auth.init({
        clientId: 'com.swellsync.webapp',
        scope: 'name email',
        redirectURI: 'https://swellsync.auth.com/apple',
        state: 'swellsync-state-init',
        usePopup: true
    });

    try {
        const response = await AppleID.auth.signIn();
        if (response.authorization && response.authorization.id_token) {
            Toast.show("Authentification Apple ID réussie ! ⏳", "info");
            // Apple ne fournit l'email de manière lisible qu'à la première connexion ou côté serveur.
            // On enregistre le lead de manière générique ou précise si on a son vrai email.
            submitLead('Apple', 'AppleID Sécurisé Privé', 'verified_oauth');
        }
    } catch (error) {
        // Log classique d'erreur si la modale est fermée par l'utilisateur ou le client ID non configuré
        Toast.show("Erreur (Apple Dev): ID Client non configuré.", "error");
        console.error("Apple SignIn Error:", error);
    }
}
