import MainPage from '../main/index';
import LoginPage from '../login/login';
import { createHeader } from '../../core/templates/header';
import { Router } from '../../../router/Router';
import ErrorPage from '../error/error';
import RoomPage from '../room/room';
import RegisterPage from '../register/register';
import DashboardPage from '../dashboard/dashboard';
import ProfilePage from '../profile/profile';
import TournamentPage from '../tournament/tournament';
import FriendsPage from '../friends/friends';
import SettingsPage from '../settings/settings';
import LiveChatPage from '../liveChatPage/liveChatPage';
import PlayPage from '../play/play';
import localPong from '../pongs/localPong';
import onlinePongPage from '../pongs/onlinePong';
import aiPongPage from '../pongs/aiPong';
import TestInvite from '../test_invite/test_invite';


export class App {
  private router = new Router('root');
  private isLoggingOut = false;
  private lastPageInstance: any = null;

  constructor() {
    this.setupRoutes();
    this.setupForceLogoutListener();
  }

  private setupForceLogoutListener(): void {
    document.addEventListener('force-logout', () => {
      this.isLoggingOut = true;
      setTimeout(() => {
        this.isLoggingOut = false;
      }, 2000); // Reset après 2 secondes
    });
  }

  private async ensureAuthenticated(): Promise<{ success: boolean; user?: any }> {
    // NOUVEAU: Si on est en train de se déconnecter, ne pas vérifier l'authentification
    if (this.isLoggingOut) {
      return { success: false };
    }
    
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      const data = await res.json();
      if (data && data.success) {
        return { success: true, user: data };
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  }

  private setupRoutes(): void {
    this.router.addRoute('/', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        // Utilisation de setTimeout(..., 0) pour éviter les effets de bord de navigation immédiate
        // et garantir qu'aucune double redirection ne survient.
        setTimeout(() => this.router.navigate('/dashboard'), 0);
        return;
      } else {
        await this.renderPage(MainPage, 'main-page', false, undefined, auth);
      }
    });

    this.router.addRoute('/register', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        setTimeout(() => this.router.navigate('/dashboard'), 0);
        return;
      } else {
        await this.renderPage(RegisterPage, 'register-page', false, undefined, auth);
      }
    });

    this.router.addRoute('/dashboard', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        await this.renderPage(DashboardPage, 'dashboard-page', true, undefined, auth);
      } else {
        setTimeout(() => this.router.navigate('/login'), 0);
      }
    });
    
    this.router.addRoute('/game/local', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        await this.renderPage(localPong, 'local-pong', true, undefined, auth);
      } else {
        this.router.navigate('/login');
      }
    });
    
    this.router.addRoute('/game/online', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        await this.renderPage(onlinePongPage, 'online-pong', true, undefined, auth);
      } else {
        this.router.navigate('/login');
      }
    });

    this.router.addRoute('/game/ai', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        await this.renderPage(aiPongPage, 'ai-pong', true, undefined, auth);
      } else {
        this.router.navigate('/login');
      }
    });

    this.router.addRoute('/profile/:username', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        const match = window.location.pathname.match(/^\/profile\/([^/]+)$/);
        const username = match ? decodeURIComponent(match[1]) : null;
        if (username) {
          await this.renderPage(ProfilePage, `profile-page-${username}`, true, { username }, auth);
        } else {
          this.router.navigate('*');
        }
      } else {
        this.router.navigate('/login');
      }
    });

    this.router.addRoute('/login', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        this.router.navigate('/dashboard');
        return;
      } else {
        await this.renderPage(LoginPage, 'login-page', false, undefined, auth);
      }
    });

    this.router.addRoute('/tournament', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        await this.renderPage(TournamentPage, 'tournament-page', true, undefined, auth);
      } else {
        this.router.navigate('/login');
      }
    });

    this.router.addRoute('/friends', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        await this.renderPage(FriendsPage, 'friends-page', true, undefined, auth);
      } else {
        this.router.navigate('/login');
      }
    });

    this.router.addRoute('/settings', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        await this.renderPage(SettingsPage, 'settings-page', true, undefined, auth);
      } else {
        this.router.navigate('/login');
      }
    });

    this.router.addRoute('/chat', async () => {
      const auth = await this.ensureAuthenticated();
      if (auth.success) {
        await this.renderPage(LiveChatPage, 'chat-page', true, undefined, auth);
      } else {
        this.router.navigate('/login');
      }
    });

    this.router.addRoute('*', async () => {
      await this.renderPage(ErrorPage, 'error-page', false, undefined, { success: false });
    });

    this.router.addRoute('/room', async () => {
      await this.renderPage(RoomPage, 'room-page', false, undefined, { success: false });
    });

    this.router.addRoute('/play', async () => {
      await this.renderPage(PlayPage, 'play-page', false, undefined, { success: false });
    });
    
    this.router.addRoute('/test_invite', async () => {
      await this.renderPage(TestInvite, 'testinvite-page', false, undefined, { success: false });
    });
  }

  private async renderPage<T extends new (id: string, router: any, options?: any) => { render: () => Promise<HTMLElement>; destroy?: () => void }>(
    PageClass: T,
    id: string,
    includeHeader: boolean = true,
    options?: any,
    auth?: { success: boolean; user?: any }
  ): Promise<void> {
    // Utiliser le résultat d'ensureAuthenticated() pour éviter un second fetch
    const isAuthenticated = auth ? auth.success : false;
    if (!isAuthenticated && id !== 'login-page' && id !== 'register-page' && id !== 'main-page' && id !== 'error-page' && id !== 'room-page' && id !== 'play-page' && id !== 'testinvite-page') {
      this.router.navigate('/login');
      return;
    }

    const app = document.getElementById('root')!;

    // Clean up previous page instance first
    if (this.lastPageInstance && typeof this.lastPageInstance.destroy === 'function') {
      this.lastPageInstance.destroy();
    }
    this.lastPageInstance = null;

    // Clear DOM completely
    app.innerHTML = '';

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    if (includeHeader) {
      const headerContainer = document.createElement('div');
      headerContainer.innerHTML = createHeader();
      const headerElement = headerContainer.firstElementChild as HTMLElement;
      if (headerElement) {
        app.appendChild(headerElement);
      }
    }

    try {
      const page = new PageClass(id, {
        navigate: (route: string) => this.router.navigate(route)
      }, options);
      this.lastPageInstance = page;
      const pageElement = await page.render();
      app.appendChild(pageElement);
    } catch (error) {
      console.error('Error rendering page:', error);
      this.router.navigate('*');
    }
  }
}

export default App;