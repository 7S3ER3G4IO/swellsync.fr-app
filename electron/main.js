const { app, BrowserWindow, shell, Menu, nativeImage } = require('electron');
const path = require('path');

// ── Configuration ──
const APP_URL = 'https://swellsync.fr/pages/home.html';
const FALLBACK_URL = 'https://swellsync-fr-app.onrender.com/pages/home.html';
const WINDOW_WIDTH = 420;
const WINDOW_HEIGHT = 780;
const RETRY_DELAY = 3000; // 3 sec entre chaque essai
const MAX_RETRIES = 20;   // Max 1 minute de tentatives

let mainWindow;

// ── Écran de chargement HTML ──
const LOADING_HTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background:#080f1a; color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,sans-serif;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    height:100vh; text-align:center; padding:20px;
  }
  .logo { font-size:32px; font-weight:800; margin-bottom:8px; }
  .logo span { color:#00bad6; }
  .subtitle { color:#64748b; font-size:14px; margin-bottom:40px; }
  .spinner {
    width:40px; height:40px; border:3px solid rgba(0,186,214,0.15);
    border-top-color:#00bad6; border-radius:50%; animation:spin 1s linear infinite;
    margin-bottom:20px;
  }
  .status { color:#94a3b8; font-size:13px; }
  .status em { color:#00bad6; font-style:normal; }
  .wave { font-size:48px; margin-bottom:24px; animation:float 2s ease-in-out infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
</style>
</head>
<body>
  <div class="wave">🏄</div>
  <div class="logo">Swell<span>Sync</span></div>
  <div class="subtitle">Prévisions surf en temps réel</div>
  <div class="spinner"></div>
  <div class="status">Connexion au serveur<em>...</em></div>
  <div class="status" style="margin-top:8px;font-size:11px;color:#475569" id="retry"></div>
</body>
</html>`;

function createWindow() {
    const iconPath = path.join(__dirname, 'icon.png');
    let icon;
    try { icon = nativeImage.createFromPath(iconPath); } catch (e) { }

    mainWindow = new BrowserWindow({
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        minWidth: 360,
        minHeight: 640,
        maxWidth: 500,
        resizable: true,
        title: 'SwellSync',
        icon: icon,
        backgroundColor: '#080f1a',
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 12, y: 12 },
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        show: false,
    });

    // Afficher le loading screen
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(LOADING_HTML)}`);
    mainWindow.once('ready-to-show', () => mainWindow.show());

    // Essayer de charger l'app avec retry
    loadAppWithRetry(APP_URL, 0);

    // Liens externes dans le navigateur
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://') || url.startsWith('http://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.includes('swellsync') || url.includes('localhost') || url.startsWith('data:')) return;
        event.preventDefault();
        shell.openExternal(url);
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Retry logic : réessaie jusqu'à ce que le serveur réponde ──
function loadAppWithRetry(url, attempt) {
    if (!mainWindow || attempt >= MAX_RETRIES) {
        // Fallback : essayer l'URL alternative
        if (url === APP_URL && attempt >= MAX_RETRIES) {
            console.log('Primary URL failed, trying fallback...');
            loadAppWithRetry(FALLBACK_URL, 0);
            return;
        }
        if (mainWindow) {
            mainWindow.webContents.executeJavaScript(
                `document.getElementById('retry').textContent = 'Impossible de se connecter. Vérifie ta connexion internet.';`
            ).catch(() => { });
        }
        return;
    }

    // Vérifier si le serveur est réveillé
    const https = require('https');
    const urlObj = new URL(url);

    const req = https.get({
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        timeout: 8000,
    }, (res) => {
        if (res.statusCode === 200 || res.statusCode === 304) {
            // Serveur OK → charger l'app !
            console.log(`Server ready! Loading ${url}`);
            mainWindow.loadURL(url);
        } else {
            // Serveur pas prêt (peut-être en train de wake up)
            console.log(`Attempt ${attempt + 1}: status ${res.statusCode}, retrying...`);
            updateRetryStatus(attempt + 1);
            setTimeout(() => loadAppWithRetry(url, attempt + 1), RETRY_DELAY);
        }
        res.resume(); // consume data
    });

    req.on('error', (err) => {
        console.log(`Attempt ${attempt + 1}: ${err.message}, retrying...`);
        updateRetryStatus(attempt + 1);
        setTimeout(() => loadAppWithRetry(url, attempt + 1), RETRY_DELAY);
    });

    req.on('timeout', () => {
        req.destroy();
        console.log(`Attempt ${attempt + 1}: timeout, retrying...`);
        updateRetryStatus(attempt + 1);
        setTimeout(() => loadAppWithRetry(url, attempt + 1), RETRY_DELAY);
    });
}

function updateRetryStatus(attempt) {
    if (!mainWindow) return;
    mainWindow.webContents.executeJavaScript(
        `document.getElementById('retry').textContent = 'Tentative ${attempt}/${MAX_RETRIES}... Le serveur se réveille 💤';`
    ).catch(() => { });
}

// ── Menu macOS ──
const menuTemplate = [
    {
        label: 'SwellSync',
        submenu: [
            { label: 'À propos de SwellSync', role: 'about' },
            { type: 'separator' },
            { label: 'Quitter SwellSync', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
        ]
    },
    {
        label: 'Édition',
        submenu: [
            { label: 'Annuler', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
            { label: 'Rétablir', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
            { type: 'separator' },
            { label: 'Couper', accelerator: 'CmdOrCtrl+X', role: 'cut' },
            { label: 'Copier', accelerator: 'CmdOrCtrl+C', role: 'copy' },
            { label: 'Coller', accelerator: 'CmdOrCtrl+V', role: 'paste' },
            { label: 'Tout sélectionner', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
        ]
    },
    {
        label: 'Affichage',
        submenu: [
            { label: 'Recharger', accelerator: 'CmdOrCtrl+R', click: () => mainWindow && loadAppWithRetry(APP_URL, 0) },
            { type: 'separator' },
            { label: 'Zoom avant', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
            { label: 'Zoom arrière', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
            { label: 'Taille réelle', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' }
        ]
    }
];

// ── App lifecycle ──
app.whenReady().then(() => {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
