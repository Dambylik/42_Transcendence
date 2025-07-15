// Dynamic import will be handled in the calling code
// import PongComponent from './pong';
import { createGameInfoDiv, createCanvasWrapper, createControlsDiv } from './pongFormUtils';

export async function setupPongGame(
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
): Promise<any> { // Return type will be PongComponent but we can't import it statically

    // Dynamic import of the heavy PongComponent
    const { default: PongComponent } = await import('./pong');

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

export async function setupMultiplayerPong(
    container: HTMLElement,
    options: {
        player1: string;
        player2: string;
        socket: WebSocket;
        isPlayer1: boolean;
        buttons: Array<{
            id: string;
            text: string;
            type?: 'primary' | 'secondary';
            onClick: () => void;
        }>
    }
): Promise<any> { // Return type will be PongComponent but we can't import it statically

    // Dynamic import of the heavy PongComponent
    const { default: PongComponent } = await import('./pong');

    container.innerHTML = '';
    container.classList.remove('hidden');
    container.classList.add('animate-scale-in');
    
    const gameInfo = createGameInfoDiv(
        options.player1,
        options.player2,
        options.isPlayer1 ? 'W/S KEYS TO MOVE' : 'UP/DOWN ARROWS TO MOVE'
    );
    container.appendChild(gameInfo);
    
    const { wrapper, inner } = createCanvasWrapper();
    
    const pongComponent = new PongComponent(options.player1, options.player2, {
        socket: options.socket,
        isMultiplayer: true,
        isPlayer1: options.isPlayer1
    });
    
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
