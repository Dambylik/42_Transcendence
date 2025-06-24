import PongComponent from '../../core/components/pong/pong.ts';
import BasePongPage from '../../core/templates/basePongPage';
import localGame from '../../assets/local_game.png';
import { Router } from '../../../router/Router';
import { createSelectionCard, createSelectionGrid } from '../../core/components/pong/pongLayout.ts';
import { createCanvasWrapper, createControlsDiv, createSubtitle } from '../../core/components/pong/pongFormUtils.ts';
import { createPageHeader, createBackgroundLayers, createAnimatedContainer, createLevelIndicator} from '../../core/components/pong/pongUtils.ts';


class AiPongPage extends BasePongPage {
    private aiType: string = '';
    private aiIntervalId: number | null = null;
    
    private aiChoices: Array<{
        id: string;
        label: string;
        desc: string;
    }>;

    constructor(id: string = 'ai-pong', router?: Router) {
        super(id, router);
        this.container = document.createElement('div');
        
        this.aiChoices = [
        { 
            id: 'easy', 
            label: 'BEGINNER AI', 
            desc: 'PERFECT FOR BEGINNERS! FACE A FORGIVING OPPONENT THAT GIVES YOU TIME TO REACT AND PLENTY OF OPPORTUNITIES TO SCORE. BUILD YOUR CONFIDENCE AND MASTER THE BASICS OF PONG IN THIS RELAXED MODE.'
        },
        { 
            id: 'medium', 
            label: 'CHALLENGER AI', 
            desc: 'A BALANCED CHALLENGE FOR INTERMEDIATE PLAYERS. THIS AI REACTS FASTER AND MAKES FEWER MISTAKES. TEST YOUR REFLEXES AND STRATEGY IN THIS COMPETITIVE MODE THAT REWARDS SKILL AND FOCUS.'
        },
        { 
            id: 'hard', 
            label: 'EXPERT AI', 
            desc: 'FOR SEASONED PLAYERS ONLY! THIS FORMIDABLE OPPONENT FEATURES LIGHTNING-FAST REACTIONS AND PRECISION TARGETING. OUTSMART THE ALGORITHM WITH UNPREDICTABLE PLAYS AND PERFECT TIMING TO CLAIM VICTORY.'
        },
        { 
            id: 'impossible', 
            label: 'NIGHTMARE AI', 
            desc: 'THE ULTIMATE TEST OF SKILL AND ENDURANCE. FACE THE PERFECT MACHINE WITH SUPERHUMAN REFLEXES AND FLAWLESS PREDICTION. CAN YOU FIND THE ONE WEAKNESS IN THIS SEEMINGLY UNBEATABLE OPPONENT? ONLY LEGENDS HAVE SUCCEEDED.'
        }
        ];
    }

    async render(): Promise<HTMLElement> {
        this.container.innerHTML = '';
        await super.setupHeaderListeners();
        this.setupKeyHandlers();
        const sidebarHtml = await this.createSidebar();

        const aiPongContent = document.createElement('div');
        aiPongContent.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark';
        
        const backgroundLayers = createBackgroundLayers(localGame, 'AI Pong Background');
        const pageHeader = createPageHeader('PONG VS IA', 'CHALLENGE THE MACHINE');
        
        aiPongContent.innerHTML = sidebarHtml;
        
        const main = document.createElement('main');
        main.className = 'flex-1 flex flex-col';
        main.appendChild(backgroundLayers);
        main.appendChild(pageHeader);
        
        const contentArea = document.createElement('div');
        contentArea.className = 'flex-1 px-8 pb-8 pt-4 relative z-10 flex flex-col items-center';
        contentArea.innerHTML = `
            <div id="ai-choice-container" class="max-w-5xl mx-auto w-full"></div>
            <div id="pong-container" class="mt-4 max-w-5xl mx-auto cyber-border relative w-full flex flex-col items-center"></div>
        `;
        
        main.appendChild(contentArea);
        aiPongContent.appendChild(main);
        this.container.appendChild(aiPongContent);
        this.renderAiChoiceCards();
        await super.setupSidebarListeners();
        
        return this.container;
    }
  
    private renderAiChoiceCards(): void {
        const aiChoiceContainer = this.container.querySelector('#ai-choice-container');
        if (!aiChoiceContainer) return;
        
        const aiChoiceDiv = createAnimatedContainer('flex flex-col items-center justify-center gap-8');
        const subtitle = createSubtitle('CHOOSE YOUR OPPONENT');
        
        const cards = this.aiChoices.map(ai => 
            createSelectionCard(ai.label, ai.desc, ai.id, () => this.startGame(ai.id))
        );
        
        const cardGrid = createSelectionGrid(cards);
        
        aiChoiceDiv.appendChild(subtitle);
        aiChoiceDiv.appendChild(cardGrid);
        aiChoiceContainer.innerHTML = '';
        aiChoiceContainer.appendChild(aiChoiceDiv);
    }

    private startGame(aiType: string)
    {
        this.aiType = aiType;
        const aiChoiceContainer = this.container.querySelector('#ai-choice-container');
        if (aiChoiceContainer)
        {
            aiChoiceContainer.classList.add('animate-fade-out');
            setTimeout(() => {
                if (aiChoiceContainer) aiChoiceContainer.innerHTML = '';
                this.initializeGame(aiType);
            }, 300);
        } else
        {
            this.initializeGame(aiType);
        }
    }
  
    private initializeGame(aiType: string) {
        const pongContainer = this.container.querySelector('#pong-container');
        if (pongContainer) pongContainer.innerHTML = '';
        
        const levelIndicator = createLevelIndicator(aiType);
        if (pongContainer) pongContainer.appendChild(levelIndicator);
        
        const player1 = 'YOU';
        const player2 = aiType.toUpperCase() + ' AI';

        this.pongComponent = new PongComponent(player1, player2, { aiType });
        
        const { wrapper: canvasWrapper, inner: canvasInner } = createCanvasWrapper();
        
        if (this.pongComponent) {
            canvasInner.appendChild(this.pongComponent.render());
        }
        
        if (pongContainer) {
            pongContainer.appendChild(canvasWrapper);
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
            }
        ];
        
        const controlsDiv = createControlsDiv(controlButtons);
        if (pongContainer) {
            pongContainer.appendChild(controlsDiv);
        }

        this.setupAiLoop();
    }
  
    private showAiChoices() {

        if (this.aiIntervalId !== null)
        {
            clearInterval(this.aiIntervalId);
            this.aiIntervalId = null;
        }
        
        const pongContainer = this.container.querySelector('#pong-container');
        if (pongContainer)
            pongContainer.innerHTML = '';
        
        const aiChoiceContainer = this.container.querySelector('#ai-choice-container');
        if (aiChoiceContainer)
        {
            aiChoiceContainer.innerHTML = '';
            this.renderAiChoiceCards();
        }
    }

  /**
   * Predicts the Y position where the ball will reach the AI paddle's X,
   * taking into account bounces on the top/bottom walls.
   */
  private predictBallY(ballX: number, ballY: number, ballVX: number, ballVY: number, paddleX: number, canvasWidth: number, canvasHeight: number, ballRadius: number): number {
    let x = ballX;
    let y = ballY;
    let vx = ballVX;
    let vy = ballVY;

    // Simulate the ball's path until it reaches the paddle's X
    while ((vx > 0 && x < paddleX) || (vx < 0 && x > paddleX)) {
      // Time to reach paddle X
      const t = Math.abs((paddleX - x) / vx);
      // Next Y if no bounce
      let nextY = y + vy * t;

      // Check for wall bounces in the interval
      if (nextY - ballRadius < 0) {
        // Bounce on top wall
        const tWall = (ballRadius - y) / vy;
        x += vx * tWall;
        y = ballRadius;
        vy = -vy;
      } else if (nextY + ballRadius > canvasHeight) {
        // Bounce on bottom wall
        const tWall = (canvasHeight - ballRadius - y) / vy;
        x += vx * tWall;
        y = canvasHeight - ballRadius;
        vy = -vy;
      } else {
        // No bounce, ball reaches paddle X
        x = paddleX;
        y = nextY;
        break;
      }
    }
    return y;
  }

  private setupAiLoop() {
    if (!this.pongComponent) return;
    const pong = this.pongComponent as any;
    const aiType = this.aiType;

    // AI state
    let aiTargetY = pong.rightPaddleY;
    let inertia = 0; // Simule l'inertie humaine

    // Difficulty parameters
    let baseReactionDelay = 1000; // ms
    let missChance = 0;
    let aimError = 0;
    let hesitationChance = 0.1; // Chance de "ne rien faire" à chaque tick

    switch (aiType) {
      case 'easy':
        baseReactionDelay = 1200;
        missChance = 0.35;
        aimError = 60;
        hesitationChance = 0.25;
        break;
      case 'medium':
        baseReactionDelay = 900;
        missChance = 0.15;
        aimError = 30;
        hesitationChance = 0.18;
        break;
      case 'hard':
        baseReactionDelay = 700;
        missChance = 0.05;
        aimError = 10;
        hesitationChance = 0.10;
        break;
      case 'impossible':
        baseReactionDelay = 40; // Très rapide, mais pas instantané
        missChance = 0;
        aimError = 0;
        hesitationChance = 0;
        break;
    }

    // Clear previous interval if any
    if (this.aiIntervalId !== null) {
      clearInterval(this.aiIntervalId);
      this.aiIntervalId = null;
    }

    // AI "vision" and decision loop
    const aiDecision = () => {
      if (!pong || !pong.ball || !pong.rightPaddle) return;

      // Impossible: comportement humain mais parfait (aucune erreur, aucune hésitation)
      if (aiType === 'impossible') {
        // Prédiction parfaite de la trajectoire
        const paddleX = pong.canvas.width - pong.ballRadius - 1;
        let predictedY = this.predictBallY(
          pong.ballX, pong.ballY, pong.ballSpeedX, pong.ballSpeedY,
          paddleX, pong.canvas.width, pong.canvas.height, pong.ballRadius
        );
        // Cible le centre de la raquette sur la trajectoire
        aiTargetY = Math.max(0, Math.min(
          pong.canvas.height - pong.paddleHeight,
          predictedY - pong.paddleHeight / 2
        ));

        // Mouvement humain avec inertie (pas de téléportation)
        const speed = 0.22 + Math.random() * 0.08; // plus rapide que hard
        inertia += (aiTargetY - pong.rightPaddleY - inertia) * speed;
        inertia = Math.max(Math.min(inertia, 12), -12);

        if (Math.abs(inertia) > 2) {
          pong.rightPaddleUp = inertia < 0;
          pong.rightPaddleDown = inertia > 0;
        } else {
          pong.rightPaddleUp = false;
          pong.rightPaddleDown = false;
        }
        return;
      }

      // Hésitation humaine : l'IA ne réagit pas à chaque tick
      if (Math.random() < hesitationChance) {
        // Simule l'inaction humaine
        pong.rightPaddleUp = false;
        pong.rightPaddleDown = false;
        return;
      }

      if (!pong || !pong.ball || !pong.rightPaddle) return;

      // Seulement si la balle va vers l'IA
      const ballMovingToAI = pong.ballSpeedX > 0;
      if (!ballMovingToAI) {
        aiTargetY = pong.canvas.height / 2 - pong.paddleHeight / 2;
      } else {
        const paddleX = pong.canvas.width - pong.ballRadius - 1;
        let predictedY = aiType === 'impossible'
          ? pong.ballY
          : pong.ballY;

        if (aiType !== 'easy') {
          predictedY = this.predictBallY(
            pong.ballX, pong.ballY, pong.ballSpeedX, pong.ballSpeedY,
            paddleX, pong.canvas.width, pong.canvas.height, pong.ballRadius
          );
        }

        // Ajoute une erreur d'aim et un bruit supplémentaire pour simuler l'imprécision humaine
        let totalError = (Math.random() - 0.5) * aimError;
        totalError += (Math.random() - 0.5) * 12; // bruit supplémentaire
        if (Math.random() < missChance) {
          predictedY += (Math.random() - 0.5) * pong.canvas.height * 0.5;
        } else {
          predictedY += totalError;
        }

        aiTargetY = Math.max(0, Math.min(pong.canvas.height - pong.paddleHeight, predictedY - pong.paddleHeight / 2));
      }

      // Mouvement avec inertie : la raquette ne suit pas instantanément la cible
      const speed = 0.18 + Math.random() * 0.10; // vitesse humaine variable
      inertia += (aiTargetY - pong.rightPaddleY - inertia) * speed;

      // Clamp l'inertie pour éviter des mouvements trop brusques
      inertia = Math.max(Math.min(inertia, 8), -8);

      if (Math.abs(inertia) > 4) {
        pong.rightPaddleUp = inertia < 0;
        pong.rightPaddleDown = inertia > 0;
      } else {
        pong.rightPaddleUp = false;
        pong.rightPaddleDown = false;
      }
    };

    // Intervalle variable pour simuler un temps de réaction humain
    const aiLoop = () => {
      aiDecision();
      // Impossible: délai très court, sinon comportement normal
      const nextDelay = aiType === 'impossible'
        ? baseReactionDelay
        : baseReactionDelay + Math.floor((Math.random() - 0.5) * baseReactionDelay * 0.4);
      this.aiIntervalId = window.setTimeout(aiLoop, Math.max(8, nextDelay));
    };
    aiLoop();
  }  // Clean up when the page is destroyed
  destroy() {
    // AI-specific cleanup
    if (this.aiIntervalId !== null) {
      clearInterval(this.aiIntervalId);
      this.aiIntervalId = null;
    }
    
    // Call parent destroy method for common cleanup
    super.destroy();
  }
}

export default AiPongPage;
