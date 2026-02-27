/**
 * SwellSync — Onboarding Popup
 * Demands all permissions on first visit, saved in localStorage forever.
 * Include only in home.html: <script src="js/onboarding.js"></script>
 */
(function () {
    if (localStorage.getItem('sw_onboarded')) return;

    // Wait for DOM
    document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.createElement('div');
        overlay.id = 'onboardOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);animation:fadeIn .4s ease';

        overlay.innerHTML = `
        <style>
            @keyframes fadeIn{from{opacity:0}to{opacity:1}}
            @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
            .onb-card{animation:slideUp .5s ease .1s both}
            .onb-toggle{width:44px;height:24px;border-radius:12px;background:#1e3a5f;position:relative;cursor:pointer;transition:background .3s;flex-shrink:0}
            .onb-toggle.active{background:#00bad6}
            .onb-toggle::after{content:'';position:absolute;width:18px;height:18px;border-radius:50%;background:white;top:3px;left:3px;transition:transform .3s}
            .onb-toggle.active::after{transform:translateX(20px)}
        </style>
        <div class="onb-card" style="background:linear-gradient(135deg,#0f2438,#080f1a);border:1px solid rgba(0,186,214,0.2);border-radius:28px;padding:32px 24px;max-width:380px;width:92%;max-height:90vh;overflow-y:auto">
            <div style="text-align:center;margin-bottom:28px">
                <div style="width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,#00bad6,#10b981);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px">🏄</div>
                <h2 style="font-size:22px;font-weight:900;margin:0 0 6px;color:#f1f5f9">Bienvenue sur SwellSync !</h2>
                <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.5">Pour une expérience optimale, autorise ces fonctionnalités :</p>
            </div>

            <!-- Notifications -->
            <div style="display:flex;align-items:center;gap:14px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
                <div style="width:44px;height:44px;border-radius:14px;background:rgba(0,186,214,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <span class="material-symbols-outlined" style="color:#00bad6;font-size:22px">notifications_active</span>
                </div>
                <div style="flex:1;min-width:0">
                    <p style="font-weight:700;font-size:14px;margin:0 0 2px;color:#f1f5f9">Notifications</p>
                    <p style="color:#64748b;font-size:11px;margin:0">Alertes houle, messages, activité</p>
                </div>
                <div class="onb-toggle active" id="togNotif" onclick="this.classList.toggle('active')"></div>
            </div>

            <!-- Géolocalisation -->
            <div style="display:flex;align-items:center;gap:14px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
                <div style="width:44px;height:44px;border-radius:14px;background:rgba(16,185,129,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <span class="material-symbols-outlined" style="color:#10b981;font-size:22px">my_location</span>
                </div>
                <div style="flex:1;min-width:0">
                    <p style="font-weight:700;font-size:14px;margin:0 0 2px;color:#f1f5f9">Localisation</p>
                    <p style="color:#64748b;font-size:11px;margin:0">Spot le plus proche, météo locale</p>
                </div>
                <div class="onb-toggle active" id="togGeo" onclick="this.classList.toggle('active')"></div>
            </div>

            <!-- Thème -->
            <div style="display:flex;align-items:center;gap:14px;padding:16px 0">
                <div style="width:44px;height:44px;border-radius:14px;background:rgba(245,158,11,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <span class="material-symbols-outlined" style="color:#f59e0b;font-size:22px">dark_mode</span>
                </div>
                <div style="flex:1;min-width:0">
                    <p style="font-weight:700;font-size:14px;margin:0 0 2px;color:#f1f5f9">Mode sombre</p>
                    <p style="color:#64748b;font-size:11px;margin:0">Activé par défaut</p>
                </div>
                <div class="onb-toggle active" id="togTheme" onclick="this.classList.toggle('active')"></div>
            </div>

            <button id="onbContinue" style="width:100%;padding:16px;border-radius:18px;background:linear-gradient(135deg,#00bad6,#10b981);color:#080f1a;font-weight:900;font-size:16px;border:none;margin-top:24px;cursor:pointer;letter-spacing:0.5px">
                C'est parti ! 🤙
            </button>
            <p style="text-align:center;color:#475569;font-size:10px;margin-top:12px">Tu peux modifier ces choix dans Paramètres</p>
        </div>`;

        document.body.appendChild(overlay);

        document.getElementById('onbContinue').addEventListener('click', async () => {
            // Notifications
            if (document.getElementById('togNotif').classList.contains('active')) {
                try {
                    if ('Notification' in window) {
                        await Notification.requestPermission();
                    }
                } catch (e) { }
            }

            // Geolocation (trigger the permission prompt)
            if (document.getElementById('togGeo').classList.contains('active')) {
                try {
                    navigator.geolocation?.getCurrentPosition(() => { }, () => { }, { timeout: 5000 });
                } catch (e) { }
            }

            // Theme
            if (!document.getElementById('togTheme').classList.contains('active')) {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                localStorage.setItem('sw_theme', 'light');
            }

            // Mark as done
            localStorage.setItem('sw_onboarded', 'true');
            localStorage.setItem('sw_onboarded_date', new Date().toISOString());

            // Animate out
            overlay.style.transition = 'opacity .3s ease';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        });
    });
})();
