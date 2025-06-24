import Page from './page';
import { Router } from '../../../router/Router';
import PongComponent from '../components/pong/pong';

export default abstract class BasePongPage extends Page {
    protected pongComponent: PongComponent | null = null;
    protected container: HTMLElement;

    constructor(id: string, router?: Router)
    {
        super(id, router);
        this.container = document.createElement('div');
    }

    protected keyDownHandler = (e: KeyboardEvent) => 
    {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        }
    };

    protected setupKeyHandlers(): void
    {
        window.addEventListener('keydown', this.keyDownHandler, { passive: false });
    }

    protected cleanupKeyHandlers(): void
    {
        window.removeEventListener('keydown', this.keyDownHandler);
    }

    protected setupGameContainer(container: HTMLElement): void
    {
        container.className = 'mt-4 cyber-border relative w-full flex-col items-center';
    }

    destroy()
    {
        this.cleanupKeyHandlers();
        
        if (this.pongComponent)
        {
            this.pongComponent = null;
        }
        
        this.container.innerHTML = '';
    }
}
