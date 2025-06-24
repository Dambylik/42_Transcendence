import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import { getAssetUrl } from '../../utils/assetUtils';

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
        await this.setupHeaderListeners();

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
      }
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
    googleButtonContainer.className = 'w-full mt-4 border-2 border-transparent rounded-md min-h-[50px]';
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
      console.error('Login form not found in setupEventListeners');
    }
    
    const googleLoginButton = document.getElementById('google-login');
    if (googleLoginButton) {
      googleLoginButton.addEventListener('click', this.handleGoogleLogin.bind(this));
    }
    
    // Try to initialize Google Sign-In, with a retry mechanism
    this.initializeGoogleSignInWithRetry();
  }
  
  private initializeGoogleSignInWithRetry(retryCount = 0): void {
    
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      initializeGoogleSignIn();
    } else {
      console.log("Google API not yet loaded, waiting...");
      
      // If we've tried less than 5 times, retry after a delay
      if (retryCount < 5) {
        setTimeout(() => {
          this.initializeGoogleSignInWithRetry(retryCount + 1);
        }, 1000); // Wait 1 second before retrying
      } else {
        // Load Google API manually as a fallback
        this.loadGoogleApiManually();
      }
    }
  }
  
  private loadGoogleApiManually(): void {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setTimeout(() => {
        initializeGoogleSignIn();
      }, 1000);
    };
    script.onerror = () => {
    };
    document.head.appendChild(script);
  }
  
  private handleFormSubmit(e: Event): void {
    e.preventDefault();
    
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;
    
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
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    })
      .then(response => {
        console.log('Login response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.error || 'Login failed');
          });
        }
        return response.json();
      })
      .then(data => {
        this.showSuccess('Login successful! Redirecting...');
        
        // Redirect after a short delay to show the success message
        setTimeout(() => {
          this.router?.navigate('/dashboard');
        }, 1500);
      })
      .catch(error => {
        console.error('Login error:', error);
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
}

function handleCredentialResponse(response: any) {
    
    if (!response || !response.credential) {
      alert('Google authentication failed. Invalid response from Google.');
      return;
    }
    
    console.log("ID Token received from Google: ", response.credential.substring(0, 20) + '...');

    fetch('/api/auth/google', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id_token: response.credential }),
      credentials: 'include'
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`Backend responded with status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      } else {
        console.warn('No auth token received from backend');
      }
    })
    .catch(error => {
      alert('Google authentication failed. Please try again or use another login method.');
    });
}

// Supprimer ce bloc pour éviter la redirection automatique sur /dashboard
// window.onload = function () {
//   fetch('/api/me', { credentials: 'include' })
//     .then(res => res.json())
//     .then(data => {
//       if (data && data.success) {
//         // Déjà connecté, redirige vers dashboard
//         // Prevent redirect loop: only redirect if not already on /dashboard
//         if (window.location.pathname !== '/dashboard') {
//           window.location.href = '/dashboard';
//         }
//       } else {
//         // Google API n'est pas encore chargé, on attend...
//         if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
//           console.log('Google API not loaded on window.onload, loading it now...');
//           // Load the Google API script
//           const script = document.createElement('script');
//           script.src = 'https://accounts.google.com/gsi/client';
//           script.async = true;
//           script.defer = true;
//           script.onload = function() {
//             console.log('Google API script loaded successfully');
//             // Wait a bit for everything to initialize
//             setTimeout(initializeGoogleSignIn, 1000);
//           };
//           script.onerror = () => console.error('Failed to load Google API script');
//           document.head.appendChild(script);
//         } else {
//           // Google API is already loaded, initialize with a small delay
//           console.log('Google API already loaded on window.onload');
//           setTimeout(initializeGoogleSignIn, 500);
//         }
//       }
//     })
//     .catch(() => {
//       // En cas d'erreur (pas connecté), on s'assure que l'API Google est chargée
//       if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
//         console.log('Google API not loaded, loading it now...');
//         const script = document.createElement('script');
//         script.src = 'https://accounts.google.com/gsi/client';
//         script.async = true;
//         script.defer = true;
//         script.onload = function() {
//           console.log('Google API script loaded successfully');
//           setTimeout(initializeGoogleSignIn, 1000);
//         };
//         script.onerror = () => console.error('Failed to load Google API script');
//         document.head.appendChild(script);
//       } else {
//         initializeGoogleSignIn();
//       }
//     });
// };

function initializeGoogleSignIn(retryCount = 0) {
  console.log(`Initializing Google Sign-In (attempt ${retryCount + 1})...`);
  try {
    // Make sure Google API is loaded
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
      console.log('Google API not available yet, retrying...');
      if (retryCount < 5) {
        setTimeout(() => initializeGoogleSignIn(retryCount + 1), 1000);
      } else {
        console.error('Failed to load Google API after multiple attempts');
      }
      return;
    }
    
    // Initialize Google Sign-In
    google.accounts.id.initialize({
      client_id: 'XXX',
      callback: handleCredentialResponse
    });
    
    console.log('Google API initialized successfully');

    // Render the Google Sign-In button
    renderGoogleButton(retryCount);
  } catch (error) {
    console.error('Error initializing Google Sign-In:', error);
    
    // Retry if we haven't tried too many times
    if (retryCount < 5) {
      console.log(`Retrying initialization in 1 second (attempt ${retryCount + 2})...`);
      setTimeout(() => initializeGoogleSignIn(retryCount + 1), 1000);
    }
  }
}

function renderGoogleButton(retryCount = 0) {
  const buttonDiv = document.getElementById("buttonDivGoogle");
  if (buttonDiv) {
    console.log('Found buttonDivGoogle element, rendering button...');
    google.accounts.id.renderButton(
      buttonDiv,
      { 
        theme: "filled_black",
        size: "medium",
        text: "signin_with",
        shape: "circle",
        logo_alignment: "left",
        width: 380
      }
    );
  } else {
    console.warn(`buttonDivGoogle element not found on attempt ${retryCount + 1}!`);
    
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
