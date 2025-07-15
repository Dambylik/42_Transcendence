import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import connect4Local from '../../assets/connect4local.png';
import connect4ai from '../../assets/connect4ai.png';
import connect4Online from '../../assets/connect4online.png';

class Connect4Dashboard extends Page {
  private gameModes: Array<{
    id: string;
    title: string;
    description: string;
    image: string;
  }>;
  
  constructor(id: string, router?: Router) {
    super(id, router);
    
    this.gameModes = [
        {
            id: 'connect4_local',
            title: 'LOCAL CONNECT 4',
            description: 'CHALLENGE YOUR FRIENDS IN LOCAL MULTIPLAYER CONNECT 4! TAKE TURNS DROPPING YOUR COLORED DISCS AND BE THE FIRST TO CONNECT FOUR IN A ROW. PERFECT FOR STRATEGIC BATTLES WITH FRIENDS SITTING SIDE BY SIDE!',
            image: connect4Local
        },
        {
            id: 'connect4_ai',
            title: 'AI CONNECT 4',
            description: 'TEST YOUR STRATEGIC SKILLS AGAINST AN INTELLIGENT AI OPPONENT! THE AI WILL CHALLENGE YOUR TACTICAL THINKING AND FORCE YOU TO PLAN SEVERAL MOVES AHEAD. CAN YOU OUTSMART THE COMPUTER IN THIS CLASSIC STRATEGY GAME?',
            image: connect4ai
        },
        {
            id: 'connect4_online',
            title: 'ONLINE CONNECT 4',
            description: 'COMPETE AGAINST PLAYERS FROM AROUND THE WORLD IN ONLINE CONNECT 4 MATCHES! GET MATCHED WITH OPPONENTS OF SIMILAR SKILL LEVEL AND PROVE YOUR STRATEGIC SUPERIORITY IN THIS TIMELESS GAME OF TACTICS!',
            image: connect4Online
        }
    ];
  }
    
  async render(): Promise<HTMLElement> {
    this.container.innerHTML = '';
    await super.setupHeaderListeners();

    const sidebarHtml = await super.createSidebar();

    const dashboardContent = document.createElement('div');
    dashboardContent.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark';
    dashboardContent.innerHTML = `
      ${sidebarHtml}
      <!-- Main Content -->
      <main class="flex-1 flex flex-col">
        <!-- Header Section -->
        <div class="p-4 pb-2">
          <div class="flex flex-col items-center mb-6">
            <h1 class="text-4xl font-cyber text-amber-400 animate-glow-pulse mb-2 tracking-wider">CONNECT 4 DASHBOARD</h1>
            <div class="h-1 w-48 bg-gradient-to-r from-amber-600 to-orange-600 mx-auto"></div>
          </div>
        </div>

        <!-- Strategy Games Section -->
        <div class="flex-1 px-8 pb-8">
          <div class="mb-12">
            <div class="flex items-center mb-8">
              <div class="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1"></div>
              <h2 class="text-2xl font-cyber text-amber-400 mx-6 tracking-wider">STRATEGY GAME MODES</h2>
              <div class="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1"></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              ${this.renderConnect4GameCards()}
            </div>
          </div>
        </div>
      </main>
    `;
    this.container.appendChild(dashboardContent);
    this.setupEventListeners();
    await super.setupSidebarListeners();
    return this.container;
  }

  private renderConnect4GameCards(): string {
    return this.gameModes.map((mode, index) => {
      const modeColors = {
        'connect4_local': {
          border: 'border-emerald-500/50',
          glow: 'hover:shadow-emerald-500/50',
          accent: 'border-emerald-400/80'
        },
        'connect4_ai': {
          border: 'border-violet-500/50',
          glow: 'hover:shadow-violet-500/50',
          accent: 'border-violet-400/80'
        },
        'connect4_online': {
          border: 'border-sky-500/50',
          glow: 'hover:shadow-sky-500/50',
          accent: 'border-sky-400/80'
        }
      };

      const colors = modeColors[mode.id as keyof typeof modeColors];

      return `
        <div class="cyber-panel cursor-pointer transition-all duration-300 hover:scale-105 corner-brackets relative group ${colors.border}" data-mode-id="${mode.id}">
          <div class="p-6 h-full flex flex-col">
            <!-- Game Mode Visualization -->
            <div class="relative mb-6 h-80 rounded border border-amber-500/40 overflow-hidden">
              
              <!-- Image Background -->
              <img src="${mode.image}" alt="${mode.title}" class="absolute inset-0 w-full h-full object-cover" />
              
              <!-- Strategy game specific glow effects -->
              <div class="absolute inset-0 bg-gradient-to-t from-amber-600/10 via-transparent to-orange-500/10 pointer-events-none"></div>
              
              <!-- Corner brackets with game-specific colors -->
              <div class="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 ${colors.accent}"></div>
              <div class="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 ${colors.accent}"></div>
              <div class="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 ${colors.accent}"></div>
              <div class="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 ${colors.accent}"></div>
            </div>

            <!-- Game Mode Info -->
            <div class="flex-1 flex flex-col">
              <h3 class="text-xl font-cyber font-bold text-amber-400 mb-4 tracking-wider text-center">${mode.title}</h3>
              <p class="text-sm text-gray-300 leading-relaxed mb-6 font-tech flex-1 text-center">
                ${mode.description}
              </p>

              <!-- Start Button -->
              <a href="/game/${mode.id}" class="mt-auto">
                <button 
                  class="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-lg px-12 py-3 
                        border border-amber-500 hover:shadow-lg ${colors.glow}
                        transition-all duration-300 animate-scale-in font-cyber tracking-wider
                        before:absolute before:inset-0 before:bg-gradient-to-r before:from-amber-600/20 before:to-orange-600/20
                        before:opacity-0 hover:before:opacity-100 before:transition-opacity 
                        relative overflow-hidden group start-game-btn rounded-lg"
                  data-game-mode="${mode.id}"
                >
                  <span class="relative z-10">START CONNECT 4</span>
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </button>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  private setupEventListeners(): void {
    // Add event listeners to game mode cards
    const gameCards = this.container.querySelectorAll('[data-mode-id]');
    gameCards.forEach(card => {
      card.addEventListener('click', (e) => {
        const modeId = (card as HTMLElement).dataset.modeId;
        const target = e.target as HTMLElement;
        
        if (!target.closest('.start-game-btn')) {
          if (this.router) {
            this.router.navigate(`/game/${modeId}`);
          } else {
            console.log('Router is not defined in game mode cards.');
          }
        }
      });
    });

    // Add event listeners to start game buttons
    const startButtons = this.container.querySelectorAll('.start-game-btn');
    startButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const gameMode = (button as HTMLElement).dataset.gameMode;
        if (this.router) {
          this.router.navigate(`/game/${gameMode}`);
        } else {
          console.log('Router is not defined in game buttons.');
        }
      });
    });
    
    // Setup sidebar navigation (includes avatar upload handling)
    super.setupSidebarListeners();
  }
}

export default Connect4Dashboard;
