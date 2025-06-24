import { createHeader } from './header';
import { Router } from '../../../router/Router';
import Sidebar from './sidebar';

abstract class Page {
  protected container: HTMLElement;
  protected router: Router | null = null;
  protected sidebar: Sidebar;
  private sessionSocket?: WebSocket;
  static TextObject = {};

  constructor(id: string, router?: Router) {
    this.container = document.createElement('div');
    this.container.id = id;
    this.container.className = 'page-container'; // Ajout d'une classe pour identification
    this.router = router || null;
    this.sidebar = new Sidebar(router || undefined);
    this.setupSessionManagement();
  }

  protected createHeaderTitle(text: string) {
    const headerTitle = document.createElement('h1');
    headerTitle.innerText = text;
    return headerTitle;
  }

  protected createHeader(): string {
    return createHeader(this.router === null ? undefined : this.router);
  }

  async createSidebar(): Promise<string> {
    if (!this.sidebar) return '';
    return await this.sidebar.render();
  }

  protected async setupHeaderListeners(): Promise<void> {
    await setupHeaderEventListeners(this.container, this.router === null ? undefined : this.router);
    const currentPath = window.location.pathname || '/';
    highlightCurrentRoute(this.container, currentPath);
  }
  
  protected async setupSidebarListeners(): Promise<void> {
    await this.sidebar.setupEventListeners(this.container, this.router === null ? undefined : this.router);
  }

  private setupSessionManagement(): void {
    try {
      this.sessionSocket = new WebSocket('wss://localhost:4430/api/ws/session_management');
      
      this.sessionSocket.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'force_logout') {
            this.handleForceLogout();
          }
        } catch (err) {
          console.error('Error parsing session message:', err);
        }
      });

      this.sessionSocket.addEventListener('error', (err) => {
        console.error('Session WebSocket error:', err);
      });

      this.sessionSocket.addEventListener('close', () => {
        // Tentative de reconnexion après 3 secondes
        setTimeout(() => {
          if (!this.sessionSocket || this.sessionSocket.readyState === WebSocket.CLOSED) {
            this.setupSessionManagement();
          }
        }, 3000);
      });
    } catch (err) {
      console.error('Error setting up session management:', err);
    }
  }

  private handleForceLogout(): void {
    // NOUVEAU: Déclencher un événement personnalisé pour notifier l'App
    document.dispatchEvent(new CustomEvent('force-logout'));
    
    // Nettoyage côté client
    (window as any).user = null;
    
    // Supprime tous les cookies côté client
    const cookiesToClear = ['token', 'session_id'];
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure;`;
    });
    
    // Supprime aussi du localStorage
    localStorage.removeItem('session_id');
    localStorage.removeItem('auth_token');

    // Affiche une notification
    import('../../utils/notifications').then(({ showNotification }) => {
      showNotification('You have been signed out from all devices', 'success');
    });

    // Redirection vers la page de connexion
    setTimeout(() => {
      if (this.router) {
        this.router.navigate('/login');
      } else {
        window.location.href = '/login';
      }
    }, 1000);
  }

  abstract render(): Promise<HTMLElement>;

  destroy(): void {
    // AMÉLIORATION : Fermer la connexion WebSocket lors de la destruction
    if (this.sessionSocket) {
      this.sessionSocket.close();
    }
    // AMÉLIORATION : Nettoyage plus agressif du container
    if (this.container) {
      this.container.innerHTML = '';
      if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
    }
    this.cleanup();
  }

  protected cleanup(): void {
    // AMÉLIORATION : Nettoyage plus approfondi des event listeners
    if (this.container) {
      // Supprimer tous les event listeners en clonant les éléments
      const allElements = this.container.querySelectorAll('*');
      allElements.forEach(element => {
        if (element.parentNode) {
          // Replace with a clone to remove all listeners
          const clonedElement = element.cloneNode(true);
          element.parentNode.replaceChild(clonedElement, element);
        }
      });
    }
  }
}

export default Page;

function highlightCurrentRoute(container: HTMLElement, currentPath: string) {
  const sidebarLinks = container.querySelectorAll('.sidebar a[href]');
  sidebarLinks.forEach(link => {
    const href = (link as HTMLAnchorElement).getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

async function setupHeaderEventListeners(container: HTMLElement, router: Router | undefined): Promise<void> {
  const headerLinks = container.querySelectorAll('.header a[href]');
  headerLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const href = (link as HTMLAnchorElement).getAttribute('href');
      if (router && href) {
        router.navigate(href);
      } else if (href) {
        window.location.href = href;
      }
    });
  });
}

