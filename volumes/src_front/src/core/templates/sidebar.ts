import { Router } from '../../../router/Router';
import { handleAvatarUpload } from '../../utils/avatarUtils';

export class Sidebar {
  private username: string = 'LOADING...';
  private router?: Router;
  private inactivityTimeout: any;

  constructor(router?: Router) {
    this.router = router;
    this.fetchUsername();
    this.setupInactivityDetection();
    
  document.addEventListener('avatar-updated', ((event: Event) => {
      const customEvent = event as CustomEvent<{avatarUrl: string}>;
      if (customEvent.detail && customEvent.detail.avatarUrl) {
        this.updateAvatarInSidebar(customEvent.detail.avatarUrl);
      }
    }) as EventListener);
    
  document.addEventListener('username-updated', ((event: Event) => {
      const customEvent = event as CustomEvent<{username: string}>;
      if (customEvent.detail && customEvent.detail.username) {
        this.username = customEvent.detail.username;
        this.updateUsername();
      }
    }) as EventListener);
  }

  private async fetchUsername(): Promise<void> {
    const maxRetries = 3;
    let retries = 0;

    const tryFetch = async () => {
      try {
        const response = await fetch('/api/test_my_profile');
        if (response.ok) {
          const data = await response.json();
          if (data && data.username) {
            this.username = data.username;
            (window as any).user = { 
              ...((window as any).user || {}), 
              id: data.id || null,
              username: data.username 
            };
            this.updateUsername();
            return true;
          } else {
            console.warn('Incomplete user data in API response:', data);
          }
        } else {
          console.error('Failed to fetch user data, status:', response.status);
        }
      } catch (error) {
        console.error('Error while fetching user data:', error);
      }
      return false;
    };

    if (await tryFetch()) return;

    const retry = async () => {
      if (retries >= maxRetries) {
        console.error('Max retries reached. Could not fetch user data.');
        return;
      }

      retries++;
      const delay = 1000 * retries;

      setTimeout(async () => {
        if (await tryFetch()) return;
        retry();
      }, delay);
    };

    retry();
  }

  private updateUsername(): void {
    const usernameElement = document.querySelector('.sidebar-username');
    const profileLink = document.querySelector('.sidebar-link[href^="/profile/"]') as HTMLAnchorElement;

    if (usernameElement) {
      usernameElement.textContent = this.username;
    }

    if (profileLink) {
      profileLink.href = `/profile/${this.username}`;
    }
  }

  private setupInactivityDetection(): void {
    const resetInactivityTimer = () => {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = setTimeout(() => this.setAFKStatus(), 300000); // 5 minutes
    };

    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    resetInactivityTimer();
  }

  private async setAFKStatus(): Promise<void> {
    try {
      await fetch('/api/set_afk', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error('Failed to set AFK status:', err);
    }
  }
  
  private updateAvatarInSidebar(avatarUrl: string): void {
    const avatarContainers = document.querySelectorAll('.sidebar .avatar-container');
    avatarContainers.forEach(container => {
      const img = container.querySelector('img') as HTMLImageElement;
      if (img) {
        img.src = avatarUrl;
      }
    });
  }

  async render(): Promise<string> {
    let user = (window as any).user;
    if (!user || !user.username) {
      try {
        const res = await fetch('/api/me', { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.username) {
          user = data;
          (window as any).user = data;
          this.username = data.username;
        } else {
          console.warn('Incomplete user data from /api/me:', data);
        }
      } catch (error) {
        console.error('Error fetching user data from /api/me:', error);
      }
    }

    const avatarUrl = user?.avatar_url
      ? (user.avatar_url.startsWith('/') ? user.avatar_url : (user.avatar_url.startsWith('uploads/') ? '/' + user.avatar_url : '/uploads/' + user.avatar_url))
      : '/uploads/default.png';

    // Ajout : styles pour la sidebar et le bouton toggle
    return `
      <style>
        .sidebar {
          z-index: 10000;
          transition: width 0.3s cubic-bezier(.4,2,.6,1), min-width 0.3s, max-width 0.3s, background 0.3s;
        }
        .sidebar.sidebar-collapsed {
          width: 3.5rem !important;
          min-width: 3.5rem !important;
          max-width: 3.5rem !important;
          overflow-x: hidden;
        }
        .sidebar #sidebar-toggle-btn {
          z-index: 10001;
          background: linear-gradient(135deg, #232946 60%, #ff2e9a 100%);
          border: 2px solid #ff2e9a;
          left: 0.5rem;
          top: 0.5rem;
          box-shadow: 0 2px 16px 0 #ff2e9a33, 0 0px 0px 0 #22d3ee00;
          transition: background 0.3s, border 0.3s, box-shadow 0.3s, transform 0.3s;
          animation: sidebar-toggle-pop 0.4s cubic-bezier(.4,2,.6,1);
        }
        .sidebar #sidebar-toggle-btn:hover, .sidebar #sidebar-toggle-btn:focus-visible {
          background: linear-gradient(135deg, #ff2e9a 0%, #22d3ee 100%);
          border: 2px solid #22d3ee;
          box-shadow: 0 4px 32px 0 #22d3ee55, 0 0px 0px 0 #ff2e9a00;
          transform: scale(1.12) rotate(-8deg);
        }
        .sidebar.sidebar-collapsed #sidebar-toggle-btn {
          left: 0.5rem;
          background: linear-gradient(135deg, #232946 60%, #22d3ee 100%);
          border: 2px solid #22d3ee;
        }
        .sidebar.sidebar-collapsed #sidebar-toggle-btn:hover, .sidebar.sidebar-collapsed #sidebar-toggle-btn:focus-visible {
          background: linear-gradient(135deg, #22d3ee 0%, #ff2e9a 100%);
          border: 2px solid #ff2e9a;
          box-shadow: 0 4px 32px 0 #ff2e9a55, 0 0px 0px 0 #22d3ee00;
          transform: scale(1.12) rotate(8deg);
        }
        /* Affiche le bouton même en collapsed */
        .sidebar #sidebar-toggle-btn {
          display: flex !important;
        }
        /* Correction : affiche le logo/avatar section même en collapsed */
        .sidebar.sidebar-collapsed .logo-avatar-section {
          display: block !important;
          padding: 0.5rem 0.25rem !important;
          margin: 0 !important;
        }
        /* Cache tout sauf le bouton et le logo/avatar section */
        .sidebar.sidebar-collapsed > *:not(#sidebar-toggle-btn):not(.logo-avatar-section):not(.absolute) {
          display: none !important;
        }
        /* Réduit la taille du logo/avatar section en collapsed */
        .sidebar.sidebar-collapsed .logo-avatar-section .w-32,
        .sidebar.sidebar-collapsed .logo-avatar-section .h-32 {
          width: 2.5rem !important;
          height: 2.5rem !important;
          min-width: 2.5rem !important;
          min-height: 2.5rem !important;
          margin-bottom: 0 !important;
        }
        .sidebar.sidebar-collapsed .sidebar-username,
        .sidebar.sidebar-collapsed .logo-avatar-section p,
        .sidebar.sidebar-collapsed .logo-avatar-section div.text-neon-pink {
          display: none !important;
        }
        /* Animation pop pour le bouton */
        @keyframes sidebar-toggle-pop {
          0% { transform: scale(0.7) rotate(-10deg);}
          60% { transform: scale(1.15) rotate(6deg);}
          100% { transform: scale(1) rotate(0);}
        }
        /* Animation slide pour la sidebar */
        .sidebar,
        .sidebar.sidebar-collapsed {
          will-change: width;
        }
      </style>
      <div class="sidebar w-80 h-screen bg-cyber-darker/90 backdrop-blur-md border-r border-neon-pink/30 flex flex-col relative overflow-y-auto pt-0 transition-all duration-300">
        <button id="sidebar-toggle-btn" class="absolute top-4 left-4 z-[9999] w-10 h-10 bg-cyber-dark border-2 border-neon-pink rounded-full flex items-center justify-center shadow-lg hover:bg-cyber-darker transition-all duration-200 focus:outline-none" title="Toggle sidebar">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-neon-pink transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <g class="sidebar-toggle-icon">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 12H5" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5l-7 7 7 7" />
            </g>
          </svg>
        </button>
        <div class="p-8 border-b border-neon-pink/30 relative cyber-panel cursor-pointer transition-all duration-300 hover:scale-105 logo-avatar-section">
          <div class="w-32 h-32 mx-auto mb-6 relative">
            <div class="w-full h-full bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20 rounded-lg border-2 border-neon-pink flex items-center justify-center avatar-container">
				<img src="${avatarUrl}" alt="User Avatar" class="w-full h-full object-cover rounded-lg" />
            </div>
            <!-- Corner brackets -->
            <div class="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-neon-pink"></div>
            <div class="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-neon-cyan"></div>
            <div class="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-neon-cyan"></div>
            <div class="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-neon-pink"></div>
          </div>
          <h2 class="text-center text-neon-cyan font-cyber text-xl tracking-wider sidebar-username">${user?.username || this.username}</h2>
          <p class="text-center text-gray-400 font-tech text-sm mt-2">LEVEL ${user?.level || 0}</p>
          <p class="text-center text-gray-400 font-tech text-sm mt-2">XP: ${user?.xp || 0}</p>
          <div class="text-center text-neon-pink text-xs mt-2 animate-pulse">CLICK TO UPLOAD AVATAR</div>
        </div>

        <!--Profile -->
        <div class="p-8 border-t border-neon-pink/30 relative">
          <a href="/profile/${user?.username || this.username}" class="flex items-center space-x-3 text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-tech text-sm tracking-wider sidebar-link">
            <div class="w-6 h-6 border border-current rounded flex items-center justify-center">
              <div class="w-2 h-2 border-t border-r border-current transform rotate-45"></div>
            </div>
            <span>PROFILE</span>
          </a>
        </div>

        <!--Game -->
        <div class="p-8 border-t border-neon-pink/30 relative">
          <a href="#" class="flex items-center space-x-3 text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-tech text-sm tracking-wider sidebar-link" data-page="dashboard">
            <div class="w-6 h-6 border border-current rounded flex items-center justify-center">
              <div class="w-2 h-2 border-t border-r border-current transform rotate-45"></div>
            </div>
            <span>GAME</span>
          </a>
        </div>

                <!--Tournament -->
        <div class="p-8 border-t border-neon-pink/30 relative">
          <a href="#" class="flex items-center space-x-3 text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-tech text-sm tracking-wider sidebar-link" data-page="tournament">
            <div class="w-6 h-6 border border-current rounded flex items-center justify-center">
              <div class="w-2 h-2 border-t border-r border-current transform rotate-45"></div>
            </div>
            <span>TOURNAMENT</span>
          </a>
        </div>

         <!--Friends -->
        <div class="p-8 border-t border-neon-pink/30 relative">
          <a href="#" class="flex items-center space-x-3 text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-tech text-sm tracking-wider sidebar-link" data-page="friends">
            <div class="w-6 h-6 border border-current rounded flex items-center justify-center">
              <div class="w-2 h-2 border-t border-r border-current transform rotate-45"></div>
            </div>
            <span>FRIENDS</span>
          </a>
        </div>

        <!--Chat -->
        <div class="p-8 border-t border-neon-pink/30 relative">
          <a href="#" class="flex items-center space-x-3 text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-tech text-sm tracking-wider sidebar-link" data-page="chat">
            <div class="w-6 h-6 border border-current rounded flex items-center justify-center">
              <div class="w-2 h-2 border-t border-r border-current transform rotate-45"></div>
            </div>
            <span>CHAT</span>
          </a>
        </div>

        <!-- Settings -->
        <div class="p-8 border-t border-neon-pink/30 relative">
          <a href="#" class="flex items-center space-x-3 text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-tech text-sm tracking-wider sidebar-link" data-page="settings">
            <div class="w-6 h-6 border border-current rounded flex items-center justify-center">
              <div class="w-2 h-2 border-t border-r border-current transform rotate-45"></div>
            </div>
            <span>SETTINGS</span>
          </a>
        </div>
        <!-- Logout Button -->
        <div class="p-8 border-t border-neon-pink/30 mt-auto relative">
          <button id="sidebar-logout-btn" class="w-full bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber text-lg py-3 rounded-md border-2 border-neon-pink/50 hover:border-neon-cyan/50 transition-all duration-300 flex items-center justify-center gap-3">
            <span class="inline-flex items-center justify-center">
              <!-- SVG logout icon -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-neon-cyan drop-shadow-[0_0_6px_#05d9e8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
              </svg>
              <span>LOGOUT</span>
            </span>
          </button>
        </div>

        <!-- Bottom Corner Brackets -->
        <div class="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-neon-cyan"></div>
        <div class="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-neon-pink"></div>
      </div>
    `;
  }

  setupEventListeners(container: HTMLElement, router?: Router): void {
    const sidebarLinks = container.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageTarget = (link as HTMLElement).dataset.page;
        
        if (pageTarget) {
          if (router) {
            router.navigate(`/${pageTarget}`);
          } else if (this.router) {
            this.router.navigate(`/${pageTarget}`);
          } else {
            console.log('Router is not defined in setupHeaderEventListeners.');
          }
        }
      });
    });

    const avatarSection = container.querySelector('.logo-avatar-section');
    if (avatarSection) {
      avatarSection.removeEventListener('click', this.handleAvatarUpload as any); // Remove previous if any
      avatarSection.addEventListener('click', this.handleAvatarUpload.bind(this));
    }

    // Logout button handler
    const logoutBtn = container.querySelector('#sidebar-logout-btn') as HTMLButtonElement;
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // NOUVEAU: Déclencher l'événement de déconnexion
        document.dispatchEvent(new CustomEvent('force-logout'));
        
        try {
          await fetch('/api/logout', { method: 'POST', credentials: 'include' });
        } catch {}
        
        // Utilise la même logique de nettoyage que sign_out_all
        this.clearUserSession();
        
        if (router) {
          router.navigate('/login');
        } else if (this.router) {
          this.router.navigate('/login');
        } else {
          window.location.href = '/login';
        }
      });
    }

    // Ajout : gestion du bouton toggle sidebar
    const sidebar = container.querySelector('.sidebar') as HTMLElement;
    // Correction : cherche le bouton DANS la sidebar
    const toggleBtn = sidebar ? sidebar.querySelector('#sidebar-toggle-btn') as HTMLButtonElement : null;
    if (toggleBtn && sidebar) {
      // Déplace l'initialisation du collapsed APRÈS l'insertion dans le DOM
      setTimeout(() => {
        if (localStorage.getItem('sidebar-collapsed') === '1') {
          sidebar.classList.add('sidebar-collapsed');
        }
      }, 0);
      toggleBtn.onclick = (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('sidebar-collapsed');
        if (sidebar.classList.contains('sidebar-collapsed')) {
          localStorage.setItem('sidebar-collapsed', '1');
        } else {
          localStorage.removeItem('sidebar-collapsed');
        }
      };
    }
  }

  // NOUVEAU : Méthode centralisée pour nettoyer la session utilisateur
  private clearUserSession(): void {
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
  }

  private handleAvatarUpload(): void {
    handleAvatarUpload((avatarUrl) => {
      this.updateAvatarInSidebar(avatarUrl);
    });
  }
}

export default Sidebar;
