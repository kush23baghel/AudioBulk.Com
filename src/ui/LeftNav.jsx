// Left sidebar: home, every category with its tools, and the AI key status.
// Used as the desktop sidebar and as the phone menu.
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, House, LayoutGrid, Sparkles, Check } from 'lucide-react';
import { toolCategories, toolsList } from '../data/tools';
import useAiKeyStatus from '../hooks/useAiKeyStatus';
import { ToolIcon } from './icons';

const openSettings = () => window.dispatchEvent(new Event('open-ai-settings'));

function activeCategoryOf(location) {
  const tool = toolsList.find((t) => t.path === location.pathname);
  if (tool) return tool.categoryId;
  if (location.pathname === '/all-tools') return new URLSearchParams(location.search).get('cat');
  return null;
}

function TopLink({ to, icon: Icon, label, active, onNavigate }) {
  return (
    <Link
      to={to}
      viewTransition
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors duration-200 ${
        active ? 'bg-sand text-wine' : 'text-ink hover:bg-sand/70 hover:text-wine'
      }`}
    >
      <Icon size={18} aria-hidden="true" /> {label}
    </Link>
  );
}

export default function LeftNav({ onNavigate }) {
  const location = useLocation();
  const activeCat = activeCategoryOf(location);
  const [choice, setChoice] = useState({});
  const hasKey = useAiKeyStatus();

  // The category of the page you're on starts open; anything you open or close yourself stays that way.
  const isOpen = (id) => choice[id] ?? id === activeCat;
  const toggle = (id) => setChoice((c) => ({ ...c, [id]: !isOpen(id) }));

  return (
    <div className="flex min-h-full flex-col gap-5 px-3 py-4">
      <nav aria-label="Main" className="space-y-1">
        <TopLink to="/" icon={House} label="Home" active={location.pathname === '/'} onNavigate={onNavigate} />
        <TopLink to="/all-tools" icon={LayoutGrid} label={`All ${toolsList.length} tools`} active={location.pathname === '/all-tools' && !activeCat} onNavigate={onNavigate} />
      </nav>

      <div className="space-y-1">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted">Tools by type</p>
        {toolCategories.map((cat) => {
          const tools = toolsList.filter((t) => t.categoryId === cat.id);
          const expanded = isOpen(cat.id);
          return (
            <div key={cat.id}>
              <button
                type="button"
                onClick={() => toggle(cat.id)}
                aria-expanded={expanded}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] font-medium transition-colors duration-200 hover:bg-sand/70 ${
                  activeCat === cat.id ? 'text-wine' : 'text-ink'
                }`}
              >
                <ToolIcon name={cat.icon} size={18} className="text-wine" />
                <span className="flex-1">{cat.title}</span>
                <span className="text-xs text-muted">{tools.length}</span>
                <ChevronRight size={15} className={`text-muted transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} aria-hidden="true" />
              </button>
              {expanded && (
                <ul className="mb-2 ml-[1.15rem] mt-0.5 space-y-0.5 border-l border-line pl-3">
                  {tools.map((t) => {
                    const here = location.pathname === t.path;
                    return (
                      <li key={t.id}>
                        <Link
                          to={t.path}
                          viewTransition
                          onClick={onNavigate}
                          aria-current={here ? 'page' : undefined}
                          className={`block rounded-md px-2 py-1.5 text-sm transition-colors duration-200 ${
                            here ? 'bg-wine font-semibold text-paper' : 'text-muted hover:bg-sand/70 hover:text-wine'
                          }`}
                        >
                          {t.name}
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link to={`/all-tools?cat=${cat.id}`} viewTransition onClick={onNavigate} className="block px-2 py-1.5 text-sm font-semibold text-wine hover:underline">
                      See them all
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => { onNavigate?.(); openSettings(); }}
        className="mt-auto flex items-start gap-3 rounded-xl border border-line bg-paper p-3 text-left transition-[border-color,box-shadow] duration-200 hover:border-wine/60 hover:shadow-lift"
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${hasKey ? 'bg-ok-soft text-ok' : 'bg-wine-soft text-wine'}`}>
          {hasKey ? <Check size={16} aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
        </span>
        <span className="min-w-0 text-sm">
          <span className="block font-semibold">{hasKey ? 'AI key added' : 'Add your AI key'}</span>
          <span className="block text-muted">{hasKey ? 'AI writing tools are ready.' : 'Free. Needed for the AI writing tools.'}</span>
        </span>
      </button>
    </div>
  );
}
