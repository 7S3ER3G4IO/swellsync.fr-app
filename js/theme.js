/**
 * SwellSync — Gestion thème (dark par défaut, respect prefers-color-scheme)
 * Toujours en dark sur cette app, mais respecte le choix utilisateur si jamais activé
 */
(function () {
    const stored = localStorage.getItem('sw_theme');
    const prefer = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = stored || 'dark'; // SwellSync est dark-first
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') document.body && document.body.classList.add('theme-light');
})();

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    if (document.body) document.body.classList.toggle('theme-light', next === 'light');
    localStorage.setItem('sw_theme', next);
    if (typeof showToast !== 'undefined') {
        showToast(next === 'light' ? '☀️ Mode clair activé' : '🌙 Mode sombre activé', 'info');
    }
}

window.toggleTheme = toggleTheme;
