import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toolCategories, toolsList } from '../data/tools';
import useRecentTools from '../hooks/useRecentTools';
import SeoMeta from '../components/SeoMeta';

/* ── Animated counter hook ── */
function useCounter(target, duration = 1800, started = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!started) return;
    let startTime = null;
    let reqId = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        reqId = requestAnimationFrame(step);
      }
    };
    reqId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(reqId);
  }, [target, duration, started]);
  return count;
}

/* ── Intersection observer hook ── */
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ── Luxury Spotlight Card Hook ── */
function SpotlightCard({ children, className = '', as: Component = 'div', ...props }) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <Component
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 z-10"
        style={{
          opacity,
          background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />
      <div className="relative z-20 h-full w-full">
        {children}
      </div>
    </Component>
  );
}

const STATS = [
  { value: 70, label: 'Tools Built', suffix: '+', icon: 'fa-screwdriver-wrench' },
  { value: 100, label: 'Free Forever', suffix: '%', icon: 'fa-gift' },
  { value: 0, label: 'Uploads Required', suffix: '', icon: 'fa-cloud-slash' },
  { value: 30, label: 'AI Generators', suffix: '+', icon: 'fa-wand-magic-sparkles' },
];

const FEATURES = [
  {
    icon: 'fa-shield-halved',
    color: 'from-sky-400 to-blue-600',
    glow: 'rgba(14,165,233,0.25)',
    iconColor: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    title: '100% Private',
    desc: 'Files never leave your device. Zero uploads, zero servers, zero tracking. Everything runs in your browser.',
  },
  {
    icon: 'fa-bolt',
    color: 'from-emerald-400 to-teal-600',
    glow: 'rgba(16,185,129,0.25)',
    iconColor: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    title: 'Blazing Fast',
    desc: 'FFmpeg WebAssembly runs at near-native speed directly in your browser. No queue, no wait.',
  },
  {
    icon: 'fa-wand-magic-sparkles',
    color: 'from-violet-400 to-purple-600',
    glow: 'rgba(139,92,246,0.25)',
    iconColor: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    title: 'AI-Powered',
    desc: '30 AI writing tools powered by DeepSeek via OpenRouter. Story generators, plot makers, and more.',
  },
];

const CATEGORY_CHIPS = [
  { label: 'Audio Tools', icon: 'fa-music', catId: 'audio', color: 'text-sky-400' },
  { label: 'Video Tools', icon: 'fa-video', catId: 'video', color: 'text-violet-400' },
  { label: 'GIF & Image', icon: 'fa-image', catId: 'gif-image', color: 'text-pink-400' },
  { label: 'AI Generators', icon: 'fa-wand-magic-sparkles', catId: 'ai-generators', color: 'text-purple-400' },
  { label: 'Marketing', icon: 'fa-chart-line', catId: 'marketing', color: 'text-amber-400' },
  { label: 'Utilities', icon: 'fa-screwdriver-wrench', catId: 'utilities', color: 'text-slate-400' },
];

const ICON_CLASSES = {
  audio: 'icon-audio',
  video: 'icon-video',
  'gif-image': 'icon-gif',
  'ai-generators': 'icon-ai',
  marketing: 'icon-marketing',
  utilities: 'icon-utilities',
};

export default function Home() {
  const [heroRef, heroInView] = useInView(0.1);
  const [statsRef, statsInView] = useInView(0.1);
  const [featRef, featInView] = useInView(0.1);
  const [catRef, catInView] = useInView(0.1);
  
  const { recentTools } = useRecentTools();

  return (
    <div className="relative overflow-hidden bg-mesh-dark min-h-screen">
      <SeoMeta 
        title="Home" 
        description="Your ultimate browser-based toolkit. 70 free tools for audio, video, GIF, AI writing & more. 100% private and runs locally." 
      />

      {/* ══ HERO SECTION ══ */}
      <section
        ref={heroRef}
        className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center"
      >

        {/* Badge */}
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border border-white/5 bg-white/[0.02] shadow-glass-inset transition-all duration-700 ${
          heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <span className="flex h-1.5 w-1.5 rounded-full bg-slate-300"></span>
          <span className="font-manrope text-[10px] font-bold tracking-widest uppercase text-slate-300">
            100% Free · 100% Private · Runs in Browser
          </span>
        </div>

        {/* Headline */}
        <h1
          className={`text-display text-white mb-6 transition-all duration-700 delay-100 ${
            heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          Your Ultimate<br />
          <span className="text-gradient">Browser-Based</span> Toolkit
        </h1>

        {/* Subheadline */}
        <p className={`text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-10 transition-all duration-700 delay-200 ${
          heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          70 powerful tools for audio, video, GIF, AI writing & more — all free, all private, runs 100% in your browser.
        </p>

        {/* Search Bar / Command Center */}
        <div className="max-w-md mx-auto mb-10 transition-all duration-700 delay-250 animate-fade-in relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur"></div>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-command-palette'));
            }}
            className="relative w-full flex items-center justify-between gap-3 rounded-2xl px-5 py-4 bg-[#080d1a] border border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-glass-inset"
          >
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-magnifying-glass text-slate-500"></i>
              <span className="text-sm font-medium">Search tools...</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded bg-white/5 border border-white/5 px-2 font-mono text-[10px] font-medium text-slate-400 shadow-glass-inset">
              <span>Ctrl K</span>
            </kbd>
          </button>
        </div>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-5 mb-16 transition-all duration-700 delay-300 ${
          heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          {/* Luxury Metallic Sheen Button */}
          <Link
            to="/all-tools"
            className="group relative overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.08] px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/[0.08] hover:border-white/[0.15] shadow-glass-inset"
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[200%] h-[150%] bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
            </div>
            <span className="relative z-10 flex items-center gap-2.5">
              <i className="fa-solid fa-wand-magic-sparkles text-sm text-slate-400 group-hover:text-white transition-colors"></i>
              Explore 70 Tools
              <i className="fa-solid fa-arrow-right text-sm opacity-60 group-hover:translate-x-1 transition-transform"></i>
            </span>
          </Link>
          
          <Link
            to="/all-tools?cat=ai-generators"
            className="inline-flex items-center gap-2.5 px-8 py-4 text-base font-semibold rounded-xl border border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.02] transition-all duration-300"
          >
            <i className="fa-solid fa-robot text-sm opacity-50"></i>
            AI Writing Tools
          </Link>
        </div>

        {/* Category Chips scrolling banner */}
        <div className={`relative overflow-hidden transition-all duration-700 delay-400 ${
          heroInView ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex gap-4 animate-scroll-banner">
            {[...CATEGORY_CHIPS, ...CATEGORY_CHIPS].map((chip, idx) => (
              <Link
                key={idx}
                to={`/all-tools?cat=${chip.catId}`}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-sm font-medium text-slate-400 hover:text-slate-200 transition-all duration-300 shadow-glass-inset"
              >
                <i className={`fa-solid ${chip.icon} text-xs opacity-50`}></i>
                {chip.label}
              </Link>
            ))}
          </div>
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #030712, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #030712, transparent)' }} />
        </div>
      </section>

      {/* ══ STATS SECTION ══ */}
      <section ref={statsRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat, idx) => (
            <StatCard key={stat.label} stat={stat} started={statsInView} delay={idx * 100} />
          ))}
        </div>
      </section>

      {/* ══ RECENTLY USED TOOLS ══ */}
      {recentTools.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="font-sora font-bold text-white text-xl mb-4 flex items-center gap-2">
            <i className="fa-solid fa-clock-rotate-left text-sky-400"></i>
            Recently Used
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentTools.map((tool, idx) => {
              // Find the matching category to get the correct icon class color
              const cat = toolCategories.find(c => c.title === tool.category);
              const iconClass = cat ? ICON_CLASSES[cat.id] : 'icon-utilities';
              
              return (
                <SpotlightCard
                  key={tool.path}
                  as={Link}
                  to={tool.path}
                  className="glass-card glass-card-hover rounded-xl p-4 flex flex-col items-center text-center gap-3 transition-all"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClass}`}>
                    <i className={`fa-solid ${tool.icon} text-lg`}></i>
                  </div>
                  <div>
                    <h4 className="font-sora font-semibold text-white text-xs leading-tight line-clamp-1">{tool.name}</h4>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-1 line-clamp-1">{tool.category}</p>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </section>
      )}

      {/* ══ CATEGORY CARDS ══ */}
      <section ref={catRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className={`text-center mb-12 transition-all duration-700 ${
          catInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="font-sora font-bold text-white text-3xl mb-3">
            Everything You Need,{' '}
            <span className="text-gradient">One Platform</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            Six powerful categories, 70 tools, zero compromises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {toolCategories.map((cat, idx) => {
            const count = toolsList.filter(t => t.categoryId === cat.id).length;
            // Bento logic: Make the first two cards span 2 columns on large screens
            const spanClass = (idx === 0 || idx === 1) ? 'lg:col-span-2' : 'lg:col-span-1';
            
            return (
              <CategoryCard
                key={cat.id}
                cat={cat}
                count={count}
                inView={catInView}
                delay={idx * 80}
                className={spanClass}
              />
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/all-tools"
            className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 font-manrope text-sm font-semibold tracking-wide uppercase transition-colors"
          >
            View All 70 Tools
            <i className="fa-solid fa-arrow-right text-xs"></i>
          </Link>
        </div>
      </section>

      {/* ══ FEATURES SECTION ══ */}
      <section ref={featRef} className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-28">
        <div className={`text-center mb-14 transition-all duration-700 ${
          featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <span className="font-manrope text-xs font-semibold tracking-wider uppercase text-sky-400 mb-3 block">Why Creators Love AudioBulk</span>
          <h2 className="font-sora font-bold text-white text-3xl">
            Built for Privacy,<br />
            <span className="text-gradient">Speed & Intelligence</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feat, idx) => (
            <SpotlightCard
              key={feat.title}
              className={`glass-card glass-card-hover rounded-2xl p-8 transition-all duration-700 shadow-glass-inset ${
                featInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${idx * 120}ms` }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-6 shadow-glass-inset group-hover:scale-110 transition-transform duration-500"
              >
                <i className={`fa-solid ${feat.icon} text-lg text-slate-300 opacity-80`}></i>
              </div>
              <h3 className="font-sora font-semibold text-white text-lg mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-32">
        <div
          className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center shadow-glass-inset"
          style={{
            background: 'rgba(11, 20, 38, 0.40)',
            border: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Deep Space Glow */}
          <div className="absolute inset-0 opacity-40 pointer-events-none"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />

          <div className="relative">
            <h2 className="font-sora font-bold text-white text-3xl md:text-4xl mb-4">
              Start Processing{' '}
              <span className="text-gradient">Right Now</span>
            </h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-8 text-sm leading-relaxed">
              No sign-up required. No credit card. No limits. Just open a tool and start.
            </p>
            <Link
              to="/all-tools"
              className="group relative overflow-hidden rounded-xl bg-white text-black px-10 py-4 text-base font-semibold shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all duration-300 inline-flex items-center gap-3"
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[150%] h-[150%] bg-gradient-to-r from-transparent via-black/10 to-transparent rotate-45 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
              </div>
              <span className="relative z-10 flex items-center gap-3">
                <i className="fa-solid fa-bolt text-sm"></i>
                Launch Free Tools
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Sub-components ── */
function StatCard({ stat, started, delay }) {
  const count = useCounter(stat.value, 1600, started);
  return (
    <SpotlightCard
      className={`glass-card rounded-2xl p-6 text-center transition-all duration-700 ${
        started ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="stat-counter text-4xl md:text-5xl mb-2 tracking-tighter">
        {count}{stat.suffix}
      </div>
      <div className="font-manrope text-xs font-semibold uppercase tracking-wider text-slate-500">
        {stat.label}
      </div>
    </SpotlightCard>
  );
}

function CategoryCard({ cat, count, inView, delay, className = '' }) {
  return (
    <SpotlightCard
      as={Link}
      to={`/all-tools?cat=${cat.id}`}
      className={`glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between group transition-all duration-600 ${className} ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-8">
        <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] group-hover:scale-110 transition-transform duration-500`}>
          <i className={`fa-solid ${cat.icon} text-lg text-slate-300 opacity-70 group-hover:opacity-100 transition-opacity`}></i>
        </div>
        <span className="flex-shrink-0 text-[10px] font-manrope font-bold text-slate-500 bg-white/5 border border-white/5 px-2.5 py-1 rounded-md transition-colors group-hover:text-slate-300">
          {count} TOOLS
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-sora font-semibold text-white text-base group-hover:text-white transition-colors mb-2">
          {cat.title}
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{cat.description}</p>
        <div className="mt-4 flex items-center gap-1 text-slate-500 text-xs font-semibold group-hover:text-white transition-colors">
          Explore <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
        </div>
      </div>
    </SpotlightCard>
  );
}
