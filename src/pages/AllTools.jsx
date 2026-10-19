import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X, Sparkles } from 'lucide-react';
import { toolCategories, toolsList } from '../data/tools';
import SeoMeta from '../components/SeoMeta';
import { Button } from '../ui/controls';
import { ToolIcon } from '../ui/icons';

const CHIPS = [{ id: 'all', title: 'All' }, ...toolCategories];

function ToolGrid({ tools }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((t) => (
        <li key={t.id}>
          <Link to={t.path} className="group flex h-full items-start gap-3 rounded-xl border border-line bg-paper p-4 transition-colors hover:border-line-strong hover:bg-sand/50">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sand text-wine">
              <ToolIcon name={t.icon} size={19} />
            </span>
            <span className="min-w-0 space-y-0.5">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold group-hover:text-wine">{t.name}</span>
                {t.isAi && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-wine-soft px-2 py-0.5 text-xs font-semibold text-wine" title="Needs a free AI key">
                    <Sparkles size={11} aria-hidden="true" /> AI
                  </span>
                )}
              </span>
              <span className="block text-sm text-muted">{t.desc}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function AllTools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const active = searchParams.get('cat') || 'all';

  const pick = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') next.delete('cat'); else next.set('cat', id);
    setSearchParams(next);
  };

  const q = query.trim().toLowerCase();
  const tools = toolsList.filter((t) =>
    (active === 'all' || t.categoryId === active) &&
    (!q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q)),
  );
  const category = toolCategories.find((c) => c.id === active);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-24 pt-10 sm:px-6">
      <SeoMeta title={category ? category.title : 'All tools'} description={category?.description} />

      <header className="space-y-3">
        <h1 className="text-4xl font-extrabold">{category ? category.title : 'All tools'}</h1>
        <p className="text-lg text-muted">{tools.length} tools · free, no ads, nothing uploaded</p>
      </header>

      <div className="space-y-4">
        <div className="flex max-w-xl items-center gap-3 rounded-xl border border-line-strong bg-paper px-4 focus-within:outline focus-within:outline-3 focus-within:outline-wine">
          <Search size={19} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            id="tools-filter"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter tools, like “gif” or “story”"
            aria-label="Filter tools"
            autoComplete="off"
            className="w-full bg-transparent py-3 outline-none placeholder:text-muted"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="text-muted hover:text-ink" aria-label="Clear filter">
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Show tools for">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pick(c.id)}
              aria-pressed={active === c.id}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                active === c.id ? 'border-wine bg-wine text-paper' : 'border-line bg-cream hover:border-line-strong hover:bg-sand'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {tools.length === 0 ? (
        <div className="space-y-4 rounded-2xl border border-line bg-paper p-10 text-center">
          <p className="text-lg">No tools match “{query}”{category ? ` in ${category.title.toLowerCase()}` : ''}.</p>
          <Button variant="secondary" onClick={() => { setQuery(''); pick('all'); }}>Show all tools</Button>
        </div>
      ) : active === 'all' && !q ? (
        // Unfiltered: group by type so 70 tools are easy to scan.
        <div className="space-y-12">
          {toolCategories.map((c) => (
            <section key={c.id} className="space-y-4" aria-labelledby={`cat-${c.id}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`cat-${c.id}`} className="text-2xl font-bold">{c.title}</h2>
                <button type="button" onClick={() => pick(c.id)} className="text-sm font-semibold text-wine hover:underline">
                  Only show {c.title.toLowerCase()}
                </button>
              </div>
              <ToolGrid tools={tools.filter((t) => t.categoryId === c.id)} />
            </section>
          ))}
        </div>
      ) : (
        <ToolGrid tools={tools} />
      )}
    </div>
  );
}
