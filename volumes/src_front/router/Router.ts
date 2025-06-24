// src/router/Router.ts

export class Router {
  private routes: Record<string, () => HTMLElement | void | Promise<HTMLElement | void>> = {};
  private outletId: string;

  constructor(outletId: string) {
    this.outletId = outletId;
    const outlet = document.getElementById(this.outletId);
    if (!outlet) throw new Error(`Outlet with id "${this.outletId}" not found.`);

    window.addEventListener('popstate', () => this.loadRoute());
    setTimeout(() => this.loadRoute(), 0);

    document.body.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a')) {
        const anchor = target.closest('a') as HTMLAnchorElement;
        const href = anchor.getAttribute('href');
        if (
          href &&
          href.startsWith('/') &&
          !href.startsWith('//') &&
          !href.startsWith('/#')
        ) {
          e.preventDefault();
          this.navigate(href);
        }
      }
    });
  }

  addRoute(path: string, renderFn: () => HTMLElement | void | Promise<HTMLElement | void>): void {
    this.routes[path] = renderFn;
  }

  navigate(path: string) {
    history.pushState(null, '', path);
    this.loadRoute();
  }

  async loadRoute(): Promise<void> {
    const path = window.location.pathname || '/';
    const outlet = document.getElementById(this.outletId);
    if (!outlet) return;

    let renderFn = this.routes[path];

    // Dynamic routes
    if (!renderFn) {
      for (const route in this.routes) {
        const dynamicMatch = route.match(/^\/([^:]+):([^/]+)$/);
        if (dynamicMatch) {
          const baseRoute = `/${dynamicMatch[1]}`;
          if (path.startsWith(baseRoute)) {
            renderFn = this.routes[route];
            break;
          }
        }
      }
    }

    // Wildcard fallback
    if (!renderFn) {
      renderFn = this.routes['*'];
    }
    
    if (renderFn) {
      try {
        const element = await renderFn();
        // Si la page gère déjà le rendu (via App), ne rien faire ici
        // Only manipulate DOM if the route function returns an HTMLElement
        if (element && element instanceof HTMLElement) {
          // CORRECTION : Nettoyage plus efficace
          while (outlet.firstChild) {
            outlet.removeChild(outlet.firstChild);
          }
          outlet.appendChild(element);
        }
        // If no element is returned, assume the route handles its own rendering
      } catch (err) {
        console.error('Error rendering route:', err);
      }
    }
  }
}

