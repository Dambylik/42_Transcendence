import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
// import type { HtmlElementTexture } from 'babylonjs';


class PlayPage extends Page {
    static TextObject = {
    underConstruction: 'PAGE UNDER CONSTRUCTION',
    };

    constructor(id: string, router?: Router) {
        super(id, router);
    }
    
    async render(): Promise<HTMLElement> {
        this.container.innerHTML = '';
        await super.setupHeaderListeners();
        const dashboardContent = document.createElement('div');
        dashboardContent.className = 'min-h-screen pt-16 relative overflow-hidden flex flex-row bg-cyber-dark';
        dashboardContent.innerHTML = `
    
      <!-- Sidebar -->
      
      <!-- Main Content -->
      <main class="flex-1 flex flex-col">

<div id="rootTEST"><header class="w-full bg-navy-dark py-4 px-8 fixed top-0 left-0 right-0 z-50">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <!-- Logo on the left -->
        <div class="flex-shrink-0">
        </div>
        
        <!-- Navigation links on the right -->
        <nav class="flex items-center space-x-8">
          <a href="/" data-route="/" class="header-logo text-neon-pink hover:text-neon-cyan transition-colors font-tech tracking-wider uppercase">FT_TRANSCENDENCE</a>
          <a href="/dashboard" data-route="/dashboard" class="nav-link text-white hover:text-neon-cyan transition-colors font-tech text-sm tracking-wider uppercase">Game</a>
          <a href="/profile" data-route="/profile" class="nav-link text-white hover:text-neon-cyan transition-colors font-tech text-sm tracking-wider uppercase">Profile</a>
          <a href="/login" data-route="/login" class="nav-link text-white hover:text-neon-cyan transition-colors font-tech text-sm tracking-wider uppercase">Login</a>
          <a href="/login" data-route="/login" class="nav-link text-white hover:text-neon-cyan transition-colors font-tech text-sm tracking-wider uppercase">TEST</a>
        </nav>
      </div>
    </header><div id="room-page"><div class="min-h-screen pt-16 bg-cyber-dark relative overflow-hidden"><div class="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-neon-pink opacity-50"></div><div class="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-neon-cyan opacity-50"></div><div class="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-neon-cyan opacity-50"></div><div class="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-neon-pink opacity-50"></div>
    
    
    
    
    <div id="mainContainer" class="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">


      <!-- Mon ajout commence ici -->








      <div id="gameDiv" class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10 text-center">




      <div id="divLoading">
              <div id="gameLoading">Waiting for the second player...</div> <br>
      </div>

      <div id="divFinished">
          <div id="divMessage"></div> <br>
                <div id="divJoinRoom" class="bg-gray-400 text-black px-4 py-2 rounded text-xl"><a data-route="/room" href="/room" id="joinRoomInGame">Go back to the room</a></div>

      </div>


      <div id ="divStarted">

        <div class="bg-red-600 text-white text-xs px-4 py-2 rounded"><button id="buttonStop" >Give up (lose)</button></div>
      </div>
      
      

      <div id ="divReturnRoom">
      <h1 class="text-2xl">You can't exit and go back to a 1v1 match. Eliminated</h1>
      <!-- <a href="/room" data-route="/room" class="text-white hover:text-neon-cyan transition-colors font-tech text-sm tracking-wider uppercase">Go back to room</a> -->
      Vous devez attendre que le prochain joueur rejoigne le match 1v1 pour continuer
      </div>

      




      <div id ="divCantJoin">
      <h1 class="text-2xl">You can't access this match. Only on page per browser or no match available for you</h1>
      </div>




      </div>










      

</div></div></div></div>

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
      alert("je dois rediriger vers /room");
      					this.router?.navigate('/room');

    }
    else
    {
      if (await this.hasSessionStorage())
      {

        // Update dans la base de données
        if (await this.checkIfAlreadyConnected())
        {
          alert("Vous ne pouvez pas partir et revenir d'un match 1v1. Vous etes éliminé");

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
          await this.stopClickEvent();

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
      console.log("check if already connected success");
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
    (this.container.querySelector('#divMessage') as HTMLElement).innerHTML = '';
    this.container.querySelector('#divMessage')?.appendChild(winnerMessage);

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
    const socket = new WebSocket("wss://localhost:4430/api/ws/play/" + match_id);
    socket.addEventListener('open', () => {
      // Keepalive ping
      // setInterval(() => {
      //   if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({type: "ping"}));
      // }, 30000);
    });

      // Connexion effectuée
    socket.addEventListener('open', ()=> {
      if (socket.readyState === WebSocket.OPEN)
      {
          // alert("connecté au match 1v1");
          const obj = {type:"connection"};
          socket.send(JSON.stringify(obj));
      }

    });


    // Donnée recue du serveur
    socket.addEventListener('message', async (event) =>
    {
          const obj = JSON.parse(event.data);

          if (obj.type == "connection" && obj.message == "both_players")
          {
            // Les deux joueurs sont connectés au même match
            // alert("Les deux joueurs sont présents : la partie peut démmarrer");
            await this.showGame();
          }

          if (obj.type == "stop_match")
          {
            // Le match est terminé, il y a un gagnant
            // alert("Play : Le match a été arrete par ladmin. Le gagnant est : " + obj.winner_username);
            await this.showFinished(obj.winner_username);
          }


    });

    socket.addEventListener('close', () => {
      // alert("deconnecte du match 1v1 !");
    });

    socket.addEventListener('error', (err) => {
      alert(err);
    });


    // Envoi d'un message "ping" au serveur toutes les 5 secondes (pour éviter la deconnexion)
    setInterval(() => {
          const obj = {type:"ping"};
          socket.send(JSON.stringify(obj));
    }, 5000);
	}










  // Arrete le match (abandon)
	private async stopClickEvent()
	{
		const elt = this.container.querySelector('#buttonStop');
		if (elt)
		{
			elt.addEventListener('click', async () => {
          const my_match_id = sessionStorage.getItem('match_id');
					if (my_match_id)
					{
						try {
                const response = await fetch('https://localhost:4430/api/stop_match/' + my_match_id, {
                method: 'GET',
                credentials: 'include'
              });

              if (!response.ok)
              {
                throw new Error('erreur http : ' + response.status);
              }

              const result = await response.json();
              // alert("la partie a bien ete abandonee : " + JSON.stringify(result));
              return (result);
						} catch (err)
						{
							alert("erreur denvoi du bouton stop match");
						}
					} else 
          {
            alert("cant stop match beceause of no match id in local storage");
          }
			});
		}
	}

}

export default PlayPage;