/**
 * SwellSync — Système de Toast amélioré
 * Accessible (aria-live), auto-dismiss, types multiples
 */

let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'false');
    toastContainer.style.cssText = `
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      z-index: 9999; display: flex; flex-direction: column; gap: 8px;
      pointer-events: none; width: min(calc(100% - 32px), 360px);
    `;
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(message, type = 'info', duration = 3500) {
  const container = getToastContainer();
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const colors = {
    success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6'
  };

  const toast = document.createElement('div');
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.style.cssText = `
    background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px);
    border: 1px solid ${colors[type]}40; border-left: 4px solid ${colors[type]};
    color: #f1f5f9; padding: 12px 16px; border-radius: 12px;
    display: flex; align-items: center; gap: 10px; font-size: 14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3); pointer-events: all;
    animation: toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
    cursor: pointer;
  `;
  toast.innerHTML = `<span style="font-size:18px">${icons[type]}</span><span style="flex:1">${message}</span>`;
  toast.addEventListener('click', () => dismissToast(toast));
  container.appendChild(toast);

  const timer = setTimeout(() => dismissToast(toast), duration);
  toast._dismissTimer = timer;

  // Injecter le style d'animation si absent
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes toastIn { from { opacity:0; transform:translateY(20px) scale(.9); } to { opacity:1; transform:translateY(0) scale(1); } }
      @keyframes toastOut { from { opacity:1; transform:translateY(0); } to { opacity:0; transform:translateY(10px); } }
    `;
    document.head.appendChild(style);
  }

  return toast;
}

function dismissToast(toast) {
  clearTimeout(toast._dismissTimer);
  toast.style.animation = 'toastOut 0.25s ease forwards';
  setTimeout(() => toast.remove(), 250);
}

// Convenience methods
const toast = {
  success: (msg, d) => showToast(msg, 'success', d),
  error: (msg, d) => showToast(msg, 'error', d || 5000),
  warning: (msg, d) => showToast(msg, 'warning', d),
  info: (msg, d) => showToast(msg, 'info', d),
};

window.showToast = showToast;
window.toast = toast;
