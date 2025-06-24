import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';


class RoomPage extends Page {
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
          <a href="/room" data-route="/room" class="nav-link text-white hover:text-neon-cyan transition-colors font-tech text-sm tracking-wider uppercase">ROOM</a>
        </nav>
      </div>
    </header><div id="room-page"><div class="min-h-screen pt-16 bg-cyber-dark relative overflow-hidden"><div class="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-neon-pink opacity-50"></div><div class="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-neon-cyan opacity-50"></div><div class="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-neon-cyan opacity-50"></div><div class="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-neon-pink opacity-50"></div>
    
    
    
    
    <div id="mainContainer" class="container mx-auto items-center justify-center min-h-[calc(100vh-4rem)] px-4">


      <!-- Mon ajout commence ici -->


	  <div style="display:none;" id="messageOut" class="text-center text-white text-3xl p-4"></div>



      <div id="room_in" style="display:none;" class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10 text-center">

        <p class="text-3xl" id="nameRoomNew">Nom de la room (default)</p>
        <p class="text-lg" id="idRoomNew">Room id : 123 (default)</p>

        <br>

        <div>
        <input id="usernameInviteText" type="text" class="text-black" placeholder="User ID"> <button id="buttonInvite" class="bg-slate-500 text-white">Invite</button>
        </div>

        <div class="m-4">

          <table class="table-auto border-collapse border border-gray-300 w-full text-left">
            <thead>
            <tr class="bg-gray-800">
              <th class="border border-gray-300 px-4 py-2">Username</th>
              <th class="text-center"></th>
            </tr>
            </thead>
            <tbody id="tablePlayersRoom">
            <tr class="bg-gray-800">
              <td class="border border-gray-300 px-4 py-2"> default 1</td>
              <td class="text-center"><button class="hover:bg-gray-400">X</button></td>
            </tr>
            <tr class="bg-gray-800">
              <td class="border border-gray-300 px-4 py-2">default 2</td>
              <td class="text-center"><button class="hover:bg-gray-400">X</button></td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="m-4">
          <button id="buttonStart" style="display:none;" class="bg-gray-400 text-black px-4 py-2 rounded text-3xl">START</button>
        </div>

        <div class="m-4">
          <button id="buttonDestroy" style="display:none;" class="bg-red-600 text-white text-xs px-4 py-2 rounded">DESTROY ROOM</button>
        </div>

        <div class="m-4">
          <button id="buttonQuitRoom" class="bg-red-600 text-white text-xs px-4 py-2 rounded">QUIT THE ROOM</button>
        </div>

      </div>



      <div id="room_out" style="display:none;" class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10 text-center">

        <div>
        <p class="text-3xl">Join a room</p>
          <input type="text" id="roomIdJoin" class="text-black" placeholder="Room id (ex : 123)">
          <br><br>
                    <button id="buttonJoin" class="bg-gray-400 text-black px-4 py-2 rounded text-xl">JOIN</button>
        </div>


        <br>

        <div>
        <p class="text-3xl">Create a room</p>
          <input id="roomNameCreate" type="text" class="text-black" placeholder="Room name">           <br><br>
              <button id="buttonCreate" class="bg-gray-400 text-black px-4 py-2 rounded text-xl">CREATE</button>
        </div>



      </div>





      <div id="room_finished" style="display:none;" class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10 text-center">

        <div>

			<p class="text-3xl" id="winnerName">The winner is : test (default)</p>


        </div>


        <br>

        <div>
                    <button id="buttonFinish" class="bg-gray-400 text-black px-4 py-2 rounded text-xl">QUIT THE ROOM</button>
        </div>



      </div>




      <div id="room_forbidden" style="display:none;" class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10 text-center">

        <div>

			<p class="text-3xl">You can't access the room page. Only one page allowed.</p>


        </div>


        <br>



      </div>





	        <div id="room_started" style="display:block;" class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10 text-center">

        <p class="text-3xl" id="nameRoomNewStarted">Nom de la room (default)</p>
        <p class="text-lg" id="idRoomNewStarted">Room id : 123 (default)</p>

        <br>

        <div>
                  <p class="text-2xl" id="roundRoomNewStarted">Round : 1 (default : a finir)</p>
        </div>

        <div>
                  <p class="text-xl" id="lastMatchResult"></p>
        </div>

        <div class="m-4">
          <table class="table-auto border-collapse border border-gray-300 w-full text-left">
            <thead>
            <tr class="bg-gray-800">
              <th class="border border-gray-300 px-4 py-2">Match id</th>
              <th class="border border-gray-300 px-4 py-2">First player</th>
              <th class="border border-gray-300 px-4 py-2">Second player</th>
              <!-- <th class="border border-gray-300 px-4 py-2">Finished</th> -->
            </tr>
            </thead>
            <tbody id="tablePlayersRoomStarted">
            </tbody>
          </table>
        </div>

			<div id ="joinMatchDiv">
                  <a href="/login" data-route="/login" class="bg-gray-400 text-black px-4 py-2 rounded text-xl">Join my 1v1 match</a>
                  <p class=" text-white px-4 py-2 rounded text-xl">Waiting for the next match...</p>
			</div>


      </div> 





      

</div></div></div></div>

      </main>
    `;

    this.container.appendChild(dashboardContent);


	// POur test : pour empecher l'affichage si deux onglets
		if (await this.canShowRoomPage())
		{
			alert("JE PEUX AFFICHER !");
				// Test : pour la connexion WS lorque le joueur rejoint une invitation depuis le chat
			if (sessionStorage.getItem('ws_to_join'))
			{
				await this.connect_join_room(Number(sessionStorage.getItem('ws_to_join')));
				sessionStorage.removeItem('ws_to_join');	
			}

				// A FAIRE :
				// verifier si localstorage contient des données et que le tournoi n'a pas commencé (via fetch)
				// Si oui : on refait une connexion WS et on réinsert via http api dans la base de données

				// Si le localstorage contient des données et que la partie a commencée (via fetch) MAIS que je suis pas dans la liste des joueurs (rooms_players)
				// Si oui : je vide completement le localstorage
			await this.reconnectToRoom();

			// A FAIRE : verifire si dans mon localstorage si je suis dans une room
			// Si la room s'est terminée : je retourne a la room (j'affiche via alert : le tournoi auquel vous souhaitez accéder s'est terminé ou a été interrompu)
			await this.checkIfTournamentFinishedWithError();

			// Remet a zero la déconnexion (on oublie tout et on considère qu'il n'y a jamais eu de deconnexion)
			await this.removeFromSetConnectionClosed();

			// Affiche la room ou le menu
			await this.showRoomPageWithLocalStorage();

		}
		else
		{
			// Je suis déja dans une room dans un onglet
			alert("Je ne peux rien afficher car je suis déja dans une room dans un onglet");
			await this.changeRoomPage("forbidden");
		}


	// // Test : pour la connexion WS lorque le joueur rejoint une invitation depuis le chat
	// if (sessionStorage.getItem('ws_to_join'))
	// {
	// 	await this.connect_join_room(Number(sessionStorage.getItem('ws_to_join')));
	// 	sessionStorage.removeItem('ws_to_join');	
	// }

	// 	// A FAIRE :
	// 	// verifier si localstorage contient des données et que le tournoi n'a pas commencé (via fetch)
	// 	// Si oui : on refait une connexion WS et on réinsert via http api dans la base de données

	// 	// Si le localstorage contient des données et que la partie a commencée (via fetch) MAIS que je suis pas dans la liste des joueurs (rooms_players)
	// 	// Si oui : je vide completement le localstorage
	// await this.reconnectToRoom();

	// // A FAIRE : verifire si dans mon localstorage si je suis dans une room
	// // Si la room s'est terminée : je retourne a la room (j'affiche via alert : le tournoi auquel vous souhaitez accéder s'est terminé ou a été interrompu)
	// await this.checkIfTournamentFinishedWithError();

	// // Remet a zero la déconnexion (on oublie tout et on considère qu'il n'y a jamais eu de deconnexion)
	// await this.removeFromSetConnectionClosed();

	// // Affiche la room ou le menu
	// await this.showRoomPageWithLocalStorage();

	// A FAIRE AU LIEU DE LA FONCTION SHOWROOM :
	// socket.addEventListener('close', << faire attention a ca
	// Au lieu de checker le localstorage : je fais une requete feth pour savoir si je suis dans une room et si le tournoi a commencer

	// Permet d'activer les évenements de click
	await this.joinClickEvent();
	await this.createClickEvent();
	await this.startClickEvent();
	await this.destroyClickEvent();
	await this.quitFinishClickEvent();
	await this.quitRoomEvent();
	await this.inviteClickEvent();

    await super.setupSidebarListeners(); // Rendu asynchrone pour attendre les listeners

	// this.tester();
    return this.container;
  }


  private async canShowRoomPage()
  {
				try {
				const response = await fetch('https://localhost:4430/api/already_in_room', {
				method: 'GET',
				credentials: 'include'
				});

				if (!response.ok)
				{
				throw new Error('erreur http : ' + response.status);
				}
				// alert("la reponse = ");
				// alert(response);
				const result = await response.json();
				if (result.success == true && result.in_room)
				{
					alert("deja dans une room, je dois aussi vérifier si jai un sessionstorage");
					if (!sessionStorage.getItem('room'))
					{
						alert("je n'ai pas de sessionStorage, je nai pas le droit dacceder a cette page");
						return (false);

					}
					// const message_to_show = "The winner is : " + result.winner_username;
					// (this.container.querySelector('#winnerName') as HTMLElement).textContent = message_to_show;

					// return true;
				}
				else if (result.success == true && result.in_room == false)
				{
					alert("je ne suis pas dans une room");

				}
				else
				{
					alert("error can show roompage");
				}
			} catch (err)
			{
					alert("error can show roompage catch");

				// alert("erreur denvoi changeRoomPageInformationsFinished()");
				return false;
			}

			return true;

  }



 	// Rejoins une room lors du click sur le bouton Join
	private async inviteClickEvent()
	{

		
		const elt = this.container.querySelector('#buttonInvite');
		if (elt)
		{
			elt.addEventListener('click', async () => {

			// alert("test click join");


			let user_id_to_invite = Number((this.container.querySelector('#usernameInviteText') as HTMLInputElement).value);

			// let room_id = document.getElementById('idRoom').value;
			try {
				const response = await fetch('https://localhost:4430/api/invite_player_tournament/ ' + user_id_to_invite, {
				method: 'GET',
				credentials: 'include'
				});

				if (!response.ok)
				{
				throw new Error('erreur http : ' + response.status);
				}

				const result = await response.json();
				if (result.success)
				{
					alert("invitation bien envoyee au joueur");
				}
				else
				{
					alert("erreur lors de l'envoi de l'invitation : " + result.error);
				}
				// alert("resultat envoi formulaire (join room) : " + JSON.stringify(result));
				// return (result);
			} catch (err)
			{
				alert("erreur denvoi invitation");
				// alert("erreur denvoi formulaire create room");
			}



			});
		}
	}

	// private async joinInviteClickEvent()
	// {
	// 	const elt = this.container.querySelector('#textJoinInvite');
	// 	if (elt)
	// 	{
	// 		elt.addEventListener('click', async () => {

	// 		// alert("test click join");


	// 		// A MODIFIER par SAMI
	// 		let roomId = Number((this.container.querySelector('#roomIdJoin') as HTMLInputElement).value);

	// 		if (await this.checkIfRoomExists(roomId))
	// 		{
	// 			// Je rejoins la room créée
	// 			const room = await this.join_room_http(roomId);
	// 			await this.connect_join_room(roomId);

	// 			// Je stocke le numero de la room dans un localstorage
	// 			sessionStorage.setItem('room', JSON.stringify({room_id : room.room_id, admin:false, room_name : room.room_name, user_id:room.user_id}));

	// 			// Je change le contenu de la roomPage
	// 			// await this.changeRoomPageInformations();
	// 			// await this.changeRoomPage("in");

	// 			// A FAIRE : supprimer l'invitation dans la base de données

	// 			// Redirection vers la room
	// 			this.router?.navigate('/room');
	// 		}
	// 		else
	// 		{
	// 			alert("la room que vous essayez de joindre n'existe pas, vérifiez l'id");
	// 		}
	// 		});
	// 	}

	// }

	// private async showInvitationsWithInterval()
	// {
	// 	setInterval(async () => 
	// 		{try {
	// 			const response = await fetch('https://localhost:4430/api/my_invitations', {
	// 			method: 'GET',
	// 			credentials: 'include'
	// 			});

	// 			if (!response.ok)
	// 			{
	// 			throw new Error('erreur http : ' + response.status);
	// 			}

	// 			const result = await response.json();

	// 			if (result.success)
	// 			{
	// 				alert("jai bien recu les invitations");
	// 				const invitations = result.tabl_invitations;
	// 				for (const invitation of invitations)
	// 				{
	// 					console.log("invitation with room id = " + invitation.room_id);
	// 				}
	// 			}
	// 			else
	// 			{
	// 				alert("erreur lors de la reception des invitations : " + result.error);
	// 			}
	// 		} catch (err)
	// 		{
	// 			alert("erreur de recuperation des invitations");
	// 		}
	// 	}, 1000
	// 	);
	// }
 

//   private async amIAdmin()
//   {
// 			const localstorage_room = sessionStorage.getItem('room');

// 		if (localstorage_room !== null)
// 		{

// 			const localvar = JSON.parse(localstorage_room);
// 			const room_id = localvar.room_id;
// 			// alert("la room id = " + room_id);

// 				// On vérifie si le tournoi n'a pas commencé
// 			try {
// 				const response = await fetch('https://localhost:4430/api/im_admin/' + room_id, {
// 				method: 'GET',
// 				credentials: 'include'
// 				});

// 				if (!response.ok)
// 				{
// 					throw new Error('erreur http : ' + response.status);
// 				}
// 				// alert("eee");

// 				const result = await response.json();
// 				// alert("message recu : " + result);
// 				if (result.success == true && result.admin == true)
// 				{
// 					return true;
// 				}
// 				else
// 				{
// 					return false;
// 				}
// 				// alert("fin fct");
// 			} catch (err)
// 			{
// 				alert("erreur denvoi amIAdmin()");
// 				alert(err);
// 			}



// 		}

//   }

  private async showInButtonsIfAdmin()
  {
		const localstorage_room = sessionStorage.getItem('room');

		if (localstorage_room !== null)
		{

			const localvar = JSON.parse(localstorage_room);
			const room_id = localvar.room_id;
			// alert("la room id = " + room_id);

				// On vérifie si le tournoi n'a pas commencé
			try {
				const response = await fetch('https://localhost:4430/api/im_admin/' + room_id, {
				method: 'GET',
				credentials: 'include'
				});

				if (!response.ok)
				{
					throw new Error('erreur http : ' + response.status);
				}
				// alert("eee");

				const result = await response.json();
				// alert("message recu : " + result);
				if (result.success == true && result.admin == true)
				{
					// Je suis admin

					// alert("je suis l'admin de la room");
					const buttonStart = this.container.querySelector('#buttonStart') as HTMLElement | null;
					if (buttonStart)
					{
						buttonStart.style.display = "inline-block";
					}
					const buttonDestroy = this.container.querySelector('#buttonDestroy') as HTMLElement | null;
					if (buttonDestroy)
					{
						buttonDestroy.style.display = "inline-block";
					}
					const buttonQuitRoom = this.container.querySelector('#buttonQuitRoom') as HTMLElement | null;
					if (buttonQuitRoom)
					{
						buttonQuitRoom.style.display = "none";
					}

				}
				if (result.success == false)
				{
					// Acces non autorisé
					throw new Error("failure");
				}
				// alert("fin fct");
			} catch (err)
			{
				// alert("erreur denvoi showinbutton()");
				// alert(err);
			}



		}

  }


  // Enleve du set backend l'use id qui a déconnecté brusquement du ws room
  private async removeFromSetConnectionClosed()
  {
				// On vérifie si le tournoi n'a pas commencé
			try {
				const response = await fetch('https://localhost:4430/api/forgive_closed_ws_in_room', {
				method: 'GET',
				credentials: 'include'
				});

				if (!response.ok)
				{
				throw new Error('erreur http : ' + response.status);
				}

				const result = await response.json();
				if (result.success == true)
				{
					// alert("removefrom est connection closed ok");
				}
			} catch (err)
			{
				// alert("erreur denvoi removeFromSetConnectionClosed()");
			}

  }



//   // Vérifie si le tournoi dans lequel je suis est fini (normalement ou via deconnexion d'autres joueurs)
//   private async checkIfTournamentFinished()
//   {
// 			const localstorage_room = sessionStorage.getItem('room');

// 		if (localstorage_room !== null)
// 		{

// 			const localvar = JSON.parse(localstorage_room);
// 			let room_id = localvar.room_id;


// 			alert("on va verifier si le tournoi est fini");

// 			// On vérifie si le tournoi n'a pas commencé
// 			try {
// 				const response = await fetch('https://localhost:4430/api/tournament_finished/' + room_id, {
// 				method: 'GET',
// 				credentials: 'include'
// 				});

// 				if (!response.ok)
// 				{
// 				throw new Error('erreur http : ' + response.status);
// 				}

// 				const result = await response.json();
// 				alert(JSON.stringify(result));
// 				if (result.success == true && result.finished == true)
// 				{
// 					alert("Le match auquel vous souhaitez acceder a été terminé (normalement ou suite a la deconnexion d'un joueur)");
// 					await this.removeLocalStorageTournament();


// 					// return (true);
// 				} else if (result.success == true && result.finished == false)
// 				{
// 					// return (false);
// 				}
// 				else
// 				{
// 					throw new Error("not good result json");
// 				}
// 			} catch (err)
// 			{
// 				alert("erreur denvoi checkIfTournamentFinished()");
// 			}



// 		}

//   }

  // Vérifie si le tournoi dans lequel je suis est fini (normalement ou via deconnexion d'autres joueurs)
  private async checkIfTournamentFinishedWithError()
  {
			const localstorage_room = sessionStorage.getItem('room');

		if (localstorage_room !== null)
		{

			const localvar = JSON.parse(localstorage_room);
			let room_id = localvar.room_id;


			// alert("on va verifier si le tournoi est fini a cause dune erreur");

			// On vérifie si le tournoi n'a pas commencé
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
				// alert(JSON.stringify(result));
				if (result.success == true && result.finished == true)
				{
					// alert("Le match auquel vous souhaitez acceder a été terminé A CAUSE DUNE DECONNEXION DUN JOUEUR EN PLEIN TOURNOI");


					// Afficher un message dans une div pour indiquer que la partie s'est terminée avec erreur
					const messageOut = this.container.querySelector('#messageOut');
					if (messageOut)
					{
						(messageOut as HTMLElement).style.display = "block";
						(messageOut as HTMLElement).textContent = ("The tournament ended because of someone leaving the room.");

						// Supprime le message apres 6 secondes
						setTimeout(() => {
							(messageOut as HTMLElement).style.display = "none";
						}, 6000);
					}

					

					await this.removeLocalStorageTournament();


					// return (true);
				} else if (result.success == true && result.finished == false)
				{
					// return (false);
				}
				else if (result.success == false)
				{
					throw new Error("failure"); // Acces non autorisé
				}
				else
				{
					throw new Error("not good result json");
				}
			} catch (err)
			{
				// alert("erreur denvoi checkIfTournamentFinished()");
			}



		}

  }



  // Vérifie si j'ai été déco brusquement d'une room ws (fermeture de l'onglet par ex)
  private async disconnectedFromRoom()
  {

				// On vérifie si le tournoi n'a pas commencé
			try {
				const response = await fetch('https://localhost:4430/api/closed_ws_in_room', {
				method: 'GET',
				credentials: 'include'
				});

				if (!response.ok)
				{
				throw new Error('erreur http : ' + response.status);
				}

				const result = await response.json();
				if (result.success == true && result.closed == true)
				{
					return true;
				}
				if (result.success == false)
				{
					throw new Error("failure"); // acces non autorisé
				}
				else
				{
					return false;
				}
			} catch (err)
			{
				throw new Error("failure");
				alert("erreur denvoi disconnectedFromRoom()");
				return false;
			}

  }

  	private async reconnectToRoom()
	{

		const localstorage_room = sessionStorage.getItem('room');

		if (localstorage_room !== null)
		{

			const localvar = JSON.parse(localstorage_room);
			let room_id = localvar.room_id;

			let disconnected : boolean; 
			try {
				disconnected = await this.disconnectedFromRoom();
			} catch (err)
			{
				// alert("erreur denvoi reconnectToRoom()");
				return ;
			}


			// On vérifie si le tournoi n'a pas commencé
			try {
				const response = await fetch('https://localhost:4430/api/tournament_started/' + room_id, {
				method: 'GET',
				credentials: 'include'
				});

				if (!response.ok)
				{
				throw new Error('erreur http : ' + response.status);
				}

				const result = await response.json();
				if (result.success == true && result.started == false && disconnected == true) // et si la connexion ws a été rompue
				{
					// Le tournoi n'a pas commencé
					/////////// ATTENTION ::::: A SUPPRIMER OU GERER LE CAS OU LA ROOM A ETE DESTROY

					// alert("je peux rejoindre la room quitte car le tournoi na pas commmence");
					let roomId = Number(room_id);

					// Je rejoins la room créée
					const room = await this.join_room_http(roomId);
					await this.connect_join_room(roomId);

					// Je stocke le numero de la room dans un localstorage
					sessionStorage.setItem('room', JSON.stringify({room_id : room.room_id, admin:false, room_name : room.room_name, user_id:room.user_id}));

					// Je change le contenu de la roomPage
					await this.changeRoomPageInformations();
					await this.changeRoomPage("in");



				}
				else if (result.success == true && result.started == true && disconnected == true) // Je dois aussi vérifier si la connexion WS a été rompue
				{
					// J'ai quitté brusquement la room avant le commencement du tournoi MAIS le tournoi a déja commencé

					alert("je ne peux PAS rejoindre la room quitte car le tournoi A DEJA commmence");
					await this.removeLocalStorageTournament();
				}

				return (result);
			} catch (err)
			{
				// alert("erreur denvoi reconnectToRoom()");
			}


			// Si le tournoi a commencé : on vide le localStorage



		}

	}

	// Verifie si la personne est dans une room et affiche la room si oui sinon affiche le menu
	private async showRoomPageWithLocalStorage()
	{
			if (sessionStorage.getItem('room') !== null)
			{
				if (sessionStorage.getItem("tournament_finished") == "true")
				{
					await this.changeRoomPage("finished");
					return ;
				}


				if (sessionStorage.getItem('tournament_started') == "true")
				{
					await this.changeRoomPage("started");
				}
				else
				{
					// Je suis dans déja dans une room : je dois afficher la liste des joueurs, le nom de la room et le bouton inviter (si je suis admin)
					await this.changeRoomPage("in");
				}


				// A FAIRE : vérifier si la partie a deja commencee, dans ce cas jaffiche les scores

			}
			else
			{
				// Je ne suis pas dans une room : j'affiche le contenu pour rejoindre une room ou en créer une
				await this.changeRoomPage("out");
			}



	}

  	// Change la visibilite de la room
	private async changeRoomPage(in_or_out : string)
	{
		if (in_or_out === "in")
		{
			await this.changeRoomPageInformations();
			(this.container.querySelector('#room_in') as HTMLElement).style.display = "block";
			(this.container.querySelector('#room_started') as HTMLElement).style.display = "none";
			(this.container.querySelector('#room_out') as HTMLElement).style.display = "none";
				(this.container.querySelector('#room_finished') as HTMLElement).style.display = "none";	
		}
		else if (in_or_out == "out")
		{
			(this.container.querySelector('#room_started') as HTMLElement).style.display = "none";
			(this.container.querySelector('#room_in') as HTMLElement).style.display = "none";
			(this.container.querySelector('#room_out') as HTMLElement).style.display = "block";
				(this.container.querySelector('#room_finished') as HTMLElement).style.display = "none";	
				(this.container.querySelector('#room_forbidden') as HTMLElement).style.display = "none";	

		}
		else if (in_or_out == "started")
		{
			await this.changeRoomPageInformationsStarted(); //// A FAIRE POUR LA FIN DUN ROUND
			(this.container.querySelector('#room_in') as HTMLElement).style.display = "none";
			(this.container.querySelector('#room_out') as HTMLElement).style.display = "none";
			(this.container.querySelector('#room_started') as HTMLElement).style.display = "block";	
				(this.container.querySelector('#room_finished') as HTMLElement).style.display = "none";	
				(this.container.querySelector('#room_forbidden') as HTMLElement).style.display = "none";	
		}
		else if (in_or_out == "finished")
		{
			// A FAIRE :
			// if (sessionStorage.getItem("tournament_finished") == "true")
			// {
			alert("je vais afficher le finished");
				await this.changeRoomPageInformationsFinished();
				(this.container.querySelector('#room_in') as HTMLElement).style.display = "none";
				(this.container.querySelector('#room_out') as HTMLElement).style.display = "none";
				(this.container.querySelector('#room_started') as HTMLElement).style.display = "none";	
				(this.container.querySelector('#room_forbidden') as HTMLElement).style.display = "none";	
				(this.container.querySelector('#room_finished') as HTMLElement).style.display = "block";
							// await this.removeLocalStorageTournament();

			// }

		}
		else if (in_or_out == "forbidden")
		{
				(this.container.querySelector('#room_in') as HTMLElement).style.display = "none";
				(this.container.querySelector('#room_out') as HTMLElement).style.display = "none";
				(this.container.querySelector('#room_started') as HTMLElement).style.display = "none";	
				(this.container.querySelector('#room_forbidden') as HTMLElement).style.display = "block";	

		}
	}



	// Affiche l'username du joueur qui a gagné a la fin d'un tournoi (EN COURS)
	private async changeRoomPageInformationsFinished()
	{

		const localstorage_room = sessionStorage.getItem('room');

		if (localstorage_room !== null)
		{
			const localvar = JSON.parse(localstorage_room);


			let room_id = localvar.room_id;

			// alert("winner : room id = " + room_id);

			// Supprime automatiquement les sessionStorage
			// await this.removeLocalStorageTournament();


			try {
				const response = await fetch('https://localhost:4430/api/winner/' + room_id, {
				method: 'GET',
				credentials: 'include'
				});

				if (!response.ok)
				{
				throw new Error('erreur http : ' + response.status);
				}
				// alert("la reponse = ");
				// alert(response);
				const result = await response.json();
				if (result.success == true)
				{
					const message_to_show = "The winner is : " + result.winner_username;
					(this.container.querySelector('#winnerName') as HTMLElement).textContent = message_to_show;

					// return true;
				}
				else
				{
					// return false;
					// alert("error : winner not found changeRoomPageInformationsFinished");
				}
			} catch (err)
			{
				// alert("erreur denvoi changeRoomPageInformationsFinished()");
				return false;
			}



			// // let room_id = localvar.room_id;
			// try {
			// 	// const response = await fetch('https://localhost:4430/api/rooms_players/' + room_id, {
			// 	// 	method: 'GET',
			// 	// 	credentials: 'include'
			// 	// });
			// 	// if (!response.ok)
			// 	// {
			// 	// 	throw new Error('erreur http : ' + response.status);
			// 	// }
			// 	// const result = await response.json();

			// 	(this.container.querySelector('#winnerName') as HTMLElement).textContent = "The winner is : WINNER_NAME";


			// } catch (err)
			// {
			// alert("erreur acces fin tournoi");
			// }
		}
	}


	// Change le nom et l'id de la room dans la page in ainsi que la liste des joueurs
	private async changeRoomPageInformations()
	{

		const localstorage_room = sessionStorage.getItem('room');

		if (localstorage_room !== null)
		{

			await this.showInButtonsIfAdmin();

			const localvar = JSON.parse(localstorage_room);

			(this.container.querySelector('#nameRoomNew') as HTMLElement).textContent = (localvar.room_name);
			(this.container.querySelector('#idRoomNew') as HTMLElement).textContent = ("ID : " + localvar.room_id);


			let room_id = localvar.room_id;
			try {
			const response = await fetch('https://localhost:4430/api/rooms_players/' + room_id, {
				method: 'GET',
				credentials: 'include'
			});

			if (!response.ok)
			{
				throw new Error('erreur http : ' + response.status);
			}

			const result = await response.json();

			const players = result.tabl_players;

			if(result.success == false)
			{
				// alert("error failure changeRoomInformations"); // Acces non autorisé
				return ;
			}

			(this.container.querySelector('#tablePlayersRoom') as HTMLElement).innerHTML = '';
			let i = 0;
			for (const player of players)
			{

				// Ajoute une ligne dans la table de la liste des joueurs

				const tdTableUsername = document.createElement('td');
				const tdTableRemoveUser = document.createElement('td');
				tdTableUsername.className = "border border-gray-300 px-4 py-2";
				tdTableRemoveUser.className = "text-center text-red-500";
				tdTableUsername.textContent = player.username;
				tdTableRemoveUser.innerHTML = `<button data-id="${player.user_id}" id="reject_player" class="hover:bg-gray-400">X</button>`;
				const lineTable = document.createElement("tr");
				lineTable.appendChild(tdTableUsername);

				// if (await this.amIAdmin() && i !=)
				// {
				// // if (localvar.admin && i != 0)
				// // {
				// // lineTable.appendChild(tdTableRemoveUser);
				// // }

				// }

				if (localvar.admin && i != 0)
				{
				lineTable.appendChild(tdTableRemoveUser);
				}
				(this.container.querySelector('#tablePlayersRoom') as HTMLElement).appendChild(lineTable);
				i++;
			}

			await this.enable_kick_button();

			} catch (err)
			{
			// alert("erreur denvoi formulaire create room");
			}
		}
		else
		{
			(this.container.querySelector('#nameRoomNew') as HTMLElement).textContent = ("NULL");
			(this.container.querySelector('#idRoomNew') as HTMLElement).textContent = ("ID : NULL");
		}
	}


	

	// Permet de se connecter via WS a une room
	private async connect_join_room(room_id : number)
	{

		// const id_room = val;

		// let room_id = document.getElementById('idRoom').value;


		const socket = new WebSocket("wss://localhost:4430/api/ws/join_room/" + room_id);

		// Connexion effectuée
		socket.addEventListener('open', ()=> {
			if (socket.readyState === WebSocket.OPEN)
			{

			}
		});


		// Donnée recue du serveur
		socket.addEventListener('message', async (event) =>
		{
			if (sessionStorage.getItem('room'))
			{
			alert("message recu WS true : " + event.data); // {"success":true,"cause":"end_of_tournament","winner":"baptiste"}

			} else
			{
			alert("message recu WS false : " + event.data); // {"success":true,"cause":"end_of_tournament","winner":"baptiste"}

			}


			// await this.changeRoomPageInformations();
			// alert("messag recu du backend : " + event.data);
				const localstorage_room = sessionStorage.getItem('room');




			if (localstorage_room !== null)
			{

				const localvar = JSON.parse(localstorage_room);
				const obj_serv_ws = JSON.parse(event.data);

				// Si un joueur a est arrivé dans la room
				if (obj_serv_ws.success == true && obj_serv_ws.cause == "user_joined")
				{
					alert("un joueur est arrivé. Affichage de la nouvelle liste de joueurs");
					await this.changeRoomPageInformations();
				}


				// EN COURS : arret du tournoi si un joueur s'est deco
				if (obj_serv_ws.success == true && obj_serv_ws.cause == "tournament_stopped")
				{

					// Quelqu'un s'est deco en plein tournoi : je dois arreter le tournoi et me deco de la room

					// J'ai été kick de la room
					alert("quelqu'un s'est deconnecte du tournoi apres le démarrage, je dois quitter la room");

					await this.removeLocalStorageTournament(); // TEST

					// Supprime tous les localstorag associés a ce tournoi
					// await this.removeLocalStorageTournament();

					// Redirige et raffraichis la page si je suis kick d'une room
					this.router?.navigate('/room');

					// await this.changeRoomPage("out");
				}

				if (obj_serv_ws.success == true && obj_serv_ws.cause == "kick" && Number(obj_serv_ws.id_player) == Number(localvar?.user_id))
				{

					// J'ai été kick de la room
					alert("je dois partir de la room");
					sessionStorage.removeItem('room');
					sessionStorage.setItem('tournament_started', "false"); // A FINIR

					// Supprime tous les localstorag associés a ce tournoi
					await this.removeLocalStorageTournament();

					// Redirige et raffraichis la page si je suis kick d'une room
					this.router?.navigate('/room');

					await this.changeRoomPage("out");
				}


				// Si un joueur a qiutté la room (et si ce n'est pas moi)	
				if (obj_serv_ws.success == true && obj_serv_ws.cause == "kick" && Number(obj_serv_ws.id_player) != Number(localvar?.user_id))
				{

					// J'ai été kick de la room
					alert("un joueur est parti. Affichage de la nouvelle liste de joueurs");
					// sessionStorage.removeItem('room');
					// sessionStorage.setItem('tournament_started', "false"); // A FINIR

					// Supprime tous les localstorag associés a ce tournoi
					// await this.removeLocalStorageTournament();

					await this.changeRoomPageInformations();

					// Redirige et raffraichis la page si je suis kick d'une room
					// this.router?.navigate('/room');

					// await this.changeRoomPage("out");
				}

				if (obj_serv_ws.success == true && obj_serv_ws.cause == "list_matchs")
				{
					alert("nouveau round a afficher");
					// Nouveaux round : j'affiche la liste des matchs 1v1
					// alert("je dois afficher la liste des nouveaux matchs 1v1");
					// await this.changeRoomPageInformationsStarted();


					sessionStorage.setItem('tournament_started', "true"); // A FINIR


					// Redirige et raffraichis la page pour afficher le menu en cas de nouveaux matchs
					this.router?.navigate('/room');

					// Ou je devrais peut etre envoyer une notification pour dire qu'il y a de nouveaux matchs

					// await this.changeRoomPage("started");
				}


				if (obj_serv_ws.success == true && obj_serv_ws.cause == "end_of_tournament")
				{

					alert("le tournoi est FINI, je dois faire une redirection vers /room pour afficher le nom du vainqueur");
					// Le tournoi est fini, j'affiche le nom du gagnant

					// alert("le nom du gagnant est : " + obj_serv_ws.winner);


					// OU je crée une fonction qui vérifie si la div avec l'id divRoom existe (a voir pour le nom)
					// Si cette div existe alors je suis dans /room :je ne fais rien
					// Si cette div n'existe PAS alors je suis peut etre dans /chat, dans ce cas
						// je fais fais appel a une fonction qui vérifie si je suis dans /chat : je crée une div avec un message pour dire
						// que c'est mon tour de jouer avec un bouton vers /room
					
					sessionStorage.setItem("tournament_finished", "true");

					// Redirige et raffraichis la page pour afficher le menu en cas de fin de partie
					this.router?.navigate('/room');

					await this.changeRoomPageInformationsFinished();
					await this.changeRoomPage("finished");	
				
				}


			}
		});

		socket.addEventListener('close', () => {
			alert("deconnecte de la room !");
			sessionStorage.setItem('tournament_started', "false"); // A FINIR

		});

		socket.addEventListener('error', (err) => {
			alert(err);
		});


		// Envoi un message toutes les 1 sec pour éviter la deconnexion et indiquer qu'on est encore en ligne
		setInterval(() => {
			socket.send("ping new"); // A DECOMMENTER APRES TEST
			// alert("test ping en cours");
		}, 4000);
	}


	// Permet de se connecter a une room (http)
	private async join_room_http(room_id : number)
	{

		// let room_id = document.getElementById('idRoom').value;
		try {
			const response = await fetch('https://localhost:4430/api/join_room/' + room_id, {
			method: 'GET',
			credentials: 'include'
			});

			if (!response.ok)
			{
			throw new Error('erreur http : ' + response.status);
			}

			const result = await response.json();
			if (result.success == false)
			{
				alert("cannot join room because : "  + result.error);
			}
			// alert("resultat envoi formulaire (join room) : " + JSON.stringify(result));
			return (result);
		} catch (err)
		{
			// alert("erreur denvoi formulaire create room");
		}
	}

	// Rejoins une room lors du click sur le bouton Join
	private async joinClickEvent()
	{

		
		const elt = this.container.querySelector('#buttonJoin');
		if (elt)
		{
			elt.addEventListener('click', async () => {

			// alert("test click join");


			let roomId = Number((this.container.querySelector('#roomIdJoin') as HTMLInputElement).value);

			if (await this.checkIfRoomExists(roomId))
			{
				if (await this.checkIfTournamentStarted(roomId) == false)
				{
					if (await this.checkIfTournamentEnded(roomId))
					{
						alert("La room que vous essayez de joindre est déja finie")
						return ;
					}

					if (await this.canShowRoomPage() == false)
					{
						alert("Join Button : cant access page because you are already in a room");
						return ;
					}

					// Je rejoins la room créée
					const room = await this.join_room_http(roomId);
					await this.connect_join_room(roomId);

					// Je stocke le numero de la room dans un localstorage
					sessionStorage.setItem('room', JSON.stringify({room_id : room.room_id, admin:false, room_name : room.room_name, user_id:room.user_id}));

					// Je change le contenu de la roomPage
					await this.changeRoomPageInformations();
					await this.changeRoomPage("in");
				}
				else
				{
					alert("la room que vous essayez de joindre a déja commencé");
				}
			}
			else
			{
				alert("la room que vous essayez de joindre n'existe pas, vérifiez l'id");
			}



			});
		}
	}

	private async checkIfTournamentStarted(room_id : number)
	{
		try {
			const response = await fetch('https://localhost:4430/api/room_started/' + room_id, {
			method: 'GET',
			credentials: 'include'
			});

			if (!response.ok)
			{
				throw new Error('erreur http : ' + response.status);
			}

			const result = await response.json();
			// alert("The player has been kicked successfully : " + JSON.stringify(result));
			if(result.success == true && result.started == true)
			{
				return true;
			}
			else if (result.success == true && result.started == false)
			{
				return false;
			}
			else
			{
				alert("error when checking if tournament started");
				return true;
			}
		} catch (err)
		{
			alert("error when checking if tournament started catch");
			return true;
		}
	}


	// Vérifie si le tournoi s'est fini (avec une erreur ou sans erreur)
	private async checkIfTournamentEnded(room_id : number)
	{
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
			if(result.success == true && result.finished == true)
			{
				return true;
			}
		} catch (err)
		{
			alert("error when checkIfTournamentEnded catch");
			// return true;
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
			if(result.success == true && result.finished == true)
			{
				return true;
			}
		} catch (err)
		{
			alert("error when checkIfTournamentEnded catch");
			// return true;
		}

		return false;
	}

	private async checkIfRoomExists(room_id : number)
	{

		try {
			const response = await fetch('https://localhost:4430/api/room_exists/' + room_id, {
			method: 'GET',
			credentials: 'include'
			});

			if (!response.ok)
			{
				throw new Error('erreur http : ' + response.status);
			}

			const result = await response.json();
			// alert("The player has been kicked successfully : " + JSON.stringify(result));
			if(result.success == true && result.exists == true)
			{
				return true;
			}
			else
			{
				return false;
			}
		} catch (err)
		{
			// alert("erreur denvoi room exist");
			return false;
		}


	}


	// Cree et rejoins une room lors du click sur le bouton Create
	private async createClickEvent()
	{
		const elt = this.container.querySelector('#buttonCreate');
		if (elt)
		{
			elt.addEventListener('click', async () => {



				if (await this.canShowRoomPage() == false)
				{
					alert("you cant create a room because you are already in a room in another page");
					return ;
				}


			let roomName : string = (this.container.querySelector('#roomNameCreate') as HTMLInputElement).value;
			try {
			const response = await fetch('https://localhost:4430/api/create_room', {
				method: 'POST',
				headers : {
				'Content-Type': 'application/json'
				},
				body: JSON.stringify({name: roomName}),
				credentials: 'include'
			});

			if (!response.ok)
			{
				throw new Error('erreur http : ' + response.status);
			}

			const result = await response.json();
			// alert("envoi reussi create room");

			if (result.success)
			{

				// Je stocke le numero de la room dans un localstorage
				sessionStorage.setItem('room', JSON.stringify({room_id : result.room_id, admin:true, room_name : result.room_name, user_id:result.user_id}));
				
				// Je rejoins la room créée
				await this.join_room_http(result.room_id);
				await this.connect_join_room(result.room_id);

				// Je change le contenu de la roomPage
				await this.changeRoomPageInformations();
				await this.changeRoomPage("in");

			}
			else
			{
				alert("error when creating room");
			}


			} catch (err)
			{
			alert("erreur denvoi formulaire create room");
			}

		});

		}

	}





	// Vire unn joueur de la room
	private async kick_player(room_id : number, player_id : number)
	{


		try {
		const response = await fetch('https://localhost:4430/api/reject_from_room/' + player_id + '/' + room_id, {
		method: 'GET',
		credentials: 'include'
		});

		if (!response.ok)
		{
		throw new Error('erreur http : ' + response.status);
		}

			const result = await response.json();
			// alert("The player has been kicked successfully : " + JSON.stringify(result));
			return (result);
		} catch (err)
		{
			alert("erreur denvoi kick player");
		}

	}

	// Vire un joueur de la room lors du click sur le bouton X
	private async enable_kick_button()
	{
	const buttons = this.container.querySelectorAll('button[data-id]');
	buttons.forEach(button => {
		button.addEventListener('click', async (event) => {
		const target = event.currentTarget as HTMLButtonElement;
		const id = Number(target.dataset.id);
		// alert('Bouton cliqué avec id:'+ id);
			const localstorage_room = sessionStorage.getItem('room');
			if (localstorage_room !== null)
			{
			const localvar = JSON.parse(localstorage_room);

			const room_id = localvar?.room_id;
			// const user_id = localvar?.user_id;
			// alert("i will kick : roomid : " + room_id + " userid : " + user_id);
			await this.kick_player(room_id, id);
			}
		});
	});
	}



	// Fonction qui démarre le tournoi
	private async startTournament(room_id : number)
	{

				try {
					const response = await fetch('https://localhost:4430/api/start/' + room_id, {
					method: 'GET',
					credentials: 'include'
				});

				if (!response.ok)
				{
				throw new Error('erreur http : ' + response.status);
				}

					const result = await response.json();
					// alert("The tournament started successfully : " + JSON.stringify(result));
					return (result);
				} catch (err)
				{
					alert("erreur denvoi du tournament start");
				}

	}


	private async my_room_nb_players()
	{
		try {
			const response = await fetch('https://localhost:4430/api/my_room_nb_players', {
			method: 'GET',
			credentials: 'include'
		});

			if (!response.ok)
			{
			throw new Error('erreur http : ' + response.status);
			}
				const result = await response.json();
			if (result.success == true)
			{
				return (Number(result.nb_players))
			}
			else (result.success == false)
			{
				return (-1);
			}
		} catch (err)
		{
			alert("erreur denvoi du my_room_nb_players");
			return (-1);
		}
	}


	// Commence le tournoi //// A FAIRE : verifier si je sius bien admin
	private async startClickEvent()
	{

		const elt = this.container.querySelector('#buttonStart');
		if (elt)
		{
			elt.addEventListener('click', async () => {


				// On vérifie sil y a au moins 2 joueurs
				const nb = await this.my_room_nb_players();
				if (nb < 2)
				{
					alert("The tournament can't start. It needs 2 or more players.");
					return ;
				}

				const localstorage_room = sessionStorage.getItem('room');
				if (localstorage_room !== null)
				{

					const localvar = JSON.parse(localstorage_room);

					const room_id = localvar?.room_id;


					if (room_id)
					{
						await this.startTournament(room_id);
						await this.changeRoomPageInformationsStarted();
						await this.changeRoomPage("started");
					}
				}
			});
		}
	}

	// Commence le tournoi //// A FAIRE : verifier si je sius bien admin
	private async destroyClickEvent()
	{

		const elt = this.container.querySelector('#buttonDestroy');
		if (elt)
		{
			elt.addEventListener('click', async () => {

				const localstorage_room = sessionStorage.getItem('room');
				if (localstorage_room !== null)
				{
					const localvar = JSON.parse(localstorage_room);

					const room_id = localvar?.room_id;


					if (room_id)
					{
						// alert("I close the room");
						try {
							const response = await fetch('https://localhost:4430/api/close_room/' + room_id, {
							method: 'GET',
							credentials: 'include'
						});

						if (!response.ok)
						{
						throw new Error('erreur http : ' + response.status);
						}

							const result = await response.json();
							alert("Room destroyed successfully : " + JSON.stringify(result));
							return (result);
						} catch (err)
						{
							// alert("erreur denvoi du tournament start");
						}
					}
				}
			});
		}
	}



	// Retourne dans la room out (pour quitter completement une room)
	private async quitFinishClickEvent()
	{
		const elt = this.container.querySelector('#buttonFinish');
		if (elt)
		{
			alert("le bouton quitfinishe exist");
			elt.addEventListener('click', async () => {

			alert("le bouton quitfinishe cliqued");

				// Supprime les localstorage
				sessionStorage.removeItem('room');
				sessionStorage.removeItem('finished');
				sessionStorage.removeItem('tournament_started');
				sessionStorage.removeItem('tournament_finished');
				sessionStorage.removeItem('match_id');

				// Retour dans la room out
				await this.changeRoomPage("out");

			});
		}
	}


	private async canPlay(room_id : number)
	{


		try {
			const response = await fetch('https://localhost:4430/api/can_play/' + room_id, {
			method: 'GET',
			credentials: 'include'
			});

			if (!response.ok)
			{
				throw new Error('erreur http : ' + response.status);
			}

			const result = await response.json();
			// alert("Can i play request received successfully : " + JSON.stringify(result));
			if (result.success == false)
			{
				alert("success false dans result canplay");
			}
			
			return {canPlay : result.can_play, match_id : result.match_id}

		} catch (err)
		{
			alert("erreur avec la fonction canPlay : catch")
			// alert("erreur denvoi requete canPlay");
			throw new Error("db_access_front");
		}



	}


	// Change le nom et l'id de la room dans la page in ainsi que les différents matchs
	private async changeRoomPageInformationsStarted()
	{


		const localstorage_room = sessionStorage.getItem('room');

		if (localstorage_room !== null)
		{

			const localvar = JSON.parse(localstorage_room);

			// Affiche le nom et l'id de la room
			(this.container.querySelector('#nameRoomNewStarted') as HTMLElement).textContent = (localvar.room_name);
			(this.container.querySelector('#idRoomNewStarted') as HTMLElement).textContent = ("ID : " + localvar.room_id);


			let room_id = localvar.room_id;
			try {

				// Affiche la liste des matchs 1v1 pour ce round
				await this.showMatchsList(Number(room_id));
							
				// Si je peux immédiatement jouer un match 1v1 : On affiche le bouton play
				await this.showJoinMatchButtonIfPossible(Number(room_id));

				// affiche si oui ou non j'ai gagné mon dernier
				await this.showLastMatchResult();

				// A FAIRE : affiche le round en cours
				await this.showActualRound();
				

			} catch (err)
			{
				// alert("erreur dans la fonction changeRoomPageInformationsStarted()");
			}
		}
		else
		{
			(this.container.querySelector('#nameRoomNew') as HTMLElement).textContent = ("NULL");
			(this.container.querySelector('#idRoomNew') as HTMLElement).textContent = ("ID : NULL");
		}
	}

	private async showActualRound()
	{


		try {
			const response = await fetch('https://localhost:4430/api/my_room_round', {
			method: 'GET',
			credentials: 'include'
			});

			if (!response.ok)
			{
				throw new Error('erreur http : ' + response.status);
			}

			const result = await response.json();
			// alert("Can i play request received successfully : " + JSON.stringify(result));

			if (result.success == true)
			{
				const roundElement = this.container.querySelector('#roundRoomNewStarted');
				if (roundElement)
				{
					roundElement.textContent = "Round : " + result.round;
				}
			}
			else
			{
				alert("no round yet to show");
			}
		} catch (err)
		{
			alert("error showActualRound");
		}

	}

	// Affiche le résultat du dernier match joué dans ce round UNIQUEMENT si j'ai déja joué
	private async showLastMatchResult()
	{



		try {
			const response = await fetch('https://localhost:4430/api/last_match_result_room', {
			method: 'GET',
			credentials: 'include'
			});

			if (!response.ok)
			{
				throw new Error('erreur http : ' + response.status);
			}

			const result = await response.json();
			// alert("Can i play request received successfully : " + JSON.stringify(result));

			if (result.success == true)
			{
				if (result.played)
				{
					if (result.won_last_match)
					{
						// Dernier match perso gagné dans cette room
						const matchResultElement = this.container.querySelector('#lastMatchResult');
						if (matchResultElement)
						{
							matchResultElement.textContent = "Last match : won. You can continue";
						}
					}
					else
					{
						// Dernier match perso perdu dans cette room
						const matchResultElement = this.container.querySelector('#lastMatchResult');
						if (matchResultElement)
						{
							matchResultElement.textContent = "Last match : lost. Eliminated";
						}
					}
				}
				else
				{
					// Je n'ai pas encore joué : aucun résultat
					const matchResultElement = this.container.querySelector('#lastMatchResult');
					if (matchResultElement)
					{
						matchResultElement.textContent = "";
					}
				}
			}
			else
			{
				alert("result success a false lastmatchresult");
			}
			
			// return {canPlay : result.can_play, match_id : result.match_id}

		} catch (err)
		{
			alert("error last match result catch");
			// alert("erreur denvoi requete canPlay");
			// throw new Error("db_access_front");
		}


	}	


	// Affiche le bouton pour rejoindre un match 1v1 si je dois jouer un match ce round
	private async showJoinMatchButtonIfPossible(room_id : number)
	{
				try {
					const can_play_now = await this.canPlay(room_id);
					if(can_play_now.canPlay == true)
					{

						// J'affiche le bouton pour rejoindre le match 1v1

						sessionStorage.setItem('match_id', can_play_now.match_id);

						// alert("je dois rejoindre un match 1v1");
						const joinMatchButton = document.createElement('a');
						joinMatchButton.setAttribute('data-route', '/play');
						joinMatchButton.setAttribute('href', '/play');
						joinMatchButton.id = 'joinRealMatch';
						joinMatchButton.textContent = "Join my 1v1 match";
						joinMatchButton.className = "bg-gray-400 text-black px-4 py-2 rounded text-xl";
						(this.container.querySelector('#joinMatchDiv') as HTMLElement).innerHTML = '';
						this.container.querySelector('#joinMatchDiv')?.appendChild(joinMatchButton);

					}
					else 
					{

						// J'affiche le texte pour dire que je ne peux pas jouer ce round


						// alert("je dois attendre le prochain match 1v1");
						const joinMatchText = document.createElement('p');
						joinMatchText.className = "text-white px-4 py-2 rounded text-xl";
						joinMatchText.textContent = "Waiting for the next match...";
						(this.container.querySelector('#joinMatchDiv') as HTMLElement).innerHTML = '';
						this.container.querySelector('#joinMatchDiv')?.appendChild(joinMatchText);

					}
				} catch (err)
				{
					// alert("erreur denvoi requete canPlay 2");

				}

	}

	// Affiche la liste des matchs 1v1 si le tournoi a commencé
	private async showMatchsList(room_id : Number)
	{
		try {
			const response = await fetch('https://localhost:4430/api/matchs_current/' + room_id, {
				method: 'GET',
				credentials: 'include'
			});

			if (!response.ok)
			{
				alert("cest la reponse http qui est pas bonne pour lerreur change changepageinformationstarted");
				throw new Error('erreur http : ' + response.status);
			}

			const result = await response.json();

			const matchs = result.matchs;
			const tablePlayersRoomStarted = this.container?.querySelector('#tablePlayersRoomStarted') as HTMLElement;
			if(tablePlayersRoomStarted)
			{
				(tablePlayersRoomStarted).innerHTML = '';
			}
			// let i = 0;


			// alert("les infos match history seront changées via la fct changeRomm...");

			sessionStorage.setItem('tournament_started', "true"); // A FINIR


			for (const match of matchs)
			{

				// Ajoute une ligne dans la table de la liste des matchs

				const tdTableId = document.createElement('td');
				const tdTableFirstPlayer = document.createElement('td');
				const tdTableSecondPlayer = document.createElement('td');
				// const tdTableFinished = document.createElement('td');

				tdTableId.textContent = match.id_match;
				tdTableFirstPlayer.textContent = match.first_player;
				tdTableSecondPlayer.textContent = match.second_player;
				// tdTableFinished.textContent = match.finished;


				tdTableId.className = "border border-gray-300 px-4 py-2";
				tdTableFirstPlayer.className = "border border-gray-300 px-4 py-2";
				tdTableSecondPlayer.className = "border border-gray-300 px-4 py-2";
				// tdTableFinished.className = "border border-gray-300 px-4 py-2";


				const lineTable = document.createElement("tr");
				
				
				lineTable.appendChild(tdTableId);
				lineTable.appendChild(tdTableFirstPlayer);
				lineTable.appendChild(tdTableSecondPlayer);
				// lineTable.appendChild(tdTableFinished);


				// Ajoute une ligne match au tableau
				const tablePlayersRoomStarted = this.container?.querySelector('#tablePlayersRoomStarted') as HTMLElement;
				if (tablePlayersRoomStarted)
				{
					(tablePlayersRoomStarted).appendChild(lineTable);
				}
				// i++;
			}

		} catch (err)
		{
			// alert("error with show matchs list");
		}

	}

	// Supprime les localstorage pour le tournoi
	private async removeLocalStorageTournament()
	{		
		sessionStorage.removeItem('room');
		sessionStorage.removeItem('finished');
		sessionStorage.removeItem('tournament_started');
		sessionStorage.removeItem('tournament_finished');
		sessionStorage.removeItem('match_id');
	}



	private async quitRoom()
	{

			try {
				const response = await fetch('https://localhost:4430/api/quit_room', {
				method: 'GET',
				credentials: 'include'
				});

				if (!response.ok)
				{
				throw new Error('erreur http : ' + response.status);
				}

				const result = await response.json();
				if (result.success == true)
				{
					alert("je quitte la room");
					await this.removeLocalStorageTournament();
					// this.router?.navigate('/room'); // A changer par la suite

					// alert("removefrom est connection closed ok");
				}
			} catch (err)
			{
				alert("erreur denvoi quitRoom()");
			}

	}

	// Retourne dans la room out (pour quitter completement une room)
	private async quitRoomEvent()
	{
		const elt = this.container.querySelector('#buttonQuitRoom');
		if (elt)
		{
			elt.addEventListener('click', async () => {
			alert("je vais qiutter la room");

			await this.quitRoom();

				// Retour dans la room out
			// alert("je dois me rediriger pour qiutter la room");

			// this.router?.navigate('/room'); // A changer par la suite

				// await this.changeRoomPage("out");

			});
		}
	}

}

export default RoomPage;