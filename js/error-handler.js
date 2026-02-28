/**
 * SwellSync — Gestionnaire d'erreurs réseau global
 * Retry logic, timeout, messages user-friendly
 */

// Retry avec exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || (2 ** attempt);
        await sleep(retryAfter * 1000);
        continue;
      }
      if (response.status >= 500 && attempt < maxRetries) {
        await sleep(2 ** attempt * 500); // 500ms, 1s, 2s...
        continue;
      }
      return response;
    } catch (err) {
      lastError = err;
      if (err.name === 'AbortError') {
        throw new Error('Délai d\'attente dépassé. Vérifiez votre connexion.');
      }
      if (attempt < maxRetries) {
        await sleep(2 ** attempt * 500);
      }
    }
  }
  throw lastError || new Error('Erreur réseau. Réessayez dans quelques instants.');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Messages d'erreur selon le code HTTP
function getErrorMessage(status) {
  const messages = {
    400: 'Données invalides. Vérifiez le formulaire.',
    401: 'Session expirée. Reconnectez-vous.',
    403: 'Accès refusé.',
    404: 'Ressource introuvable.',
    429: 'Trop de requêtes. Réessayez dans quelques secondes.',
    500: 'Erreur serveur. Réessayez dans quelques instants.',
    503: 'Service temporairement indisponible.',
  };
  return messages[status] || 'Une erreur est survenue. Réessayez.';
}

// Sécuriser les accès au localStorage
const SafeStorage = {
  get(key, fallback = null) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage plein — nettoyage...');
        // Supprimer les clés les plus anciennes
        const keys = Object.keys(localStorage);
        if (keys.length > 0) { localStorage.removeItem(keys[0]); }
      }
      return false;
    }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  }
};

// Nettoyage mémoire — à appeler à la fermeture de page
const CleanupManager = {
  _timers: [],
  _listeners: [],
  _channels: [],
  
  addTimer(id) { this._timers.push(id); },
  addListener(el, event, fn) { this._listeners.push({el, event, fn}); },
  addChannel(ch) { this._channels.push(ch); },
  
  cleanup() {
    this._timers.forEach(id => { clearInterval(id); clearTimeout(id); });
    this._listeners.forEach(({el, event, fn}) => el?.removeEventListener(event, fn));
    this._channels.forEach(ch => { try { ch?.unsubscribe(); } catch {} });
    if (typeof supabase !== 'undefined') {
      try { supabase.removeAllChannels(); } catch {}
    }
    this._timers = []; this._listeners = []; this._channels = [];
  }
};

window.addEventListener('beforeunload', () => CleanupManager.cleanup());
window.addEventListener('pagehide', () => CleanupManager.cleanup());

// Wake Lock API pour la session GPS
const WakeLockManager = {
  _lock: null,
  async acquire() {
    try {
      if ('wakeLock' in navigator) {
        this._lock = await navigator.wakeLock.request('screen');
      }
    } catch {}
  },
  async release() {
    try { await this._lock?.release(); this._lock = null; } catch {}
  }
};

// Web Share API
async function shareContent({ title, text, url }) {
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return true; }
    catch (e) { if (e.name !== 'AbortError') console.warn(e); }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(url || window.location.href);
    if (typeof showToast === 'function') showToast('Lien copié ! 🔗', 'success');
    return true;
  } catch { return false; }
}

// Vibration haptic feedback
function haptic(pattern = [50]) {
  if ('vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch {}
  }
}

window.SwellSync = window.SwellSync || {};
Object.assign(window.SwellSync, {
  fetchWithRetry, getErrorMessage, SafeStorage, 
  CleanupManager, WakeLockManager, shareContent, haptic, sleep
});
