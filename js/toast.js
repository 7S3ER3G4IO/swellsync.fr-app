/**
 * SwellSync - Toast Notification System
 * Affiche des notifications (succès, erreurs) de façon asynchrone et premium.
 */
class ToastSystem {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    }

    /**
     * Affiche un toast.
     * @param {string} message Le texte à afficher
     * @param {string} type 'success' ou 'error'
     * @param {number} duration Durée en millisecondes
     */
    show(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        // Icône basée sur le type
        const icon = type === 'success'
            ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
            : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

        toast.innerHTML = `
            ${icon}
            <span>${message}</span>
        `;

        this.container.appendChild(toast);

        // Animation d'entrée
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Retrait du toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode === this.container) {
                    this.container.removeChild(toast);
                }
            }, 400); // Wait for transition CSS (fade out + translation) to complete
        }, duration);
    }
}

// Instance globale : utilisable partout (`Toast.show("Bonjour")`)
const Toast = new ToastSystem();
window.Toast = Toast;
