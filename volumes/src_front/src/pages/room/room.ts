import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';


class RoomPage extends Page {

    constructor(id: string, router?: Router) {
        super(id, router);
    }
    
    async render(): Promise<HTMLElement> {
        this.container.innerHTML = '';
        await super.setupHeaderListeners();
        
        const roomContent = document.createElement('div');
        roomContent.className = 'min-h-screen pt-16 relative overflow-hidden flex flex-row bg-cyber-dark';
        
        roomContent.innerHTML = `
            ${await super.createSidebar()}
            
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
                    <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-4 tracking-wider">TOURNAMENT ROOMS</h1>
                    <div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto mb-4"></div>
                    <p class="text-neon-cyan font-cyber text-xl">COMPETE WITH PLAYERS WORLDWIDE</p>
                </div>

                <!-- Room Management Container -->
                <div class="relative z-10 flex-1 px-8 pb-8">
                    <div id="messageOut" class="text-center text-white text-3xl p-4 hidden"></div>

                    <!-- Room In View -->
                    <div id="room_in" class="hidden max-w-4xl mx-auto">
                        <div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-neon-pink/40 shadow-lg shadow-neon-pink/20">
                            <div class="text-center mb-6">
                                <h2 id="nameRoomNew" class="text-3xl font-cyber text-neon-pink mb-2">Room Name (default)</h2>
                                <p id="idRoomNew" class="text-lg text-neon-cyan font-tech">Room ID: 123 (default)</p>
                            </div>

                            <!-- Invite Section -->
                            <div class="mb-6 p-4 bg-cyber-dark/50 border border-neon-cyan/30 rounded">
                                <h3 class="text-neon-cyan font-cyber mb-3">INVITE PLAYERS</h3>
                                <div class="flex gap-3">
                                    <input id="usernameInviteText" type="text" class="flex-1 bg-cyber-dark border-2 border-neon-pink/30 text-white px-4 py-2 rounded font-tech" placeholder="Enter User ID">
                                    <button id="buttonInvite" class="bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-6 py-2 rounded hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300">INVITE</button>
                                </div>
                            </div>

                            <!-- Players Table -->
                            <div class="mb-6">
                                <h3 class="text-neon-cyan font-cyber mb-4">CURRENT PLAYERS</h3>
                                <div class="overflow-hidden rounded-lg border border-neon-cyan/30">
                                    <table class="w-full bg-cyber-dark">
                                        <thead>
                                            <tr class="bg-cyber-darker border-b border-neon-cyan/20">
                                                <th class="px-6 py-3 text-left text-neon-cyan font-cyber">Username</th>
                                                <th class="px-6 py-3 text-center text-neon-cyan font-cyber">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tablePlayersRoom">
                                            <tr class="border-b border-cyber-light/10">
                                                <td class="px-6 py-3 text-white font-tech">default 1</td>
                                                <td class="px-6 py-3 text-center">
                                                    <button class="text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-1 rounded transition-colors">✕</button>
                                                </td>
                                            </tr>
                                            <tr class="border-b border-cyber-light/10">
                                                <td class="px-6 py-3 text-white font-tech">default 2</td>
                                                <td class="px-6 py-3 text-center">
                                                    <button class="text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-1 rounded transition-colors">✕</button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex flex-wrap gap-4 justify-center">
                                <button id="buttonStart" class="hidden bg-gradient-to-r from-neon-cyan to-neon-pink text-white font-cyber px-8 py-3 rounded-lg text-xl hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300">START TOURNAMENT</button>
                                <button id="buttonDestroy" class="hidden bg-gradient-to-r from-red-500 to-red-600 text-white font-cyber px-6 py-2 rounded hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300">DESTROY ROOM</button>
                                <button id="buttonQuitRoom" class="bg-cyber-dark border-2 border-red-500/50 text-red-400 font-cyber px-6 py-2 rounded hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300">QUIT ROOM</button>
                            </div>
                        </div>
                    </div>

                    <!-- Room Out View -->
                    <div id="room_out" class="hidden max-w-4xl mx-auto">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <!-- Join Room Section -->
                            <div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-neon-cyan/40 shadow-lg shadow-neon-cyan/20">
                                <h2 class="text-3xl font-cyber text-neon-cyan mb-6 text-center">JOIN ROOM</h2>
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-neon-cyan font-tech text-sm mb-2">Room ID</label>
                                        <input type="text" id="roomIdJoin" class="w-full bg-cyber-dark border-2 border-neon-cyan/30 text-white px-4 py-3 rounded font-tech" placeholder="Enter Room ID (e.g., 123)">
                                    </div>
                                    <button id="buttonJoin" class="w-full bg-gradient-to-r from-neon-cyan to-neon-pink text-white font-cyber px-6 py-3 rounded-lg text-xl hover:shadow-lg hover:shadow-neon-cyan/50 transition-all duration-300">JOIN ROOM</button>
                                </div>
                            </div>

                            <!-- Create Room Section -->
                            <div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-neon-pink/40 shadow-lg shadow-neon-pink/20">
                                <h2 class="text-3xl font-cyber text-neon-pink mb-6 text-center">CREATE ROOM</h2>
                                <div class="space-y-4">
                                    <div>
                                        <label class="block text-neon-pink font-tech text-sm mb-2">Room Name</label>
                                        <input id="roomNameCreate" type="text" class="w-full bg-cyber-dark border-2 border-neon-pink/30 text-white px-4 py-3 rounded font-tech" placeholder="Enter Room Name">
                                    </div>
                                    <button id="buttonCreate" class="w-full bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-6 py-3 rounded-lg text-xl hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300">CREATE ROOM</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Room Finished View -->
                    <div id="room_finished" class="hidden max-w-2xl mx-auto">
                        <div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-yellow-500/40 shadow-lg shadow-yellow-500/20 text-center">
                            <div class="mb-8">
                                <div class="text-4xl font-cyber text-yellow-400 mb-4">🏆 TOURNAMENT COMPLETE 🏆</div>
                                <p id="winnerName" class="text-3xl font-cyber text-neon-pink mb-2">The winner is: test (default)</p>
                                <div class="h-1 w-24 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto mb-6"></div>
                            </div>
                            
                            <!-- Game Over Action Buttons -->
                            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                                <button id="buttonFinish" class="bg-cyber-dark border-2 from-neon-cyan to-neon-pink text-white font-cyber px-8 py-3 rounded-lg text-xl hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300">
                                    QUIT ROOM
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Room Forbidden View -->
                    <div id="room_forbidden" class="hidden max-w-2xl mx-auto">
                        <div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-red-500/40 shadow-lg shadow-red-500/20 text-center">
                            <h2 class="text-3xl font-cyber text-red-400 mb-4">ACCESS DENIED</h2>
                            <p class="text-xl text-white mb-6">You can't access the room page. Only one page allowed.</p>
                        </div>
                    </div>

                    <!-- Room Started View -->
                    <div id="room_started" class="max-w-5xl mx-auto">
                        <div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-neon-pink/40 shadow-lg shadow-neon-pink/20">
                            <div class="text-center mb-6">
                                <h2 id="nameRoomNewStarted" class="text-3xl font-cyber text-neon-pink mb-2">Room Name (default)</h2>
                                <p id="idRoomNewStarted" class="text-lg text-neon-cyan font-tech mb-2">Room ID: 123 (default)</p>
                                <p id="roundRoomNewStarted" class="text-2xl text-yellow-400 font-cyber">Round: 1 (default)</p>
                                <p id="lastMatchResult" class="text-xl text-gray-300 font-tech mt-2"></p>
                            </div>

                            <!-- Matches Table -->
                            <div class="mb-6">
                                <h3 class="text-neon-cyan font-cyber mb-4 text-center">CURRENT MATCHES</h3>
                                <div class="overflow-hidden rounded-lg border border-neon-cyan/30">
                                    <table class="w-full bg-cyber-dark">
                                        <thead>
                                            <tr class="bg-cyber-darker border-b border-neon-cyan/20">
                                                <th class="px-6 py-3 text-center text-neon-cyan font-cyber">Match ID</th>
                                                <th class="px-6 py-3 text-center text-neon-cyan font-cyber">First Player</th>
                                                <th class="px-6 py-3 text-center text-neon-cyan font-cyber">Second Player</th>
                                            </tr>
                                        </thead>
                                        <tbody id="tablePlayersRoomStarted">
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Match Actions -->
                            <div id="joinMatchDiv" class="text-center space-y-4">
                                <a href="/login" data-route="/login" class="inline-block bg-gradient-to-r from-neon-cyan to-neon-pink text-white font-cyber px-8 py-3 rounded-lg text-xl hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300">JOIN MY 1V1 MATCH</a>
                                <p class="text-white font-tech text-xl">Waiting for the next match...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        `;

        this.container.appendChild(roomContent);

        // Preserve existing room logic
        // Pour test : pour empecher l'affichage si deux onglets
        if (await this.canShowRoomPage()) {
            // Test : pour la connexion WS lorque le joueur rejoint une invitation depuis le chat
            if (sessionStorage.getItem('ws_to_join')) {
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
        } else {
            // Je suis déja dans une room dans un onglet
            //alert("Je ne peux rien afficher car je suis déja dans une room dans un onglet");
            await this.changeRoomPage("forbidden");
        }

        // Permet d'activer les évenements de click
        await this.joinClickEvent();
        await this.createClickEvent();
        await this.startClickEvent();
        await this.destroyClickEvent();
        await this.quitFinishClickEvent();
        await this.playAgainClickEvent();
        await this.mainMenuClickEvent();
        await this.quitRoomEvent();
        await this.inviteClickEvent();

        await super.setupSidebarListeners(); // Rendu asynchrone pour attendre les listeners

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
					// alert("deja dans une room, je dois aussi vérifier si jai un sessionstorage");
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
					// alert("je ne suis pas dans une room");

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
					alert("Invitation has been sent to user with id : " + user_id_to_invite);
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
		const room_in = this.container.querySelector('#room_in');
		const room_started = this.container.querySelector('#room_started');
		const room_out = this.container.querySelector('#room_out');
		const room_finished = this.container.querySelector('#room_finished');
		const room_forbidden = this.container.querySelector('#room_forbidden');

		if (!(room_in && room_started && room_out && room_finished && room_forbidden))
		{
			return ;
		}

		if (in_or_out === "in")
		{
			await this.changeRoomPageInformations();
			(this.container.querySelector('#room_in') as HTMLElement).style.display = "block";
			(this.container.querySelector('#room_started') as HTMLElement).style.display = "none";
			(this.container.querySelector('#room_out') as HTMLElement).style.display = "none";
				(this.container.querySelector('#room_finished') as HTMLElement).style.display = "none";	
				(this.container.querySelector('#room_forbidden') as HTMLElement).style.display = "none";	
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
				await this.changeRoomPageInformationsFinished();
				(this.container.querySelector('#room_in') as HTMLElement).style.display = "none";
				(this.container.querySelector('#room_out') as HTMLElement).style.display = "none";
				(this.container.querySelector('#room_started') as HTMLElement).style.display = "none";	
				(this.container.querySelector('#room_forbidden') as HTMLElement).style.display = "none";	
				(this.container.querySelector('#room_finished') as HTMLElement).style.display = "block";
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
					if (this.container.querySelector('#winnerName'))
					{
						(this.container.querySelector('#winnerName') as HTMLElement).textContent = message_to_show;
					}

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


			const nameRoomNew = this.container.querySelector('#nameRoomNew');
			const idRoomNew = this.container.querySelector('#idRoomNew');
			if (nameRoomNew && idRoomNew)
			{
				(this.container.querySelector('#nameRoomNew') as HTMLElement).textContent = (localvar.room_name);
				(this.container.querySelector('#idRoomNew') as HTMLElement).textContent = ("ID : " + localvar.room_id);
			}


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

			const tablePlayersRoom = this.container.querySelector('#tablePlayersRoom');
			if (!tablePlayersRoom)
			{
				// alert("aucune tablePlayersRoom trouvée");
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
			const nameRoomNew = this.container.querySelector('#nameRoomNew');
			const idRoomNew = this.container.querySelector('#idRoomNew');
			if (nameRoomNew && idRoomNew)
			{
				(this.container.querySelector('#nameRoomNew') as HTMLElement).textContent = ("NULL");
				(this.container.querySelector('#idRoomNew') as HTMLElement).textContent = ("ID : NULL");
			}
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
			// alert("message recu WS true : " + event.data); // {"success":true,"cause":"end_of_tournament","winner":"baptiste"}

			} else
			{
			// alert("message recu WS false : " + event.data); // {"success":true,"cause":"end_of_tournament","winner":"baptiste"}

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
					// alert("un joueur est arrivé. Affichage de la nouvelle liste de joueurs");
					await this.changeRoomPageInformations();
				}


				// EN COURS : arret du tournoi si un joueur s'est deco
				if (obj_serv_ws.success == true && obj_serv_ws.cause == "tournament_stopped")
				{

					// Quelqu'un s'est deco en plein tournoi : je dois arreter le tournoi et me deco de la room

					await this.removeLocalStorageTournament(); // TEST

					// Redirige et raffraichis la page si je suis kick d'une room
					this.router?.navigate('/room');
				}

				if (obj_serv_ws.success == true && obj_serv_ws.cause == "kick" && Number(obj_serv_ws.id_player) == Number(localvar?.user_id))
				{

					// J'ai été kick de la room
					// alert("je dois partir de la room");
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
					await this.changeRoomPageInformations();
				}

				if (obj_serv_ws.success == true && obj_serv_ws.cause == "list_matchs")
				{
					sessionStorage.setItem('tournament_started', "true"); // A FINIR

					// Redirige et raffraichis la page pour afficher le menu en cas de nouveaux matchs
					this.router?.navigate('/room');
				}


				if (obj_serv_ws.success == true && obj_serv_ws.cause == "end_of_tournament")
				{					
					sessionStorage.setItem("tournament_finished", "true");

					// Redirige et raffraichis la page pour afficher le menu en cas de fin de partie
					this.router?.navigate('/room');

					await this.changeRoomPageInformationsFinished();
					await this.changeRoomPage("finished");	
				
				}


			}
		});

		socket.addEventListener('close', () => {
			//alert("deconnecte de la room !");
			sessionStorage.setItem('tournament_started', "false"); // A FINIR

		});

		socket.addEventListener('error', (err) => {
			alert(err);
		});


		// Envoi un message toutes les 1 sec pour éviter la deconnexion et indiquer qu'on est encore en ligne
		setInterval(() => {
			if (socket.readyState === WebSocket.OPEN)
			{
				socket.send("ping new"); // A DECOMMENTER APRES TEST
			}

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

			// TEST : je masque le bouton
			(elt as HTMLElement).style.display = "none";


			let roomId = Number((this.container.querySelector('#roomIdJoin') as HTMLInputElement).value);

			if (await this.checkIfRoomExists(roomId))
			{
				if (await this.checkIfTournamentStarted(roomId) == false)
				{
					if (await this.checkIfTournamentEnded(roomId))
					{
						alert("La room que vous essayez de joindre est déja finie");
						(elt as HTMLElement).style.display = "inline-block";
						return ;
					}

					if (await this.canShowRoomPage() == false)
					{
						alert("Join Button : cant access page because you are already in a room");
						(elt as HTMLElement).style.display = "inline-block";
						return ;
					}

					// Je rejoins la room créée
					const room = await this.join_room_http(roomId);
					if (room.success == false)
					{
						alert("erreur lors de la connexion a la room : " + room.error);
						(elt as HTMLElement).style.display = "inline-block";
						return ;
					}
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
					(elt as HTMLElement).style.display = "inline-block";
				}
			}
			else
			{
				alert("la room que vous essayez de joindre n'existe pas, vérifiez l'id");
				(elt as HTMLElement).style.display = "inline-block";
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


				// Rend le bouton invisible
				(elt as HTMLElement).style.display = "none";
				
				if (await this.canShowRoomPage() == false)
				{
					alert("you cant create a room because you are already in a room in another page");
					(elt as HTMLElement).style.display = "inline-block";
					return ;
				}


			let roomName : string = (this.container.querySelector('#roomNameCreate') as HTMLInputElement).value;
			try {
			const response = await fetch('https://localhost:4430/api/pong/create_room', {
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
				if (!result.room_id)
				{
					alert("error when creating room : no room id");
					(elt as HTMLElement).style.display = "inline-block";
					return ;
				}
				await this.connect_join_room(result.room_id);

				// Je change le contenu de la roomPage
				await this.changeRoomPageInformations();
				await this.changeRoomPage("in");

			}
			else
			{
				alert("error when creating room");
				if (result.error == "name_too_long")
				{
					alert("The room name is too long (max 40 characters)");
				}
				(elt as HTMLElement).style.display = "inline-block";
			}


			} catch (err)
			{
				alert("erreur denvoi formulaire create room");
				(elt as HTMLElement).style.display = "inline-block";
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
	if (!buttons)
	{
		return ;
	}
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

				// rendre le bouton invisible puis revisible
				(elt as HTMLElement).style.display = "none";


				// On vérifie sil y a au moins 2 joueurs
				const nb = await this.my_room_nb_players();
				if (nb < 2)
				{
					alert("The tournament can't start. It needs 2 or more players.");

					// Rendre le bouton visible a nouveau
					(elt as HTMLElement).style.display = "inline-block";

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
							// alert("Room destroyed successfully : " + JSON.stringify(result));
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
			// alert("le bouton quitfinishe exist");
			elt.addEventListener('click', async () => {

			// alert("le bouton quitfinishe cliqued");

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
				//alert("success false dans result canplay");
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

			const nameRoomNewStarted = this.container.querySelector('#nameRoomNewStarted');
			const idRoomNewStarted = this.container.querySelector('#idRoomNewStarted');

			// Affiche le nom et l'id de la room
			if (nameRoomNewStarted && idRoomNewStarted)
			{
				(this.container.querySelector('#nameRoomNewStarted') as HTMLElement).textContent = (localvar.room_name);
				(this.container.querySelector('#idRoomNewStarted') as HTMLElement).textContent = ("ID : " + localvar.room_id);
			}


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
			const nameRoomNew = this.container.querySelector('#nameRoomNew');
			const idRoomNew = this.container.querySelector('#idRoomNew');
			if (nameRoomNew && idRoomNew)
			{
				(this.container.querySelector('#nameRoomNew') as HTMLElement).textContent = ("NULL");
				(this.container.querySelector('#idRoomNew') as HTMLElement).textContent = ("ID : NULL");
			}
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
				//alert("no round yet to show");
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
						joinMatchButton.className = "inline-block bg-gradient-to-r from-neon-cyan to-neon-pink text-white px-4 py-2 rounded text-xl";

						if (this.container.querySelector('#joinMatchDiv'))
						{
							(this.container.querySelector('#joinMatchDiv') as HTMLElement).innerHTML = '';
							this.container.querySelector('#joinMatchDiv')?.appendChild(joinMatchButton);
						}

					}
					else 
					{

						// J'affiche le texte pour dire que je ne peux pas jouer ce round


						// alert("je dois attendre le prochain match 1v1");
						const joinMatchText = document.createElement('p');
						joinMatchText.className = "text-white px-4 py-2 rounded text-xl";
						joinMatchText.textContent = "Waiting for the next match...";
						if (this.container.querySelector('#joinMatchDiv'))
						{
							(this.container.querySelector('#joinMatchDiv') as HTMLElement).innerHTML = '';
							this.container.querySelector('#joinMatchDiv')?.appendChild(joinMatchText);
						}

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
				const tablePlayersRoomStarted = this.container.querySelector('#tablePlayersRoomStarted');
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
					// alert("je quitte la room");
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
			// alert("je vais qiutter la room");

			await this.quitRoom();
			});
		}
	}

	// Handle Play Again button click - creates a new room to play another tournament
	private async playAgainClickEvent()
	{
		const elt = this.container.querySelector('#buttonPlayAgain');
		if (elt)
		{
			elt.addEventListener('click', async () => {
				try {
					sessionStorage.removeItem('room');
					sessionStorage.removeItem('finished');
					sessionStorage.removeItem('tournament_started');
					sessionStorage.removeItem('tournament_finished');
					sessionStorage.removeItem('match_id');

					await this.changeRoomPage("out");
					
					const messageOut = this.container.querySelector('#messageOut');
					if (messageOut) {
						(messageOut as HTMLElement).style.display = "block";
						(messageOut as HTMLElement).textContent = "Ready for a new tournament! Create or join a room.";
						(messageOut as HTMLElement).style.color = "#00ffff"; // cyan color
						
						setTimeout(() => {
							(messageOut as HTMLElement).style.display = "none";
						}, 3000);
					}
				} catch (error) {
					console.error("Error in play again:", error);
					alert("Error starting new game. Please try again.");
				}
			});
		}
	}

	private async mainMenuClickEvent()
	{
		const elt = this.container.querySelector('#buttonMainMenu');
		if (elt)
		{
			elt.addEventListener('click', async () => {
				try {
					sessionStorage.removeItem('room');
					sessionStorage.removeItem('finished');
					sessionStorage.removeItem('tournament_started');
					sessionStorage.removeItem('tournament_finished');
					sessionStorage.removeItem('match_id');

					if (this.router) {
						this.router.navigate('/dashboard');
					} else {
						window.location.href = '/dashboard';
					}
				} catch (error) {
					console.error("Error navigating to main menu:", error);
					alert("Error navigating to main menu. Please try again.");
				}
			});
		}
	}
}

export default RoomPage;