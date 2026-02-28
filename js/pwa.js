let deferredPrompt;

// ── Service Worker : en développement on force le bypass du cache ─────────────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Enregistrer le nouveau SW (qui vide tous les anciens caches)
        navigator.serviceWorker.register('/sw.js').then((registration) => {
            // Forcer la mise à jour immédiate
            registration.update();

        }).catch((error) => {

        });

        // Désinscrire TOUS les anciens service workers pour forcer le rechargement
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((reg) => {
                reg.update(); // force la mise à jour
            });
        });
    });
}

// 2. Interception de l'événement d'installation Android natif
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
});

// Appelé par le bouton "Google Play"
window.installAndroidPWA = function () {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                Toast.show("Installation de l'application en cours... 🏄‍♂️", "success");
            } else {
                Toast.show("Installation annulée ou reportée.", "info");
            }
            deferredPrompt = null;
        });
    } else {
        Toast.show("Si le système ne s'ouvre pas, utilisez l'option 'Ajouter à l'écran d'accueil' de votre navigateur 🤖", "info", 5000);
    }
};

// Appelé par le bouton "App Store"
window.installApplePWA = function () {
    const isIos = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

    if (isIos() && !isInStandaloneMode()) {
        Toast.show('🍏 iOS Safari: Touchez l\'icône [Partager] en bas, puis [Sur l\'écran d\'accueil].', 'warning', 8000);
    } else if (isInStandaloneMode()) {
        Toast.show('SwellSync App est déjà installée sur ce téléphone ! 🏄‍♂️', 'success');
    } else {
        Toast.show('🍏 Depuis un Mac ou iOS, utilisez Safari et le menu de partage pour installer l\'app.', 'info', 6000);
    }
};

// Détection mise à jour SW disponible
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (typeof showToast === 'function') {
      const t = showToast('🔄 Mise à jour disponible', 'info', 8000);
    } else {
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#0ea5e9;color:white;text-align:center;padding:12px;z-index:9999;font-weight:600;cursor:pointer';
      banner.textContent = '🔄 Nouvelle version disponible — Cliquez pour actualiser';
      banner.onclick = () => window.location.reload();
      document.body.prepend(banner);
    }
  });
  
  navigator.serviceWorker.ready.then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });
  });
}
