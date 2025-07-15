import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
// import type { HtmlElementTexture } from 'babylonjs';


class TestInvite extends Page {
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
        
      </div>
    </header><div id="room-page"><div class="min-h-screen pt-16 bg-cyber-dark relative overflow-hidden"><div class="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-neon-pink opacity-50"></div><div class="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-neon-cyan opacity-50"></div><div class="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-neon-cyan opacity-50"></div><div class="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-neon-pink opacity-50"></div>
    
    
    
    
    <div id="mainContainer" class="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">


      <!-- Mon ajout commence ici -->





                <div>
        <p class="text-3xl">Join a room</p>
          <input type="text" id="roomIdJoin" class="text-black" placeholder="Room id (ex : 123)">
          <br><br>
                    <button id="buttonJoin" class="bg-gray-400 text-black px-4 py-2 rounded text-xl">JOIN</button>
        </div>



      <div id="gameDiv" class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10 text-center">





      

        ICI JE TESTE LES INVITATIONS
      








      </div>










      

</div></div></div></div>

      </main>
    `;

    this.container.appendChild(dashboardContent);


    // Affiche les invitations
    await this.showInvitationsWithInterval();

    // Permet de rejoindre la room en cas de clique sur l'invitation (actuellement ce n'est qu'un bouton et un input text !!!)
    await this.joinInviteClickEvent();



    await super.setupSidebarListeners(); // Rendu asynchrone pour attendre les listeners

    // this.tester();
    return this.container;
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
			// alert("resultat envoi formulaire (join room) : " + JSON.stringify(result));
			return (result);
		} catch (err)
		{
			// alert("erreur denvoi formulaire create room");
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


	private async joinInviteClickEvent()
	{
		const elt = this.container.querySelector('#buttonJoin');
		if (elt)
		{
			elt.addEventListener('click', async () => {

			// alert("test click join");


			// A MODIFIER par SAMI
			let roomId = Number((this.container.querySelector('#roomIdJoin') as HTMLInputElement).value);

			if (await this.checkIfRoomExists(roomId))
			{
				if (await this.checkIfTournamentStarted(roomId) == false)
				{
					// Je rejoins la room créée
					const room = await this.join_room_http(roomId);
					
					// Lorsque j'arrive sur la page /room et que "ws_to_join" est a true alors je fais appel a la fonction connect_join_room(roomId); et je supprime cet item du localstorage
					sessionStorage.setItem('ws_to_join', room.room_id);


					// Je stocke le numero de la room dans un sessionStorage
					sessionStorage.setItem('room', JSON.stringify({room_id : room.room_id, admin:false, room_name : room.room_name, user_id:room.user_id}));

					// A FAIRE : supprimer l'invitation dans la base de données
					await this.deleteInvitation(roomId);

					// Redirection vers la room
					this.router?.navigate('/room');

				}
				else
				{
					alert("la room que vous essayez de joindre a deja commencé");
				}
			}
			else
			{
				alert("la room que vous essayez de joindre n'existe pas, vérifiez l'id");
			}
			});
		}

	}

    private async deleteInvitation(room_id : number)
    {
        try {
				const response = await fetch('https://localhost:4430/api/remove_invitation/' + room_id, {
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
				}
				else
				{
					alert("erreur lors de la suppression de l'invitation pour une room : " + result.error);
				}
			} catch (err)
			{
				alert("erreur lors de la suppression des invitations");
			}
    }


	private async showInvitationsWithInterval()
	{
		setInterval(async () => 
			{try {
				const response = await fetch('https://localhost:4430/api/my_invitations', {
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
					// alert("jai bien recu les invitations");
					const invitations = result.tabl_invitations;

                    const gameDiv = this.container.querySelector('#gameDiv');
                    (gameDiv as HTMLElement).textContent = "";
					for (const invitation of invitations)
					{
						console.log("invitation with room id = " + invitation.room_id);
                        
                        if (gameDiv)
                        {
                            const newelt = document.createElement("p");
                            (newelt as HTMLElement).textContent = "Join room id = " + invitation.room_id;
                            gameDiv.appendChild(newelt);

                        }
					}
				}
				else
				{
					alert("erreur lors de la reception des invitations : " + result.error);
				}
			} catch (err)
			{
				alert("erreur de recuperation des invitations");
			}
		}, 2000
		);
	}
 

}

export default TestInvite;