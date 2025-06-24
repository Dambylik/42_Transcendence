import { Router } from '../../../router/Router';

export function createHeader(router?: Router): string {
  return `
    <header class="w-full bg-navy-dark py-4 px-8 fixed top-0 left-0 right-0 z-50">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <!-- Logo on the left -->
        <div class="flex-shrink-0">        
        <nav class="space-x-8">
          <a href="/" data-route="/" class="header-logo text-neon-pink hover:text-neon-cyan transition-colors font-tech tracking-wider uppercase">FT_TRANSCENDENCE</a>
        </nav>
      </div>
    </header>
  `;
}

export function setupHeaderEventListeners(container: HTMLElement, router?: Router): void {
  const links = container.querySelectorAll('[data-route]');
  links.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const route = (link as HTMLElement).dataset.route || '/';
      if (router) {
        router.navigate(route);
      } else {
        console.log('Router is not defined in setupHeaderEventListeners.');
      }
    });
  });
}

