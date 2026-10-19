// Search every tool. Opens with Ctrl/⌘+K or the "open-command-palette" window event.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { toolsList, toolCategories } from '../data/tools';
import Dialog from './Dialog';
import { ToolIcon } from './icons';

const SUGGESTED = ['bulk-audio-converter', 'video-trimmer', 'bulk-video-compressor', 'video-to-gif', 'vocal-remover', 'ai-story-generator'];

function matches(tool, q) {
  const cat = toolCategories.find((c) => c.id === tool.categoryId)?.title || '';
  return [tool.name, tool.title, tool.desc, cat].some((s) => s?.toLowerCase().includes(q));
}

// Mounted fresh each time the dialog opens, so the search box always starts empty.
function SearchPanel({ onPick }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUGGESTED.map((id) => toolsList.find((t) => t.id === id)).filter(Boolean);
    return toolsList.filter((t) => matches(t, q)).slice(0, 10);
  }, [query]);

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (results.length ? (i + 1) % results.length : 0)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0)); }
    if (e.key === 'Enter' && results[active]) { e.preventDefault(); onPick(results[active]); }
  };

  return (
    <div className="-m-5 sm:-m-6">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <Search size={20} className="shrink-0 text-muted" aria-hidden="true" />
        <input
          id="tool-search"
          autoFocus
          type="text"
          autoComplete="off"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={onInputKey}
          placeholder='What do you want to do? Try "trim video"'
          aria-label="Search tools"
          aria-controls="tool-search-results"
          aria-activedescendant={results[active] ? `result-${results[active].id}` : undefined}
          className="w-full bg-transparent text-lg outline-none placeholder:text-muted"
        />
        <kbd className="hidden rounded border border-line px-1.5 py-0.5 text-xs text-muted sm:block">Esc</kbd>
      </div>

      <div className="max-h-[55vh] overflow-y-auto p-2">
        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted">
          {query.trim() ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Popular tools'}
        </p>
        {results.length === 0 ? (
          <p className="px-3 py-8 text-center text-muted">No tools match "{query}". Try a simpler word, like "audio" or "gif".</p>
        ) : (
          <ul id="tool-search-results" role="listbox" aria-label="Tools">
            {results.map((t, i) => {
              const cat = toolCategories.find((c) => c.id === t.categoryId);
              return (
                <li key={t.id} id={`result-${t.id}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => onPick(t)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${i === active ? 'bg-sand' : ''}`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-wine">
                      <ToolIcon name={t.icon} size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{t.name}</span>
                      <span className="block truncate text-sm text-muted">{t.desc}</span>
                    </span>
                    <span className="hidden shrink-0 text-xs text-muted sm:block">{cat?.title}</span>
                    {i === active && <CornerDownLeft size={15} className="hidden shrink-0 text-wine sm:block" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function SearchDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const show = () => setOpen(true);
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', show);
    };
  }, []);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="Search tools" hideTitle className="mt-[12vh] max-w-xl">
      <SearchPanel onPick={(tool) => { setOpen(false); navigate(tool.path); }} />
    </Dialog>
  );
}
