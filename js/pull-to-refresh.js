/**
 * SwellSync — Pull-to-Refresh natif (CSS + Touch Events)
 * Déclencher un refresh des conditions au swipe vers le bas
 */
(function() {
  let startY = 0;
  let isDragging = false;
  let indicator = null;
  
  const THRESHOLD = 80; // px à tirer vers le bas avant déclenchement
  
  function createIndicator() {
    const el = document.createElement('div');
    el.id = 'ptr-indicator';
    el.style.cssText = `
      position: fixed; top: -60px; left: 50%; transform: translateX(-50%);
      background: rgba(14,165,233,.9); backdrop-filter: blur(8px);
      color: white; border-radius: 50%; width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; z-index: 1000; transition: top .2s ease;
      box-shadow: 0 4px 16px rgba(14,165,233,.4);
    `;
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', 'Rafraîchissement en cours');
    el.innerHTML = '↕';
    document.body.appendChild(el);
    return el;
  }
  
  function setIndicatorProgress(progress) {
    if (!indicator) indicator = createIndicator();
    const top = Math.max(-60, -60 + progress * 0.8);
    indicator.style.top = top + 'px';
    indicator.innerHTML = progress > THRESHOLD ? '🔄' : '↕';
    if (progress > THRESHOLD) {
      indicator.style.animation = 'spin .6s linear infinite';
      if (!document.getElementById('ptr-spin-style')) {
        const s = document.createElement('style');
        s.id = 'ptr-spin-style';
        s.textContent = '@keyframes spin{to{transform:translateX(-50%) rotate(360deg)}}';
        document.head.appendChild(s);
      }
    }
  }
  
  function hideIndicator() {
    if (indicator) { indicator.style.top = '-60px'; indicator.style.animation = ''; }
  }
  
  // Seulement actif si on est en haut de la page
  function isAtTop() {
    return window.scrollY <= 0;
  }
  
  document.addEventListener('touchstart', (e) => {
    if (isAtTop()) { startY = e.touches[0].clientY; isDragging = true; }
  }, { passive: true });
  
  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0 && isAtTop()) setIndicatorProgress(dy);
  }, { passive: true });
  
  document.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const dy = e.changedTouches[0]?.clientY - startY || 0;
    if (dy > THRESHOLD && isAtTop()) {
      // Déclencher le rafraîchissement
      if (typeof refreshConditions === 'function') refreshConditions();
      else location.reload();
    }
    hideIndicator();
  });
})();
