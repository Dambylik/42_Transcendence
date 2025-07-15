// Dynamic import to reduce bundle size
// import Connect4Component from '../../core/components/connect4/connect4.ts';
import Page from '../../core/templates/page';
import connect4ai from '../../assets/connect4ai.png';
import { Router } from '../../../router/Router';
import { createSelectionCard, createSelectionGrid } from '../../core/components/pong/pongLayout.ts';
import { createCanvasWrapper, createControlsDiv, createSubtitle } from '../../core/components/pong/pongFormUtils.ts';
import { createPageHeader, createBackgroundLayers, createAnimatedContainer, createLevelIndicator, createGameRules } from '../../core/components/pong/pongUtils.ts';

class AiConnect4Page extends Page {
    private connect4Component: any | null = null; // Use any to avoid static import
    
    private aiChoices: Array<{
        id: string;
        label: string;
        desc: string;
    }>;

    constructor(id: string = 'ai-connect4', router?: Router) {
        super(id, router);
        
        this.aiChoices = [
        { 
            id: 'easy', 
            label: 'BEGINNER AI', 
            desc: 'PERFECT FOR BEGINNERS! FACE A GENTLE OPPONENT THAT MAKES RANDOM MOVES AND GIVES YOU PLENTY OF OPPORTUNITIES TO CONNECT FOUR. BUILD YOUR CONFIDENCE AND MASTER THE BASICS OF CONNECT 4 STRATEGY.'
        },
        { 
            id: 'medium', 
            label: 'CHALLENGER AI', 
            desc: 'A BALANCED CHALLENGE FOR INTERMEDIATE PLAYERS. THIS AI LOOKS AHEAD ONE MOVE AND TRIES TO BLOCK YOUR WINNING ATTEMPTS. TEST YOUR TACTICAL THINKING IN THIS COMPETITIVE MODE.'
        },
        { 
            id: 'hard', 
            label: 'EXPERT AI', 
            desc: 'FOR SEASONED PLAYERS ONLY! THIS FORMIDABLE OPPONENT ANALYZES MULTIPLE MOVES AHEAD AND SETS UP COMPLEX TRAPS. OUTSMART THE ALGORITHM WITH CLEVER POSITIONING AND STRATEGIC THINKING.'
        },
        { 
            id: 'nightmare', 
            label: 'NIGHTMARE AI', 
            desc: 'THE ULTIMATE TEST OF STRATEGIC MASTERY. FACE THE PERFECT MACHINE WITH DEEP ANALYSIS AND FLAWLESS EXECUTION. CAN YOU FIND THE ONE WEAKNESS IN THIS SEEMINGLY UNBEATABLE OPPONENT? ONLY LEGENDS HAVE SUCCEEDED.'
        }
        ];
    }

    async render(): Promise<HTMLElement> {
        this.container.innerHTML = '';
        await super.setupHeaderListeners();
        
        const sidebarHtml = await super.createSidebar();

        const aiConnect4Content = document.createElement('div');
        aiConnect4Content.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark';
        
        const backgroundLayers = createBackgroundLayers(connect4ai, 'AI Connect4 Background');
        const pageHeader = createPageHeader('CONNECT 4 VS IA', 'CHALLENGE THE MACHINE');
        
        aiConnect4Content.innerHTML = sidebarHtml;
        
        const main = document.createElement('main');
        main.className = 'flex-1 flex flex-col';
        main.appendChild(backgroundLayers);
        main.appendChild(pageHeader);
        
        const contentArea = document.createElement('div');
        contentArea.className = 'flex-1 px-8 pb-8 pt-4 relative z-10 flex flex-col items-center';
        contentArea.innerHTML = `
            <div id="ai-choice-container" class="max-w-5xl mx-auto w-full"></div>
            <div id="connect4-container" class="mt-4 max-w-5xl mx-auto cyber-border relative w-full flex flex-col items-center"></div>
        `;
        
        main.appendChild(contentArea);
        aiConnect4Content.appendChild(main);
        this.container.appendChild(aiConnect4Content);
        this.renderAiChoiceCards();
        await super.setupSidebarListeners();
        
        return this.container;
    }
  
    private renderAiChoiceCards(): void {
        console.log('renderAiChoiceCards called'); // Debug
        
        const aiChoiceContainer = this.container.querySelector('#ai-choice-container');
        console.log('aiChoiceContainer in render:', !!aiChoiceContainer); // Debug
        
        if (!aiChoiceContainer) {
            console.error('aiChoiceContainer not found in renderAiChoiceCards!');
            return;
        }
        
        // Debug: Check container styles
        console.log('aiChoiceContainer styles:', {
            display: getComputedStyle(aiChoiceContainer).display,
            visibility: getComputedStyle(aiChoiceContainer).visibility,
            opacity: getComputedStyle(aiChoiceContainer).opacity,
            height: getComputedStyle(aiChoiceContainer).height,
            width: getComputedStyle(aiChoiceContainer).width
        });
        
        const aiChoiceDiv = createAnimatedContainer('flex flex-col items-center justify-center gap-8');
        const subtitle = createSubtitle('CHOOSE YOUR OPPONENT');
        
        const cards = this.aiChoices.map(ai => 
            createSelectionCard(ai.label, ai.desc, ai.id, () => this.startGame(ai.id))
        );
        
        console.log('Created cards:', cards.length); // Debug
        console.log('Card elements:', cards.map(card => ({ tagName: card.tagName, className: card.className })));
        
        const cardGrid = createSelectionGrid(cards);
        
        aiChoiceDiv.appendChild(subtitle);
        aiChoiceDiv.appendChild(cardGrid);
        aiChoiceContainer.innerHTML = '';
        aiChoiceContainer.appendChild(aiChoiceDiv);
        
        // Force visibility and display - remove any animation classes and reset styles
        const containerElement = aiChoiceContainer as HTMLElement;
        containerElement.classList.remove('animate-fade-out', 'hidden');
        containerElement.style.display = 'block';
        containerElement.style.visibility = 'visible';
        containerElement.style.opacity = '1';
        containerElement.style.height = 'auto';
        containerElement.style.overflow = 'visible';
        
        // Debug: Check final structure
        console.log('Final aiChoiceContainer children count:', aiChoiceContainer.children.length);
        console.log('aiChoiceDiv children count:', aiChoiceDiv.children.length);
        console.log('cardGrid children count:', cardGrid.children.length);
        
        console.log('AI choice cards rendered successfully'); // Debug
    }

    private startGame(aiType: string) {
        const aiChoiceContainer = this.container.querySelector('#ai-choice-container');
        if (aiChoiceContainer) {
            aiChoiceContainer.classList.add('animate-fade-out');
            setTimeout(() => {
                if (aiChoiceContainer) aiChoiceContainer.innerHTML = '';
                this.initializeGame(aiType);
            }, 300);
        } else {
            this.initializeGame(aiType);
        }
    }
  
    private async initializeGame(aiType: string) {
        const connect4Container = this.container.querySelector('#connect4-container');
        if (connect4Container) connect4Container.innerHTML = '';
        
        const levelIndicator = createLevelIndicator(aiType);
        if (connect4Container) connect4Container.appendChild(levelIndicator);
        
        const gameRules = createGameRules('connect4');
        if (connect4Container) connect4Container.appendChild(gameRules);
        
        const player1 = 'YOU';
        const player2 = aiType.toUpperCase() + ' AI';

        // Dynamic import to reduce bundle size
        const { default: Connect4Component } = await import('../../core/components/connect4/connect4');
        
        this.connect4Component = new Connect4Component(player1, player2, { 
            aiType,
            onGameEnd: (winner: string) => this.handleGameEnd(winner)
        });
        
        const { wrapper: canvasWrapper, inner: canvasInner } = createCanvasWrapper();
        
        if (this.connect4Component) {
            canvasInner.appendChild(this.connect4Component.render());
        }
        
        if (connect4Container) {
            connect4Container.appendChild(canvasWrapper);
        }

        const controlButtons = [
            {
                id: 'restart-btn',
                text: 'RESTART',
                type: 'primary' as const,
                onClick: () => this.initializeGame(aiType)
            },
            {
                id: 'change-level-btn',
                text: 'CHANGE LEVEL',
                type: 'secondary' as const,
                onClick: () => this.showAiChoices()
            },
            {
                id: 'dashboard-btn',
                text: 'BACK TO DASHBOARD',
                type: 'secondary' as const,
                onClick: () => this.goToDashboard()
            }
        ];
        
        const controlsDiv = createControlsDiv(controlButtons);
        if (connect4Container) {
            connect4Container.appendChild(controlsDiv);
        }
    }

    private handleGameEnd(winner: string): void {
        console.log(`Connect4 AI game ended, winner: ${winner}`);
        // Optionnel: afficher un écran de fin de partie
    }
  
    private showAiChoices() {
        console.log('showAiChoices called'); // Debug
        
        // Clean up existing Connect4 component
        if (this.connect4Component) {
            console.log('Destroying existing connect4Component'); // Debug
            this.connect4Component.destroy();
            this.connect4Component = null;
        }
        
        const connect4Container = this.container.querySelector('#connect4-container');
        if (connect4Container) {
            console.log('Clearing connect4Container'); // Debug
            connect4Container.innerHTML = '';
        }
        
        const aiChoiceContainer = this.container.querySelector('#ai-choice-container');
        console.log('aiChoiceContainer found:', !!aiChoiceContainer); // Debug
        
        if (aiChoiceContainer) {
            console.log('Clearing and recreating AI choice cards'); // Debug
            aiChoiceContainer.innerHTML = '';
            
            // Add a small delay to ensure DOM is ready
            setTimeout(() => {
                this.renderAiChoiceCards();
            }, 50);
        } else {
            console.error('aiChoiceContainer not found!'); // Debug
        }
    }

    private goToDashboard() {
        if (this.router) {
            this.router.navigate('/game/connect4_dashboard');
        } else {
            window.location.href = '/game/connect4_dashboard';
        }
    }
}

export default AiConnect4Page;
