/**
 * SwellSync — Global Error Handler
 * Capture les erreurs non gérées et les affiche proprement avec showToast
 */

window.addEventListener('error', e => {
  // Ignorer les erreurs cross-origin
  if (e.message && e.message.includes('Script error')) return;
  if (typeof showToast !== 'undefined') {
    showToast('Une erreur inattendue est survenue. Recharge la page si le problème persiste.', 'error');
  }
  console.error('[SwellSync Error]', e.message, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', e => {
  const msg = e.reason?.message || 'Erreur réseau';
  if (msg.toLowerCase().includes('network') || msg.includes('fetch')) {
    if (typeof showToast !== 'undefined') showToast('Connexion perdue. Vérifie ta connexion internet.', 'error');
  } else if (msg.includes('JWT') || msg.toLowerCase().includes('auth')) {
    if (typeof showToast !== 'undefined') showToast('Session expirée. Reconnexion...', 'info');
    setTimeout(() => { window.location.href = '/index.html'; }, 2500);
  }
  console.warn('[SwellSync Unhandled]', e.reason);
  e.preventDefault();
});

/**
 * Gestion centralisée des erreurs Supabase
 * Usage: supabaseErrorHandler(error, 'loading sessions')
 */
window.supabaseErrorHandler = function (error, context) {
  if (!error) return;
  const code = error.code || '';
  const msg = error.message || '';

  // Résultat vide = normal
  if (code === 'PGRST116' || msg.includes('no rows')) return;

  // Erreur permission
  if (code.startsWith('42') || msg.includes('permission')) {
    if (typeof showToast !== 'undefined') showToast('Accès refusé. Reconnecte-toi.', 'error');
    return;
  }

  // Erreur JWT / auth
  if (msg.includes('JWT') || msg.includes('auth')) {
    if (typeof showToast !== 'undefined') showToast('Session expirée. Reconnexion...', 'info');
    setTimeout(() => { window.location.href = '/index.html'; }, 2000);
    return;
  }

  // Erreur réseau
  if (msg.includes('fetch') || msg.includes('network')) {
    if (typeof showToast !== 'undefined') showToast('Connexion perdue. Réessaie dans quelques secondes.', 'error');
    return;
  }

  // Erreur générique
  const label = context ? context + ' : ' : '';
  if (typeof showToast !== 'undefined') {
    showToast('Erreur ' + label + msg.substring(0, 60), 'error');
  }
  console.error('[Supabase Error]', context || '', error);
};
