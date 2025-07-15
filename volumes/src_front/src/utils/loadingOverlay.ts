// src/utils/loadingOverlay.ts
// Overlay d'attente néon réutilisable pour tous les jeux

let loadingOverlay: HTMLElement | null = null;

export function showLoadingOverlay(message = 'Building the board...') {
  if (loadingOverlay) return;
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 flex items-center justify-center z-[9999] bg-black/70';
  overlay.style.pointerEvents = 'all';

  // Neon spinner
  const spinner = document.createElement('div');
  spinner.className = 'neon-spinner';
  spinner.innerHTML = `
    <div class="w-24 h-24 flex items-center justify-center">
      <svg class="animate-spin" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="40" stroke="#00fff7" stroke-width="8" fill="none" stroke-linecap="round" opacity="0.3"/>
        <circle cx="48" cy="48" r="40" stroke="#00fff7" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="60 200"/>
      </svg>
    </div>
    <div class="mt-6 text-neon-cyan font-cyber text-2xl animate-glow-pulse">${message}</div>
  `;
  overlay.appendChild(spinner);
  document.body.appendChild(overlay);
  loadingOverlay = overlay;
}

export function hideLoadingOverlay() {
  if (loadingOverlay) {
    loadingOverlay.remove();
    loadingOverlay = null;
  }
}
