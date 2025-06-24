// Common Pong page patterns and templates
import { createFormContainer, createCanvasWrapper, createControlsDiv, createGameInfoDiv } from './pongFormUtils';
import { 
    createCyberButton, 
    createPageHeader, 
    createBackgroundLayers,
   // createInputField,
    createFormFieldGroup
} from './pongUtils';

export interface PongPageConfig {
    title: string;
    subtitle: string;
    backgroundImage: string;
    instructionText?: string;
}

export function createPongPageLayout(
    sidebarHtml: string, 
    config: PongPageConfig,
    contentContainers: string[]
): HTMLElement {
    const pageContent = document.createElement('div');
    pageContent.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark';
    
    // Create layout components
    const backgroundLayers = createBackgroundLayers(config.backgroundImage, `${config.title} Background`);
    const pageHeader = createPageHeader(config.title, config.subtitle);
    
    // Assemble the layout
    pageContent.innerHTML = sidebarHtml;
    
    const main = document.createElement('main');
    main.className = 'flex-1 flex flex-col';
    main.appendChild(backgroundLayers);
    main.appendChild(pageHeader);
    
    const contentArea = document.createElement('div');
    contentArea.className = 'flex-1 px-8 pb-8 pt-4 relative z-10 flex flex-col items-center';
    
    let contentHTML = '';
    if (config.instructionText) {
        contentHTML += `<p class="text-gray-300 font-tech text-sm mb-8 text-center">${config.instructionText}</p>`;
    }
    
    contentContainers.forEach(container => {
        contentHTML += container;
    });
    
    contentArea.innerHTML = contentHTML;
    main.appendChild(contentArea);
    pageContent.appendChild(main);
    
    return pageContent;
}

export interface PlayerFormConfig {
    title: string;
    fields: Array<{
        id: string;
        placeholder: string;
        colorTheme: 'pink' | 'cyan';
    }>;
    submitButtonText: string;
    returnButtonText?: string;
    returnButtonRoute?: string;
}

export function createPlayerForm(config: PlayerFormConfig): HTMLElement {
    const formContainer = createFormContainer({
        title: config.title,
        centered: true
    });
    
    const form = document.createElement('form');
    form.className = 'flex flex-col gap-6 max-w-md mx-auto';
    
    // Create form fields
    const fieldsGroup = createFormFieldGroup({
        fields: config.fields.map(field => ({
            id: field.id,
            placeholder: field.placeholder,
            colorTheme: field.colorTheme,
            required: true
        }))
    });
    
    // Create button group
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'flex flex-col gap-4';
    
    const submitButton = createCyberButton({
        text: config.submitButtonText,
        type: 'gradient',
        fullWidth: true
    });
    (submitButton as HTMLButtonElement).type = 'submit';
    
    buttonGroup.appendChild(submitButton);
    
    if (config.returnButtonText && config.returnButtonRoute) {
        const returnButton = createCyberButton({
            text: config.returnButtonText,
            type: 'secondary',
            fullWidth: true,
            id: 'return-home'
        });
        
        const returnLink = document.createElement('a');
        returnLink.href = config.returnButtonRoute;
        returnLink.setAttribute('data-route', config.returnButtonRoute);
        returnLink.className = 'relative z-10';
        returnLink.textContent = config.returnButtonText;
        returnButton.innerHTML = '';
        returnButton.appendChild(returnLink);
        
        buttonGroup.appendChild(returnButton);
    }
    
    form.appendChild(fieldsGroup);
    form.appendChild(buttonGroup);
    formContainer.appendChild(form);
    
    return formContainer;
}

export interface GameSetupConfig {
    player1: string;
    player2: string;
    controlsText?: string;
    gameOptions?: any;
}

export function createGameSetup(
    container: HTMLElement, 
    config: GameSetupConfig,
    pongComponentClass: any
): { pongComponent: any; controlsDiv: HTMLElement } {
    // Clear container
    container.innerHTML = '';
    container.classList.remove('hidden');
    container.classList.add('animate-scale-in');

    // Create game info
    const gameInfoDiv = createGameInfoDiv(
        config.player1, 
        config.player2, 
        config.controlsText || ''
    );
    container.appendChild(gameInfoDiv);

    // Create canvas wrapper
    const { wrapper: canvasWrapper, inner: canvasInner } = createCanvasWrapper();

    // Initialize pong component
    const pongComponent = new pongComponentClass(config.player1, config.player2, config.gameOptions);
    if (pongComponent) {
        canvasInner.appendChild(pongComponent.render());
    }
    
    container.appendChild(canvasWrapper);
    
    return { pongComponent, controlsDiv: container };
}

export function addGameControls(
    container: HTMLElement,
    buttons: Array<{
        id: string;
        text: string;
        type?: 'primary' | 'secondary';
        onClick: () => void;
    }>
): void {
    const controlsDiv = createControlsDiv(buttons);
    container.appendChild(controlsDiv);
}
