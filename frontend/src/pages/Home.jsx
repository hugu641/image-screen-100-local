import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tv, Play, Shield, Wifi, WifiOff, Zap, Users, ChevronDown, Check, Star,
  Monitor, ImageIcon, BarChart2, Globe, ArrowRight, Menu, X
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Helper: Animated counter on scroll
───────────────────────────────────────────── */
function AnimCounter({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(start);
    }, 16);
    return () => clearInterval(timer);
  }, [to]);
  return <>{val.toLocaleString('fr-FR')}{suffix}</>;
}

/* ─────────────────────────────────────────────
   Data
───────────────────────────────────────────── */
const FEATURES = [
  { icon: Tv, title: 'Gestion multi-écrans', desc: 'Pilotez autant d\'écrans que vous voulez depuis un seul tableau de bord, en temps réel.' },
  { icon: WifiOff, title: 'Mode hors-ligne', desc: 'Vos contenus continuent de s\'afficher même sans connexion Internet grâce au cache local.' },
  { icon: Zap, title: 'Mise à jour instantanée', desc: 'Changez de playlist ou de média et l\'écran se met à jour en quelques secondes.' },
  { icon: Shield, title: 'Sécurisé', desc: 'Accès admin protégé par authentification, communication chiffrée entre serveur et écrans.' },
  { icon: BarChart2, title: 'Planification', desc: 'Programmez vos diffusions par heure, par jour ou par événement avec une simplicité déconcertante.' },
  { icon: Globe, title: 'Accessible partout', desc: 'Administrez vos écrans depuis n\'importe quel navigateur, sur réseau local ou Internet.' },
];

const PLANS = [
  {
    name: 'Starter',
    price: null,
    priceLabel: 'Gratuit',
    period: '3 jours d\'essai',
    badge: 'Essai gratuit',
    color: 'border-emerald-600/60',
    badgeStyle: 'bg-emerald-500 text-white',
    highlight: false,
    cta: 'Créer un compte gratuit',
    ctaStyle: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    trialNote: 'Puis 9€/mois — Annulez quand vous voulez',
    features: [
      { text: '1 écran connecté', ok: true },
      { text: 'Médiathèque 500 Mo', ok: true },
      { text: 'Playlists illimitées', ok: true },
      { text: 'Mode hors-ligne', ok: true },
      { text: 'Support communauté', ok: true },
      { text: 'Multi-utilisateurs', ok: false },
      { text: 'Analytics avancés', ok: false },
    ],
  },
  {
    name: 'Pro',
    price: '29',
    priceLabel: null,
    period: '/mois',
    badge: 'Le plus populaire',
    color: 'border-brand-500',
    badgeStyle: 'bg-brand-500 text-white',
    highlight: true,
    cta: 'Essayer 14 jours gratuits',
    ctaStyle: null,
    trialNote: null,
    features: [
      { text: '10 écrans connectés', ok: true },
      { text: 'Médiathèque 10 Go', ok: true },
      { text: 'Playlists illimitées', ok: true },
      { text: 'Mode hors-ligne', ok: true },
      { text: 'Support prioritaire', ok: true },
      { text: 'Multi-utilisateurs (3)', ok: true },
      { text: 'Analytics avancés', ok: false },
    ],
  },
  {
    name: 'Enterprise',
    price: '99',
    priceLabel: null,
    period: '/mois',
    badge: 'Tout illimité',
    color: 'border-violet-500',
    badgeStyle: 'bg-violet-500 text-white',
    highlight: false,
    cta: 'Nous contacter',
    ctaStyle: null,
    trialNote: null,
    features: [
      { text: 'Écrans illimités', ok: true },
      { text: 'Médiathèque illimitée', ok: true },
      { text: 'Playlists illimitées', ok: true },
      { text: 'Mode hors-ligne', ok: true },
      { text: 'Support dédié 24/7', ok: true },
      { text: 'Multi-utilisateurs illimité', ok: true },
      { text: 'Analytics avancés', ok: true },
    ],
  },
];

const FAQS = [
  { q: 'Comment connecter mon premier écran ?', a: 'Ouvrez l\'URL du lecteur TV sur votre écran (ex: http://votre-ip:5000/tv). Un code d\'appairage s\'affiche. Saisissez-le dans le panel admin pour associer l\'écran.' },
  { q: 'Cela fonctionne-t-il sans Internet ?', a: 'Oui. Les médias sont mis en cache localement sur l\'écran. En cas de coupure réseau, la diffusion continue normalement.' },
  { q: 'Quels formats de médias sont supportés ?', a: 'Images (JPG, PNG, GIF, WebP, SVG) et vidéos (MP4, WebM, MOV). Le transcodage automatique est disponible sur le plan Enterprise.' },
  { q: 'Puis-je changer de plan à tout moment ?', a: 'Absolument. Vous pouvez monter ou descendre de plan à n\'importe quel moment depuis votre espace client.' },
  { q: 'Faut-il une carte bancaire pour l\'essai ?', a: 'Non. L\'essai gratuit de 3 jours est accessible en créant simplement un compte. Aucune carte bancaire requise. Vous choisissez votre plan uniquement si vous souhaitez continuer.' },
];

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/90 backdrop-blur-lg shadow-lg shadow-black/20 border-b border-slate-800/60' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
            <Monitor className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">ImageScreen</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Se connecter</Link>
          <Link to="/login?mode=register" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-brand-500/20">
            Essai gratuit
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-400 hover:text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-6 py-4 space-y-4 text-sm font-medium">
          <a href="#features" onClick={() => setOpen(false)} className="block text-slate-400 hover:text-white">Fonctionnalités</a>
          <a href="#pricing" onClick={() => setOpen(false)} className="block text-slate-400 hover:text-white">Tarifs</a>
          <a href="#faq" onClick={() => setOpen(false)} className="block text-slate-400 hover:text-white">FAQ</a>
          <Link to="/login" className="block pt-2 border-t border-slate-800 text-slate-300 hover:text-white">Se connecter</Link>
          <Link to="/login?mode=register" className="block px-4 py-2 bg-brand-500 text-white font-semibold rounded-lg text-center">Essai gratuit</Link>
        </div>
      )}
    </nav>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-900/40 transition-colors"
      >
        <span className="font-semibold text-slate-200 text-sm">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-slate-800/50">
          <p className="pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Page
───────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-6 flex flex-col items-center text-center overflow-hidden">
        {/* Background glow orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-violet-600/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Nouveau — Mode hors-ligne garanti
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            Vos écrans publicitaires,{' '}
            <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              pilotés à distance
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            ImageScreen vous permet de gérer, planifier et diffuser vos contenus sur n'importe quel écran de votre magasin — en temps réel, même hors connexion.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login?mode=register"
              className="group flex items-center gap-2 px-6 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm transition-all shadow-xl shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5"
            >
              Créer un compte — 3 jours gratuits
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-all"
            >
              <Play className="w-4 h-4" />
              Voir les fonctionnalités
            </a>
          </div>
        </div>

        {/* Hero preview card */}
        <div className="relative mt-20 w-full max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass-card border border-slate-700/60 rounded-2xl p-4 overflow-hidden shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/70" />
              <span className="w-3 h-3 rounded-full bg-amber-500/70" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
              <span className="flex-1 mx-2 h-5 bg-slate-800/80 rounded text-[10px] text-slate-500 flex items-center px-2">localhost:5000/admin</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {/* Mock sidebar */}
              <div className="col-span-1 bg-slate-900/60 rounded-xl p-3 space-y-2">
                {['Dashboard', 'Écrans', 'Playlists', 'Médiathèque', 'Paramètres'].map(label => (
                  <div key={label} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium ${label === 'Écrans' ? 'bg-brand-500/10 text-brand-400' : 'text-slate-500'}`}>
                    <div className="w-3 h-3 rounded bg-current opacity-40" />
                    {label}
                  </div>
                ))}
              </div>
              {/* Mock content */}
              <div className="col-span-2 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {[['3', 'Écrans actifs', 'emerald'], ['12', 'Médias', 'violet'], ['5', 'Playlists', 'pink']].map(([n, l, c]) => (
                    <div key={l} className="bg-slate-900/60 rounded-xl p-3 text-center">
                      <p className={`text-xl font-bold text-${c}-400`}>{n}</p>
                      <p className="text-[10px] text-slate-500">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-900/60 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Écrans</p>
                  {['TV Hall d\'entrée', 'TV Caisse', 'Vitrine'].map((name, i) => (
                    <div key={name} className="flex items-center justify-between py-1.5 border-b border-slate-800/60 last:border-0">
                      <div className="flex items-center gap-2">
                        <Tv className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-300">{name}</span>
                      </div>
                      <span className={`text-[10px] font-bold ${i === 2 ? 'text-amber-400' : 'text-emerald-400'}`}>{i === 2 ? 'Hors ligne' : 'Connecté'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-6 border-y border-slate-800/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { n: 500, suffix: '+', label: 'Écrans déployés' },
            { n: 99, suffix: '.9%', label: 'Temps de disponibilité' },
            { n: 120, suffix: '+', label: 'Magasins clients' },
            { n: 2, suffix: 's', label: 'Mise à jour en temps réel' },
          ].map(({ n, suffix, label }) => (
            <div key={label}>
              <p className="text-4xl font-extrabold text-white mb-1">
                <AnimCounter to={n} suffix={suffix} />
              </p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 font-semibold text-sm uppercase tracking-wider mb-3">Fonctionnalités</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tout ce qu'il vous faut, rien de superflu</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Un outil puissant pensé pour les commerçants et intégrateurs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all hover:-translate-y-1 duration-200">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-violet-400 font-semibold text-sm uppercase tracking-wider mb-3">Comment ça marche</p>
            <h2 className="text-3xl md:text-4xl font-bold">En 3 étapes simples</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* connector */}
            <div className="hidden md:block absolute top-8 left-[33%] right-[33%] h-px bg-gradient-to-r from-brand-500/50 to-violet-500/50" />
            {[
              { step: '01', icon: Monitor, title: 'Installez le lecteur', desc: 'Ouvrez l\'URL /tv sur votre écran. Un code d\'appairage s\'affiche automatiquement.' },
              { step: '02', icon: Wifi, title: 'Associez l\'écran', desc: 'Dans le panel admin, saisissez le code d\'appairage ou scannez le QR code affiché.' },
              { step: '03', icon: ImageIcon, title: 'Diffusez vos contenus', desc: 'Créez une playlist, ajoutez vos médias, affectez-la à l\'écran. C\'est tout !' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="flex flex-col items-center text-center relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 border border-brand-500/30 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-brand-400" />
                </div>
                <span className="text-xs font-bold text-slate-600 mb-2">{step}</span>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-pink-400 font-semibold text-sm uppercase tracking-wider mb-3">Tarifs</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Un plan pour chaque besoin</h2>
            <p className="text-slate-400 max-w-lg mx-auto">Commencez gratuitement — sans carte bancaire. Créez un compte et testez pendant 3 jours. Choisissez votre plan seulement si vous êtes convaincu.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative glass-card rounded-2xl p-6 border-2 ${plan.color} flex flex-col ${plan.highlight ? 'shadow-2xl shadow-brand-500/20' : ''}`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap ${plan.badgeStyle || (plan.highlight ? 'bg-brand-500 text-white' : 'bg-violet-500 text-white')}`}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    {plan.priceLabel ? (
                      <span className="text-4xl font-extrabold text-emerald-400">{plan.priceLabel}</span>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold text-white">{plan.price}€</span>
                        <span className="text-slate-500 text-sm">{plan.period}</span>
                      </>
                    )}
                  </div>
                  {plan.trialNote && (
                    <p className="text-xs text-slate-500 mt-1.5">{plan.trialNote}</p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5 text-sm">
                      <Check className={`w-4 h-4 shrink-0 ${f.ok ? 'text-emerald-400' : 'text-slate-700'}`} />
                      <span className={f.ok ? 'text-slate-300' : 'text-slate-600'}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/login?mode=register"
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    plan.ctaStyle
                      ? plan.ctaStyle
                      : plan.highlight
                        ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-600 mt-8">
            Tous les prix sont HT • TVA applicable selon la législation en vigueur • Facturation mensuelle ou annuelle (−20%)
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 font-semibold text-sm uppercase tracking-wider mb-3">Témoignages</p>
            <h2 className="text-3xl md:text-4xl font-bold">Ce que disent nos clients</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Marie D.', role: 'Gérante, Boulangerie Dupont', text: 'En 10 minutes, mon écran vitrine était configuré et diffusait mes promotions du jour. Incroyable simplicité.' },
              { name: 'Julien P.', role: 'Responsable IT, Groupe GrandFresh', text: 'On gère 47 écrans sur 8 magasins depuis un seul dashboard. Le mode hors-ligne nous a sauvé lors d\'une panne FAI.' },
              { name: 'Sophie L.', role: 'Directrice, Studio Forme+', text: 'Le QR code pour associer un nouvel écran, c\'est vraiment malin. Plus besoin d\'accès réseau local pour la mise en service.' },
            ].map(({ name, role, text }) => (
              <div key={name} className="glass-card border border-slate-800 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">"{text}"</p>
                <div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-slate-500">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Questions fréquentes</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-600/20 via-violet-600/20 to-pink-600/20 rounded-3xl blur-xl pointer-events-none" />
          <div className="relative glass-card border border-slate-700/60 rounded-3xl p-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Prêt à moderniser votre affichage ?</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">Rejoignez des centaines de commerçants qui font confiance à ImageScreen. Testez gratuitement pendant 3 jours.</p>
            <Link
              to="/login?mode=register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-500 to-violet-500 hover:from-brand-600 hover:to-violet-600 text-white font-bold rounded-xl text-sm transition-all shadow-2xl shadow-brand-500/30 hover:-translate-y-0.5"
            >
              Créer un compte — C'est gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-950 border-t border-slate-800/60 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center">
                  <Monitor className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-white">ImageScreen</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Solution de diffusion d'affichage dynamique pour commerces et entreprises.</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Produit</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Connexion</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Support</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="mailto:contact@imagescreen.fr" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Légal</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">CGU</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800/60 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <p>© {new Date().getFullYear()} ImageScreen. Tous droits réservés.</p>
            <p>Fait avec ❤️ pour les commerçants</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
