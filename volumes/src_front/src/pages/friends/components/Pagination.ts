export function renderPagination(currentPage: number, totalPages: number): string {
    return `
        <div class="absolute bottom-4 left-0 right-0 flex justify-center">
            <button id="prev-page" class="px-4 py-2 bg-cyber-dark border border-gray-600 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50" 
                ${currentPage === 1 ? 'disabled' : ''}>
                Previous
            </button>
            <button id="next-page" class="px-4 py-2 bg-cyber-dark border border-gray-600 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50" 
                ${currentPage === totalPages ? 'disabled' : ''}>
                Next
            </button>
        </div>
    `;
}
