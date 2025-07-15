const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { hash } = require('crypto');
const util = require('util');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const fetch = require('node-fetch'); // Ajouter cette ligne

const path = require('path');
const fs = require('fs');
// const fs = require('path');

// const multipart = require ('@fastify/multipart');

const { pipeline } = require ('stream/promises');



const { OAuth2Client } = require('google-auth-library');
// const { default: fastifyMultipart } = require('@fastify/multipart');
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // A mettre dans un fichier .env !!!!
const client = new OAuth2Client(CLIENT_ID); 

const db = new sqlite3.Database('./database_sql.db');

// Permet de retourner une promesse (asynchrone) lors d'une requete sql au lieu d'un callback
// En gros : me permet de faire un await sur une requete db.run par ex
db.run = util.promisify(db.run.bind(db));
db.get = util.promisify(db.get.bind(db));
db.all = util.promisify(db.all.bind(db));

// Crée la table dans la bdd si elle n'existe pas
(async () => {
        // Attention : la clé secrete pour le TOTP aura 255 caractères max
        await db.run(`CREATE TABLE IF NOT EXISTS friends (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, friend_id INTEGER NOT NULL)`);
        await db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username varchar (255) DEFAULT NULL, password varchar (255) DEFAULT NULL, avatar_url varchar (255) DEFAULT NULL, email varchar (255) DEFAULT NULL, role varchar (50) DEFAULT 'user', xp INTEGER DEFAULT 0, level INTEGER DEFAULT 0, elo INTEGER DEFAULT 1200, created_at DATETIME DEFAULT (datetime('now')), last_online DATETIME DEFAULT (datetime('now')))`);
        await db.run(`CREATE TABLE IF NOT EXISTS blocked_users (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, blocked_user_id INTEGER NOT NULL, created_at DATETIME DEFAULT (datetime('now')))`);
})();

// Add created_at column to users table if it doesn't exist and update existing rows
(async () => {
    try {
        const columns = await db.all(`PRAGMA table_info(users)`);
        const hasCreatedAt = columns.some(col => col.name === 'created_at');
        if (!hasCreatedAt) {
            await db.run(`ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT NULL`);
            await db.run(`UPDATE users SET created_at = '2025-06-07' WHERE created_at IS NULL`);
        }
    } catch (err) {
        console.error("Error checking or adding 'created_at' column:", err);
    }
})();

// Add status column to friends table if it doesn't exist
(async () => {
    try {
        const columns = await db.all(`PRAGMA table_info(friends)`);
        const hasStatus = columns.some(col => col.name === 'status');
        if (!hasStatus) {
            await db.run(`ALTER TABLE friends ADD COLUMN status TEXT DEFAULT 'pending'`);
        }
    } catch (err) {
        console.error("Error checking or adding 'status' column:", err);
    }
})();

// Ensure last_username_change column exists in users table
(async () => {
    try {
        const columns = await db.all(`PRAGMA table_info(users)`);
        const hasLastUsernameChange = columns.some(col => col.name === 'last_username_change');
        if (!hasLastUsernameChange) {
            await db.run(`ALTER TABLE users ADD COLUMN last_username_change DATETIME DEFAULT NULL`);
        }
    } catch (err) {
        console.error("Error checking or adding 'last_username_change' column:", err);
    }
})();

// Add sub_google column to users table
(async () => {
    try {
        const columns = await db.all(`PRAGMA table_info(users)`);
        const hasSubGoogle = columns.some(col => col.name === 'sub_google');
        if (!hasSubGoogle) {
            await db.run(`ALTER TABLE users ADD COLUMN sub_google VARCHAR(255) DEFAULT NULL`);
        }
    } catch (err) {
        console.error("Error checking or adding 'sub_google' column:", err);
    }
})();


// Retourne le contenu du JWT a mettre dans le JWT final pour un utilisateur ayant l'id user_id
async function getJWTContent(user_id)
{
        let user;
        try {
                user = await db.get("SELECT * FROM users WHERE id = ?", [user_id]);
                // avatar_url retiré du JWT
                return {id:user.id, username : user.username};
        } catch (err){
                throw new Error("erreur lors de l'obtention du JWT");                          
        }

}

function parseUserAgent(userAgent) {
    let browser = 'Unknown';
    let os = 'Unknown';
    
    // Détection du navigateur
    if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
    } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
        browser = 'Chrome';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
    } else if (userAgent.includes('Edg')) {
        browser = 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
        browser = 'Opera';
    }
    
    // Détection de l'OS
    if (userAgent.includes('Windows')) {
        os = 'Windows';
    } else if (userAgent.includes('Mac')) {
        os = 'macOS';
    } else if (userAgent.includes('Linux')) {
        os = 'Linux';
    } else if (userAgent.includes('Android')) {
        os = 'Android';
    } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        os = 'iOS';
    }
    
    return { browser, os };
}

// Variables globales pour les WebSockets de connexion récente
const recentLoginClients = new Set();

function broadcastRecentLogin(username, timestamp) {
    const message = JSON.stringify({
        type: 'recent_login',
        username,
        last_online: timestamp
    });
    
    for (const client of recentLoginClients) {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    }
}

async function userRoutes(fastify, options) // Options permet de passer des variables personnalisées
{
        // Pour tests uniquement
        fastify.get('/api/test', async (request, reply) => {
                return "test";
        });

        // Route inscription
        // ...existing code...
        fastify.post('/api/register', async (request, reply) => {
        const data = request.body;
        const { username, password } = data;

        if (!username || !password) {
            return reply.status(400).send({ success: false, error: 'username_or_password_empty' });
        }

        try {
            const user_exists = await db.get("SELECT * FROM users WHERE username = ?", [username]);
            if (user_exists) {
            return reply.status(409).send({ success: false, error: 'username_already_exist' });
            }
        } catch (err) {
            console.error("Erreur DB (check user exists):", err);
            return reply.status(500).send({ success: false, error: 'db_access' });
        }

        const hashed_password = await bcrypt.hash(password, 10);
        let user_added_id;
        try {
            await db.run(
            "INSERT INTO users (username, password, created_at, last_online, level) VALUES (?, ?, datetime('now'), datetime('now'), 0)",
            [username, hashed_password]
            );
            const user_added = await db.get("SELECT * FROM users WHERE username = ?", [username]);
            user_added_id = user_added.id;
        } catch (err) {
            console.error("Erreur DB (insert user):", err);
            return reply.status(500).send({ success: false, error: 'db_access' });
        }

        // Génère un nouveau JWT
        let token_jwt, sessionId;
        try {
            const jwt_content = await getJWTContent(user_added_id);
            token_jwt = fastify.jwt.sign(jwt_content);
            sessionId = require('crypto').randomUUID();
        } catch (err) {
            console.error("Erreur génération JWT:", err);
            return reply.status(500).send({ success: false, error: 'db_access' });
        }

        // Ajout login_history (ne bloque pas l'inscription si erreur)
        try {
            const ua = request.headers['user-agent'] || '';
            const ip = request.headers['x-forwarded-for'] || request.ip || '';
            const { browser, os } = parseUserAgent(ua);
            const tokenHash = require('crypto').createHash('sha256').update(token_jwt).digest('hex');
            await db.run(
            "INSERT INTO login_history (user_id, browser, os, ip, user_agent, session_id, token_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [user_added_id, browser, os, ip, ua, sessionId, tokenHash]
            );
            broadcastRecentLogin(username, new Date().toISOString());
        } catch (err) {
            console.error('Error saving login_history after register:', err);
            // Ne retourne pas d'erreur ici !
        }

        // Réponse finale
        return reply.setCookie('token', token_jwt, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            path: '/'
        }).setCookie('session_id', sessionId, {
            httpOnly: false,
            secure: true,
            sameSite: 'none',
            path: '/'
        }).send({ success: true });
        });


        // Route connexion
        fastify.post('/api/login', async (request, reply) => {

                const {username, password, code_totp } = request.body;
                
                if (!username || !password)
                {
                        return reply.status(400).send({success:false, error : 'username_or_password_empty'});
                }

                let user;
                try {
                        user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
                } catch (err){
                        return reply.status(500).send({success: false, error : 'db_access'});                          
                }
                if (!user)
                {
                        return reply.status(401).send({success:false, error : 'username_not_exist'});
                }
                const passwordIsValid = await bcrypt.compare(password, user.password);
                if (!passwordIsValid)
                {
                        return reply.status(401).send({success:false, error : 'password_not_valid'});
                }

                // A faire : vérifier le code 2FA généré par Google Authenticator envoyé dans le body
                if (user.secret_totp)
                {
                        if (!code_totp)
                        {
                                // Envoyer erreur : le code totp envoyé dans le formulaire est vide
                                return reply.status(401).send({success: false, error : '2fa_empty'});                   
                        }
                        else
                        {
                                // On verifie si le code envoyé est correct
                                const verified = speakeasy.totp.verify({
                                        secret:user.secret_totp,
                                        encoding: 'base32',
                                        token: code_totp,
                                        window: 1
                                });
                                if (!verified)
                                {
                                        return reply.status(401).send({success: false, error : '2fa_code_not_valid'});
                                }
                        }
                }

                // Update last_online after successful login
                await fastify.updateLastOnline(user.id);

                // Génère un nouveau JWT
                let token_jwt, sessionId;
                try {
                        const jwt_content = await getJWTContent(user.id);
                        token_jwt = fastify.jwt.sign(jwt_content);
                        // Génère un ID de session unique
                        sessionId = require('crypto').randomUUID();
                } catch (err)
                {
                        return ({success : false, error : "db_access"});
                }

                // Ajout dans login_history avec session_id et token_hash (sans géolocalisation)
                try {
                    const ua = request.headers['user-agent'] || '';
                    const ip = request.headers['x-forwarded-for'] || request.ip || '';
                    const { browser, os } = parseUserAgent(ua);
                    // Hash du token pour la sécurité
                    const tokenHash = require('crypto').createHash('sha256').update(token_jwt).digest('hex');
                    await db.run(
                        "INSERT INTO login_history (user_id, browser, os, ip, user_agent, session_id, token_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        [user.id, browser, os, ip, ua, sessionId, tokenHash]
                    );
                    // Broadcast en temps réel
                    broadcastRecentLogin(user.username, new Date().toISOString());
                } catch (err) {
                    console.error('Error saving login_history:', err);
                }

                return reply.setCookie('token', token_jwt, {
                        httpOnly: true,
                        secure : true,
                        sameSite : 'none',
                        path : '/'
                }).setCookie('session_id', sessionId, {
                        httpOnly: false, // Accessible en JS pour le frontend
                        secure : true,
                        sameSite : 'none',
                        path : '/'
                }).send({success: true});
        });

        // Permet d'activer le 2FA sur le compte et renvoie le qr code (ainsi que la clé secrete). Nécessite d'être connecté
        fastify.get('/api/2fa/setup', {preValidation: [fastify.authenticate]}, async (request, reply) => {
                try {
                        // Génère le secret_key pour le 2FA (totp)
                        // await request.jwtVerify();
                        // console.log("id = " + request.user.id);

                        const secret = speakeasy.generateSecret({name : "Pong game"});
                        const secret_key = secret.base32;

                        // Met a jour le secret key dans le base de données
                        const sql_request = "UPDATE users SET secret_totp = ? WHERE id = ?";
                        await db.run(sql_request, [secret_key, request.user.id]);

                        // Envoie un QR code et la clé
                        const qr_image = await qrcode.toDataURL(secret.otpauth_url);
                        return ({success:true, qr_image, secret_key});
                } catch (err)
                {
                        return ({success:false, error:"db_access"});
                }
        });

        // Desactive le 2FA
        fastify.get('/api/2fa/disable', {preValidation: [fastify.authenticate]}, async (request, reply) => {
                try {
                        // Met a jour le secret key dans le base de données
                        const sql_request = "UPDATE users SET secret_totp = NULL WHERE id = ?";
                        await db.run(sql_request, [request.user.id]);
                        return ({success:true});
                } catch (err)
                {
                        return ({success:false, error:"db_access"});
                }
        });

        // // Permet d'activer le 2FA sur le compte et renvoie le qr code (ainsi que la clé secrete). Nécessite d'être connecté
        // fastify.get('/api/2fa/enabled', {preValidation: [fastify.authenticate]}, async (request, reply) => {
        //         try {

        //                 user = await db.get("SELECT * FROM users WHERE id = ?", [username]);

        //         } catch (err)
        //         {
        //                 return ({success:false, error:"db_access"});
        //         }
        // });



        fastify.get('/api/set_afk', {preValidation: [fastify.authenticate]}, async (request, reply) => {
                // Update last_online for authenticated user
                await fastify.updateLastOnline(request.user.id, true); // true for AFK
                return ({success: true, message: 'User set to AFK'});
        });


        // Route API pour Google Sign In (appelée via fetch) !!!! NE FONCTIONNE QU'AVEC LE NAVIGATEUR
        fastify.post('/api/auth/google', async (request, reply) => {
                const { id_token } = request.body;

                try {
                        console.log("TEST GOOGLE");
                        const ticket = await client.verifyIdToken({
                                idToken: id_token,
                                audience: CLIENT_ID // Vérifie que le JWT obtenu grace a google est bien destiné A MON programme
                        });

                        const payload = ticket.getPayload();

                        if (!payload)
                        {       
                                fastify.log.info("erreur sign in payload");
                                return reply.status(401).send({success:false, error : "invalid_token"});
                        }
                        else
                        {
                                console.log("Google sign in reussi");

                                // Vérifie si l'utilisateur existe deja dans la BDD et renvoie le JWT
                                let user;
                                try {
                                        user = await db.get("SELECT * FROM users WHERE sub_google = ?", [payload.sub]);
                                } catch (err){
                                        return reply.status(500).send({success: false, error : 'db_access'});                          
                                }
                                if (!user)
                                {
                                        // Premiere connexion avec Google SignIn
                                        // Do not create user yet, let frontend handle username selection
                                        return reply.send({success: true, needs_username: true});
                                }
                                else
                                {
                                        // L'utilisateur a déja une ligne associée dans la base de données

                                        // Génère un nouveau JWT
                                        try {
                                                const jwt_content = await getJWTContent(user.id);
                                                const token_jwt = fastify.jwt.sign(jwt_content);
                                                // return ({success : true, first_connection:false ,token_jwt});
                                                
                                                ///// A TESTER !!!!!!
                                                return reply.setCookie('token', token_jwt, {
                                                        httpOnly: true,
                                                        secure : true,
                                                        sameSite : 'none',
                                                        path : '/'
                                                }).send({success: true});

                                        } catch (err)
                                        {
                                                return ({success : false, error : "db_access"});
                                        }
                                }
                        }
                } catch(err)
                {
                        console.log("probleme avec google sign in catch");
                        return reply.status(500).send({success: false, error : 'unknown_error'});
                }
        } );

        // Route API pour compléter l'inscription Google avec un username choisi
        fastify.post('/api/auth/google/complete', async (request, reply) => {
                const { id_token, username, password } = request.body;

                try {
                        // Verify the Google token again
                        const ticket = await client.verifyIdToken({
                                idToken: id_token,
                                audience: CLIENT_ID
                        });

                        const payload = ticket.getPayload();

                        if (!payload) {
                                return reply.status(401).send({success: false, error: "invalid_token"});
                        }

                        // Validate username
                        if (!username || typeof username !== 'string') {
                                return reply.status(400).send({success: false, error: "username_required"});
                        }

                        // Validate password
                        if (!password || typeof password !== 'string') {
                                return reply.status(400).send({success: false, error: "password_required"});
                        }

                        if (password.length < 6) {
                                return reply.status(400).send({success: false, error: "password_too_short"});
                        }

                        const trimmedUsername = username.trim();
                        
                        if (trimmedUsername.length < 3) {
                                return reply.status(400).send({success: false, error: "username_too_short"});
                        }
                        
                        if (trimmedUsername.length > 20) {
                                return reply.status(400).send({success: false, error: "username_too_long"});
                        }
                        
                        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
                                return reply.status(400).send({success: false, error: "username_invalid_chars"});
                        }

                        // Check if user already exists with this Google account
                        let existingUser;
                        try {
                                existingUser = await db.get("SELECT * FROM users WHERE sub_google = ?", [payload.sub]);
                                if (existingUser) {
                                        return reply.status(400).send({success: false, error: "user_already_exists"});
                                }
                        } catch (err) {
                                return reply.status(500).send({success: false, error: 'db_access'});
                        }

                        // Check if username is already taken
                        let usernameCheck;
                        try {
                                usernameCheck = await db.get("SELECT id FROM users WHERE username = ?", [trimmedUsername]);
                                if (usernameCheck) {
                                        return reply.status(400).send({success: false, error: "username_taken"});
                                }
                        } catch (err) {
                                return reply.status(500).send({success: false, error: 'db_access'});
                        }

                        // Create new user with chosen username and hashed password
                        const hashed_password = await bcrypt.hash(password, 10);
                        try {
                                await db.run("INSERT INTO users (username, password, sub_google) VALUES (?, ?, ?)", [trimmedUsername, hashed_password, payload.sub]);
                        } catch (err) {
                                console.error("Error creating user:", err);
                                return reply.status(500).send({success: false, error: 'db_access'});
                        }

                        // Get the created user
                        let newUser;
                        try {
                                newUser = await db.get("SELECT * FROM users WHERE sub_google = ?", [payload.sub]);
                        } catch (err) {
                                return reply.status(500).send({success: false, error: 'db_access'});
                        }

                        // Generate JWT and set cookie
                        try {
                                const jwt_content = await getJWTContent(newUser.id);
                                const token_jwt = fastify.jwt.sign(jwt_content);
                                // Génère un ID de session unique
                                const sessionId = require('crypto').randomUUID();

                                // Ajout dans login_history avec session_id et token_hash
                                try {
                                        const userAgent = request.headers['user-agent'] || 'Unknown';
                                        const { browser, os } = parseUserAgent(userAgent);
                                        const tokenHash = require('crypto').createHash('sha256').update(token_jwt).digest('hex');
                                        
                                        await db.run(`
                                                INSERT INTO login_history 
                                                (user_id, session_id, token_hash, browser, os, login_time, is_active) 
                                                VALUES (?, ?, ?, ?, ?, datetime('now'), 1)
                                        `, [newUser.id, sessionId, tokenHash, browser, os]);
                                        
                                        // Broadcast recent login
                                        broadcastRecentLogin(newUser.username, new Date().toISOString());
                                } catch (err) {
                                        console.error('Error saving login_history:', err);
                                }

                                return reply.setCookie('token', token_jwt, {
                                        httpOnly: true,
                                        secure: true,
                                        sameSite: 'none',
                                        path: '/'
                                }).setCookie('session_id', sessionId, {
                                        httpOnly: false,
                                        secure: true,
                                        sameSite: 'none',
                                        path: '/'
                                }).send({success: true});

                        } catch (err) {
                                console.error("Error generating JWT:", err);
                                return reply.status(500).send({success: false, error: "db_access"});
                        }

                } catch (err) {
                        console.error("Google complete signup error:", err);
                        return reply.status(500).send({success: false, error: 'unknown_error'});
                }
        });


        // Test du cookie : renvoie mon pseudo et avatar
        fastify.get('/api/test_my_profile', {preValidation: [fastify.authenticate]}, async (request, reply) => {
                // Update last_online for authenticated user
                await fastify.updateLastOnline(request.user.id);

                // Récupère les données utilisateur depuis la base
                let user;
                try {
                        user = await db.get("SELECT avatar_url, level, xp FROM users WHERE id = ?", [request.user.id]);
                } catch (err) {
                        return reply.status(500).send({success: false, error: 'db_access'});
                }

                return ({
                        id: request.user.id,
                        username: request.user.username,
                        avatar_url: user?.avatar_url || 'default.png',
                        level: user?.level || 0,
                        xp: user?.xp || 0
                });
        });



        // Retourne toutes les infos d'un profile a partir de son username ou ID
        fastify.get('/api/profile/:identifier', { preValidation: [fastify.authenticate] }, async (request, reply) => {
                const identifier = request.params.identifier;

                let user;
                try {
                        if (isNaN(identifier)) {
                                // Fetch by username
                                user = await db.get("SELECT * FROM users WHERE username = ?", [identifier]);
                        } else {
                                // Fetch by ID
                                user = await db.get("SELECT * FROM users WHERE id = ?", [identifier]);
                        }
                } catch (err) {
                        return reply.status(500).send({ success: false, error: 'db_access' });
                }

                if (!user) {
                        return reply.status(404).send({ success: false, error: "user_not_found" });
                }

                const isMyProfile = request.user.id === user.id;
                const isOnline = (new Date().getTime() - new Date(user.last_online).getTime()) < 60000; // 60 seconds

                // Vérification en base : est-ce que request.user.id a bloqué user.id ?
                let blockRow;
                try {
                    blockRow = await db.get(
                        "SELECT 1 FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?",
                        [request.user.id, user.id]
                    );
                } catch (err) {
                    return reply.status(500).send({ success: false, error: 'db_access' });
                }
                const i_blocked = !!blockRow;

                // Ajouter le statut d'amitié
                let friend_status = 'none';
                if (!isMyProfile) {
                    try {
                        // Vérifier si j'ai envoyé une demande d'ami
                        const sentRequest = await db.get(
                            "SELECT status FROM friends WHERE user_id = ? AND friend_id = ?",
                            [request.user.id, user.id]
                        );
                        
                        // Vérifier si j'ai reçu une demande d'ami
                        const receivedRequest = await db.get(
                            "SELECT status FROM friends WHERE user_id = ? AND friend_id = ?",
                            [user.id, request.user.id]
                        );

                        if (sentRequest?.status === 'accepted' || receivedRequest?.status === 'accepted') {
                            friend_status = 'friends';
                        } else if (sentRequest?.status === 'pending') {
                            friend_status = 'request_sent'; // Correction ici
                        } else if (receivedRequest?.status === 'pending') {
                            friend_status = 'request_received'; // Demande reçue en attente
                        }
                    } catch (err) {
                        console.error('Error checking friendship status:', err);
                    }
                }

                return reply.send({
                        success: true,
                        id: user.id,
                        username: user.username,
                        wins: user.wins,
                        losses: user.losses,
                        elo: user.elo,
                        xp: user.xp,
                        level: user.level,
                        avatar_url: user.avatar_url || '/uploads/default.png',
                        last_online: user.last_online,
                        created_at: user.created_at,
                        isMyProfile,
                        is_online: isOnline,
                        i_blocked,    // <-- nouveau champ pour le front
                        friend_status // <-- nouveau champ pour le statut d'amitié
                });
        });

        // Upload un avatar (PROTÉGÉ PAR JWT)
        fastify.post('/api/upload', { preValidation: [fastify.authenticate] }, async (request, reply) => {
                const parts = request.parts();

                // Récupère l'id de l'utilisateur connecté via JWT
                const userId = request.user.id;

                for await (const part of parts)
                {
                        if (part.file)
                        {
                                // Vérifie si c'est une image
                                if (!part.mimetype.startsWith('image/'))
                                {
                                        return reply.status(400).send({success:false, error:"not_an_image"});
                                }
                                
                                // Choix de l'emplacement et du nom du fichier
                                // Utilise l'id du user connecté pour le nom du fichier
                                const ext = path.extname(part.filename) || '.png';
                                const new_name = `${userId}_avatar${ext}`;
                                const dir_and_filename = path.join('uploads', new_name);

                                // Création sur le disque dur du backend et upload BDD
                                try {
                                        await pipeline(part.file, fs.createWriteStream(dir_and_filename));
                                        await db.run("UPDATE users SET avatar_url = ? WHERE id = ?", [new_name, userId]);
                                        return ({success:true, avatar_url: "/uploads/" + new_name});
                                } catch (err) 
                                {
                                        return reply.status(500).send({success:false, error:"db_access"});
                                }
                        }
                }
                return reply.status(400).send({success:false, error:"no_file_sent"});
        });
        
        // Remove avatar and set to default
        fastify.post('/api/avatar/remove', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const userId = request.user.id;
                
                const user = await db.get("SELECT avatar_url FROM users WHERE id = ?", [userId]);
                
                if (user && user.avatar_url && user.avatar_url !== 'default.png') {
                    await db.run("UPDATE users SET avatar_url = ? WHERE id = ?", ['default.png', userId]);
                    
                    try {
                        const oldAvatarPath = path.join('uploads', user.avatar_url);
                        if (fs.existsSync(oldAvatarPath) && !oldAvatarPath.includes('default.png')) {
                            fs.unlinkSync(oldAvatarPath);
                        }
                    } catch (fileErr) {
                        console.error('Error deleting avatar file:', fileErr);
                    }
                }
                
                return reply.send({ 
                    success: true, 
                    message: 'Avatar removed successfully',
                    avatar_url: '/uploads/default.png'
                });
            } catch (err) {
                console.error('Error removing avatar:', err);
                return reply.status(500).send({ success: false, error: 'Failed to remove avatar' });
            }
        });
        
        
        // Permet de modifier les informations (pseudo / mot de passe) d'un utilisateur
        fastify.post('/api/update_profile', {preValidation: [fastify.authenticate]}, async (request, reply) => {

                const { username, password, currentPassword, newPassword } = request.body;

                let password_changed = false;
                let username_changed = false;

                // Mode changement de pseudo
                if (username) {
                    // Validation stricte du pseudo côté backend
                    if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
                        return reply.status(400).send({success: false, error: 'username_length'});
                    }
                    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                        return reply.status(400).send({success: false, error: 'username_format'});
                    }
                    // Check cooldown for username change
                    let user;
                    try {
                        user = await db.get("SELECT * FROM users WHERE id = ?", [request.user.id]);
                    } catch (err){
                        return reply.status(500).send({success: false, error : 'db_access'});                          
                    }
                    // Check if username is already taken by someone else
                    let userWithUsername;
                    try {
                        userWithUsername = await db.get("SELECT * FROM users WHERE username = ?", [username]);
                    } catch (err){
                        return reply.status(500).send({success: false, error : 'db_access'});                          
                    }
                    if (userWithUsername && userWithUsername.id !== request.user.id) {
                        // Le pseudo est déjà pris par quelqu'un d'autre
                        return reply.status(409).send({success: false, error: 'username_taken'});
                    }
                    // Check cooldown (30 days)
                    const now = new Date();
                    if (user.last_username_change) {
                        const lastChange = new Date(user.last_username_change);
                        const diffDays = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
                        if (diffDays < 30) {
                            return reply.status(429).send({success: false, error: 'username_cooldown', remaining_days: 30 - diffDays});
                        }
                    }
                    // Username is available and cooldown is OK
                    await db.run("UPDATE users set username = ?, last_username_change = datetime('now') WHERE id = ?", [username, request.user.id]);
                    username_changed = true;
                }

                // Mode changement de mot de passe avec currentPassword et newPassword
                if (currentPassword && newPassword) {
                        try {
                                // Vérifier le mot de passe actuel
                                const user = await db.get("SELECT password FROM users WHERE id = ?", [request.user.id]);
                                if (!user) {
                                        return reply.status(404).send({success: false, error: 'user_not_found'});
                                }
                                
                                const passwordIsValid = await bcrypt.compare(currentPassword, user.password);
                                if (!passwordIsValid) {
                                        return reply.status(401).send({success: false, error: 'current_password_incorrect'});
                                }
                                
                                // Hasher et enregistrer le nouveau mot de passe
                                const hashed_password = await bcrypt.hash(newPassword, 10);
                                await db.run("UPDATE users set password = ? WHERE id = ?", [hashed_password, request.user.id]);
                                password_changed = true;
                        } catch (err) {
                                console.error("Error updating password:", err);
                                return reply.status(500).send({success: false, error: 'db_access'});
                        }
                }
                
                // Si aucun changement n'a été effectué
                if (!username_changed && !password_changed) {
                        return reply.status(400).send({success: false, error: 'no_changes_requested'});
                }

                // Génère un nouveau JWT
                try {
                        const jwt_content = await getJWTContent(request.user.id);
                        const token_jwt = fastify.jwt.sign(jwt_content);
                        // return ({success : true, token_jwt});
                        
                        return reply.setCookie('token', token_jwt, {
                                httpOnly: true,
                                secure : true,
                                sameSite : 'Strict',
                                path : '/'
                        }).send({success: true});

                } catch (err)
                {
                        return ({success : false, error : "db_access"});
                }
        });

        // Vérifie la disponibilité d'un pseudo (pour le front)
        fastify.post('/api/check_username_availability', {preValidation: [fastify.authenticate]}, async (request, reply) => {
            const { username } = request.body || {};
            if (!username || typeof username !== 'string') {
                return reply.status(400).send({ available: false, error: 'invalid_username' });
            }
            if (username.length < 3 || username.length > 20) {
                return reply.status(400).send({ available: false, error: 'username_length' });
            }
            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                return reply.status(400).send({ available: false, error: 'username_format' });
            }
            try {
                const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
                if (user) {
                    return reply.send({ available: false });
                }
                return reply.send({ available: true });
            } catch (err) {
                return reply.status(500).send({ available: false, error: 'db_access' });
            }
        });

        // Liste globale des connexions WebSocket actives pour les notifications
        const friendNotificationClients = new Map();

        // WebSocket pour les notifications d'amis
        fastify.get('/api/ws/friend_notifications', { websocket: true }, async (socket, req) => {
            let user;
            try {
                if (req?.cookies?.token) {
                    user = await fastify.jwt.verify(req.cookies.token);
                } else {
                    throw new Error("no cookie");
                }
            } catch (err) {
                socket.send(JSON.stringify({ success: false, error: "cookie_jwt" }));
                socket.close();
                return;
            }

            // Ajoute le client connecté à la liste
            friendNotificationClients.set(user.id, socket);

            socket.on('close', () => {
                friendNotificationClients.delete(user.id);
            });
        });

        // In-memory set to track online users and their sockets
        const onlineUsers = new Map();

        // NOUVEAU : Map pour tracker les sessions actives par utilisateur
        const userSessions = new Map(); // userId -> Set of sockets

        // WebSocket for online status notifications
        fastify.get('/api/ws/online_status', { websocket: true }, async (socket, req) => {
            let user;
            try {
                if (req?.cookies?.token) {
                    user = await fastify.jwt.verify(req.cookies.token);
                } else {
                    throw new Error("no cookie");
                }
            } catch (err) {
                socket.send(JSON.stringify({ success: false, error: "cookie_jwt" }));
                socket.close();
                return;
            }

            // Mark user as online
            onlineUsers.set(user.id, socket);

            // NOUVEAU : Ajouter à la map des sessions
            if (!userSessions.has(user.id)) {
                userSessions.set(user.id, new Set());
            }
            userSessions.get(user.id).add(socket);

            // Broadcast to all: user online
            broadcastOnlineStatus({ user_id: user.id, username: user.username, type: 'online' });

            socket.on('close', () => {
                onlineUsers.delete(user.id);
                // NOUVEAU : Retirer de la map des sessions
                const sessions = userSessions.get(user.id);
                if (sessions) {
                    sessions.delete(socket);
                    if (sessions.size === 0) {
                        userSessions.delete(user.id);
                    }
                }
                // Broadcast to all: user offline
                broadcastOnlineStatus({ user_id: user.id, username: user.username, type: 'offline' });
            });
            socket.on('error', () => {
                onlineUsers.delete(user.id);
                const sessions = userSessions.get(user.id);
                if (sessions) {
                    sessions.delete(socket);
                    if (sessions.size === 0) {
                        userSessions.delete(user.id);
                    }
                }
                broadcastOnlineStatus({ user_id: user.id, username: user.username, type: 'offline' });
            });
        });

        // NOUVEAU : WebSocket dédié pour les notifications de déconnexion forcée
        fastify.get('/api/ws/session_management', { websocket: true }, async (socket, req) => {
            let user;
            try {
                if (req?.cookies?.token) {
                    user = await fastify.jwt.verify(req.cookies.token);
                } else {
                    throw new Error("no cookie");
                }
            } catch (err) {
                socket.send(JSON.stringify({ success: false, error: "cookie_jwt" }));
                socket.close();
                return;
            }

            // Ajouter à la map des sessions
            if (!userSessions.has(user.id)) {
                userSessions.set(user.id, new Set());
            }
            userSessions.get(user.id).add(socket);

            socket.on('close', () => {
                const sessions = userSessions.get(user.id);
                if (sessions) {
                    sessions.delete(socket);
                    if (sessions.size === 0) {
                        userSessions.delete(user.id);
                    }
                }
            });
            socket.on('error', () => {
                const sessions = userSessions.get(user.id);
                if (sessions) {
                    sessions.delete(socket);
                    if (sessions.size === 0) {
                        userSessions.delete(user.id);
                    }
                }
            });
        });

        // NOUVEAU : Fonction pour broadcaster la déconnexion forcée à toutes les sessions d'un utilisateur
        function broadcastForceLogout(userId) {
            const sessions = userSessions.get(userId);
            if (sessions) {
                const message = JSON.stringify({ type: 'force_logout', message: 'You have been signed out from all devices' });
                for (const socket of sessions) {
                    if (socket.readyState === socket.OPEN) {
                        socket.send(message);
                    }
                }
            }
        }

        // Ajout de la table login_history si elle n'existe pas
        (async () => {
            try {
                await db.run(`
                    CREATE TABLE IF NOT EXISTS login_history (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        browser TEXT,
                        os TEXT,
                        ip TEXT,
                        user_agent TEXT,
                        created_at DATETIME DEFAULT (datetime('now')),
                        session_id TEXT,
                        token_hash TEXT
                    )
                `);
                // Ajouter les colonnes session_id et token_hash si elles n'existent pas
                const columns = await db.all(`PRAGMA table_info(login_history)`);
                const hasSessionId = columns.some(col => col.name === 'session_id');
                const hasTokenHash = columns.some(col => col.name === 'token_hash');
                
                if (!hasSessionId) {
                    await db.run(`ALTER TABLE login_history ADD COLUMN session_id TEXT`);
                }
                if (!hasTokenHash) {
                    await db.run(`ALTER TABLE login_history ADD COLUMN token_hash TEXT`);
                }
            } catch (err) {
                console.error("Error creating/updating login_history table:", err);
            }
        })();

        // Helper to broadcast online/offline status to all connected clients
        function broadcastOnlineStatus(payload) {
            const msg = JSON.stringify(payload);
            for (const [, ws] of onlineUsers) {
                if (ws.readyState === ws.OPEN) {
                    ws.send(msg);
                }
            }
        }

        // Retourne l'historique des matchs d'un user
        fastify.get('/api/history/:id', async (request, reply) => {

                // J'insert des matchs pour test
                await db.run("INSERT INTO matchs_history (first_player, second_player, winner_id) VALUES (1, 2, 1)");



                try {

                        // Je vérifie si l'utilisateur id existe
                        let exist = await db.get("SELECT 1 FROM users WHERE id = ?", [request.params.id]);
                        if (!exist)
                        {
                                return ({success:false, error:"user_not_found"});
                        }

                        let final_tabl = [];
                        let first_user;
                        let second_user;

                        // J'obtiens tous les matchs associés a cet utilisateur et je les mets dans final_tabl
                        const matchs = await db.all("SELECT * FROM matchs_history WHERE first_player = ? OR second_player = ?", [request.params.id, request.params.id]);
                        for (one_match of matchs)
                        {
                                try {
                                        first_user = await db.get("SELECT * FROM users WHERE id = ?", [one_match.first_player]);
                                } catch (err){
                                        return reply.status(500).send({success: false, error : 'db_access'});                          
                                }
                                try {
                                        second_user = await db.get("SELECT * FROM users WHERE id = ?", [one_match.second_player]);
                                } catch (err){
                                        return reply.status(500).send({success: false, error : 'db_access'});                          
                                }
                                final_tabl.push({id:one_match.id, first_player : first_user.username, second_player:second_user.username, winner_id: one_match.winner_id,  date:one_match.created_at});
                        }

                        return ({success:true, final_tabl});

                } catch (err){
                        return reply.status(500).send({success: false, error : 'db_access'});                          
                }
        });


        // Route pour récupérer l'id, username et avatar de l'utilisateur connecté
        fastify.get('/api/me', {preValidation: [fastify.authenticate]}, async (request, reply) => {
                // request.user est rempli par fastify.authenticate (décodé du JWT)
                // On récupère l'avatar_url depuis la base, pas depuis le JWT
                let user;
                try {
                        user = await db.get("SELECT avatar_url, level, created_at, last_username_change FROM users WHERE id = ?", [request.user.id]);
                        if (!user) {
                                return { success: false, error: "user_not_found" };
                        }
                } catch (err){
                        return reply.status(500).send({success: false, error : 'db_access'});                          
                }
                return {
                        success: true,
                        id: request.user.id,
                        username: request.user.username,
                        avatar_url: user?.avatar_url || null,
                        level: user?.level || 0,
                        created_at: user?.created_at || null,
                        last_username_change: user?.last_username_change || null
                };
        });

        // Vérifie si le 2FA est déja activé sur mon compte
        fastify.get('/api/2fa/activated', {preValidation: [fastify.authenticate]}, async (request, reply) => {
                let user;
                try {
                        user = await db.get("SELECT * FROM users WHERE id = ?", [request.user.id]);
                        if (!user) {
                                return { success: false, error: "user_not_found" };
                        }
                        if (!(user.secret_totp))
                        {
                            return ({success:true, activated : false});
                        }
                        else
                        {
                            return ({success:true, activated : true});

                        }
                } catch (err){
                        return reply.status(500).send({success: false, error : 'db_access'});                          
                }
        });

        // Route logout : supprime le cookie JWT et la session de login_history
        fastify.post('/api/logout', {preValidation: [fastify.authenticate]}, async (request, reply) => {
                try {
                        // Récupère le token et session_id depuis les cookies
                        const token = request.cookies.token;
                        const sessionId = request.cookies.session_id;
                        
                        if (token) {
                                // Hash du token pour retrouver l'entrée dans login_history
                                const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
                                
                                // Supprime l'entrée de login_history correspondante
                                if (sessionId) {
                                        await db.run(
                                                "DELETE FROM login_history WHERE user_id = ? AND session_id = ?",
                                                [request.user.id, sessionId]
                                        );
                                } else {
                                        // Fallback: utilise le token_hash si pas de session_id
                                        await db.run(
                                                "DELETE FROM login_history WHERE user_id = ? AND token_hash = ?",
                                                [request.user.id, tokenHash]
                                        );
                                }
                        }
                } catch (err) {
                        console.error('Error removing session from login_history:', err);
                }
                
                // Supprime les cookies JWT et session_id
                return reply
                        .clearCookie('token', {
                                path: '/',
                                httpOnly: true,
                                secure: true,
                                sameSite: 'none'
                        })
                        .clearCookie('session_id', {
                                path: '/',
                                httpOnly: false,
                                secure: true,
                                sameSite: 'none'
                        })
                        .send({ success: true });
        });

        // Route pour déconnecter tous les appareils
        fastify.post('/api/sign_out_all', {preValidation: [fastify.authenticate]}, async (request, reply) => {
                try {
                        // NOUVEAU : Notifier toutes les sessions actives AVANT de supprimer les tokens
                        broadcastForceLogout(request.user.id);

                        // Supprime TOUTES les sessions de login_history pour cet utilisateur
                        await db.run(
                                "DELETE FROM login_history WHERE user_id = ?",
                                [request.user.id]
                        );
                        
                        // Supprime aussi les cookies de la session actuelle
                        return reply
                                .clearCookie('token', {
                                        path: '/',
                                        httpOnly: true,
                                        secure: true,
                                        sameSite: 'none'
                                })
                                .clearCookie('session_id', {
                                        path: '/',
                                        httpOnly: false,
                                        secure: true,
                                        sameSite: 'none'
                                })
                                .send({ success: true });
                } catch (err) {
                        console.error('Error signing out all devices:', err);
                        return reply.status(500).send({ success: false, error: 'db_access' });
                }
        });

        fastify.decorate("updateLastOnline", async function (userId) {
                try {
                        await db.run("UPDATE users SET last_online = datetime('now') WHERE id = ?", [userId]);
                } catch (err) {
                        fastify.log.error("Failed to update last_online:", err);
                }
        });


        // Search users by username
        fastify.get('/api/search_users', { preValidation: [fastify.authenticate] }, async (request, reply) => {
                const query = request.query.query;
                const page = parseInt(request.query.page || '1', 10);
                const limit = parseInt(request.query.limit || '10', 10);
                const offset = (page - 1) * limit;

                if (!query) {
                    return reply.status(400).send({ success: false, error: 'missing_query' });
                }

                try {
                    // Count total users matching the query
                    const totalUsers = await db.get(`
                        SELECT COUNT(*) as count 
                        FROM users 
                        WHERE username LIKE ? AND id != ?
                    `, [`%${query}%`, request.user.id]);

                    // Fetch paginated users with friendship status and blocked status
                    const users = await db.all(`
                        SELECT 
                            u.id, 
                            u.username, 
                            u.avatar_url, 
                            u.last_online,
                            f1.status as sent_request_status,
                            f2.status as received_request_status,
                            b1.id as blocked_by_me,
                            b2.id as blocked_by_them
                        FROM users u
                        LEFT JOIN friends f1 ON u.id = f1.friend_id AND f1.user_id = ?
                        LEFT JOIN friends f2 ON u.id = f2.user_id AND f2.friend_id = ?
                        LEFT JOIN blocked_users b1 ON u.id = b1.blocked_user_id AND b1.user_id = ?
                        LEFT JOIN blocked_users b2 ON u.id = b2.user_id AND b2.blocked_user_id = ?
                        WHERE u.username LIKE ? AND u.id != ?
                        LIMIT ? OFFSET ?
                    `, [request.user.id, request.user.id, request.user.id, request.user.id, `%${query}%`, request.user.id, limit, offset]);

                    const result = users.map(user => {
                        let friendshipStatus = 'none';
                        
                        // Vérifier d'abord les blocages
                        if (user.blocked_by_me) {
                            friendshipStatus = 'blocked';
                        } else if (user.blocked_by_them) {
                            friendshipStatus = 'blocked_by';
                        } else if (user.sent_request_status === 'accepted' || user.received_request_status === 'accepted') {
                            friendshipStatus = 'friends';
                        } else if (user.sent_request_status === 'pending') {
                            friendshipStatus = 'request_sent';
                        } else if (user.received_request_status === 'pending') {
                            friendshipStatus = 'request_received';
                        }

                        return {
                            id: user.id,
                            username: user.username,
                            avatar_url: user.avatar_url || '/uploads/default.png',
                            online: (new Date().getTime() - new Date(user.last_online).getTime()) < 60000,
                            friendshipStatus: friendshipStatus
                        };
                    });

                    return reply.send({ success: true, users: result, total: totalUsers.count });
                } catch (err) {
                    console.error('Error searching users:', err);
                    return reply.status(500).send({ success: false, error: 'db_access' });
                }
        });

        // Supprimer un ami
        fastify.get('/api/remove_friend/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const friendId = Number(request.params.id);

                // Vérifie si les utilisateurs sont amis
                const friendship = await db.get(
                    "SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'accepted'",
                    [request.user.id, friendId]
                );
                if (!friendship) {
                    return reply.status(404).send({ success: false, error: 'not_friends' });
                }

                // Supprime les deux relations d'amitié
                await db.run(
                    "DELETE FROM friends WHERE user_id = ? AND friend_id = ?",
                    [request.user.id, friendId]
                );
                await db.run(
                    "DELETE FROM friends WHERE user_id = ? AND friend_id = ?",
                    [friendId, request.user.id]
                );

                // Récupérer les infos de l'utilisateur qui supprime pour la notification
                const removerUser = await db.get("SELECT username, avatar_url FROM users WHERE id = ?", [request.user.id]);

                // Notifie l'autre utilisateur
                const targetSocket = friendNotificationClients.get(friendId);
                if (targetSocket && targetSocket.readyState === targetSocket.OPEN) {
                    targetSocket.send(JSON.stringify({
                        type: 'friend_removed',
                        from: request.user.id,
                        username: removerUser.username,
                        avatar_url: removerUser.avatar_url || '/uploads/default.png'
                    }));
                }

                return reply.send({ success: true, message: 'friend_removed' });
            } catch (err) {
                console.error('Error removing friend:', err);
                return reply.status(500).send({ success: false, error: 'db_access' });
            }
        });

        // Bloquer un utilisateur (POST route to match frontend)
        fastify.post('/api/users/:id/block', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const blockedUserId = Number(request.params.id);

                // Vérifie si l'utilisateur n'est pas déjà bloqué
                const existingBlock = await db.get(
                    "SELECT * FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?",
                    [request.user.id, blockedUserId]
                );
                if (existingBlock) {
                    return reply.status(409).send({ success: false, error: 'user_already_blocked' });
                }

                // Bloque l'utilisateur
                await db.run(
                    "INSERT INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)",
                    [request.user.id, blockedUserId]
                );

                // Supprime toute relation d'amitié existante
                await db.run(
                    "DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)",
                    [request.user.id, blockedUserId, blockedUserId, request.user.id]
                );

                // Récupérer les infos des utilisateurs pour la notification
                const blockerUser = await db.get("SELECT username, avatar_url FROM users WHERE id = ?", [request.user.id]);
                const blockedUser = await db.get("SELECT username, avatar_url FROM users WHERE id = ?", [blockedUserId]);

                // Notifier l'utilisateur bloqué en temps réel
                const blockedSocket = friendNotificationClients.get(blockedUserId);
                if (blockedSocket && blockedSocket.readyState === blockedSocket.OPEN) {
                    blockedSocket.send(JSON.stringify({
                        type: 'user_blocked',
                        blocker_id: request.user.id,
                        blocker_username: blockerUser.username,
                        blocker_avatar: blockerUser.avatar_url || '/uploads/default.png'
                    }));
                }

                return reply.send({ success: true, message: 'user_blocked' });
            } catch (err) {
                console.error('Error blocking user:', err);
                return reply.status(500).send({ success: false, error: 'db_access' });
            }
        });

        // Débloquer un utilisateur
        fastify.get('/api/unblock_user/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const blockedUserId = Number(request.params.id);

                // Vérifie si l'utilisateur est effectivement bloqué
                const existingBlock = await db.get(
                    "SELECT * FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?",
                    [request.user.id, blockedUserId]
                );
                if (!existingBlock) {
                    return reply.status(404).send({ success: false, error: 'user_not_blocked' });
                }

                // Débloque l'utilisateur
                await db.run(
                    "DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?",
                    [request.user.id, blockedUserId]
                );

                // Récupérer les infos des utilisateurs pour la notification
                const unblockerUser = await db.get("SELECT username, avatar_url FROM users WHERE id = ?", [request.user.id]);
                const unblockedUser = await db.get("SELECT username, avatar_url FROM users WHERE id = ?", [blockedUserId]);

                // Notifier l'utilisateur débloqué en temps réel
                const unblockedSocket = friendNotificationClients.get(blockedUserId);
                if (unblockedSocket && unblockedSocket.readyState === unblockedSocket.OPEN) {
                    unblockedSocket.send(JSON.stringify({
                        type: 'user_unblocked',
                        unblocker_id: request.user.id,
                        unblocker_username: unblockerUser.username,
                        unblocker_avatar: unblockerUser.avatar_url || '/uploads/default.png'
                    }));
                }

                return reply.send({ success: true, message: 'user_unblocked' });
            } catch (err) {
                console.error('Error unblocking user:', err);
                return reply.status(500).send({ success: false, error: 'db_access' });
            }
        });

        // Route pour récupérer l'historique des connexions
        fastify.get('/api/login_history', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const userId = request.user.id;
                const history = await db.all(
                    `SELECT browser, os, ip, created_at as date, session_id, token_hash 
                     FROM login_history 
                     WHERE user_id = ? 
                     ORDER BY created_at DESC 
                     LIMIT 20`,
                    [userId]
                );
                
                // Formatage des données pour le frontend (sans géolocalisation)
                const formattedHistory = history.map(entry => ({
                    browser: entry.browser || 'Unknown',
                    os: entry.os || 'Unknown',
                    ip: entry.ip || 'N/A',
                    date: entry.date,
                    sessionId: entry.session_id,
                    token: entry.token_hash // Hash du token pour l'identification
                }));
                
                return reply.send({ 
                    success: true, 
                    history: formattedHistory 
                });
            } catch (err) {
                console.error('Error fetching login history:', err);
                return reply.status(500).send({ 
                    success: false, 
                    error: 'Failed to fetch login history' 
                });
            }
        });

        // WebSocket pour l'activité de connexion récente
        fastify.get('/api/ws/recent_logins', { websocket: true }, async (socket, req) => {
            recentLoginClients.add(socket);
            
            // Envoie la liste des connexions récentes au nouveau client
            try {
                const recentLogins = await db.all(
                    `SELECT u.username, u.last_online 
                     FROM users u 
                     WHERE u.last_online > datetime('now', '-1 hour') 
                     ORDER BY u.last_online DESC 
                     LIMIT 10`
                );
                
                socket.send(JSON.stringify({
                    type: 'recent_logins',
                    recent: recentLogins
                }));
            } catch (err) {
                console.error('Error fetching recent logins:', err);
            }
            
            socket.on('close', () => {
                recentLoginClients.delete(socket);
            });
            
            socket.on('error', () => {
                recentLoginClients.delete(socket);
            });
        });

        // Route pour supprimer le compte utilisateur (nécessite mot de passe)
        fastify.post('/api/delete_account', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const { password } = request.body || {};
                if (!password) {
                    return reply.status(400).send({ success: false, error: 'Password is required' });
                }
                // Vérifie le mot de passe
                const user = await db.get("SELECT password FROM users WHERE id = ?", [request.user.id]);
                if (!user || !user.password) {
                    return reply.status(404).send({ success: false, error: 'User not found' });
                }
                const passwordIsValid = await bcrypt.compare(password, user.password);
                if (!passwordIsValid) {
                    return reply.status(401).send({ success: false, error: 'Incorrect password' });
                }

                // Supprime l'utilisateur et toutes les données associées (optionnel: à adapter selon vos besoins)
                await db.run("DELETE FROM users WHERE id = ?", [request.user.id]);
                await db.run("DELETE FROM friends WHERE user_id = ? OR friend_id = ?", [request.user.id, request.user.id]);
                await db.run("DELETE FROM blocked_users WHERE user_id = ? OR blocked_user_id = ?", [request.user.id, request.user.id]);
                await db.run("DELETE FROM login_history WHERE user_id = ?", [request.user.id]);
                // TODO: supprimer d'autres données liées si besoin

                // Déconnecte l'utilisateur (supprime les cookies)
                return reply
                    .clearCookie('token', {
                        path: '/',
                        httpOnly: true,
                        secure: true,
                        sameSite: 'none'
                    })
                    .clearCookie('session_id', {
                        path: '/',
                        httpOnly: false,
                        secure: true,
                        sameSite: 'none'
                    })
                    .send({ success: true });
            } catch (err) {
                console.error('Error deleting account:', err);
                return reply.status(500).send({ success: false, error: 'Failed to delete account' });
            }
        });



        // Récupère toutes les informations sur les matchs et stats des matchs d'un joueur
        fastify.get('/api/matchs_profile/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {

                const id_profile = Number(request.params.id);

                // Vérifie si les utilisateurs sont amis
                try {

                    // Vérifie si l'user id existe
                    const user = await db.get("SELECT * FROM users WHERE id = ?", [id_profile]);
                    if (!user)
                    {
                        return ({success:false, error:"user_not_found"});
                    }

                    // Get both Pong and Connect4 matches
                    const pongMatches = await db.all(
                        "SELECT * FROM matchs_history WHERE (first_player = ? OR second_player = ?) AND bypass = false AND winner_id IS NOT NULL",
                        [id_profile, id_profile]
                    );
                    
                    const connect4Matches = await db.all(
                        "SELECT * FROM connect4_online_matchs_history WHERE (first_player = ? OR second_player = ?) AND bypass = false AND winner_id IS NOT NULL",
                        [id_profile, id_profile]
                    );

                    // Combine all matches
                    const allMatches = [
                        ...(pongMatches || []).map(match => ({ ...match, game_type: 'pong' })),
                        ...(connect4Matches || []).map(match => ({ ...match, game_type: 'connect4' }))
                    ];

                    if (!allMatches || allMatches.length === 0) {
                        return ({success : false, error : "no_match"});
                    }
                    else
                    {
                        // Au moins un match joué
                        let nb_played = 0;
                        let nb_won = 0;
                        const new_matchs = [];
                        for (const match of allMatches)
                        {
                            nb_played++;
                            if (Number(match.winner_id) === id_profile)
                            {
                                nb_won++;
                            }

                            const new_match_one = {};

                            
                            // Je récupère le nom de l'autre joueur
                            if (Number(match.first_player) == id_profile)
                            {
                                const user = await db.get("SELECT * FROM users WHERE id = ?", [match.second_player]);
                                if (user)
                                {
                                    new_match_one.other_player = user.username;

                                } else
                                {
                                    new_match_one.other_player = "Unknown";
                                }
                            }
                            else
                            {
                                const user = await db.get("SELECT * FROM users WHERE id = ?", [match.first_player]);
                                if (user)
                                {
                                    new_match_one.other_player = user.username;

                                } else
                                {
                                    new_match_one.other_player = "Unknown";
                                }
                            }


                            // je récupère le nom de la room
                            const room = await db.get("SELECT * FROM rooms WHERE id = ?", [match.id_room]);
                            new_match_one.room_name = room ? room.name : "Unknown Room";

                            // Je récupère la date
                            new_match_one.date = match.created_at;

                            // Je récupère le résulat du match
                            if (Number(match.winner_id) == Number(id_profile))
                            {
                                new_match_one.won = true;
                            }
                            else
                            {
                                new_match_one.won = false;
                            }

                            // Je récupère l'id du match
                            new_match_one.match_id = match.id;

                            // Add game type
                            new_match_one.game_type = match.game_type;

                            // Je met l'objet du match dans un tableau
                            new_matchs.push(new_match_one);

                        }

                        let percent_won;
                        let percent_lost;
                        if (nb_played != 0)
                        {
                            percent_won = Math.round((nb_won / nb_played) * 100);
                            percent_lost = 100 - percent_won;
                        }
                        else
                        {
                            percent_won = 0;
                            percent_lost = 0;
                        }

                        return ({success:true, nb_played, nb_won, percent_won, percent_lost, matchs: new_matchs});
                        // return "matchs";
                    }


                } catch (err)
                {
                    return ({success : false, error : "db_access"});
                }
        });


        // Récupère toutes les informations sur les matchs et stats des matchs d'un joueur
        fastify.get('/api/connect4/matchs_profile/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {

                const id_profile = Number(request.params.id);

                // Vérifie si les utilisateurs sont amis
                try {

                    // Vérifie si l'user id existe
                    const user = await db.get("SELECT * FROM users WHERE id = ?", [id_profile]);
                    if (!user)
                    {
                        return ({success:false, error:"user_not_found"});
                    }


                    const matchs = await db.all(
                        "SELECT * FROM connect4_online_matchs_history WHERE (first_player = ? OR second_player = ?) AND bypass = false AND winner_id IS NOT NULL",
                        [id_profile, id_profile]
                    );
                    if (!matchs) {
                        return ({success : false, error : "no_match"});
                    }
                    else
                    {
                        // Au moins un match joué
                        let nb_played = 0;
                        let nb_won = 0;
                        const new_matchs = [];
                        for (const match of matchs)
                        {
                            nb_played++;
                            if (Number(match.winner_id) === id_profile)
                            {
                                nb_won++;
                            }

                            const new_match_one = {};

                            
                            // Je récupère le nom de l'autre joueur
                            if (Number(match.first_player) == id_profile)
                            {
                                const user = await db.get("SELECT * FROM users WHERE id = ?", [match.second_player]);
                                if (user)
                                {
                                    new_match_one.other_player = user.username;

                                } else
                                {
                                    new_match_one.other_player = "Unknown";
                                }
                            }
                            else
                            {
                                const user = await db.get("SELECT * FROM users WHERE id = ?", [match.first_player]);
                                if (user)
                                {
                                    new_match_one.other_player = user.username;

                                } else
                                {
                                    new_match_one.other_player = "Unknown";
                                }
                            }


                            // je récupère le nom de la room
                            const room = await db.get("SELECT * FROM rooms WHERE id = ?", [match.id_room]);
                            new_match_one.room_name = room.name;

                            // Je récupère la date
                            new_match_one.date = match.created_at;

                            // Je récupère le résulat du match
                            if (Number(match.winner_id) == Number(id_profile))
                            {
                                new_match_one.won = true;
                            }
                            else
                            {
                                new_match_one.won = false;
                            }

                            // Je récupère l'id du match
                            new_match_one.match_id = match.id;

                            // Je met l'objet du match dans un tableau
                            new_matchs.push(new_match_one);

                        }

                        let percent_won;
                        let percent_lost;
                        if (nb_played != 0)
                        {
                            percent_won = Math.round((nb_won / nb_played) * 100);
                            percent_lost = 100 - percent_won;
                        }
                        else
                        {
                            percent_won = 0;
                            percent_lost = 0;
                        }

                        return ({success:true, nb_played, nb_won, percent_won, percent_lost, matchs: new_matchs});
                        // return "matchs";
                    }


                } catch (err)
                {
                    return ({success : false, error : "db_access"});
                }
        });


        // Ajouter un ami (crée une demande d'ami)
        fastify.get('/api/add_friend/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const friendId = Number(request.params.id);

                // Vérifie si l'utilisateur est bloqué (dans les deux sens)
                const isBlocked = await db.get(
                    "SELECT * FROM blocked_users WHERE (user_id = ? AND blocked_user_id = ?) OR (user_id = ? AND blocked_user_id = ?)",
                    [request.user.id, friendId, friendId, request.user.id]
                );
                if (isBlocked) {
                    return reply.status(403).send({ success: false, error: 'user_blocked' });
                }

                // Vérifie si une demande existe déjà
                const existingRequest = await db.get(
                    "SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'",
                    [request.user.id, friendId]
                );
                if (existingRequest) {
                    return reply.status(409).send({ success: false, error: 'friend_request_already_sent' });
                }

                // Vérifie si les utilisateurs sont déjà amis
                const existingFriend = await db.get(
                    "SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'accepted'",
                    [request.user.id, friendId]
                );
                if (existingFriend) {
                    return reply.status(409).send({ success: false, error: 'already_friends' });
                }

                // Crée une demande d'ami
                await db.run(
                    "INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')",
                    [request.user.id, friendId]
                );

                // Notifie l'utilisateur cible en temps réel (WebSocket)
                const targetSocket = friendNotificationClients.get(friendId);
                if (targetSocket && targetSocket.readyState === targetSocket.OPEN) {
                    targetSocket.send(JSON.stringify({
                        type: 'friend_request',
                        from: request.user.id,
                        username: request.user.username,
                        avatar_url: request.user.avatar_url || '/uploads/default.png'
                    }));
                }

                return reply.send({ success: true, message: 'friend_request_sent' });
            } catch (err) {
                console.error('Error in /api/add_friend:', err);
                return reply.status(500).send({ success: false, error: 'db_access' });
            }
        });

        // Accepter une demande d'ami
        fastify.get('/api/accept_friend/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const friendId = Number(request.params.id);

                // Vérifie si une demande d'ami en attente existe
                const pendingRequest = await db.get(
                    "SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'",
                    [friendId, request.user.id]
                );
                if (!pendingRequest) {
                    return reply.status(404).send({ success: false, error: 'no_pending_request' });
                }

                // Met à jour le statut à 'accepted'
                await db.run(
                    "UPDATE friends SET status = 'accepted' WHERE user_id = ? AND friend_id = ?",
                    [friendId, request.user.id]
                );

                // Crée la relation réciproque
                await db.run(
                    "INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'accepted')",
                    [request.user.id, friendId]
                );

                // Récupérer les infos de l'utilisateur qui accepte pour la notification
                const accepterUser = await db.get("SELECT username, avatar_url FROM users WHERE id = ?", [request.user.id]);

                // Notifie l'utilisateur qui avait envoyé la demande
                const senderSocket = friendNotificationClients.get(friendId);
                if (senderSocket) {
                    senderSocket.send(JSON.stringify({ 
                        type: 'friend_request_accepted', 
                        from: request.user.id,
                        username: accepterUser.username,
                        avatar_url: accepterUser.avatar_url || '/uploads/default.png'
                    }));
                }

                return reply.send({ success: true, message: 'friend_request_accepted' });
            } catch (err) {
                return reply.status(500).send({ success: false, error: 'db_access' });
            }
        });

        // Décliner une demande d'ami
        fastify.get('/api/decline_friend/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const friendId = Number(request.params.id);

                // Vérifie si une demande d'ami en attente existe
                const pendingRequest = await db.get(
                    "SELECT * FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'",
                    [friendId, request.user.id]
                );
                if (!pendingRequest) {
                    return reply.status(404).send({ success: false, error: 'no_pending_request' });
                }

                // Supprime la demande d'ami
                await db.run(
                    "DELETE FROM friends WHERE user_id = ? AND friend_id = ? AND status = 'pending'",
                    [friendId, request.user.id]
                );

                // Récupérer les infos de l'utilisateur qui refuse pour la notification
                const declinerUser = await db.get("SELECT username, avatar_url FROM users WHERE id = ?", [request.user.id]);

                //console.log('Sending decline notification to user:', friendId); // Debug log
                console.log('Available clients:', Array.from(friendNotificationClients.keys())); // Debug log

                // Notifie l'utilisateur qui avait envoyé la demande
                const senderSocket = friendNotificationClients.get(friendId);
                if (senderSocket && senderSocket.readyState === senderSocket.OPEN) {
                    //console.log('Sending WebSocket notification for decline'); // Debug log
                    senderSocket.send(JSON.stringify({
                        type: 'friend_request_declined',
                        from: request.user.id,
                        username: declinerUser.username,
                        avatar_url: declinerUser.avatar_url || '/uploads/default.png'
                    }));
                } else {
                    //console.log('No active WebSocket connection for user:', friendId); // Debug log
                }

                return reply.send({ success: true, message: 'friend_request_declined' });
            } catch (err) {
                console.error('Error declining friend request:', err);
                return reply.status(500).send({ success: false, error: 'db_access' });
            }
        });

        // Récupérer les demandes d'amis
        fastify.get('/api/friend_requests', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const requests = await db.all(
                    "SELECT f.user_id as senderId, u.username, u.avatar_url FROM friends f " +
                    "LEFT JOIN users u ON f.user_id = u.id " +
                    "WHERE f.friend_id = ? AND f.status = 'pending'",
                    [request.user.id]
                );
                return reply.send({ success: true, requests });
            } catch (err) {
                console.error('Error in /api/friend_requests:', err);
                return reply.status(500).send({ success: false, error: 'db_access' });
            }
        });

        // Récupère la liste d'amis (uniquement les amis acceptés)
        fastify.get('/api/friends', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const friends = await db.all(
                    `SELECT u.id, u.username, u.last_online, u.avatar_url
                     FROM friends f
                     JOIN users u ON f.friend_id = u.id
                     WHERE f.user_id = ? AND f.status = 'accepted'`,
                    [request.user.id]
                );

                // Add online status
                friends.forEach(friend => {
                    const online = new Date(friend.last_online).getTime() / 1000;
                    const now = Math.floor(new Date().getTime() / 1000);
                    friend.online = (now - online) < 60; // Online if last seen within 60 seconds
                });

                return reply.send({ success: true, friends });
            } catch (err) {
                return reply.status(500).send({ success: false, error: 'db_access' });
            }
        });

        // Send game invitation to a friend
        fastify.post('/api/invite_friend_game/:friendId', { preValidation: [fastify.authenticate] }, async (request, reply) => {
            try {
                const senderId = request.user.id;
                const friendId = parseInt(request.params.friendId);

                // Verify friendship exists
                const friendship = await db.get(
                    `SELECT COUNT(*) as count FROM friends 
                     WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) 
                     AND status = 'accepted'`,
                    [senderId, friendId, friendId, senderId]
                );

                if (friendship.count === 0) {
                    return reply.status(400).send({ success: false, error: 'not_friends' });
                }

                // Get sender info
                const sender = await db.get('SELECT username FROM users WHERE id = ?', [senderId]);
                
                // Send notification to friend via WebSocket
                const targetSocket = friendNotificationClients.get(friendId);
                if (targetSocket && targetSocket.readyState === 1) {
                    targetSocket.send(JSON.stringify({
                        type: 'game_invite',
                        from: senderId,
                        username: sender.username,
                        message: `${sender.username} invited you to play a game!`,
                        timestamp: new Date().toISOString()
                    }));
                }

                return reply.send({ success: true, message: 'Game invitation sent' });
            } catch (err) {
                console.error('Error sending game invitation:', err);
                return reply.status(500).send({ success: false, error: 'server_error' });
            }
        });
}

// Rien à changer ici pour la persistance de connexion via cookie JWT

module.exports = userRoutes;
module.exports.setupRecentLoginWS = function(fastify) {
    // Configuration déjà incluse dans userRoutes
};