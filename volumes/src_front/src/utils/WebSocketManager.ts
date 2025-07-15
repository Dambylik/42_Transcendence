/**
 * WebSocketManager - Singleton pour gérer les connexions WebSocket
 * Utilise BroadcastChannel pour partager les connexions entre les onglets
 */

interface WebSocketConnection {
  ws: WebSocket;
  listeners: Set<(data: any) => void>;
  reconnectDelay: number;
  reconnectTries: number;
  isReconnecting: boolean;
  pingInterval?: number;
}

class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<string, WebSocketConnection> = new Map();
  private broadcastChannel: BroadcastChannel;
  private isMainTab = false;
  private heartbeatInterval?: number;

  private constructor() {
    this.broadcastChannel = new BroadcastChannel('websocket-manager');
    this.setupBroadcastChannelListeners();
    this.checkIfMainTab();
    this.startHeartbeat();
    
    // Nettoyage quand la page se ferme
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Gestion de la visibilité de la page
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkIfMainTab();
      }
    });
  }

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private setupBroadcastChannelListeners() {
    this.broadcastChannel.addEventListener('message', (event) => {
      const { type, endpoint, data } = event.data;

      switch (type) {
        case 'websocket-message':
          // Retransmettre le message aux listeners locaux
          this.notifyListeners(endpoint, data);
          break;

        case 'request-main-tab':
          if (this.isMainTab) {
            this.broadcastChannel.postMessage({
              type: 'main-tab-response',
              isMainTab: true
            });
          }
          break;

        case 'main-tab-response':
          // Un autre onglet est déjà l'onglet principal
          this.isMainTab = false;
          break;

        case 'main-tab-closed':
          // L'onglet principal se ferme, vérifier si on peut prendre le relais
          setTimeout(() => this.checkIfMainTab(), 100);
          break;

        case 'heartbeat':
          // Un autre onglet est actif
          if (!this.isMainTab) {
            this.isMainTab = false;
          }
          break;
      }
    });
  }

  private checkIfMainTab() {
    // Demander si un autre onglet est déjà principal
    this.broadcastChannel.postMessage({ type: 'request-main-tab' });
    
    // Si aucune réponse dans 100ms, devenir l'onglet principal
    setTimeout(() => {
      if (!this.isMainTab) {
        this.isMainTab = true;
        // console.log('This tab became the main WebSocket tab');
      }
    }, 100);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isMainTab) {
        this.broadcastChannel.postMessage({ type: 'heartbeat' });
      }
    }, 5000);
  }

  private notifyListeners(endpoint: string, data: any) {
    const connection = this.connections.get(endpoint);
    if (connection) {
      connection.listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  public subscribe(endpoint: string, listener: (data: any) => void): () => void {
    if (!this.connections.has(endpoint)) {
      this.connections.set(endpoint, {
        ws: null as any,
        listeners: new Set(),
        reconnectDelay: 1000,
        reconnectTries: 0,
        isReconnecting: false
      });
    }

    const connection = this.connections.get(endpoint)!;
    connection.listeners.add(listener);

    // Si c'est l'onglet principal, s'assurer que la connexion WebSocket existe
    if (this.isMainTab) {
      this.ensureConnection(endpoint);
    }

    // Retourner une fonction de désabonnement
    return () => {
      connection.listeners.delete(listener);
      
      // Si plus de listeners et qu'on est l'onglet principal, fermer la connexion
      if (connection.listeners.size === 0 && this.isMainTab) {
        this.closeConnection(endpoint);
      }
    };
  }

  private ensureConnection(endpoint: string) {
    const connection = this.connections.get(endpoint);
    if (!connection) return;

    if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
      return; // Connexion déjà active
    }

    if (connection.isReconnecting) {
      return; // Reconnexion déjà en cours
    }

    this.createConnection(endpoint);
  }

  private createConnection(endpoint: string) {
    const connection = this.connections.get(endpoint);
    if (!connection) return;

    try {
      const wsUrl = `wss://localhost:4430${endpoint}`;
      connection.ws = new WebSocket(wsUrl);

      connection.ws.addEventListener('open', () => {
        //console.log(`WebSocket connected: ${endpoint}`);
        connection.reconnectDelay = 1000;
        connection.reconnectTries = 0;
        connection.isReconnecting = false;

        // Démarrer le ping pour maintenir la connexion
        this.startPing(endpoint);
      });

      connection.ws.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Check if it's an authentication error
          if (data.success === false && data.error === 'cookie_jwt') {
            console.log(`Authentication failed for WebSocket ${endpoint}, not reconnecting`);
            connection.ws.close();
            return;
          }
          
          // Notifier les listeners locaux
          this.notifyListeners(endpoint, data);
          
          // Diffuser aux autres onglets
          this.broadcastChannel.postMessage({
            type: 'websocket-message',
            endpoint,
            data
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      connection.ws.addEventListener('close', (event) => {
        //console.log(`WebSocket closed: ${endpoint}`);
        this.stopPing(endpoint);
        
        // Don't reconnect on authentication failures (code 1000 is normal close)
        // Also don't reconnect if it's an authentication error
        if (event.code !== 1000 && event.code !== 1008 && this.isMainTab && connection.listeners.size > 0) {
          this.scheduleReconnection(endpoint);
        }
      });

      connection.ws.addEventListener('error', (error) => {
        //console.error(`WebSocket error on ${endpoint}:`, error);
      });

    } catch (error) {
      console.error(`Failed to create WebSocket for ${endpoint}:`, error);
      this.scheduleReconnection(endpoint);
    }
  }

  private scheduleReconnection(endpoint: string) {
    const connection = this.connections.get(endpoint);
    if (!connection || connection.isReconnecting) return;

    connection.isReconnecting = true;
    connection.reconnectTries++;

    const delay = Math.min(30000, connection.reconnectDelay * Math.pow(2, connection.reconnectTries - 1));
    
    setTimeout(() => {
      if (this.isMainTab && connection.listeners.size > 0) {
        this.createConnection(endpoint);
      } else {
        connection.isReconnecting = false;
      }
    }, delay);
  }

  private startPing(endpoint: string) {
    const connection = this.connections.get(endpoint);
    if (!connection) return;

    this.stopPing(endpoint); // S'assurer qu'il n'y a qu'un seul ping

    connection.pingInterval = setInterval(() => {
      if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send('ping');
      }
    }, 30000);
  }

  private stopPing(endpoint: string) {
    const connection = this.connections.get(endpoint);
    if (connection && connection.pingInterval) {
      clearInterval(connection.pingInterval);
      connection.pingInterval = undefined;
    }
  }

  public send(endpoint: string, message: string | object) {
    // Seul l'onglet principal peut envoyer des messages
    if (!this.isMainTab) {
      console.warn('Only main tab can send WebSocket messages');
      return false;
    }

    const connection = this.connections.get(endpoint);
    if (!connection || !connection.ws || connection.ws.readyState !== WebSocket.OPEN) {
      console.warn(`WebSocket not connected for endpoint: ${endpoint}`);
      return false;
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      connection.ws.send(messageStr);
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  private closeConnection(endpoint: string) {
    const connection = this.connections.get(endpoint);
    if (!connection) return;

    this.stopPing(endpoint);

    if (connection.ws) {
      connection.ws.close(1000, 'No more listeners');
    }

    this.connections.delete(endpoint);
  }

  private cleanup() {
    if (this.isMainTab) {
      this.broadcastChannel.postMessage({ type: 'main-tab-closed' });
    }

    // Fermer toutes les connexions
    this.connections.forEach((_, endpoint) => {
      this.closeConnection(endpoint);
    });

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.broadcastChannel.close();
  }

  // Méthodes utilitaires pour les endpoints spécifiques
  public subscribeToChatGeneral(listener: (data: any) => void) {
    return this.subscribe('/api/ws/chat', listener);
  }

  public subscribeToPrivateChat(friendId: number, listener: (data: any) => void) {
    return this.subscribe(`/api/ws/private_chat/${friendId}`, listener);
  }

  public subscribeToFriendNotifications(listener: (data: any) => void) {
    return this.subscribe('/api/ws/friend_notifications', listener);
  }

  public subscribeToOnlineStatus(listener: (data: any) => void) {
    return this.subscribe('/api/ws/online_status', listener);
  }

  public subscribeToSessionManagement(listener: (data: any) => void) {
    return this.subscribe('/api/ws/session_management', listener);
  }

  public sendChatMessage(message: string) {
    return this.send('/api/ws/chat', message);
  }

  public sendPrivateChatMessage(friendId: number, message: string) {
    return this.send(`/api/ws/private_chat/${friendId}`, message);
  }
}

export default WebSocketManager;
