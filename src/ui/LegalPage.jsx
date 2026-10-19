// Shared layout for the Privacy and Terms pages: a readable column of numbered sections.
import SeoMeta from '../components/SeoMeta';

export default function LegalPage({ title, intro, updated, sections }) {
  return (
    <article className="mx-auto max-w-3xl space-y-10 px-4 pb-24 pt-12 sm:px-6">
      <SeoMeta title={title} description={intro} />
      <header className="space-y-3">
        <h1 className="text-4xl font-extrabold">{title}</h1>
        <p className="text-lg text-muted">{intro}</p>
        <p className="text-sm text-muted">Last updated: {updated}</p>
      </header>
      <ol className="space-y-8">
        {sections.map((s, i) => (
          <li key={s.title} className="space-y-2">
            <h2 className="text-xl font-bold">{i + 1}. {s.title}</h2>
            {s.body.map((p) => <p key={p} className="max-w-prose text-[17px] leading-relaxed text-ink/85">{p}</p>)}
          </li>
        ))}
      </ol>
    </article>
  );
}
