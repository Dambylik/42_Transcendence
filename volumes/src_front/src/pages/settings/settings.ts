import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import { showNotification } from '../../utils/notifications';
import { handleAvatarUpload, handleAvatarRemoval } from '../../utils/avatarUtils';
import { createPageLayout } from '../../utils/headerUtils';

type UserData = {
    username: string;
    avatar_url: string;
    level: number;
    created_at: string;
    is_2fa_enabled: boolean;
    last_username_change: string | null;
}

class SettingsPage extends Page {
    private userData: UserData = {
        username: '',
        avatar_url: '',
        level: 0,
        created_at: '',
        is_2fa_enabled: false,
        last_username_change: null
    };

    constructor(id: string, router?: Router) {
        super(id, router);
    }
    
    private canChangeUsername(): { canChange: boolean, remainingDays?: number } {
        if (!this.userData.last_username_change) return { canChange: true };
        const lastChange = new Date(this.userData.last_username_change);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 30) return { canChange: true };
        return { canChange: false, remainingDays: 30 - diffDays };
    }

    
    async render(): Promise<HTMLElement> {
        // AMÉLIORATION : Nettoyage plus agressif avant le rendu
        this.container.innerHTML = '';
        await super.setupHeaderListeners();

        const profileContent = document.createElement('div');
        profileContent.className = 'min-h-screen pt-16 relative overflow-hidden flex flex-row bg-cyber-dark'; 
        profileContent.id = 'settings-page-container';
        
        profileContent.innerHTML = `
        ${await super.createSidebar()}
        ${createPageLayout('SETTINGS DASHBOARD', 2, 'profile-settings-container', 'security-container')}
        `;
        
        this.container.appendChild(profileContent);

        await super.setupSidebarListeners();

        // Après affichage : on fetch et on render les composants
        this.loadAndRender();

        return this.container;
    }

    /** Affiche la page d'abord, puis fetch et render les settings */
    private async loadAndRender(): Promise<void> {
        try {
            try {
                const res = await fetch('/api/me', { credentials: 'include' });
                const data = await res.json();
                
                if (!data.success)
                    throw new Error(data.error || 'Failed to fetch profile');
                
                // Fix the avatar_url logic
                this.userData.avatar_url = data.avatar_url 
                ? (data.avatar_url.startsWith('/') 
                ? data.avatar_url 
                : (data.avatar_url.startsWith('uploads/') ? '/' + data.avatar_url : '/uploads/' + data.avatar_url))
                : '/uploads/default.png';
                
                this.userData.username = data.username || '';
                this.userData.level = data.level || 0;
                this.userData.created_at = data.created_at || '';
                this.userData.is_2fa_enabled = data.is_2fa_enabled || false;
                this.userData.last_username_change = data.last_username_change || null;
            } catch (error) {
                console.error('Error fetching user data:', error);
                showNotification('Failed to load your profile data. Please try again later.', 'error');
                this.userData.username = 'User';
                this.userData.avatar_url = '/uploads/default.png';
                this.userData.level = 1;
                this.userData.created_at = new Date().toISOString();
                this.userData.is_2fa_enabled = false;
                this.userData.last_username_change = null;
            }    
            this.renderSettingsComponents();
        } catch (err) {
            console.error('Erreur lors du chargement des données de settings :', err);
        }
    }

    private renderSettingsComponents(): void {
        const profileContainer = document.getElementById('profile-settings-container');
        const securityContainer = document.getElementById('security-container');
        // on vide avant chaque rendu pour éviter les doublons
        if (profileContainer) profileContainer.innerHTML = '';
        if (securityContainer) securityContainer.innerHTML = '';

        if (profileContainer && securityContainer) {
            this.renderProfileWithPasswordSettings(profileContainer);
            this.renderSecuritySettings(securityContainer);
        } else {
            console.error('One or more settings containers not found!');
        }
    }
    


    private renderSecuritySettings(container: HTMLElement): void {
        const card = document.createElement('div');
        card.className = 'cyber-panel bg-cyber-darker/80 p-6 border-2 border-green-500/30 backdrop-blur-sm relative flex flex-col h-full overflow-auto flex-grow';
        card.innerHTML = `
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-cyber font-bold text-neon-pink tracking-wider">ACCOUNT SECURITY</h2>
                <div class="w-8 h-8 bg-cyber-dark border border-cyan-500/50 flex items-center justify-center text-green-400">
                    🔐
                </div>
            </div>
            <p class="text-gray-400 mb-6">Manage your account security settings</p>
            
            <!-- Two-Factor Authentication -->
            <div class="mb-6 p-4 bg-cyber-dark border border-neon-cyan/20 rounded">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="text-neon-cyan font-tech">TWO-FACTOR AUTHENTICATION</h3>
                        <p class="text-gray-400 text-sm mt-1">Add an extra layer of security to your account</p>
                    </div>
                    <div class="relative inline-block w-12 h-6 bg-cyber-dark rounded-full cursor-pointer">
                        <input type="checkbox" id="tfa-toggle" class="sr-only" ${this.userData.is_2fa_enabled ? 'checked' : ''}>
                        <span class="slider absolute inset-0 bg-gray-600 rounded-full transition-all duration-300"></span>
                        <span class="tfa-indicator absolute left-1 top-1 ${this.userData.is_2fa_enabled ? 'bg-green-400 translate-x-6' : 'bg-gray-400 translate-x-0'} w-4 h-4 rounded-full transition-transform duration-300"></span>
                    </div>
                </div>
            </div>
            
            <!-- QR Code Section (shown only when 2FA is enabled) -->
            <div id="tfa-setup" class="hidden mb-6 p-4 bg-cyber-dark border border-neon-cyan/20 rounded">
                <h3 class="text-neon-cyan font-tech mb-3">SETUP TWO-FACTOR AUTHENTICATION</h3>
                <p class="text-gray-400 text-sm mb-4">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                <div class="flex justify-center mb-4">
                    <div class="relative w-36 h-36 bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20 rounded-lg border-2 border-neon-pink flex items-center justify-center">
                        <div class="w-full h-full border-8 border-cyber-dark rounded flex items-center justify-center">
                            <span class="text-white font-cyber text-xs text-center">QR Code will appear here when activated</span>
                             <div class="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-neon-pink"></div>
                            <div class="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-neon-cyan"></div>
                            <div class="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-neon-cyan"></div>
                            <div class="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-neon-pink"></div>
                        </div>
                    </div>
                </div>

                <div class="space-y-4">
                    <div>
                        <label for="verificationCode" class="text-neon-cyan font-tech text-sm block mb-1">VERIFICATION CODE</label>
                        <input 
                            type="text" 
                            id="verificationCode" 
                            placeholder="Enter 6-digit code" 
                            class="w-full bg-cyber-darker border border-neon-pink/30 text-white px-3 py-2 rounded"
                            maxlength="6"
                        />
                    </div>
                    <button id="verify-tfa" class="bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-4 py-2 rounded flex items-center hover:shadow-lg hover:shadow-neon-pink/50 duration-300 w-full justify-center">
                        <span class="mr-2">✓</span>
                        Verify & Enable 2FA
                    </button>
                </div>
            </div>
            
            <!-- Login Activity -->
            <div class="mb-8">
                <h3 class="text-neon-cyan font-tech mb-3">RECENT LOGIN ACTIVITY</h3>
                <div id="login-activity-list" class="space-y-3">
                    <div class="text-center py-4 text-gray-500">
                        Loading login activity...
                    </div>
                </div>
            </div>
            
            <!-- Account Actions -->
            <div class="space-y-3 mt-auto">
                <button class="w-full bg-cyber-dark border border-red-500/50 text-red-400 px-4 py-2 rounded hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 duration-300 flex items-center justify-center" id="sign-out-devices">
                    <span class="mr-2">🚫</span>
                    Sign Out All Devices
                </button>
                <button class="w-full bg-cyber-dark border border-red-500/50 text-red-400 px-4 py-2 rounded hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20 duration-300 flex items-center justify-center" id="delete-account">
                    <span class="mr-2">⚠️</span>
                    Delete Account
                </button>
            </div>
        `;
        container.appendChild(card);
        
        // Two-factor authentication toggle logic
        const tfaToggle = card.querySelector('#tfa-toggle') as HTMLInputElement;
        const tfaIndicator = card.querySelector('.tfa-indicator') as HTMLElement;
        const tfaSetup = card.querySelector('#tfa-setup') as HTMLElement;
        
        if (tfaToggle && tfaIndicator && tfaSetup) {
            if (!this.userData.is_2fa_enabled) {
                tfaSetup.classList.add('hidden');
            } else {
                tfaSetup.classList.remove('hidden');
            }
            
            tfaToggle.addEventListener('change', () => {
                if (tfaToggle.checked) {
                    tfaSetup.classList.remove('hidden');
                    tfaIndicator.classList.remove('translate-x-0', 'bg-gray-400');
                    tfaIndicator.classList.add('translate-x-6', 'bg-green-400');
                } else {
                    tfaSetup.classList.add('hidden');
                    tfaIndicator.classList.remove('translate-x-6', 'bg-green-400');
                    tfaIndicator.classList.add('translate-x-0', 'bg-gray-400');

                    this.userData.is_2fa_enabled = false;
                    showNotification('Two-Factor Authentication has been disabled.', 'error');
                }
            });
            
            const toggleContainer = tfaToggle.closest('.relative');
            if (toggleContainer) {
                toggleContainer.addEventListener('click', (e) => {
                    if (e.target !== tfaToggle) {
                        tfaToggle.checked = !tfaToggle.checked;
                        tfaToggle.dispatchEvent(new Event('change'));
                    }
                });
            }
        }
        
        const verifyButton = card.querySelector('#verify-tfa');
        const verificationInput = card.querySelector('#verificationCode') as HTMLInputElement;
        
        if (verifyButton && verificationInput) {
            verifyButton.addEventListener('click', () => {
                const code = verificationInput.value.trim();
                if (code.length === 6 && /^\d+$/.test(code)) {
                    this.userData.is_2fa_enabled = true;
                    tfaSetup.classList.add('hidden');
                    showNotification('Two-Factor Authentication has been enabled successfully.', 'success');
                } else {
                    showNotification('Please enter a valid 6-digit verification code.', 'error');
                }
            });
        }
        
        this.loadLoginActivity().catch(err => console.error('Failed initial load login activity:', err));
        
        const signOutButton = card.querySelector('#sign-out-devices');
        if (signOutButton) {
            signOutButton.addEventListener('click', async () => {
                const confirmed = confirm('Are you sure you want to sign out from all devices? This will log you out of all active sessions.');
                if (confirmed) {
                    try {
                        (signOutButton as HTMLButtonElement).disabled = true;
                        signOutButton.innerHTML = '<span class="mr-2">⏳</span>Signing out...';
                        
                        const response = await fetch('/api/sign_out_all', {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({})
                        });

                        const result = await response.json();
                        
                        if (result.success) {
                            showNotification('Successfully signed out from all devices. Redirecting to login...', 'success');
                            (window as any).user = null;
                            localStorage.removeItem('session_id');
                            localStorage.removeItem('auth_token');
                            const cookiesToClear = ['token', 'session_id'];
                            cookiesToClear.forEach(cookieName => {
                                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure;`;
                                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=None; Secure;`;
                            });
                            setTimeout(() => {
                                if (this.router) {
                                    this.router.navigate('/login');
                                } else {
                                    window.location.href = '/login';
                                }
                            }, 2000);
                        } else {
                            throw new Error(result.error || 'Failed to sign out from all devices');
                        }
                    } catch (error) {
                        console.error('Error signing out from all devices:', error);
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                        showNotification(`Failed to sign out from all devices: ${errorMessage}`, 'error');
                        (signOutButton as HTMLButtonElement).disabled = false;
                        signOutButton.innerHTML = '<span class="mr-2">🚫</span>Sign Out All Devices';
                    }
                }
            });
        }
        
        const deleteAccountButton = card.querySelector('#delete-account');
        if (deleteAccountButton) {
            deleteAccountButton.addEventListener('click', async () => {
                // Affiche un prompt custom pour demander le mot de passe
                const modal = document.createElement('div');
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100vw';
                modal.style.height = '100vh';
                modal.style.background = 'rgba(10,10,20,0.85)';
                modal.style.zIndex = '9999';
                modal.style.display = 'flex';
                modal.style.alignItems = 'center';
                modal.style.justifyContent = 'center';

                modal.innerHTML = `
                    <div class="bg-cyber-darker p-8 rounded-lg border-2 border-neon-pink shadow-lg flex flex-col items-center w-full max-w-xs">
                        <h3 class="text-neon-pink font-cyber text-lg mb-4 text-center">Confirm Account Deletion</h3>
                        <p class="text-gray-400 text-sm mb-4 text-center">Please enter your password to confirm account deletion. This action is irreversible.</p>
                        <input type="password" id="delete-account-password" class="w-full bg-cyber-dark border-2 border-neon-pink/30 text-white px-3 py-2 rounded mb-4" placeholder="Your password" autocomplete="current-password" />
                        <div id="delete-account-error" class="text-red-400 text-xs mb-2 hidden"></div>
                        <div class="flex w-full gap-2">
                            <button id="delete-account-confirm" class="flex-1 bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-4 py-2 rounded hover:shadow-lg hover:shadow-neon-pink/50 duration-300">Delete</button>
                            <button id="delete-account-cancel" class="flex-1 bg-cyber-dark border border-neon-cyan/40 text-neon-cyan px-4 py-2 rounded hover:border-neon-cyan hover:shadow-lg hover:shadow-neon-cyan/20 duration-300">Cancel</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);

                const passwordInput = modal.querySelector('#delete-account-password') as HTMLInputElement;
                const errorDiv = modal.querySelector('#delete-account-error') as HTMLElement;
                const confirmBtn = modal.querySelector('#delete-account-confirm') as HTMLButtonElement;
                const cancelBtn = modal.querySelector('#delete-account-cancel') as HTMLButtonElement;

                // Focus input
                setTimeout(() => passwordInput?.focus(), 100);

                // Cancel handler
                cancelBtn.onclick = () => {
                    document.body.removeChild(modal);
                };

                // Confirm handler
                confirmBtn.onclick = async () => {
                    const password = passwordInput.value;
                    errorDiv.classList.add('hidden');
                    if (!password) {
                        errorDiv.textContent = 'Password is required';
                        errorDiv.classList.remove('hidden');
                        return;
                    }
                    confirmBtn.disabled = true;
                    confirmBtn.textContent = 'Deleting...';
                    try {
                        const response = await fetch('/api/delete_account', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password })
                        });
                        const data = await response.json();
                        if (data.success) {
                            showNotification('Account deleted successfully.', 'success');
                            document.body.removeChild(modal);
                            setTimeout(() => {
                                if (this.router) {
                                    this.router.navigate('/');
                                } else {
                                    window.location.href = '/';
                                }
                            }, 2000);
                        } else {
                            throw new Error(data.error || 'Failed to delete account');
                        }
                    } catch (error) {
                        errorDiv.textContent = (error instanceof Error && error.message) ? error.message : 'Failed to delete account. Please try again.';
                        errorDiv.classList.remove('hidden');
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = 'Delete';
                    }
                };

                // Enter key submits
                passwordInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') confirmBtn.click();
                });
            });
        }
    }
    
    private async loadLoginActivity(): Promise<void> {
        try {
            const response = await fetch('/api/login_history', { credentials: 'include' });
            const data = await response.json();
            const activityList = document.getElementById('login-activity-list');
            if (!activityList) return;
            
            if (!data.success || !Array.isArray(data.history)) {
                activityList.innerHTML = `<div class="text-center py-4 text-red-400">No login history found.</div>`;
                return;
            }
            if (data.history.length === 0) {
                activityList.innerHTML = `<div class="text-center py-4 text-gray-500">No login activity found.</div>`;
                return;
            }

            let currentBrowserInfo = this.getCurrentBrowserInfo();
            
            activityList.innerHTML = '';
            data.history.forEach((entry: any) => {
                const isCurrentSession = this.isCurrentBrowserSession(entry, currentBrowserInfo);
                
                // Format date
                let dateStr = entry.date;
                if (!dateStr || dateStr === 'Unknown date') {
                    try {
                        const d = new Date(entry.date);
                        if (!isNaN(d.getTime())) {
                            dateStr = d.toLocaleString('fr-FR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            });
                        } else {
                            dateStr = 'Unknown date';
                        }
                    } catch {
                        dateStr = 'Unknown date';
                    }
                }
                
                const activityItem = document.createElement('div');
                activityItem.className = 'p-3 bg-cyber-dark border border-neon-cyan/10 rounded flex justify-between items-center';
                activityItem.innerHTML = `
                    <div>
                        <div class="text-white text-sm font-tech">
                            <span class="font-bold">${entry.browser || 'Unknown'} on ${entry.os || 'Unknown'}</span>
                        </div>
                        <div class="text-xs text-gray-400">
                            IP: ${entry.ip || 'N/A'} • ${dateStr}
                        </div>
                    </div>
                    ${isCurrentSession ? `
                        <div class="text-green-400 text-xs font-tech px-2 py-1 bg-green-900/20 border border-green-500/30 rounded-sm">
                            CURRENT
                        </div>
                    ` : ''}
                `;
                activityList.appendChild(activityItem);
            });
        } catch (error) {
            console.error('Error loading login activity:', error);
            const activityList = document.getElementById('login-activity-list');
            if (activityList) {
                activityList.innerHTML = `<div class="text-center py-4 text-red-400">Failed to load login activity.</div>`;
            }
        }
    }

    private renderProfileWithPasswordSettings(container: HTMLElement): void {
        const card = document.createElement('div');
        card.className = 'cyber-panel bg-cyber-darker/80 p-6 border-2 border-neon-pink/40 rounded-lg backdrop-blur-sm relative flex flex-col h-full overflow-auto flex-grow';
        
        // Check username change status before rendering
        const usernameStatus = this.canChangeUsername();
        
        card.innerHTML = `
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-cyber font-bold text-neon-pink tracking-wider">PROFILE INFORMATION</h2>
            <div class="w-8 h-8 bg-cyber-dark border border-neon-cyan/50 flex items-center justify-center text-neon-cyan">
                👤
            </div>
        </div>
        <p class="text-gray-400 mb-6">Update your profile details and security settings</p>
        <!-- Username Management Block -->
        <div class="bg-cyber-darker/60 border-2 border-neon-cyan/40 rounded-lg p-5 mb-6 relative">            
            <h3 class="text-neon-cyan font-cyber mb-4 tracking-wide">IDENTITY</h3>
            
            <!-- Avatar Section -->
            <div class="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
                <div class="relative w-36 h-36 bg-gradient-to-br from-neon-pink/20 to-neon-cyan/20 rounded-lg border-2 border-neon-pink flex items-center justify-center">
                    <img src="${this.userData.avatar_url}" alt="Your Avatar" class="w-full h-full object-cover rounded-lg" />
                    <div class="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-neon-pink"></div>
                    <div class="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-neon-cyan"></div>
                    <div class="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-neon-cyan"></div>
                    <div class="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-neon-pink"></div>
                </div>
                <div class="flex flex-col space-y-3 flex-1">
                    <button class="bg-cyber-dark border border-neon-cyan/50 hover:border-neon-cyan text-neon-cyan px-4 py-2 rounded flex items-center hover:shadow-lg hover:shadow-neon-cyan/20 duration-300">
                        <span class="mr-2">⬆️</span>
                        Upload New Avatar
                    </button>
                    <button class="bg-cyber-dark border border-red-500/50 hover:border-red-500 text-red-400 px-4 py-2 rounded flex items-center hover:shadow-lg hover:shadow-red-500/20 duration-300">
                        <span class="mr-2">🗑️</span>
                        Remove Current Avatar
                    </button>
                </div>
            </div>

            <!-- Username Fields -->
            <div class="space-y-4">
                <div class="space-y-2">
                    <label for="username" class="text-neon-cyan font-tech block">Current Username</label>
                    <input
                        id="username"
                        type="text"
                        value="${this.userData.username}"
                        disabled
                        class="w-full bg-cyber-dark border-2 border-neon-pink/30 text-white/70 px-3 py-2 rounded"
                    />
                </div>

                <div class="space-y-2">
                    <label for="newUsername" class="text-neon-cyan font-tech block">New Username</label>
                    <input
                        id="newUsername"
                        type="text"
                        placeholder="${usernameStatus.canChange ? 'Enter new username' : 'You already changed your username'}"
                        value=""
                        ${!usernameStatus.canChange ? 'readonly' : ''}
                        class="w-full bg-cyber-dark border-2 border-neon-pink/30 text-white px-3 py-2 rounded ${!usernameStatus.canChange ? 'opacity-50 cursor-not-allowed bg-cyber-darker border-red-500/50 text-red-400/70' : ''}"
                        ${!usernameStatus.canChange ? 'title="Username change is on cooldown"' : ''}
                    />
                    <p class="text-xs text-gray-500">Username can only be changed once every 30 days</p>
                    ${!usernameStatus.canChange ? `
                        <div class="text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded px-2 py-1">
                            🚫 You already changed your username. You can change it again in ${usernameStatus.remainingDays} day${usernameStatus.remainingDays !== 1 ? 's' : ''}.
                        </div>
                    ` : ''}
                    <div id="username-validation-message" class="text-xs hidden"></div>
                </div>
                
                <button id="save-profile" class="bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-4 py-2 rounded flex items-center hover:shadow-lg hover:shadow-neon-pink/50 duration-300 w-full justify-center ${!usernameStatus.canChange ? 'opacity-50 cursor-not-allowed' : ''}" ${!usernameStatus.canChange ? 'disabled' : ''}>
                    <span class="mr-2">${!usernameStatus.canChange ? '🚫' : '💾'}</span>
                    ${!usernameStatus.canChange ? 'Username Change on Cooldown' : 'Save Identity Changes'}
                </button>
            </div>
        </div>
        
        <!-- Password Management Block -->
        <div class="bg-cyber-darker/60 border-2 border-neon-pink/40 rounded-lg p-5 mb-6 relative">
            <h2 class="text-2xl font-cyber font-bold text-neon-pink tracking-wider mb-6">PASSWORD SETTINGS</h2>
            
            <!-- Password Fields -->
            <div class="space-y-4">
                <div class="space-y-2">
                    <label for="currentPassword" class="text-neon-cyan font-tech block">Current Password</label>
                    <div class="relative">
                        <input
                            id="currentPassword"
                            type="password"
                            class="w-full bg-cyber-dark border-2 border-neon-pink/30 text-white px-3 py-2 rounded pr-10"
                        />
                        <button
                            type="button"
                            class="absolute right-0 top-0 h-full px-3 toggle-password"
                            data-target="currentPassword"
                        >
                            👁️
                        </button>
                    </div>
                </div>

                <div class="space-y-2">
                    <label for="newPassword" class="text-neon-cyan font-tech block">New Password</label>
                    <div class="relative">
                        <input
                            id="newPassword"
                            type="password"
                            class="w-full bg-cyber-dark border-2 border-neon-pink/30 text-white px-3 py-2 rounded pr-10"
                        />
                        <button
                            type="button"
                            class="absolute right-0 top-0 h-full px-3 toggle-password"
                            data-target="newPassword"
                        >
                            👁️
                        </button>
                    </div>
                    <ul class="text-xs space-y-1 mt-2 text-gray-400">
                        <li class="flex items-center">
                            <span class="text-green-400 mr-1">✓</span> At least 8 characters long
                        </li>
                        <li class="flex items-center">
                            <span class="text-green-400 mr-1">✓</span> Contains uppercase letters
                        </li>
                        <li class="flex items-center">
                            <span class="text-green-400 mr-1">✓</span> Contains lowercase letters
                        </li>
                        <li class="flex items-center">
                            <span class="text-green-400 mr-1">✓</span> Contains numbers
                        </li>
                        <li class="flex items-center">
                            <span class="text-green-400 mr-1">✓</span> Contains special characters
                        </li>
                    </ul>
                </div>

                <div class="space-y-2">
                    <label for="confirmPassword" class="text-neon-cyan font-tech block">Confirm New Password</label>
                    <div class="relative">
                        <input
                            id="confirmPassword"
                            type="password"
                            class="w-full bg-cyber-dark border-2 border-neon-pink/30 text-white px-3 py-2 rounded pr-10"
                        />
                        <button
                            type="button"
                            class="absolute right-0 top-0 h-full px-3 toggle-password"
                            data-target="confirmPassword"
                        >
                            👁️
                        </button>
                    </div>
                </div>

                <div>
                    <button 
                        id="update-password" 
                        class="bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-4 py-2 rounded hover:shadow-lg hover:shadow-neon-pink/50 duration-300 w-full justify-center flex items-center"
                        disabled
                    >
                        <span class="mr-2">🛡️</span>
                        Update Password
                    </button>
                </div>
            </div>
        </div>
        `;
        container.appendChild(card);
        
        const buttonsContainer = card.querySelector('.flex.flex-col.space-y-3.flex-1');
        const uploadButton = buttonsContainer?.querySelector('button:first-child');
        const removeButton = buttonsContainer?.querySelector('button:last-child');
        
        if (uploadButton) {
            uploadButton.addEventListener('click', () => {
                handleAvatarUpload((avatarUrl) => {
                    this.userData.avatar_url = avatarUrl;
                    const avatarImg = card.querySelector('img[alt="Your Avatar"]') as HTMLImageElement;
                    if (avatarImg) {
                        avatarImg.src = avatarUrl;
                    }
                });
            });
        }
        
        if (removeButton) {
            removeButton.addEventListener('click', () => {
                removeButton.setAttribute('disabled', 'true');
                removeButton.innerHTML = '<span class="mr-2">⏳</span>Removing...';
                handleAvatarRemoval((defaultAvatarUrl) => {
                    this.userData.avatar_url = defaultAvatarUrl;
                    const avatarImg = card.querySelector('img[alt="Your Avatar"]') as HTMLImageElement;
                    if (avatarImg) {
                        avatarImg.src = defaultAvatarUrl;
                    }
                    removeButton.removeAttribute('disabled');
                    removeButton.innerHTML = '<span class="mr-2">🗑️</span>Remove Current Avatar';
                });
                setTimeout(() => {
                    if (removeButton.hasAttribute('disabled')) {
                        removeButton.removeAttribute('disabled');
                        removeButton.innerHTML = '<span class="mr-2">🗑️</span>Remove Current Avatar';
                    }
                }, 5000);
            });
        }
        
        const saveButton = card.querySelector('#save-profile');
        if (saveButton) {
            saveButton.addEventListener('click', async () => {
                const newUsernameInput = card.querySelector('#newUsername') as HTMLInputElement;
                const currentUsernameInput = card.querySelector('#username') as HTMLInputElement;

                if (newUsernameInput && newUsernameInput.value.trim()) {
                    const newUsername = newUsernameInput.value.trim();

                    const validation = this.validateUsername(newUsername);
                    if (!validation.isValid) {
                        showNotification(validation.message || 'Invalid username format', 'error');
                        return;
                    }

                    const usernameStatus = this.canChangeUsername();
                    if (!usernameStatus.canChange) {
                        showNotification(`You can only change your username once every 30 days. Please wait ${usernameStatus.remainingDays} more day${usernameStatus.remainingDays !== 1 ? 's' : ''}.`, 'error');
                        return;
                    }

                    saveButton.setAttribute('disabled', 'true');
                    saveButton.innerHTML = '<span class="mr-2">⏳</span>Saving...';

                    try {
                        const response = await fetch('/api/update_profile', {
                            method: 'POST',
                            credentials: 'include',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                username: newUsername
                            })
                        });
                        const data = await response.json();
                        
                        if (data.success) {
                            this.userData.username = newUsername;
                            this.userData.last_username_change = new Date().toISOString();
                            showNotification('Username Updated: Your username has been changed successfully.', 'success');
                            if (currentUsernameInput) {
                                currentUsernameInput.value = this.userData.username;
                            }
                            if (newUsernameInput) {
                                newUsernameInput.value = '';
                            }
                            const usernameDisplay = document.querySelector('.text-xl.font-cyber.text-neon-cyan');
                            if (usernameDisplay) {
                                usernameDisplay.textContent = this.userData.username;
                            }
                            this.updateUsernameDisplay(this.userData.username);
                            this.updateUsernameCooldownStatus();
                        } else {
                            if (data.error === 'username_taken') {
                                showNotification('Username is already taken. Please choose a different username.', 'error');
                            } else if (data.error === 'username_length') {
                                showNotification('Username must be between 3 and 20 characters long.', 'error');
                            } else if (data.error === 'username_format') {
                                showNotification('Username can only contain letters, numbers, and underscores.', 'error');
                            } else if (data.error === 'username_cooldown') {
                                const remainingDays = data.remaining_days || 30;
                                showNotification(`You can only change your username once every 30 days. Please wait ${remainingDays} more day${remainingDays !== 1 ? 's' : ''}.`, 'error');
                            } else {
                                throw new Error(data.error || 'Failed to update username');
                            }
                        }
                    } catch (error) {
                        showNotification(
                            error instanceof Error && error.message ? 
                            error.message : 
                            'Failed to update username. Please try again later.',
                            'error'
                        );
                    } finally {
                        saveButton.removeAttribute('disabled');
                        saveButton.innerHTML = '<span class="mr-2">💾</span>Save Identity Changes';
                    }
                } else {
                    showNotification('No changes detected. Please make changes before saving.', 'error');
                }
            });
        }
        
        const newUsernameInput = card.querySelector('#newUsername') as HTMLInputElement;
        if (newUsernameInput) {
            const validationMessage = card.querySelector('#username-validation-message') as HTMLElement;

            let usernameCheckTimeout: number;

            // Check if username change is on cooldown - use server data immediately
            const usernameStatus = this.canChangeUsername();
            if (!usernameStatus.canChange) {
                // Block input completely when on cooldown
                newUsernameInput.readOnly = true;
                newUsernameInput.style.pointerEvents = 'none';
                newUsernameInput.style.cursor = 'not-allowed';
                newUsernameInput.placeholder = 'You already changed your username';
                newUsernameInput.classList.add('opacity-50', 'bg-cyber-darker', 'border-red-500/50', 'text-red-400/70');
                
                // Update validation message to show cooldown info immediately
                if (validationMessage) {
                    validationMessage.className = 'text-xs text-red-400';
                    validationMessage.classList.remove('hidden');
                }
                
                // Show immediate feedback when trying to interact with blocked input
                ['focus', 'click', 'keydown', 'input', 'paste'].forEach(eventType => {
                    newUsernameInput.addEventListener(eventType, (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.type === 'focus' || e.type === 'click') {
                            newUsernameInput.blur();
                        }
                        // Show notification only on first interaction attempt
                        if (!newUsernameInput.dataset.notificationShown) {
                            showNotification(`You already changed your username. You can change it again in ${usernameStatus.remainingDays} day${usernameStatus.remainingDays !== 1 ? 's' : ''}`, 'error');
                            newUsernameInput.dataset.notificationShown = 'true';
                            // Reset the flag after 3 seconds
                            setTimeout(() => {
                                delete newUsernameInput.dataset.notificationShown;
                            }, 3000);
                        }
                    });
                });
                
                // Also disable the save button
                if (saveButton) {
                    (saveButton as HTMLButtonElement).disabled = true;
                    saveButton.innerHTML = '<span class="mr-2">🚫</span>Username Change on Cooldown';
                    saveButton.classList.add('opacity-50', 'cursor-not-allowed');
                }
                
                return; // Exit early if on cooldown
            }

            // Normal username input validation (only if not on cooldown)
            newUsernameInput.addEventListener('input', () => {
                // Double-check cooldown status on each input
                const currentStatus = this.canChangeUsername();
                if (!currentStatus.canChange) {
                    newUsernameInput.value = '';
                    newUsernameInput.readOnly = true;
                    newUsernameInput.placeholder = 'You already changed your username';
                    showNotification(`You can change your username in ${currentStatus.remainingDays} day${currentStatus.remainingDays !== 1 ? 's' : ''}`, 'error');
                    if (saveButton) (saveButton as HTMLButtonElement).disabled = true;
                    return;
                }

                const username = newUsernameInput.value.trim();
                if (usernameCheckTimeout) {
                    clearTimeout(usernameCheckTimeout);
                }
                if (username) {
                    const validation = this.validateUsername(username);
                    if (!validation.isValid) {
                        validationMessage.textContent = validation.message || 'Invalid username format';
                        validationMessage.className = 'text-xs text-red-400';
                        validationMessage.classList.remove('hidden');
                        if (saveButton) (saveButton as HTMLButtonElement).disabled = true;
                    } else {
                        if (username === this.userData.username) {
                            validationMessage.textContent = 'This is your current username';
                            validationMessage.className = 'text-xs text-yellow-400';
                            validationMessage.classList.remove('hidden');
                            if (saveButton) (saveButton as HTMLButtonElement).disabled = true;
                            return;
                        }
                        validationMessage.textContent = 'Checking availability...';
                        validationMessage.className = 'text-xs text-blue-400';
                        validationMessage.classList.remove('hidden');
                        if (saveButton) (saveButton as HTMLButtonElement).disabled = true;
                        usernameCheckTimeout = setTimeout(async () => {
                            try {
                                const response = await fetch('/api/check_username_availability', {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ username })
                                });
                                const data = await response.json();
                                if (data.available) {
                                    validationMessage.textContent = 'Username is available';
                                    validationMessage.className = 'text-xs text-green-400';
                                    validationMessage.classList.remove('hidden');
                                    if (saveButton) (saveButton as HTMLButtonElement).disabled = false;
                                } else {
                                    validationMessage.textContent = 'Username is already taken';
                                    validationMessage.className = 'text-xs text-red-400';
                                    validationMessage.classList.remove('hidden');
                                    if (saveButton) (saveButton as HTMLButtonElement).disabled = true;
                                }
                            } catch (error) {
                                validationMessage.textContent = 'Error checking username availability';
                                validationMessage.className = 'text-xs text-red-400';
                                validationMessage.classList.remove('hidden');
                                if (saveButton) (saveButton as HTMLButtonElement).disabled = true;
                            }
                        }, 500);
                    }
                } else {
                    validationMessage.classList.add('hidden');
                    if (saveButton) (saveButton as HTMLButtonElement).disabled = true;
                }
            });
        }
        
        const toggleButtons = card.querySelectorAll('.toggle-password');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const target = button.getAttribute('data-target');
                if (target) {
                    const input = card.querySelector(`#${target}`) as HTMLInputElement;
                    if (input) {
                        if (input.type === 'password') {
                            input.type = 'text';
                            (button as HTMLElement).textContent = '👁️‍🗨️';
                        } else {
                            input.type = 'password';
                            (button as HTMLElement).textContent = '👁️';
                        }
                    }
                }
            });
        });
        
        const newPassword = card.querySelector('#newPassword') as HTMLInputElement;        
        const currentPassword = card.querySelector('#currentPassword') as HTMLInputElement;
        const confirmPassword = card.querySelector('#confirmPassword') as HTMLInputElement;
        const updateButton = card.querySelector('#update-password') as HTMLButtonElement;
        
        const checkPasswordFields = () => {
            if (currentPassword && newPassword && confirmPassword && updateButton) {
                updateButton.disabled = !(currentPassword.value && newPassword.value && confirmPassword.value);
            }
        };
        
        [currentPassword, newPassword, confirmPassword].forEach(field => {
            if (field) {
                field.addEventListener('input', checkPasswordFields);
            }
        });
        
        if (updateButton) {
            updateButton.addEventListener('click', async () => {
                if (currentPassword && newPassword && confirmPassword) {
                    updateButton.disabled = true;
                    updateButton.innerHTML = '<span class="mr-2">⏳</span>Updating...';
                    try {
                        if (newPassword.value !== confirmPassword.value) {
                            throw new Error('Password Mismatch: New passwords do not match.');
                        }
                        const validation = this.validatePassword(newPassword.value);
                        if (!validation.isValid) {
                            throw new Error(validation.message || 'Password does not meet requirements');
                        }
                        await this.changePassword(currentPassword.value, newPassword.value);
                        showNotification('Password Updated: Your password has been changed successfully.', 'success');
                        currentPassword.value = '';
                        newPassword.value = '';
                        confirmPassword.value = '';
                    }
                    catch (error) {
                        showNotification(
                            error instanceof Error ? error.message : 'Failed to update password. Please try again.',
                            'error'
                        );
                    }
                    finally {
                        updateButton.disabled = false;
                        updateButton.innerHTML = '<span class="mr-2">🛡️</span>Update Password';
                        checkPasswordFields();
                    }
                }
            });
        }
        
        if (newPassword) {
            const passwordStrengthIndicators = card.querySelectorAll('.text-green-400');
            newPassword.addEventListener('input', () => {
                const password = newPassword.value;
                if (password.length >= 8) {
                    passwordStrengthIndicators[0].className = 'text-green-400 mr-1';
                    passwordStrengthIndicators[0].textContent = '✓';
                } else {
                    passwordStrengthIndicators[0].className = 'text-red-400 mr-1';
                    passwordStrengthIndicators[0].textContent = '✗';
                }
                if (/[A-Z]/.test(password)) {
                    passwordStrengthIndicators[1].className = 'text-green-400 mr-1';
                    passwordStrengthIndicators[1].textContent = '✓';
                } else {
                    passwordStrengthIndicators[1].className = 'text-red-400 mr-1';
                    passwordStrengthIndicators[1].textContent = '✗';
                }
                if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
                    passwordStrengthIndicators[2].className = 'text-green-400 mr-1';
                    passwordStrengthIndicators[2].textContent = '✓';
                } else {
                    passwordStrengthIndicators[2].className = 'text-red-400 mr-1';
                    passwordStrengthIndicators[2].textContent = '✗';
                }
            });
        }
        
        const currentUsernameInput = card.querySelector('#username') as HTMLInputElement;
        const newUsernameInputFinal = card.querySelector('#newUsername') as HTMLInputElement;
        const cooldownMessage = card.querySelector('#username-cooldown-message') as HTMLElement;
        const saveProfileButton = card.querySelector('#save-profile') as HTMLButtonElement;
        
        if (currentUsernameInput) {
            currentUsernameInput.value = this.userData.username;
        }
        if (newUsernameInputFinal) {
            newUsernameInputFinal.value = '';
        }
        
        const usernameStatusFinal = this.canChangeUsername();
        if (!usernameStatusFinal.canChange && cooldownMessage && saveProfileButton) {
            cooldownMessage.textContent = `You can change your username in ${usernameStatusFinal.remainingDays} day${usernameStatusFinal.remainingDays !== 1 ? 's' : ''}`;
            cooldownMessage.classList.remove('hidden');
            saveProfileButton.disabled = true;
            saveProfileButton.innerHTML = '<span class="mr-2">⏳</span>Username Change on Cooldown';
            if (newUsernameInputFinal) {
                // Remplacer disabled par readonly
                newUsernameInputFinal.setAttribute('readonly', 'true');
                newUsernameInputFinal.classList.add('readonly-input');
                newUsernameInputFinal.placeholder = 'Username change on cooldown';
            }
        }
    }
    
    private updateUsernameDisplay(newUsername: string): void {
        const sidebarUsernames = document.querySelectorAll('.sidebar-username');
        sidebarUsernames.forEach(el => {
            el.textContent = newUsername;
        });
        const profileLinks = document.querySelectorAll('.sidebar-link[href^="/profile/"]');
        profileLinks.forEach(link => {
            if (link instanceof HTMLAnchorElement) {
                link.href = `/profile/${newUsername}`;
            }
        });
        if ((window as any).user) {
            (window as any).user.username = newUsername;
        }
        document.dispatchEvent(new CustomEvent('username-updated', {
            detail: { username: newUsername }
        }));
    }
    
    private updateUsernameCooldownStatus(): void {
        const statusEl = document.getElementById('username-cooldown-status');
        if (!statusEl) return;
        const { canChange, remainingDays } = this.canChangeUsername();
        if (canChange) {
            statusEl.textContent = 'You can change your username.';
            statusEl.className = 'text-green-400';
        } else {
            statusEl.textContent = `You can change your username in ${remainingDays} day(s).`;
            statusEl.className = 'text-yellow-400';
        }
    }
    
    private validateUsername(username: string): { isValid: boolean; message?: string } {
        if (!username || username.trim() === '') {
            return { isValid: false, message: 'Username cannot be empty' };
        }
        if (username.length < 3) {
            return { isValid: false, message: 'Username must be at least 3 characters long' };
        }
        if (username.length > 20) {
            return { isValid: false, message: 'Username cannot exceed 20 characters' };
        }
        const validUsernamePattern = /^[a-zA-Z0-9_]+$/;
        if (!validUsernamePattern.test(username)) {
            return { isValid: false, message: 'Username can only contain letters, numbers, and underscores' };
        }
        return { isValid: true };
    }

    private async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        try {
            const response = await fetch('/api/update_profile', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error === 'current_password_incorrect' 
                    ? 'Your current password is incorrect' 
                    : (data.error || 'Password change failed'));
            }
            return Promise.resolve();
        } catch (error) {
            return Promise.reject(error);
        }
    }

    private validatePassword(password: string): { isValid: boolean; message?: string } {
        if (password.length < 8) {
            return { isValid: false, message: 'Password must be at least 8 characters long' };
        }
        if (!/[A-Z]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one lowercase letter' };
        }
        if (!/[0-9]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one number' };
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            return { isValid: false, message: 'Password must contain at least one special character' };
        }
        return { isValid: true };
    }
    
    private getCurrentBrowserInfo(): { userAgent: string; browser: string; os: string; sessionId?: string; token?: string } {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown';
        let os = 'Unknown';
        if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
        } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browser = 'Chrome';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browser = 'Safari';
        } else if (userAgent.includes('Edg')) {
            browser = 'Edge';
        } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
            browser = 'Opera';
        }
        if (userAgent.includes('Windows')) {
            os = 'Windows';
        } else if (userAgent.includes('Mac')) {
            os = 'macOS';
        } else if (userAgent.includes('Linux')) {
            os = 'Linux';
        } else if (userAgent.includes('Android')) {
            os = 'Android';
        } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            os = 'iOS';
        }
        
        // Récupère session_id depuis les cookies (priorité) puis localStorage
        const sessionId = document.cookie.split('; ')
            .find(row => row.startsWith('session_id='))
            ?.split('=')[1] || localStorage.getItem('session_id') || undefined;
            
        const token = document.cookie.split('; ')
            .find(row => row.startsWith('token='))
            ?.split('=')[1] || undefined;
            
        return {
            userAgent,
            browser,
            os,
            sessionId,
            token
        };
    }
    
    private isCurrentBrowserSession(entry: any, currentInfo: { userAgent: string; browser: string; os: string; sessionId?: string; token?: string }): boolean {
        if (currentInfo.token && entry.token) {
            return currentInfo.token === entry.token;
        }
        if (currentInfo.sessionId && entry.sessionId) {
            return currentInfo.sessionId === entry.sessionId;
        }
        const entryBrowser = entry.browser || entry.device || '';
        const entryOS = entry.os || entry.device || '';
        const browserMatch = entryBrowser.toLowerCase().includes(currentInfo.browser.toLowerCase()) ||
                           currentInfo.browser.toLowerCase().includes(entryBrowser.toLowerCase());
        const osMatch = entryOS.toLowerCase().includes(currentInfo.os.toLowerCase()) ||
                       currentInfo.os.toLowerCase().includes(entryOS.toLowerCase());
        const userAgentSimilarity = entry.userAgent && currentInfo.userAgent ? 
            this.calculateUserAgentSimilarity(entry.userAgent, currentInfo.userAgent) > 0.8 : false;
        return (browserMatch && osMatch) || userAgentSimilarity;
    }
    
    private calculateUserAgentSimilarity(ua1: string, ua2: string): number {
        if (!ua1 || !ua2) return 0;
        const parts1 = ua1.split(/[\s\/\(\)]+/).filter(p => p.length > 2);
        const parts2 = ua2.split(/[\s\/\(\)]+/).filter(p => p.length > 2);
        let matches = 0;
        const maxLength = Math.max(parts1.length, parts2.length);
        for (const part1 of parts1) {
            if (parts2.some(part2 => part2.includes(part1) || part1.includes(part2))) {
                matches++;
            }
        }
        return maxLength > 0 ? matches / maxLength : 0;
    }
    
    cleanup(): void {
        // AMÉLIORATION : Nettoyage spécifique à la page de settings
        const container = document.getElementById('settings-page-container');
        if (container) {
            container.innerHTML = '';
        }
        super.cleanup();
    }
    
    destroy(): void { 
        this.cleanup(); 
        super.destroy();
    }
}

export default SettingsPage;