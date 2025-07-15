import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import PongComponent from '../../core/components/pong/pong.ts';
import { createGameRules, createEndGameScreen } from '../../core/components/pong/pongUtils.ts';

class PlayPage extends Page {
  private pongComponent: any | null = null; // Use any to avoid static import
  private gameSocket: WebSocket | null = null;
  private isPlayer1: boolean = true;

  static TextObject = {
    underConstruction: 'PAGE UNDER CONSTRUCTION',
  };

  constructor(id: string, router?: Router) {
    super(id, router);
  }
  
  async render(): Promise<HTMLElement> {
    this.container.innerHTML = '';
    await super.setupHeaderListeners();
    const sidebarHtml = await this.createSidebar();
    
    const dashboardContent = document.createElement('div');
    dashboardContent.className = 'min-h-screen pt-16 relative overflow-hidden flex flex-row bg-cyber-dark';
    dashboardContent.innerHTML = `
      ${sidebarHtml}
      
      <!-- Main Content -->
      <main class="flex-1 flex flex-col relative">
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

        <!-- Header Section -->
        <div class="relative z-10 text-center pt-8 pb-4">
          <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-4 tracking-wider">ONLINE MATCH</h1>
          <div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto mb-4"></div>
          <p class="text-neon-cyan font-cyber text-xl">MULTIPLAYER PONG GAME</p>
        </div>

        <!-- Game Container -->
        <div id="mainContainer" class="relative z-10 flex-1 px-8 pb-8">
          <div class="max-w-4xl mx-auto flex items-center justify-center min-h-[calc(100vh-16rem)]">
            <div id="gameDiv" class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10 text-center">
              <!-- Loading state -->
              <div id="divLoading">
                <div id="gameLoading" class="text-neon-cyan font-tech text-xl mb-4">Waiting for the second player...</div>
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto"></div>
              </div>

              <!-- Game finished state -->
              <div id="divFinished">
                <div id="divMessage" class="text-neon-pink font-tech text-2xl mb-4"></div>
                <div id="divJoinRoom" class="bg-gradient-to-r from-neon-cyan to-neon-pink text-white px-6 py-3 rounded-lg font-tech text-xl hover:shadow-lg hover:shadow-neon-cyan/50 transition-all duration-300">
                  <a data-route="/room" href="/room" id="joinRoomInGame">Go back to the room</a>
                </div>
              </div>

              <!-- Game started state -->
              <div id="divStarted">
                <div id="pong-container" class="mt-4 cyber-border relative w-full flex-col items-center"></div>
                <div class="mt-4">
                  <!-- Game controls or info can go here -->
                </div>
              </div>
              
              <!-- Return to room state -->
              <div id="divReturnRoom">
                <h1 class="text-2xl font-tech text-neon-pink mb-4">You can't exit and go back to a 1v1 match. Eliminated</h1>
                <p class="text-neon-cyan font-tech">Vous devez attendre que le prochain joueur rejoigne le match 1v1 pour continuer</p>
              </div>

              <!-- Can't join state -->
              <div id="divCantJoin">
                <h1 class="text-2xl font-tech text-neon-pink mb-4">You can't access this match</h1>
                <p class="text-neon-cyan font-tech">Only one page per browser or no match available for you</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;

    this.container.appendChild(dashboardContent);

    // A FAIRE : je regarde si le match 1V1 a déja commencé :
    // Si c'est le cas alors je stoppe le match et fin du tournoi

    // OU je regarde si je suis déja connecté a ce match 1V1
    // Si c'est le cas alors j'indique que je ne suis pas autorisé a quitter le match : je stoppe le tournoi
    // await this.checkIfConnnectedWs();


    // A FAIRE EN PREMIER : vérifier si il y a bien un sessionStorage avec room_id



    // A FAIRE : verifier si le tournoi est fini (suite a une deconnexion d'un joueur)
    if (await this.checkIfTournamentFinished() || await this.checkIfTournamentFinishedWithError())
    {
      //alert("je dois rediriger vers /room");
      					this.router?.navigate('/room');

    }
    else
    {
      if (await this.hasSessionStorage())
      {

        // Update dans la base de données
        if (await this.checkIfAlreadyConnected())
        {
          alert("You cannot leave and return from a 1v1 match. You are eliminated");

          // A faire : mettre a jour la base de donneés avec un abandon
          await this.updateGaveUp();
      
          // Lorsque le deuxieme joueur se connecte : je check la base de données et vérifie si l'autre joueur a abandonné : dans ce cas je stoppe la partie (comme avec le bouton rouge)

          // J'affiche le message qui indique que je n'ai pas le droit de partir
          await this.showReturnRoom();

        }
        else
        {
          // Connexion via ws au match 1v1
          await this.join_match();

          // Affichage du menu de chargement en l'attente d'un autre joueur
          await this.showLoading();

          // Evenements
          // await this.stopClickEvent();

        }

      }
      else
      {
        // A FAIRE : afficher un message d'erreur indiquant que je n'ai pas le droit d'accéder a un match 1v1
        alert("You can't access this match. Only on page per browser or no match available for you.");
        await this.showCantJoin();
      }
    }
    



    // // Connexion via ws au match 1v1
    // await this.join_match();

    // // Affichage du menu de chargement en l'attente d'un autre joueur
    // await this.showLoading();

    // // Evenements
    // await this.stopClickEvent();


    await super.setupSidebarListeners(); // Rendu asynchrone pour attendre les listeners

    // this.tester();
    return this.container;
  }


  private async hasSessionStorage()
  {
		const room_sessionStorage = sessionStorage.getItem('room');
		const match_id_sessionStorage = sessionStorage.getItem('room');
		if (room_sessionStorage !== null && match_id_sessionStorage !== null)
		{
      return true;
    }
    else
    {
      return false; 
    }
  }



    // J'indique a l'autre joueur que j'ai changé de page (j'abandonne donc)
  private async checkIfTournamentFinished()
  {
		const localstorage_room = sessionStorage.getItem('room');
    let room_id;
		if (localstorage_room !== null)
		{

			const localvar = JSON.parse(localstorage_room);
			room_id = localvar.room_id;
    }
    else
    {
      return false; // A VOIR 
    }


    try {
      const response = await fetch('https://localhost:4430/api/tournament_finished/' + room_id, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok)
    {
      throw new Error('erreur http : ' + response.status);
    }

    const result = await response.json();
    if(result.success && result.finished)
    {
      return (true);
    }
    else if (result.success && result.finished == false)
    {
      return false;
    }
    else
    {
      alert("error with check if tournament finished : " + JSON.stringify(result));
    }
    
  } catch (err)
  {
    alert("erreur denvoi de la requete gave up");
  }


  return true;

  }


    // J'indique a l'autre joueur que j'ai changé de page (j'abandonne donc)
  private async checkIfTournamentFinishedWithError()
  {
		const localstorage_room = sessionStorage.getItem('room');
    let room_id;
		if (localstorage_room !== null)
		{

			const localvar = JSON.parse(localstorage_room);
			room_id = localvar.room_id;
    }
    else
    {
      return false; // A VOIR 
    }


    try {
      const response = await fetch('https://localhost:4430/api/tournament_finished_with_error/' + room_id, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok)
    {
      throw new Error('erreur http : ' + response.status);
    }

    const result = await response.json();
    if(result.success && result.finished)
    {
      return (true);
    }
    else if (result.success && result.finished == false)
    {
      return false;
    }
    else
    {
      alert("error with check if tournament finished : " + JSON.stringify(result));
    }
    
  } catch (err)
  {
    alert("erreur denvoi de la requete gave up");
  }


  return true;

  }


  // J'indique a l'autre joueur que j'ai changé de page (j'abandonne donc)
  private async updateGaveUp()
  {
        const my_match_id = sessionStorage.getItem('match_id');
        if (my_match_id !== null)
        {
            // await this.connect_match_ws(Number(my_match_id));
        } else
        {
            alert("error no room id in localstorage");
        }

        // alert("le match id = " + my_match_id);


    try {
      const response = await fetch('https://localhost:4430/api/update_gave_up/' + my_match_id, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok)
    {
      throw new Error('erreur http : ' + response.status);
    }

    const result = await response.json();
    if(result.success)
    {
      console.log("update gave up ok");
    }
    // alert("result gave up: " + JSON.stringify(result));
    
  } catch (err)
  {
    alert("erreur denvoi de la requete gave up");
  }
  }



  private async checkIfAlreadyConnected()
  {


        const my_match_id = sessionStorage.getItem('match_id');
        if (my_match_id !== null)
        {
            // await this.connect_match_ws(Number(my_match_id));
        } else
        {
            alert("error no room id in localstorage");
        }

        // alert("le match id = " + my_match_id);


    // Je dois d'abord vérifier si je n'ai pas déja ete connecté


    try {
      const response = await fetch('https://localhost:4430/api/check_connected_to_match/' + my_match_id, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok)
    {
      throw new Error('erreur http : ' + response.status);
    }

    const result = await response.json();
    // alert("result first: " + JSON.stringify(result));
    if (result.connected == true) // result first: {"success":true,"connected":false}
    {
      // alert("ok");
      return true;
    }
    
  } catch (err)
  {
    alert("erreur denvoi de la requete check connected to match");
  }


    // Puis je regarde si je suis deja connecté : si c'est le cas fin du match 1V1


    try {
      const response = await fetch('https://localhost:4430/api/update_connected_to_match/' + my_match_id, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok)
    {
      throw new Error('erreur http : ' + response.status);
    }

    const result = await response.json();
    if(result.success)
    {
      //console.log("check if already connected success");
    }
    // alert("result : " + JSON.stringify(result));
    
  } catch (err)
  {
    alert("erreur denvoi de la requete connected to match");
  }

  return false;

  }



  // Se connecte au match 1v1 via ws lors du chargement de la page /play
  private async join_match()
  {

        const my_match_id = sessionStorage.getItem('match_id');
        if (my_match_id !== null)
        {
            await this.connect_match_ws(Number(my_match_id));
        } else
        {
            alert("error no room id in localstorage");
        }


  }



  // Affiche un message pour indiquer que la personne ne peut pas rejoindre un match 1V1
  private async showCantJoin()
  {
      await this.hideAll();
    const elt = this.container.querySelector('#divCantJoin');
    if (elt)
    {
      (elt as HTMLElement).style.display = "block";
    }
  }

  // Affiche le menu de chargement (en attente d'un deuxieme joueur)
  private async showLoading()
  {
      await this.hideAll();
    const elt = this.container.querySelector('#divLoading');
    if (elt)
    {
      (elt as HTMLElement).style.display = "block";
    }
  }

  // Affiche le menu de chargement (en attente d'un deuxieme joueur)
  private async showReturnRoom()
  {
      await this.hideAll();
    const elt = this.container.querySelector('#divReturnRoom');
    if (elt)
    {
      (elt as HTMLElement).style.display = "block";
    }
  }

  // Affiche le menu quand le match 1v1 commence (les deux joueurs sont présents)
  private async showGame()
  {
    await this.hideAll();
    const divStarted = this.container.querySelector('#divStarted');
    if (divStarted)
    {
      (divStarted as HTMLElement).style.display = "block";
    }
  }

  // Affiche le menu quand le match 1v1 est fini
  private async showFinished(winner_username : string)
  {
    // On affiche le menu qui indique qui a gagné ainsi qu'un bouton pour retourner dans la room
    await this.hideAll();
    const divFinished = this.container.querySelector('#divFinished');
    if (divFinished)
    {
      (divFinished as HTMLElement).style.display = "block";
    }

    // On génère le message pour indiquer qui a gagné
    const winnerMessage = document.createElement('h1');
    winnerMessage.textContent = "The winner is " + winner_username;

    // On ajoute le message a la div
    const elt = this.container.querySelector('#divMessage');
    if (elt)
    {
      (this.container.querySelector('#divMessage') as HTMLElement).innerHTML = '';
      this.container.querySelector('#divMessage')?.appendChild(winnerMessage);
    }

  }

  // Cache tous les menus (en jeu, loading et finished)
  private async hideAll()
  {
    const divFinished = this.container.querySelector('#divFinished');
    if (divFinished)
    {
      (divFinished as HTMLElement).style.display = "none";
    }
    const divStarted = this.container.querySelector('#divStarted');
    if (divStarted)
    {
      (divStarted as HTMLElement).style.display = "none";
    }
    const divLoading = this.container.querySelector('#divLoading');
    if (divLoading)
    {
      (divLoading as HTMLElement).style.display = "none";
    }
    const divReturnRoom = this.container.querySelector('#divReturnRoom');
    if (divReturnRoom)
    {
      (divReturnRoom as HTMLElement).style.display = "none";
    }
    const divCantJoin = this.container.querySelector('#divCantJoin');
    if (divCantJoin)
    {
      (divCantJoin as HTMLElement).style.display = "none";
    }


    
  }



  	// Permet de se connecter via WS a un match 1v1
	private async connect_match_ws(match_id : number)
	{
    this.gameSocket = new WebSocket("wss://localhost:4430/api/ws/play/pong/" + match_id);
    
    this.gameSocket.addEventListener('open', () => {
      if (this.gameSocket?.readyState === WebSocket.OPEN)
      {
          // alert("connecté au match 1v1");
          const obj = {type:"connection", gameType:"pong"};
          this.gameSocket.send(JSON.stringify(obj));
      }

    });


    // Donnée recue du serveur
    this.gameSocket.addEventListener('message', async (event) =>
    {
          const obj = JSON.parse(event.data);

          if (obj.type == "connection" && obj.message == "both_players")
          {
            // Les deux joueurs sont connectés au même match
            //console.log(`Both players connected. Server says isPlayer1: ${obj.isPlayer1}`);
            this.isPlayer1 = obj.isPlayer1; // Use server-provided value
            await this.initializePongGame();
          }

          if (obj.type == "game_start")
          {
            // Game officially started
            if (this.pongComponent)
            {
              this.pongComponent.handleWebSocketMessage(obj);
            }
          }

          if (obj.type == "stop_match")
          {
            // Le match est terminé, il y a un gagnant
            // alert("Play : Le match a été arrete par ladmin. Le gagnant est : " + obj.winner_username);
            await this.showFinished(obj.winner_username);
          }

          if (obj.type == "game_end")
          {
            const winnerName = obj.winner === "player1" ? 
              (this.isPlayer1 ? "YOU" : "OPPONENT") :
              (this.isPlayer1 ? "OPPONENT" : "YOU");
            
            await this.handleGameEnd(winnerName);
          }


          // Forward game-related messages to pong component
          if (this.pongComponent && ['paddle_update', 'ball_update', 'score_update'].includes(obj.type))
          {
            this.pongComponent.handleWebSocketMessage(obj);
          }
    });

    this.gameSocket.addEventListener('close', () => {
      // alert("deconnecte du match 1v1 !");
    });

    this.gameSocket.addEventListener('error', (err) => {
      alert(err);
    });


    // Envoi d'un message "ping" au serveur toutes les 5 secondes (pour éviter la deconnexion)
    setInterval(() => {
          if (this.gameSocket?.readyState === WebSocket.OPEN)
          {
            const obj = {type:"ping"};
            this.gameSocket.send(JSON.stringify(obj));
          }
    }, 5000);
	}

  private async initializePongGame() {
    await this.showGame();
    
    const pongContainer = this.container.querySelector('#pong-container');
    if (!pongContainer) return;

    // Clear any existing content
    pongContainer.innerHTML = '';

    //console.log(`Initializing game with isPlayer1: ${this.isPlayer1}`);
    
    // Add game rules
    const gameRules = createGameRules('online');
    pongContainer.appendChild(gameRules);
    
    // Create player names - User 1 is always left, User 2 is always right
    const player1Name = this.isPlayer1 ? "YOU" : "OPPONENT";
    const player2Name = this.isPlayer1 ? "OPPONENT" : "YOU";

    // Create pong component with multiplayer settings
    this.pongComponent = new PongComponent(player1Name, player2Name, {
      socket: this.gameSocket || undefined,
      isMultiplayer: true,
      isPlayer1: this.isPlayer1
    });

    pongContainer.appendChild(this.pongComponent.render());

    // Add game info with correct controls
    const gameInfo = document.createElement('div');
    gameInfo.className = 'text-center mb-4';
    const controlsText = this.isPlayer1 ? 'W/S KEYS TO MOVE YOUR LEFT PADDLE' : 'UP/DOWN ARROWS TO MOVE YOUR RIGHT PADDLE';
    gameInfo.innerHTML = `
      <div class="text-neon-cyan font-tech text-lg mb-2">ONLINE MATCH</div>
      <div class="text-gray-300 font-tech text-sm">
        ${controlsText}
      </div>
      <div class="text-yellow-400 font-tech text-xs mt-2">
        You are Player ${this.isPlayer1 ? '1 (LEFT)' : '2 (RIGHT)'}
      </div>
    `;
    pongContainer.insertBefore(gameInfo, pongContainer.firstChild);
  }

  // private async stopClickEvent()
	// {
	// 	const elt = this.container.querySelector('#buttonStop');
	// 	if (elt)
	// 	{
	// 		elt.addEventListener('click', async () => {
  //       // Clean up pong component
  //       if (this.pongComponent)
  //       {
  //         this.pongComponent.destroy();
  //         this.pongComponent = null;
  //       }

  //       // Clean up WebSocket
  //       if (this.gameSocket)
  //       {
  //         this.gameSocket.close();
  //         this.gameSocket = null;
  //       }

  //       const my_match_id = sessionStorage.getItem('match_id');
	// 				if (my_match_id)
	// 				{
	// 					try {
  //               const response = await fetch('https://localhost:4430/api/stop_match/' + my_match_id, {
  //               method: 'GET',
  //               credentials: 'include'
  //             });

  //             if (!response.ok)
  //             {
  //               throw new Error('erreur http : ' + response.status);
  //             }

  //             const result = await response.json();
  //             // alert("la partie a bien ete abandonee : " + JSON.stringify(result));
  //             return (result);
	// 					} catch (err)
	// 					{
	// 						alert("erreur denvoi du bouton stop match" + err);
	// 					}
	// 				} else 
  //         {
  //           alert("cant stop match beceause of no match id in local storage");
  //         }
	// 		});
	// 	}
	// }

  private async handleGameEnd(winner: string): Promise<void> {
    const pongContainer = this.container.querySelector('#pong-container');
    if (!pongContainer) return;

    const isInTournament = this.isInTournamentMatch();
    
    if (isInTournament) {
      // For tournament matches, redirect automatically to /room without showing popup
      setTimeout(() => {
        this.router?.navigate('/room');
      }, 2000);
      return;
    }

    // For regular matches, show the normal end game screen
    const endGameScreen = createEndGameScreen(
      winner,
      () => {
        // Restart game
        pongContainer.removeChild(endGameScreen);
        this.router?.navigate('/room');
      },
      () => {
        // Return to dashboard
        pongContainer.removeChild(endGameScreen);
        this.router?.navigate('/dashboard');
      }
    );
    
    pongContainer.appendChild(endGameScreen);
  }

  private isInTournamentMatch(): boolean {
    // Check if we have tournament-related session storage
    const roomStorage = sessionStorage.getItem('room');
    const tournamentStarted = sessionStorage.getItem('tournament_started');
    
    return roomStorage !== null && (tournamentStarted === 'true' || tournamentStarted !== null);
  }

  // Clean up method
  destroy() {
    if (this.pongComponent) {
      this.pongComponent.destroy();
      this.pongComponent = null;
    }
    
    if (this.gameSocket) {
      // this.gameSocket.close(); // COMMENTE POUR TEST IDRISS
      this.gameSocket = null;
    }
    
    super.destroy?.();
  }
}

export default PlayPage;