/**
 * registerSW.js — Service Worker registration
 *
 * Called from main.jsx at application startup.
 * Silently skips registration in browsers that don't support SWs.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.info('[SW] Service Workers are not supported in this browser.');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] ✅ Registered. Scope:', registration.scope);

        // Check for updates periodically (every 60 s)
        setInterval(() => {
          registration.update().catch(() => {});
        }, 60_000);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] 🔄 New version available. Reload to update.');
              // You can show a toast/banner here if desired.
            }
          });
        });
      })
      .catch((error) => {
        console.warn('[SW] Registration failed:', error);
      });
  });
}
