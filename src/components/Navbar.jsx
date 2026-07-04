import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SettingsModal from './SettingsModal';

export default function Navbar() {
  const location = useLocation();
  const locationKey = `${location.pathname}${location.search}`;
  const [drawerState, setDrawerState] = useState({});
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isOpen = drawerState[locationKey] ?? false;
  const setIsOpen = (open) => setDrawerState((prev) => ({ ...prev, [locationKey]: open }));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { name: 'Home', path: '/', icon: 'fa-house' },
    { name: 'All Tools', path: '/all-tools', icon: 'fa-grid-2' },
    { name: 'AI Writers', path: '/all-tools?cat=ai-generators', icon: 'fa-wand-magic-sparkles' },
    { name: 'Audio', path: '/all-tools?cat=audio', icon: 'fa-music' },
    { name: 'Video', path: '/all-tools?cat=video', icon: 'fa-video' },
    { name: 'GIF', path: '/all-tools?cat=gif-image', icon: 'fa-image' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/all-tools') return location.pathname === '/all-tools' && !location.search;
    return (location.pathname + location.search).startsWith(path);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'nav-glass shadow-lg shadow-black/30'
          : 'bg-transparent border-b border-white/0'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-white/10 shadow-lg shadow-sky-500/10 group-hover:shadow-sky-500/25 group-hover:border-sky-500/30 transition-all duration-300 group-hover:scale-105 overflow-hidden p-1.5">
              <img src="/favicon.png" alt="AudioBulk Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-sora font-bold text-xl tracking-tight text-white">
              Audio<span className="text-gradient">Bulk</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200 group ${
                  isActive(link.path)
                    ? 'text-white bg-white/10 border border-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {isActive(link.path) && link.name === 'AI Writers' && (
                  <span className="absolute inset-0 rounded-xl bg-violet-500/10 border border-violet-500/20"></span>
                )}
                <span className="relative flex items-center gap-1.5">
                  <i className={`fa-solid ${link.icon} text-xs ${
                    link.name === 'AI Writers' ? 'text-violet-400' : (isActive(link.path) ? 'text-sky-400' : 'text-slate-400 group-hover:text-sky-400')
                  }`}></i>
                  {link.name}
                </span>
              </Link>
            ))}
          </nav>

          {/* Search Trigger */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="group flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-400 hover:bg-slate-900/80 hover:border-white/20 hover:text-white transition-all shadow-inner"
            >
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-magnifying-glass text-slate-500 group-hover:text-sky-400 transition-colors"></i>
                <span className="font-manrope">Search 70 tools...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-white/5 border border-white/10 px-2 py-0.5 text-xs font-mono font-medium text-slate-400">
                <span className="text-[10px]">⌘</span>K
              </kbd>
            </button>
          </div>

          {/* Right CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
              title="API Settings"
            >
              <i className="fa-solid fa-gear"></i>
            </button>
            {location.pathname !== '/all-tools' && (
              <Link
                to="/all-tools"
                className="btn-primary-glow inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl animate-glow-pulse"
              >
                <i className="fa-solid fa-bolt text-xs"></i>
                Explore 70 Tools
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            aria-label="Toggle navigation"
            aria-expanded={isOpen}
          >
            <i className={`fa-solid text-base transition-all duration-300 ${isOpen ? 'fa-xmark rotate-90' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`lg:hidden grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="nav-glass border-t border-white/05 px-4 pt-3 pb-5 space-y-1">
          {links.map((link, idx) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(link.path)
                  ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <i className={`fa-solid ${link.icon} text-sm w-4 text-center ${
                link.name === 'AI Writers' ? 'text-violet-400' : 'text-sky-500'
              }`}></i>
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/05 space-y-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 border border-transparent transition-all duration-200"
            >
              <i className="fa-solid fa-gear text-sm w-4 text-center text-slate-400"></i>
              API Settings
            </button>
            <Link
              to="/all-tools"
              onClick={() => setIsOpen(false)}
              className="btn-primary-glow flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold rounded-xl"
            >
              <i className="fa-solid fa-bolt text-xs"></i>
              Explore 70 Tools
            </Link>
          </div>
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
