import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';

type GameHistoryEntry = {
    date: string;
    id: number;
    room: string;
    roomIcon: string;
    friend: string;
    score: string;
    status: string;
};

class ProfilePage extends Page {
    private username: string = '';
    private avatarUrl: string = '';
    private gameHistory: GameHistoryEntry[];

    // Ajoute une propriété pour garder la référence WebSocket
    private friendWs?: WebSocket;
    private onlineStatusWs?: WebSocket;

    constructor(id: string, router?: Router, options?: { username: string }) {
        super(id, router);

        // Historique en dur
        this.gameHistory = [
            {
                date: "2025-10-01",
                id: 1,
                room: "INFINITE ROOM",
                roomIcon: "🍚",
                friend: "JU-JU",
                score: "10-2",
                status: "WIN"
            },
            {
                date: "2025-10-01",
                id: 2,
                room: "RUGGED ROOM", 
                roomIcon: "🐼",
                friend: "OLGA",
                score: "0-2",
                status: "LOSS"
            },
            {
                date: "2025-10-01",
                id: 3,
                room: "IDRISS ROOM",
                roomIcon: "🐾", 
                friend: "SAMI",
                score: "10-8",
                status: "WIN"
            }
        ];

        if (options?.username) {
            this.username = options.username;
        }
    }

    private generateGameRowsHTML(): string {
        return this.gameHistory.map(game => `
            <tr class="border-b border-gray-700/50 hover:bg-cyber-dark/70 transition-colors">
                <td class="py-4 text-center">
                    <span class="text-white font-tech">${game.date}</span>
                </td>    
                <td class="py-4 text-center">
                    <div class="flex items-center justify-center space-x-3">
                        <div class="w-8 h-8 bg-neon-cyan/20 rounded-sm border border-neon-cyan/50 flex items-center justify-center text-neon-cyan">
                            ${game.roomIcon}
                        </div>
                        <span class="text-white font-tech">${game.room}</span>
                    </div>
                </td>
                <td class="py-4 text-center">
                    <span class="text-white font-tech">${game.friend}</span>
                </td>
                <td class="py-4 text-center">
                    <span class="text-white font-tech">${game.score}</span>
                </td>
                <td class="py-4 text-center">
                    <span class="font-cyber text-sm font-bold px-3 py-1 rounded-sm ${
                        game.status === 'WIN' 
                            ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                            : 'text-red-400 bg-red-900/20 border border-red-500/30'
                    }">
                        ${game.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    // Méthode pour mettre à jour dynamiquement le bouton d'ami
    private updateFriendButton(status: string, data: any, profileContent: HTMLElement) {
        const btnContainer = profileContent.querySelector('.profile-action-btns');
        if (!btnContainer) return;

        let html = '';
        if (status === 'request_sent') {
            html = `
                <button class="add-friend-btn p-2 bg-cyber-dark border border-green-500/50 hover:border-green-500 text-green-400 text-sm rounded opacity-50" disabled>
                    REQUEST SENT
                </button>
                <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded">
                    BLOCK
                </button>
            `;
        } else if (status === 'none') {
            html = `
                <button class="add-friend-btn p-2 bg-cyber-dark border border-green-500/50 hover:border-green-500 text-green-400 text-sm rounded">
                    ADD FRIEND
                </button>
                <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded">
                    BLOCK
                </button>
            `;
        } else if (status === 'friends') {
            html = `
                <button class="remove-friend-btn p-2 bg-cyber-dark border border-red-500/50 hover:border-red-500 text-red-500 text-sm rounded">
                    REMOVE FRIEND
                </button>
                <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded">
                    BLOCK
                </button>
            `;
        }
        btnContainer.innerHTML = html;
        this.attachProfileActionListeners(data, profileContent);
    }

    // Ajoute les listeners sur les boutons d'action du profil
    private attachProfileActionListeners(data: any, profileContent: HTMLElement) {
        const addFriendBtn = profileContent.querySelector('.add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', async () => {
                addFriendBtn.setAttribute('disabled', 'true');
                addFriendBtn.textContent = 'SENDING...';
                try {
                    const response = await fetch(`/api/add_friend/${data.user_id || data.id || this.username}`, {
                        method: 'GET',
                        credentials: 'include',
                    });
                    if (response.ok) {
                        this.updateFriendButton('request_sent', data, profileContent);
                    } else {
                        addFriendBtn.textContent = 'ADD FRIEND';
                        addFriendBtn.removeAttribute('disabled');
                    }
                } catch {
                    addFriendBtn.textContent = 'ADD FRIEND';
                    addFriendBtn.removeAttribute('disabled');
                }
            });
        }

        const blockBtn = profileContent.querySelector('.block-user-btn');
        if (blockBtn) {
            blockBtn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to block this user?')) return;
                blockBtn.setAttribute('disabled', 'true');
                blockBtn.textContent = 'BLOCKING...';
                try {
                    const response = await fetch(`/api/users/${data.user_id || data.id || this.username}/block`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({}),
                        credentials: 'include',
                    });
                    if (response.ok) {
                        location.reload();
                    } else {
                        blockBtn.textContent = 'BLOCK';
                        blockBtn.removeAttribute('disabled');
                    }
                } catch {
                    blockBtn.textContent = 'BLOCK';
                    blockBtn.removeAttribute('disabled');
                }
            });
        }

        const removeFriendBtn = profileContent.querySelector('.remove-friend-btn');
        if (removeFriendBtn) {
            removeFriendBtn.addEventListener('click', async () => {
                if (!confirm('Are you sure you want to remove this friend?')) return;
                removeFriendBtn.setAttribute('disabled', 'true');
                removeFriendBtn.textContent = 'REMOVING...';
                try {
                    const response = await fetch(`/api/remove_friend/${data.user_id || data.id || this.username}`, {
                        method: 'GET',
                        credentials: 'include',
                    });
                    if (response.ok) {
                        this.updateFriendButton('none', data, profileContent);
                    } else {
                        removeFriendBtn.textContent = 'REMOVE FRIEND';
                        removeFriendBtn.removeAttribute('disabled');
                    }
                } catch {
                    removeFriendBtn.textContent = 'REMOVE FRIEND';
                    removeFriendBtn.removeAttribute('disabled');
                }
            });
        }

        // Ajout : listener pour le bouton "Send Message"
        const sendMessageBtn = profileContent.querySelector('.send-message-btn');
        if (sendMessageBtn) {
            sendMessageBtn.addEventListener('click', () => {
                // Redirige vers la page de chat privé et sélectionne l'ami
                window.location.href = '/livechat#private-' + data.id;
            });
        }
    }

    // Ajoute la logique WebSocket pour les notifications d'amis
    private setupFriendNotifications(data: any, profileContent: HTMLElement) {
        if ('WebSocket' in window) {
            this.friendWs = new WebSocket('wss://localhost:4430/api/ws/friend_notifications');
            this.friendWs.onmessage = (event) => {
                const wsData = JSON.parse(event.data);
                // Si la demande d'ami a été refusée et concerne ce profil
                if (
                    wsData.type === 'friend_request_declined' &&
                    (wsData.from === data.user_id || wsData.from === data.id)
                ) {
                    this.updateFriendButton('none', data, profileContent);
                }
                // Si la demande d'ami a été acceptée
                if (
                    wsData.type === 'friend_request_accepted' &&
                    (wsData.from === data.user_id || wsData.from === data.id)
                ) {
                    this.updateFriendButton('friends', data, profileContent);
                }
                // Si on reçoit une notification de suppression d'ami
                if (
                    wsData.type === 'friend_removed' &&
                    (wsData.from === data.user_id || wsData.from === data.id)
                ) {
                    this.updateFriendButton('none', data, profileContent);
                }
            };
        }
    }

    private setupOnlineStatusRealtime(data: any, profileContent: HTMLElement) {
        if ('WebSocket' in window) {
            this.onlineStatusWs = new WebSocket('wss://localhost:4430/api/ws/online_status');
            this.onlineStatusWs.onmessage = (event) => {
                const wsData = JSON.parse(event.data);
                if (wsData && (wsData.user_id === data.user_id || wsData.user_id === data.id)) {
                    // Update only the main online status badge in profile header
                    const badge = profileContent.querySelector('.profile-online-badge');
                    if (badge) {
                        if (wsData.type === 'online') {
                            badge.className = 'profile-online-badge font-cyber text-sm font-bold px-3 py-1 rounded-sm text-green-400 bg-green-900/20 border border-green-500/30';
                            badge.textContent = 'Online';
                        } else {
                            badge.className = 'profile-online-badge font-cyber text-sm font-bold px-3 py-1 rounded-sm text-red-400 bg-red-900/20 border border-red-500/30';
                            badge.textContent = 'Offline';
                        }
                    }
                }
            };
        }
    }

    async render(): Promise<HTMLElement> {
        this.container.innerHTML = '';
        await super.setupHeaderListeners();

        // Récupère avatar et username dynamiquement
        let data: any = {};
        let profileError = false;
        try {
            const res = await fetch(`/api/profile/${encodeURIComponent(this.username)}`, { credentials: 'include' });
            data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch profile');
            this.avatarUrl = data.avatar_url.startsWith('/')
                ? data.avatar_url
                : (data.avatar_url.startsWith('uploads/') ? '/' + data.avatar_url : '/uploads/' + data.avatar_url);
            this.username = data.username;
        } catch {
            profileError = true;
        }

        const profileContent = document.createElement('div');
        profileContent.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark'; // pt-16 -> pt-4

        if (profileError) {
            profileContent.innerHTML = `
                <main class="flex-1 flex flex-col items-center justify-center relative">
                    <div class="text-center">
                        <div class="text-red-500 text-4xl mb-4">🚫</div>
                        <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-4 tracking-wider text-center">
                            Profile Not Found
                        </h1>
                        <p class="text-gray-400 font-cyber text-sm mb-4">
                            The requested profile could not be loaded.
                        </p>
                    </div>
                </main>
            `;
            this.container.appendChild(profileContent);
            return this.container;
        }

        // --- BLOCKED LOGIC LIKE FRIENDS + REALTIME WEBSOCKET ---
        let isBlocked = !!data.is_blocked;

        // WebSocket for real-time block/unblock
        let ws: WebSocket | undefined;
        if ('WebSocket' in window) {
            ws = new WebSocket('wss://localhost:4430/api/ws/friend_notifications');
            ws.onmessage = (event) => {
                const wsData = JSON.parse(event.data);
                // Block/unblock events for this profile
                if (
                    (wsData.type === 'user_blocked' || wsData.type === 'user_unblocked') &&
                    (wsData.user_id === data.user_id || wsData.user_id === data.id || wsData.username === this.username)
                ) {
                    // Reload to reflect new block state
                    location.reload();
                }
            };
        }

        if (isBlocked) {
            // build sidebar + main with overlay
            profileContent.innerHTML = `
                <div class="min-h-screen pt-16 flex flex-row bg-cyber-dark">
                    <!-- Sidebar -->
                    ${await super.createSidebar()}
                    <!-- Main + overlay wrapper -->
                    <div class="relative flex-1 overflow-hidden">
                        <!-- Brume overlay -->
                        <div class="blocked-overlay absolute inset-0 bg-black/75 backdrop-blur-sm z-20 cursor-pointer"></div>
                        <!-- Contenu du profil (sous la brume) -->
                        <main class="relative z-10 flex-1 flex flex-col opacity-60 pointer-events-none">
                            <!-- Profile Header -->
                            <div class="p-8 pb-4">
                                <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-8 tracking-wider text-left">
                                    ${this.username}'s Profile
                                </h1>
                            </div>
                            
                            <div class="flex flex-col md:flex-row items-start md:items-center px-8 pb-8">
                                <div class="relative w-48 h-48 bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20 rounded-lg border-2 border-neon-pink flex items-center justify-center">
                                    <img src="${this.avatarUrl}" alt="${this.username}'s Avatar" class="w-full h-full object-cover rounded-lg" />
                                    <div class="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-neon-pink"></div>
                                    <div class="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-neon-cyan"></div>
                                    <div class="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-neon-cyan"></div>
                                    <div class="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-neon-pink"></div>
                                </div>
                                <div class="ml-8 flex-1">
                                    <h2 class="text-3xl font-cyber text-neon-cyan mb-2 flex items-center space-x-2">
                                        <span>${this.username}</span>
                                        <span class="profile-online-badge font-cyber text-sm font-bold px-3 py-1 rounded-sm ${
                                            data.is_online 
                                                ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                                                : 'text-red-400 bg-red-900/20 border border-red-500/30'
                                        }">
                                            ${data.is_online ? 'Online' : 'Offline'}
                                        </span>
                                    </h2>
                                    <p class="text-sm text-gray-400 mb-4">Last Online: ${
                                        data.last_online ? new Date(data.last_online).toLocaleString() : 'Never'
                                    }</p>
                                    <p class="text-sm text-gray-400 mb-4">Joined: ${
                                        data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Unknown'
                                    }</p>
                                    <!-- No action buttons when blocked -->
                                </div>
                            </div>
                            <!-- Stats and Game History (unchanged) -->
                            <div class="cyber-panel mx-8 mb-8 p-6 border-2 border-neon-cyan/30 bg-cyber-darker/80 backdrop-blur-sm relative">
                                <h2 class="text-2xl font-cyber font-bold text-neon-cyan mb-6 tracking-wider">PLAYER STATISTICS</h2>
                                <div class="grid grid-cols-3 gap-6">
                                    <div class="cyber-panel p-6 text-center bg-cyber-dark border border-neon-pink/30">
                                        <h3 class="text-yellow-400 font-bold font-cyber text-sm tracking-wider text-center">TOTAL GAMES</h3>
                                        <div class="text-4xl font-cyber text-white font-bold mt-2">1956</div>
                                    </div>
                                    <div class="cyber-panel p-6 text-center bg-cyber-dark border border-neon-pink/30">
                                        <h3 class="text-yellow-400 font-bold font-cyber text-sm tracking-wider text-center">WIN RATE</h3>
                                        <div class="text-4xl font-cyber text-green-400 font-bold mt-2">85%</div>
                                    </div>
                                    <div class="cyber-panel p-6 text-center bg-cyber-dark border border-neon-pink/30">
                                        <h3 class="text-yellow-400 font-bold font-cyber text-sm tracking-wider text-center">LOSS RATE</h3>
                                        <div class="text-4xl font-cyber text-red-400 font-bold mt-2">25%</div>
                                    </div>
                                </div>
                                <div class="cyber-panel mt-6 p-6 text-center bg-cyber-dark border border-neon-cyan/30">
                                    <h3 class="text-yellow-400 font-bold font-cyber text-sm tracking-wider text-center">LEVEL</h3>
                                    <div class="text-4xl font-cyber text-white font-bold mt-2">${data.level}</div>
                                    <div class="mt-4">
                                        <div class="flex justify-between text-sm text-gray-400 mb-2">
                                            <span>Level ${Math.max(data.level - 1, 0)}</span>
                                            <span>Level ${data.level + 1}</span>
                                        </div>
                                        <div class="w-full bg-gray-700 rounded-full h-4 relative">
                                            <div class="bg-neon-cyan h-4 rounded-full" style="width: ${(data.xp / 100) * 100}%;"></div>
                                            <span class="absolute inset-0 flex items-center justify-center text-sm text-white font-bold">
                                                ${data.xp} XP / ${data.xp + 100} XP
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="cyber-panel mx-8 mb-8 p-6 border-2 border-neon-pink/30 bg-cyber-darker/80 backdrop-blur-sm relative">
                                <h2 class="text-2xl font-cyber font-bold text-neon-pink mb-6 tracking-wider">GAME HISTORY</h2>
                                <div class="overflow-auto max-h-96 cyber-scrollbar">
                                    <table class="w-full table-fixed">
                                        <thead class="sticky top-0 bg-cyber-darker z-10">
                                            <tr class="border-b-2 border-neon-pink/30">
                                                <th class="w-1/6 text-yellow-400 font-cyber text-sm tracking-wider py-4 text-center">DATE</th>
                                                <th class="w-1/3 text-yellow-400 font-cyber text-sm tracking-wider py-4 text-center">GAME ROOM</th>
                                                <th class="w-1/6 text-yellow-400 font-cyber text-sm tracking-wider py-4 text-center">FRIEND</th>
                                                <th class="w-1/6 text-yellow-400 font-cyber text-sm tracking-wider py-4 text-center">SCORE</th>
                                                <th class="w-1/6 text-yellow-400 font-cyber text-sm tracking-wider py-4 text-center">RESULT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${this.generateGameRowsHTML()}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            `;
            // clic pour masquer temporairement la brume
            const overlay = profileContent.querySelector('.blocked-overlay');
            if (overlay) {
                overlay.addEventListener('click', () => {
                    overlay.classList.add('hidden');
                    setTimeout(() => overlay.classList.remove('hidden'), 8000);
                });
            }
            this.container.appendChild(profileContent);
            await super.setupSidebarListeners();
            return this.container;
        }

        // Normal profile content (with add friend/block)
        // détermination de l'état d'amitié
        // map pending->request_sent
        let status = data.friend_status as string;
        if (status === 'pending') status = 'request_sent';
        const isSent = status === 'request_sent';
        const isFriends = status === 'friends';

        // Only show unblock button if I have blocked this user
        let actionBtnsHtml = '';
        if (!data.isMyProfile) {
            if (data.i_blocked === true || data.i_blocked === 1 || data.i_blocked === "true") {
                actionBtnsHtml = `
                    <button class="unblock-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded">
                        UNBLOCK
                    </button>
                `;
            } else {
                actionBtnsHtml = (
                    isSent
                        ? `<button disabled class="add-friend-btn p-2 bg-cyber-dark border border-green-500/50 text-green-400 text-sm rounded opacity-50">
                             REQUEST SENT
                           </button>
                           <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded">
                             BLOCK
                           </button>`
                        : isFriends
                            ? `<button class="remove-friend-btn p-2 bg-cyber-dark border border-red-500/50 hover:border-red-500 text-red-500 text-sm rounded">
                                 REMOVE FRIEND
                               </button>
                               <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded">
                                 BLOCK
                               </button>
                               <button class="send-message-btn p-2 bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber text-sm rounded ml-2 hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300"
                                 data-user-id="${data.id}" data-username="${data.username}">
                                 SEND MESSAGE
                               </button>`
                            : `<button class="add-friend-btn p-2 bg-cyber-dark border border-green-500/50 hover:border-green-500 text-green-400 text-sm rounded">
                                 ADD FRIEND
                               </button>
                               <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded">
                                 BLOCK
                               </button>`
                );
            }
        }

        profileContent.innerHTML = `
            ${await super.createSidebar()}      

            <!-- Main Content -->
                <main class="flex-1 flex flex-col">
            <!-- Header Section -->
                <div class="p-4 pb-2">
                <div class="flex flex-col items-center mb-6">
                    <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-2 tracking-wider">${this.username}'S PROFILE</h1>
                    <div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto"></div>
                </div>
                </div>

                <div class="flex flex-col md:flex-row items-start md:items-center px-8 pb-8">
                    <div class="relative w-48 h-48 bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20 rounded-lg border-2 border-neon-pink flex items-center justify-center">
                        <img src="${this.avatarUrl}" alt="${this.username}'s Avatar" class="w-full h-full object-cover rounded-lg" />
                        <div class="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-neon-pink"></div>
                        <div class="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-neon-cyan"></div>
                        <div class="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-neon-cyan"></div>
                        <div class="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-neon-pink"></div>
                    </div>
                    <div class="ml-8 flex-1">
                        <h2 class="text-3xl font-cyber text-neon-cyan mb-2 flex items-center space-x-2">
                            <span>${this.username}</span>
                            <span class="profile-online-badge font-cyber text-sm font-bold px-3 py-1 rounded-sm ${
                                data.is_online 
                                    ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                                    : 'text-red-400 bg-red-900/20 border border-red-500/30'
                            }">
                                ${data.is_online ? 'Online' : 'Offline'}
                            </span>
                        </h2>
                        <p class="text-sm text-gray-400 mb-4">Last Online: ${
                            data.last_online ? new Date(data.last_online).toLocaleString() : 'Never'
                        }</p>
                        <p class="text-sm text-gray-400 mb-4">Joined: ${
                            data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Unknown'
                        }</p>
                        <div class="profile-action-btns flex space-x-4">
                          ${actionBtnsHtml}
                        </div>
                    </div>
                </div>
                <!-- Stats Content Container -->
                <div class="cyber-panel mx-8 mb-8 p-6 border-2 border-neon-cyan/30 bg-cyber-darker/80 backdrop-blur-sm relative">
                    <h2 class="text-2xl font-cyber font-bold text-neon-cyan mb-6 tracking-wider">PLAYER STATISTICS</h2>
                    
                    <div class="grid grid-cols-3 gap-6">
                        <div class="cyber-panel p-6 text-center bg-cyber-dark border border-neon-pink/30">
                            <h3 class="text-yellow-400 font-bold font-cyber text-sm tracking-wider text-center">TOTAL GAMES</h3>
                            <div class="text-4xl font-cyber text-white font-bold mt-2">1956</div>
                        </div>
                        
                        <div class="cyber-panel p-6 text-center bg-cyber-dark border border-neon-pink/30">
                            <h3 class="text-yellow-400 font-bold font-cyber text-sm tracking-wider text-center">WIN RATE</h3>
                            <div class="text-4xl font-cyber text-green-400 font-bold mt-2">85%</div>
                        </div>
                        
                        <div class="cyber-panel p-6 text-center bg-cyber-dark border border-neon-pink/30">
                            <h3 class="text-yellow-400 font-bold font-cyber text-sm tracking-wider text-center">LOSS RATE</h3>
                            <div class="text-4xl font-cyber text-red-400 font-bold mt-2">25%</div>
                        </div>
                    </div>

                    <!-- Level Section -->
                    <div class="cyber-panel mt-6 p-6 text-center bg-cyber-dark border border-neon-cyan/30">
                        <h3 class="text-yellow-400 font-bold font-cyber text-sm tracking-wider text-center">LEVEL</h3>
                        <div class="text-4xl font-cyber text-white font-bold mt-2">${data.level}</div>
                        <div class="mt-4">
                            <div class="flex justify-between text-sm text-gray-400 mb-2">
                                <span>Level ${Math.max(data.level - 1, 0)}</span>
                                <span>Level ${data.level + 1}</span>
                            </div>
                            <div class="w-full bg-gray-700 rounded-full h-4 relative">
                                <div class="bg-neon-cyan h-4 rounded-full" style="width: ${(data.xp / 100) * 100}%;"></div>
                                <span class="absolute inset-0 flex items-center justify-center text-sm text-white font-bold">
                                    ${data.xp} XP / ${data.xp + 100} XP
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Game History Section -->
                <div class="cyber-panel mx-8 mb-8 p-6 border-2 border-neon-pink/30 bg-cyber-darker/80 backdrop-blur-sm relative">
                    <h2 class="text-2xl font-cyber font-bold text-neon-pink mb-6 tracking-wider">GAME HISTORY</h2>

                    <div class="overflow-auto max-h-96 cyber-scrollbar">
                        <table class="w-full table-fixed">
                            <thead class="sticky top-0 bg-cyber-darker z-10">
                                <tr class="border-b-2 border-neon-pink/30">
                                    <th class="w-1/6 text-yellow-400 font-cyber text-sm tracking-wider py-4 text-center">DATE</th>
                                    <th class="w-1/3 text-yellow-400 font-cyber text-sm tracking-wider py-4 text-center">GAME ROOM</th>
                                    <th class="w-1/6 text-yellow-400 font-cyber text-sm tracking-wider py-4 text-center">FRIEND</th>
                                    <th class="w-1/6 text-yellow-400 font-cyber text-sm tracking-wider py-4 text-center">SCORE</th>
                                    <th class="w-1/6 text-yellow-400 font-cyber text-sm tracking-wider py-4 text-center">RESULT</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.generateGameRowsHTML()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        `;

        this.container.appendChild(profileContent);

        if (!data.isMyProfile) {
            if (data.i_blocked === true || data.i_blocked === 1 || data.i_blocked === "true") {
                const unblockButton = profileContent.querySelector('.unblock-user-btn');
                if (unblockButton) {
                    unblockButton.addEventListener('click', async () => {
                        unblockButton.setAttribute('disabled', 'true');
                        unblockButton.textContent = 'UNBLOCKING...';
                        try {
                            const response = await fetch(`/api/unblock_user/${data.user_id || data.id || this.username}`, {
                                method: 'GET',
                                credentials: 'include',
                            });
                            if (response.ok) {
                                location.reload();
                            } else {
                                unblockButton.textContent = 'UNBLOCK';
                                unblockButton.removeAttribute('disabled');
                            }
                        } catch {
                            unblockButton.textContent = 'UNBLOCK';
                            unblockButton.removeAttribute('disabled');
                        }
                    });
                }
                // Ne pas attacher les listeners add/block, NE PAS afficher les boutons add/block
            } else {
                let friendStatus = 'none';
                if (data.friend_status === 'request_sent') {
                    friendStatus = 'request_sent';
                } else if (data.friend_status === 'friends') {
                    friendStatus = 'friends';
                }
                this.updateFriendButton(friendStatus, data, profileContent);
                this.setupFriendNotifications(data, profileContent);
            }
        }

        // Ajout : bouton "Send Message" pour amis
        if (isFriends && !data.isMyProfile) {
            const btn = profileContent.querySelector('.send-message-btn');
            if (btn) {
                btn.addEventListener('click', () => {
                    // Redirige vers la page de chat privé et sélectionne l'ami
                    window.location.href = '/livechat#private-' + data.id;
                });
            }
        }

        this.setupOnlineStatusRealtime(data, profileContent);

        await super.setupSidebarListeners();
        return this.container;
    }
}

export default ProfilePage;