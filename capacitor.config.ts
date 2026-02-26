import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'fr.swellsync.app',
    appName: 'SwellSync',
    webDir: 'www',
    server: {
        // L'app charge directement depuis le serveur Render
        url: 'https://swellsync-fr-app.onrender.com/pages/home.html',
        cleartext: false,
    },
    android: {
        backgroundColor: '#080f1a',
        allowMixedContent: false,
    },
    ios: {
        backgroundColor: '#080f1a',
        contentInset: 'always',
        preferredContentMode: 'mobile',
        scheme: 'SwellSync',
    },
};

export default config;
