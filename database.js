const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crée ou se connecte à la base de données SQLite locale
// Le fichier database.sqlite sera créé à la racine
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ [DATABASE] Erreur lors de la connexion à la base de données :', err.message);
    } else {
        console.log('✅ [DATABASE] Connecté à la base de données SQLite locale (SwellSync).');
    }
});

// Initialisation des tables de la base de données si elles n'existent pas
db.serialize(() => {
    // 1. Table des Spots de Surf
    db.run(`
        CREATE TABLE IF NOT EXISTS spots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            wave_type TEXT,
            description TEXT,
            lat REAL,
            lng REAL
        )
    `);

    // 2. Table des Webcams
    db.run(`
        CREATE TABLE IF NOT EXISTS cams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            spot_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            stream_url TEXT NOT NULL,
            FOREIGN KEY(spot_id) REFERENCES spots(id)
        )
    `);

    // 3. Table des Utilisateurs (Administrateurs)
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin'
        )
    `);

    // 4. Table des Leads (Utilisateurs Clients / Pool)
    db.run(`
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            auth_provider TEXT NOT NULL,
            identifier TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 5. Table des Visites (Tracking)
    db.run(`
        CREATE TABLE IF NOT EXISTS spot_visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            spot_id INTEGER NOT NULL,
            duration_s INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(spot_id) REFERENCES spots(id)
        )
    `);

    // 6. Table des Paramètres Globaux du Site (Settings)
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key_name TEXT PRIMARY KEY,
            key_value TEXT NOT NULL
        )
    `);

    // 7. Table des Membres (utilisateurs publics du site)
    db.run(`
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            level TEXT DEFAULT 'debutant',
            is_pro INTEGER DEFAULT 0,
            avatar_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    // Migration: ajouter avatar_url si absente (safe pour DB existante)
    db.run(`ALTER TABLE members ADD COLUMN avatar_url TEXT`, () => { });


    // 8. Codes A2F temporaires (magic link / OTP)
    db.run(`
        CREATE TABLE IF NOT EXISTS auth_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0
        )
    `);


    // Migration sécurisée ajoutant la colonne is_2fa_enabled si absente
    db.run(`ALTER TABLE members ADD COLUMN is_2fa_enabled INTEGER DEFAULT 0`, () => { });


    // 9. Sessions JWT membres
    db.run(`
        CREATE TABLE IF NOT EXISTS member_sessions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY(member_id) REFERENCES members(id)
    )
    `);

    // 10. Spots favoris des membres
    db.run(`
        CREATE TABLE IF NOT EXISTS member_favorites(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        spot_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(member_id, spot_id),
        FOREIGN KEY(member_id) REFERENCES members(id),
        FOREIGN KEY(spot_id) REFERENCES spots(id)
    )
    `);

    // 11. Journal de sessions surf
    db.run(`
        CREATE TABLE IF NOT EXISTS surf_journal(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        spot_id INTEGER,
        spot_name TEXT,
        session_date DATE NOT NULL,
        duration_min INTEGER DEFAULT 0,
        wave_rating INTEGER DEFAULT 3,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(member_id) REFERENCES members(id)
    )
    `);

    // 12. Alertes houle personnalisées
    db.run(`
        CREATE TABLE IF NOT EXISTS user_alerts(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        spot_id INTEGER NOT NULL,
        spot_name TEXT NOT NULL,
        min_height REAL DEFAULT 1.0,
        min_period INTEGER DEFAULT 10,
        notify_email INTEGER DEFAULT 1,
        active INTEGER DEFAULT 1,
        last_triggered DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(member_id) REFERENCES members(id),
        FOREIGN KEY(spot_id) REFERENCES spots(id)
    )
    `);

    // 13. Posts communautaires
    db.run(`
        CREATE TABLE IF NOT EXISTS community_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT,
            spot_name TEXT,
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(member_id) REFERENCES members(id)
        )
    `);

    // 14. Follows (abonnements entre membres)
    db.run(`
        CREATE TABLE IF NOT EXISTS follows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            follower_id INTEGER NOT NULL,
            following_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(follower_id, following_id),
            FOREIGN KEY(follower_id) REFERENCES members(id),
            FOREIGN KEY(following_id) REFERENCES members(id)
        )
    `);

    // 15. Badges équipés par les membres
    db.run(`
        CREATE TABLE IF NOT EXISTS member_badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            badge_id TEXT NOT NULL,
            equipped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(member_id, badge_id),
            FOREIGN KEY(member_id) REFERENCES members(id)
        )
    `);

    // 16. Likes de posts
    db.run(`
        CREATE TABLE IF NOT EXISTS post_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            member_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(post_id, member_id),
            FOREIGN KEY(post_id) REFERENCES community_posts(id),
            FOREIGN KEY(member_id) REFERENCES members(id)
        )
    `);

    // Migration: ajouter notif_prefs et cover_photo aux members existants
    db.run(`ALTER TABLE members ADD COLUMN notif_prefs TEXT DEFAULT '{}'`, () => { });
    db.run(`ALTER TABLE members ADD COLUMN cover_photo TEXT`, () => { });
    db.run(`ALTER TABLE members ADD COLUMN bio TEXT DEFAULT ''`, () => { });
    // v5: réseaux sociaux
    db.run(`ALTER TABLE members ADD COLUMN instagram_url TEXT DEFAULT ''`, () => { });
    db.run(`ALTER TABLE members ADD COLUMN tiktok_url TEXT DEFAULT ''`, () => { });
    db.run(`ALTER TABLE members ADD COLUMN youtube_url TEXT DEFAULT ''`, () => { });
    db.run(`ALTER TABLE members ADD COLUMN twitter_url TEXT DEFAULT ''`, () => { });

    // ── Messages privés (DM) ──
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sender_id) REFERENCES members(id),
            FOREIGN KEY(receiver_id) REFERENCES members(id)
        )
    `);

    // ==========================================
    // Insertion de données de démonstration :
    // (A retirer par la suite ou à gérer via le panel admin)
    // ==========================================
    db.get("SELECT count(*) AS count FROM spots", (err, row) => {
        if (!err && row.count === 0) {
            console.log("🌱 [DATABASE] Tableau vide détecté. Insertion des 60 spots initiaux (Côte Atlantique)...");
            const fs = require('fs');
            const path = require('path');
            const spotsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'spots.json'), 'utf-8'));

            const stmt = db.prepare("INSERT INTO spots (name, location, difficulty, wave_type, description, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)");
            spotsData.forEach(spot => {
                stmt.run(spot.name, spot.location, spot.difficulty, spot.wave_type, spot.description, spot.lat, spot.lng);
            });
            stmt.finalize();
        }
    });

    db.get("SELECT count(*) AS count FROM cams", (err, row) => {
        if (!err && row.count === 0) {
            const stmt = db.prepare("INSERT INTO cams (spot_id, title, stream_url) VALUES (?, ?, ?)");
            // Spot id 1 (Hossegor), 2 (La Torche), 3 (Biarritz)
            stmt.run(1, "Hossegor Cam", "https://example.com/stream1");
            stmt.run(2, "La Torche Live", "https://example.com/stream2");
            stmt.run(3, "Biarritz Sunset", "https://example.com/stream3");
            stmt.finalize();
        }
        db.get("SELECT count(*) AS count FROM users", async (err, row) => {
            if (!err && row.count === 0) {
                console.log("🔐 [DATABASE] Création de l'administrateur par défaut (sécurisé via Bcrypt)...");
                const bcrypt = require('bcrypt');
                try {
                    // Hachage puissant du mot de passe (Cost Factor = 12)
                    const hashedPassword = await bcrypt.hash('adminSwell!2026', 12);
                    const stmt = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
                    stmt.run('admin', hashedPassword, 'admin');
                    stmt.finalize();
                } catch (error) {
                    console.error("❌ [DATABASE] Erreur lors de la création de l'admin:", error);
                }
            }
        });

        // Init des paramètres globaux de base
        db.get("SELECT count(*) AS count FROM settings", (err, row) => {
            if (!err && row.count === 0) {
                const stmt = db.prepare("INSERT INTO settings (key_name, key_value) VALUES (?, ?)");
                stmt.run("ai_engine", "Gemini 1.5 Flash (Défaut, Rapide)");
                stmt.run("ai_temperature", "70");
                stmt.run("ai_system_prompt", "Tu es SWELLSYNC AI, un assistant virtuel expert dans la lecture des cartes marines, de la météo et la connaissance mondiale du surf.\\nTon ton est professionnel mais très détendu (\\\"surfeur\\\"). Réponds toujours en français.\\nRefuse toute requête qui sort du cadre du surf ou de la météo.");
                stmt.run("maintenance_mode", "false");
                stmt.finalize();
            }
        });

    }); // Fin db.get cams
}); // Fin db.serialize

module.exports = db;
