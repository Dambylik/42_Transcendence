const sqlite3 = require('sqlite3').verbose();
const util = require('util');

const db = new sqlite3.Database('./database_sql.db');
db.run = util.promisify(db.run);
db.get = util.promisify(db.get);
db.all = util.promisify(db.all);

// Crée la table messages si elle n'existe pas
(async () => {
  await db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT (datetime('now'))
  )`);
})();

// Crée la table private_messages si elle n'existe pas
(async () => {
  await db.run(`
    CREATE TABLE IF NOT EXISTS private_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now'))
    )
  `);
})();

// Liste globale des connexions WebSocket actives
let clients = new Set();

async function chatRoutes(fastify, options) {

  // Endpoint HTTP pour récupérer l'historique complet des messages
  fastify.get('/api/chat/history', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const messages = await db.all(
        `SELECT m.sender_id as senderId, m.content, m.created_at, u.username, 
         COALESCE(u.avatar_url, 'default.png') as avatar_url
         FROM messages m
         LEFT JOIN users u ON m.sender_id = u.id
         ORDER BY m.created_at ASC`
      );
      // Corrige les chemins d'avatar
      messages.forEach(msg => {
        // Always ensure avatar_url is a string and starts with /uploads/
        if (!msg.avatar_url || msg.avatar_url === 'default.png') {
          msg.avatar_url = '/uploads/default.png';
        } else if (
          !msg.avatar_url.startsWith('/') &&
          !msg.avatar_url.startsWith('http')
        ) {
          msg.avatar_url = '/uploads/' + msg.avatar_url;
        } else if (
          msg.avatar_url.startsWith('uploads/')
        ) {
          msg.avatar_url = '/' + msg.avatar_url;
        }
        // else: already starts with / or http
      });
      return reply.send(messages);
    } catch (err) {
      return reply.status(500).send({ success: false, error: 'db_access' });
    }
  });

  // WebSocket endpoint pour chat général
  fastify.get('/api/ws/chat', { websocket: true }, async (socket, req) => {
    // Vérifier que le cookie JWT est valide
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

    // Ajouter le client connecté à la liste globale (évite les doublons)
    clients.add(socket);

    // Envoie l'historique complet (ordre ancien → récent)
    try {
      const history = await db.all(
        `SELECT m.sender_id as senderId, m.content, m.created_at, u.username, 
         COALESCE(u.avatar_url, 'default.png') as avatar_url
         FROM messages m
         LEFT JOIN users u ON m.sender_id = u.id
         ORDER BY m.created_at ASC`
      );
      history.forEach(msg => {
        if (msg.avatar_url && !msg.avatar_url.startsWith('/') && !msg.avatar_url.startsWith('http')) {
          msg.avatar_url = '/uploads/' + msg.avatar_url;
        } else if (!msg.avatar_url || msg.avatar_url === 'default.png') {
          msg.avatar_url = '/uploads/default.png';
        }
      });
      socket.send(JSON.stringify(history));
    } catch (err) {
      // ignore erreur
    }

    socket.on('message', async (message) => {
      if (message.toString() === "ping") return; // Ignore keepalive ping
      const content = message.toString().slice(0, 1000); // limite la taille
      if (!content) return;
      // Stocke le message dans la base
      let msgObj = {
        senderId: user.id,
        content,
        created_at: new Date().toISOString()
      };
      try {
        await db.run(
          "INSERT INTO messages (sender_id, content, created_at) VALUES (?, ?, ?)",
          [msgObj.senderId, msgObj.content, msgObj.created_at]
        );
        // Ajoute username/avatar_url pour diffusion
        const userRow = await db.get("SELECT username, avatar_url FROM users WHERE id = ?", [user.id]);
        msgObj.username = userRow?.username || 'Unknown';
        if (userRow?.avatar_url) {
          if (
            userRow.avatar_url.startsWith('http') ||
            userRow.avatar_url.startsWith('/') ||
            userRow.avatar_url.startsWith('uploads/')
          ) {
            msgObj.avatar_url = userRow.avatar_url.startsWith('/') ? userRow.avatar_url : '/' + userRow.avatar_url;
          } else {
            msgObj.avatar_url = '/uploads/' + userRow.avatar_url;
          }
        } else {
          msgObj.avatar_url = '/uploads/default.png';
        }
      } catch (err) {
        msgObj.username = 'Unknown';
        msgObj.avatar_url = '/uploads/default.png';
      }
      // Diffuse à tous les clients connectés
      const broadcastMessage = JSON.stringify(msgObj);
      for (let client of clients) {
        if (client.readyState === client.OPEN) {
          client.send(broadcastMessage);
        }
      }
    });

    socket.on('close', () => {
      clients.delete(socket);
    });

    socket.on('error', (err) => {
      // ignore
    });
  });

  // Récupérer l'historique des messages privés entre deux utilisateurs
  fastify.get('/api/private_chat/history/:targetId', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const targetId = Number(request.params.targetId);
    try {
      const messages = await db.all(
        `SELECT pm.sender_id as senderId, pm.receiver_id as receiverId, pm.content, pm.created_at, 
                u.username, COALESCE(u.avatar_url, 'default.png') as avatar_url
         FROM private_messages pm
         LEFT JOIN users u ON u.id = pm.sender_id
         WHERE (pm.sender_id = ? AND pm.receiver_id = ?)
            OR (pm.sender_id = ? AND pm.receiver_id = ?)
         ORDER BY pm.created_at ASC`,
        [userId, targetId, targetId, userId]
      );
      // Corrige les chemins d'avatar
      messages.forEach(msg => {
        if (msg.avatar_url && !msg.avatar_url.startsWith('/') && !msg.avatar_url.startsWith('http')) {
          msg.avatar_url = '/uploads/' + msg.avatar_url;
        } else if (!msg.avatar_url || msg.avatar_url === 'default.png') {
          msg.avatar_url = '/uploads/default.png';
        }
      });
      return reply.send(messages);
    } catch (err) {
      return reply.status(500).send({ success: false, error: 'db_access' });
    }
  });

  // WebSocket pour chat privé
  const privateClients = new Map(); // key: userId, value: Set of sockets

  fastify.get('/api/ws/private_chat/:targetId', { websocket: true }, async (socket, req) => {
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
    const userId = user.id;
    const targetId = Number(req.params.targetId);

    // --- NOUVEAU : Vérifie que les deux sont amis ---
    try {
      const friendship = await db.get(
        `SELECT 1 FROM friends WHERE user_id = ? AND friend_id = ?`,
        [userId, targetId]
      );
      if (!friendship) {
        socket.send(JSON.stringify({ success: false, error: "not_friends" }));
        socket.close();
        return;
      }
    } catch (err) {
      socket.send(JSON.stringify({ success: false, error: "db_error" }));
      socket.close();
      return;
    }
    // --- FIN NOUVEAU ---

    // Ajoute la socket à la map
    if (!privateClients.has(userId)) privateClients.set(userId, new Set());
    privateClients.get(userId).add(socket);

    socket.on('message', async (message) => {
      if (message.toString() === "ping") return; // Ignore keepalive ping
      const content = message.toString().slice(0, 1000);
      if (!content) return;
      // Stocke le message dans la base
      let msgObj = {
        senderId: userId,
        receiverId: targetId,
        content,
        created_at: new Date().toISOString()
      };
      try {
        await db.run(
          "INSERT INTO private_messages (sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, ?)",
          [msgObj.senderId, msgObj.receiverId, msgObj.content, msgObj.created_at]
        );
        const userRow = await db.get("SELECT username, avatar_url FROM users WHERE id = ?", [userId]);
        msgObj.username = userRow?.username || 'Unknown';
        if (userRow?.avatar_url) {
          if (
            userRow.avatar_url.startsWith('http') ||
            userRow.avatar_url.startsWith('/') ||
            userRow.avatar_url.startsWith('uploads/')
          ) {
            msgObj.avatar_url = userRow.avatar_url.startsWith('/') ? userRow.avatar_url : '/' + userRow.avatar_url;
          } else {
            msgObj.avatar_url = '/uploads/' + userRow.avatar_url;
          }
        } else {
          msgObj.avatar_url = '/uploads/default.png';
        }
      } catch (err) {
        msgObj.username = 'Unknown';
        msgObj.avatar_url = '/uploads/default.png';
      }
      // Envoie le message à l'expéditeur et au destinataire (si connecté)
      const sendTo = [userId, targetId];
      for (const uid of sendTo) {
        const sockets = privateClients.get(uid);
        if (sockets) {
          for (const ws of sockets) {
            if (ws.readyState === ws.OPEN) {
              ws.send(JSON.stringify(msgObj));
            }
          }
        }
      }
    });

    socket.on('close', () => {
      const set = privateClients.get(userId);
      if (set) set.delete(socket);
      if (set && set.size === 0) privateClients.delete(userId);
    });

    socket.on('error', (err) => {
      // ignore
    });
  });

}

// No changes needed here if db.js is fixed as above.

module.exports = chatRoutes;
