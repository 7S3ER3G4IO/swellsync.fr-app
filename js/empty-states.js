/**
 * SwellSync — États vides, chargement et erreurs
 * Composants réutilisables pour tout l'app
 */

// Afficher un état vide dans un conteneur
function showEmptyState(container, { icon = '🌊', title = 'Rien ici', message = '', ctaText = null, ctaHref = null } = {}) {
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true">${icon}</div>
      <h3>${title}</h3>
      ${message ? `<p>${message}</p>` : ''}
      ${ctaText ? `<a href="${ctaHref || '#'}" class="btn btn-primary">${ctaText}</a>` : ''}
    </div>
  `;
}

// Afficher un skeleton loader
function showSkeleton(container, rows = 3, type = 'card') {
  if (!container) return;
  const skeletonRow = type === 'card'
    ? `<div class="skeleton skeleton-card"></div>`
    : `<div class="skeleton-row">
        <div class="skeleton skeleton-avatar"></div>
        <div style="flex:1">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        </div>
      </div>`;
  container.innerHTML = Array(rows).fill(skeletonRow).join('');
  container.setAttribute('aria-busy', 'true');
  container.setAttribute('aria-label', 'Chargement...');
}

// Effacer le skeleton et afficher le contenu
function clearSkeleton(container) {
  if (!container) return;
  container.removeAttribute('aria-busy');
  container.removeAttribute('aria-label');
}

// Afficher un état d'erreur réseau
function showErrorState(container, { message = 'Une erreur est survenue.', onRetry = null } = {}) {
  if (!container) return;
  container.innerHTML = `
    <div class="error-state" role="alert">
      <span aria-hidden="true">❌</span>
      <p>${message}</p>
      ${onRetry ? '<button class="btn btn-secondary retry-btn" style="margin-top:12px">Réessayer</button>' : ''}
    </div>
  `;
  if (onRetry) {
    container.querySelector('.retry-btn')?.addEventListener('click', onRetry);
  }
}

// États vides prédéfinis pour chaque section
const EmptyStates = {
  feed: (el) => showEmptyState(el, {
    icon: '🌊', title: 'Le feed est vide',
    message: 'Sois le premier à partager ta session !',
    ctaText: 'Publier maintenant', ctaHref: '/pages/home.html'
  }),
  sessions: (el) => showEmptyState(el, {
    icon: '🏄', title: 'Aucune session',
    message: 'Lance ta première session GPS pour voir tes stats ici.',
    ctaText: 'Enregistrer une session', ctaHref: '/pages/session-live.html'
  }),
  alerts: (el) => showEmptyState(el, {
    icon: '🔔', title: 'Aucune alerte',
    message: 'Configure une alerte pour être notifié quand les conditions sont parfaites.',
    ctaText: 'Créer une alerte', ctaHref: '/pages/alerts.html'
  }),
  following: (el) => showEmptyState(el, {
    icon: '👥', title: 'Tu ne suis personne encore',
    message: 'Découvre des surfeurs de ta région.',
    ctaText: 'Explorer la communauté', ctaHref: '/pages/community.html'
  }),
  messages: (el) => showEmptyState(el, {
    icon: '💬', title: 'Aucun message',
    message: 'Commence une conversation avec un surfeur.'
  }),
  notifications: (el) => showEmptyState(el, {
    icon: '🔕', title: 'Pas de notifications',
    message: 'Active les alertes houle pour recevoir des notifications.'
  }),
  search: (el, query = '') => showEmptyState(el, {
    icon: '🔍', title: 'Aucun résultat',
    message: query ? `Aucun résultat pour "${query}".` : 'Recherche un surfeur ou un spot.'
  }),
};

window.showEmptyState = showEmptyState;
window.showSkeleton = showSkeleton;
window.clearSkeleton = clearSkeleton;
window.showErrorState = showErrorState;
window.EmptyStates = EmptyStates;
