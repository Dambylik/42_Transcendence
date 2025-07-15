import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import { getAssetUrl } from '../../utils/assetUtils';
import { showNotification } from '../../utils/notifications';

class LoginPage extends Page {
  static TextObject = {
    MainTitle: 'ACCESS TERMINAL',
    Subtitle: 'AUTHENTICATE TO PROCEED',
    CreateAccount: 'CREATE NEW IDENTITY',
    LoginButton: 'CONNECT',
    Username: 'IDENTITY',
    Password: 'ACCESS CODE',
    LoginWithGoogle: 'CONNECT VIA GOOGLE'
  };

  constructor(id: string, router?: Router) {
    super(id, router);
  }

  async render(): Promise<HTMLElement> {
        this.container.innerHTML = '';
        document.body.style.paddingTop = '0';

    const mainContent = document.createElement('div');
    mainContent.className = 'min-h-screen pt-4 bg-cyber-dark relative overflow-hidden';

    // Add corner UI elements
    [
      { position: 'top-8 left-8', classes: 'border-l-2 border-t-2 border-neon-pink' },
      { position: 'top-8 right-8', classes: 'border-r-2 border-t-2 border-neon-cyan' },
      { position: 'bottom-8 left-8', classes: 'border-l-2 border-b-2 border-neon-cyan' },
      { position: 'bottom-8 right-8', classes: 'border-r-2 border-b-2 border-neon-pink' }
    ].forEach(({ position, classes }) => {
      const corner = document.createElement('div');
      corner.className = `absolute ${position} w-16 h-16 ${classes} opacity-50`;
      mainContent.appendChild(corner);
    });

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4';

    // Create two-column layout
    const layout = document.createElement('div');
    layout.className = 'flex flex-col lg:flex-row items-center justify-center gap-10 w-full max-w-5xl mx-auto my-8';

    // Left column - Login form
    const formSection = document.createElement('div');
    formSection.className = 'w-full lg:w-[450px]';
    const formContainer = this.createLoginForm();
    formSection.appendChild(formContainer);

    // Right column - Image
    const imageSection = document.createElement('div');
    imageSection.className = 'hidden lg:block w-full lg:w-[450px]';

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'relative bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg shadow-lg shadow-neon-pink/10 flex items-center justify-center';
    imageContainer.style.height = '626px';

    const image = document.createElement('img');
    image.src = getAssetUrl('red_man.png');
    image.alt = 'Cyberpunk character';
    image.className = 'max-h-[520px] max-w-full w-auto object-contain relative z-10 filter drop-shadow-[0_0_15px_rgba(255,0,99,0.5)]';

    // Add image effects
    [
      { className: 'absolute inset-0 bg-gradient-to-b from-transparent via-neon-pink/5 to-transparent animate-scan mix-blend-overlay' },
      { className: 'absolute inset-0 bg-gradient-to-tr from-neon-cyan/10 to-neon-pink/10 mix-blend-overlay opacity-50' }
    ].forEach(({ className }) => {
      const effect = document.createElement('div');
      effect.className = className;
      imageContainer.appendChild(effect);
    });

    imageContainer.appendChild(image);
    [
      { position: 'top-4 left-4', classes: 'border-l-2 border-t-2 border-neon-pink' },
      { position: 'top-4 right-4', classes: 'border-r-2 border-t-2 border-neon-cyan' },
      { position: 'bottom-4 left-4', classes: 'border-l-2 border-b-2 border-neon-cyan' },
      { position: 'bottom-4 right-4', classes: 'border-r-2 border-b-2 border-neon-pink' }
    ].forEach(({ position, classes }) => {
      const corner = document.createElement('div');
      corner.className = `absolute ${position} w-6 h-6 ${classes}`;
      imageContainer.appendChild(corner);
    });
    
    imageSection.appendChild(imageContainer);
    layout.appendChild(formSection);
    layout.appendChild(imageSection);
    contentWrapper.appendChild(layout);
    mainContent.appendChild(contentWrapper);
    this.container.appendChild(mainContent);

    this.setupEventListeners();
    this.addResizeListener();
    setTimeout(() => {
      initializeGoogleSignIn();
    }, 500);
    
    return this.container;
  }

  private createLoginForm(): HTMLElement {
    const formContainer = document.createElement('div');
    formContainer.className = 'relative bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10';
    [
      { position: 'top-4 left-4', classes: 'border-l-2 border-t-2 border-neon-pink' },
      { position: 'top-4 right-4', classes: 'border-r-2 border-t-2 border-neon-cyan' },
      { position: 'bottom-4 left-4', classes: 'border-l-2 border-b-2 border-neon-cyan' },
      { position: 'bottom-4 right-4', classes: 'border-r-2 border-b-2 border-neon-pink' }
    ].forEach(({ position, classes }) => {
      const corner = document.createElement('div');
      corner.className = `absolute ${position} w-6 h-6 ${classes}`;
      formContainer.appendChild(corner);
    });

    // Title and subtitle
    const title = document.createElement('h2');
    title.className = 'text-3xl font-cyber font-bold text-neon-pink mb-2 text-center tracking-wider';
    title.textContent = LoginPage.TextObject.MainTitle;

    const subtitle = document.createElement('p');
    subtitle.className = 'text-neon-cyan/70 text-sm font-tech mb-8 text-center tracking-wide';
    subtitle.textContent = LoginPage.TextObject.Subtitle;

    // Form
    const form = document.createElement('form');
    form.id = 'login-form';
    form.className = 'space-y-6';
    // Prevent default form submission
    form.setAttribute('novalidate', 'true');
    form.onsubmit = (e) => {
      e.preventDefault();
      return false;
    };

    // Form fields
    [
      {
        label: LoginPage.TextObject.Username,
        type: 'text',
        id: 'username',
        placeholder: 'Enter your identity'
      },
      {
        label: LoginPage.TextObject.Password,
        type: 'password',
        id: 'password',
        placeholder: 'Enter access code'
      },
      {
        label: "TOTP (if necessary)",
        type: 'text',
        id: 'code_totp',
        placeholder: 'Enter TOTP code (only if activated)'
      },
      
    ].forEach(({ label, type, id, placeholder }) => {
      const group = document.createElement('div');
      group.className = 'relative';
      group.innerHTML = `
        <label class="block text-sm font-tech text-neon-cyan mb-2 tracking-wide">
          ${label}<span class="text-neon-pink">_</span>
        </label>
        <div class="relative group">
          <input type="${type}" id="${id}" name="${id}" 
            class="w-full bg-cyber-darker/50 border-2 border-neon-pink/30 text-white px-4 py-3 rounded-md
            focus:outline-none focus:border-neon-cyan/50 transition-colors
            font-tech tracking-wider placeholder-gray-500"
            required
            placeholder="${placeholder}">
          <div class="absolute inset-0 rounded-md transition-opacity opacity-0 group-hover:opacity-100
            bg-gradient-to-r from-neon-pink/5 to-neon-cyan/5 pointer-events-none"></div>
        </div>
      `;
      form.appendChild(group);
    });

    // Code 2FA
    // const text2fa = document.createElement('div');
    // text2fa.innerHTML = `<input type="text" name="code_totp">`;

    // Login button
    const loginButton = document.createElement('button');
    loginButton.type = 'button';
    loginButton.className = `w-full mt-8 bg-gradient-to-r from-neon-pink to-neon-cyan 
      text-white font-cyber text-lg py-4 rounded-md relative overflow-hidden
      border-2 border-neon-pink/50 hover:border-neon-cyan/50
      transition-all duration-300 group`;
    loginButton.innerHTML = `
      <span class="relative z-10 tracking-wider">${LoginPage.TextObject.LoginButton}</span>
      <div class="absolute inset-0 opacity-0 group-hover:opacity-100 
        transition-opacity duration-300 bg-gradient-to-r from-neon-cyan to-neon-pink"></div>
    `;
    // Add direct click handler to the button
    loginButton.addEventListener('click', (e) => {
      this.handleFormSubmit(e);
    });
    form.appendChild(loginButton);

    // Register link
    const registerLink = document.createElement('div');
    registerLink.className = 'mt-6 text-center';
    registerLink.innerHTML = `
      <a href="/register" data-route="/register" 
        class="inline-block text-neon-cyan/80 hover:text-neon-cyan font-tech tracking-wide text-sm
        transition-all duration-300 relative group">
        <span class="relative z-10">${LoginPage.TextObject.CreateAccount}</span>
        <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan transform scale-x-0 
          group-hover:scale-x-100 transition-transform duration-300"></div>
      </a>
    `;

    // Divider
    const divider = document.createElement('div');
    divider.className = 'my-8 flex items-center';
    divider.innerHTML = `
      <div class="flex-1 border-t-2 border-neon-pink/20"></div>
      <div class="px-4 text-sm font-tech text-neon-cyan/50">OR</div>
      <div class="flex-1 border-t-2 border-neon-cyan/20"></div>
    `;

    const googleButtonContainer = document.createElement('div');
    googleButtonContainer.id = 'buttonDivGoogle';
    googleButtonContainer.className = 'w-full mt-4 border-2 border-transparent rounded-md min-h-[50px] flex justify-center items-center';
    googleButtonContainer.style.minHeight = '50px';
    
    formContainer.appendChild(title);
    formContainer.appendChild(subtitle);
    formContainer.appendChild(form);
    formContainer.appendChild(registerLink);
    formContainer.appendChild(divider);
    formContainer.appendChild(googleButtonContainer);

    return formContainer;

  }

  private setupEventListeners(): void {
    const form = document.getElementById('login-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(e);
      });
    } else {
      //console.log('Login form not found in setupEventListeners');
    }
    
    const googleLoginButton = document.getElementById('google-login');
    if (googleLoginButton) {
      googleLoginButton.addEventListener('click', this.handleGoogleLogin.bind(this));
    }
  }
  
  
  private handleFormSubmit(e: Event): void {
    e.preventDefault();
    
    const usernameEl = document.getElementById('username') as HTMLInputElement;
    const passwordEl = document.getElementById('password') as HTMLInputElement;
    const codeEl = document.getElementById('code_totp') as HTMLInputElement;
    
    // console.log('Form elements found:', {
    //   username: !!usernameEl,
    //   password: !!passwordEl,
    //   code_totp: !!codeEl
    // });
    
    if (!usernameEl || !passwordEl) {
      console.error('Required form elements not found');
      this.showFormError('Form elements not found. Please refresh the page.');
      return;
    }
    
    const username = usernameEl.value;
    const password = passwordEl.value;
    const code_totp = codeEl ? codeEl.value : '';
    
    // console.log('Form values:', { username: !!username, password: !!password, code_totp: !!code_totp });
    
    if (!username || !password) {
      this.showFormError('Username and password are required');
      return;
    }
    
    // Disable the button while submitting
    const loginButton = document.querySelector('button[type="button"]') as HTMLButtonElement;
    if (loginButton) {
      loginButton.disabled = true;
      loginButton.classList.add('opacity-50');
      loginButton.innerHTML = `
        <span class="relative z-10 tracking-wider">AUTHENTICATING...</span>
        <div class="absolute inset-0 opacity-100 
          transition-opacity duration-300 bg-gradient-to-r from-neon-cyan to-neon-pink"></div>
      `;
    }
    
      fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, code_totp }),
      credentials: 'include'
    })
      .then(response => {
        console.log('Login response status:', response.status);
        //console.log('Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.error || 'Login failed');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Login successful, data received:', data);
        this.showSuccess('Login successful! Redirecting...');
        
        // Store authentication flag in localStorage to indicate successful login
        if (data && data.success) {
          localStorage.setItem('authToken', 'authenticated');
          //console.log('Auth token set in localStorage');
        }
        
        // Update global user object
        if (data && (data.user || data.username)) {
          (window as any).user = data.user || data;
          console.log('User data stored:', (window as any).user);
        }
        
        // Redirect immediately using window.location to ensure proper navigation
        setTimeout(() => {
          //console.log('Redirecting to dashboard...');
          window.location.href = '/dashboard';
        }, 1000);
      })
      .catch(error => {
        //console.error('Login error:', error);
        this.showFormError(`Login failed: ${error.message}`);
      })
      .finally(() => {
        if (loginButton) {
          loginButton.disabled = false;
          loginButton.classList.remove('opacity-50');
          loginButton.innerHTML = `
            <span class="relative z-10 tracking-wider">${LoginPage.TextObject.LoginButton}</span>
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 
              transition-opacity duration-300 bg-gradient-to-r from-neon-cyan to-neon-pink"></div>
          `;
        }
      });
  }

  private handleGoogleLogin(): void {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
      alert('Google authentication is not available. Please try again later or use another login method.');
      return;
    }
    
    try {
      google.accounts.id.prompt();
    } catch (error) {
      alert('Failed to start Google authentication. Please try again.');
    }
  }
  
  private showFormError(message: string): void {
    // Remove any existing error message
    const existingError = document.getElementById('login-error-message');
    if (existingError) {
      existingError.remove();
    }

    // Create new error message
    const errorElement = document.createElement('div');
    errorElement.id = 'login-error-message';
    errorElement.className = 'mt-4 p-3 bg-red-900/40 border border-red-500 text-red-300 rounded-md font-tech text-sm';
    errorElement.textContent = message;

    // Insert after the form
    const form = document.getElementById('login-form');
    if (form && form.parentNode) {
      form.parentNode.insertBefore(errorElement, form.nextSibling);
    }

    // Scroll to error
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  private showSuccess(message: string): void {
    // Remove any existing error message
    const existingError = document.getElementById('login-error-message');
    if (existingError) {
      existingError.remove();
    }

    // Create success message
    const successElement = document.createElement('div');
    successElement.id = 'login-success-message';
    successElement.className = 'mt-4 p-3 bg-green-900/40 border border-green-500 text-green-300 rounded-md font-tech text-sm';
    successElement.textContent = message;

    // Insert after the form
    const form = document.getElementById('login-form');
    if (form && form.parentNode) {
      form.parentNode.insertBefore(successElement, form.nextSibling);
    }
  }

  // re-render Google button on window size
  private addResizeListener(): void {
    let resizeTimeout: number;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
          renderGoogleButton(0);
        }
      }, 250); 
    };
    
    window.addEventListener('resize', handleResize);
    
    (this as any).resizeHandler = handleResize;
  }

  destroy(): void {
    if ((this as any).resizeHandler) {
      window.removeEventListener('resize', (this as any).resizeHandler);
    }
    super.destroy?.();
  }
}

function handleCredentialResponse(response: google.accounts.id.CredentialResponse) {
    if (!response || !response.credential) {
        showNotification("Google authentication failed. Invalid response from Google.", 'error');
        return;
    }
    
    console.log('JWT reçu :', response.credential);

    // Send the Google JWT token to the backend for verification
    fetch('/api/auth/google', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id_token: response.credential })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success == true) {
            if (data.needs_username) {
                showUsernameSelectionPopup(response.credential);
            } else {
                // Store authentication flag for Google login
                localStorage.setItem('authToken', 'authenticated');
                showNotification("You have been logged in successfully with Google", 'success');
                
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            }
        }
        else {
            showNotification("Please try to reconnect to Google again", 'error');
        }
        console.log('Utilisateur connecté', data);
    })
    .catch(error => {
        console.error('Google authentication error:', error);
        showNotification("Google authentication failed. Please try again.", 'error');
    });
}

function showUsernameSelectionPopup(credential: string): void {
    
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
        <div class="bg-cyber-darker p-8 rounded-lg border-2 border-neon-pink shadow-lg flex flex-col items-center w-full max-w-sm">
            <h3 class="text-neon-pink font-cyber text-lg mb-4 text-center">Complete Your Account</h3>
            <p class="text-gray-400 text-sm mb-4 text-center">Welcome! Please choose a unique username and password for your account.</p>
            <input type="text" id="username-selection-input" class="w-full bg-cyber-dark border-2 border-neon-pink/30 text-white px-3 py-2 rounded mb-3" placeholder="Enter username" autocomplete="username" maxlength="20" />
            <input type="password" id="password-selection-input" class="w-full bg-cyber-dark border-2 border-neon-cyan/30 text-white px-3 py-2 rounded mb-3" placeholder="Enter password" autocomplete="new-password" minlength="6" />
            <input type="password" id="confirm-password-selection-input" class="w-full bg-cyber-dark border-2 border-neon-cyan/30 text-white px-3 py-2 rounded mb-4" placeholder="Confirm password" autocomplete="new-password" />
            <div id="username-selection-error" class="text-red-400 text-xs mb-2 hidden"></div>
            <div class="flex w-full gap-2">
                <button id="username-selection-confirm" class="flex-1 bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-4 py-2 rounded hover:shadow-lg hover:shadow-neon-pink/50 duration-300">Create</button>
                <button id="username-selection-cancel" class="flex-1 bg-cyber-dark border border-neon-cyan/40 text-neon-cyan px-4 py-2 rounded hover:border-neon-cyan hover:shadow-lg hover:shadow-neon-cyan/20 duration-300">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const usernameInput = modal.querySelector('#username-selection-input') as HTMLInputElement;
    const passwordInput = modal.querySelector('#password-selection-input') as HTMLInputElement;
    const confirmPasswordInput = modal.querySelector('#confirm-password-selection-input') as HTMLInputElement;
    const errorDiv = modal.querySelector('#username-selection-error') as HTMLElement;
    const confirmBtn = modal.querySelector('#username-selection-confirm') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#username-selection-cancel') as HTMLButtonElement;

    setTimeout(() => usernameInput?.focus(), 100);

    const handleCancel = () => {
        document.body.removeChild(modal);
        showNotification("Username selection cancelled. Redirecting to registration page...", 'error');
        
        setTimeout(() => {
            window.location.href = '/register';
        }, 2000);
    };

    cancelBtn.onclick = handleCancel;

    modal.onclick = (e) => {
        if (e.target === modal) {
            handleCancel();
        }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            handleCancel();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };
    document.addEventListener('keydown', handleKeyDown);

    confirmBtn.onclick = async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        errorDiv.classList.add('hidden');
        
        // Username validation
        if (!username) {
            errorDiv.textContent = 'Username is required';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (username.length < 3) {
            errorDiv.textContent = 'Username must be at least 3 characters';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (username.length > 20) {
            errorDiv.textContent = 'Username must be less than 20 characters';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            errorDiv.textContent = 'Username can only contain letters, numbers, underscores, and hyphens';
            errorDiv.classList.remove('hidden');
            return;
        }

        // Password validation
        if (!password) {
            errorDiv.textContent = 'Password is required';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters long';
            errorDiv.classList.remove('hidden');
            return;
        }
        
        if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.classList.remove('hidden');
            return;
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Creating...';
        
        try {
            const response = await fetch('/api/auth/google/complete', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id_token: credential,
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store authentication flag for completed Google account setup
                localStorage.setItem('authToken', 'authenticated');
                showNotification('Account created successfully! Welcome to Transcendence!', 'success');
                document.body.removeChild(modal);
                document.removeEventListener('keydown', handleKeyDown);
                
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            } else {
                let errorMessage = 'Failed to create account. Please try again.';
                
                switch (data.error) {
                    case 'username_taken':
                        errorMessage = 'This username is already taken. Please choose another.';
                        break;
                    case 'username_too_short':
                        errorMessage = 'Username must be at least 3 characters long.';
                        break;
                    case 'username_too_long':
                        errorMessage = 'Username must be less than 20 characters long.';
                        break;
                    case 'username_invalid_chars':
                        errorMessage = 'Username can only contain letters, numbers, underscores, and hyphens.';
                        break;
                    case 'password_too_short':
                        errorMessage = 'Password must be at least 6 characters long.';
                        break;
                    case 'user_already_exists':
                        errorMessage = 'An account with this Google account already exists.';
                        break;
                    default:
                        errorMessage = data.error || errorMessage;
                }
                
                throw new Error(errorMessage);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.';
            errorDiv.textContent = errorMessage;
            errorDiv.classList.remove('hidden');
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Create';
        }
    };

    usernameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });

    passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            confirmPasswordInput.focus();
        }
    });

    confirmPasswordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            confirmBtn.click();
        }
    });

    usernameInput.addEventListener('input', () => {
        const username = usernameInput.value.trim();
        errorDiv.classList.add('hidden');
        
        if (username && !/^[a-zA-Z0-9_-]+$/.test(username)) {
            errorDiv.textContent = 'Username can only contain letters, numbers, underscores, and hyphens';
            errorDiv.classList.remove('hidden');
        }
    });

    // Real-time password validation
    const validatePasswords = () => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword && password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.classList.remove('hidden');
        } else if (password && password.length < 6) {
            errorDiv.textContent = 'Password must be at least 6 characters long';
            errorDiv.classList.remove('hidden');  
        } else {
            errorDiv.classList.add('hidden');
        }
    };

    passwordInput.addEventListener('input', validatePasswords);
    confirmPasswordInput.addEventListener('input', validatePasswords);
}

function initializeGoogleSignIn(retryCount = 0) {
  //console.log(`Initializing Google Sign-In (attempt ${retryCount + 1})...`);
  try {
    // Make sure Google API is loaded
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
      //console.log('Google API not available yet, retrying...');
      if (retryCount < 5) {
        setTimeout(() => initializeGoogleSignIn(retryCount + 1), 1000);
      } else {
        console.error('Failed to load Google API after multiple attempts');
      }
      return;
    }
    
    // Initialize Google Sign-In
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    //console.log('Google Client ID:', CLIENT_ID); // For debugging
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse
    });
    
    //console.log('Google API initialized successfully');

    renderGoogleButton(retryCount);
  } catch (error) {
    console.error('Error initializing Google Sign-In:', error);
    
    if (retryCount < 5) {
      //console.log(`Retrying initialization in 1 second (attempt ${retryCount + 2})...`);
      setTimeout(() => initializeGoogleSignIn(retryCount + 1), 1000);
    }
  }
}

function renderGoogleButton(retryCount = 0) {
  const buttonDiv = document.getElementById("buttonDivGoogle");
  if (buttonDiv) {
    //console.log('Found buttonDivGoogle element, rendering button...');
    
    const containerWidth = buttonDiv.offsetWidth;
    const buttonWidth = Math.min(containerWidth - 20, 380); // Max 380px, with 20px margin
    
    buttonDiv.innerHTML = '';
    
    google.accounts.id.renderButton(
      buttonDiv,
      {
        theme: "filled_black", 
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: buttonWidth
      }
    );
    
    buttonDiv.style.display = 'flex';
    buttonDiv.style.justifyContent = 'center';
    buttonDiv.style.alignItems = 'center';
    
  } else {
    console.log(`buttonDivGoogle element not found on attempt ${retryCount + 1}!`);
    
    // If we haven't retried too many times, try again after a delay
    if (retryCount < 5) {
      console.log(`Will retry rendering button in 1 second (attempt ${retryCount + 2})...`);
      setTimeout(() => renderGoogleButton(retryCount + 1), 1000);
    } else {
      console.error('Failed to find buttonDivGoogle element after multiple attempts');
    }
  }
} 



export default LoginPage;
