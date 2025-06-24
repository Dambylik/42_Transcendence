type FriendRequest = {
    id: number;
    username: string;
    avatar_url: string;
    senderId?: number;
};

export function renderFriendRequestCard(request: FriendRequest): string {
    const userId = request.senderId || request.id;
    const avatarUrl = request.avatar_url
        ? (request.avatar_url.startsWith('/')
            ? request.avatar_url
            : (request.avatar_url.startsWith('uploads/')
                ? '/' + request.avatar_url
                : '/uploads/' + request.avatar_url))
        : '/uploads/default.png';
    return `
        <div class="cyber-panel bg-cyber-darker p-4 border border-neon-cyan/30 hover:border-neon-cyan transition-colors">
            <div class="flex items-center space-x-4">
                <a href="https://localhost:4430/profile/${request.username}">
                    <img src="${avatarUrl}" alt="${request.username}" 
                        class="w-16 h-16 object-cover rounded-lg border-2 border-gray-500">
                </a>
                <div>
                    <a href="https://localhost:4430/profile/${request.username}" class="hover:underline">
                        <h3 class="font-cyber text-lg text-white">${request.username}</h3>
                    </a>
                    <span class="font-cyber text-xs font-bold px-2 py-1 rounded-sm text-blue-400 bg-blue-900/20 border border-blue-500/30">
                        FRIEND REQUEST
                    </span>
                </div>
                <div class="ml-auto flex space-x-2">
                    <button class="accept-request-btn p-2 bg-cyber-dark border border-neon-pink/50 hover:border-neon-pink text-neon-pink text-sm rounded" 
                        data-accept="${userId}">
                        ACCEPT
                    </button>
                    <button class="decline-request-btn p-2 bg-cyber-dark border border-gray-600 hover:border-red-500 text-gray-400 hover:text-red-500 text-sm rounded"
                        data-decline="${userId}">
                        DECLINE
                    </button>
                    <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded"
                        data-user-id="${userId}">
                        BLOCK
                    </button>
                </div>
            </div>
        </div>
    `;
}
