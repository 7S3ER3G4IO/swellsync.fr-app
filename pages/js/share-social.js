/* ═══════════════════════════════════════════════════════════════
   SwellSync — Partage Social (App + Profil)
   ═══════════════════════════════════════════════════════════════ */

(function () {
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
        .share-overlay { position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .3s }
        .share-overlay.show { opacity:1 }
        .share-sheet { background:#0f2438;border-radius:28px 28px 0 0;width:100%;max-width:420px;padding:24px 20px 36px;transform:translateY(100%);transition:transform .35s cubic-bezier(.34,1.56,.64,1) }
        .share-overlay.show .share-sheet { transform:translateY(0) }
        .share-handle { width:40px;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;margin:0 auto 16px }
        .share-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px }
        .share-btn { display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;transition:all .2s }
        .share-btn:active { transform:scale(0.9) }
        .share-icon { width:52px;height:52px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:24px }
        .share-label { font-size:10px;color:#94a3b8;font-weight:600 }
    `;
    document.head.appendChild(style);
})();

/**
 * Show social share modal for app or profile
 * @param {'app'|'profile'} type
 * @param {Object} data - { url, title, text, username }
 */
function showShareModal(type, data = {}) {
    const url = data.url || window.location.href;
    const title = data.title || 'SwellSync — Prévisions Surf';
    const text = data.text || 'Découvre SwellSync, l\'app de prévisions surf en temps réel ! 🏄🌊';

    const overlay = document.createElement('div');
    overlay.className = 'share-overlay';
    overlay.innerHTML = `
        <div class="share-sheet">
            <div class="share-handle"></div>
            <h3 style="font-size:16px;font-weight:800;color:#f1f5f9;text-align:center">${type === 'profile' ? 'Partager mon profil' : 'Partager SwellSync'}</h3>
            <p style="font-size:11px;color:#64748b;text-align:center;margin-top:4px">${type === 'profile' ? 'Montre ton profil de surfeur' : 'Fais découvrir SwellSync à tes potes'}</p>

            <div class="share-grid">
                <!-- Instagram Story -->
                <div class="share-btn" onclick="shareToInsta('${encodeURIComponent(url)}')">
                    <div class="share-icon" style="background:linear-gradient(135deg,#833AB4,#E1306C,#F77737)">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    </div>
                    <span class="share-label">Instagram</span>
                </div>
                <!-- Snapchat -->
                <div class="share-btn" onclick="shareToSnap('${encodeURIComponent(url)}')">
                    <div class="share-icon" style="background:#FFFC00">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#000"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.501.14.07.29.105.449.105a1.07 1.07 0 00.457-.104c.276-.14.516-.183.738-.183.364 0 .655.131.861.397.27.352.159.756-.035 1.041-.363.526-.996.675-1.511.793-.177.04-.341.078-.484.128-.097.034-.252.108-.307.319-.039.152.014.337.154.544.498.721 1.063 1.342 1.665 1.838.462.38.997.688 1.512.923.38.172.813.441.877.919.072.546-.382.986-1.352 1.302-.242.079-.485.119-.711.119-.173 0-.417-.048-.604-.093a3.67 3.67 0 00-.771-.098c-.27 0-.488.036-.727.167-.451.25-.653.736-.937 1.014-.379.371-.906.56-1.472.56a3.3 3.3 0 01-.525-.044c-1.18-.191-2.124-.822-2.994-1.401-.563-.374-1.083-.72-1.648-.82a4.16 4.16 0 00-.694-.058c-.565 0-1.085.146-1.648.82-.87.579-1.814 1.21-2.994 1.401a3.3 3.3 0 01-.525.044c-.566 0-1.093-.189-1.472-.56-.284-.278-.486-.764-.937-1.014a1.97 1.97 0 00-.727-.167 3.67 3.67 0 00-.771.098c-.187.045-.431.093-.604.093-.226 0-.469-.04-.711-.119-.97-.316-1.424-.756-1.352-1.302.064-.478.497-.747.877-.919a6.67 6.67 0 001.512-.923c.602-.496 1.167-1.117 1.665-1.838.14-.207.193-.392.154-.544-.055-.211-.21-.285-.307-.319a7.03 7.03 0 01-.484-.128c-.515-.118-1.148-.267-1.511-.793-.194-.285-.305-.689-.035-1.041.206-.266.497-.397.861-.397.222 0 .462.043.738.183.178.09.339.104.457.104.158 0 .308-.035.449-.105a7.36 7.36 0 01-.03-.501l-.003-.06c-.104-1.628-.23-3.654.299-4.847C7.859 1.069 11.216.793 12.206.793z"/></svg>
                    </div>
                    <span class="share-label">Snapchat</span>
                </div>
                <!-- WhatsApp -->
                <div class="share-btn" onclick="shareToWhatsApp('${encodeURIComponent(text + ' ' + url)}')">
                    <div class="share-icon" style="background:#25D366">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </div>
                    <span class="share-label">WhatsApp</span>
                </div>
                <!-- Twitter/X -->
                <div class="share-btn" onclick="shareToTwitter('${encodeURIComponent(text)}','${encodeURIComponent(url)}')">
                    <div class="share-icon" style="background:#000;border:1px solid rgba(255,255,255,0.1)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </div>
                    <span class="share-label">X / Twitter</span>
                </div>
                <!-- TikTok -->
                <div class="share-btn" onclick="copyShareLink('${url}')">
                    <div class="share-icon" style="background:#010101;border:1px solid rgba(255,255,255,0.1)">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.43v-7.15a8.16 8.16 0 005.58 2.09V11.1a4.84 4.84 0 01-2.09-.47V6.69h2.09z"/></svg>
                    </div>
                    <span class="share-label">TikTok</span>
                </div>
                <!-- Copy Link -->
                <div class="share-btn" onclick="copyShareLink('${url}')">
                    <div class="share-icon" style="background:rgba(0,186,214,0.15)">
                        <span class="material-symbols-outlined" style="color:#00bad6;font-size:22px">link</span>
                    </div>
                    <span class="share-label">Copier lien</span>
                </div>
                <!-- More -->
                <div class="share-btn" onclick="nativeShare('${encodeURIComponent(title)}','${encodeURIComponent(text)}','${encodeURIComponent(url)}')">
                    <div class="share-icon" style="background:rgba(255,255,255,0.05)">
                        <span class="material-symbols-outlined" style="color:#94a3b8;font-size:22px">more_horiz</span>
                    </div>
                    <span class="share-label">Plus…</span>
                </div>
            </div>
            <button onclick="this.closest('.share-overlay').remove()" style="width:100%;margin-top:20px;padding:12px;border-radius:14px;background:#1e3148;color:#94a3b8;font-weight:700;font-size:13px;border:none;cursor:pointer">Annuler</button>
        </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.classList.remove('show'); setTimeout(() => overlay.remove(), 300); } });
}

// Share helpers
function shareToInsta(url) { window.open('https://instagram.com', '_blank'); showToast('Copie le lien et partage en story ! 📸', 'info'); copyShareLink(decodeURIComponent(url)); }
function shareToSnap(url) { window.open('https://snapchat.com', '_blank'); showToast('Copie le lien et partage sur Snap ! 👻', 'info'); copyShareLink(decodeURIComponent(url)); }
function shareToWhatsApp(text) { window.open('https://wa.me/?text=' + text, '_blank'); }
function shareToTwitter(text, url) { window.open('https://twitter.com/intent/tweet?text=' + text + '&url=' + url, '_blank'); }
function copyShareLink(url) {
    navigator.clipboard.writeText(decodeURIComponent(url)).then(() => showToast('Lien copié ! 🔗', 'success'));
    document.querySelector('.share-overlay')?.remove();
}
function nativeShare(title, text, url) {
    if (navigator.share) {
        navigator.share({ title: decodeURIComponent(title), text: decodeURIComponent(text), url: decodeURIComponent(url) });
    } else { copyShareLink(url); }
}

// Shortcut to share app
function shareApp() { showShareModal('app', { url: 'https://swellsync.com', title: 'SwellSync', text: '🏄 Découvre SwellSync — Prévisions surf en temps réel ! Rejoin la communauté 🌊' }); }
function shareProfile(username) { showShareModal('profile', { url: window.location.href, title: 'SwellSync — Profil', text: `Check le profil de ${username || 'ce surfeur'} sur SwellSync ! 🏄` }); }
