// SwellSync - Main Scripts

document.addEventListener('DOMContentLoaded', () => {
    // 1. Apparence dynamique de la NavBar au scroll
    const navbar = document.getElementById('main-nav');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.remove('py-4');
                navbar.classList.add('py-2');
                navbar.style.background = 'rgba(10, 12, 16, 0.85)';
            } else {
                navbar.classList.add('py-4');
                navbar.classList.remove('py-2');
                navbar.style.background = 'transparent';
            }
        });
    }

    // 3. Récupération des données Météo/IA du Spot #1 (Pipeline) au chargement
    loadLiveSpotData();

    // Bouton de simulation "Check Today's Forecast"
    const btnForecast = document.getElementById('btn-demo-forecast');
    if (btnForecast) {
        btnForecast.addEventListener('click', () => {
            const btnText = btnForecast.querySelector('span');
            const originalText = btnText.textContent;
            btnText.textContent = "Analyse Multi-Sources...";

            // Charge les données puis redirige vers spot_detail
            setTimeout(() => {
                loadLiveSpotData();
                btnText.textContent = originalText;
                window.location.href = 'cotes.html';
            }, 800);
        });
    }

    // Smooth Scrolling for anchor links (Zéro lien mort)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // 4. Initialisation de la Mappe Interactive
    if (document.getElementById('surf-map')) {
        initSurfMap();
    }
});

/**
 * Connecte le Front-End à l'API Backend pour animer la page d'accueil.
 */
async function loadLiveSpotData() {
    try {
        console.log("Demande des conditions au serveur Backend...");

        // Appelle notre API globale qui s'occupe de la DB, Open-Meteo, et l'IA
        const spotData = await api.fetchAPI('/spots/1');

        // 1. Mise à jour de la bannière du bas "Bottom Stats Bar"
        const swellEl = document.getElementById('stat-swell');
        const periodEl = document.getElementById('stat-period');
        const windEl = document.getElementById('stat-wind');

        if (swellEl && periodEl && windEl && spotData.current_conditions) {
            const spotNameEl = document.getElementById('stat-spot-name');
            swellEl.textContent = `${spotData.current_conditions.wave_height}m`;
            periodEl.textContent = `${spotData.current_conditions.wave_period}s`;
            windEl.textContent = `${spotData.current_conditions.wave_direction}°`;
            if (spotNameEl && spotData.name) {
                spotNameEl.textContent = spotData.name.split(',')[0];
            }
            document.getElementById('stats-bar').style.opacity = "1"; // Donne vie à la stat bar
        }

        // 2. Mise à jour des cartes flottantes de l'héro "Right Content"
        const aiScoreLabel = document.getElementById('ai-score-label');
        const aiScoreValue = document.getElementById('ai-score-value');
        const spotDetailValue = document.getElementById('spot-detail-value');

        if (aiScoreLabel && aiScoreValue && spotData.reliability_score) {
            // Affiche le score magique de 100% calculé par le backend
            aiScoreLabel.innerHTML = `Indice de Confiance: <span class="text-primary">${spotData.reliability_score}</span>`;
            aiScoreValue.textContent = `Calcul ultime basé sur ${Object.keys(spotData.ai_analysis_details).length} Bots neuronaux.`;
        }

        if (spotDetailValue && spotData.name) {
            spotDetailValue.textContent = `Live: ${spotData.name} - ${spotData.location}`;
        }

    } catch (error) {
        console.error("Échec de connexion en direct", error);
        Toast.show("Impossible de joindre le système météorologique.", "error");
    }
}

// ==========================================
// SYSTEME DE CARTE INTERACTIVE (LEAFLET)
// ==========================================

let swellMap = null;

async function initSurfMap() {
    try {
        console.log("Initialisation de la carte interactive globale...");
        // 1. Initialiser la carte sans bandeau de droits d'auteur
        swellMap = L.map('surf-map', {
            attributionControl: false
        }).setView([46.0, -2.5], 6);

        // 2. Ajouter un fond de carte sombre Premium (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(swellMap);

        // 3. Récupérer tous les spots basiques de l'API
        const spots = await api.fetchAPI('/spots');

        const widgetsContainer = document.getElementById('spots-widgets-container');
        if (widgetsContainer) {
            // Vider le loader
            widgetsContainer.innerHTML = ``;
        }

        // 3.5. Initialiser le groupe de Cluster pour regrouper les 60 points
        const markers = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 40 // distance en px entre chaque rassemblement
        });

        // 4. Boucler sur les spots pour les injecter (Map + Widgets)
        spots.forEach((spot, index) => {

            // --- A. CREATION DES 60 WIDGETS LATERAUX (DEFILEMENT) ---
            if (widgetsContainer) {
                const widgetHTML = `
                    <div class="bg-white/5 backdrop-blur-md p-5 rounded-2xl flex flex-col gap-3 hover:bg-white/10 transition-all cursor-pointer border border-white/10 hover:border-primary/40 shadow-lg" onclick="window.location.href='spot_detail.html?id=${spot.id}'">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="text-white font-bold text-lg leading-tight uppercase tracking-wide">${spot.name}</h4>
                                <p class="text-slate-400 text-[11px] font-medium mt-1 tracking-widest uppercase">${spot.location}</p>
                            </div>
                            <span class="bg-primary/10 text-primary text-[10px] uppercase font-black px-3 py-1.5 rounded-full border border-primary/20 text-center shadow-[0_0_10px_rgba(0,186,214,0.2)]">
                                ${spot.difficulty}
                            </span>
                        </div>
                        <div class="flex items-center gap-5 text-sm mt-3 pt-3 border-t border-white/5">
                            <span class="flex items-center gap-1.5 text-slate-300 font-bold">
                                <span class="material-symbols-outlined text-[18px] text-primary">waves</span>
                                <span class="spot-wave-live" data-id="${spot.id}">--m</span>
                            </span>
                             <span class="flex items-center gap-1.5 text-slate-300 font-bold">
                                <span class="material-symbols-outlined text-[18px] text-green-400 shadow-green-400">psychology</span>
                                <span class="spot-ai-live" data-id="${spot.id}">--%</span>
                            </span>
                            <button class="ml-auto btn-favorite-spot text-white/30 hover:text-red-500 hover:scale-110 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer bg-white/5" data-spotid="${spot.id}" onclick="event.stopPropagation(); toggleFavorite('${spot.id}', '${spot.name.replace(/'/g, "\\'")}', '${spot.location.replace(/'/g, "\\'")}')">
                                <i class="fa-solid fa-heart"></i>
                            </button>
                        </div>
                    </div>
                `;
                widgetsContainer.insertAdjacentHTML('beforeend', widgetHTML);

                // On déclenche l'audit IA pour ce widget spécifiquement (SEULEMENT sur le Top 6 visible pour soulager l'API !)
                if (index < 6) {
                    fetchLiveSpotDataForWidget(spot.id, spot);
                }
            }

            // --- B. CREATION DU PING (MARQUEUR) UR LA CARTE ---
            const customIcon = L.divIcon({
                className: '', // on enlève la classe par défaut
                html: `
                    <div style="position: relative; display: flex; align-items: center;">
                        <div style="background-color: #00bad6; width: 14px; height: 14px; border-radius: 50%; box-shadow: 0 0 10px #00bad6, 0 0 5px #00bad6 inset; border: 2px solid #fff; position: absolute; left: -7px; top: -7px;"></div>
                        <span style="position: absolute; left: 10px; top: -9px;" class="px-1.5 py-0.5 rounded shadow-xl bg-background-dark/80 backdrop-blur-sm text-white text-[9px] uppercase tracking-widest font-black border border-white/10 whitespace-nowrap pointer-events-none drop-shadow-md">
                            ${spot.name.split(',')[0]}
                        </span>
                    </div>
                `,
                iconSize: [0, 0],   // le point (0,0) est la ref Leaflet
                iconAnchor: [0, 0]  // on ancre au centre via nos CSS top/left negatifs
            });

            const marker = L.marker([spot.lat, spot.lng], { icon: customIcon });

            // Pop-up interactif au clic sur le point
            marker.bindPopup(`
                <div class="p-4 min-w-[250px] glass rounded-2xl border-2 border-primary bg-background-dark/80 backdrop-blur-md shadow-[0_0_30px_rgba(0,186,214,0.4)] custom-menu-popup text-center">
                    <div class="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                         <h3 class="font-black text-sm text-white m-0 uppercase tracking-widest leading-tight">${spot.name.split(',')[0]}</h3>
                         <button class="btn-favorite-spot text-white/30 hover:text-red-500 hover:scale-110 transition-all cursor-pointer w-8 h-8 rounded-full bg-white/5 flex items-center justify-center -mr-1" data-spotid="${spot.id}" title="Favori" onclick="event.stopPropagation(); toggleFavorite('${spot.id}', '${spot.name.replace(/'/g, "\\'")}', '${spot.location.replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-heart text-[14px]"></i>
                         </button>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 mb-3">
                         <div class="bg-gradient-to-br from-white/5 to-transparent rounded-lg p-2 flex flex-col items-center justify-center border border-white/5 cursor-default group">
                              <span class="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-1 flex items-center gap-1 group-hover:text-green-400 transition-colors"><span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> DATA SYNC</span>
                              <span class="font-black text-white text-lg spot-popup-live leading-none" data-id="${spot.id}">--</span>
                         </div>
                         <div class="bg-gradient-to-br from-white/5 to-transparent hover:from-primary/20 hover:to-transparent rounded-lg p-2 flex flex-col items-center justify-center border border-white/5 cursor-pointer transition-colors group" onclick="Toast.show('Ouverture de la Caméra live... 🎥', 'info')">
                              <span class="material-symbols-outlined text-slate-400 group-hover:text-primary mb-1 transition-colors">videocam</span>
                              <span class="text-[9px] text-slate-400 group-hover:text-primary uppercase font-black tracking-widest transition-colors">Caméras</span>
                         </div>
                    </div>

                    <button class="w-full bg-primary/10 hover:bg-primary text-primary hover:text-background-dark transition-all duration-300 py-2 rounded-lg text-xs font-black uppercase tracking-wide border border-primary/30 shadow-[0_0_15px_rgba(0,186,214,0.1)] hover:shadow-[0_0_20px_rgba(0,186,214,0.4)]" onclick="window.location.href='/spot_detail.html?id=${spot.id}'">
                        📊 Conditions Détaillées
                    </button>
                </div>
            `, {
                closeButton: false // Gardons un design d'application épuré (on clique ailleurs pour fermer)
            });

            // Astuce Perf: Quand on ouvre la popup, télécharger les données s'il n'y en a pas encore en cache !
            marker.on('popupopen', () => {
                const el = document.querySelector(`.spot-popup-live[data-id="${spot.id}"]`);
                const memData = window[`spot_memo_${spot.id}`];
                if (el && memData) {
                    el.innerHTML = `<span class="text-green-400">${memData}</span>`;
                } else {
                    if (el) el.innerHTML = `<span class="material-symbols-outlined animate-spin text-sm text-primary">sync</span>`;
                    fetchLiveSpotDataForWidget(spot.id, spot).then(() => {
                        const newMemData = window[`spot_memo_${spot.id}`];
                        if (el && newMemData) el.innerHTML = `<span class="text-green-400">${newMemData}</span>`;
                    });
                }

                // Mettre à jour l'état du bouton favori dans la popup affichée
                if (typeof updateAllFavoriteButtons === 'function') {
                    setTimeout(updateAllFavoriteButtons, 10);
                }
            });

            // "Micro-zoom" dynamique : On centre et on approche la vue au clic !
            marker.on('click', () => {
                const currentZoom = swellMap.getZoom();
                // Assure un très beau vol vers le ping : on zoom niveau 11 au minimum, ou on rajoute un "cran" (max 14)
                const targetZoom = currentZoom < 11 ? 11 : Math.min(currentZoom + 1, 14);
                swellMap.flyTo([spot.lat, spot.lng], targetZoom, { duration: 0.6 });
                if (typeof trackSpotVisit === 'function') trackSpotVisit(spot.id);
            });

            // On ajoute le marqueur uniquement au Cluster (Pas à la map directement)
            markers.addLayer(marker);
        });

        // A la fin de la boucle, on ajoute tout le groupe Clusterisé à la vraie Map !
        swellMap.addLayer(markers);

        // Mettre à jour tous les boutons favoris !
        setTimeout(() => {
            if (typeof updateAllFavoriteButtons === 'function') {
                updateAllFavoriteButtons();
            }
        }, 200);

    } catch (error) {
        console.error("Erreur d'initialisation de la carte:", error);
    }
}

/**
 * Fonction asynchrone qui s'occupe de mettre à jour un widget précis
 * en interrogeant la météo + l'IA en direct.
 */
async function fetchLiveSpotDataForWidget(spotId, baseSpotData) {
    try {
        const liveData = await api.fetchAPI('/spots/' + spotId);

        // Update du HUD vague (Widget)
        const waveEl = document.querySelector(`.spot-wave-live[data-id="${spotId}"]`);
        if (waveEl && liveData.current_conditions) {
            waveEl.textContent = `${liveData.current_conditions.wave_height}m`;
        }

        // Update du HUD IA (Widget)
        const aiEl = document.querySelector(`.spot-ai-live[data-id="${spotId}"]`);
        if (aiEl && liveData.reliability_score) {
            aiEl.textContent = liveData.reliability_score;
        }

        // Sauvegarde discrète pour la Pop-Up de la map
        if (liveData.reliability_score) {
            window[`spot_memo_${spotId}`] = liveData.reliability_score;
        }

    } catch (e) {
        console.error("Échec des données secondaires pour ID", spotId);
    }
}

// -------------------------------------------------------------------------------------------------
// SECRET ADMIN ACCESS TRIGGER
// Raccourci : Cmd + Shift + A (ou Ctrl + Shift + A sur Windows)
// -------------------------------------------------------------------------------------------------

function showAdminModal() {
    if (document.getElementById('admin-secret-modal')) return;

    const overlay = document.createElement('div');
    overlay.id = 'admin-secret-modal';
    overlay.style.cssText = `
        position:fixed;inset:0;z-index:99999;
        background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);
        display:flex;align-items:center;justify-content:center;padding:16px;
        animation:admin-modal-in 0.25s ease;
    `;
    overlay.innerHTML = `
        <style>
            @keyframes admin-modal-in { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
            @keyframes admin-spin { to{transform:rotate(360deg)} }
            #admin-secret-modal .admin-box { background:#0a1a1d;border:1px solid rgba(0,186,214,0.25);border-radius:24px;padding:32px;width:100%;max-width:400px;box-shadow:0 30px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(0,186,214,0.08); }
            #admin-secret-modal .admin-input { width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:13px 16px;color:#f1f5f9;font-family:Lexend,sans-serif;font-size:14px;font-weight:700;outline:none;transition:border 0.2s;letter-spacing:0.1em;box-sizing:border-box; }
            #admin-secret-modal .admin-input:focus { border-color:rgba(0,186,214,0.5); }
            #admin-secret-modal .admin-btn { width:100%;padding:13px;border-radius:14px;background:linear-gradient(135deg,#00bad6,#0090a8);color:#fff;font-family:Lexend,sans-serif;font-weight:900;font-size:14px;border:none;cursor:pointer;box-shadow:0 6px 20px rgba(0,186,214,0.35);transition:all 0.2s;margin-top:12px; }
            #admin-secret-modal .admin-btn:hover { transform:translateY(-1px);box-shadow:0 10px 28px rgba(0,186,214,0.45); }
            #admin-secret-modal .admin-btn:disabled { opacity:0.6;cursor:not-allowed;transform:none; }
            #admin-secret-modal .admin-err { color:#f87171;font-size:12px;font-weight:700;margin-top:8px;text-align:center;min-height:18px;font-family:Lexend,sans-serif; }
            #admin-secret-modal .admin-spinner { width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;display:inline-block;animation:admin-spin 0.7s linear infinite;vertical-align:middle;margin-right:8px; }
        </style>
        <div class="admin-box">
            <div style="text-align:center;margin-bottom:24px;">
                <div style="width:52px;height:52px;border-radius:16px;background:rgba(0,186,214,0.12);border:1px solid rgba(0,186,214,0.2);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:24px;">🔐</div>
                <div style="font-family:Lexend,sans-serif;font-size:18px;font-weight:900;color:#fff;margin-bottom:4px;">Accès Administrateur</div>
                <div style="font-family:Lexend,sans-serif;font-size:12px;color:#64748b;">Saisissez la clé système pour accéder au panel</div>
            </div>
            <input id="admin-key-input" class="admin-input" type="password" placeholder="Clé système..." autocomplete="off" autofocus>
            <div class="admin-err" id="admin-err-msg"></div>
            <button class="admin-btn" id="admin-submit-btn" onclick="submitAdminKey()">
                Vérifier l'accès
            </button>
            <div style="text-align:center;margin-top:14px;">
                <button onclick="document.getElementById('admin-secret-modal').remove()" style="background:none;border:none;color:#475569;font-family:Lexend,sans-serif;font-size:12px;cursor:pointer;">Annuler</button>
            </div>
        </div>
    `;

    // Fermer en cliquant à l'extérieur
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);

    // Focus auto
    setTimeout(() => { document.getElementById('admin-key-input')?.focus(); }, 100);

    // Entrée = submit
    document.getElementById('admin-key-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitAdminKey();
        if (e.key === 'Escape') overlay.remove();
    });
}

function submitAdminKey() {
    const input = document.getElementById('admin-key-input');
    const btn = document.getElementById('admin-submit-btn');
    const errMsg = document.getElementById('admin-err-msg');
    if (!input || !btn) return;

    const pwd = input.value;
    if (!pwd) { errMsg.textContent = 'Clé requise.'; return; }

    // État loading
    btn.disabled = true;
    btn.innerHTML = '<span class="admin-spinner"></span> Vérification...';
    errMsg.textContent = '';

    setTimeout(() => {
        if (pwd === "Hinalol08-") {
            btn.innerHTML = '✅ Accès accordé — Redirection...';
            btn.style.background = 'linear-gradient(135deg,#22d3ee,#059669)';
            setTimeout(() => {
                document.getElementById('admin-secret-modal')?.remove();
                window.location.href = 'admin.html';
            }, 900);
        } else {
            btn.disabled = false;
            btn.innerHTML = 'Vérifier l\'accès';
            errMsg.textContent = '⛔ Clé incorrecte — Accès refusé.';
            input.value = '';
            input.focus();
            input.style.borderColor = 'rgba(248,113,113,0.5)';
            setTimeout(() => { if (input) input.style.borderColor = ''; }, 1500);
        }
    }, 800); // délai réaliste de vérification
}

document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        showAdminModal();
    }
    // Escape ferme si modal ouvert
    if (e.key === 'Escape' && document.getElementById('admin-secret-modal')) {
        document.getElementById('admin-secret-modal').remove();
    }
});


// ==========================================
// TRACKING DE TEMPS DE PRESENCE (VISITE)
// ==========================================
let currentVisitId = null;
let currentVisitStartTime = null;

async function trackSpotVisit(spotId) {
    // Si une visite précédente existe, on stop et clore le timer d'abord
    if (currentVisitId) {
        await stopTrackingSpot();
    }

    currentVisitStartTime = performance.now();

    try {
        const res = await fetch(`/api/spots/${spotId}/visit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration_s: 0 })
        });
        const data = await res.json();
        if (data.success) {
            currentVisitId = data.visit_id;
        }
    } catch (e) { console.error('Erreur tracker visite init', e); }
}

async function stopTrackingSpot() {
    if (!currentVisitId || !currentVisitStartTime) return;

    const duration_s = Math.round((performance.now() - currentVisitStartTime) / 1000);
    const visitId = currentVisitId;

    currentVisitId = null;
    currentVisitStartTime = null;

    const payload = JSON.stringify({ duration_s });

    if (navigator.sendBeacon) {
        // Optionnel, on privilégie fetch keepalive si dispo
    }

    try {
        await fetch(`/api/visits/${visitId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
        });
    } catch (e) { }
}

// Intercepter la fermeture de la page pour clore le dernier tracking
window.addEventListener('beforeunload', () => {
    stopTrackingSpot();
});
