import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import neonPongTablePath from '../../assets/neon_pong_table.png';

class MainPage extends Page {
  static TextObject = {
    MainTitle: 'FT_TRANSCENDENCE',
    EnterGame: 'ENTER THE GAME'
  };

  constructor(id: string, router?: Router) {
    super(id, router);
  }

  async render(): Promise<HTMLElement> {
    this.container.innerHTML = '';
    await this.setupHeaderListeners();
    
    const mainContent = document.createElement('div');
    mainContent.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-col';
    mainContent.innerHTML = `
      <div class="absolute inset-0 z-0">
        <img src="${neonPongTablePath}" alt="Neon Pong Table Background" 
             class="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div class="absolute inset-0 bg-black bg-opacity-10"></div>
      </div>

      <!-- Main Content -->
      <div class="relative z-10 min-h-screen flex flex-col items-center justify-start px-4 pt-12 md:pt-20">
        <!-- Title -->
        <h1 class="font-cyber text-6xl md:text-8xl font-bold mb-4 text-center mt-8">
          <span class="text-neon-pink animate-glow-pulse">FT_</span><span class="text-neon-cyan">TRANSCENDENCE</span>
        </h1>

        <!-- Enter Game Button -->
        <button id="enter-game-button" data-route="/dashboard" 
                class="group relative bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-bold text-lg px-12 py-4 
                       border border-neon-pink hover:shadow-lg hover:shadow-neon-pink/50 
                       transition-all duration-300 animate-scale-in font-cyber tracking-wider
                       before:absolute before:inset-0 before:bg-gradient-to-r before:from-neon-pink/20 before:to-neon-cyan/20 
                       before:opacity-0 hover:before:opacity-100 before:transition-opacity
                       mt-32 md:mt-48">
          <span class="relative z-10">ENTER THE GAME</span>
        </button>

      <!-- Corner UI Elements -->
      <div class="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-neon-pink opacity-50"></div>
      <div class="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-neon-cyan opacity-50"></div>
      <div class="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-neon-cyan opacity-50"></div>
      <div class="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-neon-pink opacity-50"></div>
    `;
    
    this.container.appendChild(mainContent);
    
    setTimeout(() => {
      this.setupEventListeners();
    }, 200);
    
    return this.container;
  }
  
  private setupEventListeners(): void {
    const enterGameButton = document.getElementById('enter-game-button');
    
    if (enterGameButton && this.router) {
      enterGameButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const res = await fetch('/api/me', { credentials: 'include' });
          const data = await res.json();
          if (data && data.success) {
            this.router?.navigate('/dashboard');
          } else {
            this.router?.navigate('/login');
          }
        } catch {
          this.router?.navigate('/login');
        }
      });
    }
  }
}

export default MainPage;