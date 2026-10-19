// Right sidebar: tips for the page you're on, what to do next, and your favorites + recent tools.
// What it shows comes from the current page (src/data/toolGuides.js).
import { Link, useLocation } from 'react-router-dom';
import { Lightbulb, ArrowRight, Star, History } from 'lucide-react';
import { toolsList } from '../data/tools';
import { pageGuides, categoryTips, toolGuides } from '../data/toolGuides';
import useFavorites from '../hooks/useFavorites';
import useRecentTools from '../hooks/useRecentTools';
import { ToolIcon } from './icons';

const byId = (id) => toolsList.find((t) => t.id === id);

function guideFor(location) {
  if (location.pathname === '/') return pageGuides.home;
  if (location.pathname === '/all-tools') {
    const cat = new URLSearchParams(location.search).get('cat');
    return cat ? { ...pageGuides['all-tools'], tips: categoryTips[cat] || pageGuides['all-tools'].tips } : pageGuides['all-tools'];
  }
  const tool = toolsList.find((t) => t.path === location.pathname);
  if (!tool) return null;
  const own = toolGuides[tool.id] || {};
  const sameType = toolsList.filter((t) => t.categoryId === tool.categoryId && t.id !== tool.id).slice(0, 3).map((t) => t.id);
  return {
    tipsTitle: 'Tips',
    tips: own.tips || categoryTips[tool.categoryId] || [],
    nextTitle: 'What to do next',
    next: own.next || sameType,
  };
}

function Panel({ icon: Icon, title, children }) {
  return (
    <section className="space-y-3 rounded-2xl border border-line bg-paper p-4">
      <h2 className="flex items-center gap-2 text-[15px] font-bold">
        <Icon size={16} className="text-wine" aria-hidden="true" /> {title}
      </h2>
      {children}
    </section>
  );
}

function ToolRow({ tool }) {
  return (
    <li>
      <Link
        to={tool.path}
        viewTransition
        className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-sand/70"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand text-wine transition-colors duration-200 group-hover:bg-wine group-hover:text-paper">
          <ToolIcon name={tool.icon} size={15} />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium group-hover:text-wine">{tool.name}</span>
        <ArrowRight size={14} className="shrink-0 text-wine opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden="true" />
      </Link>
    </li>
  );
}

export default function RightRail() {
  const location = useLocation();
  const guide = guideFor(location);
  const { favorites } = useFavorites();
  const { recentTools } = useRecentTools();

  const favTools = favorites.map(byId).filter(Boolean);
  const recent = recentTools.map((r) => toolsList.find((t) => t.path === r.path)).filter((t) => t && t.path !== location.pathname).slice(0, 5);
  const next = (guide?.next || []).map(byId).filter(Boolean);

  return (
    <div className="space-y-4">
      {guide?.tips?.length > 0 && (
        <Panel icon={Lightbulb} title={guide.tipsTitle}>
          <ul className="space-y-2.5">
            {guide.tips.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-ink/85">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-wine" aria-hidden="true" />
                {tip}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {next.length > 0 && (
        <Panel icon={ArrowRight} title={guide.nextTitle}>
          <ul className="-mx-1 space-y-0.5">{next.map((t) => <ToolRow key={t.id} tool={t} />)}</ul>
        </Panel>
      )}

      <Panel icon={Star} title="Your favorites">
        {favTools.length > 0 ? (
          <ul className="-mx-1 space-y-0.5">{favTools.map((t) => <ToolRow key={t.id} tool={t} />)}</ul>
        ) : (
          <p className="text-sm text-muted">Tap the star next to a tool's name to keep it here.</p>
        )}
      </Panel>

      {recent.length > 0 && (
        <Panel icon={History} title="Recently used">
          <ul className="-mx-1 space-y-0.5">{recent.map((t) => <ToolRow key={t.id} tool={t} />)}</ul>
        </Panel>
      )}
    </div>
  );
}
