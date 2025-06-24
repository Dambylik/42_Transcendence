const sqlite3 = require('sqlite3').verbose();
const util = require('util');

const db = new sqlite3.Database('./database_sql.db');

// Promisify db methods
db.run = util.promisify(db.run);
db.get = util.promisify(db.get);
db.all = util.promisify(db.all);

// Crée la table messages si elle n'existe pas (avec sender_id)
(async () => {
  await db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT (datetime('now'))
    )
  `);
  // Ajoute la colonne sender_id si elle n'existe pas déjà (pour migration)
  const columns = await db.all(`PRAGMA table_info(messages)`);
  const hasSenderId = columns.some(col => col.name === 'sender_id');
  if (!hasSenderId) {
    await db.run(`ALTER TABLE messages ADD COLUMN sender_id INTEGER NOT NULL DEFAULT 1`);
  }
})();

// Crée la table users si elle n'existe pas
(async () => {
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      secret_totp VARCHAR(255) DEFAULT NULL,
      sub_google VARCHAR(255) DEFAULT NULL,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      avatar_url TEXT DEFAULT NULL,
      last_online DATETIME DEFAULT (datetime('now')),
      created_at DATETIME DEFAULT (datetime('now'))
    )
  `);
})();

// Ajout des colonnes elo, xp et level à la table users si elles n'existent pas
(async () => {
  await db.run(`
    ALTER TABLE users ADD COLUMN elo INTEGER DEFAULT 1000
  `).catch(() => {}); // Ignore l'erreur si la colonne existe déjà

  await db.run(`
    ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0
  `).catch(() => {});

  await db.run(`
    ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 0
  `).catch(() => {}); // Default level is now 0
})();

// Crée la table friends si elle n'existe pas
(async () => {
  await db.run(`
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      friend_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending' or 'accepted'
      created_at DATETIME DEFAULT (datetime('now')),
      UNIQUE(user_id, friend_id)
    )
  `);
})();

// Crée la table blocked_users si elle n'existe pas
(async () => {
  await db.run(`
    CREATE TABLE IF NOT EXISTS blocked_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      blocked_user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT (datetime('now')),
      UNIQUE(user_id, blocked_user_id)
    )
  `);
})();

// Crée la table friend_requests si elle n'existe pas
(async () => {
  await db.run(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending', -- 'pending', 'accepted', or 'declined'
      created_at DATETIME DEFAULT (datetime('now')),
      UNIQUE(sender_id, receiver_id)
    )
  `);
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

async function addMessage(senderId, content) {
  await db.run('INSERT INTO messages (sender_id, content) VALUES (?, ?)', [senderId, content]);
}

async function getMessages(limit = 50) {
  const rows = await db.all('SELECT * FROM messages ORDER BY created_at DESC LIMIT ?', [limit]);
  return rows.reverse();
}

async function updateLastOnline(userId) {
	await db.run("UPDATE users SET last_online = datetime('now') WHERE id = ?", [userId]);
}

async function addFriend(userId, friendId) {
  await db.run('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [userId, friendId]);
  await db.run('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [friendId, userId]);
}

async function removeFriend(userId, friendId) {
  await db.run('DELETE FROM friends WHERE user_id = ? AND friend_id = ?', [userId, friendId]);
}

async function blockUser(userId, blockedUserId) {
  await db.run('INSERT INTO blocked_users (user_id, blocked_user_id) VALUES (?, ?)', [userId, blockedUserId]);
}

async function unblockUser(userId, blockedUserId) {
  await db.run('DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?', [userId, blockedUserId]);
}

module.exports = { 
  addMessage, 
  getMessages, 
  updateLastOnline, 
  addFriend, 
  removeFriend, 
  blockUser, 
  unblockUser 
};
