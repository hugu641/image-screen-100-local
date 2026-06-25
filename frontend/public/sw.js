/**
 * sw.js — Service Worker for ImageScreen TV Player
 *
 * Strategy:  App Shell → Cache-First with network update
 *
 * What is cached:
 *   - The HTML entry point (/)
 *   - All JS / CSS / font assets produced by Vite
 *
 * This guarantees that even if the network / server goes completely down,
 * the React application itself loads in the TV browser.  Media files are
 * handled separately by the Cache Storage API inside TVPlayer.jsx.
 */

const SHELL_CACHE = 'imagescreen-shell-v1';

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      // Pre-cache only the bare minimum (the HTML entry point).
      // JS/CSS assets are cached lazily on first fetch (see fetch handler).
      return cache.addAll(['/']);
    }).then(() => {
      // Activate this worker immediately without waiting for old tabs to close.
      return self.skipWaiting();
    })
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete outdated shell caches but keep the media cache (media-cache).
          if (cacheName !== SHELL_CACHE && cacheName.startsWith('imagescreen-shell-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept API calls, WebSocket upgrades, or upload requests.
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/uploads') ||
    request.headers.get('upgrade') === 'websocket'
  ) {
    return; // Let the browser handle it normally.
  }

  // 2. For everything else, use Stale-While-Revalidate:
  //    → Serve from cache immediately (fast / offline),
  //    → Fetch from network in background and update cache.
  event.respondWith(staleWhileRevalidate(request));
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(SHELL_CACHE);
  const cachedResponse = await cache.match(request);

  // Fire off a network fetch in background regardless.
  const networkFetch = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Network totally unavailable — silent fail, cached response will be used.
      console.warn('[SW] Network unavailable, serving from cache:', request.url);
    });

  // If we have something in cache, return it immediately (offline-capable).
  if (cachedResponse) {
    return cachedResponse;
  }

  // Otherwise wait for the network (first visit, nothing cached yet).
  return networkFetch;
}
