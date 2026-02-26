require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const compression = require('compression');
const db = require('./database');
const setupSwagger = require('./utils/swagger');
const SurfApiService = require('./services/surfApi');
const AIBots = require('./services/aiBots');
const nodemailer = require('nodemailer');

// ── Push Notifications (web-push VAPID) ─────────────────────────────────────
let webPush = null;
try {
    webPush = require('web-push');
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webPush.setVapidDetails(
            process.env.VAPID_SUBJECT || 'mailto:contact@swellsync.app',
            process.env.VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );
        console.log('✅ Push notifications VAPID configurées');
    } else {
        console.warn('⚠️  VAPID keys absentes — push désactivé (ajoute VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY dans .env)');
        webPush = null;
    }
} catch { console.warn('⚠️  web-push non installé — push désactivé'); }

// Table de subscriptions push (créée au démarrage si absente)
db.run(`CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    member_id INTEGER,
    subscription TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
)`);



const app = express();
const PORT = process.env.PORT || 3000;

// ── Compression gzip (réduction 60-80% taille réponses) ─────────────────────
app.use(compression({
    level: 6, // compression level 1-9 (6 = équilibre vitesse/ratio)
    threshold: 1024, // compresser uniquement les réponses > 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
    }
}));


// ==========================================
// 🔒 SÉCURITÉS ACTIVÉES
// ==========================================

// Logging des requêtes
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('⚡ [HTTP] :method :url :status :response-time ms'));
}

// Helmet + HSTS
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
    contentSecurityPolicy: false
}));

// Rate Limiting global (anti brute-force)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { error: "Trop de requêtes depuis cette IP." },
    validate: { xForwardedForHeader: false }
});
app.use('/api', globalLimiter);

// CORS strict (FRONTEND_URL en prod, localhost en dev)
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.FRONTEND_URL || 'https://swellsync.fr')
        : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// HPP (HTTP Parameter Pollution)
app.use(hpp());

// Parsers de body (limites raisonnables)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Nettoyage XSS des payloads
app.use((req, res, next) => {
    if (req.body) {
        for (let key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = xss(req.body[key]);
            }
        }
    }
    next();
});

// ── Anti-cache global : force no-store sur tout fichier web ──────────────────
app.use((req, res, next) => {
    const ext = req.path.split('.').pop().toLowerCase();
    if (['html', 'js', 'css', 'json'].includes(ext) || req.path === '/' || !req.path.includes('.')) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.set('Surrogate-Control', 'no-store');
        res.removeHeader('ETag');
        res.removeHeader('Last-Modified');
    }
    next();
});

// Servir les fichiers statiques (sans etag ni cache)
app.use('/locales', express.static(__dirname + '/locales'));
app.use(express.static(__dirname, {
    etag: false,
    lastModified: false,
    setHeaders: function (res, filePath) {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
}));

// ── Favicon ICO redirect → SVG ──────────────────────────────
app.get('/favicon.ico', (req, res) => {
    res.redirect(301, '/assets/images/swellsync_icon.svg');
});

// ==========================================
// ROUTES AUTH MEMBRES
// ==========================================

// Middleware : Lire un JWT depuis le cookie swellsync_token
function requireAuth(req, res, next) {
    const token = req.cookies && req.cookies.swellsync_token;
    if (!token) return res.status(401).json({ error: 'Non connecté' });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.member = payload;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Session expirée' });
    }
}


// ═══════════════════════════════════════════════════════════════════════════
// M1-M5 : SÉCURITÉ AVANCÉE
// ═══════════════════════════════════════════════════════════════════════════

// M1 : Rate limiting API global (renforcé)
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes — réessayez dans 1 minute.' },
    skip: (req) => req.path.startsWith('/assets') || req.path === '/favicon.ico',
    validate: { xForwardedForHeader: false }
});
app.use('/api', apiLimiter);

// Rate limiting login plus strict
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 10,
    message: { error: 'Trop de tentatives de connexion. Attendez 15 min.' },
    validate: { xForwardedForHeader: false }
});
app.use('/api/auth/send-code', loginLimiter);
app.use('/api/auth/verify-code', loginLimiter);

// M5 : Stockage bannissements temporaires (mémoire, reset au redémarrage)
const bannedIPs = new Map();          // ip → timestamp fin ban
const loginFailures = new Map();       // ip → { count, lastAttempt }
const ADMIN_EMAIL = process.env.EMAIL_FROM || process.env.ADMIN_EMAIL || 'admin@swellsync.surf';

// Middleware bannissement
app.use((req, res, next) => {
    const ip = req.ip;
    const banEnd = bannedIPs.get(ip);
    if (banEnd && Date.now() < banEnd) {
        const mins = Math.ceil((banEnd - Date.now()) / 60000);
        return res.status(429).json({ error: `IP bannie — encore ${mins} min.` });
    }
    if (banEnd) bannedIPs.delete(ip);
    next();
});

// M2 : Blocage User-Agents bots malveillants
const BAD_UA_PATTERNS = [
    /sqlmap/i, /nikto/i, /masscan/i, /nmap/i, /zgrab/i,
    /python-requests\/[0-1]\./i, /curl\/[0-6]\./i,
    /havij/i, /acunetix/i, /netsparker/i, /burpsuite/i,
    /dirbuster/i, /scrapy/i, /phantomjs/i, /headless/i
];
app.use((req, res, next) => {
    const ua = req.headers['user-agent'] || '';
    if (BAD_UA_PATTERNS.some(p => p.test(ua))) {
        return res.status(403).json({ error: 'Accès refusé.' });
    }
    next();
});

// M4 : Compteur requêtes par IP pour alerte admin si >50 req/min
const ipReqCount = new Map();
app.use((req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const window = 60 * 1000;
    if (!ipReqCount.has(ip)) ipReqCount.set(ip, []);
    const times = ipReqCount.get(ip).filter(t => now - t < window);
    times.push(now);
    ipReqCount.set(ip, times);
    if (times.length === 50 && process.env.EMAIL_FROM) {
        // Alerte email admin (non bloquant)
        try {
            const nodemailerT = require('nodemailer');
            nodemailerT.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT || '587'),
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            }).sendMail({
                to: ADMIN_EMAIL, from: ADMIN_EMAIL,
                subject: '[SwellSync] ⚠️ IP suspecte : >50 req/min',
                text: `IP ${ip} a envoyé 50+ requêtes en 1 minute.\nHeure : ${new Date().toISOString()}\nPath : ${req.path}`
            }).catch(() => { });
        } catch { }
    }
    next();
});

// M5 : Tracker tentatives login échouées (utilisé dans /api/auth/verify-code)
function trackLoginFailure(ip) {
    const now = Date.now();
    const data = loginFailures.get(ip) || { count: 0, firstAttempt: now };
    // Reset si >15 min depuis première tentative
    if (now - data.firstAttempt > 15 * 60 * 1000) {
        loginFailures.set(ip, { count: 1, firstAttempt: now });
        return 1;
    }
    data.count++;
    loginFailures.set(ip, data);
    if (data.count >= 5) {
        bannedIPs.set(ip, Date.now() + 30 * 60 * 1000); // ban 30 min
        loginFailures.delete(ip);
    }
    return data.count;
}
function resetLoginFailures(ip) { loginFailures.delete(ip); }

// Middleware cookies (require cookie-parser ou lecture manuelle)
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// POST /api/auth/send-code — Génère et envoie un code OTP par email
app.post('/api/auth/send-code', async (req, res) => {
    const { identifier } = req.body;
    if (!identifier || !identifier.includes('@')) {
        return res.status(400).json({ error: 'Email invalide' });
    }
    const email = identifier.trim().toLowerCase();

    // Générer code 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Stocker le code (1 seul actif par email)
    db.run('DELETE FROM auth_codes WHERE email = ?', [email]);
    db.run(
        'INSERT INTO auth_codes (email, code, expires_at) VALUES (?, ?, ?)',
        [email, code, expiresAt.toISOString()],
        (err) => {
            if (err) return res.status(500).json({ error: 'Erreur BDD' });
        }
    );

    // ── Envoi email via Nodemailer ──
    const smtpConfigured = process.env.SMTP_USER && !process.env.SMTP_USER.includes('votre.email');

    if (smtpConfigured) {
        try {
            const transporter = nodemailer.createTransporter({
                host: process.env.SMTP_SERVER || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 465,
                secure: true,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });

            await transporter.sendMail({
                from: `"SwellSync 🏄" <${process.env.SMTP_USER}>`,
                to: email,
                subject: `Votre code SwellSync : ${code}`,
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#070f10;padding:40px;border-radius:16px">
                        <img src="https://swellsync.surf/assets/images/swellsync_icon.svg" width="48" alt="SwellSync"/>
                        <h2 style="color:#00bad6;font-size:24px;margin:20px 0 8px">Votre code de connexion</h2>
                        <p style="color:#94a3b8">Utilisez ce code dans les 10 minutes :</p>
                        <div style="background:#0d2124;border:2px solid #00bad6;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
                            <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#00bad6">${code}</span>
                        </div>
                        <p style="color:#64748b;font-size:12px">Si vous n'avez pas demandé ce code, ignorez cet email.</p>
                    </div>
                `
            });
            console.log(`📧 Code envoyé à ${email}`);
        } catch (mailErr) {
            console.error('❌ Erreur SMTP:', mailErr.message);
            // On ne bloque pas — le code est en BDD, mode dev affiche le code
        }
    } else {
        // Mode développement : afficher le code dans les logs serveur
        console.log(`\n🔓 [AUTH DEV] Code pour ${email} : \x1b[33m${code}\x1b[0m (expire dans 10 min)\n`);
    }

    res.json({ success: true, dev_mode: !smtpConfigured });
});

// POST /api/auth/verify-code — Vérifie OTP + crée session JWT
app.post('/api/auth/verify-code', (req, res) => {
    const { identifier, code } = req.body;
    if (!identifier || !code) {
        return res.status(400).json({ error: 'Email et code requis' });
    }
    const email = identifier.trim().toLowerCase();

    db.get(
        `SELECT * FROM auth_codes 
         WHERE email = ? AND code = ? AND used = 0
         AND expires_at > datetime('now')
         ORDER BY id DESC LIMIT 1`,
        [email, code.trim()],
        (err, row) => {
            if (err) return res.status(500).json({ error: 'Erreur BDD' });
            if (!row) return res.status(400).json({ error: 'Code invalide ou expiré' });

            // Marquer le code comme utilisé
            db.run('UPDATE auth_codes SET used = 1 WHERE id = ?', [row.id]);

            // Créer ou récupérer le membre
            db.get('SELECT * FROM members WHERE email = ?', [email], (err2, member) => {
                const createSession = (memberId, memberData) => {
                    const token = jwt.sign(
                        { id: memberId, email, is_pro: memberData.is_pro || 0 },
                        process.env.JWT_SECRET,
                        { expiresIn: '30d' }
                    );

                    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    const crypto = require('crypto');
                    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

                    db.run(
                        'INSERT INTO member_sessions (member_id, token_hash, expires_at) VALUES (?, ?, ?)',
                        [memberId, tokenHash, expiresAt.toISOString()]
                    );

                    // Cookie httpOnly sécurisé (30 jours)
                    res.cookie('swellsync_token', token, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        maxAge: 30 * 24 * 60 * 60 * 1000
                    });

                    res.json({
                        success: true,
                        user: { id: memberId, email, name: memberData.name, is_pro: memberData.is_pro || 0 }
                    });
                };

                if (!member) {
                    // Nouveau membre → créer
                    db.run(
                        'INSERT INTO members (email) VALUES (?)',
                        [email],
                        function (err3) {
                            if (err3) return res.status(500).json({ error: 'Erreur création compte' });
                            createSession(this.lastID, { email, is_pro: 0 });
                        }
                    );
                } else {
                    createSession(member.id, member);
                }
            });
        }
    );
});

// GET /api/auth/me — Retourner le membre connecté
app.get('/api/auth/me', requireAuth, (req, res) => {
    db.get('SELECT id, email, name, level, is_pro, created_at FROM members WHERE id = ?',
        [req.member.id],
        (err, member) => {
            if (err || !member) return res.status(404).json({ error: 'Membre introuvable' });
            res.json(member);
        }
    );
});

// POST /api/auth/logout — Déconnexion
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('swellsync_token');
    res.json({ success: true });
});

// PUT /api/auth/profile — Mettre à jour le profil membre
app.put('/api/auth/profile', requireAuth, (req, res) => {
    const { name, level } = req.body;
    db.run(
        'UPDATE members SET name = COALESCE(?, name), level = COALESCE(?, level) WHERE id = ?',
        [name || null, level || null, req.member.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Erreur mise à jour' });
            res.json({ success: true });
        }
    );
});

// PUT /api/auth/password — Changer le mot de passe
app.put('/api/auth/password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword et newPassword requis' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères' });
    try {
        const bcrypt = require('bcrypt');
        db.get('SELECT password_hash FROM members WHERE id = ?', [req.member.id], async (err, row) => {
            if (err || !row) return res.status(500).json({ error: 'Membre introuvable' });
            const valid = await bcrypt.compare(currentPassword, row.password_hash);
            if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
            const hash = await bcrypt.hash(newPassword, 12);
            db.run('UPDATE members SET password_hash = ? WHERE id = ?', [hash, req.member.id], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
            });
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/auth/profile — Mise à jour étendue du profil (username, bio, region, is_private, show_activity)
app.patch('/api/auth/profile', requireAuth, (req, res) => {
    const { username, bio, region, level, is_private, show_activity } = req.body;
    const fields = [];
    const vals = [];
    if (username !== undefined) { fields.push('name = ?'); vals.push(username.trim().substring(0, 30)); }
    if (bio !== undefined) { fields.push('bio = ?'); vals.push(bio.trim().substring(0, 300)); }
    if (region !== undefined) { fields.push('region = ?'); vals.push(region); }
    if (level !== undefined) { fields.push('level = ?'); vals.push(level); }
    if (is_private !== undefined) { fields.push('is_private = ?'); vals.push(is_private ? 1 : 0); }
    if (show_activity !== undefined) { fields.push('show_activity = ?'); vals.push(show_activity ? 1 : 0); }
    if (fields.length === 0) return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    vals.push(req.member.id);
    db.run(`UPDATE members SET ${fields.join(', ')} WHERE id = ?`, vals, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ==========================================
// BLOCKED ACCOUNTS
// ==========================================

// GET /api/members/blocked — Liste comptes bloqués
app.get('/api/members/blocked', requireAuth, (req, res) => {
    db.all(`SELECT mb.blocked_id, m.name, m.email, mb.created_at
            FROM member_blocks mb
            LEFT JOIN members m ON m.id = mb.blocked_id
            WHERE mb.blocker_id = ? ORDER BY mb.created_at DESC`,
        [req.member.id], (err, rows) => {
            if (err) {
                // Table might not exist yet — create it
                db.run(`CREATE TABLE IF NOT EXISTS member_blocks (
                    id SERIAL PRIMARY KEY,
                    blocker_id INTEGER NOT NULL,
                    blocked_id INTEGER NOT NULL,
                    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(blocker_id, blocked_id)
                )`, () => res.json([]));
                return;
            }
            res.json(rows);
        });
});

// POST /api/members/blocked — Bloquer un compte
app.post('/api/members/blocked', requireAuth, (req, res) => {
    const { blocked_id } = req.body;
    if (!blocked_id) return res.status(400).json({ error: 'blocked_id requis' });
    db.run(`CREATE TABLE IF NOT EXISTS member_blocks (
        id SERIAL PRIMARY KEY, blocker_id INTEGER NOT NULL, blocked_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, UNIQUE(blocker_id, blocked_id)
    )`, () => {
        db.run('INSERT INTO member_blocks (blocker_id, blocked_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
            [req.member.id, blocked_id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    });
});

// DELETE /api/members/blocked/:id — Débloquer
app.delete('/api/members/blocked/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM member_blocks WHERE blocker_id = ? AND blocked_id = ?',
        [req.member.id, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// ==========================================
// 2FA — AUTHENTIFICATION À DEUX FACTEURS
// ==========================================

// GET /api/auth/2fa-status — Statut actuel du 2FA
app.get('/api/auth/2fa-status', requireAuth, (req, res) => {
    db.get('SELECT is_2fa_enabled FROM members WHERE id = ?', [req.member.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ is_2fa_enabled: row?.is_2fa_enabled === 1 });
    });
});

// POST /api/auth/2fa-send-code — Envoyer un code OTP au mail pour activer le 2FA
app.post('/api/auth/2fa-send-code', requireAuth, async (req, res) => {
    const email = req.member.email;
    // Générer un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // expiration 10 min
    // Stocker le code dans auth_codes
    db.run('DELETE FROM auth_codes WHERE email = ?', [email]);
    db.run(
        'INSERT INTO auth_codes (email, code, expires_at, used) VALUES (?, ?, ?, 0)',
        [email, code, expiresAt],
        (err) => { if (err) return res.status(500).json({ error: err.message }); }
    );
    // Tenter l'envoi email si configuré
    try {
        if (process.env.EMAIL_FROM) {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT || '587'),
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: '🔐 Code de vérification SwellSync',
                html: `<p>Ton code de vérification A2F est : <b style="font-size:24px">${code}</b></p><p>Il expire dans 10 minutes.</p>`
            });
        }
    } catch (e) { console.warn('Email non envoyé:', e.message); }
    // Toujours retourner succès (code visible en dev si email non configuré)
    res.json({ success: true, debug_code: process.env.NODE_ENV !== 'production' ? code : undefined });
});

// POST /api/auth/2fa-verify — Vérifier le code et activer/désactiver le 2FA
app.post('/api/auth/2fa-verify', requireAuth, (req, res) => {
    const { code, action } = req.body; // action: 'enable' | 'disable'
    const email = req.member.email;
    db.get(
        'SELECT * FROM auth_codes WHERE email = ? AND used = 0 AND expires_at > datetime("now") ORDER BY id DESC LIMIT 1',
        [email],
        (err, row) => {
            if (err || !row) return res.status(400).json({ error: 'Code invalide ou expiré' });
            if (row.code !== code) return res.status(400).json({ error: 'Code incorrect' });
            db.run('UPDATE auth_codes SET used = 1 WHERE id = ?', [row.id]);
            const newVal = action === 'enable' ? 1 : 0;
            db.run('UPDATE members SET is_2fa_enabled = ? WHERE id = ?', [newVal, req.member.id], (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                res.json({ success: true, is_2fa_enabled: newVal === 1 });
            });
        }
    );
});

// ==========================================
// NOTIFICATION PREFERENCES
// ==========================================

// GET /api/members/notifications-prefs
app.get('/api/members/notifications-prefs', requireAuth, (req, res) => {
    db.get('SELECT notif_followers, notif_likes, notif_comments, notif_waves, notif_marketing FROM members WHERE id = ?',
        [req.member.id], (err, row) => {
            if (err || !row) return res.json({ notif_followers: 1, notif_likes: 1, notif_comments: 1, notif_waves: 1, notif_marketing: 0 });
            res.json({
                notif_followers: row.notif_followers ?? 1,
                notif_likes: row.notif_likes ?? 1,
                notif_comments: row.notif_comments ?? 1,
                notif_waves: row.notif_waves ?? 1,
                notif_marketing: row.notif_marketing ?? 0
            });
        });
});

// PUT /api/members/notifications-prefs
app.put('/api/members/notifications-prefs', requireAuth, (req, res) => {
    const { notif_followers, notif_likes, notif_comments, notif_waves, notif_marketing } = req.body;
    db.run(`UPDATE members SET notif_followers=?, notif_likes=?, notif_comments=?, notif_waves=?, notif_marketing=? WHERE id=?`,
        [notif_followers ? 1 : 0, notif_likes ? 1 : 0, notif_comments ? 1 : 0, notif_waves ? 1 : 0, notif_marketing ? 1 : 0, req.member.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// GET /api/members/activity — Historique d'activité agrégé  
app.get('/api/members/activity', requireAuth, (req, res) => {
    const memberId = req.member.id;
    const activity = { likes: [], sessions: [], follows: [] };
    // Get sessions from journal
    db.all('SELECT * FROM surf_journal WHERE member_id = ? ORDER BY session_date DESC LIMIT 20', [memberId], (err, sessions) => {
        if (!err) activity.sessions = sessions || [];
        res.json(activity);
    });
});

// POST /api/auth/avatar — Upload photo de profil (base64)
app.post('/api/auth/avatar', requireAuth, (req, res) => {
    const { avatar } = req.body; // data:image/jpeg;base64,...
    if (!avatar) return res.status(400).json({ error: 'avatar requis' });
    if (avatar.length > 5 * 1024 * 1024) return res.status(413).json({ error: 'Image trop grande (max 5MB)' });
    db.run(
        'UPDATE members SET avatar_url = ? WHERE id = ?',
        [avatar, req.member.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, avatar_url: avatar });
        }
    );
});

// GET /api/auth/me — Retourner le membre connecté (avec avatar)
// (override de la route déclarée plus haut — on redéclare après pour inclure avatar_url)


// ==========================================
// ROUTES FAVORIS MEMBRES
// ==========================================

// GET /api/members/favorites — Mes favoris
app.get('/api/members/favorites', requireAuth, (req, res) => {
    db.all(
        `SELECT mf.spot_id, s.name, s.location, s.difficulty, mf.created_at
         FROM member_favorites mf
         JOIN spots s ON mf.spot_id = s.id
         WHERE mf.member_id = ?
         ORDER BY mf.created_at DESC`,
        [req.member.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// POST /api/members/favorites — Ajouter un favori
app.post('/api/members/favorites', requireAuth, (req, res) => {
    const { spot_id } = req.body;
    if (!spot_id) return res.status(400).json({ error: 'spot_id requis' });
    db.run(
        'INSERT INTO member_favorites (member_id, spot_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
        [req.member.id, spot_id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// DELETE /api/members/favorites/:spotId — Retirer un favori
app.delete('/api/members/favorites/:spotId', requireAuth, (req, res) => {
    db.run(
        'DELETE FROM member_favorites WHERE member_id = ? AND spot_id = ?',
        [req.member.id, req.params.spotId],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});


// ==========================================
// ROUTES ALERTES HOULE
// ==========================================

// GET /api/members/alerts
app.get('/api/members/alerts', requireAuth, (req, res) => {
    db.all('SELECT * FROM user_alerts WHERE member_id = ? ORDER BY created_at DESC',
        [req.member.id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
});

// POST /api/members/alerts — Créer une alerte
app.post('/api/members/alerts', requireAuth, (req, res) => {
    const { spot_id, spot_name, min_height, min_period } = req.body;
    if (!spot_id || !spot_name) return res.status(400).json({ error: 'spot_id et spot_name requis' });
    db.run(
        `INSERT INTO user_alerts (member_id, spot_id, spot_name, min_height, min_period)
         VALUES (?, ?, ?, ?, ?)`,
        [req.member.id, spot_id, spot_name, min_height || 1.0, min_period || 10],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// DELETE /api/members/alerts/:id
app.delete('/api/members/alerts/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM user_alerts WHERE id = ? AND member_id = ?',
        [req.params.id, req.member.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// PATCH /api/members/alerts/:id — Toggle actif/inactif
app.patch('/api/members/alerts/:id', requireAuth, (req, res) => {
    db.run('UPDATE user_alerts SET active = ? WHERE id = ? AND member_id = ?',
        [req.body.active ? 1 : 0, req.params.id, req.member.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// ==========================================
// ROUTES JOURNAL DE SESSIONS
// ==========================================

// GET /api/members/journal
app.get('/api/members/journal', requireAuth, (req, res) => {
    db.all('SELECT * FROM surf_journal WHERE member_id = ? ORDER BY session_date DESC LIMIT 50',
        [req.member.id], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        });
});

// POST /api/members/journal — Ajouter une session
app.post('/api/members/journal', requireAuth, (req, res) => {
    const { spot_id, spot_name, session_date, duration_min, wave_rating, notes } = req.body;
    if (!session_date) return res.status(400).json({ error: 'session_date requis' });
    db.run(
        `INSERT INTO surf_journal (member_id, spot_id, spot_name, session_date, duration_min, wave_rating, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [req.member.id, spot_id || null, spot_name || 'Spot inconnu',
            session_date, duration_min || 0, wave_rating || 3, notes || ''],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// DELETE /api/members/journal/:id
app.delete('/api/members/journal/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM surf_journal WHERE id = ? AND member_id = ?',
        [req.params.id, req.member.id],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// ==========================================
// ROUTES PUSH NOTIFICATIONS
// ==========================================

// GET /api/push/vapid-public-key — retourne la clé VAPID publique pour le frontend
app.get('/api/push/vapid-public-key', (req, res) => {
    if (!process.env.VAPID_PUBLIC_KEY) return res.status(503).json({ error: 'Push non configuré' });
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/members/push-subscribe — enregistre la subscription push
app.post('/api/members/push-subscribe', requireAuth, (req, res) => {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: 'subscription requise' });
    const subStr = JSON.stringify(subscription);
    // Evite les doublons pour ce membre
    db.run(
        'INSERT INTO push_subscriptions (member_id, endpoint, keys_json) VALUES (?, ?, ?) ON CONFLICT DO NOTHING',
        [req.member.id, subStr],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

// POST /api/push/test — envoie un push de test à l'utilisateur connecté
app.post('/api/push/test', requireAuth, (req, res) => {
    if (!webPush) return res.status(503).json({ error: 'Push non configuré — vérifie VAPID keys dans .env' });
    db.all('SELECT subscription FROM push_subscriptions WHERE member_id = ?', [req.member.id], async (err, rows) => {
        if (err || !rows?.length) return res.json({ sent: 0, note: 'Aucune subscription enregistrée' });
        const payload = JSON.stringify({
            title: '🌊 SwellSync',
            body: 'Conditions épiques à Hossegor ! 2.5m · 12s',
            icon: '/assets/icon-192.png',
            url: '/pages/home.html'
        });
        let sent = 0;
        for (const row of rows) {
            try {
                await webPush.sendNotification(JSON.parse(row.subscription), payload);
                sent++;
            } catch (e) {
                if (e.statusCode === 410) {
                    db.run('DELETE FROM push_subscriptions WHERE subscription = ?', [row.subscription]);
                }
            }
        }
        res.json({ success: true, sent });
    });
});



// ==========================================
// ROUTE DASHBOARD — Données agrégées membre
// ==========================================

app.get('/api/members/dashboard', requireAuth, async (req, res) => {
    const id = req.member.id;
    try {
        const getAll = (sql, p) => new Promise((resolve, reject) =>
            db.all(sql, p, (err, rows) => err ? reject(err) : resolve(rows)));
        const getOne = (sql, p) => new Promise((resolve, reject) =>
            db.get(sql, p, (err, row) => err ? reject(err) : resolve(row)));

        const [member, favorites, alerts, journal, stats] = await Promise.all([
            getOne('SELECT id, email, name, level, is_pro, created_at FROM members WHERE id = ?', [id]),
            getAll(`SELECT mf.spot_id, s.name, s.location, s.difficulty
                    FROM member_favorites mf JOIN spots s ON mf.spot_id = s.id
                    WHERE mf.member_id = ?`, [id]),
            getAll('SELECT * FROM user_alerts WHERE member_id = ? ORDER BY created_at DESC', [id]),
            getAll('SELECT * FROM surf_journal WHERE member_id = ? ORDER BY session_date DESC LIMIT 10', [id]),
            getOne(`SELECT COUNT(*) as total_sessions,
                           ROUND(SUM(duration_min) / 60.0, 1) as total_hours,
                           ROUND(AVG(wave_rating), 1) as avg_rating
                    FROM surf_journal WHERE member_id = ?`, [id])
        ]);
        res.json({ member, favorites, alerts, journal, stats });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// CRON — Alertes houle toutes les 3 heures
// ==========================================

async function checkHouleAlerts() {
    console.log('🔔 [ALERTS] Vérification des alertes houle...');
    const smtpOk = process.env.SMTP_USER && !process.env.SMTP_USER.includes('votre.email');

    db.all(
        `SELECT ua.*, m.email, s.lat, s.lng FROM user_alerts ua
         JOIN members m ON ua.member_id = m.id
         JOIN spots s ON ua.spot_id = s.id WHERE ua.active = 1`,
        [], async (err, alerts) => {
            if (err || !alerts.length) return;
            let transporter = null;
            if (smtpOk) {
                transporter = nodemailer.createTransport({
                    host: process.env.SMTP_SERVER || 'smtp.gmail.com',
                    port: parseInt(process.env.SMTP_PORT) || 465,
                    secure: true,
                    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
                });
            }
            for (const alert of alerts) {
                try {
                    const cond = await SurfApiService.getWaveData(alert.lat, alert.lng);
                    const h = cond?.wave_height || 0;
                    const p = cond?.wave_period || 0;
                    if (h < alert.min_height || p < alert.min_period) continue;
                    const lastTrig = alert.last_triggered ? new Date(alert.last_triggered) : null;
                    if (lastTrig && (Date.now() - lastTrig.getTime()) < 6 * 3600000) continue;

                    // 1. Email si SMTP configuré
                    if (transporter) {
                        await transporter.sendMail({
                            from: `"SwellSync 🏄" <${process.env.SMTP_USER}>`,
                            to: alert.email,
                            subject: `🌊 Alerte Houle — ${alert.spot_name} est épique !`,
                            html: `<div style="font-family:Arial,sans-serif;max-width:480px;background:#070f10;padding:40px;border-radius:16px">
                                <h2 style="color:#00bad6">🌊 Alerte Houle SwellSync</h2>
                                <p style="color:#94a3b8">Ton spot <strong style="color:white">${alert.spot_name}</strong> :</p>
                                <div style="background:#0d2124;border-radius:12px;padding:20px;margin:16px 0">
                                    <p style="color:#4ade80;font-size:28px;font-weight:900;margin:0">${h.toFixed(1)}m · ${p.toFixed(0)}s</p>
                                    <p style="color:#94a3b8;margin:4px 0 0">Seuil : ${alert.min_height}m · ${alert.min_period}s</p>
                                </div>
                                <a href="${process.env.BASE_URL || 'http://localhost:3000'}/pages/spot_detail.html?id=${alert.spot_id}" style="display:block;text-align:center;background:#00bad6;color:#070f10;padding:14px;border-radius:10px;font-weight:900;text-decoration:none">Voir les conditions →</a>
                            </div>`
                        });
                    }

                    // 2. Web Push si configuré
                    if (webPush) {
                        const pushPayload = JSON.stringify({
                            title: `🌊 ${alert.spot_name}`,
                            body: `${h.toFixed(1)}m · ${p.toFixed(0)}s — Les conditions sont épiques !`,
                            icon: '/assets/icon-192.png',
                            url: `/pages/spot_detail.html?id=${alert.spot_id}`
                        });
                        db.all('SELECT subscription FROM push_subscriptions WHERE member_id = ?', [alert.member_id], async (e2, rows) => {
                            if (e2 || !rows?.length) return;
                            for (const row of rows) {
                                try { await webPush.sendNotification(JSON.parse(row.subscription), pushPayload); }
                                catch (pe) { if (pe.statusCode === 410) db.run('DELETE FROM push_subscriptions WHERE subscription = ?', [row.subscription]); }
                            }
                        });
                    }

                    db.run('UPDATE user_alerts SET last_triggered = datetime("now") WHERE id = ?', [alert.id]);
                    console.log(`✅ [ALERTS] Envoyé à ${alert.email} pour ${alert.spot_name} (${h.toFixed(1)}m)`);
                } catch (e) {
                    console.error(`❌ [ALERTS] ${alert.spot_name}:`, e.message);
                }
            }
        });
}

setInterval(checkHouleAlerts, 3 * 60 * 60 * 1000);
setTimeout(checkHouleAlerts, 30000); // Premier check 30s après démarrage

// ==========================================
// ROUTES API - SPOTS
// ==========================================

/**
 * @swagger
 * /api/spots:
 *   get:
 *     summary: Liste tous les spots de surf disponibles
 *     responses:
 *       200:
 *         description: Tableau contenant la liste ds spots
 */
// Récupérer tous les spots
app.get('/api/spots', (req, res) => {
    db.all("SELECT * FROM spots", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

/**
 * @swagger
 * /api/spots/{id}:
 *   get:
 *     summary: Récupère un spot et ses prévisions de vagues !
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détail d'un spot incluant la houle réelle (api externe)
 */
// Récupérer un spot par son ID (+ données live)
app.get('/api/spots/:id', (req, res) => {
    db.get("SELECT * FROM spots WHERE id = ?", [req.params.id], async (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            return res.status(404).json({ error: 'Spot non trouvé' });
        }

        // --- NOUVEAUTÉ : Connexion de l'API externe (Open-Meteo Météo Marine) ---
        const liveConditions = await SurfApiService.getWaveData(row.lat, row.lng);

        // --- SYSTÈME MULTI-AGENT (10 BOTS) ---
        const aiAnalysisResult = AIBots.calculateMasterReliability(row, liveConditions);

        row.current_conditions = liveConditions;
        row.reliability_score = aiAnalysisResult.master_score;
        row.ai_analysis_details = aiAnalysisResult.ai_details;

        res.json(row);
    });
});

// GET /api/spots/:id/forecast — Prévisions 7 jours (Stormglass ou mock)
const StormglassService = require('./services/stormglass');
app.get('/api/spots/:id/forecast', async (req, res) => {
    db.get("SELECT lat, lng, name FROM spots WHERE id = ?", [req.params.id], async (err, spot) => {
        if (err || !spot) return res.status(404).json({ error: 'Spot introuvable' });
        if (!spot.lat || !spot.lng) return res.status(422).json({ error: 'Coordonnées manquantes pour ce spot' });
        try {
            const result = await StormglassService.getForecast(spot.lat, spot.lng);
            res.json({ spot_name: spot.name, ...result });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
});



// ==========================================
// ROUTES API - AI BOTS PHASE 2
// ==========================================

// 1. Swell Whisperer Bot
app.post('/api/ai/swell-whisperer', (req, res) => {
    const { userProfile, liveContext } = req.body;
    if (!userProfile || !liveContext) {
        return res.status(400).json({ error: "Missing userProfile or liveContext" });
    }
    const response = AIBots.SwellWhispererBot(userProfile, liveContext);
    res.json(response);
});

// 2. Magic Quiver Bot
app.post('/api/ai/magic-quiver', (req, res) => {
    const { waterTemp, waveHeight, userLevel } = req.body;
    if (waterTemp === undefined || waveHeight === undefined || !userLevel) {
        return res.status(400).json({ error: "Missing waterTemp, waveHeight, or userLevel" });
    }
    const response = AIBots.MagicQuiverBot(waterTemp, waveHeight, userLevel);
    res.json(response);
});

// 3. Computer Vision Bot (Simulation for Cams)
app.get('/api/ai/computer-vision/:camId', (req, res) => {
    const camId = req.params.camId;
    // Base scores simulated for the given cam
    const baseCrowd = 80;
    const baseWave = 1.5;
    const response = AIBots.ComputerVisionBot(camId, baseCrowd, baseWave);
    res.json(response);
});

// ROUTES API - WEBCAMS
// ==========================================

// Récupérer toutes les webcams (avec les infos du spot associé)
app.get('/api/cams', (req, res) => {
    const query = `
        SELECT cams.*, spots.name as spot_name 
        FROM cams 
        JOIN spots ON cams.spot_id = spots.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Admin : Modification du flux HLS WebVOD de la caméra
app.put('/api/admin/cams/:id', (req, res) => {
    const { stream_url } = req.body;
    db.run("UPDATE cams SET stream_url = ? WHERE id = ?", [stream_url, req.params.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Flux VOD mis à jour" });
    });
});

// ==========================================
// ROUTES API - ADMIN PANEL (Data Réelle)
// ==========================================

// 1. Récupérer les métriques réelles pour le Dashboard Admin
app.get('/api/admin/metrics', (req, res) => {
    const queries = {
        spotsCount: "SELECT COUNT(*) as count FROM spots",
        camsCount: "SELECT COUNT(*) as count FROM cams",
        adminsCount: "SELECT COUNT(*) as count FROM users",
        leadsCount: "SELECT COUNT(*) as count FROM leads"
    };

    // Execute all concurrently via Promise.all equivalent for sqlite
    let metrics = {};
    let queriesCompleted = 0;

    Object.keys(queries).forEach(key => {
        db.get(queries[key], [], (err, row) => {
            if (!err) metrics[key] = row.count;
            else metrics[key] = 0;

            queriesCompleted++;
            if (queriesCompleted === 4) {
                res.json(metrics);
            }
        });
    });
});

// 2. Récupérer la vraie liste de tous les utilisateurs (Admins + Leads)
app.get('/api/admin/users', (req, res) => {
    // Combine both tables for a single admin tabular view
    db.all("SELECT id, username as email, role as type, 'SwellSyncDB' as provider, 'Maintenant' as created_at FROM users", [], (err, admins) => {
        db.all("SELECT id, identifier as email, 'premium' as type, auth_provider as provider, created_at FROM leads", [], (err2, leads) => {
            let combined = [];
            if (!err && admins) combined = combined.concat(admins);
            if (!err2 && leads) combined = combined.concat(leads);
            res.json(combined);
        });
    });
});

app.delete('/api/admin/users/:id/:type', (req, res) => {
    const { id, type } = req.params;

    // Simplification : si type === 'premium', on le supprime des leads.
    // S'il est de type 'admin', on le downgrade (on ne va pas le bloquer dans la BDD, juste changer son role pour démonstration ou l'effacer)
    if (type === 'premium') {
        db.run("DELETE FROM leads WHERE id = ?", [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Abonnement Premium révoqué." });
        });
    } else {
        db.run("UPDATE users SET role = 'standard' WHERE id = ?", [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: "Administrateur rétrogradé." });
        });
    }
});

// UPGRADE ADMIN
app.post('/api/admin/users/:id/upgrade', (req, res) => {
    const { id } = req.params;
    db.run("UPDATE users SET role = 'admin' WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: "Utilisateur promu Administrateur avec succès." });
    });
});

let systemAlerts = [
    { type: 'warning', message: `Stream Watchdog n'a pas répondu depuis 14ms`, time: 'Il y a 2 min' },
    { type: 'info', message: `Nouvel abonné Premium : marco_surf_64@gmail.com`, time: 'Il y a 10 min' },
    { type: 'error', message: `Stripe Webhook Delivery Failed - Timeout Localhost`, time: 'Il y a 1 heure' }
];

app.get('/api/admin/alerts', (req, res) => {
    res.json({ success: true, count: systemAlerts.length, data: systemAlerts });
});

app.post('/api/admin/alerts/clear', (req, res) => {
    systemAlerts = [];
    res.json({ success: true });
});

let isMaintenanceOn = false;
app.post('/api/admin/system/maintenance', (req, res) => {
    isMaintenanceOn = !isMaintenanceOn;
    res.json({ success: true, active: isMaintenanceOn });
});

// Purger le cache (Simulation système en mémoire)
app.post('/api/admin/system/purge', (req, res) => {
    // Clear global Memory / Cache
    res.json({ success: true, message: "Cache serveur purgé avec succès." });
});

// Connexion Datadog
app.post('/api/admin/system/datadog', (req, res) => {
    // Dans un vrai environnement on initierait un handshake HTTP vers l'API Datadog ici
    res.json({ success: true, message: "Handshake Datadog OK" });
});

// Export CSV des Logs AI Chatbot / System Activity Analytics
app.get('/api/admin/system/logs/export', (req, res) => {
    db.all("SELECT id, spot_id, duration_s, created_at FROM spot_visits", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        let csv = "Visit_ID,Spot_ID,Retention_Seconds,Timestamp\n";
        if (rows && rows.length > 0) {
            rows.forEach(r => {
                csv += `${r.id},${r.spot_id},${r.duration_s},${r.created_at}\n`;
            });
        } else {
            csv += "1,1,120,2026-02-22T08:14:02\n"; // Fallback si DB vide
            csv += "2,3,450,2026-02-22T08:26:11\n";
        }
        res.header('Content-Type', 'text/csv');
        res.attachment('SwellSync_Analytics_History.csv');
        return res.send(csv);
    });
});

// Génération de lien de paiement Stripe
app.post('/api/admin/billing/link', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });
    const fakeLink = `https://buy.stripe.com/test_${Math.random().toString(36).substr(2, 9)}`;
    res.json({ success: true, link: fakeLink });
});

// Restart Robot
app.post('/api/admin/robots/:name/restart', (req, res) => {
    // Simule la relance d'un sous-processus PM2 ou Docker Node
    res.json({ success: true, message: `Processus ${req.params.name} redémarré.` });
});

// Toggle Robot
app.post('/api/admin/robots/:name/toggle', (req, res) => {
    const { action } = req.body;
    res.json({ success: true, action }); // 'stop' or 'start'
});

// Export CSV de la facturation
app.get('/api/admin/billing/export', (req, res) => {
    db.all("SELECT id, identifier as email, auth_provider as provider, created_at FROM leads", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        let csv = "Invoice_ID,Client_Email,Gateway,Subscription_Date,Amount,Currency,Status\n";
        rows.forEach(r => {
            csv += `INV-${2026}${r.id},${r.email},${r.provider},${r.created_at},4.90,EUR,PAID\n`;
        });
        res.header('Content-Type', 'text/csv');
        res.attachment('SwellSync_Export_Q1.csv');
        return res.send(csv);
    });
});

// 3. Envoyer une notification Broadcast (Email) à la base de leads
app.post('/api/admin/broadcast', (req, res) => {
    const { title, message, audience } = req.body;

    if (!title || !message) {
        return res.status(400).json({ error: "Le titre et le message sont requis." });
    }

    // Simuler le ciblage
    let query = "SELECT identifier FROM leads";
    // Pour cet exemple, on simule que 'premium' = certain auth_provider
    if (audience === 'premium') {
        query += " WHERE auth_provider = 'SwellSync'";
    }

    db.all(query, [], async (err, rows) => {
        if (err) return res.status(500).json({ error: "Erreur lors de la lecture des leads." });
        if (rows.length === 0) return res.json({ success: true, count: 0 });

        let sentCount = 0;
        // On utilise transporter de nodemailer (déjà config plus bas dans ton fichier)
        for (const user of rows) {
            try {
                // Si l'email n'est pas configuré, Nodemailer imprimera dans le terminal.
                await mailTransporter.sendMail({
                    from: '"SwellSync Server Bot" <noreply@swellsync.local>',
                    to: user.identifier,
                    subject: '🔴 SWELLSYNC: ' + title,
                    text: message
                });
                sentCount++;
            } catch (err) {
                console.log("[BROADCAST] Skipping email to " + user.identifier);
            }
        }
        res.json({ success: true, count: sentCount });
    });
});

// Forcer la synchro météo globale (Stormglass API Sync)
app.post('/api/admin/spots/sync', async (req, res) => {
    db.all("SELECT id, lat, lng FROM spots WHERE lat IS NOT NULL AND lng IS NOT NULL", [], async (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        // Simule/Force la vérification API sur les emplacements valides
        try {
            for (const spot of rows) {
                await SurfApiService.getWaveData(spot.lat, spot.lng);
            }
            res.json({ success: true, message: "Base des Spots Météo Synchronisée !" });
        } catch (e) {
            res.status(500).json({ error: "Échec du Worker Stormglass" });
        }
    });
});

// 4. Ajouter, Modifier ou Supprimer un Spot
app.post('/api/admin/spots', (req, res) => {
    const { name, location, difficulty, wave_type, description, lat, lng } = req.body;
    db.run(
        "INSERT INTO spots (name, location, difficulty, wave_type, description, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [name, location, difficulty || 'Intermédiaire', wave_type || 'MIXTE', description || '', lat, lng],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

app.put('/api/admin/spots/:id', (req, res) => {
    const { name } = req.body;
    db.run(
        "UPDATE spots SET name = ? WHERE id = ?",
        [name, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.delete('/api/admin/spots/:id', (req, res) => {
    // Supprime d'abord les historiques rattachés pour éviter violation FK
    db.serialize(() => {
        db.run("DELETE FROM spot_visits WHERE spot_id = ?", [req.params.id]);
        db.run("DELETE FROM cams WHERE spot_id = ?", [req.params.id]);
        db.run("DELETE FROM spots WHERE id = ?", [req.params.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, changes: this.changes });
        });
    });
});

// 5. Paramètres IA et Système (Settings)
app.get('/api/admin/settings', (req, res) => {
    db.all("SELECT key_name, key_value FROM settings", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const config = {};
        rows.forEach(r => config[r.key_name] = r.key_value);
        res.json(config);
    });
});

app.post('/api/admin/settings', (req, res) => {
    const config = req.body;
    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO settings (key_name, key_value) VALUES (?, ?) ON CONFLICT(key_name) DO UPDATE SET key_value=excluded.key_value");
        for (const [k, v] of Object.entries(config)) {
            stmt.run(k, String(v));
        }
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// ==========================================
// ROUTES API - TRACKING VISITES
// ==========================================

// 1. Enregistrer une nouvelle visite (clic) sur un spot
app.post('/api/spots/:id/visit', (req, res) => {
    const spotId = req.params.id;
    const { duration_s } = req.body;

    db.get("SELECT id FROM spots WHERE id = ?", [spotId], (err, row) => {
        if (err || !row) return res.status(404).json({ error: "Spot introuvable pour tracking." });

        db.run("INSERT INTO spot_visits (spot_id, duration_s) VALUES (?, ?)", [spotId, duration_s || 0], function (err) {
            if (err) return res.status(500).json({ error: "Erreur d'insertion BDD." });
            res.json({ success: true, visit_id: this.lastID });
        });
    });
});

// 2. Mettre à jour la durée de rétention avant fermeture
app.put('/api/visits/:visitId', (req, res) => {
    const visitId = req.params.visitId;
    const { duration_s } = req.body;

    db.run("UPDATE spot_visits SET duration_s = ? WHERE id = ?", [duration_s || 0, visitId], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// 3. Admin : Récupérer les Stats d'un spot selon la période
app.get('/api/admin/spots/:id/stats', (req, res) => {
    const spotId = req.params.id;
    const { period, start, end } = req.query; // '24h', '1w', 'all', 'custom'

    let dateCondition = "";
    let params = [spotId];

    if (period === '24h') {
        dateCondition = "AND created_at >= datetime('now', '-1 day')";
    } else if (period === '1w') {
        dateCondition = "AND created_at >= datetime('now', '-7 days')";
    } else if (period === 'custom' && start && end) {
        dateCondition = "AND created_at BETWEEN ? AND datetime(?, '+1 day')";
        params.push(start, end);
    }

    const query = `
        SELECT 
            COUNT(*) as totalVisits, 
            AVG(duration_s) as avgDuration 
        FROM spot_visits 
        WHERE spot_id = ? ${dateCondition}
    `;

    db.get(query, params, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
            spotId,
            totalVisits: row.totalVisits || 0,
            avgDuration: Math.round(row.avgDuration || 0)
        });
    });
});

// ==========================================
// ROUTES API - AUTHENTIFICATION (SÉCURISÉE)
// ==========================================

// Middleware pour vérifier le JWT (utilisable pour protéger les routes admin)
const verifyToken = (req, res, next) => {
    const header = req.headers['authorization'];
    if (!header) return res.status(403).json({ error: "Token d'accès manquant." });

    const token = header.split(' ')[1]; // Format "Bearer TOKEN"
    jwt.verify(token, process.env.JWT_SECRET || 'fallbackSwellSync26!', (err, decoded) => {
        if (err) return res.status(401).json({ error: "Token invalide ou expiré.", details: err.message });
        req.user = decoded; // Stocke les données de l'utilisateur pour la suite
        next();
    });
};

// Route de Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Veuillez fournir un nom d'utilisateur et un mot de passe." });
    }

    // Récupération de l'utilisateur (requête préparée contre l'injection SQL)
    db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
        if (err) return res.status(500).json({ error: "Erreur serveur interne lors de la vérification de compte." });
        if (!user) return res.status(401).json({ error: "Identifiants incorrects." });

        // Vérification Bcrypt (protection contre les attaques Rainbow Table via hachage)
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: "Identifiants incorrects." });

        // Génération du Token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'fallbackSwellSync26!',
            { expiresIn: '4h' } // Sécurité: le token expire dans 4h
        );

        res.json({ token, username: user.username, role: user.role });
    });
});

// Stockage Temporaire des Codes A2F en Mémoire (Utiliser Redis en Production)
const otpStore = new Map();

// Configuration Email (Nodemailer)
const mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Route pour envoyer un vrai Code de Sécurité (Uniquement par Email)
app.post('/api/auth/send-code', async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: "Adresse email requise." });

    // Génération d'un code à 6 chiffres aléatoire
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // On conserve le code valide pour 5 minutes
    otpStore.set(identifier, { code, expires: Date.now() + 5 * 60 * 1000 });

    try {
        // ENVOI PAR EMAIL UNIQUEMENT (Nodemailer)
        if (!process.env.SMTP_USER) {
            console.log(`[DEV MODE] Email Code pour ${identifier}: ${code}`);
            return res.json({ success: true, message: "Mode DEV: Code simulé dans la console serveur." });
        }
        await mailTransporter.sendMail({
            from: `"SwellSync Sécurité" <${process.env.SMTP_USER}>`,
            to: identifier,
            subject: "SwellSync.ID - Votre Code A2F 🌊",
            text: `Bonjour, \n\nVotre code de connexion sécurisé à SwellSync.ID est le : ${code}\n\nCe code expirera dans 5 minutes. Ne le partagez avec personne.\n\nBon surf !\nL'équipe SwellSync.`,
            html: `<div style="font-family: sans-serif; padding: 20px; text-align: center; background: #0f2123; color: white;">
                           <h2 style="color: #00bad6;">SwellSync.ID</h2>
                           <p>Voici votre code de sécurité personnel :</p>
                           <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${code}</p>
                           <p style="color: #888;">Ce code est valide pendant 5 minutes. Ne le partagez pas.</p>
                       </div>`
        });
        console.log(`📧 Email envoyé à ${identifier}`);
        res.json({ success: true, message: "Code A2F envoyé avec succès par email." });
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'email :", error);
        res.status(500).json({ error: "Impossible d'envoyer le code A2F. Vérifiez la configuration (Twilio/SMTP)." });
    }
});

// Route d'Inscription Finale (Validation du Code A2F et Lead Pool)
app.post('/api/auth/verify-code', (req, res) => {
    const { provider, identifier, code } = req.body;

    if (!provider || !identifier || !code) {
        return res.status(400).json({ error: "Fournisseur, identifiant et code requis." });
    }

    // Protection pour Apple & Google (Ils n'ont pas de code A2F sms/mail à valider de notre côté)
    if (provider !== 'Apple' && provider !== 'Google') {
        const stored = otpStore.get(identifier);

        if (!stored) return res.status(400).json({ error: "Aucun code trouvé ou code expiré." });
        if (Date.now() > stored.expires) {
            otpStore.delete(identifier);
            return res.status(400).json({ error: "Le code a expiré." });
        }
        if (stored.code !== code) {
            return res.status(400).json({ error: "Le code est incorrect." });
        }

        // Code validé ! On nettoie la RAM
        otpStore.delete(identifier);
    }

    // Insérer dans la base de données (Pool de Leads)
    db.run("INSERT INTO leads (auth_provider, identifier) VALUES (?, ?)", [provider, identifier], function (err) {
        if (err) {
            console.error("Erreur lors de l'enregistrement du lead:", err.message);
            return res.status(500).json({ error: "Erreur serveur interne lors de la création du profil." });
        }
        res.json({ success: true, lead_id: this.lastID, message: "Profil SWELLSYNC sécurisé créé et ajouté au pool." });
    });
});

// ==========================================
// API ACTUALITÉS SURF (RSS temps réel)
// ==========================================
const https = require('https');
const http = require('http');

// Cache 15 minutes
let _newsCache = { data: [], fetchedAt: 0 };
const NEWS_TTL = 15 * 60 * 1000;

// Images de fallback si le RSS n'en fournit pas (par mot-clé)
const SURF_FALLBACKS = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAFtMn9sl5uziht77j7nS1vaJZEQb5-4ciXfZAlVsDu9KLKjxo2Tr__5H-LgQxLbL6pkpGOOtCbQgXETvjI54ulD8I9LyB89MePIeiwDxPC0l7_N9SHm7DT3tSnTqrb2wJnCtm-9l9_wHBRKNMjhm0LyOKJ3JZXbgr9x2RaL92Neju0x-8dKe1y88H6knlCdoSsDL03yeIzPTBOj6milpb7HZwAH9qZEmjQfFfDlRNSEl4RzgasEyAtHtySonnV7iil8R9B828davk',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuArOSs9ukaq-134KroEeY7QmYT9zgLzrjAdwrfUXxlz-_Wb_xujd-v5KrNxobTcvujghT56-YdtDSS48Q_FvI4o-KY6iYSbSoet2ne8vybqNIvrJlHhGQzgEwY1QPYQHN0n-OUGMPAq1mGzrA1cJVg_V-8cCos9fPAzRZUNaHjdt4jsw_FX2w4xiuE78qYlZO7EFZbadwzhxuKu3rwuZc4Xb6RLQQVTkpp9jPMK0iOtRd4_G8OJ5l-icyPAa0hPPYrdGqGzdrkrBDo',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCLHP3KqVwO8zksDoKm0EYfC8FoSSRbvdsyOIguE44hVin1BZXDXoIdTJtUHpZXmcDLxJ7jl5IjKOyi_f6kMVWT6c-8yUC-3Kx1uH_Jl1vbtMRcZp2zQEocjUb0xvdQGqiNIzFQ-Ejp_e9Uu3cJlhui9HJrJWnk2Wt7J-_hPZOliEFa1-IlENCOLXuIj0SONAy65Mq7qEOphaZEdCIOpGK25lUyhaG_SZ1hQ4PpL8o5VaHEWusVcddfO1zvwn-GOvSr_AWX2TelSqo',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDu3lL9IlGLRxsq4F24VsDAt410ZW4F8uS_mgkaq2_4MOiUgaxWbqWa1Be97gtrT1R3fiQzVr1ZqkPgUTTuWO5O1_vymCrGjcWXl_xzdgSzn9Ymk7YdOr4LDzaKVb3h730RPhBfz7kvLiSkcNBd3lPgItvIFLj4BLOPqDvLmf3m04ioaQGxrkjZVdNY7_5tG6sr4WGcQrqYBxMfHhvbrowF8P4YSRcr14sUeVo8a2lbypBAjelpdxt_NcVLUgfY0TxPghli8no1VTg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCQj3sp-Veg2FfR41YQL-UfmSEUI7fA68dk9RBDjbc63NYxc1WhWcQot-SWOGMEE11rNzD3kPwM2xEouJM43VjZIx7bpZBKEaTWTt98fZq78XLRwmawhKesYpQHhPfv2_NeS99vGbbzyISs6dnYeTE0BEC-JTYxBHUe2__tXbKIeXVuyJp7Kb0IVOt_BXbyjmsGCbHFIT6rE4u8oBngjMtq5wZqFyl1_F5ulYWrsOb-YUr5M7zv1C_NtNbv2ixpQfrtqvy6jtkb4Uc',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBlO4dBIEMFG8bp5av4thZS9lK-dhXSc3aLQ6BO51JY3BiPUNuHXCpmWBFS3UUORpZJY9mh-YpaGMZTUYuu2v9QzObyBjglezaTBAMJWZ11_HmXvu4SOAjpwSzGjpT5EglwZHbBuVAZC7nJY3ewSRVoljVW90A9gG_Z3LUzm743Qp3NsPm4e5iheAVhiCPMdu32iuUKt3UepQkvgJDl3cAFO4bgvkniecPdnxbQD598sTqcsjJspn_2-8cU8j1LpDQxy_WTJg_9-3E',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAGfpvvMcNoLzWjHRnaVfFkGRTMVc7M1Y8eBAwwsM8nbF24IjWHt5EUevu8ZjGRFUEAXHoyNZfWJ8DNEMorpojAXsVIm_vS507_SIPzqVd-eU-gxDrqWTpb_ykewANvro-DHpamCRpiqEmrJvSkhwzkiIZfZWvhp0wx6wC7_n8FPNXyVuOtkIDCusnFXBlcDP-U3Z4uo1mKnLq1MFAzdJzszTm00tODbiwxR4plp5CXjJPYJ_FT9OH6UH9K05Pbr95oFlQYg0aMgcg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAsFATSnHs5xAXHkskTuaifUX5f4SNHcMxWNm8BoyQrBH7UqvEwsHxO1sSt6sWVKo1SVhTLd5XJxQnJ3S-AFQSYljD3fXDFCmPGUEgEOiBjoEkIiYxkaWqM_W9DiVw8tpwaKmrxLdArzpjHy37HCmmUDS_yheQSGROe3kFKctjRPaG5sq5Uzy674Dx4DBHdvsS-8sE3aqeqCLXs1fuWEXlrrbMCwyNpkPW3t5FVN93zPV0oQBOkO4mOK7RA1gLUn-trTAUIx48kxt8',
];

function fetchRaw(url) {
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
                'Accept-Encoding': 'gzip, deflate, identity',
                'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache'
            },
            timeout: 10000
        }, (res) => {
            // Redirections
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchRaw(res.headers.location).then(resolve).catch(reject);
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                const buf = Buffer.concat(chunks);
                const enc = (res.headers['content-encoding'] || '').toLowerCase();
                if (enc === 'gzip') {
                    zlib.gunzip(buf, (err, dec) => err ? reject(err) : resolve(dec.toString('utf8')));
                } else if (enc === 'deflate') {
                    zlib.inflate(buf, (err, dec) => err ? reject(err) : resolve(dec.toString('utf8')));
                } else if (enc === 'br') {
                    zlib.brotliDecompress(buf, (err, dec) => err ? reject(err) : resolve(dec.toString('utf8')));
                } else {
                    resolve(buf.toString('utf8'));
                }
            });
            res.on('error', reject);
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    });
}


function parseRSS(xml, sourceName, fallbackIdx) {
    const articles = [];
    const itemRx = /<item>([\s\S]*?)<\/item>/gi;
    let m, idx = fallbackIdx;

    const getTag = (block, tag) => {
        const rx = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i');
        const r = rx.exec(block);
        return r ? r[1].trim() : '';
    };
    const getAttr = (block, tag, attr) => {
        const rx = new RegExp(`<${tag}[^>]*?${attr}="([^"]*)"`, 'i');
        const r = rx.exec(block);
        return r ? r[1] : '';
    };

    while ((m = itemRx.exec(xml)) !== null) {
        const item = m[1];
        // BUG 1 FIX : décoder toutes les entités HTML + espace insécable
        const decodeEntities = s => s
            .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
            .replace(/&#160;/g, ' ').replace(/&#8203;/g, '').replace(/&#\d+;/g, ' ')
            .replace(/&nbsp;/g, ' ').replace(/\\u00a0/g, ' ')
            .replace(/\s+/g, ' ').trim();

        // BUG 2 FIX : supprimer le suffixe '- Source Name' ajouté par Google News
        const cleanTitle = s => {
            let t = decodeEntities(s);
            // Retirer le pattern " - Nom du média" en fin de titre (Google News)
            t = t.replace(/\s+[–—-]\s+[^-–—]{3,60}$/, '').trim();
            return t;
        };

        const title = cleanTitle(getTag(item, 'title'));
        if (!title || title.length < 5) continue;

        let image = getAttr(item, 'media:content', 'url')
            || getAttr(item, 'media:thumbnail', 'url')
            || getAttr(item, 'enclosure', 'url')
            || '';

        // Chercher dans le HTML de la description
        if (!image) {
            const desc = getTag(item, 'description');
            const imgM = /<img[^>]*src="(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i.exec(desc);
            if (imgM) image = imgM[1];
        }

        // Fallback rotatif
        if (!image || image.includes('pixel') || image.length < 20) {
            image = SURF_FALLBACKS[idx % SURF_FALLBACKS.length];
        }

        const rawDesc = getTag(item, 'description');
        const cleanDesc = decodeEntities(rawDesc)
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ').trim()
            .substring(0, 220);

        const pubDate = getTag(item, 'pubDate') || getTag(item, 'dc:date') || new Date().toISOString();
        let dateObj;
        try { dateObj = new Date(pubDate); if (isNaN(dateObj)) dateObj = new Date(); }
        catch (e) { dateObj = new Date(); }

        // Catégorie auto
        const titleLow = title.toLowerCase();
        let cat = 'Actu';
        if (/compet|champio|world tour|wct|wsl|contest|pro |tour/.test(titleLow)) cat = 'Compétition';
        else if (/houle|swell|tempête|storm|vague|wave/.test(titleLow)) cat = 'Houle';
        else if (/planche|board|combi|wetsuit|gear|équip/.test(titleLow)) cat = 'Équipement';
        else if (/ocean|reef|coral|pollution|environ|climate|protect/.test(titleLow)) cat = 'Environnement';
        else if (/voyage|travel|indonesi|bali|tahiti|hawaii|trip/.test(titleLow)) cat = 'Voyage';
        else if (/cultura|lifestyle|yoga|fitness|artisan|local|interview/.test(titleLow)) cat = 'Culture';

        articles.push({
            id: idx++,
            title,
            description: cleanDesc || 'Lire la suite sur ' + sourceName,
            image,
            url: getTag(item, 'link') || '#',
            sourceUrl: getAttr(item, 'source', 'url') || '',  // URL réelle du site source (utile pour Google News)
            source: sourceName,
            pubDate: dateObj.toISOString(),
            pubDateDisplay: dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
            cat
        });

        if (articles.length >= 8) break; // max 8 par source
    }
    return articles;
}

// Extrait l'og:image depuis une page HTML d'article
async function fetchOgImage(articleUrl, sourceUrl, articleTitle) {
    // Pour Google News : search l'article sur le site source pour trouver l'URL spécifique
    let urlToFetch = articleUrl;
    if (articleUrl.includes('news.google.com') && sourceUrl) {
        try {
            // Construire une query Google "site:domain mots-clés"
            const domain = sourceUrl.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
            const keywords = (articleTitle || '').replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 3).slice(0, 4).join('+');
            const searchUrl = `https://www.google.com/search?q=site:${domain}+${keywords}&num=1`;
            const searchHtml = await Promise.race([
                fetchRaw(searchUrl),
                new Promise((_, r) => setTimeout(() => r(new Error('t')), 5000))
            ]);
            // Extraire le premier lien organique
            const linkRx = new RegExp(`href="(https?://${domain.replace(/\./g, '\\.')}/[^"]+)"`, 'i');
            const lm = linkRx.exec(searchHtml);
            if (lm && lm[1] && !lm[1].includes('google')) {
                urlToFetch = lm[1];
            } else {
                urlToFetch = sourceUrl; // fallback à la homepage
            }
        } catch (e) {
            urlToFetch = sourceUrl;
        }
    }

    try {
        // Timeout court : 5s max par article
        const html = await Promise.race([
            fetchRaw(urlToFetch),
            new Promise((_, rej) => setTimeout(() => rej(new Error('img-timeout')), 5000))
        ]);
        // og:image (plusieurs ordres d'attributs possibles)
        const RX_URL = 'https?://[^\'"<>\\s]+';
        const patterns = [
            new RegExp(`property=["']og:image["'][^>]*content=["'](${RX_URL})["']`, 'i'),
            new RegExp(`content=["'](${RX_URL})["'][^>]*property=["']og:image["']`, 'i'),
            new RegExp(`name=["']twitter:image["'][^>]*content=["'](${RX_URL})["']`, 'i'),
            new RegExp(`content=["'](${RX_URL})["'][^>]*name=["']twitter:image["']`, 'i'),
            new RegExp(`<link[^>]*rel=["']image_src["'][^>]*href=["'](${RX_URL})["']`, 'i'),
        ];
        const LOGO_PATTERNS = /logo|icon|favicon|brand|placeholder|share.default|default.share|og.default|og-default|\.gif$|\/photo\/\d+\.cms$|\/img\/share|share-img|twitter-card\.jpg$/i;
        for (const p of patterns) {
            const m = p.exec(html);
            if (m && m[1]
                && !LOGO_PATTERNS.test(m[1])
                && !/\.(mp4|webm|ogg|mov)$/i.test(m[1])
                && m[1].length > 30)
                return m[1];
        }
    } catch (e) { /* silencieux */ }
    return null;
}


app.get('/api/surf-news', async (req, res) => {
    const now = Date.now();
    if (_newsCache.data.length > 0 && now - _newsCache.fetchedAt < NEWS_TTL) {
        return res.json({ articles: _newsCache.data, fetchedAt: _newsCache.fetchedAt, cached: true });
    }

    const FEEDS = [
        { url: 'https://www.surf-report.com/feed/', name: 'Surf-Report.com' },
        { url: 'https://www.surfsession.com/feed/', name: 'Surf Session' },
        { url: 'https://news.google.com/rss/search?q=surf+houle+vagues+france&hl=fr&gl=FR&ceid=FR:fr&num=10', name: 'Google News FR' },
        { url: 'https://news.google.com/rss/search?q=surfing+championship+big+waves+2026&hl=en&gl=US&ceid=US:en&num=10', name: 'Google News EN' },
        { url: 'https://www.surfeurope.com/feed/', name: 'Surf Europe' },
    ];

    const results = await Promise.allSettled(
        FEEDS.map((f, i) => fetchRaw(f.url).then(xml => parseRSS(xml, f.name, i * 8)))
    );

    let all = [];
    results.forEach(r => {
        if (r.status === 'fulfilled') all.push(...r.value);
        else console.log('[surf-news] Feed error:', r.reason?.message);
    });

    // Déduplication par titre + tri par date
    const seen = new Set();
    all = all
        .filter(a => { const key = a.title.substring(0, 40); if (seen.has(key)) return false; seen.add(key); return true; })
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 24);

    // ── Fetch og:image en parallèle (concurrence max 6) ──────────────────
    console.log(`[surf-news] Récupération des og:image pour ${all.length} articles...`);
    const CONCURRENCY = 6;
    for (let i = 0; i < all.length; i += CONCURRENCY) {
        const batch = all.slice(i, i + CONCURRENCY);
        await Promise.allSettled(batch.map(async (article, bi) => {
            const realIdx = i + bi;
            const hasFallback = SURF_FALLBACKS.includes(article.image);
            if (!article.image || article.image.length < 20 || hasFallback) {
                const ogImg = await fetchOgImage(article.url, article.sourceUrl, article.title);
                all[realIdx].image = ogImg || SURF_FALLBACKS[realIdx % SURF_FALLBACKS.length];
            }
        }));
    }

    // ── Éliminer les images logos répétées (même URL 3+ fois = générique) ──
    const imgCount = {};
    all.forEach(a => { imgCount[a.image] = (imgCount[a.image] || 0) + 1; });
    let fallbackShift = 0;
    all.forEach((a, i) => {
        if (imgCount[a.image] >= 3) {
            // Chercher un fallback pas encore assigné à cet index
            a.image = SURF_FALLBACKS[(i + fallbackShift++) % SURF_FALLBACKS.length];
        }
    });

    _newsCache = { data: all, fetchedAt: now };
    const srcCount = results.filter(r => r.status === 'fulfilled').length;
    const withImg = all.filter(a => !SURF_FALLBACKS.includes(a.image)).length;
    console.log(`[surf-news] ${all.length} articles | ${withImg} avec vraie photo | ${srcCount}/${FEEDS.length} sources`);
    res.json({ articles: all, fetchedAt: now, cached: false });
});


// ==========================================
// CENTRALISATION DES ERREURS
// ==========================================

// Gestion des routes 404 (non trouvées) pour l'API
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ error: "Route API non trouvée." });
    }
    next(); // Si ce n'est pas une l'API, on laisse express.static géré (soit il trouve le html, soit il renvoie rien)
});

// Gestionnaire d'Erreur Global (Dernier rempart contre les crashs)
app.use((err, req, res, next) => {
    console.error("Erreur Critique:", err.stack);
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? "Erreur interne du serveur."
        : err.message; // Ne pas exposer l'erreur complete en prod

    res.status(status).json({ error: message });
});



// ── Sitemap XML dynamique ──────────────────────────────────────────────────
app.get('/sitemap.xml', (req, res) => {
    db.all('SELECT id, name FROM spots ORDER BY id', [], (err, spots) => {
        const base = 'https://swellsync.surf';
        const today = new Date().toISOString().split('T')[0];
        const staticPages = [
            { url: '/', priority: '1.0', freq: 'daily' },
            { url: '/cotes.html', priority: '0.9', freq: 'daily' },
            { url: '/actu.html', priority: '0.8', freq: 'daily' },
        ];
        const spotUrls = (spots || []).map(s =>
            `  <url><loc>${base}/spot_detail.html?id=${s.id}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`
        ).join('\n');
        const staticUrls = staticPages.map(p =>
            `  <url><loc>${base}${p.url}</loc><lastmod>${today}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`
        ).join('\n');
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${spotUrls}
</urlset>`;
        res.set('Content-Type', 'application/xml');
        res.send(xml);
    });
});

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '2.0', timestamp: new Date().toISOString() });
});

// ==========================================

// ── Contact Form v3.0 ─────────────────────────────────────────────────────

// ── I1-I5 : Admin Avancé ────────────────────────────────────────────────────

// I1 : Pool de leads (numéros téléphone collectés via formulaires)
db.run(`CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name TEXT, email TEXT, phone TEXT,
    source TEXT DEFAULT 'contact',
    notes TEXT,
    created_at DATETIME DEFAULT (datetime('now'))
)`);

app.get('/api/admin/leads', (req, res) => {
    db.all('SELECT * FROM leads ORDER BY created_at DESC LIMIT 200', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erreur BDD' });
        res.json(rows || []);
    });
});
app.post('/api/admin/leads', (req, res) => {
    const { name, email, phone, source, notes } = req.body;
    db.run('INSERT INTO leads (name,email,phone,source,notes) VALUES (?,?,?,?,?)',
        [name || '', email || '', phone || '', source || 'manual', notes || ''],
        function (err) {
            if (err) return res.status(500).json({ error: 'Erreur BDD' });
            res.json({ ok: true, id: this.lastID });
        }
    );
});
app.delete('/api/admin/leads/:id', (req, res) => {
    db.run('DELETE FROM leads WHERE id = ?', [req.params.id], err => {
        if (err) return res.status(500).json({ error: 'Erreur BDD' });
        res.json({ ok: true });
    });
});

// I2 : Boîte mail centralisée (messages contact visibles dans admin)
app.get('/api/admin/mails', (req, res) => {
    db.all('SELECT * FROM contact_leads ORDER BY created_at DESC LIMIT 100', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});
app.post('/api/admin/mails/:id/reply', (req, res) => {
    // Marquer comme traité (colonne handled)
    db.run('CREATE TABLE IF NOT EXISTS contact_leads_status (id INTEGER, handled INTEGER DEFAULT 0, reply TEXT)', [], () => {
        db.run('INSERT INTO contact_leads_status (id, handled, reply) VALUES (?,1,?) ON CONFLICT (id) DO UPDATE SET handled=1, reply=EXCLUDED.reply',
            [req.params.id, req.body.reply || ''], err => {
                res.json({ ok: !err });
            }
        );
    });
});

// I3 : Robot réponse auto FAQ (patterns basiques)
const FAQ_PATTERNS = [
    { keywords: ['abonnement', 'prix', 'tarif', 'coût'], reply: 'Nos plans: Gratuit (limité), Pro 9,90€/mois, Elite 19,90€/mois. Voir abonnement.html' },
    { keywords: ['mdp', 'password', 'mot de passe'], reply: 'SwellSync utilise un système sans mot de passe: entrez votre email et recevez un code.' },
    { keywords: ['supprimer', 'compte', 'données'], reply: 'Pour supprimer votre compte, contactez admin@swellsync.surf avec "suppression compte".' },
    { keywords: ['remboursement', 'annuler'], reply: 'Annulation possible à tout moment. Aucun remboursement des mois entamés.' },
    { keywords: ['bug', 'problème', 'erreur'], reply: 'Merci de décrire le problème précisément: page concernée, navigateur, et étapes pour reproduire.' },
];
app.post('/api/admin/faq-auto', (req, res) => {
    const text = (req.body.message || '').toLowerCase();
    const match = FAQ_PATTERNS.find(p => p.keywords.some(k => text.includes(k)));
    res.json({ matched: !!match, reply: match?.reply || null });
});

// I5 : Stats admin: inscriptions/jour, spots + consultés, users actifs
app.get('/api/admin/stats-advanced', (req, res) => {
    const queries = {
        signupsToday: "SELECT COUNT(*) as count FROM members WHERE date(created_at) = date('now')",
        signupsWeek: "SELECT COUNT(*) as count FROM members WHERE created_at >= datetime('now','-7 days')",
        totalMembers: "SELECT COUNT(*) as count FROM members",
        proMembers: "SELECT COUNT(*) as count FROM members WHERE is_pro = 1",
        topSpots: "SELECT s.name, COUNT(v.id) as visits FROM surf_spots s LEFT JOIN spot_visits v ON s.id=v.spot_id GROUP BY s.id ORDER BY visits DESC LIMIT 5",
        recentSessions: "SELECT COUNT(*) as count FROM surf_journal WHERE created_at >= datetime('now','-24 hours')",
        signupsByDay: "SELECT date(created_at) as day, COUNT(*) as count FROM members WHERE created_at >= datetime('now','-30 days') GROUP BY day ORDER BY day"
    };
    const results = {};
    const keys = Object.keys(queries);
    let done = 0;
    keys.forEach(key => {
        db.all(queries[key], [], (err, rows) => {
            results[key] = err ? [] : rows;
            if (++done === keys.length) res.json(results);
        });
    });
});


// ==========================================
// ROUTES SOCIALES — Community Posts, Likes, Follows
// ==========================================

// GET /api/community/posts — Lister les posts
app.get('/api/community/posts', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    db.all(`SELECT cp.*, m.name as author_name, m.avatar as author_avatar
            FROM community_posts cp
            LEFT JOIN members m ON cp.member_id = m.id
            ORDER BY cp.created_at DESC LIMIT ? OFFSET ?`, [limit, offset], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// POST /api/community/posts — Créer un post
app.post('/api/community/posts', requireAuth, (req, res) => {
    const { content, image_url, spot_name } = req.body;
    if (!content || content.trim().length === 0) return res.status(400).json({ error: 'Contenu requis' });
    db.run('INSERT INTO community_posts (member_id, content, image_url, spot_name) VALUES (?, ?, ?, ?)',
        [req.member.id, content.trim(), image_url || null, spot_name || null], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true, id: this.lastID });
        });
});

// DELETE /api/community/posts/:id
app.delete('/api/community/posts/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM community_posts WHERE id = ? AND member_id = ?', [req.params.id, req.member.id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ok: true, deleted: this.changes });
    });
});

// POST /api/community/posts/:id/like — Liker/unliker un post
app.post('/api/community/posts/:id/like', requireAuth, (req, res) => {
    const postId = req.params.id;
    db.get('SELECT id FROM post_likes WHERE post_id = ? AND member_id = ?', [postId, req.member.id], (err, row) => {
        if (row) {
            // Unlike
            db.run('DELETE FROM post_likes WHERE post_id = ? AND member_id = ?', [postId, req.member.id]);
            db.run('UPDATE community_posts SET likes = MAX(0, likes - 1) WHERE id = ?', [postId]);
            res.json({ liked: false });
        } else {
            // Like
            db.run('INSERT INTO post_likes (post_id, member_id) VALUES (?, ?)', [postId, req.member.id]);
            db.run('UPDATE community_posts SET likes = likes + 1 WHERE id = ?', [postId]);
            res.json({ liked: true });
        }
    });
});

// POST /api/members/follow/:id — Suivre
app.post('/api/members/follow/:id', requireAuth, (req, res) => {
    const targetId = parseInt(req.params.id);
    if (targetId === req.member.id) return res.status(400).json({ error: 'Tu ne peux pas te suivre toi-même' });
    db.run('INSERT INTO follows (follower_id, following_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
        [req.member.id, targetId], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true, following: true });
        });
});

// DELETE /api/members/follow/:id — Se désabonner
app.delete('/api/members/follow/:id', requireAuth, (req, res) => {
    db.run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        [req.member.id, parseInt(req.params.id)], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true, following: false });
        });
});

// GET /api/members/:id/followers — Compte de followers
app.get('/api/members/:id/followers', (req, res) => {
    const id = parseInt(req.params.id);
    db.all(`SELECT m.id, m.name, m.avatar FROM follows f
            JOIN members m ON f.follower_id = m.id
            WHERE f.following_id = ?`, [id], (err, followers) => {
        db.all(`SELECT m.id, m.name, m.avatar FROM follows f
                JOIN members m ON f.following_id = m.id
                WHERE f.follower_id = ?`, [id], (err2, following) => {
            res.json({ followers: followers || [], following: following || [] });
        });
    });
});

// POST /api/members/badges/equip — Équiper un badge
app.post('/api/members/badges/equip', requireAuth, (req, res) => {
    const { badge_id } = req.body;
    if (!badge_id) return res.status(400).json({ error: 'badge_id requis' });
    db.run('INSERT INTO member_badges (member_id, badge_id) VALUES (?, ?) ON CONFLICT (member_id, badge_id) DO NOTHING',
        [req.member.id, badge_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true, badge_id });
        });
});

// DELETE /api/members/badges/equip — Déséquiper
app.delete('/api/members/badges/equip', requireAuth, (req, res) => {
    const { badge_id } = req.body;
    db.run('DELETE FROM member_badges WHERE member_id = ? AND badge_id = ?',
        [req.member.id, badge_id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true, unequipped: true });
        });
});

// GET /api/members/badges — Badges équipés
app.get('/api/members/badges', requireAuth, (req, res) => {
    db.all('SELECT badge_id, equipped_at FROM member_badges WHERE member_id = ?', [req.member.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// PUT /api/members/notifications-prefs — Sauvegarder notif prefs en DB
app.put('/api/members/notif-prefs-db', requireAuth, (req, res) => {
    const prefs = JSON.stringify(req.body);
    db.run('UPDATE members SET notif_prefs = ? WHERE id = ?', [prefs, req.member.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ ok: true });
    });
});

// GET /api/members/saved-posts — Posts sauvegardés
app.get('/api/members/saved-posts', requireAuth, (req, res) => {
    db.all(`SELECT cp.*, m.name as author_name FROM community_posts cp
            JOIN members m ON cp.member_id = m.id
            WHERE cp.member_id = ? ORDER BY cp.created_at DESC`, [req.member.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// ══════════════════════════════════════════
// MESSAGING (DM)
// ══════════════════════════════════════════

// GET /api/messages/conversations — Liste des conversations
app.get('/api/messages/conversations', requireAuth, (req, res) => {
    const uid = req.member.id;
    db.all(`
        SELECT m2.id, m2.name, m2.photo,
            msg.content AS last_message, msg.created_at AS last_time,
            (SELECT COUNT(*) FROM messages WHERE sender_id = m2.id AND receiver_id = ? AND read = 0) AS unread
        FROM members m2
        INNER JOIN (
            SELECT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_id,
                   MAX(id) AS max_id
            FROM messages WHERE sender_id = ? OR receiver_id = ?
            GROUP BY other_id
        ) conv ON m2.id = conv.other_id
        INNER JOIN messages msg ON msg.id = conv.max_id
        ORDER BY msg.created_at DESC
    `, [uid, uid, uid, uid], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// GET /api/messages/:userId — Historique de chat avec un utilisateur
app.get('/api/messages/:userId', requireAuth, (req, res) => {
    const uid = req.member.id;
    const otherId = req.params.userId;
    // Marquer comme lus
    db.run('UPDATE messages SET read = 1 WHERE sender_id = ? AND receiver_id = ?', [otherId, uid]);
    db.all(`
        SELECT m.*, mem.name as sender_name, mem.photo as sender_photo
        FROM messages m
        JOIN members mem ON mem.id = m.sender_id
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC LIMIT 200
    `, [uid, otherId, otherId, uid], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// POST /api/messages/:userId — Envoyer un message
app.post('/api/messages/:userId', requireAuth, (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'Message vide' });
    db.run('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
        [req.member.id, req.params.userId, content.trim()], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ok: true });
        });
});

// GET /api/messages/unread/count — Nombre de messages non lus
app.get('/api/messages/unread/count', requireAuth, (req, res) => {
    db.get('SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND read = 0', [req.member.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ count: row?.count || 0 });
    });
});

// PUT /api/members/social-links — Mettre à jour les liens réseaux sociaux
app.put('/api/members/social-links', requireAuth, (req, res) => {
    const { instagram_url, tiktok_url, youtube_url, twitter_url } = req.body;
    db.run(`UPDATE members SET instagram_url=?, tiktok_url=?, youtube_url=?, twitter_url=? WHERE id=?`,
        [instagram_url || '', tiktok_url || '', youtube_url || '', twitter_url || '', req.member.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true });
        });
});

// ==========================================
// STRIPE CHECKOUT — Paiements
// ==========================================

let stripe = null;
try {
    if (process.env.STRIPE_SECRET_KEY) {
        stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        console.log('💳 [STRIPE] Stripe initialisé avec la clé API');
    }
} catch (e) {
    console.log('💳 [STRIPE] Module stripe non installé — npm i stripe');
}

// POST /api/stripe/create-checkout-session (abonnement Pro)
app.post('/api/stripe/create-checkout-session', requireAuth, async (req, res) => {
    const { plan } = req.body; // 'monthly' ou 'yearly'
    if (!stripe) {
        return res.json({
            demo: true,
            url: null,
            message: 'Stripe non configuré. Ajoutez STRIPE_SECRET_KEY dans .env'
        });
    }
    try {
        const prices = {
            monthly: { amount: 499, name: 'SwellSync Pro — Mensuel' },
            yearly: { amount: 3999, name: 'SwellSync Pro — Annuel' }
        };
        const p = prices[plan] || prices.monthly;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: { name: p.name },
                    unit_amount: p.amount,
                    recurring: plan === 'yearly' ? { interval: 'year' } : { interval: 'month' }
                },
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${req.protocol}://${req.get('host')}/pages/abonnement.html?success=true`,
            cancel_url: `${req.protocol}://${req.get('host')}/pages/abonnement.html?canceled=true`,
            client_reference_id: String(req.member.id),
            metadata: { type: 'pro_subscription', plan }
        });
        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/stripe/buy-badge — Achat d'un badge
app.post('/api/stripe/buy-badge', requireAuth, async (req, res) => {
    const { badge_id, badge_name, price } = req.body;
    if (!badge_id || !badge_name || !price) {
        return res.status(400).json({ error: 'badge_id, badge_name et price requis' });
    }
    if (!stripe) {
        return res.json({
            demo: true,
            url: null,
            message: 'Stripe non configuré — mode démo'
        });
    }
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `Badge ${badge_name}`,
                        description: `Badge SwellSync — ${badge_name}`,
                    },
                    unit_amount: Math.round(price * 100), // centimes
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/pages/community.html?badge_success=${badge_id}`,
            cancel_url: `${req.protocol}://${req.get('host')}/pages/community.html?badge_canceled=true`,
            client_reference_id: String(req.member.id),
            metadata: { type: 'badge_purchase', badge_id, badge_name }
        });
        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/stripe/public-key — Retourne la clé publique Stripe
app.get('/api/stripe/public-key', (req, res) => {
    res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY || null });
});

// POST /api/stripe/webhook — Webhook Stripe
app.post('/api/stripe/webhook', (req, res) => {
    // En production, vérifier la signature avec stripe.webhooks.constructEvent
    const event = req.body;
    if (event.type === 'checkout.session.completed') {
        const session = event.data?.object;
        const memberId = session?.client_reference_id;
        const metadata = session?.metadata || {};

        if (metadata.type === 'badge_purchase' && memberId) {
            // Débloquer le badge pour le membre
            db.run(`CREATE TABLE IF NOT EXISTS member_badges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                member_id INTEGER NOT NULL,
                badge_id TEXT NOT NULL,
                badge_name TEXT,
                purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(member_id, badge_id)
            )`, () => {
                db.run('INSERT OR IGNORE INTO member_badges (member_id, badge_id, badge_name) VALUES (?, ?, ?)',
                    [parseInt(memberId), metadata.badge_id, metadata.badge_name]);
            });
            console.log(`🏅 [STRIPE] Membre ${memberId} → Badge "${metadata.badge_name}" débloqué`);
        } else if (memberId) {
            // Abonnement Pro
            db.run('UPDATE members SET is_pro = 1 WHERE id = ?', [parseInt(memberId)]);
            console.log(`💳 [STRIPE] Membre ${memberId} → Pro activé`);
        }
    }
    res.json({ received: true });
});

// ── L2 : Upload photo de session (Multer) ────────────────────────────────────
let multerUpload = null;
try {
    const multer = require('multer');
    const path_ = require('path');
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path_.join(__dirname, 'assets/uploads/sessions');
            require('fs').mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = path_.extname(file.originalname) || '.jpg';
            cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + ext);
        }
    });
    multerUpload = multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
        fileFilter: (req, file, cb) => {
            const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            cb(null, allowed.includes(file.mimetype));
        }
    });
    app.post('/api/journal/upload', multerUpload.single('photo'), (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier ou format non supporté (jpg/png/webp max 5MB)' });
        const url = '/assets/uploads/sessions/' + req.file.filename;
        res.json({ ok: true, url, filename: req.file.filename });
    });
    // ── Avatar upload ──
    const avatarStorage = require('multer').diskStorage({
        destination: (req, file, cb) => {
            const dir = require('path').join(__dirname, 'assets/uploads/avatars');
            require('fs').mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = require('path').extname(file.originalname) || '.jpg';
            cb(null, 'avatar-' + Date.now() + ext);
        }
    });
    const avatarUpload = require('multer')({ storage: avatarStorage, limits: { fileSize: 3 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) });
    app.post('/api/members/avatar', requireAuth, avatarUpload.single('avatar'), (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier ou format non supporté' });
        const url = '/assets/uploads/avatars/' + req.file.filename;
        db.run('UPDATE members SET avatar = ? WHERE id = ?', [url, req.member.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ ok: true, url });
        });
    });
    // Servir les uploads
    const express_ = require('express');
    app.use('/assets/uploads', express_.static(require('path').join(__dirname, 'assets/uploads')));
    console.log('[L2] Routes upload journal + avatar activées (multer)');
} catch (e) {
    console.warn('[L2] multer non installé — npm i multer pour activer l\'upload photo');
    app.post('/api/journal/upload', (req, res) => res.status(501).json({ error: 'npm i multer requis' }));
}

app.post('/api/contact', async (req, res) => {
    const { name, email, phone, subject, message, _gotcha } = req.body;
    if (_gotcha) return res.json({ ok: true });
    if (!name || !email || !subject || !message || message.length < 10)
        return res.status(400).json({ error: 'Champs manquants.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ error: 'Email invalide.' });
    db.run('CREATE TABLE IF NOT EXISTS contact_leads (id SERIAL PRIMARY KEY, name TEXT, email TEXT, phone TEXT, subject TEXT, message TEXT, created_at DATETIME DEFAULT (datetime(\'now\')))', [], () => {
        db.run('INSERT INTO contact_leads (name,email,phone,subject,message) VALUES (?,?,?,?,?)', [name, email, phone || '', subject, message]);
    });
    res.json({ ok: true });
});

// ── P3 : Push Notifications ───────────────────────────────────────────────
db.run(`CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    endpoint TEXT UNIQUE,
    p256dh TEXT,
    auth TEXT,
    created_at DATETIME DEFAULT (datetime('now'))
)`);

app.post('/api/push/subscribe', (req, res) => {
    const { subscription } = req.body;
    if (!subscription?.endpoint) return res.status(400).json({ error: 'Abonnement invalide.' });
    const { endpoint, keys } = subscription;
    const p256dh = keys?.p256dh || '';
    const auth = keys?.auth || '';
    // Récupérer user_id depuis le token (optionnel)
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
        try {
            const decoded = require('jsonwebtoken').verify(authHeader.slice(7), process.env.JWT_SECRET || 'swellsync_secret');
            userId = decoded.id || null;
        } catch { }
    }
    db.run(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
         VALUES (?,?,?,?)
         ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth`,
        [userId, endpoint, p256dh, auth],
        (err) => {
            if (err) return res.status(500).json({ error: 'Erreur BDD' });
            res.json({ ok: true, message: 'Abonnement push enregistré.' });
        }
    );
});

// Route admin : envoyer notif test (nécessite web-push : npm i web-push)
app.post('/api/push/send', (req, res) => {
    const { title, body, endpoint } = req.body;
    if (!title) return res.status(400).json({ error: 'Title requis.' });
    // Si web-push est installé, utiliser pour envoyer
    try {
        const webpush = require('web-push');
        webpush.setVapidDetails(
            'mailto:' + (process.env.EMAIL_FROM || 'admin@swellsync.surf'),
            process.env.VAPID_PUBLIC_KEY || 'BEl62iU__jMCLgz-SsSi_RFRb0cDnHoNZQoL0RBJbXFXVfwCOlgFDOkqQJa7nEkVALOUdUJhE-7iY0FJeyXi0M',
            process.env.VAPID_PRIVATE_KEY || ''
        );
        const payload = JSON.stringify({ title, body: body || '', icon: '/assets/images/swellsync_icon.svg' });
        const query = endpoint
            ? `SELECT * FROM push_subscriptions WHERE endpoint = ?`
            : `SELECT * FROM push_subscriptions LIMIT 100`;
        const params = endpoint ? [endpoint] : [];
        db.all(query, params, async (err, rows) => {
            if (err || !rows?.length) return res.json({ ok: false, sent: 0 });
            let sent = 0;
            for (const row of rows) {
                try {
                    await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, payload);
                    sent++;
                } catch (e) { /* Subscription peut être expirée */ }
            }
            res.json({ ok: true, sent });
        });
    } catch {
        // web-push non installé — log simple
        console.log(`[PUSH] NOTIF: "${title}" - ${body}`);
        res.json({ ok: true, message: 'web-push non installé, notif loggée. Faites: npm i web-push' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n=================================================`);
    console.log(`\uD83D\uDE80 [SwellSync] Serveur Démarré avec succès !`);
    console.log(`\uD83C\uDF0A [SwellSync] En écoute sur : http://localhost:${PORT}`);
    console.log(`=================================================`);
    console.log(`\uD83D\uDCCC Voir l'API Météo/Spots : http://localhost:${PORT}/api/spots`);

    // BUG 4 FIX : Warmup du cache actus dès le démarrage (2s de délai pour laisser le serveur s'initialiser)
    setTimeout(() => {
        console.log('\uD83D\uDD04 [surf-news] Préchargement des actus en arrière-plan...');
        const warmupReq = require('http').get(`http://localhost:${PORT}/api/surf-news`, (res) => {
            res.resume(); // vide le stream
            console.log(`\u2705 [surf-news] Cache préchargé (HTTP ${res.statusCode})`);
        });
        warmupReq.on('error', (e) => console.log('\u26A0\uFE0F  [surf-news] Warmup err:', e.message));
        warmupReq.setTimeout(90000, () => warmupReq.destroy()); // timeout 90s
    }, 2000);
});
