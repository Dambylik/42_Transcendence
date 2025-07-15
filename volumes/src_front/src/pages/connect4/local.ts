import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import connect4Local from '../../assets/connect4local.png';
// Dynamic import to reduce bundle size
// import Connect4Component from '../../core/components/connect4/connect4.ts';

class LocalConnect4Page extends Page {
  static TextObject = {
    ReturnHome: 'RETURN HOME'
  };

  constructor(id: string, router?: Router) {
    super(id, router);
  }

  async render(): Promise<HTMLElement> {
    this.container.innerHTML = '';
    await super.setupHeaderListeners();

    const sidebarHtml = await super.createSidebar();

    const localConnect4Content = document.createElement('div');
    localConnect4Content.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark';
    localConnect4Content.innerHTML = `
      ${sidebarHtml}
      <div class="absolute inset-0 z-0">
          <img src="${connect4Local}" alt="Connect 4 Local Background" 
               class="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div class="absolute inset-0 bg-black bg-opacity-10"></div>
      </div>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col">
        <div class="relative z-10 min-h-screen flex flex-col items-center justify-start px-4 pt-24 md:pt-32">
          <!-- Title -->
          <h1 class="font-cyber text-6xl md:text-8xl font-bold mb-4 text-center mt-12">
            <span class="text-amber-400 animate-glow-pulse">LET'S PLAY !</span> <br/>
            <span class="text-orange-400">LOCAL CONNECT 4<br/></span>
          </h1>


          <!-- Username form with dashboard return -->
          <div id="username-form" class="mt-8 text-center text-white inset-0 z-0">        
            <form class="flex flex-col gap-4 max-w-sm mx-auto">
              <input type="text" id="player1" placeholder="Player 1 Username" class="p-3 rounded bg-gray-800 text-white border border-amber-500/50 focus:border-amber-400 focus:outline-none" required />
              <input type="text" id="player2" placeholder="Player 2 Username" class="p-3 rounded bg-gray-800 text-white border border-orange-500/50 focus:border-orange-400 focus:outline-none" required />
              <button type="submit" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 transition rounded py-3 font-bold text-white shadow-lg">
                START CONNECT 4 GAME
              </button>
            </form>
            <button id="dashboard-btn" class="mt-6 bg-neon-cyan text-black font-cyber px-6 py-3 rounded shadow-lg hover:bg-cyan-400 transition text-xl">
              ← Back to Connect4 Dashboard
            </button>
          </div>

          <!-- Connect4 container -->
          <div id="connect4-container" class="mt-8 hidden"></div>
          
          <!-- Return to menu button -->
          <div id="return-menu" class="mt-4 hidden">
            <button id="return-btn" class="bg-gray-700 hover:bg-gray-600 transition rounded py-2 px-4 font-bold text-white">
              Return to Menu
            </button>
          </div>
        </div>
      </main>
    `;

    this.container.appendChild(localConnect4Content);
    
    // Handle form submit
    const form = this.container.querySelector('#username-form form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const player1Input = this.container.querySelector<HTMLInputElement>('#player1');
      const player2Input = this.container.querySelector<HTMLInputElement>('#player2');

      if (!player1Input?.value.trim() || !player2Input?.value.trim()) {
        alert('Please enter both usernames!');
        return;
      }

      const player1 = player1Input.value.trim();
      const player2 = player2Input.value.trim();

      // Hide the form, show connect4 container
      const formDiv = this.container.querySelector('#username-form');
      const connect4Container = this.container.querySelector('#connect4-container');
      const returnMenu = this.container.querySelector('#return-menu');

      if (formDiv && connect4Container && returnMenu) {
        formDiv.classList.add('hidden');
        connect4Container.classList.remove('hidden');
        returnMenu.classList.remove('hidden');

        // Dynamic import and instantiate Connect4Component with usernames
        import('../../core/components/connect4/connect4').then(({ default: Connect4Component }) => {
          const connect4 = new Connect4Component(player1, player2);
          connect4Container.appendChild(connect4.render());
        }).catch(error => {
          console.error('Error loading Connect4 component:', error);
          alert('Error loading Connect4 game');
        });
      }
    });

    // Handle return to menu button and dashboard button
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.id === 'return-btn') {
        const formDiv = this.container.querySelector('#username-form');
        const connect4Container = this.container.querySelector('#connect4-container');
        const returnMenu = this.container.querySelector('#return-menu');

        if (formDiv && connect4Container && returnMenu) {
          formDiv.classList.remove('hidden');
          connect4Container.classList.add('hidden');
          returnMenu.classList.add('hidden');
          // Clear the connect4 container
          connect4Container.innerHTML = '';
          // Clear the form inputs
          const player1Input = this.container.querySelector<HTMLInputElement>('#player1');
          const player2Input = this.container.querySelector<HTMLInputElement>('#player2');
          if (player1Input) player1Input.value = '';
          if (player2Input) player2Input.value = '';
        }
      }
      if (target.id === 'dashboard-btn') {
        // Redirige vers le dashboard connect4 (
        if (this.router) {
          this.router.navigate('/game/connect4_dashboard');
        } else {
          window.location.href = '/game/connect4_dashboard';
        }
      }
    });

    // Setup sidebar navigation
    await super.setupSidebarListeners();

    return this.container;
  }
}

export default LocalConnect4Page;
