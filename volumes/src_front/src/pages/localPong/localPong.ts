import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import localGame from '../../assets/local_game.png';
import PongComponent from '../../core/components/pong/pong.ts'; // make sure path is correct

class localPongPage extends Page {
  static TextObject = {
    ReturnHome: 'RETURN HOME'
  };

  constructor(id: string, router?: Router) {
    super(id, router);
  }

  async render(): Promise<HTMLElement> {
    this.container.innerHTML = '';

    const localPongContent = document.createElement('div');
    localPongContent.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-col'; // pt-16 -> pt-4
    localPongContent.innerHTML = `
      <div class="absolute inset-0 z-0">
          <img src="${localGame}" alt="Error Page Background" 
               class="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div class="absolute inset-0 bg-black bg-opacity-10"></div>
      </div>

      <!-- Main Content -->
      <div class="relative z-10 min-h-screen flex flex-col items-center justify-start px-4 pt-24 md:pt-32">
        <!-- Title -->
        <h1 class="font-cyber text-6xl md:text-8xl font-bold mb-4 text-center mt-12">
          <span class="text-neon-pink animate-glow-pulse">LET'S PLAY !</span> <br/>
          <span class="text-neon-cyan">LOCALqwee PONG GAME<br/></span>
        </h1>

      <!-- Username form placeholder -->
      <div id="username-form" class="mt-8 text-center text-white inset-0 z-0">        
          <form class="flex flex-col gap-4 max-w-sm mx-auto">
          <input type="text" id="player1" placeholder="Player 1 Username" class="p-2 rounded bg-gray-800 text-white" required />
          <input type="text" id="player2" placeholder="Player 2 Username" class="p-2 rounded bg-gray-800 text-white" required />
          <button type="submit" class="bg-neon-pink hover:bg-pink-600 transition rounded py-2 font-bold">Start Game</button>
        </form>
      </div>


        <!-- Pong container placeholder -->
        <div id="pong-container" class="mt-8"></div>
      </div>


    `;

    this.container.appendChild(localPongContent);
    // Handle form submit
    const form = this.container.querySelector('#username-form') as HTMLFormElement;
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

      // Hide the form, show pong container
      const formDiv = this.container.querySelector('#username-form');
      const pongContainer = this.container.querySelector('#pong-container');

      if (formDiv && pongContainer) {
        formDiv.classList.add('hidden');
        pongContainer.classList.remove('hidden');

        // Instantiate PongComponent, optionally pass usernames
        const pong = new PongComponent(player1, player2);
        pongContainer.appendChild(pong.render());
      }
    });

    return this.container;
  }
}

export default localPongPage;

