// Light header + footer for redesigned pages. Old pages keep the dark Layout until the redesign is approved.
import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Menu, X, LoaderCircle } from 'lucide-react';
import { toolsList, toolCategories } from '../data/tools';
import useRecentTools from '../hooks/useRecentTools';

const NAV = [
  { label: 'Audio', to: '/all-tools?cat=audio' },
  { label: 'Video', to: '/all-tools?cat=video' },
  { label: 'GIF & images', to: '/all-tools?cat=gif-image' },
  { label: 'AI writing', to: '/all-tools?cat=ai-generators' },
  { label: 'All tools', to: '/all-tools' },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-wine">
      <span className="flex h-7 items-end gap-[3px]" aria-hidden="true">
        <span className="h-3 w-[5px] rounded-full bg-wine" />
        <span className="h-6 w-[5px] rounded-full bg-wine" />
        <span className="h-4 w-[5px] rounded-full bg-wine" />
      </span>
      AudioBulk
    </Link>
  );
}

export default function Shell() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { addRecentTool } = useRecentTools();

  useEffect(() => {
    window.scrollTo(0, 0);
    const tool = toolsList.find((t) => t.path === location.pathname);
    if (tool) {
      const cat = toolCategories.find((c) => c.id === tool.categoryId);
      addRecentTool({ name: tool.name, path: tool.path, icon: tool.icon, category: cat ? cat.title : 'Tools' });
    }
  }, [location.pathname, addRecentTool]);

  return (
    <div className="ab-shell flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.label}>
                  <NavLink to={n.to} className="rounded-lg px-3 py-2 text-[15px] font-medium text-muted hover:bg-sand hover:text-ink">
                    {n.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <button
            type="button"
            className="rounded-lg p-2 text-ink hover:bg-sand md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {menuOpen && (
          <nav id="mobile-nav" aria-label="Main" className="border-t border-line md:hidden">
            <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
              {NAV.map((n) => (
                <li key={n.label}>
                  <Link to={n.to} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2.5 font-medium hover:bg-sand">{n.label}</Link>
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
            <li><Link to="/all-tools" className="text-muted hover:text-wine">All tools</Link></li>
            <li><Link to="/privacy" className="text-muted hover:text-wine">Privacy</Link></li>
            <li><Link to="/terms" className="text-muted hover:text-wine">Terms</Link></li>
            <li><a href="https://github.com/kush23baghel/AudioBulk.Com" className="text-muted hover:text-wine" target="_blank" rel="noopener noreferrer">Source code</a></li>
          </ul>
        </div>
      </footer>

      <Toaster
        position="bottom-right"
        toastOptions={{ style: { background: 'var(--color-paper)', border: '1px solid var(--color-line)', color: 'var(--color-ink)', fontFamily: 'var(--font-body)' } }}
      />
    </div>
  );
}
