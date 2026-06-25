const { Server } = require('socket.io');
const { fdb } = require('../database/db');

let io = null;
const activeScreens = new Map(); // screenId -> socketId

function init(server, allowedOrigins = null) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins || '*',
      methods: ['GET', 'POST'],
      credentials: !!allowedOrigins
    }
  });

  io.on('connection', (socket) => {
    const clientType = socket.handshake.query.type; // 'admin' or 'screen'
    const screenId = socket.handshake.query.screenId;

    if (clientType === 'admin') {
      socket.join('admins');
      console.log(`Admin connected: ${socket.id}`);
    } else if (clientType === 'screen' && screenId) {
      socket.join(`screen:${screenId}`);
      socket.screenId = screenId;
      activeScreens.set(screenId, socket.id);
      console.log(`Screen connected: ${screenId} (Socket: ${socket.id})`);

      handleScreenConnection(screenId, socket);
    }

    // Handlers
    socket.on('screen:register', async (data) => {
      const { id, code, name } = data;
      socket.screenId = id;
      activeScreens.set(id, socket.id);

      const forwardedFor = socket.handshake.headers['x-forwarded-for'];
      const ipAddress = forwardedFor
        ? forwardedFor.split(',')[0].trim()
        : (socket.handshake.address.replace(/^.*:/, '') || '127.0.0.1');

      try {
        const existing = await fdb.getById('screens', id);

        if (!existing) {
          // Nouvelle écran → créer avec ID fixe
          await fdb.set('screens', id, {
            id,
            name: name || `Écran ${code}`,
            code,
            ip_address: ipAddress,
            status: 'not_associated',
            last_activity: fdb.serverTimestamp(),
            is_associated: false,
            playlist_id: null
          });

          await logEvent(id, 'info', `Nouvel écran détecté : ${name || 'Écran ' + code} (${ipAddress})`);
        } else {
          // Mettre à jour l'écran existant
          let newStatus = 'not_associated';
          if (existing.is_associated) {
            newStatus = existing.playlist_id ? 'connected' : 'waiting_content';
          }

          await fdb.update('screens', id, {
            ip_address: ipAddress,
            status: newStatus,
            last_activity: fdb.serverTimestamp()
          });
        }

        broadcastScreenListUpdate();
      } catch (err) {
        console.error('Error in screen:register:', err);
      }
    });

    socket.on('screen:heartbeat', async (data) => {
      const { id } = data;
      if (!id) return;

      try {
        const screen = await fdb.getById('screens', id);
        if (screen) {
          let status = 'not_associated';
          if (screen.is_associated) {
            status = screen.playlist_id ? 'connected' : 'waiting_content';
          }

          await fdb.update('screens', id, {
            last_activity: fdb.serverTimestamp(),
            status
          });

          broadcastScreenStatus(id, status);
        }
      } catch (err) {
        console.error('Error in screen:heartbeat:', err);
      }
    });

    // Screen reports its current slide for Live Preview
    socket.on('screen:preview_slide', (data) => {
      const { id, mediaId, index, total, progress } = data;
      io.to('admins').emit(`screen:preview:${id}`, { mediaId, index, total, progress });
    });

    socket.on('disconnect', async () => {
      if (socket.screenId) {
        const id = socket.screenId;
        console.log(`Screen disconnected: ${id}`);
        activeScreens.delete(id);

        try {
          const screen = await fdb.getById('screens', id);
          if (screen) {
            let offlineStatus = 'offline';
            if (!screen.is_associated) {
              offlineStatus = 'not_associated';
            }

            await fdb.update('screens', id, {
              status: offlineStatus,
              last_activity: fdb.serverTimestamp()
            });

            await logEvent(id, 'info', `Écran déconnecté : ${screen.name}`);
            broadcastScreenStatus(id, offlineStatus);
          }
        } catch (err) {
          console.error('Error updating screen on disconnect:', err);
        }
      } else {
        console.log(`Admin disconnected: ${socket.id}`);
      }
    });
  });
}

// Helpers
async function handleScreenConnection(screenId, socket) {
  const forwardedFor = socket.handshake.headers['x-forwarded-for'];
  const ipAddress = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : (socket.handshake.address.replace(/^.*:/, '') || '127.0.0.1');
  try {
    const screen = await fdb.getById('screens', screenId);
    if (screen) {
      let status = 'not_associated';
      if (screen.is_associated) {
        status = screen.playlist_id ? 'connected' : 'waiting_content';
      }
      await fdb.update('screens', screenId, {
        ip_address: ipAddress,
        status,
        last_activity: fdb.serverTimestamp()
      });
      await logEvent(screenId, 'info', `Écran connecté : ${screen.name}`);
      broadcastScreenStatus(screenId, status);
    }
  } catch (err) {
    console.error(err);
  }
}

async function broadcastScreenListUpdate() {
  if (!io) return;
  try {
    const screens = await fdb.getAll('screens', [], { orderBy: 'last_activity', orderDir: 'desc' });

    // Résoudre les noms de playlists
    const result = await Promise.all(screens.map(async (screen) => {
      let playlist_name = null;
      if (screen.playlist_id) {
        const playlist = await fdb.getById('playlists', screen.playlist_id);
        playlist_name = playlist ? playlist.name : null;
      }
      return { ...screen, playlist_name };
    }));

    io.to('admins').emit('screens:list', result);
  } catch (err) {
    console.error(err);
  }
}

function broadcastScreenStatus(screenId, status) {
  if (io) {
    io.to('admins').emit('screen:status_update', { id: screenId, status });
  }
}

async function logEvent(screenId, eventType, message) {
  try {
    const newId = await fdb.add('events', {
      screen_id: screenId,
      event_type: eventType,
      message,
      timestamp: fdb.serverTimestamp()
    });

    if (io) {
      const event = await fdb.getById('events', newId);
      io.to('admins').emit('event:new', event);
    }
  } catch (err) {
    console.error('Failed to log event:', err);
  }
}

// Service APIs called from Controllers
function notifyPlaylistUpdate(screenId, playlistId, playlistDetails) {
  if (io) {
    console.log(`Notifying screen ${screenId} of playlist update:`, playlistId);
    io.to(`screen:${screenId}`).emit('screen:update_playlist', { playlistId, playlistDetails });
  }
}

function notifyScreenAssociation(screenId, name, playlistId, playlistDetails) {
  if (io) {
    console.log(`Notifying screen ${screenId} of association.`);
    io.to(`screen:${screenId}`).emit('screen:associated', { name, playlistId, playlistDetails });
  }
}

function forceScreenSync(screenId) {
  if (io) {
    console.log(`Forcing screen sync: ${screenId}`);
    io.to(`screen:${screenId}`).emit('screen:force_sync');
  }
}

module.exports = {
  init,
  notifyPlaylistUpdate,
  notifyScreenAssociation,
  forceScreenSync,
  logEvent,
  broadcastScreenListUpdate
};
