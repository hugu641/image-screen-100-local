/**
 * socket.js — Socket.IO client
 *
 * Uses the same server URL resolution as api.js:
 *  1. localStorage["server_url"] if set (cloud / remote server)
 *  2. import.meta.env.VITE_SERVER_URL ← set at build time via Vercel env variables
 *  3. window.location.origin otherwise (same-origin, works locally and in production)
 */
import { io } from 'socket.io-client';

function getSocketUrl() {
  // 1. Manual override
  const saved = localStorage.getItem('server_url');
  if (saved && saved.trim() !== '') {
    return saved.trim().replace(/\/$/, '');
  }
  // 2. Build-time env variable
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/$/, '');
  }
  // 3. Same-origin fallback
  return window.location.origin;
}

let socket = null;

/**
 * Initialize (or re-initialize) the socket connection.
 * @param {'admin'|'screen'} type
 * @param {string|null} screenId  — required when type === 'screen'
 */
export function initSocket(type, screenId = null) {
  if (socket) {
    socket.disconnect();
  }

  const query = { type };
  if (screenId) query.screenId = screenId;

  socket = io(getSocketUrl(), {
    query,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: Infinity,
    // Allow credentials when server enforces a stricter CORS policy (cloud mode)
    withCredentials: true
  });

  socket.on('connect', () => {
    console.log(`[Socket] ✅ Connected as ${type} to ${getSocketUrl()}`);
  });

  socket.on('connect_error', (err) => {
    console.warn(`[Socket] ⚠️  Connection error: ${err.message}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket] 🔌 Disconnected: ${reason}`);
  });

  return socket;
}

/** Return the current socket instance (may be null before initSocket is called). */
export function getSocket() {
  return socket;
}

/** Gracefully disconnect and clear the socket reference. */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
