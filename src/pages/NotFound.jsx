import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toolsList } from '../data/tools';

// A handful of popular entry points, so a bad URL is still a useful page.
const SUGGESTED_IDS = [
  'bulk-audio-converter',
  'bulk-video-compressor',
  'vocal-remover',
  'video-to-gif',
  'ai-story-generator',
  'word-counter',
];

export default function NotFound() {
  const suggestions = SUGGESTED_IDS
    .map((id) => toolsList.find((tool) => tool.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Real 404s must never be indexed — this replaced a soft 404 that served Home. */}
      <Helmet>
        <title>Page Not Found (404) | AudioBulk</title>
        <meta name="robots" content="noindex, follow" />
        <meta name="description" content="This AudioBulk page could not be found. Browse all 70 free browser-based audio, video, GIF and AI tools instead." />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <p className="font-sora text-7xl md:text-8xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
          404
        </p>
        <h1 className="mt-4 font-sora text-2xl md:text-3xl font-bold text-white">
          This page doesn&apos;t exist
        </h1>
        <p className="mt-3 text-slate-400 font-inter">
          The link may be broken or the tool may have been renamed. All 70 tools are still
          one click away — and they all still run entirely in your browser.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-6 py-3 font-semibold text-white transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            <i className="fa-solid fa-house mr-2" aria-hidden="true"></i>
            Back to Home
          </Link>
          <Link
            to="/all-tools"
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            <i className="fa-solid fa-grid-2 mr-2" aria-hidden="true"></i>
            Browse all 70 tools
          </Link>
        </div>

        <div className="mt-12 text-left">
          <h2 className="font-sora text-lg font-semibold text-white mb-4 text-center">
            Popular tools
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((tool) => (
              <li key={tool.path}>
                <Link
                  to={tool.path}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                >
                  <i className={`fa-solid ${tool.icon} text-sky-400`} aria-hidden="true"></i>
                  <span className="font-inter text-sm text-slate-200">{tool.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
