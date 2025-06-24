// const db = new sqlite3.Database('./database_sql.db');

// // Permet de retourner une promesse (asynchrone) lors d'une requete sql au lieu d'un callback
// // En gros : me permet de faire un await sur une requete db.run par ex
// db.run = util.promisify(db.run);
// db.get = util.promisify(db.get);
// db.all = util.promisify(db.all);

// // Crée la table dans la bdd si elle n'existe pas
// (async () => {
//         await db.run(`CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar (255) DEFAULT NULL, started BOOLEAN NOT NULL DEFAULT FALSE, round INTEGER DEFAULT 0, finished BOOLEAN NOT NULL DEFAULT FALSE,  id_admin INTEGER NOT NULL, created_at DATETIME DEFAULT (datetime('now')))`);
//         await db.run(`CREATE TABLE IF NOT EXISTS rooms_players (id INTEGER PRIMARY KEY AUTOINCREMENT, id_player INTEGER NOT NULL, id_room INTEGER NOT NULL, is_admin BOOLEAN NOT NULL DEFAULT FALSE, eliminated BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME DEFAULT (datetime('now')))`);
// })();
