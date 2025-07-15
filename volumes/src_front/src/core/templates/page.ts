import { createHeader } from './header';
import { Router } from '../../../router/Router';
import Sidebar from './sidebar';
import { showNotification } from '../../utils/notifications';
import WebSocketManager from '../../utils/WebSocketManager';

abstract class Page {
  protected container: HTMLElement;
  protected router: Router | null = null;
  protected sidebar: Sidebar;
  protected wsManager = WebSocketManager.getInstance();
  private static sessionManagementSetup = false;
  private static unsubscribeSession?: () => void;
  static TextObject = {};

  constructor(id: string, router?: Router) {
    this.container = document.createElement('div');
    this.container.id = id;
    this.container.className = 'page-container'; // Ajout d'une classe pour identification
    this.router = router || null;
    this.sidebar = new Sidebar(router || undefined);
    // Only setup session management after checking if user is authenticated
    this.checkAuthAndSetupSession();
    
    // Only setup session management once across all page instances
    if (!Page.sessionManagementSetup) {
      this.setupSessionManagement();
      Page.sessionManagementSetup = true;
    }
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

  private async checkAuthAndSetupSession(): Promise<void> {
    try {
      // Only setup session management if we're not on public pages
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/register', '/'];
      
      if (publicPaths.includes(currentPath)) {
        console.log('On public page, skipping session management setup');
        return;
      }

      // Check if user is authenticated by trying to access /api/me
      const response = await fetch('/api/me', { credentials: 'include' });
      if (response.ok) {
        // User is authenticated, setup session management
        this.setupSessionManagement();
      } else {
        // User is not authenticated, no need for session management
        console.log('User not authenticated, skipping session management setup');
      }
    } catch (error) {
      console.log('Auth check failed, skipping session management setup:', error);
    }
  }

  private setupSessionManagement(): void {
    try {
      Page.unsubscribeSession = this.wsManager.subscribeToSessionManagement((data) => {
        if (data.type === 'force_logout') {
          this.handleForceLogout();
        }
      });
      console.log('Session management WebSocket setup successful');
    } catch (err) {
      console.error('Error setting up session management:', err);
      // Don't throw the error, just log it
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

    // Clear Google session to remove "Signed in as ..." from Google button
    try {
      if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        (google.accounts.id as any).disableAutoSelect?.();
      }
    } catch (error) {
      console.log('Google session clearing not available:', error);
    }

    // Affiche une notification
    showNotification('You have been signed out from all devices', 'success');

    // Redirection vers la page de connexion
    setTimeout(() => {
      if (this.router) {
        this.router.navigate('/login');
      } else {
        window.location.href = '/login';
      }
    }, 1000);
  }

  public static cleanupSessionManagement(): void {
    if (Page.unsubscribeSession) {
      Page.unsubscribeSession();
      Page.unsubscribeSession = undefined;
      Page.sessionManagementSetup = false;
    }
  }

  abstract render(): Promise<HTMLElement>;

  destroy(): void {
    
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

