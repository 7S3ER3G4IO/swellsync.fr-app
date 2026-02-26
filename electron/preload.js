// SwellSync — Preload script
// Expose safe APIs to the renderer process

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('swellsync', {
    platform: process.platform,
    isElectron: true,
    version: require('./package.json').version,
});
