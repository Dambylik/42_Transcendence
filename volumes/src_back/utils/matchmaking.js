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



const db = new sqlite3.Database('./database_sql.db');

// Permet de retourner une promesse (asynchrone) lors d'une requete sql au lieu d'un callback
// En gros : me permet de faire un await sur une requete db.run par ex
db.run = util.promisify(db.run);
db.get = util.promisify(db.get);
db.all = util.promisify(db.all);


  // Retourne un tableau contenant des objets qui représentent un match 1v1
  async function getCurrentMatchs(room_id)
  {
        const tabl_matchs = [];

        // A FAIRE : verifier que la room existe et qu'on a le droit de la rejoindre

        // Récupère des infos sur la room rejointe
        try {
            let actual_room = await db.get("SELECT * FROM rooms WHERE id = ?", [room_id]);
            const actual_round = Number(actual_room.round);

            const room_db = await db.all("SELECT * FROM matchs_history WHERE id_room = ? AND bypass = ? AND round = ? ORDER BY id ASC", [room_id, false, actual_round]);

            for (const line of room_db)
            {
                let finished = false;
                const user_first = await db.get("SELECT * FROM users WHERE id = ?", [line.first_player]);
                const user_second = await db.get("SELECT * FROM users WHERE id = ?", [line.second_player]);
                if (line.winner_id)
                {
                    finished = true;
                }

                // J'ajoute dans un tableau un match a la fois
                tabl_matchs.push({id_match:line.id, first_player: user_first.username, second_player: user_second.username, finished: finished, first_player_id: user_first.id, second_player_id:user_second.id});
            }

            // Je renvoie un tableau contenant tous les matchs pour ce round
            console.log(tabl_matchs);
            return (tabl_matchs);

        } catch(err)
        {
            throw new Error("error db access");
        }
  }



      // A appeler des que tous les rounds sont finis : génère la liste du prochain match 1v1 pour tous les joueurs dans la room
    async function generateRound(fastify, id_room)
    {
        // const id_room = Number(request.params.id);
        let nb_players = 0;
        let tabl_players = [];
        let new_round = 0;

        // Modifie le round actuel dans la base de données (++)
        try {
            await db.run("UPDATE rooms SET round = round + 1 WHERE id = ?", [id_room]);

            actual_room = await db.get("SELECT * FROM rooms WHERE id = ?", [id_room]);
            if (!(actual_room))
            {
                throw new Error("error room not found");
            }
            new_round = actual_room.round;


        } catch (err)
        {
            throw new Error("error update round");
        }

        
        // Génère la liste des joueurs pour un seul round et les met dans un tableau tabl_players
        const players_room = await db.all("SELECT * FROM rooms_players WHERE id_room = ? AND eliminated = false ORDER BY id ASC", [id_room]);
        for (const player of players_room)
        {
            nb_players++;
        }

        console.log("il reste " + nb_players + "joueurs pour le round");


        if (nb_players % 2 == 0)
        {

            // Nombre pair de joueurs

            for (let i = 0; i < nb_players; i+=2)
            {
                const player_id_first = Number(players_room[i].id_player);
                const player_id_second = Number(players_room[i + 1].id_player);
                let ws;
                try
                {
                    // On insert dans la base de données TOUTES les lignes pour les nouveaux matchs
                    await db.run("INSERT INTO matchs_history (first_player, second_player, id_room, round) VALUES (?, ?, ?, ?)", [player_id_first, player_id_second, id_room, new_round]);
                
                    // On récupère l'id du match inséré dans matchs_history
                    inserted_match = await db.get("SELECT * FROM matchs_history WHERE first_player = ? AND second_player = ? AND id_room = ? ORDER BY id DESC LIMIT 1", [player_id_first, player_id_second, id_room]);
                    if (!(inserted_match))
                    {
                        throw new Error("error match created not found");
                    }

                    // Stock temporairement les sockets et id du joueur pour envoyer infos pour le prochain round
                    tabl_players.push({player_id : player_id_first, ws : await getWsFromRoom(fastify, Number(id_room), Number(player_id_first)), match_id: inserted_match.id });
                    tabl_players.push({player_id : player_id_second, ws : await getWsFromRoom(fastify, Number(id_room), Number(player_id_second)), match_id: inserted_match.id });
                } catch (err) {
                    throw new Error("pair error");
                }
            }
        }
        else {


            // Nombre impair de joueurs

            nb_players--;
            for (let i = 0; i < nb_players; i+=2)
            {
                const player_id_first = Number(players_room[i].id_player);
                const player_id_second = Number(players_room[i + 1].id_player);
                let ws;
                try
                {
                    // On insert dans la base de données TOUTES les lignes pour les nouveaux matchs (sauf bypass)
                    await db.run("INSERT INTO matchs_history (first_player, second_player, id_room, round) VALUES (?, ?, ?, ?)", [player_id_first, player_id_second, id_room, new_round]);
                
                    // On récupère l'id du match inséré dans matchs_history
                    inserted_match = await db.get("SELECT * FROM matchs_history WHERE first_player = ? AND second_player = ? AND id_room = ? ORDER BY id DESC LIMIT 1", [player_id_first, player_id_second, id_room]);
                    if (!(inserted_match))
                    {
                        throw new Error("error match created not found");
                    }

                    // Stock temporairement les sockets et id du joueur pour envoyer infos pour le prochain round
                    tabl_players.push({player_id : player_id_first, ws : await getWsFromRoom(fastify, Number(id_room), Number(player_id_first)), match_id: inserted_match.id });
                    tabl_players.push({player_id : player_id_second, ws : await getWsFromRoom(fastify, Number(id_room), Number(player_id_second)), match_id: inserted_match.id });
                } catch (err) {
                    // return "error with room id or player id in rooms map";
                    throw new Error("impair error");
                }
            }

            // Insert le bypass (match considéré gagnant d'office) pour le dernier joueur de la room
            const player_id_first = Number(players_room[nb_players].id_player);
            await db.run("INSERT INTO matchs_history (first_player, second_player, id_room, bypass, round) VALUES (?, ?, ?, ?, ?)", [player_id_first, 0, id_room, true, new_round]);
        }

        /// CELA NE SERT A RIEN JE PENSE : a verifier
        // Envoie un message ws a tous les joueurs qui ont été selectionnés pour jouer
        // for (player_tabl of tabl_players)
        // {
        //     player_tabl.ws.send(JSON.stringify({success:true, start_game:true, match_id: player_tabl.match_id, round:new_round}));
        // }

    }





    async function getWsFromRoom(fastify, id_room, player_id)
    {
        if (!fastify.roomsMap.has(Number(id_room)))
        {
            throw new Error("room id not in map rooms");
        }
        const room = fastify.roomsMap.get(Number(id_room));
        for (const player of room)
        {
            if (Number(player.id_player) == Number(player_id))
            {
                return player.ws;
            }
        }
        throw new Error("player id not found in map rooms");
    }




    // Renvoie true si le tournoi avec l'id room room_id s'est terminé normalement
    async function tournamentFinished(room_id)
    {
        let room_db;
        let tournament_finished = false;
        let room_exists = true;
        try {
            room_db = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [room_id]);

            if (room_db)
            {
                if (room_db.finished)
                {
                    tournament_finished = true;
                }
            }
            else
            {
                tournament_finished = false;
            }

        } catch(err)
        {
                // throw new error("db_access");
                console.log("error db tournamentFinished");
        }

        return (tournament_finished);

    }



    // Renvoie true si le tournoi avec l'id room room_id s'est terminé a cause d'une erreur
    async function tournamentFinishedWithError(room_id)
    {
        let room_db;
        let tournament_finished = false;
        let room_exists = true;
        try {
            room_db = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [room_id]);

            if (room_db)
            {
                if (room_db.finished_with_error)
                {
                    tournament_finished = true;
                }
            }
            else
            {
                tournament_finished = false;
            }

        } catch(err)
        {
                // throw new error("db_access");
                console.log("error db tournamentFinishedWithError");
        }

        return (tournament_finished);

    }

    // Arrete le tournoi de force normalement
    async function stop_tournament(fastify, id_room)
    {

        // A FAIRE : fermer tous les ws associés a un match 1V1 (en cours)

        // Gerer la bdd pour indiquer dans matchshistory que la game est finie (bypass a true par ex)

        try {
            await db.run("UPDATE rooms SET finished = true WHERE id = ?", [id_room]);
        } catch (err)
        {
            // throw new Error("error update round");
            console.log("error with stop tournament db")
        }


        // Envoie un message a tous les joueurs dans la room pour afficher le nom du gagnant et ferme les ws
        const room = fastify.roomsMap.get(Number(id_room));
        for (const player of room)
        {
            player.ws.send(JSON.stringify({success:true, cause:"tournament_stopped"}));
            player.ws.close();
        }

    }

    // Arrete le tournoi de force (a utiliser quand un joueur s'est déco du tournoi apres son lancement)
    async function stop_tournament_with_error(fastify, id_room)
    {

        // A FAIRE : fermer tous les ws associés a un match 1V1 (en cours)

        // Gerer la bdd pour indiquer dans matchshistory que la game est finie (bypass a true par ex)

        try {
            await db.run("UPDATE rooms SET finished = false, finished_with_error = true WHERE id = ?", [id_room]);
        } catch (err)
        {
            // throw new Error("error update round");
            console.log("error with stop tournament db")
        }


        // Envoie un message a tous les joueurs dans la room pour afficher le nom du gagnant et ferme les ws
        const room = fastify.roomsMap.get(Number(id_room));
        for (const player of room)
        {
            player.ws.send(JSON.stringify({success:true, cause:"tournament_stopped"}));
            player.ws.close();
        }

    }



    // Renvoie true si le tournoi avec l'id room room_id a démarré
    async function tournamentStarted(room_id)
    {
        let room_db;
        let tournament_started = false;
        let room_exists = true;
        try {
            room_db = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [room_id]);

            if (room_db)
            {
                if (Number(room_db.round) > 0)
                {
                    tournament_started = true;
                }
            }
            else
            {
                room_exists = false;
            }

        } catch(err)
        {
                throw new error("db_access");
        }

        return (tournament_started);

    }


    // Supprime le joueur de la base de données et de la map (A UTILISER QUE SI LE TOURNOI N'A PAS COMMENCE)
    async function removeUserFromRoom(fastify, user_id_to_reject, room_id)
    {     
        // Je vérifie si le tournoi n'a pas commencé (via bdd)
        // A FAIRE !!!

        // try {
        //     if (tournamentStarted(Number(room_id)) == false)
        //     {
        //         // Le tournoi n'a pas encore démarré

        //     }

        // } catch (err)
        // {
        //     console.log("error db access tournamentstarted");
        // }






        // Je supprime l'entrée dans la table rooms_players avec id_player
        try {
            await db.run("DELETE FROM rooms_players WHERE id_player = ? AND id_room = ?", [user_id_to_reject, room_id]);
        } catch(err)
        {
            throw new error("db_access");
            // return ({success : false, error : "db_access"});
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


    // Je stock dans un map une liste de user_id qui a deconnecte d'un tournoi
    // if (!fastify.roomsMap.has(Number(room_id)))
    // {
    //     fastify.roomsMap.set(Number(room_id), []);
    // }
    // fastify.roomsMap.get(Number(room_id)).push({id_player:user_id, "ws" : socket});

        

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
        console.log("ancien taille du map (fonction removeUserFromRoom) : " + fastify.roomsMap.get(Number(room_id)).length );
        fastify.roomsMap.set(Number(room_id), new_array);
        console.log("nouveau taille du map (fonction removeUserFromRoom) : " + fastify.roomsMap.get(Number(room_id)).length);
    }




    // Vérifie si tous les matchs sont finis pour un round
    async function checkIfRoundEnded(room_id, round)
    {
        const all_matchs_room = await db.all('SELECT * FROM matchs_history WHERE id_room = ? AND round = ? AND bypass = false', [room_id, round]);
        for (const real_match of all_matchs_room)
        {
            if (!real_match.winner_id)
            {
                return false;
            }
        }
        return true;
    }



    // Renvoie true si le tournoi avec l'id room room_id existe (dans la base de données)
    async function roomExists(room_id)
    {
        let room_db;
        let room_exists = false;
        try {
            room_db = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [room_id]);

            if (room_db)
            {
                room_exists = true;
            }
            else
            {
                room_exists = false;
            }

        } catch(err)
        {
                // throw new error("db_access");
                console.log("error db tournamentFinished");
        }

        return (room_exists);

    }


  // Vérifie si l'utilisateur est l'admin de la room
  async function isAdminRoom(user_id, room_id)
  {
        try {
            let room_db = await db.get("SELECT * FROM rooms WHERE id = ? AND id_admin = ?", [room_id, user_id]);
            if (room_db)
            {
                return true;
            } else
            {
                return false;
            }

        } catch (err)
        {
                return false;
        }
  }


  async function myRoomId(user_id)
  {
    // A FAIRE : verifier si je sius bien dans une room sinon je throw une erreur

        // Je récupère la room dans laquelle la personne est grace a une requette SQL
        let room_db;
        let room_id;
        try {
            room_db = await db.get("SELECT * FROM rooms_players WHERE id_player = ? ORDER BY id DESC LIMIT 1", [user_id]);
            if (room_db)
            {
                room_id = room_db.id_room;

                // On vérifie si la room est toujours en cours (donc que personne n'a fini)
                real_room = await db.get("SELECT * FROM rooms WHERE id = ? ORDER BY id DESC LIMIT 1", [room_id]);
                if(real_room)
                {
                    if (real_room.finished || real_room.finished_with_error)
                    {
                        throw new Error("room_finished");
                    }
                    return (room_id);
                     
                }
                else
                {
                    throw new Error("room_not_exists");
                }

                return Number(room_id);
            }
            else 
            {
                throw new Error("not_found");
                return ({success : false, error : "not_in_a_room"});
            }
        } catch (err)
        {
            throw new Error("not_found");
            return (1);
            // throw new Error("not_found");
            return ({success : false, error : "db_access"});
        }

  }

  async function countPlayersInRoom(room_id)
  {
    try {
        const row = await db.get("SELECT COUNT(*) as count FROM rooms_players WHERE id_room = ?", [room_id]);
        const nb_players = Number(row.count);
        return nb_players;
    } catch(err)
    {
        throw new Error("db_access");
    }
  }

module.exports = {countPlayersInRoom, isAdminRoom, myRoomId, roomExists, getCurrentMatchs, generateRound, getWsFromRoom, tournamentFinished,tournamentFinishedWithError , stop_tournament, stop_tournament_with_error, tournamentStarted, removeUserFromRoom, checkIfRoundEnded};