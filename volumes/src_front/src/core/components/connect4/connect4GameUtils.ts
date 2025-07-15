// Dynamic import will be handled in the calling code
// import Connect4Component from './connect4';
import { createGameInfoDiv, createCanvasWrapper, createControlsDiv } from '../pong/pongFormUtils';

export async function setupConnect4Game(
    container: HTMLElement,
    options: {
        player1: string;
        player2: string;
        controlsText?: string;
        buttons: Array<{
            id: string;
            text: string;
            type?: 'primary' | 'secondary';
            onClick: () => void;
        }>
    }
): Promise<any> { // Return type will be Connect4Component but we can't import it statically

    // Dynamic import of the heavy Connect4Component
    const { default: Connect4Component } = await import('./connect4');

    container.innerHTML = '';
    container.classList.remove('hidden');
    container.classList.add('animate-scale-in');
    
    const gameInfo = createGameInfoDiv(
        options.player1,
        options.player2,
        options.controlsText || 'CLICK COLUMNS TO DROP DISCS | FIRST TO CONNECT 4 WINS!'
    );
    container.appendChild(gameInfo);
    
    const { wrapper, inner } = createCanvasWrapper();
    
    const connect4Component = new Connect4Component(options.player1, options.player2, {
        onGameEnd: (winner) => {
            console.log(`Game ended, winner: ${winner}`);
        }
    });
    
    if (connect4Component) {
        inner.appendChild(connect4Component.render());
    }
    
    wrapper.appendChild(inner);
    container.appendChild(wrapper);
    
    const controls = createControlsDiv(options.buttons);
    container.appendChild(controls);
    
    return connect4Component;
}

export function animateTransition(
    fromElement: HTMLElement | null, 
    toElement: HTMLElement | null,
    callback?: () => void
): void {
    if (!fromElement) return;
    
    fromElement.classList.add('animate-fade-out');
    setTimeout(() => {
        if (fromElement) {
            fromElement.classList.add('hidden');
            if (callback) callback();

            if (toElement) {
                toElement.classList.remove('hidden');
                toElement.classList.add('animate-scale-in');
            }
        }
    }, 300);
}
