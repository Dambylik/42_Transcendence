const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { hash } = require('crypto');
const util = require('util');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const path = require('path');
const fs = require('fs');
// const fs = require('path');

// const multipart = require ('@fastify/multipart');

const { pipeline } = require ('stream/promises');
const { request } = require('http');


const {countPlayersInRoom, isAdminRoom, myRoomId, roomExists ,getCurrentMatchs, generateRound, getWsFromRoom, tournamentFinished, tournamentFinishedWithError, stop_tournament, stop_tournament_with_error, tournamentStarted, removeUserFromRoom, checkIfRoundEnded} = require('../utils/matchmaking.js');



const db = new sqlite3.Database('./database_sql.db');

// Fonction pour calculer le nouvel ELO
function calculateElo(winnerElo, loserElo, kFactor = 32) {
    const expectedScoreWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedScoreLoser = 1 - expectedScoreWinner;

    const newWinnerElo = Math.round(winnerElo + kFactor * (1 - expectedScoreWinner));
    const newLoserElo = Math.round(loserElo + kFactor * (0 - expectedScoreLoser));

    return { newWinnerElo, newLoserElo };
}

// Fonction pour mettre à jour l'XP et le niveau
async function updateXpAndLevel(userId, xpGained) {
    const user = await db.get("SELECT xp, level FROM users WHERE id = ?", [userId]);
    if (!user) return;

    const newXp = user.xp + xpGained;
    const newLevel = Math.floor(newXp / 100); // Start at level 0

    await db.run("UPDATE users SET xp = ?, level = ? WHERE id = ?", [newXp, newLevel, userId]);
}

// Permet de retourner une promesse (asynchrone) lors d'une requete sql au lieu d'un callback
// En gros : me permet de faire un await sur une requete db.run par ex
db.run = util.promisify(db.run);
db.get = util.promisify(db.get);
db.all = util.promisify(db.all);

// Crée la table dans la bdd si elle n'existe pas
(async () => {
        await db.run(`CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar (255) DEFAULT NULL, game_type varchar (50) DEFAULT 'pong', started BOOLEAN NOT NULL DEFAULT FALSE, round INTEGER DEFAULT 0, finished BOOLEAN NOT NULL DEFAULT FALSE, finished_with_error BOOLEAN NOT NULL DEFAULT FALSE, id_admin INTEGER NOT NULL, winner_id INTEGER DEFAULT 0, created_at DATETIME DEFAULT (datetime('now')))`);
        await db.run(`CREATE TABLE IF NOT EXISTS rooms_players (id INTEGER PRIMARY KEY AUTOINCREMENT, id_player INTEGER NOT NULL, id_room INTEGER NOT NULL, is_admin BOOLEAN NOT NULL DEFAULT FALSE, eliminated BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME DEFAULT (datetime('now')))`);
        await db.run(`CREATE TABLE IF NOT EXISTS matchs_history (id INTEGER PRIMARY KEY AUTOINCREMENT, first_player INTEGER, second_player INTEGER DEFAULT NULL, id_room INTEGER, winner_id INTEGER DEFAULT NULL, bypass BOOLEAN NOT NULL DEFAULT FALSE, round INTEGER DEFAULT 0, started BOOLEAN NOT NULL DEFAULT FALSE, first_player_connected BOOLEAN NOT NULL DEFAULT FALSE, second_player_connected BOOLEAN NOT NULL DEFAULT FALSE, gave_up BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME DEFAULT (datetime('now')))`);
        await db.run(`CREATE TABLE IF NOT EXISTS invitations_tournament (id INTEGER PRIMARY KEY AUTOINCREMENT, id_player INTEGER, id_room INTEGER, created_at DATETIME DEFAULT (datetime('now')))`);
        
        // Add game_type column to existing rooms table if it doesn't exist
        await db.run(`ALTER TABLE rooms ADD COLUMN game_type varchar(50) DEFAULT 'pong'`).catch(() => {}); // Ignore error if column exists
})();


async function matchmakingRoutes(fastify, options)
{



    //  Permet de vérifier si le tournoi a la room id est terminé (normalement)
    fastify.get('/api/tournament_finished/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        const room_id = request.params.id;

        try {
            const finished = await tournamentFinished(room_id);
            return ({success:true, finished:finished});
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }
    });


    //  Permet de vérifier si le tournoi a la room id est terminé SUITE A UNE ERREUR (deconnexion par ex)
    fastify.get('/api/tournament_finished_with_error/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        const room_id = request.params.id;

        try {
            const finished = await tournamentFinishedWithError(room_id);
            return ({success:true, finished:finished});
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }
    });


    //  Permet de vérifier si le tournoi a la room id a commencé
    fastify.get('/api/tournament_started/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        const room_id = request.params.id;

        try {
            const started = await tournamentStarted(room_id);
            return ({success:true, started:started});
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }
    });



    //  Vérifie si je me suis deconnecté brusquement (websocket room)
    fastify.get('/api/closed_ws_in_room', {preValidation: [fastify.authenticate]}, async (request, reply) => {
        if (fastify.closedWsUsersSet.has(Number(request.user.id)))
        {
            return ({success:true, closed:true});
        }
        else 
        {
            return ({success:true, closed:false});
        }
    });
//
    //  Retire l'user id des ws deconnectés brusquement
    fastify.get('/api/forgive_closed_ws_in_room', {preValidation: [fastify.authenticate]}, async (request, reply) => {
        fastify.closedWsUsersSet.delete(Number(request.user.id));
        return ({success:true});
    });



    /////// !!!! attention : je dois faire une verification de cookies par la
    //  Permet de créer une room, la personne qui crée la room devient admin
    fastify.post('/api/pong/create_room', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        console.log("created aaa");

        // Variables utilisées
        const { name, game_type = 'pong' } = request.body;
        let user_id = request.user.id; // par la suite
        // let user_id = 1; // request.user.id par la suite

        // Validate game_type
        if (game_type !== 'pong' && game_type !== 'connect4') {
            return ({success : false, error : "invalid_game_type"});
        }

        // Je vérifie si je ne suis pas déjà dans une room
        let in_room = false;
        try {
            id_room = await myRoomId(request.user.id);
            in_room = true;
        } catch (err)
        {
            in_room = false;
        }
        if (in_room)
        {
            return ({success : false, error : "already_in_room"});
        }

        // Je verifie si le nom de la room nest pas trop long
        if (name.length > 40)
        {
            return ({success : false, error : "name_too_long"});
        }


        // Crée la room dans la base de données
        try {
        console.log("created 2");

            await db.run("INSERT INTO rooms (name, game_type, started, finished, id_admin) VALUES (?, ?, ?, ?, ?)", [name, game_type, false, false, user_id]);
        } catch(err)
        {
            console.log("eerr crea");
            console.log(err);
            return ({success : false, error : "db_access"});
        }

        // Récupère l'id de la room créé
        let room_db;
        try {
            room_db = await db.get("SELECT * FROM rooms WHERE id_admin = ? ORDER BY id DESC LIMIT 1", [user_id]);
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }


        // Crée le contenu du cookie
        const room_cookie = {room_id:room_db.id, admin:true};

                console.log("created ok");


        // return fastify.roomsMap.get(123);
        return reply.setCookie('room_id', encodeURIComponent(JSON.stringify(room_cookie)), {
                httpOnly: false,
                secure : true,
                sameSite : 'Strict',
                path : '/'
        }).send({success: true, room_id:room_db.id, room_name: name, user_id : user_id, is_admin:true, game_type: game_type});

        
        // Pour décoder un cookie coté client :
        // JSON.parse(decodeURIComponent(lecookie)); // Je dois aussi créer une fonction pour séparer tous les cookies de document.cookie
    });
    fastify.post('/api/connect4/create_room', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        console.log("created aaa");

        // Variables utilisées
        const { name } = request.body;
        let user_id = request.user.id;

        // On force game_type à 'connect4'
        const game_type = 'connect4';

        // Je vérifie si je ne suis pas déjà dans une room
        let in_room = false;
        try {
            id_room = await myRoomId(request.user.id);
            in_room = true;
        } catch (err)
        {
            in_room = false;
        }
        if (in_room)
        {
            return ({success : false, error : "already_in_room"});
        }

        // Je verifie si le nom de la room nest pas trop long
        if (name.length > 40)
        {
            return ({success : false, error : "name_too_long"});
        }

        // Crée la room dans la base de données
        try {
            console.log("created 2");
            await db.run("INSERT INTO rooms (name, game_type, started, finished, id_admin) VALUES (?, ?, ?, ?, ?)", [name, game_type, false, false, user_id]);
        } catch(err)
        {
            console.log("eerr crea");
            console.log(err);
            return ({success : false, error : "db_access"});
        }

        // Récupère l'id de la room créé
        let room_db;
        try {
            room_db = await db.get("SELECT * FROM rooms WHERE id_admin = ? ORDER BY id DESC LIMIT 1", [user_id]);
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // Crée le contenu du cookie
        const room_cookie = {room_id:room_db.id, admin:true};

        console.log("created ok");

        return reply.setCookie('room_id', encodeURIComponent(JSON.stringify(room_cookie)), {
                httpOnly: false,
                secure : true,
                sameSite : 'Strict',
                path : '/'
        }).send({success: true, room_id:room_db.id, room_name: name, user_id : user_id, is_admin:true, game_type: game_type});

        // Pour décoder un cookie coté client :
        // JSON.parse(decodeURIComponent(lecookie)); // Je dois aussi créer une fonction pour séparer tous les cookies de document.cookie
    });

        fastify.get('/api/join_room/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {
            const user_id = request.user.id;
            const room_id = request.params.id;

            // Vérifie si la room existe et récupère son game_type
            let room;
            try {
                room = await db.get("SELECT * FROM rooms WHERE id = ?", [room_id]);
                if (!room) {
                    return ({success: false, error: "room_not_exists"});
                }
            } catch (err) {
                return ({success: false, error: "db_access"});
            }

            // Redirige vers la bonne route selon le game_type
            if (room.game_type === 'pong') {
                return fastify.inject({
                    method: 'GET',
                    url: `/api/pong/join_room/${room_id}`,
                    headers: request.headers,
                    cookies: request.cookies,
                    payload: request.body
                }).then(res => reply.send(JSON.parse(res.payload)));
            } else if (room.game_type === 'connect4') {
                return fastify.inject({
                    method: 'GET',
                    url: `/api/connect4/join_room/${room_id}`,
                    headers: request.headers,
                    cookies: request.cookies,
                    payload: request.body
                }).then(res => reply.send(JSON.parse(res.payload)));
            } else {
                return ({success: false, error: "invalid_game_type"});
            }
        });

    // Accepte la connexion WS admin pour la personne qui a créé la room
  fastify.get('/api/ws/join_room/:id', {websocket: true }, async (socket , req) => {

    // Vérifie si le joueur est bien connecté
    let user;
    try {
        if (req?.cookies?.token)
        {
            user = await fastify.jwt.verify(req.cookies.token);
        }
        else 
        {
            throw new Error("no cookie");
        }
    } catch (err)
    {
        console.log("erreur avec jwt" + err);
        socket.send(JSON.stringify({success:false, error:"cookie_jwt"}));
        socket.close();
        return ;
    }

    // Je récupère les données (a remplacer par contenu du cookie JWT par la suite)
    const user_id = Number(user.id);
    const room_id = Number(req.params.id);




    // VERIFICATION (A REVOIR)
    // Vérifie si la personnea bien les droits pour initier une connexion WS avec la room
    if (await roomExists(room_id))
    {
        // Je dois maintenant vérifier que 
        try {
            room_db = await db.get("SELECT * FROM rooms_players WHERE id_room = ? AND id_player = ? ORDER BY id DESC LIMIT 1", [room_id, user_id]);

            if (!room_db)
            {
                // La personne n'a pas le droit d'accéder a cette room
                return ;
            }

        } catch(err)
        {
                console.log("error db access join room ws");
        }
    }
    else
    {
        // La room n'existe pas
        return ;
    }

    // Je vérifie si le tournoi a déja commencé
    let room_test;
    try {
        room_test = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [room_id]);

        if (!(room_test))
        {
            return ({success : false, error : "room_not_exists"});
        }
        else
        {
            if (Number(room_test.round > 0))
            {
                return ;
                // Le tournoi a deja commencé
                // return ({success : false, error : "already_started"});
            }
        }

    } catch(err)
    {
        return ;
        // return ({success : false, error : "db_access"});
    }



    // Je crée l'entrée pour cette room dans un map global
    if (!fastify.roomsMap.has(Number(room_id)))
    {
        fastify.roomsMap.set(Number(room_id), []);
    }


    // Empeche de se connecter plus d'une fois au WS pour la room
    if (fastify.roomsMap.has(Number(room_id)))
    {
        // let room_actual_test = fastify.roomsMap.get(Number(id_room));
        const room = fastify.roomsMap.get(Number(room_id));
        for (const playertest of room)
        {
            if (Number(playertest.id_player) == Number(user_id))
            {
                // L'utilisateur est déja dans la map WS pour la room, je dois fermer ce WS et ne pas l'ajouter
                socket.close();
                return;
            }
        }


    }
    fastify.roomsMap.get(Number(room_id)).push({id_player:user_id, "ws" : socket});

    // Envoie message a tous les users dans la room pour indiquer qu'un utilisateur a bien rejoint
    const room = fastify.roomsMap.get(Number(room_id));
    const to_send = {success : true, cause:"user_joined"};
    for (const playertest of room)
    {
        playertest.ws.send(JSON.stringify(to_send));
    }

    socket.on('message', message => {
        // console.log
        console.log("ping recu d'un joueur dans la room");
    });

    /////// A TESTER POUR ERROR !!!!!
    socket.on('error', async (err) => {


        try {

            // A FAIRE : si le joueur est l'admin alors on vire tout le monde
            if (await isAdminRoom(Number(user_id), Number(room_id)) && (await tournamentStarted(Number(room_id))) == false)
            {
                console.log("is admin true ");
                await stop_tournament_with_error(fastify, Number(room_id));
                return ;
            }

            if ((await tournamentStarted(Number(room_id))) == false)
            {
                // Le tournoi n'a pas encore démarré
                await removeUserFromRoom(fastify, user_id, room_id);


                // Met dans un est l'id de l'utilisateur qui déco brusquement dans une room
                fastify.closedWsUsersSet.add(Number(user_id));

                console.log("un user a ete kick a cause dune erreur de connexion de son cote");
            }
            else
            {
                // A faire : deco tout le monde et arreter le tournoi !!!!!!!!!!!
                // console.log("deco tout le monde a faire");
                // await stop_tournament_with_error(fastify, Number(room_id));
                
                // Ejecter tout le monde UNIQUEMENT SI le tournoi ne s'est pas terminé normalement
                if (await tournamentFinished(Number(room_id)) == false)
                {
                    console.log("deco tout le monde a faire");
                    await stop_tournament_with_error(fastify, Number(room_id));
                }

            }

        } catch (err)
        {
            console.log("error db access tournamentstarted");
        }



        // try {
        //     await db.run("DELETE FROM rooms_players WHERE id_player = ? AND id_room = ?", [user_id, room_id]);
        // } catch(err)
        // {
        //     // return ({success : false, error : "db_access"});
        // }

        // // On indique aux autres joueurs dans la room que quelqu'un a quitté la room
        // const to_send_error = {success : true, cause:"user_left"};
        // for (new_player of room)
        // {
        //     if (new_player.id_player != user_id)
        //     {
        //         new_player.ws.send(JSON.stringify(to_send_error));
        //     }
        // }
    });



    socket.on('close', async (code, reason) => {


        try {
            // A FAIRE : si le joueur est l'admin alors on vire tout le monde
            if (await isAdminRoom(Number(user_id), Number(room_id)) && (await tournamentStarted(Number(room_id))) == false)
            {
                console.log("is admin true ");
                await stop_tournament_with_error(fastify, Number(room_id));
                return ;
            }



            if ((await tournamentStarted(Number(room_id))) == false)
            {
                // Le tournoi n'a pas encore démarré
                await removeUserFromRoom(fastify, user_id, room_id);

                // Met dans un est l'id de l'utilisateur qui déco brusquement dans une room
                fastify.closedWsUsersSet.add(Number(user_id));

                console.log("un user a ete kick a cause dune erreur de connexion de son cote");
            }
            else
            {
                // Ejecter tout le monde UNIQUEMENT SI le tournoi ne s'est pas terminé normalement
                if (await tournamentFinished(Number(room_id)) == false)
                {
                    console.log("deco tout le monde a faire");
                    await stop_tournament_with_error(fastify, Number(room_id));
                }
            }

        } catch (err)
        {
            console.log("error db access tournamentstarted");
        }


        // console.log("connexion fermee par le client" + code + " " + reason.toString());

        // try {
        //     await db.run("DELETE FROM rooms_players WHERE id_player = ? AND id_room = ?", [user_id, room_id]);
        // } catch(err)
        // {
        //     // return ({success : false, error : "db_access"});
        // }
        
        // // On indique aux autres joueurs dans la room que quelqu'un a quitté la room
        // const to_send_error = {success : true, cause:"user_left"};
        // for (new_player of room)
        // {
        //     if (new_player.id_player != user_id)
        //     {
        //         new_player.ws.send(JSON.stringify(to_send_error));
        //     }
        // }

    });
  });


    //  Permet de rejoindre une room de pong
    fastify.get('/api/pong/join_room/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // Je récupère les données (a remplacer par contenu du cookie JWT par la suite)
        const user_id = request.user.id; // A remplacer par 
        const room_id = request.params.id;


        // A FAIRE : verifier que la room existe et qu'on a le droit de la rejoindre

        // Vérifie si le tournoi a deja commencé et si c'est bien une room de pong
        let room_test;
        try {
            room_test = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [room_id]);

            if (!(room_test))
            {
                return ({success : false, error : "room_not_exists"});
            }
            else
            {
                // Vérifie si c'est bien une room de pong
                if (room_test.game_type !== 'pong') {
                    return ({success : false, error : "wrong_game_type"});
                }
                
                if (Number(room_test.round > 0))
                {
                    // Le tournoi a deja commencé
                    return ({success : false, error : "already_started"});
                }
            }

        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // Vérifie si je ne suis pas déja dans la room
        try {
            const in_room = await db.get("SELECT * FROM rooms_players WHERE id_room = ? AND id_player = ?", [room_id, user_id]);

            if (in_room)
            {
                return ({success : false, error : "already_in_room"});
            }

        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }



        // Ajoute une ligne dans la bdd pour indiquer qu'on a rejoint la room
        try {
            await db.run("INSERT INTO rooms_players (id_player, id_room, is_admin) VALUES (?, ?, ?)", [user_id, room_id, false]);
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // Récupère des infos sur la room rejointe
        let room_db;
        try {
            room_db = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [room_id]);

            if (!(room_db))
            {
                return ({success : false, error : "room_not_exists"});
            }

        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }


        // Crée le contenu du cookie
        const room_cookie = {room_id:room_db.id, admin:true};


        // return fastify.roomsMap.get(123);
        return reply.setCookie('room_id', encodeURIComponent(JSON.stringify(room_cookie)), {
                httpOnly: false,
                secure : true,
                sameSite : 'Strict',
                path : '/'
        }).send({success: true, room_id:room_db.id, room_name: room_db.name, user_id:user_id, game_type: room_db.game_type});

    });


    //  Permet de rejoindre une room de connect4
    fastify.get('/api/connect4/join_room/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // Je récupère les données (a remplacer par contenu du cookie JWT par la suite)
        const user_id = request.user.id;
        const room_id = request.params.id;

        // A FAIRE : verifier que la room existe et qu'on a le droit de la rejoindre

        // Vérifie si le tournoi a deja commencé et si c'est bien une room de connect4
        let room_test;
        try {
            room_test = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [room_id]);

            if (!(room_test))
            {
                return ({success : false, error : "room_not_exists"});
            }
            else
            {
                // Vérifie si c'est bien une room de connect4
                if (room_test.game_type !== 'connect4') {
                    return ({success : false, error : "wrong_game_type"});
                }
                
                if (Number(room_test.round > 0))
                {
                    // Le tournoi a deja commencé
                    return ({success : false, error : "already_started"});
                }
            }

        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // Vérifie si je ne suis pas déja dans la room
        try {
            const in_room = await db.get("SELECT * FROM rooms_players WHERE id_room = ? AND id_player = ?", [room_id, user_id]);

            if (in_room)
            {
                return ({success : false, error : "already_in_room"});
            }

        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // Ajoute une ligne dans la bdd pour indiquer qu'on a rejoint la room
        try {
            await db.run("INSERT INTO rooms_players (id_player, id_room, is_admin) VALUES (?, ?, ?)", [user_id, room_id, false]);
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // Récupère des infos sur la room rejointe
        let room_db;
        try {
            room_db = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [room_id]);

            if (!(room_db))
            {
                return ({success : false, error : "room_not_exists"});
            }

        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // Crée le contenu du cookie
        const room_cookie = {room_id:room_db.id, admin:true};

        // return fastify.roomsMap.get(123);
        return reply.setCookie('room_id', encodeURIComponent(JSON.stringify(room_cookie)), {
                httpOnly: false,
                secure : true,
                sameSite : 'Strict',
                path : '/'
        }).send({success: true, room_id:room_db.id, room_name: room_db.name, user_id:user_id, game_type: room_db.game_type});

    });

    // Envoyé par le createur de la room : génère les premiers matchs et envoie une notif a tous ceux qui doivent jouer
    fastify.get('/api/start/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        let id_room;

        try {
            id_room = await myRoomId(request.user.id);
            console.log(" my id room = "  + id_room);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }


        // A FAIRE  :
        //  verifier que l'id existe dans la base de données
        // vrifier que l'id est celui de la personne qui a créé la room

        // VERIFICATION (A REVOIR)
        // Vérifie si la personnea bien les droits pour initier une connexion WS avec la room
        if (await roomExists(id_room))
        {
            const user_id = request.user.id;
            // Je dois maintenant vérifier que 
            try {
                room_db = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [id_room]);

                if (room_db)
                {
                    if (Number(room_db.id_admin) != Number(user_id))
                    {
                        // Je n'ai pas les droits
                        return ({success:false, error:"not_admin"});
                    }
                }

            } catch(err)
            {
                return ({success:false, error:"db_access"});
            }
        }
        else
        {
            // La room n'existe pas
            return ({success:false, error:"room_not_exists"});
            // return ;
        }

        // Verifie si il y a au moins deux joueurs
        try {
            const nb_players = await countPlayersInRoom(id_room);
            if (nb_players <= 1)
            {
                return ({success:false, error:"not_enough_players"});
            }
        } catch (err)
        {
            return ({success:false, error:"db_access"});
        }



        try {
            // Genere les matchs d'un round 
            await generateRound(fastify, id_room);

            // Envoie une message ws a tous les joueurs de la room pour actualiser et afficher la liste des matchs 1v1
            const tabl_matchs = await getCurrentMatchs(id_room);
            const room = fastify.roomsMap.get(Number(id_room));
            for (const player of room)
            {
                player.ws.send(JSON.stringify({success:true, cause:"list_matchs", matchs:tabl_matchs}));
            }

            // Supprime les invitations
            try {
                await db.run("DELETE FROM invitations_tournament WHERE id_room = ?", [id_room]);
            } catch(err)
            {
                return ({success : false, error : "db_access"});
            }


        } catch (err)
        {
            return ({success:false, error:"generated_round_error"});
        }
        return ({success:true});
    });


    //  Récupère la liste de sjoueurs d'une room (!!!!! A FAIRE : verifier si la room existe)
    fastify.get('/api/rooms_players/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {
        
        // Tableau qui contient les infos des joueurs
        let room_id;
        let tabl_players = [];


        try {
            room_id = await myRoomId(request.user.id);
            // console.log(" my id room = "  + room_id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }


        // A FAIRE :
            // Verifier que l'id de la room existe dans la base de données
            //

        // VERIFICATION (A REVOIR)
        if (await roomExists(room_id))
        {
            // La room existe
        }
        else
        {
            // La room n'existe pas
            return ({success:false, error:"room_not_exists"});
            // return ;
        }


        // Récupère la liste des joueurs dans la room
        let room_db;
        try {
            room_db = await db.all("SELECT * FROM rooms_players WHERE id_room = ?", [room_id]);
            for (const line of room_db)
            {
                let user = await db.get("SELECT * FROM users WHERE id = ?", [line.id_player]);
                tabl_players.push({user_id: user.id, username: user.username});
            }
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // Renvoie un JSON contenant le tableau avec tous les joueurs
        return (JSON.stringify({success:true, tabl_players}));

    });


    //  Supprime un joueur de la room (id fait référence a l'id du joueur à rejeter)
    fastify.get('/api/reject_from_room/:id_player/:id_room', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        const user_id_to_reject = Number(request.params.id_player);
        let room_id;
        const user_id = request.user.id;


        try {
            room_id = await myRoomId(request.user.id);
            // console.log(" my id room = "  + room_id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }


        // A FAIRE : verifier si la personne a bien les droits d'effectuer cette action
            // Verifier si id_room existe dans la table rooms
            // Verifier si user_id_to_reject existe dans la table users
            // Verifier si user_id_to_reject est dans la room (rooms_players)
            // Verifier si le user_id est bien admin dans rooms
        if (await roomExists(room_id))
        {
            // Je dois maintenant vérifier que 
            try {
                room_db = await db.get("SELECT * FROM rooms_players WHERE  id_player = ? AND id_room = ? ORDER BY id DESC LIMIT 1", [user_id_to_reject, Number(room_id)]);

                if (room_db)
                {
                    // Le joueur a ejecter est bien dans la room

                    // Je dois vérifier si le joueur qui effectue la requet GET est l'admin
                        admin = await db.get("SELECT * FROM rooms WHERE id = ? AND id_admin = ? ORDER BY id DESC LIMIT 1", [Number(room_id), Number(user_id)]);
                        if (admin)
                        {
                            // La personne est bien admin de la room
                        }
                        else
                        {
                            return ({success:false, error:"not_admin"});
                        }
                }
                else
                {
                    return ({success:false, error:"user_not_in_room"});
                }

            } catch(err)
            {
                return ({success:false, error:"db_access"});
            }
        }
        else
        {
            // La room n'existe pas
            return ({success:false, error:"room_not_exists"});
            // return ;
        }


        // Je supprime l'entrée dans la table rooms_players avec id_player
        try {
            await db.run("DELETE FROM rooms_players WHERE id_player = ? AND id_room = ?", [user_id_to_reject, room_id]);
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // J'envoie une notification via ws a tous les joueurs présents dans la room
        if (fastify.roomsMap.has(Number(room_id)))
        {        
            const room = fastify.roomsMap.get(Number(room_id));
            for (const playertest of room)
            {
                playertest.ws.send(JSON.stringify({success:true, cause:"kick", id_player:user_id_to_reject}));
            }
        }

        // Je coupe la connexion du WS
        const room = fastify.roomsMap.get(Number(room_id));
        for (const playertest of room)
        {
            if (playertest.id_player == user_id_to_reject)
            {
                playertest.ws.close();
                fastify.log.info("CONNEXION WS COUPPE POUR UN CLIENT");
            }
        }

        // J'enleve le joueur de la map rooms
        const new_array = room.filter(user => Number(user.id_player) != Number(user_id_to_reject)); // Fonctionne
        console.log("ancien taille du map : " + fastify.roomsMap.get(Number(room_id)).length );
        fastify.roomsMap.set(Number(room_id), new_array);
        console.log("nouveau taille du map : " + fastify.roomsMap.get(Number(room_id)).length);
        fastify.log.info("Ancien map supprimé puis nouveau tableau filtré sans le ws kick");

        return ({success: true});
    });


    //  Detruit la room en expulsant tout le monde
    fastify.get('/api/close_room/:id_room', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        let room_id;

        try {
            room_id = await myRoomId(request.user.id);
            // console.log(" my id room = "  + room_id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }


        // A FAIRE :
            // Verifier si id_room existe
            // Verifier si user_id (moi) si je suis admin de la room


        const user_id = request.user.id;
        if (await roomExists(room_id))
        {
            // Je dois maintenant vérifier que 
            try {

                // Je dois vérifier si le joueur qui effectue la requet GET est l'admin
                    admin = await db.get("SELECT * FROM rooms WHERE id = ? AND id_admin = ? ORDER BY id DESC LIMIT 1", [Number(room_id), Number(user_id)]);
                    if (admin)
                    {
                        // La personne est bien admin de la room
                    }
                    else
                    {
                        return ({success:false, error:"not_admin"});
                    }

            } catch(err)
            {
                return ({success:false, error:"db_access"});
            }
        }
        else
        {
            // La room n'existe pas
            return ({success:false, error:"room_not_exists"});
            // return ;
        }





        // Je supprime l'entrée dans la table rooms_players avec id_player
        try {
            await db.run("DELETE FROM rooms_players WHERE id_room = ?", [room_id]);
            await db.run("UPDATE rooms SET finished_with_error = true WHERE id = ?", [room_id]);
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // J'envoie une notification via ws a tous les joueurs présents dans la room ET je close le ws
        if (fastify.roomsMap.has(Number(room_id)))
        {        
            const room = fastify.roomsMap.get(Number(room_id));
            for (const playertest of room)
            {
                playertest.ws.send(JSON.stringify({success:true, cause:"kick", id_player:playertest.id_player}));
                playertest.ws.close();
            }
        }

        // Je supprime la room (variable map globale)
        fastify.roomsMap.delete(Number(room_id));

        return ({success: true});
    });





    // POUR TESTS UNIQUEMENT !!!!!
    fastify.get('/api/ws/test', {websocket: true }, async (socket , req) => {



    
    // socket.send("test" + user.id);

    // SocketAddress.close(); // Pour fermer la connexion avec le client


    socket.on('message', message => {
        console.log("recu du client TEST");
    })

    socket.on('error', (err) => {

    });

    // socket.on('close', () => {
    //     console.log("connexion fermee par le client");
    // });
    socket.on('close', (code, reason) => {
        console.log("connexion fermee par le client" + code + " " + reason.toString());
    });
  });


// Route pour enregistrer le résultat d'un match
fastify.post('/api/match/result', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    const { matchId, winnerId } = request.body;

    if (!matchId || !winnerId) {
        return reply.status(400).send({ success: false, error: "missing_parameters" });
    }

    try {
        // Récupère les informations du match
        const match = await db.get("SELECT * FROM matchs_history WHERE id = ?", [matchId]);
        if (!match) {
            return reply.status(404).send({ success: false, error: "match_not_found" });
        }

        const firstPlayer = await db.get("SELECT id, elo FROM users WHERE id = ?", [match.first_player]);
        const secondPlayer = await db.get("SELECT id, elo FROM users WHERE id = ?", [match.second_player]);

        if (!firstPlayer || !secondPlayer) {
            return reply.status(404).send({ success: false, error: "player_not_found" });
        }

        // Calcul des nouveaux ELO
        const { newWinnerElo, newLoserElo } = calculateElo(
            winnerId === firstPlayer.id ? firstPlayer.elo : secondPlayer.elo,
            winnerId === firstPlayer.id ? secondPlayer.elo : firstPlayer.elo
        );

        // Met à jour les ELO
        if (winnerId === firstPlayer.id) {
            await db.run("UPDATE users SET elo = ? WHERE id = ?", [newWinnerElo, firstPlayer.id]);
            await db.run("UPDATE users SET elo = ? WHERE id = ?", [newLoserElo, secondPlayer.id]);
        } else {
            await db.run("UPDATE users SET elo = ? WHERE id = ?", [newWinnerElo, secondPlayer.id]);
            await db.run("UPDATE users SET elo = ? WHERE id = ?", [newLoserElo, firstPlayer.id]);
        }

        // Met à jour l'XP et le niveau
        await updateXpAndLevel(winnerId, 50); // Le gagnant gagne 50 XP
        await updateXpAndLevel(winnerId === firstPlayer.id ? secondPlayer.id : firstPlayer.id, 20); // Le perdant gagne 20 XP

        // Marque le match comme terminé
        await db.run("UPDATE matchs_history SET winner_id = ? WHERE id = ?", [winnerId, matchId]);

        return reply.send({ success: true });
    } catch (err) {
        return reply.status(500).send({ success: false, error: "db_access" });
    }
});

    //  Je récupère la liste des prochains matchs pour une room
    fastify.get('/api/matchs_current/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        let room_id;
        let tabl_matchs = [];

        try {
            room_id = await myRoomId(request.user.id);
            // console.log(" my id room = "  + room_id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }



        // A FAIRE : verifier que la room existe
        if (await roomExists(room_id))
        {

        }
        else
        {
            // La room n'existe pas
            return ({success:false, error:"room_not_exists"});
            // return ;
        }




        // Récupère des infos sur la room rejointe
        let room_db;
        try {
            tabl_matchs = await getCurrentMatchs(room_id);
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }
        return (JSON.stringify({success:true, matchs:tabl_matchs}));
    });


    

    // A FAIRE : Verifie si je peux rejoindre un match 1v1 (id = id room)
    fastify.get('/api/can_play/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // Je récupère les données (a remplacer par contenu du cookie JWT par la suite)
        const user_id = request.user.id;
        let room_id;


        try {
            room_id = await myRoomId(request.user.id);
            // console.log(" my id room = "  + room_id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }


        // A FAIRE:
            // Verifier que la room existe
        // A FAIRE : verifier que la room existe
        if (await roomExists(room_id))
        {

        }
        else
        {
            // La room n'existe pas
            return ({success:false, error:"room_not_exists"});
            // return ;
        }


        try {
            let tabl_matchs = await getCurrentMatchs(Number(room_id));
            for (const match_current of tabl_matchs)
            {
                if ( (Number(match_current.first_player_id) == Number(user_id) || Number(match_current.second_player_id) == Number(user_id)) && match_current.finished == false) 
                {
                    // Je peux rejoindre un match 1v1 immédiatement
                    return (JSON.stringify({success:true, can_play:true ,match_id:match_current.id_match}));
                }
            }
            // Je ne peux pas rejoindre de match 1v1 immédiatement
            return (JSON.stringify({success:true, can_play:false ,match_id:0}));
        } catch (err)
        {
            return ({success : false, error : "db_access"});
        }
    });





    // A FAIRE : vérifie si je suis dans une room, et si le tournoi a commencer
    // A FINIR !!! je dois mettre started = true dans une route lorsque le tournoi commence
    fastify.get('/api/my_status', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // Je récupère les données (a remplacer par contenu du cookie JWT par la suite)
        const user_id = request.user.id; // A remplacer par 
        // const room_id = request.params.id;

        let in_room = false;


        let room_db = await db.get("SELECT * FROM rooms_players WHERE id_player = ?", [user_id]);
        if (room_db)
        {
            in_room = true;
            // let room_db_second = await db.get("SELECT * FROM rooms_player WHERE id_player = ?", [room_db.id_room]);

        }


        // 1) je la ligne ou rooms_player  a un player = mon id
        // 2) je  regarde ensuite si la partie a commencée (started = true) dans la table rooms


        return (JSON.stringify({success:true}));
    });





  
    //  Retourne true si la room existe
    fastify.get('/api/room_exists/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        const room_id = request.params.id;
        let tabl_matchs = [];

        // A FAIRE : verifier que la room existe
        if (await roomExists(room_id))
        {
            return ({success:true, exists:true});

        }
        else
        {
            // La room n'existe pas
            return ({success:true, exists:false});
            // return ;
        }
    });



  
    //  Retourne true si je suis admin de cette room 
    fastify.get('/api/im_admin/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        let room_id;
        const user_id = request.user.id; // A remplacer par 

        try {
            room_id = await myRoomId(request.user.id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }



        try {
            // A FAIRE : verifier que la room existe
            if (await roomExists(room_id))
            {
                let room_db = await db.get("SELECT * FROM rooms WHERE id = ? AND id_admin = ?", [room_id, user_id]);
                if (room_db)
                {
                    return ({success:true, admin:true});
                } else
                {
                    return ({success:true, admin:false});
                }
            }
            else
            {
                // La room n'existe pas
                return ({success:false, error:"room_not_exists"});
                // return ;
            }

        } catch (err)
        {
                return ({success:false, error:"db_access"});

        }
    });


    //  Récupère le gagnant d'un tournoi
    fastify.get('/api/winner/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        const room_id = request.params.id;
        const user_id = request.user.id; // A remplacer par 


        try {
            // A FAIRE : verifier que la room existe
            if (await roomExists(room_id))
            {
                let room_db = await db.get("SELECT * FROM rooms WHERE id = ? AND finished = true", [room_id]);
                let winner = await db.get("SELECT * FROM users WHERE id = ?", [room_db.winner_id]);
                
                if (room_db)
                {
                    // Le tournoi est fini, il y a donc un gagnant

                    if (winner)
                    {
                        return ({success:true, winner_id:room_db.winner_id, winner_username:winner.username});
                    }
                    else
                    {
                        return ({success:false, error:"winner_not_found"});
                    }

                } else
                {
                    return ({success:false, error:"tournament_not_finished"});
                }
            }
            else
            {
                // La room n'existe pas
                return ({success:false, error:"room_not_exists"});
                // return ;
            }

        } catch (err)
        {
                return ({success:false, error:"db_access"});

        }
    });




    //  Vérifie si un utilisateur a triché en modifiant son localstorage
    fastify.post('/api/valid_localstorage', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // const room_id = request.params.id;
        const user_id = request.user.id; // A remplacer par 

        const { local_user_id, local_is_admin, local_room_id } = request.body;

        let user_id_ok = false;
        let is_admin_or_not_ok = false;
        let room_id_ok = false;

        try {

            if (Number(local_user_id) == Number(user_id))
            {
                user_id_ok = true;
            }
            if (await roomExists(Number(local_room_id)))
            {
                let room_db = await db.get("SELECT * FROM rooms WHERE id = ?", [local_room_id]);
                if (room_db)
                {
                    let room_player_exists = await db.get("SELECT * FROM rooms_players WHERE id_room = ? AND id_player = ?", [local_room_id, user_id]);
                    if (room_player_exists)
                    {
                        room_id_ok = true;
                    }
                    if (room_db.id_admin == user_id && local_is_admin == true)
                    {
                        is_admin_or_not_ok = true;
                    }
                    if (room_db.id_admin != user_id && local_is_admin == false)
                    {
                        is_admin_or_not_ok = true;
                    }
                }
            }
        } catch (err)
        {
                console.log("erreur back localstorage");
                console.log(err);
                return ({success:false, error:"db_access"});
        }
        if (user_id_ok && is_admin_or_not_ok && room_id_ok)
        {
                return ({success:true, valid:true});
        }
        else
        {
                return ({success:true, valid:false});
        }
    });


    // Permet a celui qui fait la requete de quitter la room
    fastify.get('/api/quit_room', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // const room_id = request.params.id;
        const user_id = request.user.id; // A remplacer par 
        let room_id; // ICI OBTENU VIA REQUETE SQL

        // Je récupère la room dans laquelle la personne est grace a une requette SQL
        // let room_db;
        // try {
        //     room_db = await db.get("SELECT * FROM rooms_players WHERE id_player = ? ORDER BY id DESC LIMIT 1", [user_id]);
        //     if (room_db)
        //     {
        //         room_id = room_db.id_room;
        //     }
        //     else 
        //     {
        //         return ({success : false, error : "not_in_a_room"});
        //     }
        // } catch(err)
        // {
        //     return ({success : false, error : "db_access"});
        // }

        try {
            room_id = await myRoomId(request.user.id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }


        // On vérifie si la personne est dans la room
        try {
            if (await roomExists(Number(room_id)))
            {
                let room_db = await db.get("SELECT * FROM rooms WHERE id = ?", [room_id]);
                if (room_db)
                {
                    let room_player_exists = await db.get("SELECT * FROM rooms_players WHERE id_room = ? AND id_player = ?", [room_id, user_id]);
                    if (room_player_exists)
                    {
                        room_id_ok = true;
                    }
                    else
                    {
                        // room_id_ok = true;
                        return ({success:false, error:"not_in_room"});
                    }
                }
            }
            else
            {
                return ({success:false, error:"room_not_exists"});
            }
        } catch (err)
        {
            return ({success:false, error:"db_access"});
        }

        // On la vire de la room
        try {
            if ((await tournamentStarted(Number(room_id))) == false)
            {
                // Le tournoi n'a pas encore démarré
                await removeUserFromRoom(fastify, user_id, room_id);

                console.log("un user est parti de sa volonté de la room");
                return ({success:true, quit:true});
            }
            else
            {
                // On ne peut pas quitter la room car déja commencée
                return ({success:true, quit:false}); 

            }
        } catch (err)
        {
            console.log("error db access quit_room");
            return ({success:false, error:"db_access"});
        }


    });

    //  Vérifie si la personne est dans une room
    fastify.get('/api/in_room', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // Je récupère les données (a remplacer par contenu du cookie JWT par la suite)
        const user_id = request.user.id; // A remplacer par 
        // const room_id = request.params.id;

        let in_room = false;


        let room_db = await db.get("SELECT * FROM rooms_players WHERE id_player = ?", [user_id]);
        if (room_db)
        {
            in_room = true;
            // let room_db_second = await db.get("SELECT * FROM rooms_player WHERE id_player = ?", [room_db.id_room]);

        }


        // 1) je la ligne ou rooms_player  a un player = mon id
        // 2) je  regarde ensuite si la partie a commencée (started = true) dans la table rooms


        return (JSON.stringify({success:true}));
    });



    //  Vérifie si j'ai déja joué dans une room et si j'ai gagné
    fastify.get('/api/last_match_result_room', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // Je récupère les données (a remplacer par contenu du cookie JWT par la suite)
        const user_id = request.user.id; // A remplacer par 
        // const room_id = request.params.id;
        let room_id;
        let played = false; // Si la personne a déja joué dans ce tournoi
        let won = false; // Si la personne a gagné son dernier match 1v1 dans ce tournoi

        try {
            room_id = await myRoomId(request.user.id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }

        // Check both pong and connect4 match history
        let room_db = await db.get("SELECT * FROM matchs_history WHERE (first_player = ? OR second_player = ?) AND id_room = ? AND winner_id IS NOT NULL ORDER BY id DESC", [user_id, user_id, room_id]);
        
        // If no pong match found, check connect4 matches
        if (!room_db) {
            room_db = await db.get("SELECT * FROM connect4_online_matchs_history WHERE (first_player = ? OR second_player = ?) AND id_room = ? AND winner_id IS NOT NULL ORDER BY id DESC", [user_id, user_id, room_id]);
        }
        
        if (room_db)
        {
            if (room_db.winner_id)
            {
                played = true;
                if (Number(room_db.winner_id) == Number(user_id))
                {
                    won = true;
                }
            }
        }

        return ({success:true, played:played, won_last_match:won});

    });


    // Invite un joueur a rejoindre un tournoi
    fastify.get('/api/invite_player_tournament/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {


        // Variables utilisées
        const user_id_to_add = request.params.id;
        let user_id = request.user.id; // par la suite
        let room_id = 1; // A CHANGER PAR LA SUITE

        // A DECOMMENTER
        try {
            room_id = await myRoomId(request.user.id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }

        // A FAIRE : verifier si je suis déja dans la room
        try {
            const row = await db.get("SELECT COUNT(*) as count FROM rooms_players WHERE id_player = ? AND id_room = ?", [user_id_to_add, room_id]);
            nb_invit = Number(row.count);
            if (nb_invit > 0)
            {
                return ({success : false, error : "already_in_room"});
            }
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // A FAIRE : verifier qu'il n'y a pas déja une invitation pour ce joueur
        try {
            const row = await db.get("SELECT COUNT(*) as count FROM invitations_tournament WHERE id_player = ? AND id_room = ?", [user_id_to_add, room_id]);
            nb_invit = Number(row.count);
            if (nb_invit > 0)
            {
                return ({success : false, error : "invitation_already_sent"});
            }
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }

        // A FAIRE : vérifier si le joueur qu'on invite n'est pas déja dans une room
        let in_room = false;
        try {
            room_id = await myRoomId(user_id_to_add);
            in_room = true;
        } catch (err)
        {
            in_room = false;
        }
        if (in_room)
        {
            return ({success : false, error : "user_already_in_room"});
        }


        // Crée la room dans la base de données
        try {
            await db.run("INSERT INTO invitations_tournament (id_player, id_room) VALUES (?, ?)", [user_id_to_add, room_id]);
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }
        return ({success : true});
    });


    // Récupère la liste des invitations
    fastify.get('/api/my_invitations', {preValidation: [fastify.authenticate]}, async (request, reply) => {


        // Variables utilisées
        let user_id = request.user.id; // par la suite

        let tabl_invitations = [];


        let invitations;
        try {
            invitations = await db.all("SELECT * FROM invitations_tournament WHERE id_player = ? ORDER BY id ASC", [user_id]);
            for (const line of invitations)
            {
                tabl_invitations.push({room_id:line.id_room});

                // let user = await db.get("SELECT * FROM users WHERE id = ?", [line.id_player]);
                // tabl_players.push({user_id: user.id, username: user.username});
            }
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }
        return ({success : true, tabl_invitations});
    });


    // Supprime toutes les invitations pour une room id
    fastify.get('/api/remove_invitation/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {


        // Variables utilisées
        const room_to_remove = request.params.id;
        let user_id = request.user.id; // par la suite

        // Crée la room dans la base de données
        try {
            await db.run("DELETE FROM invitations_tournament WHERE id_player = ? AND id_room = ?", [user_id, room_to_remove]);
        } catch(err)
        {
            return ({success : false, error : "db_access"});
        }
        return ({success : true});
    });


    //  Vérifie si le tournoi dans la room a déja commencé
    fastify.get('/api/room_started/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // Je récupère les données (a remplacer par contenu du cookie JWT par la suite)

        const room_id = request.params.id;

        let room_db = await db.get("SELECT * FROM rooms WHERE id = ?", [room_id]);
        if (room_db)
        {
            if (Number(room_db.round) > 0)
            {
                return ({success:true, started:true});
            }
            else
            {
                return ({success:true, started:false});
            }
        }
        else
        {
                return ({success:false, error:"room_not_exists"});

        }


    });


    //  Récupère le round actuel de ma room
    fastify.get('/api/my_room_round', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        let room_id;

        try {
            room_id = await myRoomId(request.user.id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }

        let room_db = await db.get("SELECT * FROM rooms WHERE id = ?", [room_id]);
        if (room_db)
        {
            return ({success:true, round:Number(room_db.round)});
        }
        else
        {
            return ({success:false, error:"room_not_exists"});
        }
    });




    //  Vérifie si je suis déja dans une room (pour empecher une connexion dans un deuxime onglet)
    fastify.get('/api/already_in_room', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        let room_id;
        let user_id = request.user.id; // par la suite


        // Je vérifie avec mon user_id si je suis dans une room :


        
        try {
            // room_id = myRoomId(user_id);

            const room_db = await db.get("SELECT * FROM rooms_players WHERE id_player = ? ORDER BY id DESC LIMIT 1", [user_id]);
            if (room_db)
            {
                room_id = room_db.id_room;

                // On vérifie si la room est toujours en cours (donc que personne n'a fini)
                real_room = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [room_id]);
                if(real_room)
                {
                    if (real_room.finished || real_room.finished_with_error)
                    {
                        return ({success:true, in_room:false});
                    }
                    else
                    {
                        return ({success:true, in_room:true});
                    }
                     
                }
                else
                {
                    return ({success:true, in_room:false});
                }
            }
            else
            {
                return ({success:true, in_room:false});
            }
        } catch (err)
        {
            return ({success:false, error:"db_access"});
        }

    });



    //  Récupère le round actuel de ma room
    fastify.get('/api/my_room_nb_players', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        let room_id;

        try {
            room_id = await myRoomId(request.user.id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }


        try {
            const nb_players = await countPlayersInRoom(room_id);
            return ({success:true, nb_players:Number(nb_players)});

        } catch (err)
        {
            return ({success:false, error:"db_access"});
        }
    });



}

module.exports = matchmakingRoutes;