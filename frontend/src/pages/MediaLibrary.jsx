import React, { useState, useEffect, useRef } from 'react';
import Layout from '../layouts/Layout';
import { api } from '../services/api';
import {
  Upload,
  Search,
  Trash2,
  Edit2,
  Play,
  Film,
  FileImage,
  X,
  ArrowUpDown,
  FolderOpen
} from 'lucide-react';

export default function MediaLibrary() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Modals / Overlays state
  const [previewItem, setPreviewItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState('');
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef(null);

  const fetchMedia = async () => {
    try {
      const data = await api.get(`/media?search=${search}&sort=${sort}`);
      setMedia(data);
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMedia();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, sort]);

  const formatSize = (bytes) => {
    if (!bytes) return '0 Octets';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Drag & Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e) => {
    setUploadError('');
    if (e.target.files && e.target.files[0]) {
      await uploadFiles(e.target.files);
    }
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      await api.upload('/media/upload', formData);
      fetchMedia();
    } catch (err) {
      setUploadError(err.message || "Erreur lors du téléversement.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce média ? Cette action est irréversible.')) {
      return;
    }

    try {
      await api.delete(`/media/${id}`);
      setMedia(prev => prev.filter(item => item.id !== id));
      if (previewItem?.id === id) setPreviewItem(null);
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression.');
    }
  };

  const openRenameModal = (item) => {
    setEditingItem(item);
    setRenameValue(item.original_name.replace(/\.[^/.]+$/, '')); // omit extension
    setRenameError('');
  };

  const handleRename = async (e) => {
    e.preventDefault();
    setRenameError('');

    if (!renameValue.trim()) {
      setRenameError('Le nom ne peut pas être vide.');
      return;
    }

    try {
      await api.put(`/media/${editingItem.id}/rename`, { name: renameValue });
      fetchMedia();
      setEditingItem(null);
    } catch (err) {
      setRenameError(err.message || 'Erreur lors du renommage.');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Médiathèque</h1>
            <p className="text-slate-400 text-sm">Gérez et téléversez des images et des vidéos.</p>
          </div>
          <button
            onClick={() => fileInputRef.current.click()}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-semibold text-xs rounded-lg shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" />
            Uploader des fichiers
          </button>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>

        {/* Upload Zone / Drop Area */}
        <form
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className={`glass-card border-2 border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-brand-500/50 ${
            dragActive ? 'border-brand-500 bg-brand-500/5 scale-[1.01]' : ''
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-center mb-4 text-slate-400">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-200">
            Glissez-déposez des fichiers ici ou cliquez pour parcourir
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Formats acceptés : JPG, PNG, WEBP, MP4 — Max 100 Mo par fichier
          </p>

          {uploading && (
            <div className="mt-4 flex items-center gap-2.5 text-xs text-brand-400 font-semibold bg-brand-500/10 border border-brand-500/20 px-3.5 py-1.5 rounded-full">
              <span className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              Téléversement et compression en cours...
            </div>
          )}

          {uploadError && (
            <div className="mt-4 text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 rounded-lg">
              {uploadError}
            </div>
          )}
        </form>

        {/* Toolbar: Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Rechercher un média..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg glass-input"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Trier par :
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg glass-input pr-8"
            >
              <option value="newest">Plus récent</option>
              <option value="oldest">Plus ancien</option>
              <option value="name_asc">Nom A-Z</option>
              <option value="name_desc">Nom Z-A</option>
            </select>
          </div>
        </div>

        {/* Grid List */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-square bg-dark-900/40 border border-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : media.length === 0 ? (
          <div className="glass-card rounded-2xl py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center">
            <FolderOpen className="w-12 h-12 text-slate-700 mb-3" />
            Aucun média trouvé dans la bibliothèque.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {media.map((item) => (
              <div
                key={item.id}
                className="group relative bg-dark-900/50 hover:bg-dark-900 border border-slate-850 hover:border-slate-700 rounded-xl overflow-hidden shadow-sm transition-all duration-200"
              >
                {/* Media Preview Box */}
                <div
                  onClick={() => setPreviewItem(item)}
                  className="aspect-square bg-slate-950 flex items-center justify-center overflow-hidden cursor-pointer relative"
                >
                  {item.mime_type.startsWith('video/') ? (
                    <>
                      <video
                        src={item.filepath}
                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-brand-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 pl-0.5 fill-white" />
                        </div>
                      </div>
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-slate-300 flex items-center gap-1">
                        <Film className="w-2.5 h-2.5" />
                        Vidéo
                      </span>
                    </>
                  ) : (
                    <>
                      <img
                        src={item.filepath}
                        alt={item.original_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-bold text-slate-300 flex items-center gap-1">
                        <FileImage className="w-2.5 h-2.5" />
                        Image
                      </span>
                    </>
                  )}

                  {/* Actions overlay hover */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex justify-end gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameModal(item);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200"
                      title="Renommer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info block */}
                <div className="p-3">
                  <p className="text-xs font-semibold text-slate-200 truncate" title={item.original_name}>
                    {item.original_name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    {formatSize(item.size)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image/Video Lightbox Preview Modal */}
        {previewItem && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
            <button
              onClick={() => setPreviewItem(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="max-w-4xl w-full flex flex-col items-center">
              <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 max-h-[80vh] flex items-center justify-center p-1 w-full">
                {previewItem.mime_type.startsWith('video/') ? (
                  <video
                    src={previewItem.filepath}
                    controls
                    autoPlay
                    className="max-h-[75vh] w-auto max-w-full"
                  />
                ) : (
                  <img
                    src={previewItem.filepath}
                    alt={previewItem.original_name}
                    className="max-h-[75vh] w-auto max-w-full object-contain"
                  />
                )}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-slate-200">{previewItem.original_name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Format: {previewItem.mime_type} — Taille: {formatSize(previewItem.size)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rename Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-dark-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 relative">
              <button
                onClick={() => setEditingItem(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-semibold text-white mb-4">Renommer le média</h3>
              
              {renameError && (
                <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {renameError}
                </div>
              )}

              <form onSubmit={handleRename} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Nouveau nom
                  </label>
                  <input
                    type="text"
                    required
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg glass-input"
                    placeholder="Nom sans extension"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 border border-slate-800 hover:bg-slate-850 rounded-lg text-xs font-semibold text-slate-400"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg text-xs font-semibold text-white"
                  >
                    Renommer
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
