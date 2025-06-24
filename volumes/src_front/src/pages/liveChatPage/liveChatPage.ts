import Page from '../../core/templates/page';

class LiveChatPage extends Page {
  private ws?: WebSocket;
  private privateWs?: WebSocket;
  private friends: { id: number; username: string; avatar_url: string }[] = [];

  async render(): Promise<HTMLElement> {
    this.container.innerHTML = '';

    const chatContent = document.createElement('div');
    chatContent.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark'; // pt-16 -> pt-4
    chatContent.innerHTML = `
      <style>
        .avatar-link:hover img,
        .username-link:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
        }
        /* Ajout : hover sur la liste d'amis du chat privé */
        #private-friends-list-items [data-friend-id]:hover {
          background-color: rgba(34,211,238,0.10); /* bg-cyber-dark/40 ou un cyan léger */
        }
        /* Ami sélectionné (déjà présent, mais on le rappelle ici pour la clarté) */
        #private-friends-list-items [data-friend-id].bg-cyber-dark\\/60 {
          background-color: rgba(34,211,238,0.20) !important;
        }
        /* Nouveau style pour les tabs */
        .chat-tab {
          background: linear-gradient(90deg, #232946 0%, #232946 100%);
          color: #fff;
          border: 2px solid transparent;
          transition: background 0.3s, border 0.3s, color 0.3s, box-shadow 0.3s;
          box-shadow: none;
        }
        .chat-tab.active {
          background: linear-gradient(90deg, #ff2e9a 0%, #22d3ee 100%);
          color: #232946;
          border: 2px solid #ff2e9a;
          box-shadow: 0 0 12px 0 #ff2e9a55;
        }
        .chat-tab:not(.active):hover, .chat-tab:focus-visible {
          border: 2px solid #22d3ee;
          color: #22d3ee;
          background: #232946;
          box-shadow: 0 0 8px 0 #22d3ee55;
        }
      </style>
      <!-- Sidebar -->
      ${await super.createSidebar()}
      <main class="flex-1 flex flex-col relative">
      <!-- Header Section -->
      <div class="p-4 pb-2">
      <div class="flex flex-col items-center mb-6">
      <h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-2 tracking-wider">CHAT DASHBOARD</h1>
      <div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto"></div>
      </div>
      </div>

      <!-- Chat Tabs -->
      <div class="flex justify-center space-x-4 mb-4">
      <button id="general-chat-tab" class="chat-tab bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-6 py-2 rounded-md hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300 active">General Chat</button>
      <button id="private-chat-tab" class="chat-tab bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-6 py-2 rounded-md hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300">Private Chat</button>
      </div>

      <!-- Chat Container -->
      <div class="relative z-10 flex-1 px-8 pb-8">
        <!-- General Chat -->
        <div id="general-chat" class="chat-panel cyber-panel h-[45rem] bg-cyber-dark/70 backdrop-blur-sm border border-neon-cyan/20 p-6 flex flex-col">
        <div id="general-chat-container" class="flex flex-col h-full">
          <div class="chat-title-cyber font-cyber text-neon-cyan text-center mb-4">General Chat</div>
          <div class="chat-messages-cyber flex-1 min-h-[34rem] max-h-[36rem] overflow-y-auto p-4 bg-cyber-darker rounded-lg border border-neon-pink/30"></div>
          <div class="chat-input-row-cyber flex mt-6">
          <input class="chat-input-cyber flex-1 bg-cyber-darker border border-gray-600 text-white px-4 py-4 rounded-l-md focus:outline-none focus:border-neon-cyan/50 transition-colors font-tech text-lg" placeholder="Type your message..." />
          <button class="chat-send-cyber bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-8 py-4 rounded-r-md hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300 text-lg">Send</button>
          </div>
        </div>
        </div>

        <!-- Private Chat -->
        <div id="private-chat" class="chat-panel cyber-panel h-[48rem] bg-cyber-dark/70 backdrop-blur-sm border border-neon-cyan/20 p-6 flex flex-row hidden">
          <div id="private-friends-list" class="w-64 border-r border-neon-cyan/20 pr-4 overflow-y-auto">
            <div class="font-cyber text-neon-cyan mb-4 text-lg">Friends</div>
            <div id="private-friends-list-items" class="flex flex-col gap-2"></div>
          </div>
          <div id="private-chat-container" class="flex flex-col flex-1 h-full pl-6">
            <div class="chat-title-cyber font-cyber text-neon-cyan text-center mb-4">Private Chat</div>
            <div class="chat-messages-cyber flex-1 min-h-[32rem] max-h-[36rem] overflow-y-auto p-4 bg-cyber-darker rounded-lg border border-neon-pink/30"></div>
            <div class="chat-input-row-cyber flex mt-6">
              <input class="chat-input-cyber flex-1 bg-cyber-darker border border-gray-600 text-white px-4 py-4 rounded-l-md focus:outline-none focus:border-neon-cyan/50 transition-colors font-tech text-lg" placeholder="Type your message..." />
              <button class="chat-send-cyber bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-8 py-4 rounded-r-md hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300 text-lg">Send</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Corner Decorations -->
      <div class="absolute top-0 left-8 w-12 h-12 border-l-2 border-t-2 border-neon-pink/50 pointer-events-none"></div>
      <div class="absolute top-0 right-8 w-12 h-12 border-r-2 border-t-2 border-neon-cyan/50 pointer-events-none"></div>
      <div class="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-neon-cyan/50 pointer-events-none"></div>
      <div class="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-neon-pink/50 pointer-events-none"></div>
      </main>
    `;

    this.container.appendChild(chatContent);

    // Tab Switching Logic
    const generalChatTab = chatContent.querySelector('#general-chat-tab') as HTMLButtonElement;
    const privateChatTab = chatContent.querySelector('#private-chat-tab') as HTMLButtonElement;
    const generalChatPanel = chatContent.querySelector('#general-chat') as HTMLElement;
    const privateChatPanel = chatContent.querySelector('#private-chat') as HTMLElement;

    generalChatTab.addEventListener('click', () => {
      generalChatTab.classList.add('active');
      privateChatTab.classList.remove('active');
      generalChatPanel.classList.remove('hidden');
      privateChatPanel.classList.add('hidden');
    });

    privateChatTab.addEventListener('click', () => {
      privateChatTab.classList.add('active');
      generalChatTab.classList.remove('active');
      privateChatPanel.classList.remove('hidden');
      generalChatPanel.classList.add('hidden');
    });

    // Ensure the chat container has fixed height and scrolls
    const messagesContainer = chatContent.querySelector('.chat-messages-cyber') as HTMLElement;
    // fixed height to display ~5 messages
    messagesContainer.style.maxHeight = '20rem';
    messagesContainer.style.overflowY = 'auto';
    // preserve natural flow
    messagesContainer.style.display = 'block';

    const input = chatContent.querySelector('.chat-input-cyber') as HTMLInputElement;
    const sendButton = chatContent.querySelector('.chat-send-cyber') as HTMLButtonElement;

    let lastMessage = { username: '', timestamp: 0 };

    // Ajout : Set pour éviter les doublons (clé = username + created_at + content)
    const displayedMessages = new Set<string>();

    const addMessageElement = (m: { content?: string; created_at?: string; username?: string; avatar_url?: string }) => {
      if (typeof m === 'object' && typeof m.content === 'string') {
        const date = m.created_at ? new Date(m.created_at) : new Date();
        // Clé unique pour chaque message (ajustez selon vos données)
        const key = `${m.username}|${m.created_at}|${m.content}`;
        if (displayedMessages.has(key)) return;
        displayedMessages.add(key);
        // use 2 minutes window
        const isSameUser = lastMessage.username === m.username;
        const isWithinTwoMinutes = date.getTime() - lastMessage.timestamp <= 2 * 60 * 1000;

        if (isSameUser && isWithinTwoMinutes) {
          // append bubble to last wrapper
          const lastWrapper = messagesContainer.lastElementChild as HTMLElement;
          const contentDiv = lastWrapper?.querySelector('.flex.flex-col') as HTMLElement;
          if (contentDiv) {
            const bubble = document.createElement('div');
            bubble.className = 'bg-cyber-darker text-white px-4 py-2 rounded-lg border border-neon-pink/30 mt-2';
            bubble.textContent = m.content;
            contentDiv.appendChild(bubble);
          }
        } else {
          // Create a new message group
          const msgWrapper = document.createElement('div');
          msgWrapper.className = 'chat-message-cyber flex items-start space-x-4 mb-4';

          // --- Avatar cliquable ---
          const avatarLink = document.createElement('a');
          avatarLink.href = m.username ? `/profile/${m.username}` : '#';
          avatarLink.className = 'avatar-link';
          avatarLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (m.username) window.location.href = `/profile/${m.username}`;
          });
          const avatar = document.createElement('img');
          avatar.className = 'w-12 h-12 rounded-full border-2 border-neon-cyan';
          avatar.src = m.avatar_url
            ? (m.avatar_url.startsWith('/') ? m.avatar_url : (m.avatar_url.startsWith('uploads/') ? '/' + m.avatar_url : '/uploads/' + m.avatar_url))
            : '/uploads/default.png';
          avatar.alt = m.username || 'User';
          avatarLink.appendChild(avatar);

          // --- Username cliquable ---
          const usernameLink = document.createElement('a');
          usernameLink.href = m.username ? `/profile/${m.username}` : '#';
          usernameLink.className = 'font-cyber text-neon-cyan text-sm username-link';
          usernameLink.textContent = m.username || 'Unknown';
          usernameLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (m.username) window.location.href = `/profile/${m.username}`;
          });

          const metaRow = document.createElement('div');
          metaRow.className = 'flex items-center space-x-2';

          const meta = document.createElement('span');
          meta.className = 'text-gray-400 text-xs';
          const today = new Date();
          const isToday = date.toDateString() === today.toDateString();
          const formattedDate = isToday
            ? 'Today'
            : `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
          const hour = date.getHours().toString().padStart(2, '0');
          const min = date.getMinutes().toString().padStart(2, '0');
          meta.textContent = `${formattedDate} ${hour}:${min}`;

          metaRow.appendChild(usernameLink);
          metaRow.appendChild(meta);

          const contentDiv = document.createElement('div');
          contentDiv.className = 'flex flex-col';
          contentDiv.appendChild(metaRow);

          const bubble = document.createElement('div');
          bubble.className = 'bg-cyber-darker text-white px-4 py-2 rounded-lg border border-neon-pink/30 mt-2';
          bubble.textContent = m.content;
          contentDiv.appendChild(bubble);

          msgWrapper.appendChild(avatarLink);
          msgWrapper.appendChild(contentDiv);

          messagesContainer.appendChild(msgWrapper);
        }

        // update tracker and auto-scroll
        lastMessage = { username: m.username || '', timestamp: date.getTime() };
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    };

    const sendMessage = () => {
      const content = input.value.trim();
      if (!content || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      this.ws.send(content);
      input.value = '';

      // Auto-scroll to the bottom after sending a message
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        // User data fetched but not used
      });

    // Charger TOUT l'historique des messages depuis la DB
    try {
      const res = await fetch('/api/chat/history', { credentials: 'include' });
      if (res.ok) {
        const allMessages = await res.json();
        allMessages.forEach(addMessageElement);
        // Scroll tout en bas après avoir ajouté tous les messages
        setTimeout(() => {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 0);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }

    let wsReconnectDelay = 1000; // ms, backoff
    let wsReconnectTries = 0;

    // --- Nouvelle fonction de connexion WS avec reconnexion automatique ---
    const connectGeneralWS = () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
      this.ws = new WebSocket('wss://localhost:4430/api/ws/chat');
      this.ws.addEventListener('message', (e) => {
        const data = JSON.parse(e.data);
        if (Array.isArray(data)) {
          data.forEach(addMessageElement);
        } else {
          addMessageElement(data);
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      });
      this.ws.addEventListener('error', (e) => {
        console.error('WebSocket error:', e);
      });
      this.ws.addEventListener('close', () => {
        console.warn('WebSocket connection closed');
        // Reconnexion automatique avec backoff
        wsReconnectTries++;
        setTimeout(() => {
          wsReconnectDelay = Math.min(30000, wsReconnectDelay * 2); // max 30s
          connectGeneralWS();
        }, wsReconnectDelay);
      });
      this.ws.addEventListener('open', () => {
        wsReconnectDelay = 1000;
        wsReconnectTries = 0;
        // --- Keepalive ping ---
        if ((this as any)._chatPingInterval) clearInterval((this as any)._chatPingInterval);
        (this as any)._chatPingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send("ping");
        }, 30000);
      });
    };

    // Connecter le WebSocket (avec reconnexion auto)
    connectGeneralWS();

    // --- PRIVATE CHAT LOGIC ---
    // Ajout : Set pour éviter les doublons dans le chat privé
    const displayedPrivateMessages = new Set<string>();

    const privateFriendsList = chatContent.querySelector('#private-friends-list-items') as HTMLElement;
    const privateMessagesContainer = chatContent.querySelector('#private-chat .chat-messages-cyber') as HTMLElement;
    const privateInput = chatContent.querySelector('#private-chat .chat-input-cyber') as HTMLInputElement;
    const privateSendButton = chatContent.querySelector('#private-chat .chat-send-cyber') as HTMLButtonElement;

    // Ajout: variable pour suivre l'ami sélectionné
    let selectedFriendId: number | null = null;

    // Désactive input/bouton au départ
    privateInput.disabled = true;
    privateSendButton.disabled = true;

    // Fetch friends for private chat
    const fetchFriends = async () => {
      try {
        const res = await fetch('/api/friends', { credentials: 'include' });
        const data = await res.json();
        this.friends = data.friends || [];
        privateFriendsList.innerHTML = this.friends.map(friend => {
          const avatarUrl = friend.avatar_url
            ? (friend.avatar_url.startsWith('/') ? friend.avatar_url : (friend.avatar_url.startsWith('uploads/') ? '/' + friend.avatar_url : '/uploads/' + friend.avatar_url))
            : '/uploads/default.png';
          return `
            <div class="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-cyber-dark/40 transition-colors"
              data-friend-id="${friend.id}">
              <img src="${avatarUrl}" class="w-10 h-10 rounded-full border border-neon-cyan" />
              <span class="font-cyber text-white">${friend.username}</span>
            </div>
          `;
        }).join('');
      } catch (err) {
        privateFriendsList.innerHTML = `<div class="text-gray-400 font-cyber">Failed to load friends</div>`;
      }
    };

    // Affiche l'historique et connecte le WS privé
    const selectFriend = async (friendId: number) => {
      selectedFriendId = friendId; // Ajout: mémorise l'ami sélectionné
      privateMessagesContainer.innerHTML = '';
      // Réinitialise le Set pour ce nouvel ami
      displayedPrivateMessages.clear();
      // Ferme l'ancien WS si besoin
      if (this.privateWs) {
        this.privateWs.close();
        this.privateWs = undefined;
      }
      // Charge l'historique
      try {
        const res = await fetch(`/api/private_chat/history/${friendId}`, { credentials: 'include' });
        const messages = await res.json();
        messages.forEach(addPrivateMessageElement);
        // Scroll tout en bas après avoir ajouté tous les messages privés
        setTimeout(() => {
          privateMessagesContainer.scrollTop = privateMessagesContainer.scrollHeight;
        }, 0);
      } catch {}
      // Connecte le WS
      if ('WebSocket' in window) {
        this.privateWs = new WebSocket(`wss://localhost:4430/api/ws/private_chat/${friendId}`);
        this.privateWs.addEventListener('open', () => {
          // --- Keepalive ping for private chat ---
          if ((this as any)._privatePingInterval) clearInterval((this as any)._privatePingInterval);
          (this as any)._privatePingInterval = setInterval(() => {
            if (this.privateWs && this.privateWs.readyState === WebSocket.OPEN) this.privateWs.send("ping");
          }, 30000);
        });
        this.privateWs.addEventListener('message', (e) => {
          const data = JSON.parse(e.data);
          // Gestion du cas où l'utilisateur n'est pas ami
          if (data && data.success === false && data.error === "not_friends") {
            privateMessagesContainer.innerHTML = `
              <div class="text-center text-red-400 font-cyber py-8">
                <div class="text-4xl mb-4">🚫</div>
                <h3 class="text-lg mb-2">You can only chat privately with your friends.</h3>
                <p class="text-gray-400">Add this user as a friend to start a private conversation.</p>
              </div>
            `;
            privateInput.disabled = true;
            privateSendButton.disabled = true;
            return;
          }
          addPrivateMessageElement(data);
          privateMessagesContainer.scrollTop = privateMessagesContainer.scrollHeight;
        });
        this.privateWs.addEventListener('close', () => {});
        this.privateWs.addEventListener('error', () => {});
        // Réactive l'input si jamais il était désactivé
        privateInput.disabled = false;
        privateSendButton.disabled = false;
      }
    };

    // Affiche un message privé
    const addPrivateMessageElement = (m: { content?: string; created_at?: string; username?: string; avatar_url?: string; senderId?: number }) => {
      if (typeof m === 'object' && typeof m.content === 'string') {
        const date = m.created_at ? new Date(m.created_at) : new Date();
        // Clé unique pour chaque message privé
        const key = `${m.username}|${m.created_at}|${m.content}`;
        if (displayedPrivateMessages.has(key)) return;
        displayedPrivateMessages.add(key);
        const msgWrapper = document.createElement('div');
        msgWrapper.className = 'chat-message-cyber flex items-start space-x-4 mb-4' +
          ((m.senderId && (window as any).user && m.senderId === (window as any).user.id) ? ' me' : '');

        // --- Avatar cliquable ---
        const avatarLink = document.createElement('a');
        avatarLink.href = m.username ? `/profile/${m.username}` : '#';
        avatarLink.className = 'avatar-link';
        avatarLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (m.username) window.location.href = `/profile/${m.username}`;
        });
        const avatar = document.createElement('img');
        avatar.className = 'w-12 h-12 rounded-full border-2 border-neon-cyan';
        avatar.src = m.avatar_url
          ? (m.avatar_url.startsWith('/') ? m.avatar_url : (m.avatar_url.startsWith('uploads/') ? '/' + m.avatar_url : '/uploads/' + m.avatar_url))
          : '/uploads/default.png';
        avatar.alt = m.username || 'User';
        avatarLink.appendChild(avatar);

        // --- Username cliquable ---
        const usernameLink = document.createElement('a');
        usernameLink.href = m.username ? `/profile/${m.username}` : '#';
        usernameLink.className = 'font-cyber text-neon-cyan text-sm username-link';
        usernameLink.textContent = m.username || 'Unknown';
        usernameLink.addEventListener('click', (e) => {
          e.preventDefault();
          if (m.username) window.location.href = `/profile/${m.username}`;
        });

        const meta = document.createElement('span');
        meta.className = 'text-gray-400 text-xs';
        const hour = date.getHours().toString().padStart(2, '0');
        const min = date.getMinutes().toString().padStart(2, '0');
        meta.textContent = `${hour}:${min}`;
        const metaRow = document.createElement('div');
        metaRow.className = 'flex items-center space-x-2';
        metaRow.appendChild(usernameLink);
        metaRow.appendChild(meta);
        const bubble = document.createElement('div');
        bubble.className = 'bg-cyber-darker text-white px-4 py-2 rounded-lg border border-neon-pink/30 mt-2';
        bubble.textContent = m.content;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex flex-col';
        contentDiv.appendChild(metaRow);
        contentDiv.appendChild(bubble);
        msgWrapper.appendChild(avatarLink);
        msgWrapper.appendChild(contentDiv);
        privateMessagesContainer.appendChild(msgWrapper);
      }
    };

    // Envoi d'un message privé
    const sendPrivateMessage = () => {
      const content = privateInput.value.trim();
      // Ajout: vérifie qu'un ami est sélectionné
      if (!content || !this.privateWs || this.privateWs.readyState !== WebSocket.OPEN || selectedFriendId === null) return;
      this.privateWs.send(content);
      privateInput.value = '';
      privateMessagesContainer.scrollTop = privateMessagesContainer.scrollHeight;
    };

    privateSendButton.addEventListener('click', sendPrivateMessage);
    privateInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendPrivateMessage();
    });

    // Sélection d'un ami
    privateFriendsList.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('[data-friend-id]');
      if (target) {
        const friendId = Number(target.getAttribute('data-friend-id'));
        selectFriend(friendId);
        // Highlight selection
        privateFriendsList.querySelectorAll('[data-friend-id]').forEach(el => el.classList.remove('bg-cyber-dark/60'));
        target.classList.add('bg-cyber-dark/60');
        // Ajout: active input/bouton
        privateInput.disabled = false;
        privateSendButton.disabled = false;
      }
    });

    // Initialisation de la liste d'amis
    fetchFriends();

    // Ensure the chat container has fixed height and scrolls
    const messagesContainerPrivate = chatContent.querySelector('#private-chat .chat-messages-cyber') as HTMLElement;
    // fixed height to display ~5 messages
    messagesContainerPrivate.style.maxHeight = '20rem';
    messagesContainerPrivate.style.overflowY = 'auto';
    // preserve natural flow
    messagesContainerPrivate.style.display = 'block';

    await super.setupSidebarListeners();
    return this.container;
  }
}

export default LiveChatPage;
