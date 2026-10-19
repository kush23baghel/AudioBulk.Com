// The app frame for redesigned pages: header, left sidebar (navigation), the page, right sidebar
// (tips, next steps, favorites). Sidebars sit against the screen edges, so wide screens are used fully.
// Old pages keep the dark Layout until the redesign is approved.
import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { Toaster } from 'sonner';
import { Menu, X, LoaderCircle, Search, Settings, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { toolsList, toolCategories } from '../data/tools';
import useRecentTools from '../hooks/useRecentTools';
import useMediaQuery from '../hooks/useMediaQuery';
import { createLocalStore, useStore } from '../lib/localStore';
import SearchDialog from './SearchDialog';
import SettingsDialog from './SettingsDialog';
import LeftNav from './LeftNav';
import RightRail from './RightRail';

const openSearch = () => window.dispatchEvent(new Event('open-command-palette'));
const openSettings = () => window.dispatchEvent(new Event('open-ai-settings'));

// Desktop sidebars shown or hidden; remembered in this browser.
const isBool = (v) => typeof v === 'boolean';
const sidebarStore = createLocalStore('audiobulk_sidebar_open', true, isBool);
const toggleSidebar = () => sidebarStore.set((open) => !open);
const rightbarStore = createLocalStore('audiobulk_rightbar_open', true, isBool);
const toggleRightbar = () => rightbarStore.set((open) => !open);

// Grid columns for each sidebar combination (written out in full so Tailwind can see every class).
// Below 1280px the right sidebar is never a column; its helpers sit under the page instead.
const GRID = {
  'open-open': 'lg:grid-cols-[264px_minmax(0,1fr)] xl:grid-cols-[264px_minmax(0,1fr)_320px]',
  'open-closed': 'lg:grid-cols-[264px_minmax(0,1fr)] xl:grid-cols-[264px_minmax(0,1fr)_0px]',
  'closed-open': 'lg:grid-cols-[0px_minmax(0,1fr)] xl:grid-cols-[0px_minmax(0,1fr)_320px]',
  'closed-closed': 'lg:grid-cols-[0px_minmax(0,1fr)] xl:grid-cols-[0px_minmax(0,1fr)_0px]',
};

const TOGGLE_BTN = 'hidden rounded-lg p-2 text-muted transition-colors duration-200 hover:bg-sand hover:text-wine lg:block';

// Ctrl/⌘ + B hides or shows the sidebar, except while typing in a field.
function useSidebarShortcut() {
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'b') return;
      const el = document.activeElement;
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return;
      e.preventDefault();
      toggleSidebar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
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
  const lgUp = useMediaQuery('(min-width: 1024px)');
  const sidebarOpen = useStore(sidebarStore);
  const rightbarOpen = useStore(rightbarStore);
  useSidebarShortcut();
  // On phones the helpers always show under the page; the right toggle only exists from laptops up.
  const showRailBelow = !wide && (rightbarOpen || !lgUp);

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
            <div className="flex shrink-0 items-center gap-2 lg:w-[248px]">
              {/* Phones and tablets: three-line menu opens the sidebar as a slide-in panel. */}
              <button
                type="button"
                className="-ml-1 rounded-lg p-2 text-ink transition-colors duration-200 hover:bg-sand hover:text-wine lg:hidden"
                aria-expanded={menuOpen}
                aria-controls="mobile-nav"
                aria-label="Open menu"
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={22} aria-hidden="true" />
              </button>
              <Logo />
              {/* Desktop: show or hide the left sidebar (sits right after the logo). */}
              <button
                type="button"
                onClick={toggleSidebar}
                aria-expanded={sidebarOpen}
                aria-controls="left-sidebar"
                aria-label={sidebarOpen ? 'Hide left sidebar' : 'Show left sidebar'}
                title={`${sidebarOpen ? 'Hide' : 'Show'} left sidebar (Ctrl+B)`}
                className={`lg:ml-auto ${TOGGLE_BTN}`}
              >
                {sidebarOpen ? <PanelLeftClose size={20} aria-hidden="true" /> : <PanelLeftOpen size={20} aria-hidden="true" />}
              </button>
            </div>
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
            {/* Desktop: show or hide the right sidebar (tips, next steps, favorites). */}
            <button
              type="button"
              onClick={toggleRightbar}
              aria-expanded={rightbarOpen}
              aria-controls="right-sidebar"
              aria-label={rightbarOpen ? 'Hide right sidebar' : 'Show right sidebar'}
              title={`${rightbarOpen ? 'Hide' : 'Show'} tips and favorites`}
              className={`-mr-1 ${TOGGLE_BTN}`}
            >
              {rightbarOpen ? <PanelRightClose size={20} aria-hidden="true" /> : <PanelRightOpen size={20} aria-hidden="true" />}
            </button>
          </div>
        </header>

        {/* Sidebar columns slide open and shut when toggled (grid columns animate). With both shut,
            the page sits centred at its normal width. */}
        <div
          className={`flex-1 transition-[grid-template-columns] duration-300 ease-out-soft motion-reduce:transition-none lg:grid ${
            GRID[`${sidebarOpen ? 'open' : 'closed'}-${rightbarOpen ? 'open' : 'closed'}`]
          }`}
        >
          <aside
            id="left-sidebar"
            aria-label="Tools"
            data-lenis-prevent=""
            inert={!sidebarOpen}
            className={`sticky top-16 hidden h-[calc(100vh-4rem)] overflow-x-hidden overflow-y-auto lg:block ${
              sidebarOpen ? 'border-r border-line' : ''
            }`}
          >
            <div className="w-[264px]"><LeftNav /></div>
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
            {showRailBelow && (
              <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
                <RightRail />
              </div>
            )}
          </main>

          {wide && (
            <aside
              id="right-sidebar"
              aria-label="Help for this page"
              data-lenis-prevent=""
              inert={!rightbarOpen}
              className={`sticky top-16 h-[calc(100vh-4rem)] overflow-x-hidden overflow-y-auto ${rightbarOpen ? 'border-l border-line' : ''}`}
            >
              <div className="w-[320px] p-4"><RightRail /></div>
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
