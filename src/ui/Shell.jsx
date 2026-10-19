// The app frame for redesigned pages: header, left sidebar (navigation), the page, right sidebar
// (tips, next steps, favorites). Sidebars sit against the screen edges, so wide screens are used fully.
// Old pages keep the dark Layout until the redesign is approved.
import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { Toaster } from 'sonner';
import { Menu, X, LoaderCircle, Search, Settings } from 'lucide-react';
import { toolsList, toolCategories } from '../data/tools';
import useRecentTools from '../hooks/useRecentTools';
import useMediaQuery from '../hooks/useMediaQuery';
import SearchDialog from './SearchDialog';
import SettingsDialog from './SettingsDialog';
import LeftNav from './LeftNav';
import RightRail from './RightRail';

const openSearch = () => window.dispatchEvent(new Event('open-command-palette'));
const openSettings = () => window.dispatchEvent(new Event('open-ai-settings'));

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

// Phone / tablet menu: the left sidebar slides in from the left.
function MenuDrawer({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 lg:hidden" data-lenis-prevent="">
      <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div id="mobile-nav" className="absolute inset-y-0 left-0 w-[min(320px,85vw)] overflow-y-auto border-r border-line bg-cream shadow-xl">
        <div className="flex h-16 items-center justify-between border-b border-line px-4">
          <Logo />
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-sand" aria-label="Close menu"><X size={22} /></button>
        </div>
        <LeftNav onNavigate={onClose} />
      </div>
    </div>
  );
}

export default function Shell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { addRecentTool } = useRecentTools();
  const lenisRef = useSmoothScroll();
  const wide = useMediaQuery('(min-width: 1280px)');

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
          <div className="flex h-16 items-center gap-3 px-4 sm:px-5">
            <button
              type="button"
              className="-ml-1 rounded-lg p-2 text-ink hover:bg-sand lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="shrink-0 lg:w-[248px]"><Logo /></div>
            <button
              type="button"
              onClick={openSearch}
              className="ml-auto flex items-center gap-2 rounded-lg border border-line-strong bg-paper px-3 py-2 text-left text-[15px] text-muted transition-[border-color,box-shadow] duration-200 hover:border-wine/60 hover:shadow-lift lg:ml-0 lg:w-full lg:max-w-md"
            >
              <Search size={17} className="text-wine" aria-hidden="true" />
              <span className="hidden flex-1 sm:inline">Search tools</span>
              <kbd className="hidden rounded border border-line px-1.5 text-xs lg:inline">Ctrl K</kbd>
              <span className="sr-only sm:hidden">Search tools</span>
            </button>
            <button
              type="button"
              onClick={openSettings}
              className="rounded-lg p-2 text-muted transition-colors duration-200 hover:bg-sand hover:text-wine lg:ml-auto [&:hover_svg]:rotate-45 [&_svg]:transition-transform [&_svg]:duration-300"
              aria-label="AI settings"
              title="AI settings"
            >
              <Settings size={20} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="flex-1 lg:grid lg:grid-cols-[264px_minmax(0,1fr)] xl:grid-cols-[264px_minmax(0,1fr)_320px]">
          <aside
            aria-label="Tools"
            data-lenis-prevent=""
            className="sticky top-16 hidden h-[calc(100vh-4rem)] overflow-y-auto border-r border-line lg:block"
          >
            <LeftNav />
          </aside>

          {/* @container: page grids respond to the space between the sidebars, not the whole screen. */}
          <main className="@container min-w-0">
            <Suspense
              fallback={
                <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted">
                  <LoaderCircle className="animate-spin text-wine" size={20} aria-hidden="true" /> Loading the tool…
                </div>
              }
            >
              <Outlet />
            </Suspense>

            {/* Below extra-wide screens, the right sidebar's helpers come after the page (rendered once, never twice). */}
            {!wide && (
              <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
                <RightRail />
              </div>
            )}
          </main>

          {wide && (
            <aside
              aria-label="Help for this page"
              data-lenis-prevent=""
              className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-l border-line p-4"
            >
              <RightRail />
            </aside>
          )}
        </div>

        <footer className="border-t border-line bg-paper">
          <div className="flex flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-6">
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

        <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
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
