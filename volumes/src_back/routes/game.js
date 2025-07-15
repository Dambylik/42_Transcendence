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

// Connect4 win checking function
function checkConnect4Win(board, row, col, player) {
    const ROWS = 6;
    const COLS = 7;
    
    // Check horizontal
    let count = 1;
    // Check left
    for (let c = col - 1; c >= 0 && board[row][c] === player; c--) count++;
    // Check right
    for (let c = col + 1; c < COLS && board[row][c] === player; c++) count++;
    if (count >= 4) return player;
    
    // Check vertical
    count = 1;
    // Check down
    for (let r = row + 1; r < ROWS && board[r][col] === player; r++) count++;
    if (count >= 4) return player;
    
    // Check diagonal (top-left to bottom-right)
    count = 1;
    // Check up-left
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && board[r][c] === player; r--, c--) count++;
    // Check down-right
    for (let r = row + 1, c = col + 1; r < ROWS && c < COLS && board[r][c] === player; r++, c++) count++;
    if (count >= 4) return player;
    
    // Check diagonal (top-right to bottom-left)
    count = 1;
    // Check up-right
    for (let r = row - 1, c = col + 1; r >= 0 && c < COLS && board[r][c] === player; r--, c++) count++;
    // Check down-left
    for (let r = row + 1, c = col - 1; r < ROWS && c >= 0 && board[r][c] === player; r++, c--) count++;
    if (count >= 4) return player;
    
    return null;
}




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


    fastify.get('/api/ws/play/pong/:id', { websocket: true }, async (socket, req) => {

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

    // Get match info to determine player roles and game type
    let matchInfo;
    let isConnect4Match = false;
    try {
        // First try to find the match in pong matchs_history
        matchInfo = await db.get('SELECT * FROM matchs_history WHERE id = ?', [match_id]);
        
        // If not found, try connect4_online_matchs_history
        if (!matchInfo) {
            matchInfo = await db.get('SELECT * FROM connect4_online_matchs_history WHERE id = ?', [match_id]);
            if (matchInfo) {
                isConnect4Match = true;
            }
        }
        
        if (!matchInfo) {
            socket.send(JSON.stringify({success: false, error: "match_not_found"}));
            socket.close();
            return;
        }
    } catch (err) {
        socket.send(JSON.stringify({success: false, error: "db_error"}));
        socket.close();
        return;
    }

    // Determine if this player is player1 or player2
    const isPlayer1 = Number(matchInfo.first_player) === user_id;
    const isPlayer2 = Number(matchInfo.second_player) === user_id;
    
    if (!isPlayer1 && !isPlayer2) {
        socket.send(JSON.stringify({success: false, error: "not_in_match"}));
        socket.close();
        return;
    }

    // Initialize game state if it doesn't exist
    if (!fastify.gameStates) {
        fastify.gameStates = new Map();
    }
    
    if (!fastify.gameStates.has(match_id)) {
        fastify.gameStates.set(match_id, {
            gameType: 'pong',
            ballX: 400,
            ballY: 300,
            ballSpeedX: 4,
            ballSpeedY: 3,
            leftPaddleY: 240,
            rightPaddleY: 240,
            player1Score: 0,
            player2Score: 0,
            gameStarted: false,
            gameEnded: false,
            winner: null,
            lastUpdate: Date.now()
        });
    }

    
    // Clean up any existing game loops for this user before starting new match
    if (fastify.gameLoops) {
        for (const [existingMatchId, interval] of fastify.gameLoops.entries()) {
            // Check if this user is in any existing matches
            const existingMatch = fastify.matchsMap.get(existingMatchId);
            if (existingMatch && existingMatch.some(p => p.id_player === user_id)) {
                console.log(`Cleaning up existing game loop for match ${existingMatchId} before starting new match ${match_id}`);
                clearInterval(interval);
                fastify.gameLoops.delete(existingMatchId);
                
                // Also clean up the game state
                if (fastify.gameStates && fastify.gameStates.has(existingMatchId)) {
                    fastify.gameStates.delete(existingMatchId);
                }
            }
        }
    }

    // IMPORTANT: If this is a Connect4 match, clean up any Pong game loops that might still be running
    if (isConnect4Match && fastify.gameLoops) {
        const loopsToClean = [];
        for (const [existingMatchId, interval] of fastify.gameLoops.entries()) {
            const existingGameState = fastify.gameStates?.get(existingMatchId);
            if (existingGameState && existingGameState.gameType === 'pong') {
                console.log(`Force cleaning Pong game loop ${existingMatchId} before starting Connect4 match ${match_id}`);
                loopsToClean.push(existingMatchId);
            }
        }
        
        // Clean up the identified loops
        loopsToClean.forEach(matchIdToClean => {
            clearInterval(fastify.gameLoops.get(matchIdToClean));
            fastify.gameLoops.delete(matchIdToClean);
            if (fastify.gameStates && fastify.gameStates.has(matchIdToClean)) {
                fastify.gameStates.delete(matchIdToClean);
            }
        });
    }

    // J'ajoute le joueur a la map matchs pour le match 1v1 actuel
    if (!fastify.matchsMap.has(Number(match_id))) {
        fastify.matchsMap.set(Number(match_id), []);
    }
    
    const playerData = {
        id_player: user_id, 
        ws: socket, 
        isPlayer1: isPlayer1,
        lastPaddleUpdate: Date.now()
    };
    
    fastify.matchsMap.get(Number(match_id)).push(playerData);

    // Je vérifie que l'autre joueur n'a pas gave up en changeant de page. Si c'est le cas, je
    try {
        const tableName = isConnect4Match ? 'connect4_online_matchs_history' : 'matchs_history';
        const line_db = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [match_id]);
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

                await stopMatch(fastify, other_id, match_id, isConnect4Match);

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
        const gameState = fastify.gameStates.get(match_id);

        if (!my_match || !gameState) return;

        // Defensive: never allow Pong logic to run for Connect4 matches
        if (gameState.gameType === 'connect4') {
            // Ignore all pong-related messages
            if (typeof message === 'string' && (message.includes('ball_update') || message.includes('paddle_update'))) {
                console.warn(`Ignoring Pong message in Connect4 game (match ${match_id})`);
                return;
            }
        }

        let received = message.toString();
        let object_received;

        try {
            object_received = JSON.parse(received);

            // Validate game type during connection
            if (object_received.type === "connection") {
                if (object_received.gameType === 'connect4' || object_received.gameType === 'pong') {
                    console.log(`Game type validated: ${object_received.gameType}`);
                } else {
                    console.error("Unsupported game type received:", object_received.gameType);
                    socket.send(JSON.stringify({ success: false, error: "unsupported_game_type" }));
                    socket.close();
                    return;
                }
            }

            // Ensure messages are only processed for the correct game type
            if (gameState.gameType === 'connect4' && (object_received.type === "ball_update" || object_received.type === "paddle_update")) {
                console.warn(`Ignoring Pong message "${object_received.type}" in Connect4 game (match ${match_id})`);
                return;
            }

            if (gameState.gameType === 'pong' && object_received.type === "move") {
                console.warn(`Ignoring Connect4 message "${object_received.type}" in Pong game (match ${match_id})`);
                return;
            }

            // Handle connection when both players are present
            if (my_match.length == 2 && object_received.type == "connection") {
                console.log("Both players connected to match", match_id);

                // Send connection confirmation with player roles
                my_match.forEach(player => {
                    const connectionMsg = {
                        type: "connection", 
                        message: "both_players",
                        isPlayer1: player.isPlayer1
                    };
                    player.ws.send(JSON.stringify(connectionMsg));
                });

                // Start game after short delay
                setTimeout(async () => {
                    gameState.gameStarted = true;

                    // Get player names from database
                    const player1Data = await db.get('SELECT username FROM users WHERE id = ?', [matchInfo.first_player]);
                    const player2Data = await db.get('SELECT username FROM users WHERE id = ?', [matchInfo.second_player]);

                    const player1Name = player1Data ? player1Data.username : 'Player 1';
                    const player2Name = player2Data ? player2Data.username : 'Player 2';

                    my_match.forEach(player => {
                        player.ws.send(JSON.stringify({
                            type: "game_start",
                            player1: player1Name,
                            player2: player2Name,
                            isPlayer1: player.isPlayer1
                        }));
                    });

                    // Start game based on type
                    if (!gameState.gameType) {
                        console.error('No gameType set in gameState, aborting game loop start!');
                        return;
                    }
                    if (gameState.gameType === 'connect4') {
                        console.log('Connect4 match started - no server game loop needed');
                        // Connect4 is turn-based, no continuous game loop needed
                        return;
                    }
                    // Always initialize gameLoops if not present
                    if (!fastify.gameLoops) {
                        fastify.gameLoops = new Map();
                    }
                    if (gameState.gameType === 'pong') {
                        await startGameLoop(fastify, match_id);
                    }
                }, 1000);
            }

            // Handle paddle updates (for Pong)
            if (object_received.type == "paddle_update" && gameState.gameStarted && gameState.gameType === 'pong') {
                const playerData = my_match.find(p => p.id_player === user_id);
                if (playerData) {
                    const now = Date.now();
                    // Throttle paddle updates
                    if (now - playerData.lastPaddleUpdate > 16) { // ~60fps
                        if (playerData.isPlayer1) {
                            gameState.leftPaddleY = object_received.position;
                        } else {
                            gameState.rightPaddleY = object_received.position;
                        }
                        playerData.lastPaddleUpdate = now;
                        
                        // Broadcast to other player
                        const otherPlayer = my_match.find(p => p.id_player !== user_id);
                        if (otherPlayer) {
                            otherPlayer.ws.send(JSON.stringify({
                                type: "paddle_update",
                                player: playerData.isPlayer1 ? "player1" : "player2",
                                position: object_received.position
                            }));
                        }
                    }
                }
            }

            // Handle Connect4 moves
            if (object_received.type == "move" && gameState.gameStarted && gameState.gameType === 'connect4') {
                const playerData = my_match.find(p => p.id_player === user_id);
                if (playerData) {
                    // Check if it's the current player's turn
                    const expectedPlayer = gameState.currentPlayer;
                    const actualPlayer = playerData.isPlayer1 ? 1 : 2;
                    
                    if (expectedPlayer === actualPlayer) {
                        const column = object_received.column;
                        
                        // Validate column
                        if (column >= 0 && column < 7) {
                            // Find the lowest available row in the column
                            let row = -1;
                            for (let r = 5; r >= 0; r--) { // Start from bottom
                                if (gameState.board[r][column] === 0) {
                                    row = r;
                                    break;
                                }
                            }
                            
                            if (row >= 0) {
                                // Make the move
                                gameState.board[row][column] = actualPlayer;
                                
                                // Check for win or draw
                                const winner = checkConnect4Win(gameState.board, row, column, actualPlayer);
                                const isDraw = !winner && gameState.board[0].every(cell => cell !== 0);
                                
                                if (winner || isDraw) {
                                    gameState.gameEnded = true;
                                    gameState.winner = winner ? `Player ${winner}` : 'Draw';
                                    
                                    // Update database
                                    (async () => {
                                        try {
                                            if (winner) {
                                                const winnerId = winner === 1 ? matchInfo.first_player : matchInfo.second_player;
                                                const tableName = isConnect4Match ? 'connect4_online_matchs_history' : 'matchs_history';
                                                await db.run(`UPDATE ${tableName} SET winner_id = ? WHERE id = ?`, [winnerId, match_id]);
                                            }
                                        } catch (dbError) {
                                            console.error('Error updating Connect4 match result:', dbError);
                                        }
                                    })();
                                    
                                    // Notify both players of game end
                                    my_match.forEach(player => {
                                        player.ws.send(JSON.stringify({
                                            type: "game_end",
                                            winner: gameState.winner,
                                            board: gameState.board
                                        }));
                                    });
                                } else {
                                    // Switch turns
                                    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
                                    
                                    // Broadcast move to both players
                                    my_match.forEach(player => {
                                        player.ws.send(JSON.stringify({
                                            type: "move",
                                            board: gameState.board,
                                            currentPlayer: gameState.currentPlayer,
                                            lastMove: { row, column, player: actualPlayer }
                                        }));
                                    });
                                }
                            }
                        }
                    }
                }
            }

            if (object_received.type == "ping") {
                console.log("ping received from match", match_id);
            }

        } catch (err) {
            console.error("Error parsing WebSocket message:", err);
            const object_to_send = { type: "error", message: "invalid_json" };
            socket.send(JSON.stringify(object_to_send));
        }
    });

    socket.on('error', (err) => {

        // A faire : gerer la deconnexion

    });

    socket.on('close', async (code, reason) => {
        console.log(`Socket closing for user ${user_id} in match ${match_id}, code: ${code}`);
        
        // Clean up this user from any active match maps first
        if (fastify.matchsMap && fastify.matchsMap.has(Number(match_id))) {
            const currentMatch = fastify.matchsMap.get(Number(match_id));
            const userIndex = currentMatch.findIndex(p => p.id_player === user_id);
            if (userIndex !== -1) {
                currentMatch.splice(userIndex, 1);
                console.log(`Removed user ${user_id} from match ${match_id} player list`);
                
                // If match is now empty, clean it up completely
                if (currentMatch.length === 0) {
                    fastify.matchsMap.delete(Number(match_id));
                    console.log(`Match ${match_id} is now empty, removed from matchsMap`);
                    
                    // Clean up game loop and state
                    if (fastify.gameLoops && fastify.gameLoops.has(Number(match_id))) {
                        clearInterval(fastify.gameLoops.get(Number(match_id)));
                        fastify.gameLoops.delete(Number(match_id));
                        console.log(`Cleaned up game loop for empty match ${match_id}`);
                    }
                    
                    if (fastify.gameStates && fastify.gameStates.has(Number(match_id))) {
                        fastify.gameStates.delete(Number(match_id));
                        console.log(`Cleaned up game state for empty match ${match_id}`);
                    }
                }
            }
        }
        
        // Vérifiez si le match est déjà terminé dans les deux tables
        let my_match_line = await db.get('SELECT * FROM matchs_history WHERE id = ?', [Number(match_id)]);
        let isConnect4MatchForClose = false;
        
        // If not found in pong table, check connect4 table
        if (!my_match_line) {
            my_match_line = await db.get('SELECT * FROM connect4_online_matchs_history WHERE id = ?', [Number(match_id)]);
            if (my_match_line) {
                isConnect4MatchForClose = true;
            }
        }
        
        if (my_match_line && my_match_line.winner_id) {
            console.log(`Match ${match_id} already finished. Skipping further processing.`);
            return; // Le match est déjà terminé, ne faites rien
        }

        // Si le match n'est pas terminé, arrêtez-le correctement
        if (!my_match_line || !my_match_line.winner_id) {
            console.log(`Stopping match ${match_id} due to player disconnection.`);
            await stopMatch(fastify, user_id, match_id, isConnect4MatchForClose);
        }
        console.log("Connexion fermée par le client", code, reason.toString());
    });
  });



    fastify.get('/api/ws/play/connect4/:id', { websocket: true }, async (socket, req) => {

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

    // Get match info to determine player roles and game type
    let matchInfo;
    let isConnect4Match = false;
    try {
        // First try to find the match in pong matchs_history
        matchInfo = await db.get('SELECT * FROM matchs_history WHERE id = ?', [match_id]);
        
        // If not found, try connect4_online_matchs_history
        if (!matchInfo) {
            matchInfo = await db.get('SELECT * FROM connect4_online_matchs_history WHERE id = ?', [match_id]);
            if (matchInfo) {
                isConnect4Match = true;
            }
        }
        
        if (!matchInfo) {
            socket.send(JSON.stringify({success: false, error: "match_not_found"}));
            socket.close();
            return;
        }
    } catch (err) {
        socket.send(JSON.stringify({success: false, error: "db_error"}));
        socket.close();
        return;
    }

    // Determine if this player is player1 or player2
    const isPlayer1 = Number(matchInfo.first_player) === user_id;
    const isPlayer2 = Number(matchInfo.second_player) === user_id;
    
    if (!isPlayer1 && !isPlayer2) {
        socket.send(JSON.stringify({success: false, error: "not_in_match"}));
        socket.close();
        return;
    }

    // Initialize game state if it doesn't exist
    if (!fastify.gameStates) {
        fastify.gameStates = new Map();
    }
    
    if (!fastify.gameStates.has(match_id)) {
            fastify.gameStates.set(match_id, {
                gameType: 'connect4',
                board: Array(6).fill(null).map(() => Array(7).fill(0)), // 6 rows, 7 columns
                currentPlayer: 1, // Player 1 starts
                gameStarted: false,
                gameEnded: false,
                winner: null,
                lastUpdate: Date.now()
            });
    }

    
    // Clean up any existing game loops for this user before starting new match
    if (fastify.gameLoops) {
        for (const [existingMatchId, interval] of fastify.gameLoops.entries()) {
            // Check if this user is in any existing matches
            const existingMatch = fastify.matchsMap.get(existingMatchId);
            if (existingMatch && existingMatch.some(p => p.id_player === user_id)) {
                console.log(`Cleaning up existing game loop for match ${existingMatchId} before starting new match ${match_id}`);
                clearInterval(interval);
                fastify.gameLoops.delete(existingMatchId);
                
                // Also clean up the game state
                if (fastify.gameStates && fastify.gameStates.has(existingMatchId)) {
                    fastify.gameStates.delete(existingMatchId);
                }
            }
        }
    }

    // IMPORTANT: If this is a Connect4 match, clean up any Pong game loops that might still be running
    if (isConnect4Match && fastify.gameLoops) {
        const loopsToClean = [];
        for (const [existingMatchId, interval] of fastify.gameLoops.entries()) {
            const existingGameState = fastify.gameStates?.get(existingMatchId);
            if (existingGameState && existingGameState.gameType === 'pong') {
                console.log(`Force cleaning Pong game loop ${existingMatchId} before starting Connect4 match ${match_id}`);
                loopsToClean.push(existingMatchId);
            }
        }
        
        // Clean up the identified loops
        loopsToClean.forEach(matchIdToClean => {
            clearInterval(fastify.gameLoops.get(matchIdToClean));
            fastify.gameLoops.delete(matchIdToClean);
            if (fastify.gameStates && fastify.gameStates.has(matchIdToClean)) {
                fastify.gameStates.delete(matchIdToClean);
            }
        });
    }

    // J'ajoute le joueur a la map matchs pour le match 1v1 actuel
    if (!fastify.matchsMap.has(Number(match_id))) {
        fastify.matchsMap.set(Number(match_id), []);
    }
    
    const playerData = {
        id_player: user_id, 
        ws: socket, 
        isPlayer1: isPlayer1,
        lastPaddleUpdate: Date.now()
    };
    
    fastify.matchsMap.get(Number(match_id)).push(playerData);

    // Je vérifie que l'autre joueur n'a pas gave up en changeant de page. Si c'est le cas, je
    try {
        const tableName = isConnect4Match ? 'connect4_online_matchs_history' : 'matchs_history';
        const line_db = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [match_id]);
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

                await stopMatch(fastify, other_id, match_id, isConnect4Match);

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
        const gameState = fastify.gameStates.get(match_id);

        if (!my_match || !gameState) return;

        // Defensive: never allow Pong logic to run for Connect4 matches
        if (gameState.gameType === 'connect4') {
            // Ignore all pong-related messages
            if (typeof message === 'string' && (message.includes('ball_update') || message.includes('paddle_update'))) {
                console.warn(`Ignoring Pong message in Connect4 game (match ${match_id})`);
                return;
            }
        }

        let received = message.toString();
        let object_received;

        try {
            object_received = JSON.parse(received);

            // Validate game type during connection
            if (object_received.type === "connection") {
                if (object_received.gameType === 'connect4' || object_received.gameType === 'pong') {
                    console.log(`Game type validated: ${object_received.gameType}`);
                } else {
                    console.error("Unsupported game type received:", object_received.gameType);
                    socket.send(JSON.stringify({ success: false, error: "unsupported_game_type" }));
                    socket.close();
                    return;
                }
            }

            // Ensure messages are only processed for the correct game type
            if (gameState.gameType === 'connect4' && (object_received.type === "ball_update" || object_received.type === "paddle_update")) {
                console.warn(`Ignoring Pong message "${object_received.type}" in Connect4 game (match ${match_id})`);
                return;
            }

            if (gameState.gameType === 'pong' && object_received.type === "move") {
                console.warn(`Ignoring Connect4 message "${object_received.type}" in Pong game (match ${match_id})`);
                return;
            }

            // Handle connection when both players are present
            if (my_match.length == 2 && object_received.type == "connection") {
                console.log("Both players connected to match", match_id);

                // Send connection confirmation with player roles
                my_match.forEach(player => {
                    const connectionMsg = {
                        type: "connection", 
                        message: "both_players",
                        isPlayer1: player.isPlayer1
                    };
                    player.ws.send(JSON.stringify(connectionMsg));
                });

                // Start game after short delay
                setTimeout(async () => {
                    gameState.gameStarted = true;

                    // Get player names from database
                    const player1Data = await db.get('SELECT username FROM users WHERE id = ?', [matchInfo.first_player]);
                    const player2Data = await db.get('SELECT username FROM users WHERE id = ?', [matchInfo.second_player]);

                    const player1Name = player1Data ? player1Data.username : 'Player 1';
                    const player2Name = player2Data ? player2Data.username : 'Player 2';

                    my_match.forEach(player => {
                        player.ws.send(JSON.stringify({
                            type: "game_start",
                            player1: player1Name,
                            player2: player2Name,
                            isPlayer1: player.isPlayer1
                        }));
                    });

                    // Start game based on type
                    if (!gameState.gameType) {
                        console.error('No gameType set in gameState, aborting game loop start!');
                        return;
                    }
                    if (gameState.gameType === 'connect4') {
                        console.log('Connect4 match started - no server game loop needed');
                        // Connect4 is turn-based, no continuous game loop needed
                        return;
                    }
                    // Always initialize gameLoops if not present
                    if (!fastify.gameLoops) {
                        fastify.gameLoops = new Map();
                    }
                    if (gameState.gameType === 'pong') {
                        await startGameLoop(fastify, match_id);
                    }
                }, 1000);
            }

            // Handle paddle updates (for Pong)
            if (object_received.type == "paddle_update" && gameState.gameStarted && gameState.gameType === 'pong') {
                const playerData = my_match.find(p => p.id_player === user_id);
                if (playerData) {
                    const now = Date.now();
                    // Throttle paddle updates
                    if (now - playerData.lastPaddleUpdate > 16) { // ~60fps
                        if (playerData.isPlayer1) {
                            gameState.leftPaddleY = object_received.position;
                        } else {
                            gameState.rightPaddleY = object_received.position;
                        }
                        playerData.lastPaddleUpdate = now;
                        
                        // Broadcast to other player
                        const otherPlayer = my_match.find(p => p.id_player !== user_id);
                        if (otherPlayer) {
                            otherPlayer.ws.send(JSON.stringify({
                                type: "paddle_update",
                                player: playerData.isPlayer1 ? "player1" : "player2",
                                position: object_received.position
                            }));
                        }
                    }
                }
            }

            // Handle Connect4 moves
            if (object_received.type == "move" && gameState.gameStarted && gameState.gameType === 'connect4') {
                const playerData = my_match.find(p => p.id_player === user_id);
                if (playerData) {
                    // Check if it's the current player's turn
                    const expectedPlayer = gameState.currentPlayer;
                    const actualPlayer = playerData.isPlayer1 ? 1 : 2;
                    
                    if (expectedPlayer === actualPlayer) {
                        const column = object_received.column;
                        
                        // Validate column
                        if (column >= 0 && column < 7) {
                            // Find the lowest available row in the column
                            let row = -1;
                            for (let r = 5; r >= 0; r--) { // Start from bottom
                                if (gameState.board[r][column] === 0) {
                                    row = r;
                                    break;
                                }
                            }
                            
                            if (row >= 0) {
                                // Make the move
                                gameState.board[row][column] = actualPlayer;
                                
                                // Check for win or draw
                                const winner = checkConnect4Win(gameState.board, row, column, actualPlayer);
                                const isDraw = !winner && gameState.board[0].every(cell => cell !== 0);
                                
                                if (winner || isDraw) {
                                    gameState.gameEnded = true;
                                    gameState.winner = winner ? `Player ${winner}` : 'Draw';
                                    
                                    // Update database
                                    (async () => {
                                        try {
                                            if (winner) {
                                                const winnerId = winner === 1 ? matchInfo.first_player : matchInfo.second_player;
                                                const tableName = isConnect4Match ? 'connect4_online_matchs_history' : 'matchs_history';
                                                await db.run(`UPDATE ${tableName} SET winner_id = ? WHERE id = ?`, [winnerId, match_id]);
                                            }
                                        } catch (dbError) {
                                            console.error('Error updating Connect4 match result:', dbError);
                                        }
                                    })();
                                    
                                    // Notify both players of game end
                                    my_match.forEach(player => {
                                        player.ws.send(JSON.stringify({
                                            type: "game_end",
                                            winner: gameState.winner,
                                            board: gameState.board
                                        }));
                                    });
                                } else {
                                    // Switch turns
                                    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
                                    
                                    // Broadcast move to both players
                                    my_match.forEach(player => {
                                        player.ws.send(JSON.stringify({
                                            type: "move",
                                            board: gameState.board,
                                            currentPlayer: gameState.currentPlayer,
                                            lastMove: { row, column, player: actualPlayer }
                                        }));
                                    });
                                }
                            }
                        }
                    }
                }
            }

            if (object_received.type == "ping") {
                console.log("ping received from match", match_id);
            }

        } catch (err) {
            console.error("Error parsing WebSocket message:", err);
            const object_to_send = { type: "error", message: "invalid_json" };
            socket.send(JSON.stringify(object_to_send));
        }
    });

    socket.on('error', (err) => {

        // A faire : gerer la deconnexion

    });

    socket.on('close', async (code, reason) => {
        console.log(`Socket closing for user ${user_id} in match ${match_id}, code: ${code}`);
        
        // Clean up this user from any active match maps first
        if (fastify.matchsMap && fastify.matchsMap.has(Number(match_id))) {
            const currentMatch = fastify.matchsMap.get(Number(match_id));
            const userIndex = currentMatch.findIndex(p => p.id_player === user_id);
            if (userIndex !== -1) {
                currentMatch.splice(userIndex, 1);
                console.log(`Removed user ${user_id} from match ${match_id} player list`);
                
                // If match is now empty, clean it up completely
                if (currentMatch.length === 0) {
                    fastify.matchsMap.delete(Number(match_id));
                    console.log(`Match ${match_id} is now empty, removed from matchsMap`);
                    
                    // Clean up game loop and state
                    if (fastify.gameLoops && fastify.gameLoops.has(Number(match_id))) {
                        clearInterval(fastify.gameLoops.get(Number(match_id)));
                        fastify.gameLoops.delete(Number(match_id));
                        console.log(`Cleaned up game loop for empty match ${match_id}`);
                    }
                    
                    if (fastify.gameStates && fastify.gameStates.has(Number(match_id))) {
                        fastify.gameStates.delete(Number(match_id));
                        console.log(`Cleaned up game state for empty match ${match_id}`);
                    }
                }
            }
        }
        
        // Vérifiez si le match est déjà terminé dans les deux tables
        let my_match_line = await db.get('SELECT * FROM matchs_history WHERE id = ?', [Number(match_id)]);
        let isConnect4MatchForClose = false;
        
        // If not found in pong table, check connect4 table
        if (!my_match_line) {
            my_match_line = await db.get('SELECT * FROM connect4_online_matchs_history WHERE id = ?', [Number(match_id)]);
            if (my_match_line) {
                isConnect4MatchForClose = true;
            }
        }
        
        if (my_match_line && my_match_line.winner_id) {
            console.log(`Match ${match_id} already finished. Skipping further processing.`);
            return; // Le match est déjà terminé, ne faites rien
        }

        // Si le match n'est pas terminé, arrêtez-le correctement
        if (!my_match_line || !my_match_line.winner_id) {
            console.log(`Stopping match ${match_id} due to player disconnection.`);
            await stopMatch(fastify, user_id, match_id, isConnect4MatchForClose);
        }
        console.log("Connexion fermée par le client", code, reason.toString());
    });
  });


  

    async function stopMatch(fastify, user_id_who_stopped, match_id, isConnect4Match = false) {
        if (isConnect4Match) {
            return await stopMatchConnect4(fastify, user_id_who_stopped, match_id);
        }
        // ...existing code for Pong (as before)...
        const user_id = user_id_who_stopped;
        if (fastify.matchsMap.has(Number(match_id))) {
            const tableName = 'matchs_history';
            const my_match = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [Number(match_id)]);
            let id_room = 0;
            let round = 0;
            let other_player_id = 0;
            if (my_match) {
                id_room = Number(my_match.id_room);
                round = Number(my_match.round);
                other_player_id = (Number(my_match.first_player) == Number(user_id)) ? Number(my_match.second_player) : Number(my_match.first_player);
            }
            await db.run(`UPDATE ${tableName} SET winner_id = ? WHERE id = ?`, [other_player_id, match_id]);
            await db.run("UPDATE rooms_players SET eliminated = true WHERE id_player = ? AND id_room = ?", [user_id, id_room]);
            const finished = await checkIfRoundEnded(id_room, round);
            const winner = await db.get('SELECT * FROM users WHERE id = ?', [Number(other_player_id)]);
            const winner_username = winner.username;
            if (finished) {
                let nb_matchs_done = 0;
                try {
                    const pongMatches = await db.get('SELECT COUNT(*) as count FROM matchs_history WHERE round = ? AND id_room = ?', [Number(round), Number(id_room)]);
                    const connect4Matches = await db.get('SELECT COUNT(*) as count FROM connect4_online_matchs_history WHERE round = ? AND id_room = ?', [Number(round), Number(id_room)]);
                    nb_matchs_done = pongMatches.count + connect4Matches.count;
                } catch (err) {
                    return ({success:false, error:"db_access"});
                }
                if (nb_matchs_done >= 2) {
                    try {
                        await generateRound(fastify, id_room);
                        const tabl_matchs = await getCurrentMatchs(id_room);
                        const room = fastify.roomsMap.get(Number(id_room));
                        for (const player of room) {
                            player.ws.send(JSON.stringify({success:true, cause:"list_matchs", matchs:tabl_matchs}));
                        }
                    } catch (err) {
                        return ({success:false, error:"generated_round_error"});
                    }
                } else {
                    try {
                        await db.run("UPDATE rooms SET finished = true, winner_id = ? WHERE id = ?", [winner.id , id_room]);
                    } catch (err) {
                        console.log("error with stop tournament db");
                        return (JSON.stringify({success:false, cause:"db_access"}));
                    }
                    const room = fastify.roomsMap.get(Number(id_room));
                    for (const player of room) {
                        player.ws.send(JSON.stringify({success:true, cause:"end_of_tournament", winner:winner_username}));
                        player.ws.close();
                    }
                }
            }
            const players_match = fastify.matchsMap.get(Number(match_id));
            for (const real_player of players_match) {
                const obj = {type:"stop_match", winner_username:winner_username};
                real_player.ws.send(JSON.stringify(obj));
            }
            for (const real_player of players_match) {
                real_player.ws.close();
            }
            fastify.matchsMap.delete(Number(match_id));
            return (JSON.stringify({success:true}));
        }
    }

    // Nouvelle fonction dédiée pour Connect4
    async function stopMatchConnect4(fastify, user_id_who_stopped, match_id) {
        const user_id = user_id_who_stopped;
        if (!fastify.matchsMap.has(Number(match_id))) return;
        const tableName = 'connect4_online_matchs_history';
        const my_match = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, [Number(match_id)]);
        let id_room = 0;
        let round = 0;
        let other_player_id = 0;
        if (my_match) {
            id_room = Number(my_match.id_room);
            round = Number(my_match.round);
            other_player_id = (Number(my_match.first_player) == Number(user_id)) ? Number(my_match.second_player) : Number(my_match.first_player);
        }
        // On vérifie la condition de victoire sur le board si possible
        let winner_id = other_player_id;
        let winner_username = null;
        // Si on a un gameState, on vérifie la victoire réelle
        const gameState = fastify.gameStates?.get(match_id);
        if (gameState && gameState.board) {
            // On cherche s'il y a un gagnant sur le board
            let foundWinner = null;
            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 7; col++) {
                    if (gameState.board[row][col] !== 0) {
                        const res = checkConnect4Win(gameState.board, row, col, gameState.board[row][col]);
                        if (res) {
                            foundWinner = res;
                            break;
                        }
                    }
                }
                if (foundWinner) break;
            }
            if (foundWinner) {
                winner_id = (foundWinner === 1) ? my_match.first_player : my_match.second_player;
            } else if (gameState.board[0].every(cell => cell !== 0)) {
                winner_id = null; // Match nul
            }
        }
        if (winner_id) {
            await db.run(`UPDATE ${tableName} SET winner_id = ? WHERE id = ?`, [winner_id, match_id]);
            await db.run("UPDATE rooms_players SET eliminated = true WHERE id_player = ? AND id_room = ?", [user_id, id_room]);
            const winner = await db.get('SELECT * FROM users WHERE id = ?', [Number(winner_id)]);
            winner_username = winner?.username || null;
        } else {
            // Match nul
            await db.run(`UPDATE ${tableName} SET winner_id = NULL WHERE id = ?`, [match_id]);
            winner_username = 'Draw';
        }
        // Vérifie si tous les matchs sont finis pour ce round et cette room
        const finished = await checkIfRoundEnded(id_room, round);
        if (finished) {
            let nb_matchs_done = 0;
            try {
                const pongMatches = await db.get('SELECT COUNT(*) as count FROM matchs_history WHERE round = ? AND id_room = ?', [Number(round), Number(id_room)]);
                const connect4Matches = await db.get('SELECT COUNT(*) as count FROM connect4_online_matchs_history WHERE round = ? AND id_room = ?', [Number(round), Number(id_room)]);
                nb_matchs_done = pongMatches.count + connect4Matches.count;
            } catch (err) {
                return ({success:false, error:"db_access"});
            }
            if (nb_matchs_done >= 2) {
                try {
                    await generateRound(fastify, id_room);
                    const tabl_matchs = await getCurrentMatchs(id_room);
                    const room = fastify.roomsMap.get(Number(id_room));
                    for (const player of room) {
                        player.ws.send(JSON.stringify({success:true, cause:"list_matchs", matchs:tabl_matchs}));
                    }
                } catch (err) {
                    return ({success:false, error:"generated_round_error"});
                }
            } else {
                try {
                    await db.run("UPDATE rooms SET finished = true, winner_id = ? WHERE id = ?", [winner_id , id_room]);
                } catch (err) {
                    console.log("error with stop tournament db");
                    return (JSON.stringify({success:false, cause:"db_access"}));
                }
                const room = fastify.roomsMap.get(Number(id_room));
                for (const player of room) {
                    player.ws.send(JSON.stringify({success:true, cause:"end_of_tournament", winner:winner_username}));
                    player.ws.close();
                }
            }
        }
        // J'envoi un message aux deux joueurs pour leur dire que le match 1v1 est fini (stop)
        const players_match = fastify.matchsMap.get(Number(match_id));
        for (const real_player of players_match) {
            const obj = {type:"stop_match", winner_username:winner_username};
            real_player.ws.send(JSON.stringify(obj));
        }
        for (const real_player of players_match) {
            real_player.ws.close();
        }
        fastify.matchsMap.delete(Number(match_id));
        return (JSON.stringify({success:true}));
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
                    await stopMatch(fastify, user_id, match_id);
                }
                

        } catch (err)
        {
            return ({success : false, error : "db_access"});
        }



        return({sucess:true});

        
    });



    // Arrete une partie 1V1 (id = match id)  (envoyé lorsque le joueur souhaite abandonner ingame 1v1)
    fastify.get('/api/stop_match/:id', {preValidation: [fastify.authenticate]}, async (request, reply) => {

        const match_id = Number(request.params.id);
        const user_id = request.user.id; 

        console.log("Je suis dans stop match avec match_id = " + match_id);

        // Vérifier que le match existe et que l'utilisateur en fait partie
        let my_match;
        let isConnect4Match = false;
        try {
            // First try pong matches
            my_match = await db.get('SELECT * FROM matchs_history WHERE id = ? AND (first_player = ? OR second_player = ?)', [match_id, user_id, user_id]);
            
            // If not found, try connect4 matches
            if (!my_match) {
                my_match = await db.get('SELECT * FROM connect4_online_matchs_history WHERE id = ? AND (first_player = ? OR second_player = ?)', [match_id, user_id, user_id]);
                if (my_match) {
                    isConnect4Match = true;
                }
            }
            
            if (!my_match) {
                return ({success:false, error:"match_not_found_or_not_participant"});
            }
        } catch (err) {
            return ({success:false, error:"db_access"});
        }

        console.log("Je suis dans stop match 2");


        if (fastify.matchsMap.has(Number(match_id)))
        {
            // Utiliser les données déjà récupérées
            const tableName = isConnect4Match ? 'connect4_online_matchs_history' : 'matchs_history';
            
            const id_room = Number(my_match.id_room);
            const round = Number(my_match.round);
            const other_player_id = (Number(my_match.first_player) == Number(user_id)) ? Number(my_match.second_player) : Number(my_match.first_player);

            // Met a jour dans la base de donnée le gagnant et indique donc la fin du match 1v1
            await db.run(`UPDATE ${tableName} SET winner_id = ? WHERE id = ?`, [other_player_id, match_id]);

            // Met dans la table rooms_players le champ eliminated a true pour le joueur éliminé
            await db.run(`UPDATE rooms_players SET eliminated = true WHERE id_player = ? AND id_room = ?`, [user_id, id_room]);


            
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
                    // Count matches from both tables for this round and room
                    const pongMatches = await db.get('SELECT COUNT(*) as count FROM matchs_history WHERE round = ? AND id_room = ?', [Number(round), Number(id_room)]);
                    const connect4Matches = await db.get('SELECT COUNT(*) as count FROM connect4_online_matchs_history WHERE round = ? AND id_room = ?', [Number(round), Number(id_room)]);
                    nb_matchs_done = pongMatches.count + connect4Matches.count;
                    console.log("pong matches count = " + pongMatches.count);
                    console.log("connect4 matches count = " + connect4Matches.count);
                    console.log("total matches count = " + nb_matchs_done);
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
            // for (real_player of players_match)
            // {
            //     real_player.ws.close();
            // }

            return (JSON.stringify({success:true}));

        }
        return (JSON.stringify({success:false, cause:"no_match_with_this_id"}));
    });


    async function startGameLoop(fastify, matchId) {
        // Strict check: never start Pong game loop for Connect4
        const gameState = fastify.gameStates.get(matchId);
        if (!gameState) {
            console.error(`No gameState found for match ${matchId}, aborting game loop start.`);
            return;
        }
        if (gameState.gameType !== 'pong') {
            console.log(`Not starting game loop: gameType is '${gameState.gameType}' for match ${matchId}`);
            return;
        }

        if (fastify.gameLoops && fastify.gameLoops.has(matchId)) {
            console.log(`Game loop already running for match ${matchId}, skipping`);
            return; // Already running
        }

        if (!fastify.gameLoops) {
            fastify.gameLoops = new Map();
        }

        const match = fastify.matchsMap.get(matchId);
        if (!match) {
            console.log(`No match found for matchId ${matchId}, cannot start game loop`);
            return;
        }

        console.log(`Starting Pong game loop for match ${matchId}`);

        // Met le score a 0 des le debut du match 1v1
        gameState.player1Score = -1;
        gameState.player2Score = 0;

        const interval = setInterval(async () => {
            // Defensive: abort if gameType is not pong (should never happen, but extra safety)
            const currentState = fastify.gameStates.get(matchId);
            if (!currentState || currentState.gameType !== 'pong') {
                console.warn(`Game loop for match ${matchId} detected non-pong gameType, clearing interval.`);
                clearInterval(interval);
                fastify.gameLoops.delete(matchId);
                return;
            }

            const now = Date.now();
            const deltaTime = (now - currentState.lastUpdate) / 1000;
            currentState.lastUpdate = now;

            // Update ball position
            currentState.ballX += currentState.ballSpeedX * deltaTime * 60;
            currentState.ballY += currentState.ballSpeedY * deltaTime * 60;

            // Ball collision with top/bottom walls
            if (currentState.ballY <= 8 || currentState.ballY >= 592) {
                currentState.ballSpeedY = -currentState.ballSpeedY;
                currentState.ballY = Math.max(8, Math.min(592, currentState.ballY));
            }

            // Ball collision with paddles
            const ballRadius = 8;
            const ballLeft = currentState.ballX - ballRadius;
            const ballRight = currentState.ballX + ballRadius;
            const ballTop = currentState.ballY - ballRadius;
            const ballBottom = currentState.ballY + ballRadius;

            // Paddle dimensions and positions
            const paddleWidth = 13; 
            const paddleHeight = 120;
            
            // Left paddle bounds 
            const leftPaddleX = 27;
            const leftPaddleLeft = leftPaddleX - paddleWidth / 2;
            const leftPaddleRight = leftPaddleX + paddleWidth / 2;
            const leftPaddleTop = currentState.leftPaddleY;
            const leftPaddleBottom = currentState.leftPaddleY + paddleHeight;

            // Right paddle bounds 
            const rightPaddleX = 773;
            const rightPaddleLeft = rightPaddleX - paddleWidth / 2;
            const rightPaddleRight = rightPaddleX + paddleWidth / 2;
            const rightPaddleTop = currentState.rightPaddleY;
            const rightPaddleBottom = currentState.rightPaddleY + paddleHeight;

            // Check collision with left paddle
            const collidesLeft =
                ballRight > leftPaddleLeft &&
                ballLeft < leftPaddleRight &&
                ballBottom > leftPaddleTop &&
                ballTop < leftPaddleBottom;

            // Check collision with right paddle
            const collidesRight =
                ballRight > rightPaddleLeft &&
                ballLeft < rightPaddleRight &&
                ballBottom > rightPaddleTop &&
                ballTop < rightPaddleBottom;

            if (collidesLeft && currentState.ballSpeedX < 0) {
                currentState.ballSpeedX = Math.abs(currentState.ballSpeedX);
                // Move ball out of paddle to prevent sticking
                currentState.ballX = leftPaddleRight + ballRadius;
            } else if (collidesRight && currentState.ballSpeedX > 0) {
                currentState.ballSpeedX = -Math.abs(currentState.ballSpeedX);
                // Move ball out of paddle to prevent sticking
                currentState.ballX = rightPaddleLeft - ballRadius;
            }

            // Ball goes off screen (scoring)
            if (currentState.ballX <= 0 || currentState.ballX >= 800) {
                if (currentState.ballX <= 0) {
                    currentState.player2Score++;
                } else {
                    currentState.player1Score++;
                }

                // Reset ball
                currentState.ballX = 400;
                currentState.ballY = 300;
                currentState.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 4;
                currentState.ballSpeedY = (Math.random() - 0.5) * 6;

                // Send score update
                match.forEach(player => {
                    player.ws.send(JSON.stringify({
                        type: "score_update",
                        player1Score: currentState.player1Score,
                        player2Score: currentState.player2Score
                    }));
                });

                // Check for game end (first to 5 points wins)
                if (currentState.player1Score >= 5 || currentState.player2Score >= 5) { // Modifier le score pour gagner ICI
                    const winner = currentState.player1Score >= 5 ? "player1" : "player2"; // ET ICI

                    // Obtient l'user_id du joueur qui a perdu
                    let loser_id;
                    for (const player of match)
                    {
                        if (player.isPlayer1 && winner == "player2")
                        {
                            // Le premier joueur a perdu, je recupere son id
                            loser_id = player.id_player;
                        }
                        if (player.isPlayer1 == false && winner == "player1")
                        {
                            // Le deuxieme joueur a perdu, je recupere son id
                            loser_id = player.id_player;
                        }
                    }

                    console.log("le gagnant est : " + winner);

                    // Arrete le match 1v1, génère les nouveaux matchs si possible et coupe la connexion WS de /play
                    await stopMatch(fastify, loser_id, matchId);
                    
                    match.forEach(player => {
                        player.ws.send(JSON.stringify({
                            type: "game_end",
                            winner: winner,
                            player1Score: currentState.player1Score,
                            player2Score: currentState.player2Score
                        }));
                    });

                    clearInterval(interval);
                    fastify.gameLoops.delete(matchId);
                    fastify.gameStates.delete(matchId);
                    
                    console.log(`Game ${matchId} ended. Winner: ${winner}`);
                    return;
                }
            }

            // Send ball update to clients
            match.forEach(player => {
                player.ws.send(JSON.stringify({
                    type: "ball_update",
                    ballX: currentState.ballX,
                    ballY: currentState.ballY,
                    ballSpeedX: currentState.ballSpeedX,
                    ballSpeedY: currentState.ballSpeedY
                }));
            });

        }, 16); // ~60fps

        fastify.gameLoops.set(matchId, interval);
    }
}
module.exports = gameRoutes;

