import BasePongPage from '../../core/templates/basePongPage';
import { Router } from '../../../router/Router.ts';
import localGame from '../../assets/local_game.png';
import PongComponent from '../../core/components/pong/pong.ts';
import { showNotification } from '../../utils/notifications';
import { createFormContainer, createCanvasWrapper, createControlsDiv, createGameInfoDiv } from '../../core/components/pong/pongFormUtils.ts';
import { createCyberButton, createPageHeader, createBackgroundLayers, createFormFieldGroup } from '../../core/components/pong/pongUtils.ts';


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
	
	constructor(id: string = 'local-pong', router?: Router) {
		super(id, router);
	}

	async render(): Promise<HTMLElement> {
		this.container.innerHTML = '';
		await super.setupHeaderListeners();
		this.setupKeyHandlers();
		const sidebarHtml = await this.createSidebar();

		const pageContent = document.createElement('div');
		pageContent.className = 'min-h-screen pt-6 relative overflow-hidden flex flex-row bg-cyber-dark';
		
		const backgroundLayers = createBackgroundLayers(localGame, 'Local Pong Background');
		const pageHeader = createPageHeader(LocalPongPage.TextObject.MainTitle, LocalPongPage.TextObject.Subtitle);
		
		pageContent.innerHTML = sidebarHtml;
		
		const main = document.createElement('main');
		main.className = 'flex-1 flex flex-col';
		main.appendChild(backgroundLayers);
		main.appendChild(pageHeader);
		
		const contentArea = document.createElement('div');
		contentArea.className = 'flex-1 px-8 pb-8 pt-4 relative z-10 flex flex-col items-center';
		contentArea.innerHTML = `
			<p class="text-gray-300 font-tech text-sm mb-8 text-center">${LocalPongPage.TextObject.ChooseChallengers}</p>
			<div id="username-form" class="max-w-2xl mx-auto w-full animate-scale-in">
				${this.createPlayerNameForm()}
			</div>
			<div id="pong-container" class="mt-4 max-w-5xl mx-auto cyber-border relative w-full flex-col items-center hidden"></div>
		`;
		
		main.appendChild(contentArea);
		pageContent.appendChild(main);
		
		this.container.appendChild(pageContent);
		this.setupEventListeners();
		await super.setupSidebarListeners();
		return this.container;
	}
	
	private createPlayerNameForm(): string {
		const formContainer = createFormContainer({
			title: LocalPongPage.TextObject.EnterNames,
			centered: true
		});
		
		const fieldsGroup = createFormFieldGroup({
			fields: [
				{
					id: 'player1',
					placeholder: 'PLAYER 1 USERNAME',
					colorTheme: 'pink',
					required: true
				},
				{
					id: 'player2', 
					placeholder: 'PLAYER 2 USERNAME',
					colorTheme: 'cyan',
					required: true
				}
			]
		});
		
		const form = document.createElement('form');
		form.className = 'flex flex-col gap-6 max-w-md mx-auto';
		
		const buttonGroup = document.createElement('div');
		buttonGroup.className = 'flex flex-col gap-4';
		
		const startButton = createCyberButton({
			text: LocalPongPage.TextObject.StartGame,
			type: 'gradient',
			fullWidth: true
		});
		(startButton as HTMLButtonElement).type = 'submit';
		
		const returnButton = createCyberButton({
			text: LocalPongPage.TextObject.ReturnHome,
			type: 'secondary', 
			fullWidth: true,
			id: 'return-home'
		});
		
		const returnLink = document.createElement('a');
		returnLink.href = '/dashboard';
		returnLink.setAttribute('data-route', '/dashboard');
		returnLink.className = 'relative z-10';
		returnLink.textContent = LocalPongPage.TextObject.ReturnHome;
		returnButton.innerHTML = '';
		returnButton.appendChild(returnLink);
		
		buttonGroup.appendChild(startButton);
		buttonGroup.appendChild(returnButton);
		
		form.appendChild(fieldsGroup);
		form.appendChild(buttonGroup);
		formContainer.appendChild(form);
		
		return formContainer.outerHTML;
	}

	private setupEventListeners(): void {
		const form = this.container.querySelector('#username-form form') as HTMLFormElement;
		form.addEventListener('submit', (e) => this.handleGameStart(e));
	}

	private handleGameStart(e: Event): void {
		e.preventDefault();
		
		const player1Input = this.container.querySelector<HTMLInputElement>('#player1');
    	const player2Input = this.container.querySelector<HTMLInputElement>('#player2');

    	if (!player1Input?.value.trim() || !player2Input?.value.trim()) {
      		showNotification('Please enter both usernames!', 'error');
      		return;
    	}

		const player1 = player1Input.value.trim();
		const player2 = player2Input.value.trim();
		const formContainer = this.container.querySelector('#username-form');
		const pongContainer = this.container.querySelector('#pong-container');

		if (formContainer && pongContainer) {
			formContainer.classList.add('animate-fade-out');
			setTimeout(() => {
				formContainer.classList.add('hidden');
				this.initializeGame(player1, player2);
			}, 300);
		}
  	}

	private initializeGame(player1: string, player2: string): void {
		const pongContainer = this.container.querySelector('#pong-container');
		if (!pongContainer) return;

		pongContainer.innerHTML = '';
		pongContainer.classList.remove('hidden');
		pongContainer.classList.add('animate-scale-in');

		const gameInfoDiv = createGameInfoDiv(player1, player2, LocalPongPage.TextObject.Controls);
		pongContainer.appendChild(gameInfoDiv);

		const { wrapper: canvasWrapper, inner: canvasInner } = createCanvasWrapper();

		this.pongComponent = new PongComponent(player1, player2);
		if (this.pongComponent) {
			canvasInner.appendChild(this.pongComponent.render());
		}
		
		pongContainer.appendChild(canvasWrapper);
		
		const controlButtons = [
			{
				id: 'restart-btn',
				text: 'RESTART',
				type: 'primary' as const,
				onClick: () => this.initializeGame(player1, player2)
			},
			{
				id: 'new-players-btn',
				text: 'NEW PLAYERS',
				type: 'secondary' as const,
				onClick: () => this.showPlayerForm()
			}
		];
		
		const controlsDiv = createControlsDiv(controlButtons);
		pongContainer.appendChild(controlsDiv);
	}

	private showPlayerForm(): void {
		if (this.pongComponent) {
			this.pongComponent = null;
		}

		const pongContainer = this.container.querySelector('#pong-container');
		const formContainer = this.container.querySelector('#username-form');

		if (pongContainer && formContainer) {
			pongContainer.classList.add('animate-fade-out');
			setTimeout(() => {
				pongContainer.classList.add('hidden');
				pongContainer.innerHTML = '';
				formContainer.classList.remove('hidden');
				formContainer.classList.add('animate-scale-in');
			}, 300);
		}
	}
}

export default LocalPongPage;

