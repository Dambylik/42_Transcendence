import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';

// type GameHistoryEntry = {
//     date: string;
//     id: number;
//     room: string;
//     roomIcon: string;
//     friend: string;
//     score: string;
//     status: string;
// };

type MatchsHistory = {
    other_player : string;
    room_name : string;
    date : string;
    won : boolean;
    match_id : number;
};

class ProfilePage extends Page {
    private username: string = '';
    private avatarUrl: string = '';
    // private gameHistory: GameHistoryEntry[];

    // Ajoute une propriété pour garder la référence WebSocket
    private friendWs?: WebSocket;
    private onlineStatusWs?: WebSocket;

    // Ajouts d'Idriss pour les stats et historiques des matchs
    private nb_played : number = 0;
    private percent_won : number = 0;
    private percent_lost : number = 0;
    
    // Stats spécifiques pour Connect4
    private nb_played_connect4 : number = 0;
    private percent_won_connect4 : number = 0;
    private percent_lost_connect4 : number = 0;

    constructor(id: string, router?: Router, options?: { username: string }) {
        super(id, router);

        // Historique en dur
        // this.gameHistory = [
        //     {
        //         date: "2025-10-01",
        //         id: 1,
        //         room: "INFINITE ROOM",
        //         roomIcon: "🍚",
        //         friend: "JU-JU",
        //         score: "10-2",
        //         status: "WIN"
        //     },
        //     {
        //         date: "2025-10-01",
        //         id: 2,
        //         room: "RUGGED ROOM", 
        //         roomIcon: "🐼",
        //         friend: "OLGA",
        //         score: "0-2",
        //         status: "LOSS"
        //     },
        //     {
        //         date: "2025-10-01",
        //         id: 3,
        //         room: "IDRISS ROOM",
        //         roomIcon: "🐾", 
        //         friend: "SAMI",
        //         score: "10-8",
        //         status: "WIN"
        //     }
        // ];

        if (options?.username) {
            this.username = options.username;
        }


        // A faire : stocker les données du profil (matchs history et stats)

    }

    // Récupère la liste des matchs 1v1
    private async getStatsAndMatchs(id_profile : number)
    {
        // Pour TEST UNIQUEMENT
        // id_profile = 171;
        // let room_id = document.getElementById('idRoom').value;
        try {
            const response = await fetch('https://localhost:4430/api/matchs_profile/' + id_profile, {
            method: 'GET',
            credentials: 'include'
            });

            if (!response.ok)
            {
            throw new Error('erreur http : ' + response.status);
            }

            const result = await response.json();
            if (result.success == false)
            {
                // alert("cannot get results");
            }
            else
            {
                // On change la liste des matchs et stats dans la classe
                // alert(JSON.stringify(result));
                // alert("id profile = " + id_profile);
                // alert(this.nb_played + "" + this.percent_won + "" + this.percent_lost + "");
                this.nb_played = result.nb_played;
                this.percent_won = result.percent_won; 
                this.percent_lost = result.percent_lost; 
                return (result);
            }
            // alert("resultat envoi formulaire (join room) : " + JSON.stringify(result));
            return (result);
        } catch (err)
        {
            // alert("erreur denvoi formulaire create room");
        }

    }

    // Récupère la liste des matchs 1v1 Pong
    private async getPongMatchs(id_profile: number) {
        try {
            const response = await fetch('https://localhost:4430/api/matchs_profile/' + id_profile, {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('erreur http : ' + response.status);
            const result = await response.json();
            if (result.success === false) return [];
            // Filtre uniquement les matchs Pong (par défaut ou game_type absent)
            return (result.matchs || []).filter((m: any) => !m.game_type || m.game_type === 'pong');
        } catch (err) {
            return [];
        }
    }

    // Récupère la liste des matchs 1v1 Connect4
    private async getConnect4Matchs(id_profile: number) {
        try {
            // Utilise le même endpoint que Pong, car le backend renvoie tous les matchs
            const response = await fetch('https://localhost:4430/api/matchs_profile/' + id_profile, {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('erreur http : ' + response.status);
            const result = await response.json();
            if (result.success === false) return [];
            
            // Calcule les stats pour Connect4
            const connect4Matchs = (result.matchs || []).filter((m: any) => m.game_type === 'connect4');
            
            this.nb_played_connect4 = connect4Matchs.length;
            const wins = connect4Matchs.filter((m: any) => m.won === true).length;
            this.percent_won_connect4 = this.nb_played_connect4 > 0 ? Math.round((wins / this.nb_played_connect4) * 100) : 0;
            this.percent_lost_connect4 = this.nb_played_connect4 > 0 ? Math.round(((this.nb_played_connect4 - wins) / this.nb_played_connect4) * 100) : 0;
            
            // Filtre uniquement les matchs Connect4
            return connect4Matchs;
        } catch (err) {
            console.error('Error fetching Connect4 matchs:', err);
            return [];
        }
    }

    // Génère le HTML pour les lignes de matchs Pong
    private async generatePongGameRowsHTML(id_profile: number) {
        const matchs: MatchsHistory[] = await this.getPongMatchs(id_profile);
        return matchs.map(game => `
            <tr class="border-b border-gray-700/50 hover:bg-cyber-dark/70 transition-colors">
                <td class="py-4 text-center">
                    <span class="text-white font-tech">${game.date}</span>
                </td>    
                <td class="py-4 text-center">
                    <div class="flex items-center justify-center space-x-3">
                        <span class="text-white font-tech">${game.room_name}</span>
                    </div>
                </td>
                <td class="py-4 text-center">
                    <span class="text-white font-tech">${game.other_player}</span>
                </td>
                <td class="py-4 text-center">
                    <span class="font-cyber text-sm font-bold px-3 py-1 rounded-sm ${
                        game.won === true 
                            ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                            : 'text-red-400 bg-red-900/20 border border-red-500/30'
                    }">
                        ${game.won === true ? "won" : "lost"}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    // Génère le HTML pour les lignes de matchs Connect4
    private async generateConnect4GameRowsHTML(id_profile: number) {
        const matchs: MatchsHistory[] = await this.getConnect4Matchs(id_profile);
        
        if (matchs.length === 0) {
            return `<tr><td colspan="4" class="py-8 text-center text-gray-400 font-cyber">No Connect4 matches found</td></tr>`;
        }
        
        return matchs.map(game => `
            <tr class="border-b border-gray-700/50 hover:bg-cyber-dark/70 transition-colors">
                <td class="py-4 text-center">
                    <span class="text-white font-tech">${game.date}</span>
                </td>    
                <td class="py-4 text-center">
                    <div class="flex items-center justify-center space-x-3">
                        <span class="text-white font-tech">${game.room_name}</span>
                    </div>
                </td>
                <td class="py-4 text-center">
                    <span class="text-white font-tech">${game.other_player}</span>
                </td>
                <td class="py-4 text-center">
                    <span class="font-cyber text-sm font-bold px-3 py-1 rounded-sm ${
                        game.won === true 
                            ? 'text-green-400 bg-green-900/20 border border-green-500/30' 
                            : 'text-red-400 bg-red-900/20 border border-red-500/30'
                    }">
                        ${game.won === true ? "won" : "lost"}
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

        // Je récupère les données stats du profile ainsi que l'historique des matchs
        await this.getStatsAndMatchs(data.id);
        // Prépare les historiques séparés (et calcule les stats Connect4)
        const pongRows = await this.generatePongGameRowsHTML(data.id);
        const connect4Rows = await this.generateConnect4GameRowsHTML(data.id);

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
                                        data.last_online ? new Date(data.last_online + 'Z').toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) : 'Never'
                                    }</p>
                                    <p class="text-sm text-gray-400 mb-4">Joined: ${
                                        data.created_at ? new Date(data.created_at + 'Z').toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) : 'Unknown'
                                    }</p>
                                    <!-- No action buttons when blocked -->
                                </div>
                            </div>
                            <!-- Stats and Game History (with improved design) -->
                            <div class="mx-8 mb-8">
                                <div class="flex items-center justify-center mb-8">
                                    <h1 class="text-3xl font-cyber text-neon-cyan animate-glow-pulse tracking-wider">GAME STATISTICS</h1>
                                </div>
                                
                                <!-- Combined Stats Panel -->
                                <div class="cyber-panel p-6 border-2 border-neon-cyan/30 bg-cyber-darker/80 backdrop-blur-sm relative">
                                    <div class="grid grid-cols-2 gap-8">
                                        <!-- Pong Stats -->
                                        <div class="border-r border-gray-600/50 pr-8">
                                            <div class="flex items-center justify-center mb-4">
                                                <div class="w-10 h-10 bg-neon-cyan/20 rounded-lg border border-neon-cyan flex items-center justify-center mr-3">
                                                    <span class="text-neon-cyan font-cyber text-lg">🏓</span>
                                                </div>
                                                <h3 class="text-xl font-cyber font-bold text-neon-cyan tracking-wider">PONG</h3>
                                            </div>
                                            <div class="grid grid-cols-1 gap-4">
                                                <div class="text-center">
                                                    <div class="text-2xl font-cyber text-white font-bold">1956</div>
                                                    <div class="text-sm text-gray-400 font-cyber">Total Games</div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="text-2xl font-cyber text-green-400 font-bold">85%</div>
                                                    <div class="text-sm text-gray-400 font-cyber">Win Rate</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Connect4 Stats -->
                                        <div class="pl-8">
                                            <div class="flex items-center justify-center mb-4">
                                                <div class="w-10 h-10 bg-neon-pink/20 rounded-lg border border-neon-pink flex items-center justify-center mr-3">
                                                    <span class="text-neon-pink font-cyber text-lg">🔴</span>
                                                </div>
                                                <h3 class="text-xl font-cyber font-bold text-neon-pink tracking-wider">CONNECT4</h3>
                                            </div>
                                            <div class="grid grid-cols-1 gap-4">
                                                <div class="text-center">
                                                    <div class="text-2xl font-cyber text-white font-bold">342</div>
                                                    <div class="text-sm text-gray-400 font-cyber">Total Games</div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="text-2xl font-cyber text-green-400 font-bold">78%</div>
                                                    <div class="text-sm text-gray-400 font-cyber">Win Rate</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mx-8 mb-8">
                                <div class="flex items-center justify-center mb-8">
                                    <h1 class="text-3xl font-cyber text-neon-purple animate-glow-pulse tracking-wider">MATCH HISTORY</h1>
                                </div>
                                
                                <div class="cyber-panel p-6 border-2 border-gray-500/30 bg-cyber-darker/80 backdrop-blur-sm relative">
                                    <div class="text-center py-8">
                                        <div class="text-gray-400 text-4xl mb-4">🔒</div>
                                        <h3 class="text-xl font-cyber text-gray-400 mb-2">MATCH HISTORY BLOCKED</h3>
                                        <p class="text-sm text-gray-500 font-cyber">Match history is not available for blocked users</p>
                                    </div>
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
                            data.last_online ? new Date(data.last_online + 'Z').toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }) : 'Never'
                        }</p>
                        <p class="text-sm text-gray-400 mb-4">Joined: ${
                            data.created_at ? new Date(data.created_at + 'Z').toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) : 'Unknown'
                        }</p>
                        <div class="profile-action-btns flex space-x-4">
                          ${actionBtnsHtml}
                        </div>
                    </div>
                </div>
                <!-- Game Stats Section -->
                <div class="mx-8 mb-8">
                    <div class="flex items-center justify-center mb-8">
                        <h1 class="text-3xl font-cyber text-neon-cyan animate-glow-pulse tracking-wider">GAME STATISTICS</h1>
                    </div>
                    
                    <!-- Pong Stats -->
                    <div class="cyber-panel mb-6 p-6 border-2 border-neon-cyan/50 bg-gradient-to-br from-neon-cyan/10 to-cyber-darker/80 backdrop-blur-sm relative overflow-hidden">
                        <!-- Pong Background Pattern -->
                        <div class="absolute inset-0 opacity-5">
                            <div class="absolute top-4 left-4 w-2 h-2 bg-neon-cyan rounded-full"></div>
                            <div class="absolute top-4 right-4 w-2 h-2 bg-neon-cyan rounded-full"></div>
                            <div class="absolute bottom-4 left-4 w-2 h-2 bg-neon-cyan rounded-full"></div>
                            <div class="absolute bottom-4 right-4 w-2 h-2 bg-neon-cyan rounded-full"></div>
                            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-neon-cyan rounded-full"></div>
                        </div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center justify-center mb-6">
                                <div class="w-10 h-10 bg-neon-cyan/20 rounded-lg border border-neon-cyan flex items-center justify-center mr-4">
                                    <span class="text-neon-cyan font-cyber text-lg">🏓</span>
                                </div>
                                <h2 class="text-2xl font-cyber font-bold text-neon-cyan tracking-wider">PONG STATISTICS</h2>
                                <div class="ml-4 h-1 w-20 bg-gradient-to-r from-neon-cyan to-transparent"></div>
                            </div>
                            
                            <div class="grid grid-cols-3 gap-6">
                                <div class="cyber-panel p-6 text-center bg-cyber-dark/60 border border-neon-cyan/40 hover:border-neon-cyan/80 transition-all duration-300">
                                    <h3 class="text-neon-cyan font-bold font-cyber text-sm tracking-wider text-center mb-2">TOTAL GAMES</h3>
                                    <div class="text-4xl font-cyber text-white font-bold mt-2">${this.nb_played}</div>
                                </div>
                                
                                <div class="cyber-panel p-6 text-center bg-cyber-dark/60 border border-neon-cyan/40 hover:border-neon-cyan/80 transition-all duration-300">
                                    <h3 class="text-neon-cyan font-bold font-cyber text-sm tracking-wider text-center mb-2">WIN RATE</h3>
                                    <div class="text-4xl font-cyber text-green-400 font-bold mt-2">${this.percent_won}%</div>
                                </div>
                                
                                <div class="cyber-panel p-6 text-center bg-cyber-dark/60 border border-neon-cyan/40 hover:border-neon-cyan/80 transition-all duration-300">
                                    <h3 class="text-neon-cyan font-bold font-cyber text-sm tracking-wider text-center mb-2">LOSS RATE</h3>
                                    <div class="text-4xl font-cyber text-red-400 font-bold mt-2">${this.percent_lost}%</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Connect4 Stats -->
                    <div class="cyber-panel p-6 border-2 border-neon-pink/50 bg-gradient-to-br from-neon-pink/10 to-cyber-darker/80 backdrop-blur-sm relative overflow-hidden">
                        <!-- Connect4 Background Pattern -->
                        <div class="absolute inset-0 opacity-5">
                            <div class="absolute top-4 left-8 grid grid-cols-7 gap-1">
                                ${Array(42).fill(0).map((_, i) => `<div class="w-2 h-2 bg-neon-pink rounded-full"></div>`).join('')}
                            </div>
                        </div>
                        
                        <div class="relative z-10">
                            <div class="flex items-center justify-center mb-6">
                                <div class="w-10 h-10 bg-neon-pink/20 rounded-lg border border-neon-pink flex items-center justify-center mr-4">
                                    <span class="text-neon-pink font-cyber text-lg">🔴</span>
                                </div>
                                <h2 class="text-2xl font-cyber font-bold text-neon-pink tracking-wider">CONNECT4 STATISTICS</h2>
                                <div class="ml-4 h-1 w-20 bg-gradient-to-r from-neon-pink to-transparent"></div>
                            </div>
                            
                            <div class="grid grid-cols-3 gap-6">
                                <div class="cyber-panel p-6 text-center bg-cyber-dark/60 border border-neon-pink/40 hover:border-neon-pink/80 transition-all duration-300">
                                    <h3 class="text-neon-pink font-bold font-cyber text-sm tracking-wider text-center mb-2">TOTAL GAMES</h3>
                                    <div class="text-4xl font-cyber text-white font-bold mt-2">${this.nb_played_connect4}</div>
                                </div>
                                
                                <div class="cyber-panel p-6 text-center bg-cyber-dark/60 border border-neon-pink/40 hover:border-neon-pink/80 transition-all duration-300">
                                    <h3 class="text-neon-pink font-bold font-cyber text-sm tracking-wider text-center mb-2">WIN RATE</h3>
                                    <div class="text-4xl font-cyber text-green-400 font-bold mt-2">${this.percent_won_connect4}%</div>
                                </div>
                                
                                <div class="cyber-panel p-6 text-center bg-cyber-dark/60 border border-neon-pink/40 hover:border-neon-pink/80 transition-all duration-300">
                                    <h3 class="text-neon-pink font-bold font-cyber text-sm tracking-wider text-center mb-2">LOSS RATE</h3>
                                    <div class="text-4xl font-cyber text-red-400 font-bold mt-2">${this.percent_lost_connect4}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Game History Section -->
                <div class="mx-8 mb-8">
                    <div class="flex items-center justify-center mb-8">
                        <h1 class="text-3xl font-cyber text-neon-purple animate-glow-pulse tracking-wider">MATCH HISTORY</h1>
                    </div>
                    
                    <!-- Pong History -->
                    <div class="cyber-panel mb-6 p-6 border-2 border-neon-cyan/50 bg-gradient-to-br from-neon-cyan/5 to-cyber-darker/90 backdrop-blur-sm relative">
                        <div class="flex items-center justify-between mb-6">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-neon-cyan/20 rounded-lg border border-neon-cyan flex items-center justify-center mr-4">
                                    <span class="text-neon-cyan font-cyber text-2xl">🏓</span>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-cyber font-bold text-neon-cyan tracking-wider">PONG MATCHES</h2>
                                    <div class="text-sm text-gray-400 font-cyber">Classic paddle game battles</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-cyber text-neon-cyan font-bold">${this.nb_played}</div>
                                <div class="text-sm text-gray-400 font-cyber">Total Games</div>
                            </div>
                        </div>
                        
                        <div class="overflow-auto max-h-96 cyber-scrollbar">
                            <table class="w-full table-fixed">
                                <thead class="sticky top-0 bg-cyber-darker/90 z-10">
                                    <tr class="border-b-2 border-neon-cyan/40">
                                        <th class="w-1/6 text-neon-cyan font-cyber text-sm tracking-wider py-4 text-center">DATE</th>
                                        <th class="w-1/3 text-neon-cyan font-cyber text-sm tracking-wider py-4 text-center">GAME ROOM</th>
                                        <th class="w-1/6 text-neon-cyan font-cyber text-sm tracking-wider py-4 text-center">OPPONENT</th>
                                        <th class="w-1/6 text-neon-cyan font-cyber text-sm tracking-wider py-4 text-center">RESULT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${pongRows || '<tr><td colspan="4" class="py-8 text-center text-gray-400 font-cyber">No Pong matches found</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Connect4 History -->
                    <div class="cyber-panel p-6 border-2 border-neon-pink/50 bg-gradient-to-br from-neon-pink/5 to-cyber-darker/90 backdrop-blur-sm relative">
                        <div class="flex items-center justify-between mb-6">
                            <div class="flex items-center">
                                <div class="w-12 h-12 bg-neon-pink/20 rounded-lg border border-neon-pink flex items-center justify-center mr-4">
                                    <span class="text-neon-pink font-cyber text-2xl">🔴</span>
                                </div>
                                <div>
                                    <h2 class="text-2xl font-cyber font-bold text-neon-pink tracking-wider">CONNECT4 MATCHES</h2>
                                    <div class="text-sm text-gray-400 font-cyber">Four in a row strategy games</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-2xl font-cyber text-neon-pink font-bold">${this.nb_played_connect4}</div>
                                <div class="text-sm text-gray-400 font-cyber">Total Games</div>
                            </div>
                        </div>
                        
                        <div class="overflow-auto max-h-96 cyber-scrollbar">
                            <table class="w-full table-fixed">
                                <thead class="sticky top-0 bg-cyber-darker/90 z-10">
                                    <tr class="border-b-2 border-neon-pink/40">
                                        <th class="w-1/6 text-neon-pink font-cyber text-sm tracking-wider py-4 text-center">DATE</th>
                                        <th class="w-1/3 text-neon-pink font-cyber text-sm tracking-wider py-4 text-center">GAME ROOM</th>
                                        <th class="w-1/6 text-neon-pink font-cyber text-sm tracking-wider py-4 text-center">OPPONENT</th>
                                        <th class="w-1/6 text-neon-pink font-cyber text-sm tracking-wider py-4 text-center">RESULT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${connect4Rows}
                                </tbody>
                            </table>
                        </div>
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

        // alert(data.id);

        await super.setupSidebarListeners();
        return this.container;
    }
}

export default ProfilePage;