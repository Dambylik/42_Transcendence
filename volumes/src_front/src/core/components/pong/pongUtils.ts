export interface CyberButtonConfig {
    text: string;
    type?: 'primary' | 'secondary' | 'gradient';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    onClick?: () => void;
    id?: string;
    className?: string;
}

export function createCyberButton(config: CyberButtonConfig): HTMLElement {
    const button = document.createElement('button');
    
    let classes = 'font-cyber tracking-wider relative overflow-hidden group transition-all duration-300';
    
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3',
        lg: 'px-8 py-3'
    };
    classes += ` ${sizeClasses[config.size || 'md']}`;
    
    if (config.fullWidth) {
        classes += ' w-full';
    }
    
    switch (config.type) {
        case 'primary':
            classes += ' bg-gradient-to-r from-neon-pink/10 to-transparent text-neon-pink border border-neon-pink hover:bg-neon-pink hover:text-cyber-dark hover:shadow-lg hover:shadow-neon-pink/50';
            break;
        case 'secondary':
            classes += ' bg-gradient-to-r from-neon-cyan/10 to-transparent text-neon-cyan border border-neon-cyan hover:bg-neon-cyan hover:text-cyber-dark hover:shadow-lg hover:shadow-neon-cyan/50';
            break;
        case 'gradient':
        default:
            classes += ' bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-bold border border-neon-pink hover:shadow-lg hover:shadow-neon-pink/50';
            break;
    }
    
    if (config.className) {
        classes += ` ${config.className}`;
    }
    
    button.className = classes;
    
    if (config.id) {
        button.id = config.id;
    }
    
    const textSpan = document.createElement('span');
    textSpan.className = 'relative z-10';
    textSpan.textContent = config.text;
    
    const glowDiv = document.createElement('div');
    glowDiv.className = 'absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-full group-hover:translate-x-0 transition-transform duration-500';
    
    button.appendChild(textSpan);
    button.appendChild(glowDiv);
    
    if (config.onClick) {
        button.addEventListener('click', config.onClick);
    }
    
    return button;
}

export interface InputFieldConfig {
    id: string;
    placeholder: string;
    type?: string;
    colorTheme?: 'pink' | 'cyan';
    required?: boolean;
    className?: string;
}

export function createInputField(config: InputFieldConfig): HTMLElement {
    const input = document.createElement('input');
    
    input.type = config.type || 'text';
    input.id = config.id;
    input.placeholder = config.placeholder;
    input.required = config.required || false;
    
    const themeClasses = config.colorTheme === 'cyan' 
        ? 'border-neon-cyan/50 text-neon-cyan placeholder-neon-cyan/50 focus:border-neon-cyan focus:ring-neon-cyan'
        : 'border-neon-pink/50 text-neon-pink placeholder-neon-pink/50 focus:border-neon-pink focus:ring-neon-pink';
    
    const baseClasses = 'w-full p-3 bg-cyber-dark font-tech focus:ring-1 outline-none transition-all';
    
    input.className = `${baseClasses} border ${themeClasses} ${config.className || ''}`;
    
    return input;
}

export function createPageHeader(title: string, subtitle: string): HTMLElement {
    const headerDiv = document.createElement('div');
    headerDiv.className = 'p-4 pb-1 relative z-10';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex flex-col items-center mb-2';
    
    const titleElement = document.createElement('h1');
    titleElement.className = 'text-4xl font-cyber text-neon-pink animate-glow-pulse mb-2 tracking-wider';
    titleElement.textContent = title;
    
    const divider = document.createElement('div');
    divider.className = 'h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto';
    
    const subtitleElement = document.createElement('p');
    subtitleElement.className = 'text-neon-cyan font-cyber text-xl mt-2';
    subtitleElement.textContent = subtitle;
    
    contentDiv.appendChild(titleElement);
    contentDiv.appendChild(divider);
    contentDiv.appendChild(subtitleElement);
    headerDiv.appendChild(contentDiv);
    
    return headerDiv;
}

export function createBackgroundLayers(imageSrc: string, altText: string): HTMLElement {
    const backgroundDiv = document.createElement('div');
    backgroundDiv.className = 'absolute inset-0 z-0';
    backgroundDiv.innerHTML = `
        <img src="${imageSrc}" alt="${altText}" 
            class="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div class="absolute inset-0 bg-cyber-darker bg-opacity-70 backdrop-blur-sm"></div>
        <div class="absolute inset-0 bg-grid-overlay opacity-30"></div>
        <div class="absolute inset-0 scanlines"></div>
    `;
    return backgroundDiv;
}

export function createMainContentArea(contentId: string): HTMLElement {
    const mainElement = document.createElement('main');
    mainElement.className = 'flex-1 flex flex-col';
    
    const contentArea = document.createElement('div');
    contentArea.id = contentId;
    contentArea.className = 'flex-1 px-8 pb-8 pt-4 relative z-10 flex flex-col items-center';
    
    mainElement.appendChild(contentArea);
    return mainElement;
}

export function createAnimatedContainer(className: string = '', animation: string = 'animate-scale-in'): HTMLElement {
    const container = document.createElement('div');
    container.className = `${className} ${animation}`;
    return container;
}

export interface FormFieldGroup {
    fields: InputFieldConfig[];
    className?: string;
}

export function createFormFieldGroup(config: FormFieldGroup): HTMLElement {
    const group = document.createElement('div');
    group.className = config.className || 'space-y-4';
    
    config.fields.forEach(fieldConfig => {
        const field = createInputField(fieldConfig);
        group.appendChild(field);
    });
    
    return group;
}

export function createLevelIndicator(aiType: string): HTMLElement {
    const levelDiv = document.createElement('div');
    levelDiv.className = 'mb-4 text-center animate-scale-in w-full';
    
    const levelTitle = document.createElement('h2');
    levelTitle.className = 'text-2xl font-cyber text-neon-pink mb-1';
    levelTitle.innerHTML = `LEVEL: <span class="text-neon-cyan">${aiType.toUpperCase()}</span>`;
    
    const divider = document.createElement('div');
    divider.className = 'h-0.5 w-24 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto my-2';
    
    const controlsInfo = document.createElement('p');
    controlsInfo.className = 'text-gray-300 font-tech text-sm mt-2';
    controlsInfo.textContent = 'USE W/S KEYS TO CONTROL YOUR PADDLE';
    
    levelDiv.appendChild(levelTitle);
    levelDiv.appendChild(divider);
    levelDiv.appendChild(controlsInfo);
    
    return levelDiv;
}
