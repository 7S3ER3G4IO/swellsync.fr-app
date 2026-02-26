const { app, BrowserWindow, Menu, Tray, nativeImage, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = 3741; // Port interne utilisé par l'app Electron (évite conflit avec dev server)
let mainWindow = null;
let tray = null;
let serverProcess = null;

// ── Démarrer le serveur Node.js en background ────────────────────────────────
function startServer() {
    const serverPath = path.join(__dirname, '..', 'server.js');
    const nodeBin = process.execPath; // Node bundlé avec Electron

    serverProcess = spawn(nodeBin, [serverPath], {
        cwd: path.join(__dirname, '..'),
        env: {
            ...process.env,
            PORT: String(PORT),
            NODE_ENV: 'production',
            // Variables d'env depuis le fichier .env si présent
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (d) => console.log('[SERVER]', d.toString().trim()));
    serverProcess.stderr.on('data', (d) => console.error('[SERVER ERR]', d.toString().trim()));

    serverProcess.on('exit', (code) => {
        console.log(`[SERVER] Processus terminé avec le code ${code}`);
    });
}

// ── Attendre que le serveur soit prêt (polling HTTP) ────────────────────────
function waitForServer(url, maxAttempts = 30, interval = 500) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const check = () => {
            attempts++;
            http.get(url, (res) => {
                if (res.statusCode < 500) resolve();
                else if (attempts < maxAttempts) setTimeout(check, interval);
                else reject(new Error('Serveur non disponible'));
            }).on('error', () => {
                if (attempts < maxAttempts) setTimeout(check, interval);
                else reject(new Error('Serveur non disponible'));
            });
        };
        check();
    });
}

// ── Créer la fenêtre principale ──────────────────────────────────────────────
function createWindow() {
    const iconPath = path.join(__dirname, '..', 'assets', 'images', 'pwa_icon.png');

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 375,
        minHeight: 600,
        title: 'SwellSync',
        icon: iconPath,
        backgroundColor: '#0a1628',
        show: false, // Afficher seulement quand prêt
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        },
    });

    // Masquer la barre de menu native (on utilise le menu custom)
    mainWindow.setMenuBarVisibility(false);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // Dev tools en mode dev uniquement
        if (process.env.NODE_ENV === 'development') {
            mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Ouvrir les liens externes dans le navigateur système
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.loadURL(`http://localhost:${PORT}`);
}

// ── Icône dans la barre système (system tray) ────────────────────────────────
function createTray() {
    const iconPath = path.join(__dirname, '..', 'assets', 'images', 'pwa_icon.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        { label: '🌊 Ouvrir SwellSync', click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
        { type: 'separator' },
        { label: 'Quitter', click: () => app.quit() }
    ]);

    tray.setToolTip('SwellSync');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => { if (mainWindow) mainWindow.show(); });
}

// ── Menu application ─────────────────────────────────────────────────────────
function createMenu() {
    const template = [
        {
            label: 'SwellSync',
            submenu: [
                { label: 'À propos', role: 'about' },
                { type: 'separator' },
                { label: 'Quitter', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
            ]
        },
        {
            label: 'Affichage',
            submenu: [
                { label: 'Actualiser', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
                { label: 'Plein écran', role: 'togglefullscreen' },
                { type: 'separator' },
                { label: 'Zoom +', role: 'zoomIn' },
                { label: 'Zoom -', role: 'zoomOut' },
                { label: 'Réinitialiser zoom', role: 'resetZoom' }
            ]
        },
        {
            label: 'Aide',
            submenu: [
                { label: 'Signaler un bug', click: () => shell.openExternal('mailto:contact@swellsync.surf') },
                { label: 'Site web', click: () => shell.openExternal('https://swellsync.onrender.com') }
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Cycle de vie Electron ────────────────────────────────────────────────────
app.whenReady().then(async () => {
    createMenu();

    // Charger les variables d'environnement depuis .env si présent
    try {
        const dotenvPath = path.join(__dirname, '..', '.env');
        require('fs').existsSync(dotenvPath) && require('dotenv').config({ path: dotenvPath });
    } catch (e) { }

    // Afficher un splash screen pendant le démarrage du serveur
    const splash = new BrowserWindow({
        width: 400, height: 300,
        frame: false,
        alwaysOnTop: true,
        backgroundColor: '#080f1a',
        icon: path.join(__dirname, '..', 'assets', 'images', 'pwa_icon.png'),
    });
    splash.loadFile(path.join(__dirname, 'splash.html'));

    // Démarrer le serveur backend
    startServer();

    try {
        await waitForServer(`http://localhost:${PORT}`);
    } catch (e) {
        dialog.showErrorBox('Erreur de démarrage', 'Le serveur SwellSync n\'a pas pu démarrer.\nVérifiez les logs.');
        app.quit();
        return;
    }

    splash.close();
    createWindow();
    createTray();
});

app.on('window-all-closed', () => {
    // Sur macOS, l'app reste dans le dock même si toutes les fenêtres sont fermées
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
    // Tuer le serveur backend proprement
    if (serverProcess) {
        serverProcess.kill('SIGTERM');
        serverProcess = null;
    }
});
