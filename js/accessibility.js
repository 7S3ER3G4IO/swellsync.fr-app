/**
 * SwellSync — Accessibilité améliorée (T239)
 * VoiceOver/TalkBack compatible
 * + T240: orientation portrait/landscape
 * + ARIA live regions pour les mises à jour dynamiques
 */

const Accessibility = {

    init() {
        this._addSkipLink();
        this._addAriaLiveRegion();
        this._fixMissingAltTexts();
        this._addKeyboardNavToCards();
        this._handleOrientationChange();
        this._improveFormLabels();
    },

    // Skip link visible au focus clavier
    _addSkipLink() {
        if (document.querySelector('.skip-link')) return;
        const link = document.createElement('a');
        link.href = '#main-content';
        link.className = 'skip-link';
        link.textContent = 'Aller au contenu principal';
        document.body.insertBefore(link, document.body.firstChild);
    },

    // ARIA live region pour les toasts/notifications
    _addAriaLiveRegion() {
        if (document.getElementById('a11y-live')) return;
        const region = document.createElement('div');
        region.id = 'a11y-live';
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-atomic', 'true');
        region.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
        document.body.appendChild(region);
    },

    // Annoncer aux lecteurs d'écran
    announce(message) {
        const region = document.getElementById('a11y-live');
        if (!region) return;
        region.textContent = '';
        setTimeout(() => { region.textContent = message; }, 100);
    },

    // Corriger les images sans alt
    _fixMissingAltTexts() {
        document.querySelectorAll('img:not([alt])').forEach(img => {
            img.alt = img.closest('[aria-label]')?.getAttribute('aria-label') || '';
        });
    },

    // Navigation clavier sur les cards (Enter = click)
    _addKeyboardNavToCards() {
        document.querySelectorAll('[data-clickable], .spot-card, .session-card').forEach(card => {
            if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
            if (!card.hasAttribute('role')) card.setAttribute('role', 'link');
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
            });
        });
    },

    // T240 — Adaptation portrait/landscape
    _handleOrientationChange() {
        const onOrientationChange = () => {
            const isLandscape = window.matchMedia('(orientation: landscape)').matches;
            document.body.classList.toggle('landscape', isLandscape);
            document.body.classList.toggle('portrait', !isLandscape);
            // Ajuster la bottom nav en landscape
            const bottomNav = document.querySelector('.bottom-nav');
            if (bottomNav) {
                bottomNav.style.display = isLandscape && window.innerWidth < 768 ? 'none' : '';
            }
        };
        window.addEventListener('orientationchange', onOrientationChange);
        window.matchMedia('(orientation: landscape)').addEventListener('change', onOrientationChange);
        onOrientationChange();
    },

    // Ajouter des labels manquants sur les inputs
    _improveFormLabels() {
        document.querySelectorAll('input:not([aria-label]):not([id])').forEach((inp, i) => {
            const placeholder = inp.placeholder;
            if (placeholder) inp.setAttribute('aria-label', placeholder);
        });
        // Boutons sans texte accessible
        document.querySelectorAll('button:not([aria-label])').forEach(btn => {
            if (!btn.textContent.trim() && !btn.querySelector('img[alt]')) {
                const title = btn.title || btn.dataset.tooltip;
                if (title) btn.setAttribute('aria-label', title);
            }
        });
    },

    // Réduire les animations si demandé (prefers-reduced-motion)
    respectReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
};

// Patcher showToast pour annoncer aux lecteurs d'écran
const _originalShowToast = window.showToast;
window.showToast = function (message, type) {
    if (_originalShowToast) _originalShowToast(message, type);
    Accessibility.announce(message);
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Accessibility.init());
} else {
    Accessibility.init();
}

window.Accessibility = Accessibility;
