/**
 * SwellSync — Session Photo (T18)
 * Photo/selfie de fin de session via Camera API
 * + T20: Partage du tracé GPS de la session (image + Web Share API)
 */

const SessionPhoto = {
    _stream: null,
    _canvas: null,

    // Ouvrir la caméra et prendre une photo
    async capturePhoto(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Créer l'UI caméra
        container.innerHTML = `
      <div style="position:relative;border-radius:20px;overflow:hidden;background:#000;aspect-ratio:4/3">
        <video id="session-camera" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover"></video>
        <div style="position:absolute;bottom:20px;width:100%;display:flex;justify-content:center;gap:16px">
          <button type="button" id="flip-camera-btn" onclick="SessionPhoto.flipCamera()" style="background:rgba(255,255,255,.2);border:none;border-radius:50%;width:44px;height:44px;font-size:20px;cursor:pointer;backdrop-filter:blur(8px)">🔄</button>
          <button type="button" id="take-photo-btn" onclick="SessionPhoto.takePhoto('${containerId}')" style="background:white;border:none;border-radius:50%;width:64px;height:64px;font-size:28px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.3)">📸</button>
          <button type="button" onclick="SessionPhoto.stopCamera('${containerId}')" style="background:rgba(255,255,255,.2);border:none;border-radius:50%;width:44px;height:44px;font-size:20px;cursor:pointer;backdrop-filter:blur(8px)">✕</button>
        </div>
      </div>`;

        try {
            this._facingMode = this._facingMode || 'environment'; // Caméra arrière par défaut
            this._stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: this._facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
                audio: false
            });
            document.getElementById('session-camera').srcObject = this._stream;
        } catch (e) {
            container.innerHTML = '<div class="empty-state"><div>📷</div><h3>Caméra indisponible</h3><p>Autorise l\'accès à la caméra pour prendre une photo de ta session.</p></div>';
        }
    },

    async flipCamera() {
        this._facingMode = this._facingMode === 'environment' ? 'user' : 'environment';
        if (this._stream) { this._stream.getTracks().forEach(t => t.stop()); }
        const video = document.getElementById('session-camera');
        if (video) {
            this._stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: this._facingMode }, audio: false });
            video.srcObject = this._stream;
        }
    },

    takePhoto(containerId) {
        const video = document.getElementById('session-camera');
        if (!video) return;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        this._photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        this.stopCamera(containerId);
        this._showPhotoPreview(containerId);
    },

    _showPhotoPreview(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this._photoDataUrl) return;
        container.innerHTML = `
      <div style="border-radius:20px;overflow:hidden;position:relative">
        <img src="${this._photoDataUrl}" style="width:100%;border-radius:20px" alt="Photo de session">
        <div style="display:flex;gap:10px;margin-top:12px">
          <button type="button" onclick="SessionPhoto.savePhoto()" style="flex:1;background:linear-gradient(135deg,#0ea5e9,#0284c7);border:none;border-radius:14px;padding:12px;color:white;font-weight:700;font-size:14px;cursor:pointer">💾 Sauvegarder</button>
          <button type="button" onclick="SessionPhoto.sharePhoto()" style="flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px;color:#f1f5f9;font-weight:600;font-size:14px;cursor:pointer">📤 Partager</button>
          <button type="button" onclick="SessionPhoto.capturePhoto('${containerId}')" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:12px;color:#94a3b8;font-size:14px;cursor:pointer">🔄 Reprendre</button>
        </div>
      </div>`;
    },

    stopCamera(containerId) {
        if (this._stream) { this._stream.getTracks().forEach(t => t.stop()); this._stream = null; }
    },

    // Sauvegarder la photo (upload vers Supabase Storage)
    async savePhoto() {
        if (!this._photoDataUrl) return;
        try {
            const blob = await (await fetch(this._photoDataUrl)).blob();
            const filename = `session-photo-${Date.now()}.jpg`;
            const { data: { user } } = await supabase.auth.getUser();
            const path = `${user.id}/${filename}`;
            const { error } = await supabase.storage.from('session-photos').upload(path, blob, { contentType: 'image/jpeg' });
            if (!error && typeof showToast !== 'undefined') showToast('📸 Photo de session sauvegardée !', 'success');
        } catch (e) {
            if (typeof showToast !== 'undefined') showToast('Erreur upload photo', 'error');
        }
    },

    // T20: Partager la photo de session
    async sharePhoto() {
        if (!this._photoDataUrl) return;
        try {
            const blob = await (await fetch(this._photoDataUrl)).blob();
            const file = new File([blob], 'ma-session-surf.jpg', { type: 'image/jpeg' });
            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({ title: '🌊 Ma session surf sur SwellSync', files: [file] });
            } else {
                // Fallback: télécharger l'image
                const a = document.createElement('a');
                a.href = this._photoDataUrl; a.download = 'ma-session-surf.jpg'; a.click();
            }
        } catch { }
    }
};

window.SessionPhoto = SessionPhoto;
