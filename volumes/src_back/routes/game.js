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



const {myRoomId, getCurrentMatchs, generateRound, getWsFromRoom, tournamentFinished, stop_tournament, tournamentStarted, removeUserFromRoom, checkIfRoundEnded} = require('../utils/matchmaking.js');




const db = new sqlite3.Database('./database_sql.db');

// Permet de retourner une promesse (asynchrone) lors d'une requete sql au lieu d'un callback
// En gros : me permet de faire un await sur une requete db.run par ex
db.run = util.promisify(db.run);
db.get = util.promisify(db.get);
db.all = util.promisify(db.all);

// Crée la table dans la bdd si elle n'existe pas
(async () => {
        // await db.run(`CREATE TABLE IF NOT EXISTS rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, name varchar (255) DEFAULT NULL, started BOOLEAN NOT NULL DEFAULT FALSE, round INTEGER DEFAULT 0, finished BOOLEAN NOT NULL DEFAULT FALSE,  id_admin INTEGER NOT NULL, created_at DATETIME DEFAULT (datetime('now')))`);
        // await db.run(`CREATE TABLE IF NOT EXISTS rooms_players (id INTEGER PRIMARY KEY AUTOINCREMENT, id_player INTEGER NOT NULL, id_room INTEGER NOT NULL, is_admin BOOLEAN NOT NULL DEFAULT FALSE, created_at DATETIME DEFAULT (datetime('now')))`);
})();


async function gameRoutes(fastify, options)
{


    fastify.get('/api/ws/play/:id', {websocket: true }, async (socket , req) => {



        // A faire :
            // Vérifier si j'ai bien le droit d'accéder a ce match 1v1
            // Démarre une boucle setinterval qui envoie des données aux joueurs a chaque fois sur les positions de la raquette et de la balle


    // Gestion du JWT envoyé via cookie pour l'authentification
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



    // Je récupère les données
    const user_id = Number(user.id);
    const match_id = Number(req.params.id);


    // J'ajoute le joueur a la map matchs pour le match 1v1 actuel
    if (!fastify.matchsMap.has(Number(match_id)))
    {
        fastify.matchsMap.set(Number(match_id), []);
    }
    fastify.matchsMap.get(Number(match_id)).push({id_player:user_id, "ws" : socket});


    // Je vérifie que l'autre joueur n'a pas gave up en changeant de page. Si c'est le cas, je
    try {
        const line_db = await db.get('SELECT * FROM matchs_history WHERE id = ?', [match_id]);
        if (line_db)
        {
            if(line_db.gave_up)
            {
                // L'autre joueur a abandonné
                console.log("the other player gave up");
                let other_id;
                if((Number(line_db.first_player) == Number(user_id)))
                {
                    other_id = line_db.second_player;
                }
                else
                {
                    other_id = line_db.first_player;
                }

                stopMatch(fastify, other_id, match_id);

            }
        }
            // await db.run("UPDATE matchs_history SET gave_up = true WHERE id = ?", [match_id]);
    } catch (err)
    {
        console.log("error db_access");
        // return ({success : false, error : "db_access"});
    }

    

    socket.on('message', message => {

        const my_match = fastify.matchsMap.get(Number(match_id));

        let received = message.toString();
        let object_received = JSON.parse(received);

        try {
                received = message.toString();
                object_received = JSON.parse(received);

            // Appelé uniquement si les 2 joueurs sont présents dans le match 1v1
            if(my_match.length == 2)
            {
                if (object_received.type == "connection")
                {
                    // Les deux joueurs sont présents : le match 1v1 peut commencer

                    console.log("message de connexion recu match 1v1 ws");
                    const object_to_send = {type:"connection", message:"both_players"};

                    // J'envoi un message aux deux joueurs pour leur dire que le match 1v1 a commencé
                    const my_match = fastify.matchsMap.get(Number(match_id));
                    for (const real_player of my_match)
                    {
                        real_player.ws.send(JSON.stringify(object_to_send));
                    }                    
                }
                if (object_received.type == "ping")
                {

                    // Je recois un ping (pour éviter la deconnexion)

                    console.log("ping recu dun match 1v1");
                }

                // A faire ici : gérer les données envoyées par les 2 joueurs !!!!!!!!!!!!!!!!!!!!!!!!

            }



        } catch (err)
        {
            // Message ws recu du client NEST PAS AU FORMAT JSON
            const object_to_send = {type:"connection", message:"error"};
            socket.send(JSON.stringify(object_to_send));
        }


    })

    socket.on('error', (err) => {

        // A faire : gerer la deconnexion

    });

    socket.on('close', async (code, reason) => {

        // A faire : gerer la deconnexion

        // Vérifier si le match 1v1 est fini :
        let finished = false;
        const my_match_line = await db.get('SELECT * FROM matchs_history WHERE id = ?', [Number(match_id)]); // A REVOIR (ne marche pas peut etre)
        if (my_match_line)
        {
            if (my_match_line.winner_id)
            {
                // Le match s'est terminé normalement
                finished = true;
            }
        }

        // J'arrete le match si les deux joueurs sont connectés et qu'un seul a déco
        // const my_match = fastify.matchsMap.get(Number(match_id));
        // if (finished == false && my_match.length == 2)
        if (finished == false)
        {
            stopMatch(fastify, user_id, match_id);
        }

        // if (finished )


        // Si il n'est pas fini
        // je close les WS associés a ce match (1 ou 2)
        // Si il y a 2 joueurs : je met en gagnant le joueur qui n'a pas coupé sa connexion WS
        // J'arrete le tournoi



        console.log("connexion fermee par le client" + code + " " + reason.toString());
    });
  });



  


    async function stopMatch(fastify, user_id_who_stopped, match_id)
    {
                // const match_id = request.params.id;
        // const user_id = request.user.id; 
        const user_id = user_id_who_stopped; 


        if (fastify.matchsMap.has(Number(match_id)))
        {
            // Obtient l'id de la room (et non celle du match 1v1)
            const my_match = await db.get('SELECT * FROM matchs_history WHERE id = ?', [Number(match_id)]);
            let id_room = 0;
            let round = 0;
            let other_player_id = 0;
            if (my_match)
            {
                id_room = Number(my_match.id_room);
                round = Number(my_match.round);
                other_player_id = (Number(my_match.first_player) == Number(user_id)) ? Number(my_match.second_player) : Number(my_match.first_player);
            }

            // Met a jour dans la base de donnée le gagnant et indique donc la fin du match 1v1
            await db.run("UPDATE matchs_history SET winner_id = ? WHERE id = ?", [other_player_id, match_id]);

            // Met dans la table rooms_players le champ eliminated a true pour le joueur éliminé
            await db.run("UPDATE rooms_players SET eliminated = true WHERE id_player = ? AND id_room = ?", [user_id, id_room]);


            
            // Vérifie si tous les matchs sont finis pour ce round et cette room
            const finished = await checkIfRoundEnded(id_room, round);
            console.log("finished  : " + finished);


            // Je récupère le pseudo du gagnant :
            const winner = await db.get('SELECT * FROM users WHERE id = ?', [Number(other_player_id)]);
            const winner_username = winner.username;

            if (finished)
            {

                // Tous les matchs sont finis pour ce round

                // Compte le nombre de matchs pour le round actuel (y compris bypass)
                let nb_matchs_done = 0;
                try {
                    const row = await db.get('SELECT COUNT(*) as count FROM matchs_history WHERE round = ? AND id_room = ?', [Number(round), Number(id_room)]);
                    nb_matchs_done = row.count;
                    console.log("row count = " + nb_matchs_done);
                } catch (err)
                {
                    return ({success:false, error:"db_access"});
                }
                
                if (nb_matchs_done >= 2)
                {
                    // Il y aura au moins un match 1v1 au prochain round car il reste au moins deux joueurs gagnants
                    try {
                        // Fait un round++ dans la room et insert dans la table matchs_history les nouvelles données
                        await generateRound(fastify, id_room); // Envoie aussi via ws la liste des nouveaux matchs a /room (attention : le .ws.send ne sert a rien dans cette fct)

                        // Envoie une message ws a tous les joueurs de la room pour actualiser et afficher la liste des matchs 1v1
                        console.log("envoi les nouveaux matchs a la room du joueur");
                        const tabl_matchs = await getCurrentMatchs(id_room);
                        const room = fastify.roomsMap.get(Number(id_room));
                        for (const player of room)
                        {
                            player.ws.send(JSON.stringify({success:true, cause:"list_matchs", matchs:tabl_matchs}));
                        }

                    } catch (err)
                    {
                        return ({success:false, error:"generated_round_error"});
                    }
                }
                else
                {
                    
                    // A FAIRE : modifier la bdd pour dire que le tournoi est fini
                    try {
                        await db.run("UPDATE rooms SET finished = true, winner_id = ? WHERE id = ?", [winner.id , id_room]);
                    } catch (err)
                    {
                        // throw new Error("error update round");
                        console.log("error with stop tournament db");
                        return (JSON.stringify({success:false, cause:"db_access"}));
                    }


                    // Envoie un message a tous les joueurs dans la room pour afficher le nom du gagnant et ferme les ws
                    const room = fastify.roomsMap.get(Number(id_room));
                    for (const player of room)
                    {
                        player.ws.send(JSON.stringify({success:true, cause:"end_of_tournament", winner:winner_username}));
                        player.ws.close();
                    }
                }
            }

            // J'envoi un message aux deux joueurs pour leur dire que le match 1v1 est fini (stop)
            const players_match = fastify.matchsMap.get(Number(match_id));
            for (const real_player of players_match)
            {
                const obj = {type:"stop_match", winner_username:winner_username};
                real_player.ws.send(JSON.stringify(obj));
            }

            // Je ferme la connexion WS avec les deux joueurs
            for (const real_player of players_match)
            {
                real_player.ws.close();
            }

            // Je vide la map matchs
            fastify.matchsMap.delete(Number(match_id));

            return (JSON.stringify({success:true}));

        }

    }






    //  Permet de vérifier si le tournoi a la room id est terminé (normalement)
    fastify.get('/api/update_connected_to_match/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // const room_id = request.params.id;

        // const match_id = request.params.id;
        let match_id;
        let user_id = request.user.id; // par la suite



        // J'obtiens l'id du match
        let room_id;
        try {
            room_id = await myRoomId(request.user.id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }
        try {
            const line = await db.get('SELECT * FROM matchs_history WHERE (first_player = ? OR second_player = ?) AND id_room = ? ORDER BY id DESC', [Number(user_id), Number(user_id), Number(room_id)]);
            if (line)
            {
                match_id = line.id;
            }
            else
            {
                return ({success:false, error:"match_not_found"});
            }
        } catch (err)
        {
            return ({success:false, error:"db_access"});
        }



        try {
                console.log("try ok");
                // SELECT * FROM rooms WHERE id_admin = ? ORDER BY id DESC LIMIT 1
            // const line_db = await db.get('SELECT * FROM matchs_history WHERE id = ?', [Number(match_id)]);
            const line_db = await db.get('SELECT * FROM matchs_history WHERE id = ?', [match_id]);
            if (line_db)
            {
                console.log("line ok");
                // return({line_db});
                // if (line_db.first_player == user_id)
                // {
                //     return "ok";
                // }
                if (Number(line_db.first_player) == Number(user_id))
                {
                    console.log("first player !");
                    await db.run("UPDATE matchs_history SET first_player_connected = true WHERE id = ?", [match_id]);
                    return ({success : true});

                }
                if (Number(line_db.second_player) == Number(user_id))
                {
                    console.log("second player !");
                    await db.run("UPDATE matchs_history SET second_player_connected = true WHERE id = ?", [match_id]);
                    return ({success : true});
                }
            }
            else 
            {
                console.log("error : line matchs_hitstory not found")
                return ({success : false, error:"match_not_found"});  
                // throw new Error("line not exist");
            }
        } catch (err)
        {
            console.log("error : line matchs_hitstory not found : dbaccess")
            console.log(err);
                        return ({success : false, error : "db_access", plus:err});

            // return ({success:false, error:"db_access"});
        }



        return({sucess:false});

        
    });


    //  Permet de vérifier si le tournoi a la room id est terminé (normalement)
    fastify.get('/api/check_connected_to_match/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // const room_id = request.params.id;

        let match_id;
        let user_id = request.user.id; // par la suite


        // J'obtiens l'id du match
        let room_id;
        try {
            room_id = await myRoomId(request.user.id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }
        try {
            const line = await db.get('SELECT * FROM matchs_history WHERE (first_player = ? OR second_player = ?) AND id_room = ? ORDER BY id DESC', [Number(user_id), Number(user_id), Number(room_id)]);
            if (line)
            {
                match_id = line.id;
            }
            else
            {
                return ({success:false, error:"match_not_found"});
            }
        } catch (err)
        {
            return ({success:false, error:"db_access"});
        }



        // // J'indique a la base de données qu'il s'est déja connecté a ce match 1v1
        // let room_id;
        // try {
        //     room_id = await myRoomId(request.user.id);
        // } catch (err)
        // {
        //     return ({success:false, error:"not_in_room"});
        // }

        try {
                console.log("try ok");
                // SELECT * FROM rooms WHERE id_admin = ? ORDER BY id DESC LIMIT 1
            // const line_db = await db.get('SELECT * FROM matchs_history WHERE id = ?', [Number(match_id)]);
            const line_db = await db.get('SELECT * FROM matchs_history WHERE id = ?', [match_id]);
            if (line_db)
            {
                console.log("line ok");
                // return({line_db});
                // if (line_db.first_player == user_id)
                // {
                //     return "ok";
                // }
                if (Number(line_db.first_player) == Number(user_id))
                {
                    console.log("first player !");
                    if (line_db.first_player_connected)
                    {
                        return ({success : true, connected:true});
                    }

                }
                if (Number(line_db.second_player) == Number(user_id))
                {
                    console.log("second player !");
                    if (line_db.second_player_connected)
                    {
                        return ({success : true, connected:true});
                    }
                }
            }
            else 
            {
                console.log("error : line matchs_hitstory not found")
                return ({success : false, error:"match_not_found"});  
                // throw new Error("line not exist");
            }
        } catch (err)
        {
            console.log("error : line matchs_hitstory not found : dbaccess")
            console.log(err);
                        return ({success : false, error : "db_access", plus:err});

            // return ({success:false, error:"db_access"});
        }



        return ({success : true, connected:false});

        
    });



    // Permet de savoir si je suis déja connecté a ce match 1v1 via WS
    fastify.get('/api/already_connected_to_match', {preValidation: [fastify.authenticate]}, async (request, reply) => {


        // const match_id = request.params.id;
        // let match_id;
        const user_id = request.user.id; 
        // let room_id;

        let already_connected = false;

        let room_id;

                // A DECOMMENTER
                try {
                    room_id = await myRoomId(request.user.id);
                } catch (err)
                {
                    return ({success:false, error:"not_in_room"});
                }
        

        // J'obtiens l'id du match
        try {
            const line = await db.get('SELECT * FROM matchs_history WHERE (first_player = ? OR second_player = ?) AND id_room = ? ORDER BY id DESC', [Number(user_id), Number(user_id), Number(room_id)]);
            if (line)
            {
                if (Number(line.first_player) == Number(user_id))
                {
                    if (line.first_player_connected)
                    {
                        already_connected = true;
                    }
                }
                if (Number(line.second_player) == Number(user_id))
                {
                    if (line.second_player_connected)
                    {
                        already_connected = true;
                    }
                }
            }
            else 
            {
                throw new Error("line not exist");
            }
        } catch (err)
        {
            return ({success:false, error:"db_access"});
        }



        
        return ({success:true, connected:already_connected});



    });




    //  Met a jour le champ gave up afin que le prochain joueur se connectant a un match 1v1 sache qu'il a déja gagné
    fastify.get('/api/update_gave_up/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        // const room_id = request.params.id;

        let match_id;
        let user_id = request.user.id; // par la suite

        // J'obtiens l'id du match
        let room_id;
        try {
            room_id = await myRoomId(request.user.id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }
        try {
            const line = await db.get('SELECT * FROM matchs_history WHERE (first_player = ? OR second_player = ?) AND id_room = ? ORDER BY id DESC', [Number(user_id), Number(user_id), Number(room_id)]);
            if (line)
            {
                match_id = line.id;
            }
            else
            {
                return ({success:false, error:"match_not_found"});
            }
        } catch (err)
        {
            return ({success:false, error:"db_access"});
        }



        // // J'indique a la base de données qu'il s'est déja connecté a ce match 1v1
        // let room_id;
        // try {
        //     room_id = await myRoomId(request.user.id);
        // } catch (err)
        // {
        //     return ({success:false, error:"not_in_room"});
        // }

        try {
            const line_db = await db.get('SELECT * FROM matchs_history WHERE id = ?', [match_id]);
            if (!line_db)
            {
                return ({success : false, error : "match_not_exists"});
            }
                await db.run("UPDATE matchs_history SET gave_up = true WHERE id = ?", [match_id]);

                // A FAIRE : si le joueur a déja rejoint le match 1v1 alors je stop le match
                if (line_db.first_player_connected && line_db.second_player_connected)
                {
                    // let other_id;
                    // if (Number(line_db.first_player) == Number(user_id))
                    // {
                    //     other_id = line_db.second_player
                    // }
                    // else
                    // {
                    //     other_id = line_db.first_player
                    // }
                    stopMatch(fastify, user_id, match_id);
                }
                

        } catch (err)
        {
            return ({success : false, error : "db_access"});
        }



        return({sucess:true});

        
    });



    // Arrete une partie 1V1 (id = match id)  (envoyé lorsque le joueur souhaite abandonner ingame 1v1)
    fastify.get('/api/stop_match/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        let match_id;
        const user_id = request.user.id; 

        console.log("Je suis dans stop match");


            // J'obtiens l'id du match
        let room_id;
        try {
            room_id = await myRoomId(request.user.id);
        } catch (err)
        {
            return ({success:false, error:"not_in_room"});
        }
        try {
            const line = await db.get('SELECT * FROM matchs_history WHERE (first_player = ? OR second_player = ?) AND id_room = ? ORDER BY id DESC', [Number(user_id), Number(user_id), Number(room_id)]);
            if (line)
            {
                match_id = line.id;
            }
            else
            {
                return ({success:false, error:"match_not_found"});
            }
        } catch (err)
        {
            return ({success:false, error:"db_access"});
        }

        console.log("Je suis dans stop match 2");


        if (fastify.matchsMap.has(Number(match_id)))
        {
            // Obtient l'id de la room (et non celle du match 1v1)
            const my_match = await db.get('SELECT * FROM matchs_history WHERE id = ?', [Number(match_id)]);
            let id_room = 0;
            let round = 0;
            let other_player_id = 0;
            if (my_match)
            {
                id_room = Number(my_match.id_room);
                round = Number(my_match.round);
                other_player_id = (Number(my_match.first_player) == Number(user_id)) ? Number(my_match.second_player) : Number(my_match.first_player);
            }

            // Met a jour dans la base de donnée le gagnant et indique donc la fin du match 1v1
            await db.run("UPDATE matchs_history SET winner_id = ? WHERE id = ?", [other_player_id, match_id]);

            // Met dans la table rooms_players le champ eliminated a true pour le joueur éliminé
            await db.run("UPDATE rooms_players SET eliminated = true WHERE id_player = ? AND id_room = ?", [user_id, id_room]);


            
            // Vérifie si tous les matchs sont finis pour ce round et cette room
            const finished = await checkIfRoundEnded(id_room, round);
            console.log("finished  : " + finished);


            // Je récupère le pseudo du gagnant :
            const winner = await db.get('SELECT * FROM users WHERE id = ?', [Number(other_player_id)]);
            const winner_username = winner.username;

            if (finished)
            {

                // Tous les matchs sont finis pour ce round

                // Compte le nombre de matchs pour le round actuel (y compris bypass)
                let nb_matchs_done = 0;
                try {
                    const row = await db.get('SELECT COUNT(*) as count FROM matchs_history WHERE round = ? AND id_room = ?', [Number(round), Number(id_room)]);
                    nb_matchs_done = row.count;
                    console.log("row count = " + nb_matchs_done);
                } catch (err)
                {
                    return ({success:false, error:"db_access"});
                }
                
                if (nb_matchs_done >= 2)
                {
                    // Il y aura au moins un match 1v1 au prochain round car il reste au moins deux joueurs gagnants
                    try {
                        // Fait un round++ dans la room et insert dans la table matchs_history les nouvelles données
                        await generateRound(fastify, id_room); // Envoie aussi via ws la liste des nouveaux matchs a /room (attention : le .ws.send ne sert a rien dans cette fct)

                        // Envoie une message ws a tous les joueurs de la room pour actualiser et afficher la liste des matchs 1v1
                        console.log("envoi les nouveaux matchs a la room du joueur");
                        const tabl_matchs = await getCurrentMatchs(id_room);
                        const room = fastify.roomsMap.get(Number(id_room));
                        for (const player of room)
                        {
                            player.ws.send(JSON.stringify({success:true, cause:"list_matchs", matchs:tabl_matchs}));
                            console.log("list match envoye");
                        }

                    } catch (err)
                    {
                        return ({success:false, error:"generated_round_error"});
                    }
                }
                else
                {
                    
                    // A FAIRE : modifier la bdd pour dire que le tournoi est fini
                    try {
                        await db.run("UPDATE rooms SET finished = true, winner_id = ? WHERE id = ?", [winner.id , id_room]);
                    } catch (err)
                    {
                        // throw new Error("error update round");
                        console.log("error with stop tournament db");
                        return (JSON.stringify({success:false, cause:"db_access"}));
                    }

                    console.error("Je suis dans stop match, je vais envoyer end of tournament");

                    // Envoie un message a tous les joueurs dans la room pour afficher le nom du gagnant et ferme les ws
                    const room = fastify.roomsMap.get(Number(id_room));
                    for (const player of room)
                    {
                        player.ws.send(JSON.stringify({success:true, cause:"end_of_tournament", winner:winner_username}));
                        player.ws.close(); ///// A DECOMMENTER !!!
                                            console.log("Je suis dans stop match, end of tournament envoyé");
                    }
                }
            }

            // J'envoi un message aux deux joueurs pour leur dire que le match 1v1 est fini (stop)
            const players_match = fastify.matchsMap.get(Number(match_id));
            for (const real_player of players_match)
            {
                const obj = {type:"stop_match", winner_username:winner_username};
                real_player.ws.send(JSON.stringify(obj));
            }

            // Je ferme la connexion WS avec les deux joueurs
            // for (real_player of players_match)
            // {
            //     real_player.ws.close();
            // }

            return (JSON.stringify({success:true}));

        }
        return (JSON.stringify({success:false, cause:"no_match_with_this_id"}));
    });



    
}

module.exports = gameRoutes;