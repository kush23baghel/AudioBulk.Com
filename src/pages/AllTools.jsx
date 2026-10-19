import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { toolCategories, toolsList } from '../data/tools';
import SeoMeta from '../components/SeoMeta';
import { Button } from '../ui/controls';
import { ToolCard } from '../ui/ToolCard';
import { Reveal } from '../ui/motion';

const CHIPS = [{ id: 'all', title: 'All' }, ...toolCategories];
const EASE = [0.22, 1, 0.36, 1];

// Cards glide into their new places when the filter changes; removed cards fade out.
function ToolGrid({ tools }) {
  return (
    <motion.ul layout className="grid gap-3 @xl:grid-cols-2 @5xl:grid-cols-3 @[96rem]:grid-cols-4">
      <AnimatePresence initial={false} mode="popLayout">
        {tools.map((t) => (
          <motion.li
            key={t.id}
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <ToolCard tool={t} showAi />
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
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
  const grouped = active === 'all' && !q;

  return (
    <>
      <SeoMeta title={category ? category.title : 'All tools'} description={category?.description} />

      <div className="mx-auto max-w-[100rem] space-y-6 px-4 pb-10 pt-10 sm:px-6">
        <header className="space-y-3">
          <h1 className="text-4xl font-extrabold">{category ? category.title : 'All tools'}</h1>
          <p className="text-lg text-muted">{tools.length} tools · free, no ads, nothing uploaded</p>
        </header>

        <div className="flex max-w-xl items-center gap-3 rounded-xl border border-line-strong bg-paper px-4 transition-[border-color,box-shadow] duration-200 focus-within:border-wine/60 focus-within:shadow-lift">
          <Search size={19} className="shrink-0 text-wine" aria-hidden="true" />
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
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.96] ${
                active === c.id ? 'border-wine bg-wine text-paper' : 'border-line-strong bg-paper hover:border-wine hover:text-wine'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[100rem] px-4 pb-14 sm:px-6">
        <div className="rounded-3xl bg-sunken p-4 sm:p-6">
          {tools.length === 0 ? (
            <div className="space-y-4 rounded-2xl border border-line bg-paper p-10 text-center">
              <p className="text-lg">No tools match “{query}”{category ? ` in ${category.title.toLowerCase()}` : ''}.</p>
              <Button variant="secondary" onClick={() => { setQuery(''); pick('all'); }}>Show all tools</Button>
            </div>
          ) : grouped ? (
            // Unfiltered: group by type so all the tools are easy to scan.
            <div className="space-y-14">
              {toolCategories.map((c) => (
                <section key={c.id} className="space-y-4" aria-labelledby={`cat-${c.id}`}>
                  <Reveal className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 id={`cat-${c.id}`} className="text-2xl font-bold">{c.title}</h2>
                    <button type="button" onClick={() => pick(c.id)} className="text-sm font-semibold text-wine hover:underline">
                      Only show {c.title.toLowerCase()}
                    </button>
                  </Reveal>
                  <ToolGrid tools={tools.filter((t) => t.categoryId === c.id)} />
                </section>
              ))}
            </div>
          ) : (
            <ToolGrid tools={tools} />
          )}
        </div>
      </div>
    </>
  );
}
