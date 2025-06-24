import PongComponent from './pong';
import { createGameInfoDiv, createCanvasWrapper, createControlsDiv } from './pongFormUtils';

export function setupPongGame(
    container: HTMLElement,
    options: {
        player1: string;
        player2: string;
        controlsText?: string;
        aiType?: string;
        buttons: Array<{
            id: string;
            text: string;
            type?: 'primary' | 'secondary';
            onClick: () => void;
        }>
    }
): PongComponent {

    container.innerHTML = '';
    container.classList.remove('hidden');
    container.classList.add('animate-scale-in');
    
    const gameInfo = createGameInfoDiv(
        options.player1,
        options.player2,
        options.controlsText || ''
    );
    container.appendChild(gameInfo);
    
    const { wrapper, inner } = createCanvasWrapper();
    
    const pongComponent = new PongComponent(options.player1, options.player2, 
            options.aiType ? { aiType: options.aiType } : undefined);
    
    if (pongComponent) {
            inner.appendChild(pongComponent.render());
    }
    
    wrapper.appendChild(inner);
    container.appendChild(wrapper);
    
    const controls = createControlsDiv(options.buttons);
    container.appendChild(controls);
    
    return pongComponent;
}

export function animateTransition(
    fromElement: HTMLElement | null, 
    toElement: HTMLElement | null,
    callback?: () => void
    ): void {
        if (!fromElement)
            return;
        
        fromElement.classList.add('animate-fade-out');
                setTimeout(() => {
                    if (fromElement) {
                        fromElement.classList.add('hidden');
                        if (callback)
                            callback();
            
                        if (toElement) {
                            toElement.classList.remove('hidden');
                            toElement.classList.add('animate-scale-in');
                        }
                    }
                }, 300);
}
