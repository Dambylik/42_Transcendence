import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
// import type { HtmlElementTexture } from 'babylonjs';


class TestGoogle extends Page {
    static TextObject = {
    underConstruction: 'PAGE UNDER CONSTRUCTION',
    };

    constructor(id: string, router?: Router) {
        super(id, router);
    }
    
    async render(): Promise<HTMLElement> {
        this.container.innerHTML = '';
        // await super.setupHeaderListeners();
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



TEST GOOGLE

<div id="buttonDivGoogle"></div> <!-- OLGA DOIT AJOUTE CE CODE A LEMPLACEMENT DU SIGN IN GOOGLE de la page login -->








      

</div></div></div></div>

      </main>
    `;

    this.container.appendChild(dashboardContent);



    // await super.setupSidebarListeners(); // Rendu asynchrone pour attendre les listeners



    // Olga doit ajouter ce code dans la fonction principale de la page Login
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    alert(CLIENT_ID); // A SUPPRIMER : ici uniquement pour les tests
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: this.handleCredentialResponse,
    });
    google.accounts.id.renderButton(
        this.container.querySelector('#buttonDivGoogle')!,
        {
        theme: 'outline',
        size: 'large',
        }
    );

    

    // this.tester();
    return this.container;
  }



  // Olga doit ajouter cette méthode dans la classe de sa page
    private handleCredentialResponse(response: google.accounts.id.CredentialResponse) { // J'ai besoin de définir un template CredentialResponse dans un d.ts pour indiquer ce qu'il contient
    console.log('JWT reçu :', response.credential);

        // On envoie le token google (le JWT) au backend fastify pour pouvoir récupérer les infos sur l'utilisateur
        fetch('/api/auth/google', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id_token: response.credential })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success == true)
            {
                // Connexion Google Sign In réussie
                alert("You have been logged in successfully with Google");
            }
            else
            {
                alert("Please try to reconnect to Google again");
            }
            console.log('Utilisateur connecté', data);
        });
    }

 

}

export default TestGoogle;