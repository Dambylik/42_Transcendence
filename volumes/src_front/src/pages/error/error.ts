import Page from '../../core/templates/page';
import { Router } from '../../../router/Router';
import errorPage from '../../assets/error_page.png';


class ErrorPage extends Page {
	static TextObject = {
    ReturnHome: 'RETURN HOME'
  };
  
  constructor(id: string, router?: Router) {
    super(id, router);
  }
  
 async render(): Promise<HTMLElement> {
    this.container.innerHTML = '';
    await this.setupEventListeners(); // Rendu asynchrone pour attendre les listeners

    const errorContent = document.createElement('div');
    errorContent.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-col'; // pt-16 -> pt-4
    errorContent.innerHTML = `

	<div class="absolute inset-0 z-0">
        <img src="${errorPage}" alt="Error Page Background" 
             class="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div class="absolute inset-0 bg-black bg-opacity-10"></div>
      </div>

  <!-- Main Content -->
      <div class="relative z-10 min-h-screen flex flex-col items-center justify-start px-4 pt-24 md:pt-32">
  <!-- Title -->
        <h1 class="font-cyber text-6xl md:text-8xl font-bold mb-4 text-center mt-12">
          <span class="text-neon-pink animate-glow-pulse">404</span> <br/>
          <span class="text-neon-cyan">PAGE NOT FOUND<br/></span>
        </h1>

	  <!-- Return Home Button -->
        <button id="return-home-button" data-route="/" 
                class="group relative bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-bold text-lg px-12 py-4 
                       border border-neon-pink hover:shadow-lg hover:shadow-neon-pink/50 
                       transition-all duration-300 animate-scale-in font-cyber tracking-wider
                       before:absolute before:inset-0 before:bg-gradient-to-r before:from-neon-pink/20 before:to-neon-cyan/20 
                       before:opacity-0 hover:before:opacity-100 before:transition-opacity
                       mt-32 md:mt-48">
          <span class="relative z-10">RETURN HOME</span>
        </button>
      </div>

	  <!-- Corner UI Elements -->
      <div class="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-neon-pink opacity-50"></div>
      <div class="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-neon-cyan opacity-50"></div>
      <div class="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-neon-cyan opacity-50"></div>
      <div class="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-neon-pink opacity-50"></div>
    </div>
`;
 this.container.appendChild(errorContent);


 setTimeout(() => {
      this.setupEventListeners();
    }, 200);

 return this.container;
 }
  private setupEventListeners(): void {
    const returnHomeButton = document.getElementById('return-home-button');
    
    if (returnHomeButton && this.router) {
      returnHomeButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.router?.navigate('/');
      });
    }
  }
}

export default ErrorPage;


