import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toolsList } from '../data/tools';
import { ToolCard } from '../ui/ToolCard';

// A few popular tools, so a bad link still leads somewhere useful.
const SUGGESTED_IDS = ['bulk-audio-converter', 'bulk-video-compressor', 'vocal-remover', 'video-to-gif', 'ai-story-generator', 'word-counter'];

export default function NotFound() {
  const suggestions = SUGGESTED_IDS.map((id) => toolsList.find((t) => t.id === id)).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 pb-24 pt-16 sm:px-6">
      {/* Real 404s must never be indexed. */}
      <Helmet>
        <title>Page Not Found (404) | AudioBulk</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content={`This AudioBulk page could not be found. Browse all ${toolsList.length} free tools instead.`} />
      </Helmet>

      <div className="space-y-4">
        <p className="font-display text-6xl font-extrabold text-wine">404</p>
        <h1 className="text-3xl font-extrabold sm:text-4xl">We can't find that page</h1>
        <p className="text-lg text-muted">The link may be broken, or the page may have moved. All {toolsList.length} tools are still here.</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link to="/" className="rounded-lg bg-wine px-5 py-2.5 font-semibold text-paper hover:bg-wine-deep">Go to the home page</Link>
          <Link to="/all-tools" className="rounded-lg border border-line-strong bg-paper px-5 py-2.5 font-semibold hover:bg-sand">See all tools</Link>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Popular tools</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {suggestions.map((t) => <li key={t.id}><ToolCard tool={t} /></li>)}
        </ul>
      </section>
    </div>
  );
}
