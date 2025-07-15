import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import { showNotification } from '../../utils/notifications';

interface Player {
    user_id: number;
    username: string;
}

interface Match {
    id_match: number;
    first_player: string;
    second_player: string;
    finished: boolean;
    first_player_id: number;
    second_player_id: number;
}

interface RoomData {
    room_id: number;
    admin: boolean;
    room_name: string;
    user_id: number;
}

class TournamentPage extends Page {
    private websocket: WebSocket | null = null;
    private roomData: RoomData | null = null;
    private isAdmin: boolean = false;
    private currentMatches: Match[] = [];
    private players: Player[] = [];

    constructor(id: string, router?: Router) {
        super(id, router);
    }

    async render(): Promise<HTMLElement> {
        this.container.innerHTML = '';
        await super.setupHeaderListeners();

        const tournamentContent = document.createElement('div');
        tournamentContent.className = 'min-h-screen pt-16 relative overflow-hidden flex flex-row bg-cyber-dark';
        tournamentContent.innerHTML = `
            ${await super.createSidebar()}
            <main class="flex-1 flex flex-col relative">
                <!-- Background Effects -->
                <div class="absolute inset-0 z-0">
                    <div class="absolute inset-0 bg-grid-overlay opacity-20"></div>
                    <div class="absolute inset-0 scanlines"></div>
                </div>
                
                <!-- Main Content -->
                <div class="relative z-10 p-8">
                    <!-- Header Section -->
                    <div class="text-center mb-8">
                        <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-4 tracking-wider">TOURNAMENT HUB</h1>
                        <div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto mb-4"></div>
                        <p class="text-neon-cyan font-cyber text-xl">COMPETE IN EPIC TOURNAMENTS</p>
                    </div>

                    <!-- Tournament Status Container -->
                    <div id="tournament-status-container" class="max-w-6xl mx-auto">
                        <!-- Not in Room View -->
                        <div id="not-in-room-view" class="space-y-8">
                            <!-- Create Room Section -->
                            <div class="bg-cyber-darker/80 border-2 border-neon-pink/40 rounded-lg p-6 backdrop-blur-sm">
                                <h2 class="text-2xl font-cyber text-neon-pink mb-4">CREATE TOURNAMENT</h2>
                                <div class="flex flex-col md:flex-row gap-4 items-end">
                                    <div class="flex-1">
                                        <label class="block text-neon-cyan font-tech text-sm mb-2">Tournament Name</label>
                                        <input 
                                            type="text" 
                                            id="room-name-input" 
                                            placeholder="Enter tournament name"
                                            class="w-full bg-cyber-dark border-2 border-neon-pink/30 text-white px-4 py-3 rounded font-tech"
                                        />
                                    </div>
                                    <button 
                                        id="create-room-btn" 
                                        class="bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-6 py-3 rounded hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300"
                                    >
                                        CREATE TOURNAMENT
                                    </button>
                                </div>
                            </div>

                            <!-- Join Room Section -->
                            <div class="bg-cyber-darker/80 border-2 border-neon-cyan/40 rounded-lg p-6 backdrop-blur-sm">
                                <h2 class="text-2xl font-cyber text-neon-cyan mb-4">JOIN TOURNAMENT</h2>
                                <div class="flex flex-col md:flex-row gap-4 items-end">
                                    <div class="flex-1">
                                        <label class="block text-neon-cyan font-tech text-sm mb-2">Tournament ID</label>
                                        <input 
                                            type="number" 
                                            id="room-id-input" 
                                            placeholder="Enter tournament ID"
                                            class="w-full bg-cyber-dark border-2 border-neon-cyan/30 text-white px-4 py-3 rounded font-tech"
                                        />
                                    </div>
                                    <button 
                                        id="join-room-btn" 
                                        class="bg-gradient-to-r from-neon-cyan to-neon-pink text-white font-cyber px-6 py-3 rounded hover:shadow-lg hover:shadow-neon-cyan/50 transition-all duration-300"
                                    >
                                        JOIN TOURNAMENT
                                    </button>
                                </div>
                            </div>

                            <!-- Invitations Section -->
                            <div id="invitations-section" class="bg-cyber-darker/80 border-2 border-yellow-500/40 rounded-lg p-6 backdrop-blur-sm">
                                <h2 class="text-2xl font-cyber text-yellow-400 mb-4">TOURNAMENT INVITATIONS</h2>
                                <div id="invitations-list" class="space-y-3">
                                    <div class="text-center text-gray-400">Loading invitations...</div>
                                </div>
                            </div>
                        </div>

                        <!-- In Room View -->
                        <div id="in-room-view" class="hidden space-y-8">
                            <!-- Room Info -->
                            <div class="bg-cyber-darker/80 border-2 border-neon-pink/40 rounded-lg p-6 backdrop-blur-sm">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <h2 id="room-name-display" class="text-2xl font-cyber text-neon-pink mb-2"></h2>
                                        <p id="room-id-display" class="text-neon-cyan font-tech"></p>
                                    </div>
                                    <div class="space-x-4">
                                        <button id="invite-player-btn" class="bg-cyber-dark border border-neon-cyan text-neon-cyan px-4 py-2 rounded hover:bg-neon-cyan hover:text-cyber-dark transition-all duration-300">
                                            INVITE PLAYER
                                        </button>
                                        <button id="leave-room-btn" class="bg-cyber-dark border border-red-500 text-red-400 px-4 py-2 rounded hover:bg-red-500 hover:text-white transition-all duration-300">
                                            LEAVE TOURNAMENT
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Players and Matches Grid -->
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <!-- Players Section -->
                                <div class="bg-cyber-darker/80 border-2 border-neon-cyan/40 rounded-lg p-6 backdrop-blur-sm">
                                    <h3 class="text-xl font-cyber text-neon-cyan mb-4">PLAYERS</h3>
                                    <div id="players-list" class="space-y-2">
                                        <div class="text-center text-gray-400">Loading players...</div>
                                    </div>
                                    <div id="admin-controls" class="mt-6 space-y-3 hidden">
                                        <button id="start-tournament-btn" class="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-cyber px-4 py-3 rounded hover:shadow-lg transition-all duration-300">
                                            START TOURNAMENT
                                        </button>
                                        <button id="close-room-btn" class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-cyber px-4 py-3 rounded hover:shadow-lg transition-all duration-300">
                                            CLOSE TOURNAMENT
                                        </button>
                                    </div>
                                </div>

                                <!-- Current Matches Section -->
                                <div class="bg-cyber-darker/80 border-2 border-yellow-500/40 rounded-lg p-6 backdrop-blur-sm">
                                    <h3 class="text-xl font-cyber text-yellow-400 mb-4">CURRENT MATCHES</h3>
                                    <div id="matches-list" class="space-y-3">
                                        <div class="text-center text-gray-400">No matches yet</div>
                                    </div>
                                    <div id="my-match-section" class="mt-6 hidden">
                                        <button id="join-match-btn" class="w-full bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-4 py-3 rounded hover:shadow-lg transition-all duration-300">
                                            JOIN MY MATCH
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Tournament Winner Section -->
                            <div id="winner-section" class="hidden bg-cyber-darker/80 border-2 border-gold/40 rounded-lg p-6 backdrop-blur-sm text-center">
                                <h2 class="text-3xl font-cyber text-yellow-400 mb-4">🏆 TOURNAMENT COMPLETE 🏆</h2>
                                <p id="winner-display" class="text-2xl text-neon-pink font-cyber"></p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        `;

        this.container.appendChild(tournamentContent);
        await super.setupSidebarListeners();
        
        // Initialize tournament page
        await this.initializePage();
        this.setupEventListeners();

        return this.container;
    }

    private async initializePage(): Promise<void> {
        try {
            // Check if already in a room
            const inRoomResponse = await fetch('/api/already_in_room', {
                credentials: 'include'
            });
            const inRoomData = await inRoomResponse.json();

            if (inRoomData.success && inRoomData.in_room) {
                await this.loadRoomData();
                this.showInRoomView();
            } else {
                this.showNotInRoomView();
                await this.loadInvitations();
            }
        } catch (error) {
            console.error('Error initializing tournament page:', error);
            this.showNotInRoomView();
        }
    }

    private async loadRoomData(): Promise<void> {
        try {
            // Get room info and players
            const roomResponse = await fetch('/api/rooms_players/0', {
                credentials: 'include'
            });
            const roomData = await roomResponse.json();

            if (roomData.success) {
                this.players = roomData.tabl_players;
                this.updatePlayersDisplay();
            }

            // Check if admin
            const adminResponse = await fetch('/api/im_admin/0', {
                credentials: 'include'
            });
            const adminData = await adminResponse.json();
            
            if (adminData.success) {
                this.isAdmin = adminData.admin;
                if (this.isAdmin) {
                    const adminControls = document.getElementById('admin-controls');
                    if (adminControls) adminControls.classList.remove('hidden');
                }
            }

            // Get current matches
            await this.loadMatches();

            // Connect to WebSocket
            await this.connectWebSocket();

        } catch (error) {
            console.error('Error loading room data:', error);
        }
    }

    private async loadMatches(): Promise<void> {
        try {
            const matchesResponse = await fetch('/api/matchs_current/0', {
                credentials: 'include'
            });
            const matchesData = await matchesResponse.json();

            if (matchesData.success) {
                this.currentMatches = matchesData.matchs;
                this.updateMatchesDisplay();
                this.checkMyMatch();
            }
        } catch (error) {
            console.error('Error loading matches:', error);
        }
    }

    private async loadInvitations(): Promise<void> {
        try {
            const response = await fetch('/api/my_invitations', {
                credentials: 'include'
            });
            const data = await response.json();

            const invitationsList = document.getElementById('invitations-list');
            if (!invitationsList) return;

            if (data.success && data.tabl_invitations.length > 0) {
                invitationsList.innerHTML = '';
                data.tabl_invitations.forEach((invitation: any) => {
                    const inviteElement = document.createElement('div');
                    inviteElement.className = 'flex justify-between items-center p-3 bg-cyber-dark border border-yellow-500/30 rounded';
                    inviteElement.innerHTML = `
                        <span class="text-white">Tournament ID: ${invitation.room_id}</span>
                        <div class="space-x-2">
                            <button onclick="this.acceptInvitation(${invitation.room_id})" class="bg-green-600 text-white px-3 py-1 rounded text-sm">Accept</button>
                            <button onclick="this.declineInvitation(${invitation.room_id})" class="bg-red-600 text-white px-3 py-1 rounded text-sm">Decline</button>
                        </div>
                    `;
                    invitationsList.appendChild(inviteElement);
                });
            } else {
                invitationsList.innerHTML = '<div class="text-center text-gray-400">No invitations found</div>';
            }
        } catch (error) {
            console.error('Error loading invitations:', error);
            const invitationsList = document.getElementById('invitations-list');
            if (invitationsList) {
                invitationsList.innerHTML = '<div class="text-center text-red-400">Failed to load invitations</div>';
            }
        }
    }

    private async connectWebSocket(): Promise<void> {
        if (!this.roomData) return;

        try {
            this.websocket = new WebSocket(`wss://localhost:4430/api/ws/join_room/${this.roomData.room_id}`);
            
            this.websocket.onopen = () => {
                console.log('Connected to tournament WebSocket');
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.websocket.onerror = (error) => {
                //console.error('WebSocket error:', error);
            };

            this.websocket.onclose = () => {
               //console.log('WebSocket connection closed');
            };

            // Keep alive
            setInterval(() => {
                if (this.websocket?.readyState === WebSocket.OPEN) {
                    this.websocket.send('ping');
                }
            }, 30000);

        } catch (error) {
            console.error('Error connecting to WebSocket:', error);
        }
    }

    private handleWebSocketMessage(data: any): void {
        if (data.success) {
            switch (data.cause) {
                case 'user_joined':
                case 'kick':
                    this.loadRoomData();
                    break;
                case 'list_matchs':
                    this.currentMatches = data.matchs;
                    this.updateMatchesDisplay();
                    this.checkMyMatch();
                    break;
                case 'tournament_stopped':
                    showNotification('Tournament has been stopped', 'success');
                    this.showNotInRoomView();
                    break;
                case 'end_of_tournament':
                    this.showWinner(data.winner);
                    break;
            }
        }
    }

    private setupEventListeners(): void {
        // Create room
        const createRoomBtn = document.getElementById('create-room-btn');
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', this.createRoom.bind(this));
        }

        // Join room
        const joinRoomBtn = document.getElementById('join-room-btn');
        if (joinRoomBtn) {
            joinRoomBtn.addEventListener('click', this.joinRoom.bind(this));
        }

        // Leave room
        const leaveRoomBtn = document.getElementById('leave-room-btn');
        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', this.leaveRoom.bind(this));
        }

        // Start tournament
        const startTournamentBtn = document.getElementById('start-tournament-btn');
        if (startTournamentBtn) {
            startTournamentBtn.addEventListener('click', this.startTournament.bind(this));
        }

        // Close room
        const closeRoomBtn = document.getElementById('close-room-btn');
        if (closeRoomBtn) {
            closeRoomBtn.addEventListener('click', this.closeRoom.bind(this));
        }

        // Join match
        const joinMatchBtn = document.getElementById('join-match-btn');
        if (joinMatchBtn) {
            joinMatchBtn.addEventListener('click', this.joinMatch.bind(this));
        }

        // Invite player
        const invitePlayerBtn = document.getElementById('invite-player-btn');
        if (invitePlayerBtn) {
            invitePlayerBtn.addEventListener('click', this.invitePlayer.bind(this));
        }
    }

    private async createRoom(): Promise<void> {
        const roomNameInput = document.getElementById('room-name-input') as HTMLInputElement;
        if (!roomNameInput || !roomNameInput.value.trim()) {
            showNotification('Please enter a tournament name', 'error');
            return;
        }

        try {
            const response = await fetch('/api/create_room', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: roomNameInput.value.trim()
                })
            });

            const data = await response.json();
            if (data.success) {
                this.roomData = {
                    room_id: data.room_id,
                    admin: true,
                    room_name: roomNameInput.value.trim(),
                    user_id: data.user_id
                };
                
                // Join the room we just created
                await this.joinRoomById(data.room_id);
                showNotification('Tournament created successfully!', 'success');
            } else {
                throw new Error(data.error || 'Failed to create tournament');
            }
        } catch (error) {
            console.error('Error creating room:', error);
            showNotification('Failed to create tournament', 'error');
        }
    }

    private async joinRoom(): Promise<void> {
        const roomIdInput = document.getElementById('room-id-input') as HTMLInputElement;
        if (!roomIdInput || !roomIdInput.value) {
            showNotification('Please enter a tournament ID', 'error');
            return;
        }

        const roomId = parseInt(roomIdInput.value);
        if (isNaN(roomId)) {
            showNotification('Please enter a valid tournament ID', 'error');
            return;
        }

        await this.joinRoomById(roomId);
    }

    private async joinRoomById(roomId: number): Promise<void> {
        try {
            const response = await fetch(`/api/join_room/${roomId}`, {
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                this.roomData = {
                    room_id: data.room_id,
                    admin: false,
                    room_name: data.room_name,
                    user_id: data.user_id
                };

                await this.loadRoomData();
                this.showInRoomView();
                showNotification('Joined tournament successfully!', 'success');
            } else {
                throw new Error(data.error || 'Failed to join tournament');
            }
        } catch (error) {
            console.error('Error joining room:', error);
            showNotification('Failed to join tournament', 'error');
        }
    }

    private async leaveRoom(): Promise<void> {
        if (!confirm('Are you sure you want to leave this tournament?')) {
            return;
        }

        try {
            const response = await fetch('/api/quit_room', {
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success && data.quit) {
                this.websocket?.close();
                this.websocket = null;
                this.roomData = null;
                this.showNotInRoomView();
                showNotification('Left tournament successfully', 'success');
            } else {
                throw new Error('Cannot leave tournament once started');
            }
        } catch (error) {
            console.error('Error leaving room:', error);
            showNotification('Failed to leave tournament', 'error');
        }
    }

    private async startTournament(): Promise<void> {
        if (!this.isAdmin) {
            showNotification('Only the tournament admin can start the tournament', 'error');
            return;
        }

        if (this.players.length < 2) {
            showNotification('Need at least 2 players to start tournament', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/start/${this.roomData?.room_id}`, {
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                showNotification('Tournament started!', 'success');
                await this.loadMatches();
            } else {
                throw new Error(data.error || 'Failed to start tournament');
            }
        } catch (error) {
            console.error('Error starting tournament:', error);
            showNotification('Failed to start tournament', 'error');
        }
    }

    private async closeRoom(): Promise<void> {
        if (!this.isAdmin) {
            showNotification('Only the tournament admin can close the tournament', 'error');
            return;
        }

        if (!confirm('Are you sure you want to close this tournament? This will remove all players.')) {
            return;
        }

        try {
            const response = await fetch(`/api/close_room/${this.roomData?.room_id}`, {
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                this.websocket?.close();
                this.websocket = null;
                this.roomData = null;
                this.showNotInRoomView();
                showNotification('Tournament closed', 'success');
            } else {
                throw new Error(data.error || 'Failed to close tournament');
            }
        } catch (error) {
            console.error('Error closing room:', error);
            showNotification('Failed to close tournament', 'error');
        }
    }

    private async invitePlayer(): Promise<void> {
        const playerId = prompt('Enter player ID to invite:');
        if (!playerId || isNaN(parseInt(playerId))) {
            showNotification('Please enter a valid player ID', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/invite_player_tournament/${playerId}`, {
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                showNotification('Invitation sent successfully!', 'success');
            } else {
                throw new Error(data.error || 'Failed to send invitation');
            }
        } catch (error) {
            console.error('Error inviting player:', error);
            showNotification('Failed to send invitation', 'error');
        }
    }

    private async joinMatch(): Promise<void> {
        try {
            const response = await fetch('/api/can_play/0', {
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success && data.can_play) {
                // Store match ID in sessionStorage for the play page
                sessionStorage.setItem('match_id', data.match_id.toString());
                if (this.roomData) {
                    sessionStorage.setItem('room', JSON.stringify(this.roomData));
                }

                // Navigate to play page
                if (this.router) {
                    this.router.navigate('/play');
                } else {
                    window.location.href = '/play';
                }
            } else {
                showNotification('No match available for you at the moment', 'success');
            }
        } catch (error) {
            console.error('Error joining match:', error);
            showNotification('Failed to join match', 'error');
        }
    }

    private updatePlayersDisplay(): void {
        const playersList = document.getElementById('players-list');
        if (!playersList) return;

        if (this.players.length === 0) {
            playersList.innerHTML = '<div class="text-center text-gray-400">No players yet</div>';
            return;
        }

        playersList.innerHTML = '';
        this.players.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = 'flex justify-between items-center p-3 bg-cyber-dark border border-neon-cyan/30 rounded';
            
            const isCurrentUser = player.user_id === this.roomData?.user_id;
            const adminBadge = index === 0 ? '<span class="text-xs bg-neon-pink text-white px-2 py-1 rounded ml-2">ADMIN</span>' : '';
            const youBadge = isCurrentUser ? '<span class="text-xs bg-neon-cyan text-cyber-dark px-2 py-1 rounded ml-2">YOU</span>' : '';
            
            playerElement.innerHTML = `
                <div class="flex items-center">
                    <span class="text-white">${player.username}</span>
                    ${adminBadge}
                    ${youBadge}
                </div>
                ${this.isAdmin && index !== 0 ? `
                    <button onclick="this.kickPlayer(${player.user_id})" class="text-red-400 hover:text-red-300 text-sm">
                        KICK
                    </button>
                ` : ''}
            `;
            playersList.appendChild(playerElement);
        });
    }

    private updateMatchesDisplay(): void {
        const matchesList = document.getElementById('matches-list');
        if (!matchesList) return;

        if (this.currentMatches.length === 0) {
            matchesList.innerHTML = '<div class="text-center text-gray-400">No matches yet</div>';
            return;
        }

        matchesList.innerHTML = '';
        this.currentMatches.forEach(match => {
            const matchElement = document.createElement('div');
            matchElement.className = `p-3 border rounded ${match.finished ? 'bg-green-900/20 border-green-500/30' : 'bg-cyber-dark border-yellow-500/30'}`;
            
            const status = match.finished ? '✅ COMPLETED' : '⏳ IN PROGRESS';
            const statusColor = match.finished ? 'text-green-400' : 'text-yellow-400';
            
            matchElement.innerHTML = `
                <div class="flex justify-between items-center">
                    <div>
                        <span class="text-white font-cyber">${match.first_player} vs ${match.second_player}</span>
                    </div>
                    <span class="${statusColor} text-sm">${status}</span>
                </div>
            `;
            matchesList.appendChild(matchElement);
        });
    }

    private checkMyMatch(): void {
        const myMatchSection = document.getElementById('my-match-section');
        if (!myMatchSection) return;

        // Check if current user has an active match
        const hasActiveMatch = this.currentMatches.some(match => 
            !match.finished && (
                match.first_player_id === this.roomData?.user_id || 
                match.second_player_id === this.roomData?.user_id
            )
        );

        if (hasActiveMatch) {
            myMatchSection.classList.remove('hidden');
        } else {
            myMatchSection.classList.add('hidden');
        }
    }

    private showInRoomView(): void {
        const notInRoomView = document.getElementById('not-in-room-view');
        const inRoomView = document.getElementById('in-room-view');
        
        if (notInRoomView) notInRoomView.classList.add('hidden');
        if (inRoomView) inRoomView.classList.remove('hidden');

        // Update room display
        if (this.roomData) {
            const roomNameDisplay = document.getElementById('room-name-display');
            const roomIdDisplay = document.getElementById('room-id-display');
            
            if (roomNameDisplay) roomNameDisplay.textContent = this.roomData.room_name;
            if (roomIdDisplay) roomIdDisplay.textContent = `Tournament ID: ${this.roomData.room_id}`;
        }
    }

    private showNotInRoomView(): void {
        const notInRoomView = document.getElementById('not-in-room-view');
        const inRoomView = document.getElementById('in-room-view');
        
        if (notInRoomView) notInRoomView.classList.remove('hidden');
        if (inRoomView) inRoomView.classList.add('hidden');

        // Reset data
        this.roomData = null;
        this.isAdmin = false;
        this.currentMatches = [];
        this.players = [];
    }

    private showWinner(winnerName: string): void {
        const winnerSection = document.getElementById('winner-section');
        const winnerDisplay = document.getElementById('winner-display');
        
        if (winnerSection && winnerDisplay) {
            winnerDisplay.textContent = `🎉 ${winnerName} WINS! 🎉`;
            winnerSection.classList.remove('hidden');
        }
    }

    cleanup(): void {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }
        super.cleanup();
    }

    destroy(): void {
        this.cleanup();
        super.destroy();
    }
}

export default TournamentPage;