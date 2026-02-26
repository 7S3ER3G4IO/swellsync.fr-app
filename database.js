/**
 * SwellSync — Database Layer (PostgreSQL)
 * 
 * Wrapper qui expose la même API que sqlite3 (db.run, db.get, db.all)
 * pour une migration transparente depuis SQLite.
 * 
 * Connexion via DATABASE_URL (ex: postgresql://user:pass@host:5432/dbname)
 */
const { Pool } = require('pg');
const path = require('path');

// ── Connexion PostgreSQL ──
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com')
        ? { rejectUnauthorized: false }
        : false
});

pool.on('connect', () => {
    console.log('✅ [DATABASE] Connecté à PostgreSQL.');
});
pool.on('error', (err) => {
    console.error('❌ [DATABASE] Erreur PostgreSQL :', err.message);
});

// ══════════════════════════════════════════
// Wrapper SQLite-compatible (db.run, db.get, db.all)
// Convertit automatiquement les ? en $1, $2, ...
// ══════════════════════════════════════════

function convertPlaceholders(sql) {
    let idx = 0;
    return sql.replace(/\?/g, () => `$${++idx}`);
}

const db = {
    /**
     * db.run(sql, [params], callback)
     * callback(err) — avec this.lastID pour INSERT
     */
    run(sql, params, callback) {
        // Handle overloaded signatures
        if (typeof params === 'function') { callback = params; params = []; }
        if (!callback) callback = () => { };
        if (!params) params = [];

        const pgSql = convertPlaceholders(sql) + (sql.trim().toUpperCase().startsWith('INSERT') && !sql.includes('RETURNING') ? ' RETURNING id' : '');

        pool.query(pgSql, params)
            .then(result => {
                const context = { lastID: result.rows?.[0]?.id || null, changes: result.rowCount };
                callback.call(context, null);
            })
            .catch(err => {
                // Ignore "column already exists" errors (ALTER TABLE ADD COLUMN migrations)
                if (err.code === '42701') { callback.call({}, null); return; }
                // Ignore "duplicate key" for INSERT OR IGNORE
                if (err.code === '23505' && sql.includes('OR IGNORE')) { callback.call({}, null); return; }
                callback.call({}, err);
            });
    },

    /**
     * db.get(sql, [params], callback)
     * callback(err, row)
     */
    get(sql, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        if (!callback) callback = () => { };
        if (!params) params = [];

        pool.query(convertPlaceholders(sql), params)
            .then(result => callback(null, result.rows[0] || null))
            .catch(err => callback(err, null));
    },

    /**
     * db.all(sql, [params], callback)
     * callback(err, rows)
     */
    all(sql, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        if (!callback) callback = () => { };
        if (!params) params = [];

        pool.query(convertPlaceholders(sql), params)
            .then(result => callback(null, result.rows || []))
            .catch(err => callback(err, []));
    },

    /**
     * db.serialize(fn) — Execute fn immediately (no-op, PG handles this)
     */
    serialize(fn) { fn(); },

    /**
     * db.prepare(sql) — Simulated prepared statement
     */
    prepare(sql) {
        const pgSql = convertPlaceholders(sql) + (sql.trim().toUpperCase().startsWith('INSERT') && !sql.includes('RETURNING') ? ' RETURNING id' : '');
        const paramCount = (sql.match(/\?/g) || []).length;
        return {
            run(...args) {
                const params = args.slice(0, paramCount);
                const cb = typeof args[paramCount] === 'function' ? args[paramCount] : () => { };
                pool.query(pgSql, params)
                    .then(result => cb.call({ lastID: result.rows?.[0]?.id || null }, null))
                    .catch(err => cb.call({}, err));
            },
            finalize(cb) { if (cb) cb(); }
        };
    },

    // Direct pool access for advanced queries
    pool
};

// ══════════════════════════════════════════
// Schema initialization (PostgreSQL syntax)
// ══════════════════════════════════════════

async function initDatabase() {
    const client = await pool.connect();
    try {
        // Create all tables
        await client.query(`
            CREATE TABLE IF NOT EXISTS spots (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                location TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                wave_type TEXT,
                description TEXT,
                lat REAL,
                lng REAL
            );

            CREATE TABLE IF NOT EXISTS cams (
                id SERIAL PRIMARY KEY,
                spot_id INTEGER NOT NULL REFERENCES spots(id),
                title TEXT NOT NULL,
                stream_url TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'admin'
            );

            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                auth_provider TEXT NOT NULL,
                identifier TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS spot_visits (
                id SERIAL PRIMARY KEY,
                spot_id INTEGER NOT NULL REFERENCES spots(id),
                duration_s INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS settings (
                key_name TEXT PRIMARY KEY,
                key_value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS members (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT,
                level TEXT DEFAULT 'debutant',
                is_pro INTEGER DEFAULT 0,
                avatar_url TEXT,
                password_hash TEXT,
                is_2fa_enabled INTEGER DEFAULT 0,
                photo TEXT,
                region TEXT,
                notif_prefs TEXT DEFAULT '{}',
                cover_photo TEXT,
                bio TEXT DEFAULT '',
                instagram_url TEXT DEFAULT '',
                tiktok_url TEXT DEFAULT '',
                youtube_url TEXT DEFAULT '',
                twitter_url TEXT DEFAULT '',
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS auth_codes (
                id SERIAL PRIMARY KEY,
                email TEXT NOT NULL,
                code TEXT NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                used INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS member_sessions (
                id SERIAL PRIMARY KEY,
                member_id INTEGER NOT NULL REFERENCES members(id),
                token_hash TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMPTZ NOT NULL
            );

            CREATE TABLE IF NOT EXISTS member_favorites (
                id SERIAL PRIMARY KEY,
                member_id INTEGER NOT NULL REFERENCES members(id),
                spot_id INTEGER NOT NULL REFERENCES spots(id),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(member_id, spot_id)
            );

            CREATE TABLE IF NOT EXISTS surf_journal (
                id SERIAL PRIMARY KEY,
                member_id INTEGER NOT NULL REFERENCES members(id),
                spot_id INTEGER,
                spot_name TEXT,
                session_date DATE NOT NULL,
                duration_min INTEGER DEFAULT 0,
                wave_rating INTEGER DEFAULT 3,
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_alerts (
                id SERIAL PRIMARY KEY,
                member_id INTEGER NOT NULL REFERENCES members(id),
                spot_id INTEGER NOT NULL REFERENCES spots(id),
                spot_name TEXT NOT NULL,
                min_height REAL DEFAULT 1.0,
                min_period INTEGER DEFAULT 10,
                notify_email INTEGER DEFAULT 1,
                active INTEGER DEFAULT 1,
                last_triggered TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS community_posts (
                id SERIAL PRIMARY KEY,
                member_id INTEGER NOT NULL REFERENCES members(id),
                content TEXT NOT NULL,
                image_url TEXT,
                spot_name TEXT,
                likes INTEGER DEFAULT 0,
                comments INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS follows (
                id SERIAL PRIMARY KEY,
                follower_id INTEGER NOT NULL REFERENCES members(id),
                following_id INTEGER NOT NULL REFERENCES members(id),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(follower_id, following_id)
            );

            CREATE TABLE IF NOT EXISTS member_badges (
                id SERIAL PRIMARY KEY,
                member_id INTEGER NOT NULL REFERENCES members(id),
                badge_id TEXT NOT NULL,
                equipped_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(member_id, badge_id)
            );

            CREATE TABLE IF NOT EXISTS post_likes (
                id SERIAL PRIMARY KEY,
                post_id INTEGER NOT NULL REFERENCES community_posts(id),
                member_id INTEGER NOT NULL REFERENCES members(id),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(post_id, member_id)
            );

            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_id INTEGER NOT NULL REFERENCES members(id),
                receiver_id INTEGER NOT NULL REFERENCES members(id),
                content TEXT NOT NULL,
                read INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS push_subscriptions (
                id SERIAL PRIMARY KEY,
                member_id INTEGER REFERENCES members(id),
                endpoint TEXT UNIQUE NOT NULL,
                keys_json TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS member_blocks (
                id SERIAL PRIMARY KEY,
                blocker_id INTEGER NOT NULL REFERENCES members(id),
                blocked_id INTEGER NOT NULL REFERENCES members(id),
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(blocker_id, blocked_id)
            );
        `);

        // Seed spots if empty
        const spotsCount = await client.query('SELECT count(*) AS count FROM spots');
        if (parseInt(spotsCount.rows[0].count) === 0) {
            console.log('🌱 [DATABASE] Tableau vide détecté. Insertion des 60 spots initiaux...');
            const fs = require('fs');
            const spotsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'spots.json'), 'utf-8'));
            for (const spot of spotsData) {
                await client.query(
                    'INSERT INTO spots (name, location, difficulty, wave_type, description, lat, lng) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [spot.name, spot.location, spot.difficulty, spot.wave_type, spot.description, spot.lat, spot.lng]
                );
            }
        }

        // Seed cams if empty
        const camsCount = await client.query('SELECT count(*) AS count FROM cams');
        if (parseInt(camsCount.rows[0].count) === 0) {
            await client.query("INSERT INTO cams (spot_id, title, stream_url) VALUES (1, 'Hossegor Cam', 'https://example.com/stream1')");
            await client.query("INSERT INTO cams (spot_id, title, stream_url) VALUES (2, 'La Torche Live', 'https://example.com/stream2')");
            await client.query("INSERT INTO cams (spot_id, title, stream_url) VALUES (3, 'Biarritz Sunset', 'https://example.com/stream3')");
        }

        // Seed admin if empty
        const usersCount = await client.query('SELECT count(*) AS count FROM users');
        if (parseInt(usersCount.rows[0].count) === 0) {
            console.log('🔐 [DATABASE] Création de l\'administrateur par défaut...');
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash('adminSwell!2026', 12);
            await client.query("INSERT INTO users (username, password, role) VALUES ($1, $2, $3)", ['admin', hashedPassword, 'admin']);
        }

        // Seed settings if empty
        const settingsCount = await client.query('SELECT count(*) AS count FROM settings');
        if (parseInt(settingsCount.rows[0].count) === 0) {
            await client.query("INSERT INTO settings (key_name, key_value) VALUES ($1, $2)", ["ai_engine", "Gemini 1.5 Flash (Défaut, Rapide)"]);
            await client.query("INSERT INTO settings (key_name, key_value) VALUES ($1, $2)", ["ai_temperature", "70"]);
            await client.query("INSERT INTO settings (key_name, key_value) VALUES ($1, $2)", ["ai_system_prompt", "Tu es SWELLSYNC AI, un assistant expert surf."]);
            await client.query("INSERT INTO settings (key_name, key_value) VALUES ($1, $2)", ["maintenance_mode", "false"]);
        }

        console.log('✅ [DATABASE] Toutes les tables initialisées avec succès.');
    } catch (err) {
        console.error('❌ [DATABASE] Erreur d\'initialisation :', err.message);
    } finally {
        client.release();
    }
}

// Initialize on load
initDatabase();

module.exports = db;
