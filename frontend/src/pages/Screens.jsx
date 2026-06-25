import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layouts/Layout';
import { api } from '../services/api';
import { getSocket, initSocket } from '../services/socket';
import {
  Tv,
  Link2,
  Trash2,
  Edit2,
  RefreshCw,
  Eye,
  X,
  PlaySquare,
  AlertCircle
} from 'lucide-react';

export default function Screens() {
  const [screens, setScreens] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Interaction states
  const [associationModal, setAssociationModal] = useState(null); // contains screen code if associating
  const [renameModal, setRenameModal] = useState(null); // contains screen details to rename
  const [playlistModal, setPlaylistModal] = useState(null); // screen details to assign playlist
  const [manualAddModal, setManualAddModal] = useState(false); // true when adding a screen manually

  const [formFields, setFormFields] = useState({ name: '', playlistId: '' });
  const [formError, setFormError] = useState('');

  const fetchScreens = async () => {
    try {
      const data = await api.get('/screens');
      setScreens(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const data = await api.get('/playlists');
      setPlaylists(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function loadData() {
      await Promise.all([fetchScreens(), fetchPlaylists()]);
      setLoading(false);
    }
    loadData();

    // Register WebSockets for real-time screen statuses
    const socket = getSocket() || initSocket('admin');
    
    socket.on('screens:list', (updatedScreens) => {
      setScreens(updatedScreens);
    });

    socket.on('screen:status_update', ({ id, status }) => {
      setScreens(prev =>
        prev.map(s => s.id === id ? { ...s, status } : s)
      );
    });

    // Clean up
    return () => {
      socket.off('screens:list');
      socket.off('screen:status_update');
    };
  }, []);

  const handleOpenAssociate = (screen) => {
    setFormFields({
      name: screen.name || `Écran ${screen.code}`,
      playlistId: ''
    });
    setFormError('');
    setAssociationModal(screen);
  };

  const handleAssociate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formFields.name.trim()) {
      setFormError("Le nom de l'écran est requis.");
      return;
    }

    try {
      await api.post('/screens/associate', {
        code: associationModal ? associationModal.code : formFields.code,
        name: formFields.name,
        playlistId: formFields.playlistId ? parseInt(formFields.playlistId) : null
      });
      setAssociationModal(null);
      setManualAddModal(false);
      fetchScreens();
    } catch (err) {
      setFormError(err.message || "Erreur d'association.");
    }
  };

  const handleOpenRename = (screen) => {
    setFormFields({ name: screen.name, playlistId: '' });
    setFormError('');
    setRenameModal(screen);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formFields.name.trim()) {
      setFormError("Le nom ne peut pas être vide.");
      return;
    }

    try {
      await api.put(`/screens/${renameModal.id}/rename`, { name: formFields.name });
      setRenameModal(null);
      fetchScreens();
    } catch (err) {
      setFormError(err.message || 'Erreur lors du renommage.');
    }
  };

  const handleOpenPlaylist = (screen) => {
    setFormFields({ name: '', playlistId: screen.playlist_id ? String(screen.playlist_id) : '' });
    setPlaylistModal(screen);
  };

  const handleAssignPlaylist = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/screens/${playlistModal.id}/assign-playlist`, {
        playlistId: formFields.playlistId ? parseInt(formFields.playlistId) : null
      });
      setPlaylistModal(null);
      fetchScreens();
    } catch (err) {
      alert(err.message || 'Erreur lors de l\'affectation.');
    }
  };

  const handleSync = async (id) => {
    try {
      await api.post(`/screens/${id}/sync`);
      alert('Commande de synchronisation envoyée à l\'écran.');
    } catch (err) {
      alert(err.message || 'Impossible de synchroniser.');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer/dissocier l'écran "${name}" ?`)) {
      return;
    }

    try {
      await api.delete(`/screens/${id}`);
      fetchScreens();
    } catch (err) {
      alert(err.message || 'Erreur de suppression.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connecté
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded-full">
            Hors ligne
          </span>
        );
      case 'waiting_content':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            En attente de contenu
          </span>
        );
      case 'not_associated':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
            Non associé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">
            Erreur réseau
          </span>
        );
    }
  };

  const formatActivity = (dateStr) => {
    if (!dateStr) return 'Jamais';
    const d = new Date(dateStr);
    return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const unassociatedScreens = screens.filter(s => s.is_associated === 0);
  const associatedScreens = screens.filter(s => s.is_associated === 1);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Gestion des Écrans</h1>
          <p className="text-slate-400 text-sm">
            Associez et pilotez en temps réel les écrans publicitaires de votre magasin.
            <button
              onClick={() => {
                setFormFields({ name: '', playlistId: '', code: '' });
                setFormError('');
                setManualAddModal(true);
              }}
              className="mt-2 block px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium"
            >
              Ajouter un écran manuellement
            </button>
          </p>
        </div>

        {/* Unassociated screens alert panel */}
        {unassociatedScreens.length > 0 && (
          <div className="bg-gradient-to-r from-brand-600/20 to-indigo-600/20 border border-brand-500/30 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold tracking-wide text-brand-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-brand-400" />
              Nouveau(x) écran(s) détecté(s) sur le réseau local !
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassociatedScreens.map((screen) => (
                <div
                  key={screen.id}
                  className="bg-dark-900/80 border border-brand-500/20 rounded-xl p-4 flex justify-between items-center"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Adresse IP : {screen.ip_address}
                    </span>
                    <h3 className="font-semibold text-slate-200 mt-0.5">Code : {screen.code}</h3>
                  </div>

                  <button
                    onClick={() => handleOpenAssociate(screen)}
                    className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-lg shadow-md shadow-brand-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Associer
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Associated screens listing */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Tv className="w-5 h-5 text-slate-400" />
            Écrans configurés ({associatedScreens.length})
          </h2>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-dark-900/40 border border-slate-800/50 rounded-xl" />
              ))}
            </div>
          ) : associatedScreens.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Aucun écran configuré pour le moment. Ouvrez l'interface TV sur un appareil.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Nom de l'écran</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4">Adresse IP</th>
                    <th className="py-3.5 px-4">Playlist active</th>
                    <th className="py-3.5 px-4">Dernière activité</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {associatedScreens.map((screen) => (
                    <tr key={screen.id} className="hover:bg-slate-900/25 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        <div className="flex items-center gap-2">
                          <Tv className="w-4 h-4 text-slate-500" />
                          {screen.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(screen.status)}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{screen.ip_address}</td>
                      <td className="py-3.5 px-4">
                        {screen.playlist_name ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                            <PlaySquare className="w-3.5 h-3.5 text-brand-500" />
                            {screen.playlist_name}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-medium">Aucune</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-medium">
                        {formatActivity(screen.last_activity)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/preview/${screen.id}`}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            title="Aperçu en direct"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleSync(screen.id)}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            title="Forcer Synchronisation"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenPlaylist(screen)}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            title="Affecter Playlist"
                          >
                            <PlaySquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenRename(screen)}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            title="Renommer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(screen.id, screen.name)}
                            className="p-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 rounded-lg transition-colors"
                            title="Supprimer / Dissocier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Association Modal */}
        {associationModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-dark-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 relative">
              <button
                onClick={() => setAssociationModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-semibold text-white mb-4">Associer le nouvel écran</h3>

              {formError && (
                <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAssociate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Code d'association détecté
                  </label>
                  <input
                    type="text"
                    disabled
                    value={associationModal.code}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-dark-950 border border-slate-850 font-bold text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Nom de l'écran
                  </label>
                  <input
                    type="text"
                    required
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                    placeholder="Ex: TV Hall d'entrée"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Affecter une Playlist (optionnel)
                  </label>
                  <select
                    value={formFields.playlistId}
                    onChange={(e) => setFormFields({ ...formFields, playlistId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                  >
                    <option value="">Aucune playlist - Rester en attente</option>
                    {playlists.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssociationModal(null)}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-855 rounded-lg text-xs font-semibold text-slate-400"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-xs font-semibold text-white shadow-md shadow-brand-500/20"
                  >
                    Associer l'écran
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rename Modal */}
        {renameModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-dark-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 relative">
              <button
                onClick={() => setRenameModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-semibold text-white mb-4">Renommer l'écran</h3>

              {formError && (
                <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {formError}
                </div>
              )}

              <form onSubmit={handleRename} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Nouveau nom de l'écran
                  </label>
                  <input
                    type="text"
                    required
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRenameModal(null)}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-855 rounded-lg text-xs font-semibold text-slate-400"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-xs font-semibold text-white"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Playlist Modal */}
        {playlistModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-dark-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 relative">
              <button
                onClick={() => setPlaylistModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-semibold text-white mb-4">
                Affecter une playlist à : {playlistModal.name}
              </h3>

              <form onSubmit={handleAssignPlaylist} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Sélectionner la playlist
                  </label>
                  <select
                    value={formFields.playlistId}
                    onChange={(e) => setFormFields({ ...formFields, playlistId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                  >
                    <option value="">Aucune playlist — Suspendre l'affichage</option>
                    {playlists.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPlaylistModal(null)}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-855 rounded-lg text-xs font-semibold text-slate-400"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-xs font-semibold text-white shadow-md shadow-brand-500/20"
                  >
                    Affecter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
