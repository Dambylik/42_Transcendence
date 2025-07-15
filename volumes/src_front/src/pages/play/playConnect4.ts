import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';

class PlayConnect4Page extends Page {
  private connect4Component: any | null = null;
  private gameSocket: WebSocket | null = null;
  private isPlayer1: boolean = true;

  constructor(id: string, router?: Router) {
    super(id, router);
  }
  
  async render(): Promise<HTMLElement> {
    this.container.innerHTML = '';
    await super.setupHeaderListeners();
    
    const dashboardContent = document.createElement('div');
    dashboardContent.className = 'min-h-screen pt-16 relative overflow-hidden flex flex-row bg-cyber-dark';
    
    dashboardContent.innerHTML = `
      ${await super.createSidebar()}
      
      <!-- Main Content -->
      <main class="flex-1 flex flex-col">
        <!-- Background Effects -->
        <div class="absolute inset-0 z-0">
          <div class="absolute inset-0 bg-grid-overlay opacity-20"></div>
          <div class="absolute inset-0 scanlines"></div>
          <!-- Cyber borders -->
          <div class="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-neon-pink opacity-50"></div>
          <div class="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-neon-cyan opacity-50"></div>
          <div class="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-neon-cyan opacity-50"></div>
          <div class="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-neon-pink opacity-50"></div>
        </div>
        
        <div id="mainContainer" class="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 relative z-10">
          <div id="gameDiv" class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10 text-center">
            
            <!-- Loading View -->
            <div id="divLoading">
              <div id="gameLoading" class="text-2xl font-cyber text-neon-cyan mb-4">Waiting for the second player...</div>
              <div class="animate-spin w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
              <br>
            </div>

            <!-- Finished View -->
            <div id="divFinished">
              <div id="divMessage"></div>
              <br>
              <div id="divJoinRoom" class="bg-neon-cyan text-black px-4 py-2 rounded text-xl cursor-pointer hover:bg-cyan-400 transition">
                <a data-route="/game/connect4_online" href="/game/connect4_online" id="joinRoomInGame">Go back to the tournament</a>
              </div>
            </div>

            <!-- Game Started View -->
            <div id="divStarted">
              <div id="connect4-container" class="mt-4 cyber-border relative w-full flex-col items-center"></div>
              <div class="mt-4">
                <div class="bg-red-600 text-white text-xs px-4 py-2 rounded">
                  <button id="buttonStop">Give up (lose)</button>
                </div>
              </div>
            </div>

            <!-- Return to Room View -->
            <div id="divReturnRoom">
              <h1 class="text-2xl">You can't exit and go back to a 1v1 match. Eliminated</h1>
              <p>You must wait for the next player to join the 1v1 match to continue</p>
            </div>

            <!-- Can't Join View -->
            <div id="divCantJoin">
              <h1 class="text-2xl">You can't access this match. Only one page per browser or no match available for you</h1>
            </div>

          </div>
        </div>
      </main>
    `;

    this.container.appendChild(dashboardContent);

    // Check if tournament is finished
    if (await this.checkIfTournamentFinished() || await this.checkIfTournamentFinishedWithError()) {
      this.router?.navigate('/game/connect4_online');
      return this.container;
    }

    if (await this.hasSessionStorage()) {
      // Update in database
      if (await this.checkIfAlreadyConnected()) {
        alert("You cannot leave and return to a Connect4 match. You have been eliminated.");
        await this.updateGaveUp();
        await this.showReturnRoom();
      } else {
        await this.join_match();
      }
    } else {
      await this.showCantJoin();
    }

    // Setup event listeners
    await this.stopClickEvent();
    await super.setupSidebarListeners();
    
    return this.container;
  }

  // Check if there's session storage for match
  private async hasSessionStorage(): Promise<boolean> {
    const room_sessionStorage = sessionStorage.getItem('room');
    const match_id_sessionStorage = sessionStorage.getItem('match_id');
    return room_sessionStorage !== null && match_id_sessionStorage !== null;
  }

  // Connect to the Connect4 match via WebSocket
  private async join_match(): Promise<void> {
    const my_match_id = sessionStorage.getItem('match_id');
    if (my_match_id !== null) {
      await this.connect_match_ws(Number(my_match_id));
    } else {
      console.error("Error: no match ID in sessionStorage");
      await this.showCantJoin();
    }
  }

  // Connect to match WebSocket
  private async connect_match_ws(match_id: number): Promise<void> {
    try {
        console.log(`Connecting to Connect4 match WebSocket for match ${match_id}`);
        // Correct WebSocket URL for Connect4
        this.gameSocket = new WebSocket(`wss://localhost:4430/api/ws/play/connect4/${match_id}?game=connect4`);

        this.gameSocket.addEventListener('open', () => {
            console.log('Connected to Connect4 match WebSocket');
            this.showLoading();
            
            // Send initial connection message to server with correct game type
            if (this.gameSocket) {
                console.log('Sending connection message to server');
                this.gameSocket.send(JSON.stringify({
                    type: 'connection',
                    gameType: 'connect4' // Ensure the game type is correct
                }));
            }
        });

        this.gameSocket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data);

            // Filter out messages that are not related to Connect4
            if (data.gameType && data.gameType !== 'connect4') {
                console.warn('Ignoring message for incorrect game type:', data.gameType);
                return;
            }

            // Handle only Connect4 messages
            this.handleWebSocketMessage(data);
        });

        this.gameSocket.addEventListener('close', () => {
            console.log('Connect4 match WebSocket disconnected');
        });

        this.gameSocket.addEventListener('error', (error) => {
            console.error('Connect4 match WebSocket error:', error);
            alert('WebSocket connection error. Please try again.');
            this.router?.navigate('/game/connect4_online');
        });

        // Send ping messages every 5 seconds to keep connection alive
        setInterval(() => {
            if (this.gameSocket && this.gameSocket.readyState === WebSocket.OPEN) {
                this.gameSocket.send(JSON.stringify({ type: 'ping' }));
            }
        }, 5000);

    } catch (error) {
        console.error('Failed to connect to Connect4 match:', error);
        alert('Failed to connect to the match. Please try again.');
        this.router?.navigate('/game/connect4_online');
    }
  }

  // Handle WebSocket messages
  private handleWebSocketMessage(data: any): void {
    console.log('Received Connect4 WebSocket message:', data);

    if (data.error) {
        console.error('WebSocket error:', data.error);
        alert(`Game error: ${data.error}`);
        return;
    }

    // Ignore messages not related to Connect4
    if (data.type === "ball_update") {
        console.warn("Ignoring Pong message in Connect4 game");
        return;
    }

    switch (data.type) {
      case 'connection':
        if (data.message === 'both_players') {
          console.log('Both players connected!');
          // Wait for game_start message which will initialize the game
        } else {
          console.log('Connected to match, waiting for second player');
          this.showLoading();
        }
        break;
        
      case 'game_start':
        console.log('Game starting with players:', data.player1, 'vs', data.player2);
        this.isPlayer1 = data.isPlayer1;
        this.initializeConnect4Game(data);
        break;
        
      case 'move':
        if (this.connect4Component && data.board) {
          console.log('Received move update:', data);
          // Met à jour le joueur courant depuis le serveur
          this.connect4Component.currentPlayer = data.currentPlayer;
          
          // Si on a les infos du dernier coup (row, column, player), utiliser addSingleDisc
          // pour avoir l'animation de gravité
          if (data.lastMove && data.lastMove.row !== undefined && data.lastMove.column !== undefined && data.lastMove.player !== undefined) {
            this.connect4Component.addSingleDisc(data.lastMove.row, data.lastMove.column, data.lastMove.player);
          } else {
            // Sinon, utiliser updateGameState comme avant
            this.connect4Component.updateGameState(data.board, data.currentPlayer);
          }
        }
        break;
        
      case 'game_end':
        console.log('Game ended, winner:', data.winner);
        const winnerName = data.winner === 1 ? 
          (this.isPlayer1 ? "YOU" : "OPPONENT") :
          (this.isPlayer1 ? "OPPONENT" : "YOU");
        this.handleGameEnd(winnerName);
        break;
        
      default:
        console.log('Unknown message type:', data.type, data);
    }
  }

  // Initialize Connect4 game
  private async initializeConnect4Game(gameData: any): Promise<void> {
    await this.showGame();

    const connect4Container = this.container.querySelector('#connect4-container');
    if (!connect4Container) {
      console.error('Connect4 container not found');
      return;
    }

    // Clear any existing content
    connect4Container.innerHTML = '';

    console.log(`Initializing Connect4 game with isPlayer1: ${gameData.isPlayer1}`);
    this.isPlayer1 = gameData.isPlayer1;
    
    // Add game info
    const gameInfo = document.createElement('div');
    gameInfo.className = 'text-center mb-4';
    const playerRole = this.isPlayer1 ? 'Player 1 (Red)' : 'Player 2 (Yellow)';
    gameInfo.innerHTML = `
      <div class="text-neon-cyan font-tech text-lg mb-2">CONNECT4 TOURNAMENT MATCH</div>
      <div class="text-gray-300 font-tech text-sm">
        CLICK COLUMNS TO DROP DISCS
      </div>
      <div class="text-yellow-400 font-tech text-xs mt-2">
        You are ${playerRole}
      </div>
    `;
    connect4Container.appendChild(gameInfo);

    try {
      // Dynamic import to reduce bundle size
      const { default: Connect4Component } = await import('../../core/components/connect4/connect4');
      
      // Create Connect4 component for online match
      this.connect4Component = new Connect4Component(
        gameData.player1 || "Player 1", 
        gameData.player2 || "Player 2",
        {
          onGameEnd: (winner: string) => {
            console.log('Local game ended, winner:', winner);
            // Server will be authoritative for game end
          }
        }
      );

      // Set up multiplayer callbacks for Connect4
      this.connect4Component.setMultiplayerCallbacks({
        onMove: (column: number) => {
          // Send move to server
          if (this.gameSocket && this.gameSocket.readyState === WebSocket.OPEN) {
            console.log('Sending move to server:', column);
            this.gameSocket.send(JSON.stringify({
              type: 'move',
              column: column
            }));
          }
        }
      });

      connect4Container.appendChild(this.connect4Component.render());
      console.log('Connect4 game component rendered successfully');

      // Listen for WebSocket messages
      this.gameSocket?.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'move' && this.connect4Component) {
          // Si on a les infos du dernier coup (row, column, player), utiliser addSingleDisc
          // pour avoir l'animation de gravité
          if (data.lastMove && data.lastMove.row !== undefined && data.lastMove.column !== undefined && data.lastMove.player !== undefined) {
            this.connect4Component.addSingleDisc(data.lastMove.row, data.lastMove.column, data.lastMove.player);
          } else {
            // Sinon, utiliser updateGameState comme avant
            this.connect4Component.updateGameState(data.board, data.currentPlayer);
          }
        } else if (data.type === 'game_end' && this.connect4Component) {
          this.connect4Component.showWinner(data.winner);
        }
      });

    } catch (error) {
      console.error("Error loading Connect4 component:", error);
      alert("Error loading Connect4 game. Please try again.");
      this.router?.navigate('/game/connect4_online');
    }
  }

  // Handle game end
  private handleGameEnd(winner: any): void {
    console.log('Game ended, winner:', winner);
    
    // Determine winner message
    let winnerMessage = '';
    if (typeof winner === 'string') {
      winnerMessage = winner;
    } else if (typeof winner === 'number') {
      winnerMessage = winner === 1 ? 'Player 1' : 'Player 2';
    } else {
      winnerMessage = 'Unknown';
    }

    this.showFinished(winnerMessage);
  }

  // Show loading screen while waiting for second player
  private async showLoading(): Promise<void> {
    await this.hideAll();
    const elt = this.container.querySelector('#divLoading');
    if (elt) {
      (elt as HTMLElement).style.display = "block";
    }
  }

  // Show game screen when both players are connected
  private async showGame(): Promise<void> {
    await this.hideAll();
    const divStarted = this.container.querySelector('#divStarted');
    if (divStarted) {
      (divStarted as HTMLElement).style.display = "block";
    }
  }

  // Show finished screen when game ends
  private async showFinished(winner_username: string): Promise<void> {
    await this.hideAll();
    const divFinished = this.container.querySelector('#divFinished');
    if (divFinished) {
      (divFinished as HTMLElement).style.display = "block";
    }

    // Generate winner message
    const winnerMessage = document.createElement('h1');
    winnerMessage.textContent = "The winner is " + winner_username;

    // Add message to div
    const elt = this.container.querySelector('#divMessage');
    if (elt) {
      elt.innerHTML = '';
      elt.appendChild(winnerMessage);
    }
  }

  // Show return to room screen
  private async showReturnRoom(): Promise<void> {
    await this.hideAll();
    const elt = this.container.querySelector('#divReturnRoom');
    if (elt) {
      (elt as HTMLElement).style.display = "block";
    }
  }

  // Show can't join screen
  private async showCantJoin(): Promise<void> {
    await this.hideAll();
    const elt = this.container.querySelector('#divCantJoin');
    if (elt) {
      (elt as HTMLElement).style.display = "block";
    }
  }

  // Hide all views
  private async hideAll(): Promise<void> {
    const divs = ['#divFinished', '#divStarted', '#divLoading', '#divReturnRoom', '#divCantJoin'];
    divs.forEach(selector => {
      const div = this.container.querySelector(selector);
      if (div) {
        (div as HTMLElement).style.display = 'none';
      }
    });
  }

  // Utility functions for tournament management
  private async checkIfTournamentFinished(): Promise<boolean> {
    const localstorage_room = sessionStorage.getItem('room');
    if (!localstorage_room) return false;
    
    try {
      const localvar = JSON.parse(localstorage_room);
      const room_id = localvar.room_id;
      
      const response = await fetch(`https://localhost:4430/api/tournament_finished/${room_id}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) return false;

      const result = await response.json();
      return result.success && result.finished;
    } catch (err) {
      return false;
    }
  }

  private async checkIfTournamentFinishedWithError(): Promise<boolean> {
    const localstorage_room = sessionStorage.getItem('room');
    if (!localstorage_room) return false;
    
    try {
      const localvar = JSON.parse(localstorage_room);
      const room_id = localvar.room_id;
      
      const response = await fetch(`https://localhost:4430/api/tournament_finished_with_error/${room_id}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) return false;

      const result = await response.json();
      return result.success && result.finished;
    } catch (err) {
      return false;
    }
  }

  private async checkIfAlreadyConnected(): Promise<boolean> {
    const my_match_id = sessionStorage.getItem('match_id');
    if (!my_match_id) return false;

    try {
      const response = await fetch(`https://localhost:4430/api/check_connected_to_match/${my_match_id}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) return false;

      const result = await response.json();
      if (result.connected === true) {
        return true;
      }

      // Update connection status
      await fetch(`https://localhost:4430/api/update_connected_to_match/${my_match_id}`, {
        method: 'GET',
        credentials: 'include'
      });

      return false;
    } catch (err) {
      return false;
    }
  }

  private async updateGaveUp(): Promise<void> {
    const my_match_id = sessionStorage.getItem('match_id');
    if (!my_match_id) return;

    try {
      await fetch(`https://localhost:4430/api/update_gave_up/${my_match_id}`, {
        method: 'GET',
        credentials: 'include'
      });
    } catch (err) {
      console.error("Error updating gave up status:", err);
    }
  }

  // Stop button click event
  private async stopClickEvent(): Promise<void> {
    const elt = this.container.querySelector('#buttonStop');
    if (elt) {
      elt.addEventListener('click', async () => {
        if (confirm("Are you sure you want to give up? Your opponent will win automatically.")) {
          await this.handleAbandonGame();
        }
      });
    }
  }

  // Handle abandoning the game
  private async handleAbandonGame(): Promise<void> {
    // Clean up Connect4 component
    if (this.connect4Component) {
      this.connect4Component.destroy();
      this.connect4Component = null;
    }

    // Clean up WebSocket
    if (this.gameSocket) {
      this.gameSocket.close();
      this.gameSocket = null;
    }

    const matchId = sessionStorage.getItem('match_id');
    if (matchId) {
      try {
        const response = await fetch(`https://localhost:4430/api/stop_match/${matchId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          alert("You have given up the match. Returning to tournament.");
        }
      } catch (error) {
        console.error("Error stopping match:", error);
      }
    }

    this.router?.navigate('/game/connect4_online');
  }

  // Clean up method
  public destroy(): void {
    // Clean up Connect4 component
    if (this.connect4Component) {
      this.connect4Component.destroy();
      this.connect4Component = null;
    }
    
    // Clean up WebSocket
    if (this.gameSocket) {
      this.gameSocket.close();
      this.gameSocket = null;
    }
    
    super.destroy?.();
  }
}

export default PlayConnect4Page;
