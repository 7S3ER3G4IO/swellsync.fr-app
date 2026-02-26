/* ═══════════════════════════════════════════════════════════════
   SwellSync — Composants UI réutilisables (Toast + Confirm Modal)
   ═══════════════════════════════════════════════════════════════ */

// ── Toast Notification ──────────────────────────────────────────
(function () {
    // Inject CSS once
    if (!document.getElementById('sw-toast-css')) {
        const style = document.createElement('style');
        style.id = 'sw-toast-css';
        style.textContent = `
            .sw-toast {
                position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%) translateY(20px);
                z-index: 99999; padding: 12px 20px; border-radius: 14px;
                font-size: 13px; font-weight: 600; color: white;
                backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                box-shadow: 0 8px 30px rgba(0,0,0,0.4);
                opacity: 0; transition: all .4s cubic-bezier(.34,1.56,.64,1);
                pointer-events: none; max-width: 90%; text-align: center;
                display: flex; align-items: center; gap: 8px;
            }
            .sw-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
            .sw-toast.success { background: rgba(16,185,129,0.9); }
            .sw-toast.error { background: rgba(239,68,68,0.9); }
            .sw-toast.warning { background: rgba(245,158,11,0.9); color: #1a1a2e; }
            .sw-toast.info { background: rgba(0,186,214,0.9); }

            .sw-confirm-overlay {
                position: fixed; inset: 0; z-index: 99998;
                background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
                display: flex; align-items: center; justify-content: center;
                opacity: 0; transition: opacity .3s ease;
            }
            .sw-confirm-overlay.show { opacity: 1; }
            .sw-confirm-box {
                background: #0f2438; border: 1px solid rgba(0,186,214,0.15);
                border-radius: 24px; padding: 28px; max-width: 360px; width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                transform: scale(0.9) translateY(20px);
                transition: transform .35s cubic-bezier(.34,1.56,.64,1);
            }
            .sw-confirm-overlay.show .sw-confirm-box { transform: scale(1) translateY(0); }
            .sw-confirm-title { font-size: 18px; font-weight: 900; color: #f1f5f9; margin-bottom: 8px; }
            .sw-confirm-msg { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px; }
            .sw-confirm-btns { display: flex; gap: 10px; }
            .sw-confirm-btns button { flex: 1; padding: 12px; border-radius: 14px; font-weight: 800; font-size: 13px; border: none; cursor: pointer; transition: all .2s; }
            .sw-confirm-btns button:active { transform: scale(0.95); }
            .sw-confirm-cancel { background: #1e3148; color: #94a3b8; }
            .sw-confirm-cancel:hover { background: #253d5c; }
            .sw-confirm-ok { background: #00bad6; color: #080f1a; }
            .sw-confirm-ok:hover { background: #00d4f5; }
            .sw-confirm-danger { background: #ef4444; color: white; }
            .sw-confirm-danger:hover { background: #f87171; }
        `;
        document.head.appendChild(style);
    }
})();

/**
 * Show a toast notification
 * @param {string} message - Text to display
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {number} duration - Duration in ms (default 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    document.querySelectorAll('.sw-toast').forEach(t => t.remove());

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `sw-toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

/**
 * Show a confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {Function} onConfirm - Callback if confirmed
 * @param {Object} opts - Options { danger: bool, confirmText: string, cancelText: string }
 */
function showConfirmModal(title, message, onConfirm, opts = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'sw-confirm-overlay';
    overlay.innerHTML = `
        <div class="sw-confirm-box">
            <div class="sw-confirm-title">${title}</div>
            <div class="sw-confirm-msg">${message}</div>
            <div class="sw-confirm-btns">
                <button class="sw-confirm-cancel" id="swConfirmCancel">${opts.cancelText || 'Annuler'}</button>
                <button class="${opts.danger ? 'sw-confirm-danger' : 'sw-confirm-ok'}" id="swConfirmOk">${opts.confirmText || 'Confirmer'}</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('show'));

    const close = () => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('#swConfirmCancel').onclick = close;
    overlay.querySelector('#swConfirmOk').onclick = () => { close(); if (onConfirm) onConfirm(); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

// Also provide showToasty alias for backward compatibility
if (typeof showToasty === 'undefined') {
    window.showToasty = function (msg) { showToast(msg, 'info'); };
}
