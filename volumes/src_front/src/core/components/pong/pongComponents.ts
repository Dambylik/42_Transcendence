interface CyberPanelProps {
    title?: string;
    dividerWidth?: string;
}

export function createCyberPanel(content: string, props: CyberPanelProps = {}): string {
    const titleSection = props.title ? `
        <h2 class="text-2xl font-cyber text-neon-cyan mb-4 text-center tracking-wider">${props.title}</h2>
        <div class="h-0.5 ${props.dividerWidth || 'w-24'} bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto mb-6"></div>
    ` : '';

    return `
        <div class="cyber-panel bg-cyber-darker border border-neon-pink/30 p-6 relative">
        <!-- Corner brackets -->
        <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-pink"></div>
        <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-cyan"></div>
        <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-cyan"></div>
        <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-pink"></div>
        
        ${titleSection}
        ${content}
        </div>
    `;
}

export function createCyberButton(text: string, options: {
    type?: 'primary' | 'secondary';
    htmlType?: 'button' | 'submit';
    href?: string;
    classes?: string;
} = {}): string {
    const baseClasses = options.type === 'secondary' 
        ? 'from-neon-cyan/10 to-transparent text-neon-cyan border-neon-cyan hover:bg-neon-cyan'
        : 'from-neon-pink to-neon-cyan text-white border-neon-pink hover:shadow-neon-pink/50';

    const buttonContent = options.href
        ? `<a href="${options.href}" data-route="${options.href}" class="relative z-10">${text}</a>`
        : `<span class="relative z-10">${text}</span>`;

    return `
        <button type="${options.htmlType || 'button'}" 
                class="px-4 py-3 bg-gradient-to-r ${baseClasses} font-bold 
                    border hover:shadow-lg transition-all duration-300 
                    font-cyber tracking-wider relative overflow-hidden group ${options.classes || ''}">
        ${buttonContent}
        <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                    transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
        </button>
  `;
}

    export function createCyberInput(props: {
        id: string;
        placeholder: string;
        type?: string;
        required?: boolean;
        colorScheme?: 'pink' | 'cyan';
    }): string {
        const colors = props.colorScheme === 'cyan' 
            ? 'border-neon-cyan/50 text-neon-cyan placeholder-neon-cyan/50 focus:border-neon-cyan focus:ring-neon-cyan'
            : 'border-neon-pink/50 text-neon-pink placeholder-neon-pink/50 focus:border-neon-pink focus:ring-neon-pink';

        return `
            <input type="${props.type || 'text'}" 
                id="${props.id}" 
                placeholder="${props.placeholder}"
                ${props.required ? 'required' : ''}
                class="w-full p-3 bg-cyber-dark border ${colors}
                        font-tech focus:ring-1 outline-none transition-all" />
        `;
}
