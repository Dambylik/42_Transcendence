
export function createPageHeader(title: string): string {
    return `
        <!-- Header Section -->
        <div class="flex flex-col items-center mb-6">
            <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-2 tracking-wider">${title}</h1>
            <div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan"></div>
        </div>

        <!-- Corner decorations for main content -->
        <div class="absolute top-0 left-8 w-12 h-12 border-l-2 border-t-2 border-neon-pink/50 pointer-events-none"></div>
        <div class="absolute top-0 right-8 w-12 h-12 border-r-2 border-t-2 border-neon-cyan/50 pointer-events-none"></div>
        <div class="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-neon-cyan/50 pointer-events-none"></div>
        <div class="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-neon-pink/50 pointer-events-none"></div>
    `;
}

export function createContentWrapper(columns: 1 | 2 = 1): string {
    const columnClass = columns === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';
    
    return `
        <!-- Content Wrapper -->
        <div class="flex-1 p-6 grid ${columnClass} gap-6 mx-8 mb-8">
            ${columns === 2 ? 
                `<div id="left-container" class="lg:col-span-1 flex flex-col min-h-[800px]"></div>
                <div id="right-container" class="lg:col-span-1 flex flex-col min-h-[800px]"></div>` :
                `<div id="main-container" class="flex flex-col min-h-[800px]"></div>`
            }
        </div>
    `;
}

export function createPageLayout(
    title: string, 
    columns: 1 | 2 = 1, 
    leftContainerId: string = 'left-container',
    rightContainerId: string = 'right-container',
    mainContainerId: string = 'main-container'
): string {
    const columnClass = columns === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';
    
    return `
        <!-- Header Section -->
        <main class="flex-1 flex flex-col relative">
            <div class="flex flex-col items-center mb-6">
                <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-2 tracking-wider">${title}</h1>
                <div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan"></div>
            </div>

            <!-- Corner decorations for main content -->
            <div class="absolute top-0 left-8 w-12 h-12 border-l-2 border-t-2 border-neon-pink/50 pointer-events-none"></div>
            <div class="absolute top-0 right-8 w-12 h-12 border-r-2 border-t-2 border-neon-cyan/50 pointer-events-none"></div>
            <div class="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-neon-cyan/50 pointer-events-none"></div>
            <div class="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-neon-pink/50 pointer-events-none"></div>
            
            <!-- Content Area -->
            <div class="flex-1 p-6 grid ${columnClass} gap-6 mx-8 mb-8">
                ${columns === 2 ? 
                    `<div id="${leftContainerId}" class="lg:col-span-1 flex flex-col min-h-[800px]"></div>
                    <div id="${rightContainerId}" class="lg:col-span-1 flex flex-col min-h-[800px]"></div>` :
                    `<div id="${mainContainerId}" class="flex flex-col min-h-[800px]"></div>`
                }
            </div>
        </main>
    `;
}

export function createCornerDecorations(): string {
    return `
        <div class="absolute top-0 left-8 w-12 h-12 border-l-2 border-t-2 border-neon-pink/50 pointer-events-none"></div>
        <div class="absolute top-0 right-8 w-12 h-12 border-r-2 border-t-2 border-neon-cyan/50 pointer-events-none"></div>
        <div class="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-neon-cyan/50 pointer-events-none"></div>
        <div class="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-neon-pink/50 pointer-events-none"></div>
    `;
}
