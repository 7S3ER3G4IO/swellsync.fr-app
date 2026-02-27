/**
 * SwellSync — Theme Manager v2
 * Dark/Light toggle avec animation smooth.
 * Injecter dans <head> AVANT tailwind pour éviter le FOUC.
 */
(function () {
    const saved = localStorage.getItem('sw_theme') || 'dark';
    const html = document.documentElement;
    html.classList.toggle('dark', saved === 'dark');
    html.classList.toggle('light', saved === 'light');
})();

/**
 * Bascule le thème avec animation :
 * - Flash overlay blanc/noir pendant 200ms
 * - Transition smooth sur le thumb du toggle
 * - Icône tourne + change
 */
function swToggleTheme() {
    const html = document.documentElement;
    const isCurrentlyDark = html.classList.contains('dark');
    const newTheme = isCurrentlyDark ? 'light' : 'dark';

    // Flash overlay animé
    const flash = document.createElement('div');
    flash.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:99999', 'pointer-events:none',
        'background:' + (isCurrentlyDark ? '#ffffff' : '#080f1a'),
        'opacity:0', 'transition:opacity 180ms ease'
    ].join(';');
    document.body.appendChild(flash);

    requestAnimationFrame(() => {
        flash.style.opacity = '0.3';
        setTimeout(() => {
            // Appliquer le nouveau thème au milieu du flash
            html.classList.replace(isCurrentlyDark ? 'dark' : 'light', newTheme);
            localStorage.setItem('sw_theme', newTheme);
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 220);
            _swSyncUI(newTheme === 'light');
        }, 180);
    });
}

function _swSyncUI(isLight) {
    // Icône — rotation 360
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.style.transition = 'transform 0.45s cubic-bezier(.34,1.56,.64,1)';
        icon.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            icon.style.transition = '';
            icon.style.transform = '';
            icon.textContent = isLight ? 'light_mode' : 'dark_mode';
        }, 450);
    }

    // Label
    const label = document.getElementById('themeLabel');
    if (label) label.textContent = isLight ? 'Mode Clair' : 'Mode Sombre';

    // Toggle track + thumb
    const track = document.getElementById('themeToggle');
    const thumb = document.getElementById('themeThumb');
    if (track && thumb) {
        track.style.background = isLight ? '#94a3b8' : '#00bad6';
        track.style.transition = 'background 0.3s ease';
        thumb.style.transition = 'transform 0.35s cubic-bezier(.34,1.56,.64,1), background 0.3s ease';
        thumb.style.transform = isLight ? 'translateX(0px)' : 'translateX(24px)';
        thumb.style.background = isLight ? '#fff' : '#080f1a';
    }
}

/** À appeler au chargement de la page Profil pour refléter l'état courant */
function swSyncThemeOnLoad() {
    const isLight = document.documentElement.classList.contains('light');
    _swSyncUI(isLight);
}

/**
 * Material Symbols Font Loader — fallback si Google Fonts bloqué
 * Vérifie si la police est chargée, sinon charge depuis jsDelivr
 */
(function () {
    function checkAndLoadFont() {
        // Test if Material Symbols font is already loaded
        if (document.fonts && document.fonts.check) {
            document.fonts.ready.then(() => {
                const loaded = document.fonts.check('20px "Material Symbols Outlined"');
                if (!loaded) {
                    loadFallbackFont();
                }
            });
        } else {
            // Fallback for browsers without Font Loading API
            setTimeout(() => {
                const testEl = document.createElement('span');
                testEl.className = 'material-symbols-outlined';
                testEl.style.cssText = 'position:absolute;left:-9999px;font-size:20px;visibility:hidden';
                testEl.textContent = 'home';
                document.body.appendChild(testEl);
                const w = testEl.offsetWidth;
                testEl.remove();
                // If icon renders as normal text (wide), font didn't load
                if (w > 30) loadFallbackFont();
            }, 1000);
        }
    }

    function loadFallbackFont() {
        // Don't load twice
        if (document.getElementById('sw-material-symbols-fallback')) return;
        const link = document.createElement('link');
        link.id = 'sw-material-symbols-fallback';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/material-symbols@0.27.0/outlined.css';
        document.head.appendChild(link);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(checkAndLoadFont, 500));
    } else {
        setTimeout(checkAndLoadFont, 500);
    }
})();
