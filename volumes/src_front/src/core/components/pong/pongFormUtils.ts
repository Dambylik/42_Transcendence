export interface FormConfig {
    title: string;
    width?: string;
    maxWidth?: string;
    className?: string;
    centered?: boolean;
}

export function createFormContainer(config: FormConfig): HTMLElement
{
    const formContainer = document.createElement('div');
    const baseClasses = 'cyber-panel bg-cyber-darker border border-neon-pink/30 p-6 relative';
    const widthClasses = `${config.width || 'w-full'} ${config.maxWidth || 'max-w-2xl'}`;
    const positionClasses = config.centered ? 'mx-auto' : '';
    const customClasses = config.className || '';
    
    formContainer.className = `${baseClasses} ${widthClasses} ${positionClasses} ${customClasses}`;

    const corners = [
        { position: 'top-0 left-0', classes: 'border-t-2 border-l-2 border-neon-pink' },
        { position: 'top-0 right-0', classes: 'border-t-2 border-r-2 border-neon-cyan' },
        { position: 'bottom-0 left-0', classes: 'border-b-2 border-l-2 border-neon-cyan' },
        { position: 'bottom-0 right-0', classes: 'border-b-2 border-r-2 border-neon-pink' }
    ];
    
    corners.forEach(({ position, classes }) => {
        const corner = document.createElement('div');
        corner.className = `absolute ${position} w-4 h-4 ${classes} z-10`;
        formContainer.appendChild(corner);
    });

    if (config.title)
    {
        const title = document.createElement('h2');
        title.className = 'text-2xl font-cyber text-neon-cyan mb-4 text-center tracking-wider';
        title.textContent = config.title;

        const divider = document.createElement('div');
        divider.className = 'h-0.5 w-24 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto mb-6';

        formContainer.appendChild(title);
        formContainer.appendChild(divider);
    }

    return formContainer;
}

export function createCanvasWrapper(): { wrapper: HTMLElement, inner: HTMLElement }
{
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'cyber-panel animate-scale-in relative mx-auto w-full';
    
    const canvasInner = document.createElement('div');
    canvasInner.className = 'p-1 bg-cyber-darker/80 relative flex justify-center';
    
    const corners = [
        { classes: 'top-0 left-0 border-t-2 border-l-2 border-neon-pink' },
        { classes: 'top-0 right-0 border-t-2 border-r-2 border-neon-cyan' },
        { classes: 'bottom-0 left-0 border-b-2 border-l-2 border-neon-cyan' },
        { classes: 'bottom-0 right-0 border-b-2 border-r-2 border-neon-pink' }
    ];
    
    corners.forEach(corner => {
        const div = document.createElement('div');
        div.className = `absolute w-4 h-4 ${corner.classes} z-10`;
        canvasInner.appendChild(div);
    });
    
    canvasWrapper.appendChild(canvasInner);
    return { wrapper: canvasWrapper, inner: canvasInner };
}

export function createSubtitle(text: string): HTMLElement
{
    const subtitle = document.createElement('p');
    subtitle.className = 'text-gray-300 font-tech text-sm mb-8 text-center';
    subtitle.textContent = text;
    return subtitle;
}

export function createGameInfoDiv(player1: string, player2: string, controlsText: string = ''): HTMLElement 
{
    const gameInfoDiv = document.createElement('div');
    gameInfoDiv.className = 'mb-4 text-center w-full';
    
    const playerTitle = document.createElement('h2');
    playerTitle.className = 'text-2xl font-cyber text-neon-pink mb-1';
    playerTitle.innerHTML = `
        <span class="text-neon-pink">${player1}</span>
        <span class="text-gray-400 mx-2">VS</span>
        <span class="text-neon-cyan">${player2}</span>
    `;
    
    const divider = document.createElement('div');
    divider.className = 'h-0.5 w-24 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto my-2';
    
    gameInfoDiv.appendChild(playerTitle);
    gameInfoDiv.appendChild(divider);
    
    if (controlsText) {
        const controlsInfo = document.createElement('p');
        controlsInfo.className = 'text-gray-300 font-tech text-sm mt-2';
        controlsInfo.textContent = controlsText;
        gameInfoDiv.appendChild(controlsInfo);
    }
    
    return gameInfoDiv;
}

export function createControlsDiv(buttons: Array<{
    id: string;
    text: string;
    type?: 'primary' | 'secondary';
    onClick: () => void;
    }>): HTMLElement {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'mt-4 flex justify-center gap-6 animate-scale-in w-full';
    
    buttons.forEach(button => {
        const buttonType = button.type || 'primary';
        const buttonClasses = buttonType === 'primary' 
        ? 'from-neon-pink/10 to-transparent text-neon-pink border-neon-pink hover:bg-neon-pink'
        : 'from-neon-cyan/10 to-transparent text-neon-cyan border-neon-cyan hover:bg-neon-cyan';
        
        const btn = document.createElement('button');
        btn.id = button.id;
        btn.className = `px-8 py-3 bg-gradient-to-r ${buttonClasses} font-cyber 
                        border hover:text-cyber-dark transition-all duration-300 
                        relative overflow-hidden group`;
        
        const textSpan = document.createElement('span');
        textSpan.className = 'relative z-10 tracking-wider';
        textSpan.textContent = button.text;
        
        const glowDiv = document.createElement('div');
        glowDiv.className = 'absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-full group-hover:translate-x-0 transition-transform duration-500';
        
        btn.appendChild(textSpan);
        btn.appendChild(glowDiv);
        btn.addEventListener('click', button.onClick);
        
        controlsDiv.appendChild(btn);
    });
    
    return controlsDiv;
}
