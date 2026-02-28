/**
 * SwellSync — Validation des formulaires
 * Anti double-submit, messages d'erreur, trim, XSS prevention
 */

// Empêcher le double-submit
function preventDoubleSubmit(form) {
  form.addEventListener('submit', function() {
    const btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.dataset.originalText = btn.textContent;
      btn.innerHTML = btn.textContent.includes('...') ? btn.textContent 
        : `<span style="display:inline-flex;align-items:center;gap:8px">
            <span style="width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .8s linear infinite"></span>
            ${btn.textContent}...
           </span>`;
    }
  }, { once: true });
}

// Validation email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Sécurisation : échapper HTML dans les sorties utilisateur
function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Valider un champ et afficher l'erreur
function validateField(input, validator, errorMessage) {
  const value = input.value.trim();
  const isValid = validator(value);
  
  // Trouver ou créer le message d'erreur
  let errorEl = input.parentNode.querySelector('.field-error');
  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.className = 'field-error';
    errorEl.style.cssText = 'color:#ef4444;font-size:12px;margin:4px 0 0;';
    errorEl.setAttribute('role', 'alert');
    input.parentNode.appendChild(errorEl);
  }
  
  if (!isValid) {
    input.style.borderColor = '#ef4444';
    input.setAttribute('aria-invalid', 'true');
    errorEl.textContent = errorMessage;
    errorEl.style.display = 'block';
  } else {
    input.style.borderColor = '';
    input.removeAttribute('aria-invalid');
    errorEl.style.display = 'none';
  }
  
  return isValid;
}

// Validation pseudo
function isValidPseudo(pseudo) {
  return pseudo.length >= 3 && pseudo.length <= 30 && /^[a-zA-Z0-9_.-]+$/.test(pseudo);
}

// Validation formulaire complet
function validateForm(form) {
  let isValid = true;
  
  form.querySelectorAll('input[required], textarea[required]').forEach(input => {
    const trimmed = input.value.trim();
    if (!trimmed) {
      validateField(input, () => false, 'Ce champ est obligatoire.');
      isValid = false;
    }
    if (input.type === 'email' && !isValidEmail(trimmed)) {
      validateField(input, () => false, 'Email invalide. Ex: nom@exemple.fr');
      isValid = false;
    }
  });
  
  return isValid;
}

// Auto-trim sur les champs email
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', () => { input.value = input.value.trim(); });
  });
  
  // Prevent double submit sur tous les formulaires
  document.querySelectorAll('form').forEach(f => preventDoubleSubmit(f));
});

window.isValidEmail = isValidEmail;
window.isValidPseudo = isValidPseudo;
window.escapeHtml = escapeHtml;
window.validateField = validateField;
window.validateForm = validateForm;
window.preventDoubleSubmit = preventDoubleSubmit;
