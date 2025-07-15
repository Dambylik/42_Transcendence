import Page from './page';
import { Router } from '../../../router/Router';
// Dynamic import to reduce bundle size
// import PongComponent from '../components/pong/pong';

export default abstract class BasePongPage extends Page {
    protected pongComponent: any | null = null; // Use any to avoid static import
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
            this.pongComponent.destroy();
            this.pongComponent = null;
        }
        
        this.container.innerHTML = '';
    }
}
