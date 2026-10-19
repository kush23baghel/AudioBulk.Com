// The frame every tool page sits in: breadcrumb, title with a favorite star, intro, the tool, FAQ, SEO.
// Related tools, tips and next steps live in the shell's sidebars.
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { toolsList, toolCategories } from '../data/tools';
import useFavorites from '../hooks/useFavorites';
import SeoMeta from '../components/SeoMeta';
import Faq from './Faq';

function FavoriteButton({ toolId, name }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const on = isFavorite(toolId);
  return (
    <button
      type="button"
      onClick={() => toggleFavorite(toolId)}
      aria-pressed={on}
      title={on ? 'Remove from favorites' : 'Save to favorites'}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-95 ${
        on ? 'border-wine bg-wine text-paper' : 'border-line-strong bg-paper text-muted hover:border-wine hover:text-wine'
      }`}
    >
      <Star size={15} className={on ? 'fill-current' : ''} aria-hidden="true" />
      {on ? 'Saved' : 'Save'}
      <span className="sr-only"> {name} to favorites</span>
    </button>
  );
}

export default function ToolFrame({ path, name, title, intro, faqs = [], children }) {
  const tool = toolsList.find((t) => t.path === path);
  const category = toolCategories.find((c) => c.id === tool?.categoryId);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      <SeoMeta title={name} description={intro} />

      <nav aria-label="You are here" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link to="/" viewTransition className="hover:text-wine">Home</Link></li>
          <li aria-hidden="true">›</li>
          {category && (
            <>
              <li><Link to={`/all-tools?cat=${category.id}`} viewTransition className="hover:text-wine">{category.title}</Link></li>
              <li aria-hidden="true">›</li>
            </>
          )}
          <li className="font-medium text-ink" aria-current="page">{name}</li>
        </ol>
      </nav>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-wine">{name}</p>
          {tool && <FavoriteButton toolId={tool.id} name={name} />}
        </div>
        <h1 className="text-3xl font-extrabold leading-tight sm:text-[2.6rem]">{title}</h1>
        {intro && <p className="max-w-2xl text-lg text-muted">{intro}</p>}
      </header>

      {children}

      <Faq items={faqs} />
    </div>
  );
}
