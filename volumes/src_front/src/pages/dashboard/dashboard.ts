import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import aiGame from '../../assets/ai_game.png';
import localGame from '../../assets/local_game.png';
import onlineGame from '../../assets/online_game.png';
import connect4 from '../../assets/connect4.png';


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
        },
        {
            id: 'connect4_dashboard',
            title: 'CONNECT 4',
            description: 'CHALLENGE YOUR STRATEGIC THINKING IN THIS CLASSIC CONNECT 4 GAME! DROP YOUR COLORED DISCS AND BE THE FIRST TO CONNECT FOUR IN A ROW - HORIZONTALLY, VERTICALLY, OR DIAGONALLY. OUTSMART YOUR OPPONENT AND CLAIM VICTORY IN THIS TIMELESS STRATEGY GAME!',
            image: connect4
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
            <!-- Pong Games Section -->
            <div class="mb-12">
                <div class="flex items-center mb-6">
                    <div class="h-px bg-gradient-to-r from-transparent via-neon-pink to-transparent flex-1"></div>
                    <h2 class="text-2xl font-cyber text-neon-pink mx-6 tracking-wider">PONG GAMES</h2>
                    <div class="h-px bg-gradient-to-r from-transparent via-neon-pink to-transparent flex-1"></div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    ${this.renderPongGameCards()}
                </div>
            </div>
            
            <!-- Strategy Games Section -->
            <div class="mb-12">
                <div class="flex items-center mb-6">
                    <div class="h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent flex-1"></div>
                    <h2 class="text-2xl font-cyber text-neon-cyan mx-6 tracking-wider">STRATEGY GAMES</h2>
                    <div class="h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent flex-1"></div>
                </div>
                <div class="grid grid-cols-1 gap-8 max-w-md mx-auto">
                    ${this.renderStrategyGameCards()}
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

private renderPongGameCards(): string {
    const pongGames = this.gameModes.filter(mode => ['ai', 'local', 'online'].includes(mode.id));
    return pongGames.map((mode, index) => {
      const borderColors = {
        'ai': 'border-purple-500/50',
        'local': 'border-green-500/50',
        'online': 'border-blue-500/50'
      };
      
      const glowColors = {
        'ai': 'hover:shadow-purple-500/50',
        'local': 'hover:shadow-green-500/50',
        'online': 'hover:shadow-blue-500/50'
      };

      return `
        <div class="cyber-panel cursor-pointer transition-all duration-300 hover:scale-105 corner-brackets relative group ${borderColors[mode.id as keyof typeof borderColors]}" data-mode-id="${mode.id}">
          <div class="p-6 h-full flex flex-col">
            <!-- Game Mode Visualization -->
            <div class="relative mb-6 h-64 rounded border border-neon-pink/30 overflow-hidden">
              
            <!-- Image Background -->
              <img src="${mode.image}" alt="${mode.title}" class="absolute inset-0 w-full h-full object-cover opacity-90" />
              
            <!-- Pong-specific glow effects -->
              <div class="absolute inset-0 bg-gradient-to-t from-neon-pink/10 via-transparent to-neon-cyan/10 pointer-events-none"></div>
              
              <!-- Corner brackets with game-specific colors -->
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
                        border border-neon-pink hover:shadow-lg ${glowColors[mode.id as keyof typeof glowColors]}
                        transition-all duration-300 animate-scale-in font-cyber tracking-wider
                        before:absolute before:inset-0 before:bg-gradient-to-r before:from-neon-pink/20 before:to-neon-cyan/20
                        before:opacity-0 hover:before:opacity-100 before:transition-opacity 
                       relative overflow-hidden group start-game-btn"
                  data-game-mode="${mode.id}"
                >
                  <span class="relative z-10">START PONG</span>
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </button>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

private renderStrategyGameCards(): string {
    const strategyGames = this.gameModes.filter(mode => mode.id === 'connect4_dashboard');
    return strategyGames.map((mode, index) => {
      return `
        <div class="cyber-panel cursor-pointer transition-all duration-300 hover:scale-105 corner-brackets relative group border-amber-500/50 max-w-md mx-auto" data-mode-id="${mode.id}">
          <div class="p-8 h-full flex flex-col">
            <!-- Game Mode Visualization -->
            <div class="relative mb-6 h-80 rounded border border-amber-500/40 overflow-hidden">
              
            <!-- Image Background -->
              <img src="${mode.image}" alt="${mode.title}" class="absolute inset-0 w-full h-full object-cover opacity-90" />
              
            <!-- Strategy game specific glow effects -->
              <div class="absolute inset-0 bg-gradient-to-t from-amber-600/15 via-transparent to-orange-500/15 pointer-events-none"></div>
              
              <!-- Corner brackets with strategy game colors -->
              <div class="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-amber-400/80"></div>
              <div class="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-orange-400/80"></div>
              <div class="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-orange-400/80"></div>
              <div class="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-amber-400/80"></div>
              
              <!-- Strategy game badge -->
              <div class="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full border border-amber-400/50">
                STRATEGY GAME
              </div>
            </div>

            <!-- Game Mode Info -->
            <div class="flex-1 flex flex-col">
              <h3 class="text-2xl font-cyber font-bold text-amber-400 mb-4 tracking-wider text-center">${mode.title}</h3>
              <p class="text-sm text-gray-300 leading-relaxed mb-6 font-tech flex-1 text-center">
                ${mode.description}
              </p>

              <!-- Start Button -->
              <a href="/game/${mode.id}" class="mt-auto">
                <button 
                  class="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-lg px-12 py-4 
                        border border-amber-500 hover:shadow-lg hover:shadow-amber-500/50
                        transition-all duration-300 animate-scale-in font-cyber tracking-wider
                        before:absolute before:inset-0 before:bg-gradient-to-r before:from-amber-600/20 before:to-orange-600/20
                        before:opacity-0 hover:before:opacity-100 before:transition-opacity 
                       relative overflow-hidden group start-game-btn rounded-lg"
                  data-game-mode="${mode.id}"
                >
                  <span class="relative z-10">START STRATEGY</span>
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