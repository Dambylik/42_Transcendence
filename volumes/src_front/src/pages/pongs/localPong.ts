import BasePongPage from '../../core/templates/basePongPage';
import { Router } from '../../../router/Router.ts';
import { showNotification } from '../../utils/notifications';
import { createCanvasWrapper, createControlsDiv } from '../../core/components/pong/pongFormUtils.ts';
import { createGameRules, createEndGameScreen } from '../../core/components/pong/pongUtils.ts';


class LocalPongPage extends BasePongPage {
	static readonly TextObject = {
		MainTitle: 'LOCAL PONG',
		Subtitle: 'CHALLENGE YOUR FRIEND',
		EnterNames: 'ENTER PLAYER NAMES',
		ChooseChallengers: 'CHOOSE YOUR CHALLENGERS',
		StartGame: 'START GAME',
		ReturnHome: 'RETURN HOME',
		Controls: 'PLAYER 1: W/S KEYS | PLAYER 2: UP/DOWN ARROWS'
	};

	private gameEndedNaturally: boolean = false;
	
	constructor(id: string = 'local-pong', router?: Router) {
		super(id, router);
	}

	async render(): Promise<HTMLElement> {
		this.container.innerHTML = '';
		await super.setupHeaderListeners();
		this.setupKeyHandlers();
		const sidebarHtml = await this.createSidebar();

		const localPongContent = document.createElement('div');
		localPongContent.className = 'min-h-screen pt-16 relative overflow-hidden flex flex-row bg-cyber-dark';
		
		localPongContent.innerHTML = `
			${sidebarHtml}
			
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
					<h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-4 tracking-wider">${LocalPongPage.TextObject.MainTitle}</h1>
					<div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto mb-4"></div>
					<p class="text-neon-cyan font-cyber text-xl">${LocalPongPage.TextObject.Subtitle}</p>
				</div>

				<!-- Game Mode Selection -->
				<div id="mode-selection" class="relative z-10 flex-1 px-8 pb-8">
					<div class="max-w-4xl mx-auto">
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<!-- Local Game Section -->
							<div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-neon-cyan/40 shadow-lg shadow-neon-cyan/20">
								<h2 class="text-3xl font-cyber text-neon-cyan mb-6 text-center">LOCAL GAME</h2>
								<div class="space-y-4">
									<div>
										<label class="block text-neon-cyan font-tech text-sm mb-2">Player 1 Name</label>
										<input type="text" id="player1" class="w-full bg-cyber-dark border-2 border-neon-cyan/30 text-white px-4 py-3 rounded font-tech" placeholder="Enter Player 1 name" required>
									</div>
									<div>
										<label class="block text-neon-cyan font-tech text-sm mb-2">Player 2 Name</label>
										<input type="text" id="player2" class="w-full bg-cyber-dark border-2 border-neon-cyan/30 text-white px-4 py-3 rounded font-tech" placeholder="Enter Player 2 name" required>
									</div>
									<div class="text-center text-gray-300 font-tech text-sm mb-4">
										${LocalPongPage.TextObject.Controls}
									</div>
									<button id="start-local-game" class="w-full bg-gradient-to-r from-neon-cyan to-neon-pink text-white font-cyber px-6 py-3 rounded-lg text-xl hover:shadow-lg hover:shadow-neon-cyan/50 transition-all duration-300">${LocalPongPage.TextObject.StartGame}</button>
								</div>
							</div>

							<!-- Local Tournament Section -->
							<div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-neon-pink/40 shadow-lg shadow-neon-pink/20">
								<h2 class="text-3xl font-cyber text-neon-pink mb-6 text-center">LOCAL TOURNAMENT</h2>
								<div class="space-y-4">
									<div class="text-center mb-6">
										<div class="text-6xl mb-4">🏆</div>
										<p class="text-white font-tech text-lg mb-4">Compete in a local tournament!</p>
									</div>
									<button id="start-tournament" class="w-full bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-6 py-3 rounded-lg text-xl hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300">START TOURNAMENT</button>
								</div>
								<div class="mt-4 pt-4 border-t border-neon-pink/20">
									<button id="return-dashboard" class="w-full bg-cyber-dark border-2 border-gray-500/50 text-gray-400 font-cyber px-6 py-2 rounded hover:border-gray-500 hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300">${LocalPongPage.TextObject.ReturnHome}</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Game Container (hidden by default) -->
				<div id="pong-container" class="hidden relative z-10 flex-1 px-8 pb-8">
					<div class="max-w-5xl mx-auto cyber-border relative w-full flex flex-col items-center"></div>
				</div>
			</main>
		`;
		
		this.container.appendChild(localPongContent);
		this.setupEventListeners();
		await super.setupSidebarListeners();
		
		return this.container;
	}

	private setupEventListeners(): void {
		// Start local game button
		const startLocalGameBtn = this.container.querySelector('#start-local-game');
		startLocalGameBtn?.addEventListener('click', () => this.handleLocalGameStart());

		// Start tournament button
		const startTournamentBtn = this.container.querySelector('#start-tournament');
		startTournamentBtn?.addEventListener('click', () => {
			this.router?.navigate('/game/localTournament');
		});

		// Return to dashboard button
		const returnDashboardBtn = this.container.querySelector('#return-dashboard');
		returnDashboardBtn?.addEventListener('click', () => {
			this.router?.navigate('/dashboard');
		});
	}

	private handleLocalGameStart(): void {
		const player1Input = this.container.querySelector<HTMLInputElement>('#player1');
		const player2Input = this.container.querySelector<HTMLInputElement>('#player2');

		if (!player1Input?.value.trim() || !player2Input?.value.trim()) {
			showNotification('Please enter both player names!', 'error');
			return;
		}

		const player1 = player1Input.value.trim();
		const player2 = player2Input.value.trim();
		
		this.startGame(player1, player2);
	}

	private showModeSelection(): void {
		if (this.pongComponent) {
			this.pongComponent = null;
		}

		const pongContainer = this.container.querySelector('#pong-container');
		const modeSelection = this.container.querySelector('#mode-selection');

		if (pongContainer && modeSelection) {
			pongContainer.classList.add('animate-fade-out');
			setTimeout(() => {
				pongContainer.classList.add('hidden');
				const pongInner = pongContainer.querySelector('div');
				if (pongInner) pongInner.innerHTML = '';
				modeSelection.classList.remove('hidden');
				modeSelection.classList.add('animate-scale-in');
				
				// Clear input fields
				const player1Input = this.container.querySelector<HTMLInputElement>('#player1');
				const player2Input = this.container.querySelector<HTMLInputElement>('#player2');
				if (player1Input) player1Input.value = '';
				if (player2Input) player2Input.value = '';
			}, 300);
		}
	}

	private handleGameEnd(winner: string, player1: string, player2: string): void {
		if (!this.gameEndedNaturally) {
			return;
		}

		const pongContainer = this.container.querySelector('#pong-container > div');
		if (!pongContainer) return;

		const endGameScreen = createEndGameScreen(
			winner,
			() => {
				pongContainer.removeChild(endGameScreen);
				this.initializeGame(player1, player2);
			},
			() => {
				pongContainer.removeChild(endGameScreen);
				this.showModeSelection();
			}
		);
		
		pongContainer.appendChild(endGameScreen);
	}

	private startGame(player1: string, player2: string): void {
		const modeSelection = this.container.querySelector('#mode-selection');
		const pongContainer = this.container.querySelector('#pong-container');
		
		if (modeSelection && pongContainer) {
			modeSelection.classList.add('animate-fade-out');
			setTimeout(() => {
				modeSelection.classList.add('hidden');
				pongContainer.classList.remove('hidden');
				pongContainer.classList.add('animate-scale-in');
				this.initializeGame(player1, player2);
			}, 300);
		} else {
			this.initializeGame(player1, player2);
		}
	}

	private async initializeGame(player1: string, player2: string): Promise<void> {
		const pongContainer = this.container.querySelector('#pong-container > div');
		if (!pongContainer) return;

		pongContainer.innerHTML = '';

		// Add level indicator for local mode
		const levelIndicator = document.createElement('div');
		levelIndicator.className = 'mb-4 text-center animate-scale-in w-full';
		
		const levelTitle = document.createElement('h2');
		levelTitle.className = 'text-2xl font-cyber text-neon-pink mb-1';
		levelTitle.innerHTML = `MODE: <span class="text-neon-cyan">LOCAL MULTIPLAYER</span>`;
		
		const divider = document.createElement('div');
		divider.className = 'h-0.5 w-24 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto my-2';
		
		const controlsInfo = document.createElement('p');
		controlsInfo.className = 'text-gray-300 font-tech text-sm mt-2';
		controlsInfo.textContent = LocalPongPage.TextObject.Controls;
		
		levelIndicator.appendChild(levelTitle);
		levelIndicator.appendChild(divider);
		levelIndicator.appendChild(controlsInfo);
		pongContainer.appendChild(levelIndicator);

		// Add game rules
		const gameRules = createGameRules('local');
		pongContainer.appendChild(gameRules);

		const { wrapper: canvasWrapper, inner: canvasInner } = createCanvasWrapper();

		// Reset game end flag
		this.gameEndedNaturally = false;

		// Dynamic import to reduce bundle size
		const { default: PongComponent } = await import('../../core/components/pong/pong');

		this.pongComponent = new PongComponent(player1, player2, {
			onGameEnd: (winner: string) => {
				this.gameEndedNaturally = true;
				this.handleGameEnd(winner, player1, player2);
			}
		});
		if (this.pongComponent) {
			canvasInner.appendChild(this.pongComponent.render());
		}
		
		canvasWrapper.appendChild(canvasInner);
		pongContainer.appendChild(canvasWrapper);
		
		const controlButtons = [
			{
				id: 'restart-btn',
				text: 'RESTART',
				type: 'primary' as const,
				onClick: () => this.initializeGame(player1, player2)
			}
		];
		
		const controlsDiv = createControlsDiv(controlButtons);
		pongContainer.appendChild(controlsDiv);
	}


}

export default LocalPongPage;