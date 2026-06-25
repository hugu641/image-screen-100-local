import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../layouts/Layout';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import {
  Key, Plus, Trash2, Ban, Copy, Check, ChevronDown, ChevronUp,
  Users, Hash, BarChart2, RefreshCw, Shield, Calendar, Infinity,
  AlertTriangle, CheckCircle, Clock, X
} from 'lucide-react';

/* ── Helpers ──────────────────────────────────────────────────────────── */
const PLAN_OPTIONS = [
  { value: 'trial',      label: 'Essai gratuit',  color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20' },
  { value: 'starter',   label: 'Starter',         color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { value: 'pro',       label: 'Pro',             color: 'text-brand-400',   bg: 'bg-brand-500/10 border-brand-500/20' },
  { value: 'enterprise',label: 'Enterprise',      color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
];

function getPlan(value) {
  return PLAN_OPTIONS.find(p => p.value === value) || PLAN_OPTIONS[0];
}

function PlanBadge({ plan }) {
  const p = getPlan(plan);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${p.bg} ${p.color}`}>
      {p.label}
    </span>
  );
}

function StatusDot({ isActive, expiresAt, usesCount, maxUses }) {
  const expired = expiresAt && new Date(expiresAt) < new Date();
  const exhausted = usesCount >= maxUses;

  if (!isActive) return <span className="flex items-center gap-1 text-rose-400 text-xs font-medium"><Ban className="w-3 h-3" /> Révoquée</span>;
  if (expired) return <span className="flex items-center gap-1 text-amber-400 text-xs font-medium"><Clock className="w-3 h-3" /> Expirée</span>;
  if (exhausted) return <span className="flex items-center gap-1 text-slate-400 text-xs font-medium"><Check className="w-3 h-3" /> Épuisée</span>;
  return <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium"><CheckCircle className="w-3 h-3" /> Active</span>;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      title="Copier la clé"
      className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

/* ── Create Key Modal ─────────────────────────────────────────────────── */
function CreateKeyModal({ onClose, onCreate }) {
  const [plan, setPlan] = useState('starter');
  const [durationDays, setDurationDays] = useState('');
  const [maxUses, setMaxUses] = useState('1');
  const [note, setNote] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onCreate({
        plan,
        duration_days: durationDays ? parseInt(durationDays) : null,
        max_uses: parseInt(maxUses) || 1,
        note: note || null,
        expires_at: expiresAt || null,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card border border-slate-700 rounded-2xl p-6 w-full max-w-md z-10 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Key className="w-4 h-4 text-brand-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Nouvelle clé</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Plan */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Plan</label>
            <div className="grid grid-cols-2 gap-2">
              {PLAN_OPTIONS.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlan(p.value)}
                  className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-all ${
                    plan === p.value
                      ? `${p.bg} ${p.color} border-current`
                      : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Durée (jours) — vide = illimitée
            </label>
            <input
              type="number"
              min="1"
              placeholder="Ex: 30, 365 (vide = ∞)"
              value={durationDays}
              onChange={e => setDurationDays(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
            />
          </div>

          {/* Max uses */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Nombre max d'utilisations
            </label>
            <input
              type="number"
              min="1"
              required
              value={maxUses}
              onChange={e => setMaxUses(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
            />
          </div>

          {/* Expires at */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Expiration de la clé (optionnel)
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Note interne (optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Offert à Jean Dupont"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg glass-input text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-sm font-semibold transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Key className="w-4 h-4" /> Générer</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Key Row ──────────────────────────────────────────────────────────── */
function KeyRow({ k, onRevoke, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${k.is_active ? 'border-slate-800' : 'border-slate-800/40 opacity-60'}`}>
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/30">
        {/* Key string */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <code className="text-xs font-mono text-brand-300 truncate">{k.key}</code>
          <CopyButton text={k.key} />
        </div>

        {/* Plan badge */}
        <PlanBadge plan={k.plan} />

        {/* Status */}
        <div className="hidden sm:block">
          <StatusDot isActive={k.is_active} expiresAt={k.expires_at} usesCount={k.uses_count} maxUses={k.max_uses} />
        </div>

        {/* Uses */}
        <span className="text-xs text-slate-500 hidden md:block whitespace-nowrap">
          {k.uses_count}/{k.max_uses} utilisations
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {k.is_active && (
            <button
              onClick={() => onRevoke(k.id)}
              title="Révoquer"
              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
            </button>
          )}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={() => onDelete(k.id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-bold">Confirmer</button>
              <button onClick={() => setConfirmDelete(false)} className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Supprimer"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-800/50 px-4 py-3 bg-slate-900/10 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Durée</p>
            <p className="text-xs text-slate-300 flex items-center gap-1">
              {k.duration_days ? <><Calendar className="w-3 h-3" />{k.duration_days} jours</> : <><Infinity className="w-3 h-3 text-slate-500" /> Illimitée</>}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Expiration clé</p>
            <p className="text-xs text-slate-300">
              {k.expires_at ? new Date(k.expires_at).toLocaleDateString('fr-FR') : '—'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Créée le</p>
            <p className="text-xs text-slate-300">{new Date(k.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Note</p>
            <p className="text-xs text-slate-300">{k.note || '—'}</p>
          </div>
          {k.redemptions && k.redemptions.length > 0 && (
            <div className="col-span-full mt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-2">Utilisateurs ayant activé cette clé</p>
              <div className="space-y-1">
                {k.redemptions.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-medium text-slate-300">{r.name || r.email}</span>
                    <span className="text-slate-600">{r.email}</span>
                    <span className="ml-auto text-slate-600">{new Date(r.redeemed_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────── */
export default function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const [keys, setKeys] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, revoked
  const [planFilter, setPlanFilter] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [keysRes, statsRes] = await Promise.all([
        api.get('/admin/keys'),
        api.get('/admin/stats'),
      ]);
      setKeys(keysRes.keys || []);
      setStats(statsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (data) => {
    const res = await api.post('/admin/keys', data);
    showToast(`Clé "${res.key.key}" créée !`);
    loadData();
  };

  const handleRevoke = async (id) => {
    await api.patch(`/admin/keys/${id}/revoke`);
    showToast('Clé révoquée.', 'warning');
    loadData();
  };

  const handleDelete = async (id) => {
    await api.delete(`/admin/keys/${id}`);
    showToast('Clé supprimée.', 'warning');
    loadData();
  };

  // Filtered keys
  const filteredKeys = keys.filter(k => {
    const statusMatch =
      filter === 'all' ? true :
      filter === 'active' ? k.is_active === 1 :
      filter === 'revoked' ? k.is_active === 0 : true;
    const planMatch = planFilter === 'all' || k.plan === planFilter;
    return statusMatch && planMatch;
  });

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Shield className="w-12 h-12 text-slate-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Accès refusé</h2>
          <p className="text-slate-400">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300' : 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-brand-400" />
            <h1 className="text-2xl font-bold text-white">Panel Admin</h1>
            <span className="px-2 py-0.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold rounded-full">
              {user?.name || user?.email}
            </span>
          </div>
          <p className="text-slate-400 text-sm">Gestion des clés d'abonnement et des utilisateurs</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            Nouvelle clé
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Clés créées', value: stats.totalKeys, icon: Key, color: 'text-brand-400', bg: 'bg-brand-500/10 border-brand-500/20' },
            { label: 'Clés actives', value: stats.activeKeys, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Activations', value: stats.totalRedemptions, icon: Hash, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
            { label: 'Utilisateurs', value: stats.totalUsers, icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`glass-card border rounded-xl p-4 ${bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
              </div>
              <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Plan breakdown */}
      {stats?.planBreakdown?.length > 0 && (
        <div className="glass-card border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <BarChart2 className="w-3.5 h-3.5" /> Répartition par plan :
          </div>
          {stats.planBreakdown.map(({ plan, count }) => (
            <div key={plan} className="flex items-center gap-1.5">
              <PlanBadge plan={plan} />
              <span className="text-xs text-slate-400 font-bold">×{count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex rounded-lg border border-slate-800 overflow-hidden text-xs font-semibold">
          {[['all', 'Toutes'], ['active', 'Actives'], ['revoked', 'Révoquées']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 transition-colors ${filter === val ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-slate-800 overflow-hidden text-xs font-semibold">
          <button onClick={() => setPlanFilter('all')} className={`px-3 py-1.5 transition-colors ${planFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
            Tous plans
          </button>
          {PLAN_OPTIONS.map(p => (
            <button
              key={p.value}
              onClick={() => setPlanFilter(p.value)}
              className={`px-3 py-1.5 transition-colors ${planFilter === p.value ? `bg-slate-700 ${p.color}` : 'text-slate-400 hover:text-white'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Keys list */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Key className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Aucune clé trouvée</p>
            <p className="text-xs mt-1">Créez votre première clé d'abonnement.</p>
          </div>
        ) : (
          filteredKeys.map(k => (
            <KeyRow key={k.id} k={k} onRevoke={handleRevoke} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* Recent users */}
      {stats?.recentUsers?.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Derniers utilisateurs inscrits</h2>
          </div>
          <div className="glass-card border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/40">
                <tr>
                  <th className="text-left px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wider">Utilisateur</th>
                  <th className="text-left px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wider">Plan</th>
                  <th className="text-left px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wider hidden md:table-cell">Inscrit le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {stats.recentUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-200">{u.name || '—'}</p>
                      <p className="text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {u.plan ? <PlanBadge plan={u.plan} /> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${
                        u.subscription_status === 'active' ? 'text-emerald-400' :
                        u.subscription_status === 'trialing' ? 'text-brand-400' : 'text-slate-500'
                      }`}>
                        {u.subscription_status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                      {new Date(u.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {showCreate && (
        <CreateKeyModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </Layout>
  );
}
