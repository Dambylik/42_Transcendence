// Importations
// const fastify = require('fastify')({   logger: {
//     transport: {
//       target: 'pino-pretty',
//       options: {
//         translateTime: 'HH:MM:ss',
//         ignore: 'pid,hostname',
//         colorize : true
//       }
//     }
//   } });
const fastify = require('fastify')();
const cookie = require('@fastify/cookie');
const jwt = require('@fastify/jwt');
const cors = require('@fastify/cors');

// const global_vars = require('./utils/global.js');
// fastify.register(global_vars);

// Rend les conteneurs suivants globaux (accessibles depuis toutes les routes)
fastify.decorate("roomsMap", new Map());
fastify.decorate("matchsMap", new Map());
fastify.decorate("closedWsUsersSet", new Set());


// const speakeasy2 = require('speakeasy');
// fastify.register(speakeasy2);
// const qrcode = require('qrcode');

const multipart = require ('@fastify/multipart');
const { addMessage, getMessages } = require('./db');

// Ajouter la base de données SQLite
const sqlite3 = require('sqlite3').verbose();
const util = require('util');
const db = new sqlite3.Database('./database_sql.db');
db.run = util.promisify(db.run);
db.get = util.promisify(db.get);
db.all = util.promisify(db.all);

const SECRET_JWT = process.env.JWT_SECRET; // A mettre dans un fichier .env !!!!

// Mise en place du JWT
fastify.register(cookie);
// fastify.register(websocket);
fastify.register(multipart);
fastify.register(jwt, {
        secret: SECRET_JWT, // !!!!! ENV !!!
        cookie: {
          cookieName: "token",
          signed : false
        }
});

// Register CORS
fastify.register(cors, {
  origin:['https://localhost:4430'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

const websocketPlugin = require('@fastify/websocket');
fastify.register(websocketPlugin);





// const fastifyWebsocket = require('@fastify/websocket');
// fastify.register(fastifyWebsocket);

fastify.decorate("authenticate", async function(request, reply)
{
          // return reply.code(401).send({success:false, error:"dede"})
  try {
    const token = request.cookies.token;
      // console.log("cookie (token) : ", token);
      
      if (!token)
      {
        return reply.code(401).send({success:false, error:"no_token_in_cookie"})
      }

          const decoded = await request.jwtVerify(token);
          request.user = decoded;
          await fastify.updateLastOnline(decoded.id); // Update last_online here
  } catch (err)
  {
            return reply.code(401).send({success:false, error:"invalid_token"})
          reply.send(err);
          // reply.send("token non valide")
  }
});

// Update last_online timestamp
fastify.decorate("updateLastOnline", async function(userId) {
	try {
		await db.run("UPDATE users SET last_online = datetime('now') WHERE id = ?", [userId]);
	} catch (err) {
		fastify.log.error("Failed to update last_online:", err);
	}
});

// Importation de routes pour le module User Management
fastify.register(require('./routes/user_management.js'));
fastify.register(require('./routes/matchmaking.js'));
fastify.register(require('./routes/livechat.js'));
fastify.register(require('./routes/game.js'));

// Ajout : WebSocket pour l'activité de connexion récente
const userManagement = require('./routes/user_management.js');
if (userManagement.setupRecentLoginWS) {
  userManagement.setupRecentLoginWS(fastify);
}

// fastify.post('/api/create_room', {preValidation: [fastify.authenticate]}, async (request, reply) => {
//     return "test";
// });

// Route GET /api (pour tests uniquement)
fastify.get('/api', async (request, reply) => {
  return {
    status: 'ok',
    message: 'Bienvenue sur l\'API  TEST 2 PUIS 3'
  };
});

// track all ws chat clients
// const chatConnections = new Set();

// WebSocket chat endpoint (global chat)
// fastify.get('/api/ws/chat', { websocket: true }, (conn, req) => {
//   const sock = conn.socket;
//   chatConnections.add(sock);

//   // Envoie l'historique à la connexion
//   const history = getMessages();
//   sock.send(JSON.stringify(history));

//   sock.on('message', data => {
//     const content = data.toString();
//     if (!content) return;
//     addMessage(content);
//     const msg = { content, created_at: new Date().toISOString() };
//     // Diffuse à tous les clients connectés
//     chatConnections.forEach(c => {
//       if (c.readyState === c.OPEN) c.send(JSON.stringify(msg));
//     });
//   });

//   sock.on('close', () => chatConnections.delete(sock));
// });

// // optional HTTP fallback
// fastify.get('/api/messages', async (req, reply) => getMessages().reverse());
// fastify.post('/api/send_message', async (req, reply) => {
//   const { content } = req.body;
//   const senderId = req.user?.id;
//   if (!content || senderId == null) return reply.code(400).send({ success: false });
//   await addMessage(senderId, content);
//   return { success: true };
// });

// // track all ws clients
// const connections = new Set();

// Le serveur fonctionne sur toutes les interfaces réseau
fastify.listen({ port: 3010, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})