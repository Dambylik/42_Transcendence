class ChatComponent {
  private container: HTMLElement;
  private messagesContainer: HTMLElement;
  private input: HTMLInputElement;
  private sendButton: HTMLButtonElement;
  private ws?: WebSocket;

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'chat-container-cyber';

    // Titre du chat
    const title = document.createElement('div');
    title.className = 'chat-title-cyber font-cyber text-neon-cyan';
    title.textContent = 'Live Chat';

    this.messagesContainer = document.createElement('div');
    this.messagesContainer.className = 'chat-messages-cyber'; // <-- retiré 'scanlines'

    this.input = document.createElement('input');
    this.input.className = 'chat-input-cyber font-cyber';
    this.input.placeholder = 'Type your message...';

    this.sendButton = document.createElement('button');
    this.sendButton.textContent = 'Send';
    this.sendButton.className = 'chat-send-cyber font-cyber';

    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    // Ajout du style cyberpunk rose et grand format + style Discord
    const style = document.createElement('style');
    style.textContent = `
      .chat-container-cyber {
        width: 90vw;
        height: 80vh;
        max-width: 900px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        background: #1a0025;
        border: 3px solid #ff2a6d;
        border-radius: 32px;
        box-shadow:
          0 0 32px #ff2a6dcc,
          0 0 64px #ff2a6dcc,
          0 0 8px #fff2;
        overflow: hidden;
        margin: 3vh auto;
        position: relative;
      }
      .chat-title-cyber {
        padding: 32px 0 18px 0;
        text-align: center;
        font-size: 2.2rem;
        letter-spacing: 0.12em;
        text-shadow:
          0 0 16px #ff2a6d,
          0 0 32px #ffb6e6;
        border-bottom: 2px solid #ff2a6d88;
        background: linear-gradient(90deg, #2a003f 60%, #ff2a6d33 100%);
        color: #ffb6e6;
      }
      .chat-messages-cyber {
        flex: 1;
        padding: 32px 32px 18px 32px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 24px;
        background: #1a0025;
        font-size: 1.35rem;
        scrollbar-width: thin;
        scrollbar-color: #ff2a6d #2a003f;
        min-height: 0;
      }
      .chat-messages-cyber::-webkit-scrollbar {
        width: 10px;
        background: #2a003f;
      }
      .chat-messages-cyber::-webkit-scrollbar-thumb {
        background: #ff2a6d;
        border-radius: 8px;
      }
      .chat-message-cyber {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 8px;
        max-width: 90%;
        padding: 0;
      }
      .chat-message-cyber.me {
        flex-direction: row-reverse;
        align-self: flex-end;
        text-align: right;
      }
      .chat-avatar-cyber {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #05d9e8;
        background: #222;
        margin-top: 2px;
      }
      .chat-content-cyber {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        min-width: 0;
        flex: 1;
      }
      .chat-message-cyber.me .chat-content-cyber {
        align-items: flex-end;
      }
      .chat-meta-row-cyber {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }
      .chat-username-cyber {
        font-family: 'Orbitron', monospace, sans-serif;
        font-size: 1.1rem;
        font-weight: bold;
        color: #05d9e8;
        letter-spacing: 0.04em;
        margin-right: 4px;
        text-shadow: 0 0 6px #05d9e8cc;
      }
      .chat-message-cyber.me .chat-username-cyber {
        color: #ff2a6d;
        text-shadow: 0 0 6px #ff2a6dcc;
      }
      .chat-meta-cyber {
        font-size: 0.95rem;
        color: #ffb6e6cc;
        font-family: monospace;
        opacity: 0.8;
      }
      .chat-bubble-cyber {
        padding: 14px 22px;
        border-radius: 18px 18px 8px 18px;
        background: linear-gradient(90deg, #3f003f 80%, #ff2a6d 120%);
        color: #fff;
        font-family: 'Orbitron', monospace, sans-serif;
        font-size: 1.15rem;
        box-shadow: 0 0 12px #ff2a6dcc, 0 0 2px #fff2;
        border: 2px solid #ff2a6d;
        word-break: break-word;
        transition: background 0.2s;
        margin: 0;
      }
      .chat-message-cyber.me .chat-bubble-cyber {
        background: linear-gradient(90deg, #ffb6e6 10%, #3f003f 100%);
        border-color: #ffb6e6;
        color: #1a0025;
        text-align: right;
      }
      .chat-input-row-cyber {
        display: flex;
        border-top: 2.5px solid #ff2a6d;
        background: #3f003f;
        padding: 0;
        min-height: 80px;
        align-items: stretch;
      }
      .chat-input-cyber {
        flex: 1;
        background: transparent;
        border: none;
        color: #fff;
        font-size: 1.5rem;
        padding: 28px 24px;
        outline: none;
        font-family: 'Orbitron', monospace, sans-serif;
        letter-spacing: 0.08em;
        min-width: 0;
      }
      .chat-input-cyber::placeholder {
        color: #ffb6e6cc;
        opacity: 1;
        font-style: italic;
      }
      .chat-send-cyber {
        border: none;
        background: linear-gradient(90deg, #ff2a6d 60%, #ffb6e6 100%);
        color: #fff;
        font-size: 1.5rem;
        font-family: 'Orbitron', monospace, sans-serif;
        padding: 0 48px;
        cursor: pointer;
        border-radius: 0 0 0 0;
        transition: background 0.2s, box-shadow 0.2s;
        box-shadow: 0 0 16px #ff2a6dcc;
        letter-spacing: 0.12em;
        height: 100%;
        min-width: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 0;
        margin-right: 0;
      }
      .chat-send-cyber:hover {
        background: linear-gradient(90deg, #ffb6e6 10%, #ff2a6d 100%);
        box-shadow: 0 0 32px #ffb6e6cc;
        color: #1a0025;
      }
    `;
    document.head.appendChild(style);

    // Ligne d'input stylée
    const inputRow = document.createElement('div');
    inputRow.className = 'chat-input-row-cyber';
    inputRow.appendChild(this.input);
    inputRow.appendChild(this.sendButton);

    this.container.appendChild(title);
    this.container.appendChild(this.messagesContainer);
    this.container.appendChild(inputRow);

    // Récupère l'id utilisateur courant via /api/me
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        // Utilisateur courant récupéré, mais non utilisé
      });

    // Ajout reconnexion automatique WS
    let wsReconnectDelay = 1000;
    let wsReconnectTries = 0;
    const connectWS = () => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
      this.ws = new WebSocket('wss://localhost:4430/api/ws/chat');
      this.ws.addEventListener('message', e => {
        const data = JSON.parse(e.data);
        if (Array.isArray(data)) {
          data.forEach(m => this.addMessageElement(m));
        } else {
          this.addMessageElement(data);
        }
      });
      this.ws.addEventListener('error', (e) => {
        console.error('WebSocket error:', e);
      });
      this.ws.addEventListener('close', () => {
        console.warn('WebSocket connection closed');
        wsReconnectTries++;
        setTimeout(() => {
          wsReconnectDelay = Math.min(30000, wsReconnectDelay * 2);
          connectWS();
        }, wsReconnectDelay);
      });
      this.ws.addEventListener('open', () => {
        wsReconnectDelay = 1000;
        wsReconnectTries = 0;
      });
    };

    // connect to chat WS (remplace l'ancien code)
    connectWS();
  }

  private sendMessage(): void {
    const content = this.input.value.trim();
    if (!content || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    // Envoie juste le texte, le serveur s'occupe du reste
    this.ws.send(content);
    this.input.value = '';
  }

  private addMessageElement(
    m: { content?: string; created_at?: string; username?: string; avatar_url?: string; senderId?: number }
  ) {
    if (typeof m === 'object' && typeof m.content === 'string') {
      // Supprime la logique d'alignement à droite
      // const isMe = this.myUserId && m.senderId && this.myUserId === m.senderId;

      const msgWrapper = document.createElement('div');
      msgWrapper.className = 'chat-message-cyber'; // plus de "me"

      // Avatar
      const avatar = document.createElement('img');
      avatar.className = 'chat-avatar-cyber';
      avatar.src = m.avatar_url
        ? (m.avatar_url.startsWith('/') ? m.avatar_url : (m.avatar_url.startsWith('uploads/') ? '/' + m.avatar_url : '/uploads/' + m.avatar_url))
        : '/uploads/default.png'; // Correction: toujours chemin complet
      avatar.alt = m.username || 'User';

      // Content
      const contentDiv = document.createElement('div');
      contentDiv.className = 'chat-content-cyber';

      // Username + heure
      const metaRow = document.createElement('div');
      metaRow.className = 'chat-meta-row-cyber';

      const username = document.createElement('span');
      username.className = 'chat-username-cyber';
      username.textContent = m.username || 'Unknown';

      const meta = document.createElement('span');
      meta.className = 'chat-meta-cyber';
      const date = m.created_at ? new Date(m.created_at) : new Date();
      const hour = date.getHours().toString().padStart(2, '0');
      const min = date.getMinutes().toString().padStart(2, '0');
      meta.textContent = `${hour}:${min}`;

      metaRow.appendChild(username);
      metaRow.appendChild(meta);

      // Message bubble
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble-cyber';
      bubble.textContent = m.content;

      contentDiv.appendChild(metaRow);
      contentDiv.appendChild(bubble);

      msgWrapper.appendChild(avatar);
      msgWrapper.appendChild(contentDiv);

      this.messagesContainer.appendChild(msgWrapper);

      // Scroll le dernier message dans la vue
      msgWrapper.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }

  render(): HTMLElement {
    return this.container;
  }
}

export default ChatComponent;
