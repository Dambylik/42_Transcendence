export function renderUserActions(context: 'friend' | 'search' | 'request', userId: number): string {
    if (context === 'friend') {
        return `
            <div class="ml-auto flex space-x-2">
                <button class="invite-game-btn p-2 bg-cyber-dark border border-neon-pink/50 hover:border-neon-pink text-neon-pink text-sm rounded" data-user-id="${userId}">INVITE</button>
                <button class="remove-friend-btn p-2 bg-cyber-dark border border-gray-600 hover:border-red-500 text-gray-400 hover:text-red-500 text-sm rounded" data-user-id="${userId}">REMOVE</button>
                <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded" data-user-id="${userId}">BLOCK</button>
            </div>
        `;
    }
    // Ajoute d'autres contextes si besoin (search, request)
    return '';
}
