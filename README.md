# 🌊 SwellSync — Prévisions Surf en Temps Réel

![SwellSync](assets/images/swellsync_logo.png)

**SwellSync** est une Progressive Web App (PWA) de prévisions surf en temps réel pour la côte Atlantique française. Développée avec ❤️ par **Max Loviat**.

## ✨ Fonctionnalités

- 🏄 **60+ spots** de surf sur la côte Atlantique
- 📊 **Prévisions 7-16 jours** via StormGlass API
- 🗺️ **Carte interactive** avec conditions live
- 💬 **Messagerie privée** entre surfeurs
- 👥 **Communauté** avec posts, likes, follows
- 🏅 **Badges** de surfeur avec icônes IA
- 🔔 **Alertes houle** personnalisables
- 📱 **PWA** installable (iOS, Android, Desktop)
- 🌗 **Mode sombre/clair**
- 💰 **Abonnement Pro** via Stripe

## 🚀 Installation locale

```bash
git clone https://github.com/7S3ER3G4IO/swellsync.fr-app.git
cd swellsync.fr-app
npm install
cp .env.example .env  # Remplir les clés API
npm start
```

## 🔧 Variables d'environnement

| Variable | Description |
|---|---|
| `STORMGLASS_KEY` | Clé API StormGlass (500 req/jour) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (optionnel) |
| `JWT_SECRET` | Secret pour les tokens JWT |
| `PORT` | Port du serveur (défaut: 3000) |

## 📦 Stack technique

- **Backend** : Node.js + Express
- **Base de données** : SQLite3
- **Frontend** : HTML5 + TailwindCSS + Vanilla JS
- **API Météo** : StormGlass (avec cache intelligent 4h)
- **Paiements** : Stripe Checkout
- **Ads** : Google AdSense (CPC/CPM)

## 🌐 Déploiement Render

1. Créer un **Web Service** (pas un site statique)
2. Build Command : `npm install`
3. Start Command : `node server.js`
4. Variables d'environnement : voir `.env.example`
5. Plan : Free (suffisant pour démarrer)

## 📂 Structure

```
├── server.js          # Serveur Express principal
├── database.js        # SQLite + migrations
├── services/
│   └── stormglass.js  # API météo + cache intelligent
├── pages/             # Toutes les pages HTML
│   ├── js/            # Scripts JS partagés
│   ├── home.html      # Page d'accueil
│   ├── map.html       # Carte des spots
│   ├── community.html # Communauté
│   ├── messages.html  # Messagerie DM
│   └── ...
├── assets/            # Images, icônes
├── manifest.json      # PWA manifest
└── sw.js              # Service Worker
```

## 📄 Licence

© 2026 SwellSync — Max Loviat. Tous droits réservés.
