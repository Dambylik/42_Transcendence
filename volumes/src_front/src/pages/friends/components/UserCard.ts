type UserCardProps = {
    id: number;
    username: string;
    avatar_url: string;
    online?: boolean;
    friendshipStatus?: string;
    actionsHtml: string;
};

export function renderUserCard({ id, username, avatar_url, online, friendshipStatus, actionsHtml }: UserCardProps): string {
    const avatarUrl = avatar_url
        ? (avatar_url.startsWith('/') ? avatar_url : (avatar_url.startsWith('uploads/') ? '/' + avatar_url : '/uploads/' + avatar_url))
        : '/uploads/default.png';
    return `
        <div class="cyber-panel bg-cyber-darker p-4 border border-neon-cyan/30 hover:border-neon-cyan transition-colors" data-user-id="${id}">
            <div class="flex items-center space-x-4">
                <a href="https://localhost:4430/profile/${username}">
                    <img src="${avatarUrl}" alt="${username}" 
                        class="w-16 h-16 object-cover rounded-lg border-2 ${online ? 'border-neon-cyan' : 'border-gray-500'}">
                </a>
                <div>
                    <a href="https://localhost:4430/profile/${username}" class="hover:underline">
                        <h3 class="font-cyber text-lg text-white">${username}</h3>
                    </a>
                    ${typeof online === 'boolean' ? `
                        <span class="font-cyber text-xs font-bold px-2 py-1 rounded-sm ${
                            online 
                                ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                                : 'text-red-400 bg-red-900/20 border border-red-500/30'
                        }">
                            ${online ? 'ONLINE' : 'OFFLINE'}
                        </span>
                    ` : ''}
                </div>
                ${actionsHtml}
            </div>
        </div>
    `;
}
