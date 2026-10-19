// Light header + footer for redesigned pages. Old pages keep the dark Layout until the redesign is approved.
import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { Toaster } from 'sonner';
import { Menu, X, LoaderCircle, Search, Settings } from 'lucide-react';
import { toolsList, toolCategories } from '../data/tools';
import useRecentTools from '../hooks/useRecentTools';
import SearchDialog from './SearchDialog';
import SettingsDialog from './SettingsDialog';

const openSearch = () => window.dispatchEvent(new Event('open-command-palette'));
const openSettings = () => window.dispatchEvent(new Event('open-ai-settings'));

const NAV = [
  { label: 'Audio', to: '/all-tools?cat=audio' },
  { label: 'Video', to: '/all-tools?cat=video' },
  { label: 'GIF & images', to: '/all-tools?cat=gif-image' },
  { label: 'AI writing', to: '/all-tools?cat=ai-generators' },
  { label: 'All tools', to: '/all-tools' },
];

// The current section: a category page, or the category of the tool being used.
function currentNav(location) {
  if (location.pathname === '/all-tools') {
    const cat = new URLSearchParams(location.search).get('cat');
    return cat ? `/all-tools?cat=${cat}` : '/all-tools';
  }
  const tool = toolsList.find((t) => t.path === location.pathname);
  return tool ? `/all-tools?cat=${tool.categoryId}` : null;
}

function Logo() {
  return (
    <Link to="/" viewTransition className="ab-logo flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-wine">
      <span className="flex h-7 items-end gap-[3px]" aria-hidden="true">
        <span className="ab-bar h-3 w-[5px] origin-bottom rounded-full bg-wine" />
        <span className="ab-bar h-6 w-[5px] origin-bottom rounded-full bg-wine" />
        <span className="ab-bar h-4 w-[5px] origin-bottom rounded-full bg-wine" />
      </span>
      AudioBulk
    </Link>
  );
}

// Smooth, inertia-style wheel scrolling (Lenis). Touch keeps the phone's own scrolling,
// and nothing changes for people who ask their system for reduced motion.
function useSmoothScroll() {
  const lenisRef = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.12, smoothWheel: true });
    lenisRef.current = lenis;
    return () => { lenis.destroy(); lenisRef.current = null; };
  }, []);
  return lenisRef;
}

export default function Shell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { addRecentTool } = useRecentTools();
  const lenisRef = useSmoothScroll();
  const activeNav = currentNav(location);

  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    const tool = toolsList.find((t) => t.path === location.pathname);
    if (tool) {
      const cat = toolCategories.find((c) => c.id === tool.categoryId);
      addRecentTool({ name: tool.name, path: tool.path, icon: tool.icon, category: cat ? cat.title : 'Tools' });
    }
  }, [location.pathname, addRecentTool, lenisRef]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="ab-shell flex min-h-screen flex-col">
        {/* Solid background on purpose: a blurred see-through header is costly to repaint while scrolling. */}
        <header className="sticky top-0 z-30 border-b border-line bg-cream">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
            <Logo />
            <nav aria-label="Main" className="hidden lg:block">
              <ul className="flex items-center gap-1">
                {NAV.map((n) => {
                  const active = activeNav === n.to;
                  return (
                    <li key={n.label}>
                      <Link
                        to={n.to}
                        viewTransition
                        aria-current={active ? 'page' : undefined}
                        className={`relative block px-3 py-2 text-[15px] font-medium transition-colors duration-200 after:absolute after:inset-x-3 after:bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-wine after:transition-transform after:duration-300 after:ease-out-soft hover:text-wine hover:after:scale-x-100 ${
                          active ? 'text-wine after:scale-x-100' : 'text-muted after:scale-x-0'
                        }`}
                      >
                        {n.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={openSearch}
                className="flex items-center gap-2 rounded-lg border border-line-strong bg-paper px-3 py-1.5 text-[15px] text-muted transition-[border-color,color,box-shadow] duration-200 hover:border-wine/60 hover:text-ink hover:shadow-lift"
              >
                <Search size={17} className="text-wine" aria-hidden="true" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden rounded border border-line px-1.5 text-xs lg:inline">Ctrl K</kbd>
                <span className="sr-only sm:hidden">Search tools</span>
              </button>
              <button
                type="button"
                onClick={openSettings}
                className="rounded-lg p-2 text-muted transition-colors duration-200 hover:bg-sand hover:text-wine [&:hover_svg]:rotate-45 [&_svg]:transition-transform [&_svg]:duration-300"
                aria-label="AI settings"
                title="AI settings"
              >
                <Settings size={20} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="rounded-lg p-2 text-ink hover:bg-sand lg:hidden"
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
          {menuOpen && (
            <nav id="mobile-nav" aria-label="Main" className="border-t border-line lg:hidden">
              <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
                {NAV.map((n) => (
                  <li key={n.label}>
                    <Link
                      to={n.to}
                      onClick={() => setMenuOpen(false)}
                      aria-current={activeNav === n.to ? 'page' : undefined}
                      className={`block rounded-lg px-3 py-2.5 font-medium hover:bg-sand ${activeNav === n.to ? 'bg-sand text-wine' : ''}`}
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </header>

        <main className="flex-1">
          <Suspense
            fallback={
              <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted">
                <LoaderCircle className="animate-spin text-wine" size={20} aria-hidden="true" /> Loading the tool…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>

        <footer className="border-t border-line bg-paper">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="max-w-sm space-y-2">
              <Logo />
              <p className="text-[15px] text-muted">Free tools for audio, video, GIFs and writing. No ads, no sign-up, and your files never leave your computer.</p>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
              <li><Link to="/all-tools" viewTransition className="text-muted transition-colors hover:text-wine">All tools</Link></li>
              <li><Link to="/privacy" viewTransition className="text-muted transition-colors hover:text-wine">Privacy</Link></li>
              <li><Link to="/terms" viewTransition className="text-muted transition-colors hover:text-wine">Terms</Link></li>
              <li><a href="https://github.com/kush23baghel/AudioBulk.Com" className="text-muted transition-colors hover:text-wine" target="_blank" rel="noopener noreferrer">Source code</a></li>
            </ul>
          </div>
        </footer>

        <SearchDialog />
        <SettingsDialog />
        <Toaster
          position="bottom-right"
          toastOptions={{ style: { background: 'var(--color-paper)', border: '1px solid var(--color-line)', color: 'var(--color-ink)', fontFamily: 'var(--font-body)' } }}
        />
      </div>
    </MotionConfig>
  );
}
