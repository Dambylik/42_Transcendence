import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import { getAssetUrl } from '../../utils/assetUtils';

class RegisterPage extends Page {
	static TextObject = {
    MainTitle: 'IDENTITY REGISTRY',
    Subtitle: 'INITIALIZE PROFILE PROTOCOL',
    RegisterButton: 'ESTABLISH PRESENCE',
    Username: 'IDENTITY',
    Password: 'SECURE CODE',
    Email: 'CONTACT NODE',
    LoginRedirect: 'RETURN TO TERMINAL'
	}

constructor(id: string, router?: Router) {
    super(id, router);
    }

	async render(): Promise<HTMLElement> {
        this.container.innerHTML = '';
        await this.setupHeaderListeners(); // Rendu asynchrone pour attendre les listeners

		const mainContent = document.createElement('div');
		mainContent.className = 'min-h-screen pt-4 bg-cyber-dark relative overflow-hidden'; // pt-16 -> pt-4

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
	    const formContainer = this.createRegisterForm();
	    formSection.appendChild(formContainer);

	    // Right column - Image
	    const imageSection = document.createElement('div');
	    imageSection.className = 'hidden lg:block w-full lg:w-[450px]';

	    // Create image container
	    const imageContainer = document.createElement('div');
	    imageContainer.className = 'relative bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg shadow-lg shadow-neon-pink/10 flex items-center justify-center';
	    imageContainer.style.height = '548px';

	    const image = document.createElement('img');
	    image.src = getAssetUrl('register_man.png');
	    image.alt = 'Cyberpunk character';
	    image.className = 'max-h-[450px] max-w-full w-auto object-contain relative z-10 filter drop-shadow-[0_0_15px_rgba(255,0,99,0.5)]';

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

	    // Assemble the layout
	    layout.appendChild(formSection);
	    layout.appendChild(imageSection);
	    contentWrapper.appendChild(layout);
	    mainContent.appendChild(contentWrapper);
	    this.container.appendChild(mainContent);

	    this.setupEventListeners();
	    return this.container;
	  }

  private createRegisterForm(): HTMLElement {
    const formContainer = document.createElement('div');
    formContainer.className = 'relative bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10';

    // Add corner elements
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
    title.textContent = RegisterPage.TextObject.MainTitle;

    const subtitle = document.createElement('p');
    subtitle.className = 'text-neon-cyan/70 text-sm font-tech mb-8 text-center tracking-wide';
    subtitle.textContent = RegisterPage.TextObject.Subtitle;

    // Form
    const form = document.createElement('form');
    form.id = 'register-form';
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
        label: RegisterPage.TextObject.Username,
        type: 'text',
        id: 'username',
        placeholder: 'Create your identity'
      },
      {
        label: RegisterPage.TextObject.Password,
        type: 'password',
        id: 'password',
        placeholder: 'Create access code'
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

    // Register button
    const RegisterButton = document.createElement('button');
    RegisterButton.type = 'button'; // Changed from 'submit' to 'button'
    RegisterButton.className = `w-full mt-8 bg-gradient-to-r from-neon-pink to-neon-cyan 
      text-white font-cyber text-lg py-4 rounded-md relative overflow-hidden
      border-2 border-neon-pink/50 hover:border-neon-cyan/50
      transition-all duration-300 group`;
    RegisterButton.innerHTML = `
      <span class="relative z-10 tracking-wider">${RegisterPage.TextObject.RegisterButton}</span>
      <div class="absolute inset-0 opacity-0 group-hover:opacity-100 
        transition-opacity duration-300 bg-gradient-to-r from-neon-cyan to-neon-pink"></div>
    `;
    // Add direct click handler to the button
    RegisterButton.addEventListener('click', (e) => {
      this.handleFormSubmit(e);
    });
    form.appendChild(RegisterButton);

	// LoginRedirect link
    const registerLink = document.createElement('div');
    registerLink.className = 'mt-6 text-center';
    registerLink.innerHTML = `
      <a href="/login" data-route="/login" 
        class="inline-block text-neon-cyan/80 hover:text-neon-cyan font-tech tracking-wide text-sm
        transition-all duration-300 relative group">
        <span class="relative z-10">${RegisterPage.TextObject.LoginRedirect}</span>
        <div class="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-cyan transform scale-x-0 
          group-hover:scale-x-100 transition-transform duration-300"></div>
      </a>
    `;

    // Divider
    const divider = document.createElement('div');
    divider.className = 'my-8 flex items-center';
    divider.innerHTML = `
      <div class="flex-1 border-t-2 border-neon-pink/20"></div>
      <div class="px-4 text-sm font-tech text-neon-cyan/50"></div>
      <div class="flex-1 border-t-2 border-neon-cyan/20"></div>
    `;

    // Build the form container
    formContainer.appendChild(title);
    formContainer.appendChild(subtitle);
    formContainer.appendChild(form);
	  formContainer.appendChild(registerLink);
    formContainer.appendChild(divider);

    return formContainer;
  }

  private setupEventListeners(): void {
    const form = document.getElementById('register-form') as HTMLFormElement;
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(e);
      });
    } else {
      console.error('Form not found in setupEventListeners');
    }
  }

  private showFormError(message: string): void {
    // Remove any existing error message
    const existingError = document.getElementById('register-error-message');
    if (existingError) {
      existingError.remove();
    }

    // Create new error message
    const errorElement = document.createElement('div');
    errorElement.id = 'register-error-message';
    errorElement.className = 'mt-4 p-3 bg-red-900/40 border border-red-500 text-red-300 rounded-md font-tech text-sm';
    errorElement.textContent = message;

    // Insert after the form
    const form = document.getElementById('register-form');
    if (form && form.parentNode) {
      form.parentNode.insertBefore(errorElement, form.nextSibling);
    }

    // Scroll to error
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  private showSuccess(message: string): void {
    // Remove any existing error message
    const existingError = document.getElementById('register-error-message');
    if (existingError) {
      existingError.remove();
    }

    // Create success message
    const successElement = document.createElement('div');
    successElement.id = 'register-success-message';
    successElement.className = 'mt-4 p-3 bg-green-900/40 border border-green-500 text-green-300 rounded-md font-tech text-sm';
    successElement.textContent = message;

    // Insert after the form
    const form = document.getElementById('register-form');
    if (form && form.parentNode) {
      form.parentNode.insertBefore(successElement, form.nextSibling);
    }
  }

  private validateForm(username: string, password: string): { valid: boolean, message?: string } {
    // Username validation
    if (!username.trim()) {
      return { valid: false, message: 'Username is required' };
    }
    
    if (username.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters long' };
    }
    
    if (username.length > 20) {
      return { valid: false, message: 'Username must be less than 20 characters' };
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
    
    // Password validation
    if (!password) {
      return { valid: false, message: 'Password is required' };
    }
    
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    
    return { valid: true };
  }

  private handleFormSubmit(e: Event): void {
  e.preventDefault();
  
  const username = (document.getElementById('username') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;

  // Basic validation
  if (!username || !password) {
    this.showFormError('Username and password are required');
    return;
  }

  // Client-side validation
  const validation = this.validateForm(username, password);
  if (!validation.valid) {
    this.showFormError(validation.message || 'Invalid input');
    return;
  }

  const submitButton = document.querySelector('button[type="button"]') as HTMLButtonElement;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add('opacity-50');
    submitButton.innerHTML = `
      <span class="relative z-10 tracking-wider">PROCESSING...</span>
      <div class="absolute inset-0 opacity-100 
        transition-opacity duration-300 bg-gradient-to-r from-neon-cyan to-neon-pink"></div>
    `;
  }
  
  fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include'
  })
  .then(response => {
    console.log('Registration response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    if (!response.ok) {
      return response.json().then(errorData => {
        throw new Error(errorData.error || 'Registration failed');
      });
    }
    return response.json();
  })
  .then(data => {
    console.log('Register successful:', data);
    this.showSuccess('Registration successful! Redirecting to login...');
    
    setTimeout(() => {
      this.router?.navigate('/login');
    }, 1500);
  })
  .catch(error => {
    this.showFormError(`Registration failed: ${error.message}`);
  })
  .finally(() => {
    const submitButton = document.querySelector('button[type="button"]') as HTMLButtonElement;
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('opacity-50');
      submitButton.innerHTML = `
        <span class="relative z-10 tracking-wider">${RegisterPage.TextObject.RegisterButton}</span>
        <div class="absolute inset-0 opacity-0 group-hover:opacity-100 
          transition-opacity duration-300 bg-gradient-to-r from-neon-cyan to-neon-pink"></div>
      `;
    }
  });
}

}

export default RegisterPage;
