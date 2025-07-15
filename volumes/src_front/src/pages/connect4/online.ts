import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
// Dynamic import to reduce bundle size
// import Connect4Component from '../../core/components/connect4/connect4';


class OnlineConnect4Page extends Page {
	private connect4Game: any | null = null; // Use any to avoid static import
	private gameSocket: WebSocket | null = null;

	constructor(id: string, router?: Router) {
		super(id, router);
		// Customize the Connect4 tournament page after local game end (online mode)

	
	}
	private customizeOnlineTournamentPage() {
		// You can add custom logic here to update the UI after the Connect4 game ends in online tournament mode.
		// For example, show a message or trigger a page change.
		console.log('Customize online tournament page after game end');
	}

	private cleanupConnect4Game() {
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
								<h2 id="nameRoomNew" class="text-3xl font-cyber text-neon-pink mb-2">Room Name</h2>
								<p id="idRoomNew" class="text-lg text-neon-cyan font-tech">Room ID: </p>
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
											<!-- Les joueurs seront ajoutés dynamiquement par JavaScript -->
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
								<p id="winnerName" class="text-3xl font-cyber text-neon-pink mb-2">The winner is: </p>
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
								<h2 id="nameRoomNewStarted" class="text-3xl font-cyber text-neon-pink mb-2">Room Name</h2>
								<p id="idRoomNewStarted" class="text-lg text-neon-cyan font-tech mb-2">Room ID: </p>
								<p id="roundRoomNewStarted" class="text-2xl text-yellow-400 font-cyber">Round: </p>
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
								<button id="joinMatchButton" class="inline-block bg-gradient-to-r from-neon-cyan to-neon-pink text-white font-cyber px-8 py-3 rounded-lg text-xl hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300">JOIN MY CONNECT4 MATCH</button>
								<button id="quickMatchButton" class="inline-block bg-gradient-to-r from-purple-600 to-blue-600 text-white font-cyber px-8 py-3 rounded-lg text-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 ml-4">QUICK MATCH (1vs1)</button>
								<p class="text-white font-tech text-xl">Waiting for the next match...</p>
							</div>
						</div>
					</div>

					<!-- Connect4 Game Loading View -->
					<div id="room_loading" class="hidden max-w-5xl mx-auto">
						<div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-neon-cyan/40 shadow-lg shadow-neon-cyan/20">
							<div class="text-center mb-6">
								<h2 class="text-3xl font-cyber text-neon-cyan mb-4">WAITING FOR OPPONENT</h2>
								<p id="loadingMatchInfo" class="text-lg text-white font-tech mb-6">Match ID: <span id="loadingMatchId"></span></p>
							</div>

							<!-- Loading Animation -->
							<div class="flex justify-center mb-8">
								<div class="relative flex items-center justify-center">
									<svg class="animate-spin drop-shadow-neon-cyan" style="animation-duration:1.2s;" width="110" height="110" viewBox="0 0 110 110">
										<defs>
											<radialGradient id="neonGlow" cx="50%" cy="50%" r="50%">
												<stop offset="0%" stop-color="#00fff7" stop-opacity="0.7"/>
												<stop offset="100%" stop-color="#00fff7" stop-opacity="0"/>
											</radialGradient>
										</defs>
										<circle cx="55" cy="55" r="44" stroke="#00fff7" stroke-width="8" fill="none" opacity="0.18"/>
										<circle cx="55" cy="55" r="44" stroke="#00fff7" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="70 200"/>
										<circle cx="55" cy="55" r="44" fill="url(#neonGlow)"/>
									</svg>
									<div class="absolute w-[140px] h-[140px] rounded-full pointer-events-none" style="box-shadow:0 0 60px 20px #00fff7,0 0 120px 40px #00fff7AA;"></div>
								</div>
							</div>					<div class="text-center space-y-4">
						<p id="loadingStatusText" class="text-2xl font-cyber text-neon-cyan animate-glow-pulse">Waiting for opponent...</p>
						<p id="loadingIndicatorText" class="text-lg text-gray-300 font-tech">Looking for another player to start the Connect4 match</p>
						<p class="text-sm text-gray-400 font-tech">The game will start automatically when both players are connected</p>
						<div class="mt-4">
							<div class="inline-flex items-center space-x-2">
								<div class="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
								<span class="text-neon-cyan font-tech">Connected to match server</span>
							</div>
						</div>
								<button id="cancelWaitButton" class="bg-red-600 hover:bg-red-700 text-white font-cyber px-6 py-2 rounded transition-all duration-300 mt-4">CANCEL</button>
							</div>
						</div>
					</div>

					<!-- Connect4 Game View -->
					<div id="room_playing" class="hidden max-w-5xl mx-auto">
						<div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-neon-pink/40 shadow-lg shadow-neon-pink/20">
							<div class="text-center mb-6">
								<h2 class="text-3xl font-cyber text-neon-pink mb-2">CONNECT4 TOURNAMENT MATCH</h2>
								<p id="matchInfo" class="text-lg text-neon-cyan font-tech mb-2">Match in progress...</p>
								<p id="gameStatusText" class="text-xl text-yellow-400 font-cyber">Waiting for game to start...</p>
							</div>					<!-- Connect4 Game Container -->
					<div id="connect4GameContainer" class="w-full">
						<!-- The Connect4 game will be dynamically loaded here -->
					</div>

							<!-- Game Actions -->
							<div class="text-center space-y-4">
								<button id="giveUpButton" class="bg-red-600 hover:bg-red-700 text-white font-cyber px-8 py-3 rounded-lg text-xl transition-all duration-300">GIVE UP</button>
								<p class="text-gray-300 font-tech">Your opponent will win if you give up</p>
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
		await this.joinMatchClickEvent();
		await this.giveUpClickEvent();
		await this.cancelWaitClickEvent();

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
					return true; // Changé pour permettre l'accès si on a un sessionStorage
				}
				else if (result.success == true && result.in_room == false)
				{
					// alert("je ne suis pas dans une room");
					return true;
				}
				else
				{
					// alert("error can show roompage");
					return false;
				}
			} catch (err)
			{
					//alert("error can show roompage catch");

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
const response = await fetch('https://localhost:4430/api/invite_player_tournament/' + user_id_to_invite, {
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
					alert("Invitation sent successfully to user ID: " + user_id_to_invite);
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
					
					// Vérifier le nombre de joueurs pour afficher/masquer le bouton START
					const nb_players = await this.my_room_nb_players();
					const buttonStart = this.container.querySelector('#buttonStart') as HTMLElement | null;
					if (buttonStart)
					{
						if (nb_players >= 2) {
							buttonStart.style.display = "inline-block";
						} else {
							buttonStart.style.display = "none";
						}
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
				else
				{
					// Je ne suis pas admin - masquer les boutons admin et afficher le bouton quit
					const buttonStart = this.container.querySelector('#buttonStart') as HTMLElement | null;
					if (buttonStart)
					{
						buttonStart.style.display = "none";
					}
					
					const buttonDestroy = this.container.querySelector('#buttonDestroy') as HTMLElement | null;
					if (buttonDestroy)
					{
						buttonDestroy.style.display = "none";
					}
					
					const buttonQuitRoom = this.container.querySelector('#buttonQuitRoom') as HTMLElement | null;
					if (buttonQuitRoom)
					{
						buttonQuitRoom.style.display = "inline-block";
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
		const room_in = this.container.querySelector('#room_in');
		const room_started = this.container.querySelector('#room_started');
		const room_out = this.container.querySelector('#room_out');
		const room_finished = this.container.querySelector('#room_finished');
		const room_forbidden = this.container.querySelector('#room_forbidden');
		const room_loading = this.container.querySelector('#room_loading');
		const room_playing = this.container.querySelector('#room_playing');

		if (!(room_in && room_started && room_out && room_finished && room_forbidden && room_loading && room_playing))
		{
			return ;
		}

		// Hide all rooms first
		const allRooms = [room_in, room_started, room_out, room_finished, room_forbidden, room_loading, room_playing];
		allRooms.forEach(room => {
			if (room) (room as HTMLElement).style.display = "none";
		});

		if (in_or_out === "in")
		{
			await this.changeRoomPageInformations();
			(room_in as HTMLElement).style.display = "block";
		}
		else if (in_or_out == "out")
		{
			(room_out as HTMLElement).style.display = "block";
		}
		else if (in_or_out == "started")
		{
			await this.changeRoomPageInformationsStarted(); //// A FAIRE POUR LA FIN DUN ROUND
			(room_started as HTMLElement).style.display = "block";	
		}
		else if (in_or_out == "finished")
		{
			// A FAIRE :
			// if (sessionStorage.getItem("tournament_finished") == "true")
			// {
			//alert("je vais afficher le finished");
				await this.changeRoomPageInformationsFinished();
				(room_finished as HTMLElement).style.display = "block";
							// await this.removeLocalStorageTournament();

			// }
		}
		else if (in_or_out == "forbidden")
		{
			(room_forbidden as HTMLElement).style.display = "block";	
		}
		else if (in_or_out == "loading")
		{
			(room_loading as HTMLElement).style.display = "block";
		}
		else if (in_or_out == "playing")
		{
			(room_playing as HTMLElement).style.display = "block";
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
				alert("aucune tablePlayersRoom trouvée");
				return ;
			}
			(this.container.querySelector('#tablePlayersRoom') as HTMLElement).innerHTML = '';
			let i = 0;
			for (const player of players)
			{

				// Ajoute une ligne dans la table de la liste des joueurs

				const tdTableUsername = document.createElement('td');
				const tdTableRemoveUser = document.createElement('td');
				tdTableUsername.className = "px-6 py-3 text-white font-tech";
				tdTableRemoveUser.className = "px-6 py-3 text-center";
				tdTableUsername.textContent = player.username;
				tdTableRemoveUser.innerHTML = `<button data-id="${player.user_id}" id="reject_player" class="text-red-400 hover:text-red-300 hover:bg-red-500/20 px-2 py-1 rounded transition-colors">✕</button>`;
				const lineTable = document.createElement("tr");
				lineTable.className = "border-b border-cyber-light/10";
				lineTable.appendChild(tdTableUsername);

				if (localvar.admin && i != 0)
				{
				lineTable.appendChild(tdTableRemoveUser);
				}
				(this.container.querySelector('#tablePlayersRoom') as HTMLElement).appendChild(lineTable);
				i++;
			}

			await this.enable_kick_button();
			// Mettre à jour l'affichage du bouton START selon le nombre de joueurs
			await this.showInButtonsIfAdmin();

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
			//alert("message recu WS true : " + event.data); // {"success":true,"cause":"end_of_tournament","winner":"baptiste"}

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
					//alert("un joueur est arrivé. Affichage de la nouvelle liste de joueurs");
					await this.changeRoomPageInformations();
				}


				// EN COURS : arret du tournoi si un joueur s'est deco
				if (obj_serv_ws.success == true && obj_serv_ws.cause == "tournament_stopped")
				{

					// Quelqu'un s'est deco en plein tournoi : je dois arreter le tournoi et me deco de la room

					// J'ai été kick de la room
					//alert("quelqu'un s'est deconnecte du tournoi apres le démarrage, je dois quitter la room");

					await this.removeLocalStorageTournament(); // TEST

					// Supprime tous les localstorag associés a ce tournoi
					// await this.removeLocalStorageTournament();

					// Redirige et raffraichis la page si je suis kick d'une room
					// this.router?.navigate('/room');

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
					// this.router?.navigate('/room');

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
					//alert("nouveau round a afficher");
					// Nouveaux round : j'affiche la liste des matchs 1v1
					// alert("je dois afficher la liste des nouveaux matchs 1v1");
					// await this.changeRoomPageInformationsStarted();


					sessionStorage.setItem('tournament_started', "true"); // A FINIR


					// Redirige et raffraichis la page pour afficher le menu en cas de nouveaux matchs
					// this.router?.navigate('/room');

					// Ou je devrais peut etre envoyer une notification pour dire qu'il y a de nouveaux matchs

					await this.changeRoomPage("started");
				}


				if (obj_serv_ws.success == true && obj_serv_ws.cause == "end_of_tournament")
				{
					console.log("Tournament ended, winner:", obj_serv_ws.winner);
					
					// Clean up any ongoing game resources
					await this.cleanupConnect4Game();
					
					// Set tournament finished flag
					sessionStorage.setItem("tournament_finished", "true");

					// Show finished page with winner information
					await this.changeRoomPageInformationsFinished();
					await this.changeRoomPage("finished");
					
					// Show a more user-friendly message
					//alert(`Tournoi terminé ! Le vainqueur est ${obj_serv_ws.winner || 'inconnu'}.`);
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
			socket.send("ping new"); // A DECOMMENTER APRES TEST
			// alert("test ping en cours");
		}, 4000);
	}


	// Permet de se connecter a une room (http)
	private async join_room_http(room_id : number)
	{

		// let room_id = document.getElementById('idRoom').value;
		try {
const response = await fetch('https://localhost:4430/api/connect4/join_room/' + room_id, {
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
						alert("error when joining room : " + room.error);
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
const response = await fetch('https://localhost:4430/api/tournament_started/' + room_id, {
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
const response = await fetch('https://localhost:4430/api/connect4/create_room', {
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
							if (result.success == true) {
								alert("Room destroyed successfully");
								await this.removeLocalStorageTournament();
								await this.changeRoomPage("out");
							} else {
								alert("Error destroying room: " + result.error);
							}
							return (result);
						} catch (err)
						{
							alert("erreur lors de la destruction de la room");
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
						joinMatchButton.setAttribute('data-route', '/play/connect4');
						joinMatchButton.setAttribute('href', '/play/connect4');
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
				if (result.success == true && result.quit == true)
				{
					alert("vous avez quitté la room avec succès");
					await this.removeLocalStorageTournament();
					await this.changeRoomPage("out");
				}
				else if (result.success == true && result.quit == false)
				{
					alert("Vous ne pouvez pas quitter la room car le tournoi a déjà commencé");
				}
				else
				{
					alert("Erreur lors de la tentative de quitter la room: " + result.error);
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

				// Le quitRoom() gère déjà le changement de page, pas besoin de le faire ici

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

	// Handle Join Match button click - starts a Connect4 match
	private async joinMatchClickEvent()
	{
		const elt = this.container.querySelector('#joinMatchButton');
		if (elt)
		{
			elt.addEventListener('click', async () => {
				try {
					// Get current room information
					const localstorage_room = sessionStorage.getItem('room');
					if (!localstorage_room) {
						alert("Erreur: Pas d'informations de room trouvées.");
						return;
					}

					const roomData = JSON.parse(localstorage_room);
					const roomId = roomData.id_room;

					// Check if player can join a Connect4 match
					const response = await fetch(`https://localhost:4430/api/can_play/${roomId}`, {
						method: 'GET',
						credentials: 'include'
					});

					if (!response.ok) {
						throw new Error('erreur http : ' + response.status);
					}

					const result = await response.json();						if (result.success && result.can_play) {
							// Store match ID and start Connect4 game
							sessionStorage.setItem('match_id', result.match_id.toString());
							await this.startConnect4Match(result.match_id);
						} else {
							// Show a more helpful message
							const messageOut = this.container.querySelector('#messageOut');
							if (messageOut) {
								(messageOut as HTMLElement).style.display = "block";
								(messageOut as HTMLElement).textContent = "Aucun match disponible pour le moment. Attendez qu'un autre joueur soit prêt ou qu'un nouveau round commence.";
								
								// Hide message after 5 seconds
								setTimeout(() => {
									(messageOut as HTMLElement).style.display = "none";
								}, 5000);
							}
						}
				} catch (err) {
					console.error("Error joining match:", err);
					alert("Erreur lors de la tentative de rejoindre le match.");
				}
			});
		}
	}

	// Handle Give Up button click - surrenders the current Connect4 match
	private async giveUpClickEvent()
	{
		const elt = this.container.querySelector('#giveUpButton');
		if (elt)
		{
			elt.addEventListener('click', async () => {
				if (confirm("Êtes-vous sûr de vouloir abandonner ? Votre adversaire gagnera automatiquement.")) {
					try {
						const match_id = sessionStorage.getItem('match_id');
						if (match_id) {
							const response = await fetch('https://localhost:4430/api/stop_match/' + match_id, {
								method: 'GET',
								credentials: 'include'
							});

							if (!response.ok) {
								throw new Error('erreur http : ' + response.status);
							}

							const result = await response.json();
							if (result.success) {
								// Clean up game and return to tournament view
								await this.cleanupConnect4Game();
								await this.changeRoomPage("started");
								alert("Vous avez abandonné le match.");
							} else {
								alert("Erreur lors de l'abandon du match: " + result.error);
							}
						} else {
							alert("Aucun match en cours trouvé.");
						}
					} catch (err) {
						console.error("Error giving up match:", err);
						alert("Erreur lors de l'abandon du match.");
					}
				}
			});
		}
	}

	// Start a Connect4 match
	private async startConnect4Match(match_id: number)
	{
		try {
			// Show loading view first
			await this.changeRoomPage("loading");
			
			// Update loading match info
			const loadingMatchIdElement = this.container.querySelector('#loadingMatchId');
			if (loadingMatchIdElement) {
				loadingMatchIdElement.textContent = match_id.toString();
			}

			// Connect to game WebSocket
			await this.connectToGameWebSocket(match_id);

		} catch (error) {
			console.error("Error starting Connect4 match:", error);
			alert("Erreur lors du démarrage du match Connect4.");
		}
	}

	// Connect to the game WebSocket for real-time multiplayer
	private async connectToGameWebSocket(match_id: number)
	{
		try {
			// Close existing connection if any
			if (this.gameSocket) {
				this.gameSocket.close();
			}

			console.log(`Connecting to Connect4 WebSocket for match ${match_id}`);
			
			// Connect to game WebSocket (using same endpoint as Pong)
			this.gameSocket = new WebSocket(`wss://localhost:4430/api/ws/play/${match_id}`);

			this.gameSocket.addEventListener('open', () => {
				console.log('Connected to Connect4 match WebSocket');
				// Send initial connection message
				if (this.gameSocket && this.gameSocket.readyState === WebSocket.OPEN) {
					console.log('Sending connection message to server');
					this.gameSocket.send(JSON.stringify({
						type: 'connection',
						gameType: 'connect4'
					}));
				}
			});

			this.gameSocket.addEventListener('message', async (event) => {
				try {
					const data = JSON.parse(event.data);
					console.log('Received WebSocket message:', data);
					await this.handleGameMessage(data);
				} catch (error) {
					console.error('Error parsing game message:', error);
				}
			});

			this.gameSocket.addEventListener('close', (event) => {
				console.log('Game WebSocket closed:', event.code, event.reason);
				if (event.code !== 1000) {
					// Show message only if not a normal closure
					const messageOut = this.container.querySelector('#messageOut');
					if (messageOut) {
						(messageOut as HTMLElement).style.display = "block";
						(messageOut as HTMLElement).textContent = "Connexion au jeu interrompue";
						setTimeout(() => {
							(messageOut as HTMLElement).style.display = "none";
						}, 5000);
					}
				}
			});

			this.gameSocket.addEventListener('error', (error) => {
				console.error('Game WebSocket error:', error);
				const messageOut = this.container.querySelector('#messageOut');
				if (messageOut) {
					(messageOut as HTMLElement).style.display = "block";
					(messageOut as HTMLElement).textContent = "Erreur de connexion au jeu";
					setTimeout(() => {
						(messageOut as HTMLElement).style.display = "none";
					}, 5000);
				}
			});

		} catch (error) {
			console.error("Error connecting to game WebSocket:", error);
			alert("Erreur lors de la connexion au jeu.");
		}
	}

	// Handle incoming game messages
	private async handleGameMessage(data: any)
	{
		console.log('Received game message:', data);

		if (data.error) {
			console.error('Game error received:', data.error);
			alert(`Erreur de jeu: ${data.error}`);
			return;
		}

		switch (data.type) {
			case 'connection':
				console.log('Connection message received:', data);
				this.updateLoadingStatus(data);
				break;
			case 'waiting_for_player':
				console.log('Waiting for player message received');
				this.updateLoadingStatus({ message: 'waiting_for_player' });
				break;
			case 'both_players':
				console.log('Both players connected message received');
				this.updateLoadingStatus({ message: 'both_players' });
				break;
			case 'game_start':
				console.log('Game start message received:', data);
				await this.startActualConnect4Game(data);
				break;
			case 'move':
				console.log('Move message received:', data);
				this.handleConnect4Move(data);
				break;
			case 'game_end':
				console.log('Game end message received:', data);
				await this.handleConnect4GameEnd(data.winner);
				break;
			case 'stop_match':
				console.log('Match stopped by opponent');
				await this.cleanupConnect4Game();
				
				// Check if tournament is finished after this match
				const localstorage_room = sessionStorage.getItem('room');
				if (localstorage_room) {
					const roomData = JSON.parse(localstorage_room);
					const roomId = roomData.room_id;
					
					// Check if tournament is finished
					if (await this.checkIfTournamentEnded(roomId)) {
						// Tournament ended, show finished page
						await this.changeRoomPageInformationsFinished();
						await this.changeRoomPage("finished");
						alert(`Tournoi terminé ! ${data.winner_username || 'L\'adversaire'} a gagné le tournoi.`);
					} else {
						// Tournament continues, return to started page
						await this.changeRoomPage("started");
						alert(`Match terminé. ${data.winner_username || 'L\'adversaire'} a gagné.`);
					}
				} else {
					// Fallback if no room data
					await this.changeRoomPage("started");
					alert(`Match terminé. ${data.winner_username || 'L\'adversaire'} a gagné.`);
				}
				break;
			default:
				console.log('Unknown game message type:', data.type, data);
				// Handle unknown message types gracefully
				if (data.message) {
					this.updateLoadingStatus(data);
				}
		}
	}

	// Update loading status based on server messages
	private updateLoadingStatus(data: any) {
		const statusText = this.container.querySelector('#loadingStatusText');
		const indicatorText = this.container.querySelector('#loadingIndicatorText');
		
		if (statusText && indicatorText) {
			if (data.message === 'waiting_for_player') {
				statusText.textContent = 'Waiting for another player...';
				indicatorText.textContent = 'One player connected, waiting for second player to join';
			} else if (data.message === 'both_players') {
				statusText.textContent = 'Both players connected!';
				indicatorText.textContent = 'Starting Connect4 game in a few seconds...';
			} else if (data.message === 'connected') {
				statusText.textContent = 'Connected to match!';
				indicatorText.textContent = 'Waiting for game to start...';
			}
		}
	}

	// Start the actual Connect4 game when both players are connected
	private async startActualConnect4Game(gameData: any)
	{
		try {
			console.log('Starting actual Connect4 game with data:', gameData);
			
			// Show the Connect4 game view
			await this.changeRoomPage("playing");

			// Update match info
			const matchInfoElement = this.container.querySelector('#matchInfo');
			if (matchInfoElement) {
				const opponentName = gameData.isPlayer1 ? gameData.player2 : gameData.player1;
				matchInfoElement.textContent = `Match vs ${opponentName || 'Opponent'}`;
			}

			// Update initial game status
			const statusElement = this.container.querySelector('#gameStatusText');
			if (statusElement) {
				if (gameData.isPlayer1) {
					statusElement.textContent = "You are Player 1 (Red) - Your turn to play!";
				} else {
					statusElement.textContent = "You are Player 2 (Yellow) - Wait for opponent's move";
				}
			}

			// Initialize Connect4 game component
			const gameContainer = this.container.querySelector('#connect4GameContainer');
			if (gameContainer) {
				gameContainer.innerHTML = '';
				
				try {
					// Dynamic import to reduce bundle size
					const { default: Connect4Component } = await import('../../core/components/connect4/connect4');
					
					// Create Connect4 component for online tournament match
					this.connect4Game = new Connect4Component(
						gameData.player1 || "Player 1", 
						gameData.player2 || "Player 2",
						{
							isTournamentMode: true, // Enable tournament mode for online games
							onGameEnd: async (winner: string) => {
								// Handle game end locally, but server will be authoritative
								console.log('Local game ended, winner:', winner);
								// Let the Connect4Component show its tournament complete page
								// Then customize it for online mode
								setTimeout(() => {
									this.customizeOnlineTournamentPage();
								}, 100);
							}
						}
					);

					// Set up multiplayer callbacks for Connect4
					if (this.connect4Game.setMultiplayerCallbacks) {
						this.connect4Game.setMultiplayerCallbacks({
							onMove: (column: number) => {
								// Send move to server via WebSocket
								if (this.gameSocket && this.gameSocket.readyState === WebSocket.OPEN) {
									console.log('Sending move to server, column:', column);
									this.gameSocket.send(JSON.stringify({
										type: 'move',
										column: column
									}));
								} else {
									console.error('WebSocket not connected, cannot send move');
								}
							}
						});
					}

					// Render the Connect4 game
					const gameElement = this.connect4Game.render();
					if (gameElement) {
						gameContainer.appendChild(gameElement);
						console.log('Connect4 game component rendered successfully');
					} else {
						throw new Error('Failed to render Connect4 component');
					}

				} catch (error) {
					console.error("Error loading Connect4 component:", error);
					alert("Erreur lors du chargement du composant Connect4. Veuillez réessayer.");
					// Return to tournament view on error
					await this.changeRoomPage("started");
				}
			} else {
				console.error('Connect4 game container not found');
				alert("Erreur: conteneur de jeu introuvable.");
			}

		} catch (error) {
			console.error("Error starting actual Connect4 game:", error);
			alert("Erreur lors du démarrage du jeu Connect4. Veuillez réessayer.");
			// Return to tournament view on error
			await this.changeRoomPage("started");
		}
	}

	// Handle Connect4 move from server
	private handleConnect4Move(moveData: any)
	{
		console.log('Handling Connect4 move:', moveData);
		
		if (this.connect4Game && moveData.board) {
			try {
				// Update the game board from server
				if (this.connect4Game.updateGameState) {
					this.connect4Game.updateGameState(moveData.board, moveData.currentPlayer);
				} else {
					console.warn('updateGameState method not available on Connect4 component');
				}
				
				// Update status text
				const statusElement = this.container.querySelector('#gameStatusText');
				if (statusElement) {
					const currentPlayer = moveData.currentPlayer || 1;
					const isMyTurn = currentPlayer === (moveData.isPlayer1 ? 1 : 2);
					
					if (isMyTurn) {
						statusElement.textContent = `Your turn! (Player ${currentPlayer})`;
						statusElement.className = 'text-xl text-neon-cyan font-cyber';
					} else {
						statusElement.textContent = `Opponent's turn (Player ${currentPlayer})`;
						statusElement.className = 'text-xl text-yellow-400 font-cyber';
					}
				}
			} catch (error) {
				console.error('Error handling Connect4 move:', error);
			}
		} else {
			console.warn('Connect4 game not initialized or missing move data');
		}
	}

	// Handle cancel wait button
	private async cancelWaitClickEvent()
	{
		const elt = this.container.querySelector('#cancelWaitButton');
		if (elt) {
			elt.addEventListener('click', async () => {
				if (confirm("Êtes-vous sûr de vouloir annuler l'attente ?")) {
					await this.cancelWaitForOpponent();
				}
			});
		}
	}

	// Cancel waiting for opponent
	private async cancelWaitForOpponent()
	{
		try {
			const match_id = sessionStorage.getItem('match_id');
			if (match_id) {
				// Close WebSocket connection
				if (this.gameSocket) {
					this.gameSocket.close();
					this.gameSocket = null;
				}

				// Notify server that we're canceling
				const response = await fetch('https://localhost:4430/api/cancel_match/' + match_id, {
					method: 'GET',
					credentials: 'include'
				});

				if (response.ok) {
					sessionStorage.removeItem('match_id');
					await this.changeRoomPage("started");
				} else {
					throw new Error('Failed to cancel match');
				}
			}
		} catch (error) {
			console.error("Error canceling wait:", error);
			alert("Erreur lors de l'annulation.");
		}
	}

	// Handle Connect4 game end
	private async handleConnect4GameEnd(winner: any)
	{
		try {
			console.log('Handling Connect4 game end, winner:', winner);

			// Clean up the game
			await this.cleanupConnect4Game();

			// --- SUPPRIMÉ : fetch pour vérifier la fin du tournoi ---
			// const localstorage_room = sessionStorage.getItem('room');
			// if (localstorage_room) {
			// 	const roomData = JSON.parse(localstorage_room);
			// 	const roomId = roomData.room_id;

			// 	// Donne un peu de temps au backend pour mettre à jour la BDD
			// 	setTimeout(async () => {
			// 		const isFinished = await this.checkIfTournamentEnded(roomId);
			// 		if (isFinished) {
			// 			sessionStorage.setItem("tournament_finished", "true");
			// 			await this.changeRoomPageInformationsFinished();
			// 			await this.changeRoomPage("finished");
			// 		} else {
			// 			// Si le tournoi continue, affiche la page "started"
			// 			await this.changeRoomPage("started");
			// 		}
			// 	}, 1200); // 1.2s pour laisser le backend finir
			// }
			// --- NOUVEAU COMPORTEMENT : n'affiche rien, attend le message WebSocket end_of_tournament ---

		} catch (error) {
			console.error("Error handling Connect4 game end:", error);
			// --- Ne force pas le retour sur "started" ---
			// await this.changeRoomPage("started");
		}
	}
}

export default OnlineConnect4Page;