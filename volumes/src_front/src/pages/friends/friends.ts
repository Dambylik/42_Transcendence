import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import { showNotification } from '../../utils/notifications';
import FriendService from './services/FriendService';
import type { Friend, FriendRequest } from './services/FriendService';
import toggleButton from './utils/toggleButton';
import { renderUserCard } from './components/UserCard';
import { renderPagination } from './components/Pagination';
import { renderUserActions } from './components/UserActions';
import { renderFriendRequestCard } from './components/FriendRequestCard';

class FriendsPage extends Page {
	private activeTab: string = 'friends';
	private friendsList: Friend[] = [];
	private friendRequests: FriendRequest[] = [];
	private currentPage: number = 1;
	private friendsPerPage: number = 6;

	constructor(id: string, router?: Router) {
		super(id, router);
	}

	private async fetchFriendsList(): Promise<void> {
		this.friendsList = await FriendService.fetchFriendsList();
	}

	private async fetchFriendRequests(): Promise<void> {
		this.friendRequests = await FriendService.fetchFriendRequests();
	}

	private setupTabNavigation(): void {
		const tabButtons = this.container.querySelectorAll('[data-tab]');
		tabButtons.forEach(button => {
			button.addEventListener('click', () => {
				const tabId = (button as HTMLElement).dataset.tab;
				if (tabId) {
					this.activeTab = tabId;
					this.updateActiveTab();
				}
			});
		});
	}

	private updateActiveTab(): void {
		const tabButtons = this.container.querySelectorAll('[data-tab]');
		tabButtons.forEach(button => {
			const tabId = (button as HTMLElement).dataset.tab;
			if (tabId === this.activeTab) {
				button.classList.add('bg-gradient-to-r', 'from-neon-pink/20', 'to-neon-cyan/20', 'border-neon-pink', 'text-neon-pink');
				button.classList.remove('bg-cyber-darker', 'border-gray-600', 'text-gray-400', 'hover:text-neon-cyan', 'hover:border-neon-cyan/50');
			} else {
				button.classList.remove('bg-gradient-to-r', 'from-neon-pink/20', 'to-neon-cyan/20', 'border-neon-pink', 'text-neon-pink');
				button.classList.add('bg-cyber-darker', 'border-gray-600', 'text-gray-400', 'hover:text-neon-cyan', 'hover:border-neon-cyan/50');
			}
		});

		const contentPanels = this.container.querySelectorAll('[data-content]');
		contentPanels.forEach(panel => {
			const contentId = (panel as HTMLElement).dataset.content;
			if (contentId === this.activeTab) {
				panel.classList.remove('hidden');
			} else {
				panel.classList.add('hidden');
			}
		});
	}

	private renderFriendsList(): string {
		if (this.friendsList.length === 0) {
			return `
            <div class="p-6 text-center text-gray-400 font-cyber">
                <div class="text-neon-cyan text-4xl mb-4">😢</div>
                <h3 class="text-neon-cyan font-cyber text-lg mb-2">NO FRIENDS YET</h3>
                <p class="text-gray-400 font-cyber">You have no friends at the moment.</p>
            </div>
            `;
		}
		const startIndex = (this.currentPage - 1) * this.friendsPerPage;
		const endIndex = startIndex + this.friendsPerPage;
		const paginatedFriends = this.friendsList.slice(startIndex, endIndex);

		const friendsHtml = paginatedFriends.map(friend =>
			renderUserCard({
				id: friend.id,
				username: friend.username,
				avatar_url: friend.avatar_url,
				online: friend.online,
				actionsHtml: renderUserActions('friend', friend.id)
			})
		).join('');

		const totalPages = Math.ceil(this.friendsList.length / this.friendsPerPage);

		return `
            <div class="p-6 relative h-full">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${friendsHtml}
                </div>
                ${renderPagination(this.currentPage, totalPages)}
            </div>
        `;
	}

	private renderFriendSearch(): string {
		return `
        <div class="p-6 relative h-full">
            <div class="mb-8">
            <div class="cyber-panel bg-cyber-darker p-6 border border-neon-cyan/30 h-[415px] flex flex-col justify-between">
                <div>
                <h3 class="text-neon-cyan font-cyber text-lg mb-2">SEARCH FOR USERS</h3>
                <p class="text-gray-400 font-cyber text-sm mb-4">Enter a username to find and add new friends</p>
                <div class="flex">
                    <input type="text" id="search-username" placeholder="Enter username to search" 
                            class="flex-1 p-3 bg-cyber-dark border border-gray-600 focus:border-neon-cyan outline-none text-white font-tech">
                    <button id="search-button" 
                            class="ml-4 px-6 py-3 bg-cyber-dark border border-neon-pink text-neon-pink font-cyber hover:bg-neon-pink/10 transition-colors">
                        SEARCH
                    </button>
                </div>
                </div>
                <div id="search-results" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 overflow-y-auto">
                
                <!-- Initial state with instructions -->
                <div class="col-span-full text-center text-gray-400 font-cyber py-8">
                    <div class="text-neon-cyan text-4xl mb-4">👥</div>
                    <h3 class="text-neon-cyan font-cyber text-lg mb-2">FIND NEW FRIENDS</h3>
                    <p class="text-gray-400 font-cyber">Enter a username and click SEARCH</p>
                </div>
                </div>
                <div class="absolute bottom-4 left-0 right-0 flex justify-center">
                    <button id="search-prev-page" class="px-4 py-2 bg-cyber-dark border border-gray-600 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50" disabled>
                        Previous
                    </button>
                    <button id="search-next-page" class="px-4 py-2 bg-cyber-dark border border-gray-600 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50" disabled>
                        Next
                    </button>
                </div>
            </div>
            </div>
        </div>
        `;
	}

	private renderFriendRequests(): string {
		if (this.friendRequests.length === 0) {
			return `
                <div class="p-6">
                    <div class="col-span-full text-center text-gray-400 font-cyber py-8">
                        <div class="text-neon-cyan text-4xl mb-4">😢</div>
                        <h3 class="text-neon-cyan font-cyber text-lg mb-2">NO PENDING FRIEND REQUESTS</h3>
                        <p class="text-gray-400 font-cyber">You have no friend requests at the moment.</p>
                    </div>
                </div>
            `;
		}
		return `
            <div class="p-6">
                <div class="space-y-4">
                    ${this.friendRequests.map(request =>
			renderFriendRequestCard(request)
		).join('')}
                </div>
            </div>
        `;
	}

	private renderGameInvites(): string {
		return `
        <div class="p-6">
            <div class="cyber-panel bg-cyber-darker p-6 border border-neon-cyan/30 mb-8">
            <h3 class="text-neon-cyan font-cyber text-lg mb-2">GAME INVITES</h3>
            <div id="game-invites-container" class="space-y-4">
                <!-- This will be populated via JavaScript -->
                <div class="text-center text-gray-400 font-cyber py-8">No pending game invites</div>
            </div>
            </div>
        </div>
        `;
	}

	private setupEventListeners(): void {

		// Friend list event listeners
		const inviteButtons = this.container.querySelectorAll('.invite-game-btn');
		inviteButtons.forEach(button => {
			button.addEventListener('click', (e) => {
				const userId = (button as HTMLElement).dataset.userId;
				if (userId) {
					button.classList.add('opacity-50');
					button.setAttribute('disabled', 'true');

					setTimeout(() => {
						showNotification('Game invite sent!', 'success');
						button.classList.remove('opacity-50');
						button.removeAttribute('disabled');
					}, 800);
				}
			});
		});

		// Remove Friend button
		const removeButtons = this.container.querySelectorAll('.remove-friend-btn');
		removeButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const userId = (button as HTMLElement).dataset.userId;
				if (userId && confirm('Are you sure you want to remove this friend?')) {
					const btn = button as HTMLElement;
					btn.innerHTML = 'REMOVING...';
					btn.classList.add('opacity-50');
					btn.setAttribute('disabled', 'true');

					try {
						const response = await fetch(`/api/remove_friend/${userId}`, {
							method: 'GET',
							credentials: 'include',
						});
						if (response.ok) {
							showNotification('Friend removed successfully!', 'success');
							await this.fetchFriendsList();
							this.updateContent();
							this.refreshSearchIfNeeded();
						} else {
							const error = await response.json();
							showNotification(`Error: ${error.error || 'Failed to remove friend'}`, 'error');
						}
					} catch (err) {
						console.error('Error removing friend:', err);
						showNotification('Failed to remove friend. Please try again.', 'error');
					} finally {
						btn.innerHTML = 'REMOVE';
						btn.classList.remove('opacity-50');
						btn.removeAttribute('disabled');
					}
				}
			});
		});

		// Block User buttons in friends list
		const blockButtons = this.container.querySelectorAll('.block-user-btn');
		blockButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const userId = (button as HTMLElement).dataset.userId;
				if (userId && confirm('Are you sure you want to block this user?')) {
					const btn = button as HTMLElement;
					btn.innerHTML = 'BLOCKING...';
					btn.classList.add('opacity-50');
					btn.setAttribute('disabled', 'true');

					try {
						console.log('Attempting to block user:', userId); // Debug log

						const response = await fetch(`/api/users/${userId}/block`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({}), // Add empty JSON body
							credentials: 'include',
						});

						console.log('Block response status:', response.status); // Debug log

						if (response.ok) {
							const result = await response.json();
							console.log('Block response data:', result); // Debug log

							showNotification('User blocked successfully!', 'success');

							// Remove from friends list and friend requests immediately
							this.friendsList = this.friendsList.filter(friend => friend.id !== parseInt(userId));
							this.friendRequests = this.friendRequests.filter(request => (request.senderId || request.id) !== parseInt(userId));

							// Also refresh from server to ensure consistency
							await Promise.all([
								this.fetchFriendsList(),
								this.fetchFriendRequests()
							]);

							this.updateContent();
							this.refreshSearchIfNeeded();
						} else {
							const error = await response.json();
							console.error('Block failed with error:', error); // Debug log
							showNotification(`Error: ${error.error || 'Failed to block user'}`, 'error');
						}
					} catch (err) {
						console.error('Error blocking user:', err);
						showNotification('Failed to block user. Please try again.', 'error');
					} finally {
						btn.innerHTML = 'BLOCK';
						btn.classList.remove('opacity-50');
						btn.removeAttribute('disabled');
					}
				}
			});
		});

		// Add listener for the "Find Users" button
		const goToSearchButton = this.container.querySelector('#go-to-search-tab');
		if (goToSearchButton) {
			goToSearchButton.addEventListener('click', () => {
				const searchTabButton = this.container.querySelector('[data-tab="search"]');
				if (searchTabButton) {
					(searchTabButton as HTMLElement).click();
				}
			});
		}

		// Pagination event listeners
		const prevPageButton = this.container.querySelector('#prev-page') as HTMLElement;
		const nextPageButton = this.container.querySelector('#next-page') as HTMLElement;

		if (prevPageButton) {
			prevPageButton.addEventListener('click', () => {
				if (this.currentPage > 1) {
					this.currentPage--;
					this.updateContent();
				}
			});
		}

		if (nextPageButton) {
			nextPageButton.addEventListener('click', () => {
				const totalPages = Math.ceil(this.friendsList.length / this.friendsPerPage);
				if (this.currentPage < totalPages) {
					this.currentPage++;
					this.updateContent();
				}
			});
		}

		// Add Friend button
		const addFriendButtons = this.container.querySelectorAll('.add-friend-btn');
		addFriendButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const userId = (button as HTMLElement).dataset.userId;
				if (userId) {
					button.classList.add('opacity-50');
					button.setAttribute('disabled', 'true');

					try {
						const response = await fetch(`/api/add_friend/${userId}`, {
							method: 'GET',
							credentials: 'include',
						});

						if (response.ok) {
							showNotification('Friend added successfully!', 'success');
							// Optionally, update the UI to reflect the new friend
						} else {
							const error = await response.json();
							showNotification(`Error: ${error.error || 'Failed to add friend'}`, 'error');
						}
					} catch (err) {
						console.error('Error adding friend:', err);
						showNotification('Failed to add friend. Please try again.', 'error');
					} finally {
						button.classList.remove('opacity-50');
						button.removeAttribute('disabled');
					}
				}
			});
		});

		// Supprimer l'ancien gestionnaire d'événements pour éviter les doublons
		this.container.removeEventListener('click', this.handleRequestButtons);

		// Ajouter le nouveau gestionnaire d'événements
		this.container.addEventListener('click', this.handleRequestButtons.bind(this));
	}

	private handleRequestButtons = async (event: Event) => {
		const target = event.target as HTMLElement;
		const isAccept = target.matches('.accept-request-btn');
		const isDecline = target.matches('.decline-request-btn');
		if (!isAccept && !isDecline) return;

		const userIdStr = isAccept
			? target.getAttribute('data-accept')
			: target.getAttribute('data-decline');
		const userId = userIdStr ? parseInt(userIdStr, 10) : null;
		if (!userId) return;

		if (target.hasAttribute('disabled')) return;
		toggleButton(target, false);

		let success = false;
		if (isAccept) {
			success = await FriendService.acceptFriendRequest(userId);
		} else {
			success = await FriendService.declineFriendRequest(userId);
		}

		if (success) {
			showNotification(
				isAccept ? 'Friend request accepted!' : 'Friend request declined!',
				'success'
			);
			if (isAccept) {
				this.updateSearchUserStatus(userId, 'friends');
				await this.fetchFriendRequests();
				await this.fetchFriendsList();
				this.updateContent();
			} else {
				this.updateSearchUserStatus(userId, 'none');
				await this.fetchFriendRequests();
				this.updateContent();
			}
		} else {
		 showNotification('Something went wrong.', 'error');
		}

		toggleButton(target, true);
		this.refreshSearchIfNeeded();
	};

	private setupSearchListeners(): void {
		const searchInput = this.container.querySelector('#search-username') as HTMLInputElement;
		const searchResultsContainer = this.container.querySelector('#search-results') as HTMLElement;
		const prevPageButton = this.container.querySelector('#search-prev-page') as HTMLButtonElement;
		const nextPageButton = this.container.querySelector('#search-next-page') as HTMLButtonElement;

		const limit = 6; // Number of results per page
		let currentPage = 1;

		const fetchAndRenderResults = async () => {
			const query = searchInput.value.trim();
			if (!query) {
				searchResultsContainer.innerHTML = `
                    <div class="col-span-full text-center text-gray-400 font-cyber py-8">
                        <div class="text-neon-cyan text-4xl mb-4">👥</div>
                        <h3 class="text-neon-cyan font-cyber text-lg mb-2">FIND NEW FRIENDS</h3>
                        <p class="text-gray-400 font-cyber">Enter a username and start typing</p>
                    </div>
                `;
				prevPageButton.setAttribute('disabled', 'true');
				nextPageButton.setAttribute('disabled', 'true');
				return;
			}

			try {
				const response = await fetch(`/api/search_users?query=${encodeURIComponent(query)}&page=${currentPage}&limit=${limit}`, {
					credentials: 'include',
				});

				if (response.ok) {
					const { users, total } = await response.json();
					searchResultsContainer.innerHTML = ''; // Clear previous results

					if (users && users.length > 0) {
						searchResultsContainer.innerHTML = users.map((user: {
							id: number;
							username: string;
							online: boolean;
							avatar_url: string;
							friendshipStatus: string;
						}) => {
							const avatarUrl = user?.avatar_url
								? (user.avatar_url.startsWith('/')
									? user.avatar_url
									: (user.avatar_url.startsWith('uploads/')
										? '/' + user.avatar_url
										: '/uploads/' + user.avatar_url))
								: '/uploads/default.png';

							let actionButton = '';
							let cardContent = '';

							if (user.friendshipStatus === 'blocked') {
								// Add "brume" overlay for blocked users
								cardContent = `
                                    <div class="flex items-center space-x-4 relative">
                                        <!-- Brume overlay -->
                                        <div class="blocked-overlay absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg transition-all duration-300 hover:bg-black/70 cursor-pointer group" 
                                            data-user-id="${user.id}">
                                            <div class="text-center">
                                                <div class="text-red-500 text-2xl mb-2">🚫</div>
                                                <p class="text-red-400 font-cyber text-sm mb-1">BLOCKED USER</p>
                                                <p class="text-yellow-400 font-cyber text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    Click to show
                                                </p>
                                            </div>
                                        </div>
                                        <!-- Normal content (hidden by overlay) -->
                                        <a href="https://localhost:4430/profile/${user.username}">
                                            <img src="${avatarUrl}" alt="${user.username}" 
                                                class="w-16 h-16 object-cover rounded-lg border-2 border-gray-500">
                                        </a>
                                        <div>
                                            <a href="https://localhost:4430/profile/${user.username}" class="hover:underline">
                                                <h3 class="font-cyber text-lg text-white">${user.username}</h3>
                                            </a>
                                            <span class="font-cyber text-xs font-bold px-2 py-1 rounded-sm ${user.online
										? 'text-green-400 bg-green-900/20 border border-green-500/30'
										: 'text-red-400 bg-red-900/20 border border-red-500/30'
									}">
                                                ${user.online ? 'ONLINE' : 'OFFLINE'}
                                            </span>
                                        </div>
                                        <button class="unblock-user-btn ml-auto p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 hover:bg-yellow-500/10 text-yellow-500 text-sm rounded transition-all duration-200" 
                                                data-user-id="${user.id}">
                                            UNBLOCK
                                        </button>
                                    </div>`;
							} else {
								// Normal content for non-blocked users
								switch (user.friendshipStatus) {
									case 'friends':
										actionButton = `
                                            <div class="ml-auto flex space-x-2">
                                                <button class="remove-friend-btn p-2 bg-cyber-dark border border-red-500/50 hover:border-red-500 text-red-500 text-sm rounded" 
                                                        data-user-id="${user.id}">
                                                    REMOVE FRIEND
                                                </button>
                                                <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded" 
                                                        data-user-id="${user.id}">
                                                    BLOCK
                                                </button>
                                            </div>`;
										break;
									case 'request_sent':
										actionButton = `
                                            <div class="ml-auto flex space-x-2">
                                                <button class="cancel-request-btn p-2 bg-cyber-dark border border-gray-600 text-gray-400 text-sm rounded" 
                                                        data-user-id="${user.id}" disabled>
                                                    REQUEST SENT
                                                </button>
                                                <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded" 
                                                        data-user-id="${user.id}">
                                                    BLOCK
                                                </button>
                                            </div>`;
										break;
									case 'request_received':
										actionButton = `
                                            <div class="ml-auto flex space-x-2">
                                                <button class="accept-friend-request-btn p-2 bg-cyber-dark border border-neon-cyan/50 hover:border-neon-cyan text-neon-cyan text-sm rounded" 
                                                        data-user-id="${user.id}">
                                                    ACCEPT
                                                </button>
                                                <button class="decline-friend-request-btn p-2 bg-cyber-dark border border-red-500/50 hover:border-red-500 text-red-500 text-sm rounded" 
                                                        data-user-id="${user.id}">
                                                    DECLINE
                                                </button>
                                                <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded" 
                                                        data-user-id="${user.id}">
                                                    BLOCK
                                                </button>
                                            </div>`;
										break;
									default: // 'none'
										actionButton = `
                                            <div class="ml-auto flex space-x-2">
                                                <button class="add-friend-btn p-2 bg-cyber-dark border border-neon-pink/50 hover:border-neon-pink text-neon-pink text-sm rounded" 
                                                        data-user-id="${user.id}">
                                                    ADD FRIEND
                                                </button>
                                                <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded" 
                                                        data-user-id="${user.id}">
                                                    BLOCK
                                                </button>
                                            </div>`;
								}

								cardContent = `
                                    <div class="flex items-center space-x-4">
                                        <a href="https://localhost:4430/profile/${user.username}">
                                            <img src="${avatarUrl}" alt="${user.username}" 
                                                class="w-16 h-16 object-cover rounded-lg border-2 ${user.online ? 'border-neon-cyan' : 'border-gray-500'}">
                                        </a>
                                        <div>
                                            <a href="https://localhost:4430/profile/${user.username}" class="hover:underline">
                                                <h3 class="font-cyber text-lg text-white">${user.username}</h3>
                                            </a>
                                            <span class="font-cyber text-xs font-bold px-2 py-1 rounded-sm ${user.online
										? 'text-green-400 bg-green-900/20 border border-green-500/30'
										: 'text-red-400 bg-red-900/20 border border-red-500/30'
									}">
                                                ${user.online ? 'ONLINE' : 'OFFLINE'}
                                            </span>
                                        </div>
                                        ${actionButton}
                                    </div>`;
							}

							return `
                                <div class="cyber-panel bg-cyber-darker p-4 border border-neon-cyan/30 hover:border-neon-cyan transition-colors" data-user-id="${user.id}">
                                    ${cardContent}
                                </div>
                            `;
						}).join('');

						const totalPages = Math.ceil(total / limit);
						prevPageButton.disabled = currentPage === 1;
						nextPageButton.disabled = currentPage === totalPages;

						// Reattach event listeners for buttons
						this.attachSearchActionListeners();
					} else {
						searchResultsContainer.innerHTML = `
                            <div class="col-span-full text-center text-gray-400 font-cyber py-8">
                                <div class="text-neon-cyan text-4xl mb-4">😢</div>
                                <h3 class="text-neon-cyan font-cyber text-lg mb-2">NO USERS FOUND</h3>
                                <p class="text-gray-400 font-cyber">Try a different username</p>
                            </div>
                        `;
						prevPageButton.setAttribute('disabled', 'true');
						nextPageButton.setAttribute('disabled', 'true');
					}
				} else {
					console.error('Failed to fetch users:', response.statusText);
				}
			} catch (err) {
				console.error('Error fetching users:', err);
			}
		};

		if (searchInput && searchResultsContainer) {
			searchInput.addEventListener('input', async () => {
				currentPage = 1; // Reset to first page on new search
				fetchAndRenderResults();
			});
		}

		if (prevPageButton) {
			prevPageButton.addEventListener('click', () => {
				if (currentPage > 1) {
					currentPage--;
					fetchAndRenderResults();
				}
			});
		}

		if (nextPageButton) {
			nextPageButton.addEventListener('click', () => {
				currentPage++;
				fetchAndRenderResults();
			});
		}
	}

	private attachSearchActionListeners(): void {
		// Add Friend buttons
		const addFriendButtons = this.container.querySelectorAll('.add-friend-btn');
		addFriendButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const userId = (button as HTMLElement).dataset.userId;
				if (userId) {
					const buttonElement = button as HTMLElement;
					const userCard = buttonElement.closest('[data-user-id]') as HTMLElement;

					buttonElement.innerHTML = 'SENDING...';
					buttonElement.classList.add('opacity-50');
					buttonElement.setAttribute('disabled', 'true');

					try {
						const response = await fetch(`/api/add_friend/${userId}`, {
							method: 'GET',
							credentials: 'include',
						});

						if (response.ok) {
							showNotification('Friend request sent successfully!', 'success');
							this.updateUserCardButton(userCard, 'request_sent');
						} else {
							const error = await response.json();
							showNotification(`Error: ${error.error || 'Failed to send friend request'}`, 'error');
							buttonElement.innerHTML = 'ADD FRIEND';
							buttonElement.classList.remove('opacity-50');
							buttonElement.removeAttribute('disabled');
						}
					} catch (err) {
						console.error('Error adding friend:', err);
						showNotification('Failed to send friend request. Please try again.', 'error');
						buttonElement.innerHTML = 'ADD FRIEND';
						buttonElement.classList.remove('opacity-50');
						buttonElement.removeAttribute('disabled');
					}
				}
			});
		});

		// Accept Friend Request buttons
		const acceptButtons = this.container.querySelectorAll('.accept-friend-request-btn');
		acceptButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const userId = (button as HTMLElement).dataset.userId;
				if (userId) {
					const buttonElement = button as HTMLElement;
					const userCard = buttonElement.closest('[data-user-id]') as HTMLElement;

					buttonElement.innerHTML = 'ACCEPTING...';
					buttonElement.classList.add('opacity-50');
					buttonElement.setAttribute('disabled', 'true');

					try {
						const response = await fetch(`/api/accept_friend/${userId}`, {
							method: 'GET',
							credentials: 'include',
						});

						if (response.ok) {
							showNotification('Friend request accepted!', 'success');
							this.updateUserCardButton(userCard, 'friends');
							await this.fetchFriendRequests();
							await this.fetchFriendsList();
							this.updateContent();
							this.attachSearchActionListeners();
							this.refreshSearchIfNeeded();
						} else {
							const error = await response.json();
							showNotification(`Error: ${error.error || 'Failed to accept friend request'}`, 'error');
							buttonElement.innerHTML = 'ACCEPT';
							buttonElement.classList.remove('opacity-50');
							buttonElement.removeAttribute('disabled');
						}
					} catch (err) {
						showNotification('Failed to accept friend request. Please try again.', 'error');
						buttonElement.innerHTML = 'ACCEPT';
						buttonElement.classList.remove('opacity-50');
						buttonElement.removeAttribute('disabled');
					}
				}
			});
		});

		// Decline Friend Request buttons
		const declineButtons = this.container.querySelectorAll('.decline-friend-request-btn');
		declineButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const userId = (button as HTMLElement).dataset.userId;
				if (userId) {
					const buttonElement = button as HTMLElement;
					const userCard = buttonElement.closest('[data-user-id]') as HTMLElement;

					buttonElement.innerHTML = 'DECLINING...';
					buttonElement.classList.add('opacity-50');
					buttonElement.setAttribute('disabled', 'true');

					try {
						const response = await fetch(`/api/decline_friend/${userId}`, {
							method: 'GET',
							credentials: 'include',
						});

						if (response.ok) {
							showNotification('Friend request declined!', 'success');
							this.updateUserCardButton(userCard, 'none');
							await this.fetchFriendRequests();
							this.updateContent();
							this.attachSearchActionListeners();
							this.refreshSearchIfNeeded();
						} else {
							const error = await response.json();
							showNotification(`Error: ${error.error || 'Failed to decline friend request'}`, 'error');
							buttonElement.innerHTML = 'DECLINE';
							buttonElement.classList.remove('opacity-50');
							buttonElement.removeAttribute('disabled');
						}
					} catch (err) {
						showNotification('Failed to decline friend request. Please try again.', 'error');
						buttonElement.innerHTML = 'DECLINE';
						buttonElement.classList.remove('opacity-50');
						buttonElement.removeAttribute('disabled');
					}
				}
			});
		});

		// Block User button logic
		const blockButtons = this.container.querySelectorAll('.block-user-btn');
		blockButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const userId = (button as HTMLElement).dataset.userId;
				if (userId && confirm('Are you sure you want to block this user?')) {
					const btn = button as HTMLElement;
					btn.innerHTML = 'BLOCKING...';
					btn.classList.add('opacity-50');
					btn.setAttribute('disabled', 'true');

					try {
						console.log('Attempting to block user:', userId); // Debug log

						const response = await fetch(`/api/users/${userId}/block`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({}), // Add empty JSON body
							credentials: 'include',
						});

						console.log('Block response status:', response.status); // Debug log

						if (response.ok) {
							const result = await response.json();
							console.log('Block response data:', result); // Debug log

							showNotification('User blocked successfully!', 'success');

							// Remove from friends list and friend requests immediately
							this.friendsList = this.friendsList.filter(friend => friend.id !== parseInt(userId));
							this.friendRequests = this.friendRequests.filter(request => (request.senderId || request.id) !== parseInt(userId));

							// Also refresh from server to ensure consistency
							await Promise.all([
								this.fetchFriendsList(),
								this.fetchFriendRequests()
							]);

							this.updateContent();
							this.refreshSearchIfNeeded();
						} else {
							const error = await response.json();
							console.error('Block failed with error:', error); // Debug log
							showNotification(`Error: ${error.error || 'Failed to block user'}`, 'error');
						}
					} catch (err) {
						console.error('Error blocking user:', err);
						showNotification('Failed to block user. Please try again.', 'error');
					} finally {
						btn.innerHTML = 'BLOCK';
						btn.classList.remove('opacity-50');
						btn.removeAttribute('disabled');
					}
				}
			});
		});

		// Add Unblock User buttons
		const unblockButtons = this.container.querySelectorAll('.unblock-user-btn');
		unblockButtons.forEach(button => {
			button.addEventListener('click', async () => {
				const userId = (button as HTMLElement).dataset.userId;
				if (userId && confirm('Are you sure you want to unblock this user?')) {
					const btn = button as HTMLElement;
					btn.innerHTML = 'UNBLOCKING...';
					btn.classList.add('opacity-50');
					btn.setAttribute('disabled', 'true');

					try {
						const response = await fetch(`/api/unblock_user/${userId}`, {
							method: 'GET',
							credentials: 'include',
						});
						if (response.ok) {
							showNotification('User unblocked successfully!', 'success');
							this.updateUserCardButton(btn.closest('[data-user-id]') as HTMLElement, 'none');
							this.refreshSearchIfNeeded();
						} else {
							const error = await response.json();
							showNotification(`Error: ${error.error || 'Failed to unblock user'}`, 'error');
						}
					} catch (err) {
						console.error('Error unblocking user:', err);
						showNotification('Failed to unblock user. Please try again.', 'error');
					} finally {
						btn.innerHTML = 'UNBLOCK';
						btn.classList.remove('opacity-50');
						btn.removeAttribute('disabled');
					}
				}
			});
		});

		// Overlay click for blocked users (replacing visibility buttons)
		const blockedOverlays = this.container.querySelectorAll('.blocked-overlay');
		blockedOverlays.forEach(overlay => {
			overlay.addEventListener('click', (event) => {
				event.stopPropagation();
				const userId = (overlay as HTMLElement).dataset.userId;
				if (userId) {
					this.toggleBlockedUserVisibility(userId);
				}
			});
		});
	}

	private toggleBlockedUserVisibility(userId: string): void {
		const userCard = this.container.querySelector(`[data-user-id="${userId}"]`) as HTMLElement;
		if (!userCard) return;

		const overlay = userCard.querySelector('.blocked-overlay') as HTMLElement;

		if (overlay) {
			if (overlay.classList.contains('hidden')) {
				// Masquer à nouveau
				overlay.classList.remove('hidden');
			} else {
				// Révéler le profil
				overlay.classList.add('hidden');

				// Auto-masquer après 8 secondes
				setTimeout(() => {
					if (overlay && overlay.classList.contains('hidden')) {
						overlay.classList.remove('hidden');
					}
				}, 8000);
			}
		}
	}

	private updateUserCardButton(userCard: HTMLElement, newStatus: string): void {
		const actionContainer = userCard.querySelector('.ml-auto.flex.space-x-2');
		if (!actionContainer) return;

		let newButtonHTML = '';

		if (newStatus === 'request_sent') {
			newButtonHTML = `
            <button class="cancel-request-btn p-2 bg-cyber-dark border border-gray-600 text-gray-400 text-sm rounded" 
                    data-user-id="${userCard.dataset.userId}" disabled>
                REQUEST SENT
            </button>`;
		} else if (newStatus === 'none') {
			newButtonHTML = `
            <button class="add-friend-btn p-2 bg-cyber-dark border border-neon-pink/50 hover:border-neon-pink text-neon-pink text-sm rounded" 
                    data-user-id="${userCard.dataset.userId}">
                ADD FRIEND
            </button>`;
		}

		actionContainer.innerHTML = `
        ${newButtonHTML}
        <button class="block-user-btn p-2 bg-cyber-dark border border-yellow-500/50 hover:border-yellow-500 text-yellow-500 text-sm rounded" 
                data-user-id="${userCard.dataset.userId}">
            BLOCK
        </button>`;
		this.attachSearchActionListeners();
	}

	private setupFriendNotifications(): void {
		if ('WebSocket' in window) {
			const ws = new WebSocket('wss://localhost:4430/api/ws/friend_notifications');
			ws.onmessage = (event) => {
				const data = JSON.parse(event.data);

				// Correction : certains serveurs envoient {success: false, error: ...}
				if (data && data.success === false) {
					console.error('WebSocket error:', data.error);
					return;
				}

				// Affiche la notification et met à jour l'UI en temps réel
				if (data.type === 'friend_request') {
					showNotification(`You received a friend request from ${data.username}`, 'success');
					this.fetchFriendRequests().then(() => {
						this.updateContent();
					});
					// Ajout : met à jour le statut dans la recherche pour afficher les boutons
					this.updateSearchUserStatus(data.from, 'request_received');
					this.refreshSearchIfNeeded(); // <-- Ajout pour forcer le refresh de la recherche
				} else if (data.type === 'friend_request_accepted') {
					showNotification(`${data.username} accepted your friend request!`, 'success');
					this.updateSearchUserStatus(data.from, 'friends');
					this.updateSearchUserStatus(data.to, 'friends');
					Promise.all([
						this.fetchFriendsList(),
						this.fetchFriendRequests()
					]).then(() => {
						this.updateContent();
					});
				} else if (data.type === 'friend_request_declined') {
					showNotification(`${data.username} declined your friend request`, 'error');
					this.fetchFriendRequests().then(() => {
						this.updateContent();
					});
					this.updateSearchUserStatus(data.from, 'none');
				} else if (data.type === 'friend_removed') {
					showNotification(`${data.username} removed you from their friends list`, 'error');
					this.fetchFriendsList().then(() => {
						this.updateContent();
					});
					this.updateSearchUserStatus(data.from, 'none');
				}
			};
			ws.onopen = () => { };
			ws.onclose = () => { };
			ws.onerror = () => { };
		}
	}

	private updateSearchUserStatus(userId: number, newStatus: string): void {
		console.log('Updating search user status for user:', userId, 'to status:', newStatus); // Debug log
		const userCard = this.container.querySelector(`[data-user-id="${userId}"]`) as HTMLElement;
		if (userCard) {
			console.log('Found user card, updating button'); // Debug log
			this.updateUserCardButton(userCard, newStatus);
		} else {
			console.log('User card not found in search results'); // Debug log
		}
	}

	private updateContent(): void {
		const friendsContent = this.container.querySelector('[data-content="friends"]');
		if (friendsContent) {
			friendsContent.innerHTML = this.renderFriendsList();
		}

		// Mettre à jour aussi l'onglet des demandes d'amis
		const requestsContent = this.container.querySelector('[data-content="requests"]');
		if (requestsContent) {
			requestsContent.innerHTML = this.renderFriendRequests();
		}

		// Reattach event listeners after re-rendering
		this.setupEventListeners();
		// ...existing code for other listeners...
	}

	async render(): Promise<HTMLElement> {
		this.container.innerHTML = '';		
		const friendsContent = document.createElement('div');
		friendsContent.className = 'min-h-[calc(100vh-0rem)] pt-4 relative overflow-visible flex flex-row bg-cyber-dark'; // pt-16 -> pt-4
		friendsContent.innerHTML = `
        <!-- Sidebar -->
        ${await super.createSidebar()}
        <main class="flex-1 flex flex-col relative overflow-visible">
            <!-- Header Section -->
            <div class="p-4 pb-2">
                <div class="flex flex-col items-center mb-6">
                    <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-2 tracking-wider">FRIENDS DASHBOARD</h1>
                    <div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto"></div>
                </div>
            </div>
            <!-- Tab Navigation -->
            <div class="flex space-x-4 mb-6 px-8">
                <button data-tab="friends" class="px-8 py-3 font-cyber text-sm tracking-wider transition-all duration-300 bg-gradient-to-r from-neon-pink/20 to-neon-cyan/20 border border-neon-pink text-neon-pink">
                    FRIENDS
                </button>
                <button data-tab="search" class="px-8 py-3 font-cyber text-sm tracking-wider transition-all duration-300 bg-cyber-darker border border-gray-600 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50">
                    FIND USERS
                </button>
                <button data-tab="requests" class="px-8 py-3 font-cyber text-sm tracking-wider transition-all duration-300 bg-cyber-darker border border-gray-600 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50">
                    REQUESTS
                </button>
                <button data-tab="invites" class="px-8 py-3 font-cyber text-sm tracking-wider transition-all duration-300 bg-cyber-darker border border-gray-600 text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/50">
                    GAME INVITES
                </button>
            </div>
            <!-- Content Area -->
            <div class="relative z-10 flex-1 px-8 pb-8">
                <div class="cyber-panel h-full bg-cyber-dark/70 backdrop-blur-sm border border-neon-cyan/20 p-2">
                    <!-- Friends List Tab -->
                    <div data-content="friends" class="h-full">
                        ${this.renderFriendsList()}
                    </div>
                    <!-- Search Tab -->
                    <div data-content="search" class="h-full hidden">
                        ${this.renderFriendSearch()}
                    </div>
                    <!-- Requests Tab -->
                    <div data-content="requests" class="h-full hidden">
                        ${this.renderFriendRequests()}
                    </div>
                    <!-- Game Invites Tab -->
                    <div data-content="invites" class="h-full hidden">
                        ${this.renderGameInvites()}
                    </div>
                </div>
            </div>
        </main>
    `;
		this.container.appendChild(friendsContent);
		await this.setupTabNavigation();
		await this.setupEventListeners();
		await this.setupSearchListeners();
		await this.setupFriendNotifications(); // Initialize WebSocket for friend notifications
		await this.setupOnlineStatusRealtime();
		await super.setupSidebarListeners();
		return this.container;
	}
	private refreshSearchIfNeeded(): void {
		// If the search tab is active, refresh the search results (simulate input event)
		if (this.activeTab === 'search') {
			const searchInput = this.container.querySelector('#search-username') as HTMLInputElement;
			if (searchInput) {
				const event = new Event('input', { bubbles: true });
				searchInput.dispatchEvent(event);
			}
		}
	}

	private onlineStatusWs?: WebSocket;

	private setupOnlineStatusRealtime(): void {
		if ('WebSocket' in window) {
			this.onlineStatusWs = new WebSocket('wss://localhost:4430/api/ws/online_status');
			this.onlineStatusWs.onmessage = (event) => {
				const data = JSON.parse(event.data);
				if (data && data.user_id) {
					// Update friend online status in real-time (data)
					this.friendsList = this.friendsList.map(friend =>
						friend.id === data.user_id
							? { ...friend, online: data.type === 'online' }
							: friend
					);
					// Update badge in DOM for visible friends
					const badge = this.container.querySelector(
						`[data-user-id="${data.user_id}"] .font-cyber.text-xs.font-bold`
					) as HTMLElement;
					if (badge) {
						if (data.type === 'online') {
							badge.className = 'font-cyber text-xs font-bold px-2 py-1 rounded-sm text-green-400 bg-green-900/20 border border-green-500/30';
							badge.textContent = 'ONLINE';
						} else {
							badge.className = 'font-cyber text-xs font-bold px-2 py-1 rounded-sm text-red-400 bg-red-900/20 border border-red-500/30';
							badge.textContent = 'OFFLINE';
						}
					}
					// No call to this.updateContent() here to avoid full re-render
				}
			};
			this.onlineStatusWs.onclose = () => { };
			this.onlineStatusWs.onerror = () => { };
		}
	}
}

export default FriendsPage;
