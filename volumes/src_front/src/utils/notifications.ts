export function showNotification(message: string, type: 'success' | 'error'): void {
  
  const notificationEl = document.createElement('div');
  notificationEl.className = `fixed top-4 right-4 p-4 rounded-lg z-50 ${
    type === 'success' ? 'bg-cyber-darker border-2 border-neon-cyan text-neon-cyan' : 'bg-cyber-darker border-2 border-neon-pink text-neon-pink'
  } font-cyber`;
  notificationEl.innerHTML = message;
  document.body.appendChild(notificationEl);

  setTimeout(() => {
    if (document.body.contains(notificationEl)) {
      document.body.removeChild(notificationEl);
    }
  }, 3000);
}
