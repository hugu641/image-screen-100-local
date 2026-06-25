import React, { useState, useEffect } from 'react';
import Layout from '../layouts/Layout';
import { api } from '../services/api';
import { getSocket, initSocket } from '../services/socket';
import {
  Tv,
  Image as ImageIcon,
  PlaySquare,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle,
  Link2
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    screensTotal: 0,
    screensConnected: 0,
    mediaCount: 0,
    playlistsCount: 0
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [screens, media, playlists, recentEvents] = await Promise.all([
        api.get('/screens'),
        api.get('/media'),
        api.get('/playlists'),
        api.get('/events?limit=15')
      ]);

      const total = screens.length;
      const connected = screens.filter(s => s.status === 'connected').length;

      setStats({
        screensTotal: total,
        screensConnected: connected,
        mediaCount: media.length,
        playlistsCount: playlists.length
      });
      setEvents(recentEvents);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Setup Socket connection
    const socket = getSocket() || initSocket('admin');

    // Listen to new events in real-time
    socket.on('event:new', (newEvent) => {
      setEvents(prev => [newEvent, ...prev.slice(0, 14)]);
      // Refresh statistics counts
      loadDashboardData();
    });

    // Listen to screen list or status changes to update indicators
    socket.on('screens:list', () => {
      loadDashboardData();
    });
    socket.on('screen:status_update', () => {
      loadDashboardData();
    });

    return () => {
      socket.off('event:new');
      socket.off('screens:list');
      socket.off('screen:status_update');
    };
  }, []);

  const getEventIcon = (message) => {
    const text = message.toLowerCase();
    if (text.includes('connect')) return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    if (text.includes('déconnect') || text.includes('perdu')) return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    if (text.includes('associé')) return <Link2 className="w-4 h-4 text-indigo-400" />;
    return <Activity className="w-4 h-4 text-blue-400" />;
  };

  const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Tableau de Bord</h1>
            <p className="text-slate-400 text-sm">Vue globale et activité en temps réel du magasin.</p>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 text-xs font-semibold rounded-lg transition-all"
          >
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="h-32 bg-dark-900/40 border border-slate-800/50 rounded-2xl" />
            <div className="h-32 bg-dark-900/40 border border-slate-800/50 rounded-2xl" />
            <div className="h-32 bg-dark-900/40 border border-slate-800/50 rounded-2xl" />
          </div>
        ) : (
          /* Cards Stats */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Screens card */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 shadow-md">
                <Tv className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Écrans Connectés</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl font-bold text-white">{stats.screensConnected}</span>
                  <span className="text-slate-500 text-sm">/ {stats.screensTotal}</span>
                </div>
              </div>
              <div className="absolute right-4 bottom-4 text-xs font-medium text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>

            {/* Media Card */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-md">
                <ImageIcon className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Médiathèque</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl font-bold text-white">{stats.mediaCount}</span>
                  <span className="text-slate-500 text-sm">fichiers</span>
                </div>
              </div>
            </div>

            {/* Playlists Card */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 shadow-md">
                <PlaySquare className="w-6 h-6 text-pink-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Playlists Actives</p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl font-bold text-white">{stats.playlistsCount}</span>
                  <span className="text-slate-500 text-sm">diffusions</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Log Section */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Journal des Événements
            </h2>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Temps réel
            </span>
          </div>

          {events.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Aucun événement enregistré pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-[450px] overflow-y-auto pr-1">
              {events.map((event) => (
                <div key={event.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/40 flex items-center justify-center border border-slate-800 shrink-0">
                      {getEventIcon(event.message)}
                    </div>
                    <span className="text-sm font-medium text-slate-300 truncate">
                      {event.message}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 whitespace-nowrap shrink-0 flex items-center gap-2">
                    <span>{formatTime(event.timestamp)}</span>
                    <span className="text-slate-650 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                      {formatDate(event.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
