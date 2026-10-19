// Cards that link to a tool or a category. Calm at rest; on hover or keyboard focus they lift,
// the border turns wine, the icon box fills wine and an arrow slides in.
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ToolIcon } from './icons';

const LIFT =
  'transition-[transform,box-shadow,border-color,background-color] duration-200 ease-out-soft ' +
  'hover:-translate-y-0.5 hover:border-wine/60 hover:shadow-lift ' +
  'focus-visible:-translate-y-0.5 focus-visible:border-wine/60 focus-visible:shadow-lift ' +
  'motion-reduce:hover:translate-y-0 motion-reduce:focus-visible:translate-y-0';

const ICON_BOX =
  'flex shrink-0 items-center justify-center rounded-lg bg-sand text-wine transition-colors duration-200 ' +
  'group-hover:bg-wine group-hover:text-paper group-focus-visible:bg-wine group-focus-visible:text-paper';

const ARROW =
  'absolute text-wine opacity-0 -translate-x-1 transition-[opacity,transform] duration-200 ' +
  'group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100';

export function ToolCard({ tool, showAi = false }) {
  return (
    <Link to={tool.path} viewTransition className={`group relative flex h-full items-start gap-3 rounded-xl border border-line bg-paper p-4 pr-10 ${LIFT}`}>
      <span className={`h-10 w-10 ${ICON_BOX}`}>
        <ToolIcon name={tool.icon} size={19} />
      </span>
      <span className="min-w-0 space-y-0.5">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold transition-colors group-hover:text-wine">{tool.name}</span>
          {showAi && tool.isAi && (
            <span className="inline-flex items-center gap-1 rounded-full bg-wine-soft px-2 py-0.5 text-xs font-semibold text-wine" title="Needs a free AI key">
              <Sparkles size={11} aria-hidden="true" /> AI
            </span>
          )}
        </span>
        <span className="block text-sm text-muted">{tool.desc}</span>
      </span>
      <ArrowRight size={16} className={`${ARROW} right-4 top-4`} aria-hidden="true" />
    </Link>
  );
}

export function CategoryCard({ category, count }) {
  return (
    <Link
      to={`/all-tools?cat=${category.id}`}
      viewTransition
      className={`group relative flex h-full flex-col gap-3 rounded-2xl border border-line bg-paper p-6 ${LIFT}`}
    >
      <div className="flex items-center justify-between">
        <span className={`h-11 w-11 rounded-xl ${ICON_BOX}`}>
          <ToolIcon name={category.icon} size={21} />
        </span>
        <span className="text-sm font-semibold text-muted transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0">{count} tools</span>
      </div>
      <h3 className="text-xl font-bold transition-colors group-hover:text-wine">{category.title}</h3>
      <p className="text-muted">{category.description}</p>
      <ArrowRight size={18} className={`${ARROW} right-6 top-7`} aria-hidden="true" />
    </Link>
  );
}
