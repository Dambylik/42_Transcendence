import BasePongPage from '../../templates/basePongPage';

interface PongLayoutConfig {
  title: string;
  subtitle: string;
  backgroundImage: string;
}


export function createPongLayout(page: BasePongPage, config: PongLayoutConfig, contentId: string): HTMLElement {
    const pageContent = document.createElement('div');
    pageContent.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark';
    
    const sidebarPromise = page.createSidebar();
    sidebarPromise.then((sidebarHtml: string) => {
        pageContent.innerHTML = `
        ${sidebarHtml}
        <!-- Main Content -->
        <main class="flex-1 flex flex-col">
            <!-- Background with cyberpunk effects -->
            <div class="absolute inset-0 z-0">
            <img src="${config.backgroundImage}" alt="Pong Background" 
                class="absolute inset-0 w-full h-full object-cover opacity-40" />
            <div class="absolute inset-0 bg-cyber-darker bg-opacity-70 backdrop-blur-sm"></div>
            <div class="absolute inset-0 bg-grid-overlay opacity-30"></div>
            <div class="absolute inset-0 scanlines"></div>
            </div>
            
            <!-- Header Section -->
            <div class="p-4 pb-1 relative z-10">
            <div class="flex flex-col items-center mb-2">
                <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-2 tracking-wider">${config.title}</h1>
                <div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto"></div>
                <p class="text-neon-cyan font-cyber text-xl mt-2">${config.subtitle}</p>
            </div>
            </div>
            
            <!-- Game Content -->
            <div id="${contentId}" class="flex-1 px-8 pb-8 pt-4 relative z-10 flex flex-col items-center">
            <!-- Content will be injected here -->
            </div>
        </main>
        `;
    });
    
    return pageContent;
}

export function createSelectionCard(
    title: string,
    description: string,
    id: string,
    onClick: () => void
    ): HTMLElement {
        const card = document.createElement('div');
        card.className = 'bg-cyber-darker border border-neon-pink/30 hover:border-neon-pink relative cursor-pointer transition-all duration-300 hover:scale-105 ai-card-glow min-h-[320px]';
        card.setAttribute('data-id', id);
        
        const cardContent = document.createElement('div');
        cardContent.className = 'p-6 flex flex-col h-full';
        
        const cardHeader = document.createElement('h3');
        cardHeader.className = 'text-xl font-cyber font-bold text-neon-pink mb-3 tracking-wider';
        cardHeader.textContent = title;
        
        const decorLine = document.createElement('div');
        decorLine.className = 'h-0.5 w-16 bg-gradient-to-r from-neon-pink to-neon-cyan mb-4';
        
        const cardDesc = document.createElement('p');
        cardDesc.className = 'text-sm text-gray-300 leading-relaxed mb-6 font-tech flex-1 overflow-auto max-h-[180px] pr-2 cyber-scrollbar';
        cardDesc.textContent = description;
        
        const selectBtn = document.createElement('button');
        selectBtn.className = `mt-auto w-full bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-bold py-3
                            border border-neon-pink hover:shadow-lg hover:shadow-neon-pink/50
                            transition-all duration-300 font-cyber tracking-wider relative overflow-hidden group`;
        selectBtn.setAttribute('data-id', id);
        
        const btnText = document.createElement('span');
        btnText.className = 'relative z-10';
        btnText.textContent = 'SELECT';
        
        const btnGlow = document.createElement('div');
        btnGlow.className = 'absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-full group-hover:translate-x-0 transition-transform duration-500';
  
        const corners = [
            { position: 'top-0 left-0', classes: 'border-t-2 border-l-2 border-neon-pink' },
            { position: 'top-0 right-0', classes: 'border-t-2 border-r-2 border-neon-cyan' },
            { position: 'bottom-0 left-0', classes: 'border-b-2 border-l-2 border-neon-cyan' },
            { position: 'bottom-0 right-0', classes: 'border-b-2 border-r-2 border-neon-pink' }
        ];
  
        corners.forEach(({ position, classes }) => {
            const corner = document.createElement('div');
            corner.className = `absolute ${position} w-4 h-4 ${classes}`;
            card.appendChild(corner);
        });

        selectBtn.appendChild(btnText);
        selectBtn.appendChild(btnGlow);
        cardContent.appendChild(cardHeader);
        cardContent.appendChild(decorLine);
        cardContent.appendChild(cardDesc);
        cardContent.appendChild(selectBtn);
        card.appendChild(cardContent);
  
        card.addEventListener('click', onClick);
  
    return card;
}

export function createSelectionGrid(cards: HTMLElement[]): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-5xl';
    
    cards.forEach(card => {
        grid.appendChild(card);
    });
    
    return grid;
}
