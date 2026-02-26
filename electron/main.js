const { app, BrowserWindow, shell, Menu, nativeImage } = require('electron');
const path = require('path');

// ── Configuration ──
const APP_URL = 'https://swellsync-fr-app.onrender.com/pages/home.html';
const WINDOW_WIDTH = 420;
const WINDOW_HEIGHT = 780;

let mainWindow;

function createWindow() {
    // Icon
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
            enableRemoteModule: false,
        },
        show: false,
    });

    mainWindow.loadURL(APP_URL);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://') || url.startsWith('http://')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.includes('swellsync') || url.includes('localhost')) return;
        event.preventDefault();
        shell.openExternal(url);
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Menu macOS simplifié ──
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
            { label: 'Recharger', accelerator: 'CmdOrCtrl+R', click: () => mainWindow && mainWindow.reload() },
            { type: 'separator' },
            { label: 'Zoom avant', accelerator: 'CmdOrCtrl+=', role: 'zoomIn' },
            { label: 'Zoom arrière', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
            { label: 'Taille réelle', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' }
        ]
    }
];

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

app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, url) => {
        if (!url.startsWith('https://') && !url.startsWith('http://')) {
            event.preventDefault();
        }
    });
});
