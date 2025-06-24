import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import aiGame from '../../assets/ai_game.png';
import localGame from '../../assets/local_game.png';
import onlineGame from '../../assets/online_game.png';


class DashboardPage extends Page {
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
            id: 'ai',
            title: 'AI GAME',
            description: 'IN AI GAME MODE, YOU\'LL FACE OFF AGAINST AN AI OPPONENT IN A ONE-ON-ONE PING-PONG MATCH. TEST YOUR SKILLS ACROSS 3 ROUNDS OR THE FIRST PROGRESSIVELY TOUGHER. CAN YOU OUTSMART THE COMPUTER AND CLAIM VICTORY? LET\'S FIND OUT!',
            image: aiGame
        },
        {
            id: 'local',
            title: 'LOCAL GAME',
            description: 'IN LOCAL GAME, YOU CAN CHALLENGE YOUR FRIENDS IN LOCAL MULTIPLAYER PING-PONG MATCHES. GRAB A FRIEND, TAKE TURNS AND COMPETE IN 3 EXCITING ROUNDS TO SEE WHO\'S THE ULTIMATE CHAMPION. IT\'S ALL ABOUT SKILL AND FUN. PLAY TOGETHER.',
            image: localGame
        },
        {
            id: 'online',
            title: 'ONLINE GAME',
            description: 'IN THIS ONLINE PING-PONG GAME, YOU\'LL BE MATCHED WITH A RANDOM PLAYER FOR A COMPETITIVE MATCH. THE GAME CONSIST OF 3 ROUNDS AND THE PLAYER WHO WINS THE MOST DURING VICTORY. READY FOR A FUN CHALLENGE? LET\'S PLAY!',
            image: onlineGame
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
                    <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-2 tracking-wider">GAME DASHBOARD</h1>
                    <div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto"></div>
                </div>
                </div>

        <!-- Game Mode Cards - Centered Layout -->
            <div class="flex-1 px-8 pb-8">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
                ${this.renderGameModeCards()}
            </div>
            </div>
        </main>
        `;
        this.container.appendChild(dashboardContent);
        this.setupEventListeners();
        await super.setupSidebarListeners();
        return this.container;
  }

private renderGameModeCards(): string {
    return this.gameModes.map((mode, index) => {
      return `
        <div class="cyber-panel cursor-pointer transition-all duration-300 hover:scale-105 corner-brackets relative group" data-mode-id="${mode.id}">
          <div class="p-6 h-full flex flex-col">
            <!-- Game Mode Visualization -->
            <div class="relative mb-6 h-64 rounded border border-neon-pink/30 overflow-hidden">
              
            <!-- Image Background -->
              <img src="${mode.image}" alt="${mode.title}" class="absolute inset-0 w-full h-full object-cover opacity-90" />
              
            <!-- Glow effects -->
              <div class="absolute inset-0 bg-gradient-to-t from-neon-pink/10 via-transparent to-neon-cyan/10 pointer-events-none"></div>
              
              <!-- Corner brackets -->
              <div class="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-neon-pink/60"></div>
              <div class="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-neon-cyan/60"></div>
              <div class="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-neon-cyan/60"></div>
              <div class="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-neon-pink/60"></div>
            </div>

            <!-- Game Mode Info -->
            <div class="flex-1 flex flex-col">
              <h3 class="text-xl font-cyber font-bold text-neon-cyan mb-4 tracking-wider">${mode.title}</h3>
              <p class="text-sm text-gray-300 leading-relaxed mb-6 font-tech flex-1">
                ${mode.description}
              </p>

              <!-- Start Button -->
              <a href="/game/${mode.id}" class="mt-auto">
                <button 
                  class="w-full bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-bold text-lg px-12 py-3 
                        border border-neon-pink hover:shadow-lg hover:shadow-neon-pink/50
                        transition-all duration-300 animate-scale-in font-cyber tracking-wider
                        before:absolute before:inset-0 before:bg-gradient-to-r before:from-neon-pink/20 before:to-neon-cyan/20
                        before:opacity-0 hover:before:opacity-100 before:transition-opacity 
                       relative overflow-hidden group start-game-btn"
                  data-game-mode="${mode.id}"
                >
                  <span class="relative z-10">START</span>
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

export default DashboardPage;