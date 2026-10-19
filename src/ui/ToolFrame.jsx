// The frame every tool page sits in: breadcrumb, title, intro, the tool itself,
// a "More … tools" list, "Why is this free?", FAQ and SEO tags.
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { toolsList, toolCategories } from '../data/tools';
import SeoMeta from '../components/SeoMeta';
import { Card } from './controls';
import Faq from './Faq';

export default function ToolFrame({ path, name, title, intro, faqs = [], children }) {
  const tool = toolsList.find((t) => t.path === path);
  const category = toolCategories.find((c) => c.id === tool?.categoryId);
  const related = toolsList.filter((t) => t.categoryId === tool?.categoryId && t.path !== path).slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
      <SeoMeta title={name} description={intro} />

      <nav aria-label="You are here" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link to="/" className="hover:text-wine">Home</Link></li>
          <li aria-hidden="true">›</li>
          {category && (
            <>
              <li><Link to={`/all-tools?cat=${category.id}`} className="hover:text-wine">{category.title}</Link></li>
              <li aria-hidden="true">›</li>
            </>
          )}
          <li className="font-medium text-ink" aria-current="page">{name}</li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-8">
          <header className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-wine">{name}</p>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-[2.6rem]">{title}</h1>
            {intro && <p className="max-w-2xl text-lg text-muted">{intro}</p>}
          </header>

          {children}

          <Faq items={faqs} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {related.length > 0 && (
            <Card className="space-y-3">
              <h2 className="text-base font-bold">More {category?.title.toLowerCase()}</h2>
              <ul className="-mx-2 space-y-0.5">
                {related.map((t) => (
                  <li key={t.path}>
                    <Link
                      to={t.path}
                      viewTransition
                      className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[15px] text-ink transition-colors duration-200 hover:bg-sand hover:text-wine"
                    >
                      <span className="transition-transform duration-200 ease-out-soft group-hover:translate-x-1">{t.name}</span>
                      <ArrowRight size={14} className="shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to={`/all-tools?cat=${category?.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-wine hover:underline">
                See all <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </Card>
          )}
          <Card className="space-y-2">
            <h2 className="text-base font-bold">Why is this free?</h2>
            <p className="text-[15px] text-muted">
              Your own computer does the work, so we don't pay for big servers. That's why there are no ads, no sign-ups and no limits.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
