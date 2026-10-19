import { Link } from 'react-router-dom';
import { Search, ArrowRight, Lock, Ban, UserRoundX, Check } from 'lucide-react';
import { toolCategories, toolsList } from '../data/tools';
import useRecentTools from '../hooks/useRecentTools';
import SeoMeta from '../components/SeoMeta';
import { Card } from '../ui/controls';
import { ToolIcon } from '../ui/icons';

const QUICK = [
  { label: 'Convert audio', id: 'bulk-audio-converter' },
  { label: 'Trim a video', id: 'video-trimmer' },
  { label: 'Make a GIF', id: 'video-to-gif' },
  { label: 'Remove vocals', id: 'vocal-remover' },
  { label: 'Write a story', id: 'ai-story-generator' },
];

const POPULAR = [
  'bulk-audio-converter', 'bulk-video-compressor', 'video-trimmer', 'video-to-gif',
  'bulk-video-to-audio', 'vocal-remover', 'ai-story-generator', 'word-counter',
];

const byId = (id) => toolsList.find((t) => t.id === id);
const openSearch = () => window.dispatchEvent(new Event('open-command-palette'));

function ToolLink({ tool }) {
  return (
    <Link to={tool.path} className="group flex items-start gap-3 rounded-xl border border-line bg-paper p-4 transition-colors hover:border-line-strong hover:bg-sand/50">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sand text-wine">
        <ToolIcon name={tool.icon} size={19} />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold group-hover:text-wine">{tool.name}</span>
        <span className="block text-sm text-muted">{tool.desc}</span>
      </span>
    </Link>
  );
}

// A small, static picture of a real tool, so visitors see what using AudioBulk looks like.
function ToolPreview() {
  return (
    <div aria-hidden="true" className="rounded-2xl border border-line bg-paper p-5 shadow-[0_1px_0_rgb(127_1_31/0.05)]">
      <p className="text-xs font-semibold uppercase tracking-wider text-wine">Bulk Audio Converter</p>
      <div className="mt-4 space-y-4 text-sm">
        <div className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-wine text-xs font-bold text-paper">1</span>
          <div className="space-y-2">
            <p className="font-semibold">Pick a format</p>
            <div className="flex flex-wrap gap-1.5">
              {['MP3', 'M4A', 'WAV', 'FLAC'].map((f, i) => (
                <span key={f} className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${i === 0 ? 'border-wine bg-wine text-paper' : 'border-line bg-cream'}`}>{f}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-wine text-xs font-bold text-paper">2</span>
          <div className="w-full space-y-2">
            <p className="font-semibold">Add your files</p>
            {['podcast-episode-12.wav', 'interview.m4a', 'voice-note.ogg'].map((f) => (
              <div key={f} className="flex items-center justify-between gap-2 rounded-lg bg-cream px-3 py-2">
                <span className="truncate">{f}</span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok"><Check size={12} /> Done</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-wine px-4 py-2.5 text-center font-semibold text-paper">Download all (3) as .zip</div>
      </div>
    </div>
  );
}

export default function Home() {
  const { recentTools } = useRecentTools();
  const recent = recentTools.map((r) => toolsList.find((t) => t.path === r.path)).filter(Boolean);
  const total = toolsList.length;

  return (
    <>
      <SeoMeta />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <h1 className="text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-[3.6rem]">
            Free tools for audio, video, GIFs and writing.
          </h1>
          <p className="max-w-xl text-lg text-muted sm:text-xl">
            {total} tools that work right in your browser. No ads, no sign-up, and your files never leave your computer.
          </p>

          <button
            type="button"
            onClick={openSearch}
            className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-line-strong bg-paper px-4 py-3.5 text-left text-lg text-muted shadow-[0_1px_0_rgb(127_1_31/0.05)] hover:border-wine/40"
          >
            <Search size={21} className="text-wine" aria-hidden="true" />
            <span className="flex-1">What do you want to do?</span>
            <kbd className="hidden rounded border border-line px-1.5 text-xs sm:inline">Ctrl K</kbd>
          </button>

          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => {
              const t = byId(q.id);
              return t && (
                <Link key={q.id} to={t.path} className="rounded-full border border-line bg-cream px-4 py-1.5 text-sm font-semibold hover:border-line-strong hover:bg-sand">
                  {q.label}
                </Link>
              );
            })}
          </div>
        </div>
        <ToolPreview />
      </section>

      <div className="mx-auto max-w-6xl space-y-20 px-4 pb-24 sm:px-6">
        {/* Recently used */}
        {recent.length > 0 && (
          <section className="space-y-4" aria-labelledby="recent-title">
            <h2 id="recent-title" className="text-2xl font-bold">Recently used</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recent.slice(0, 6).map((t) => <ToolLink key={t.id} tool={t} />)}
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="space-y-6" aria-labelledby="types-title">
          <div className="space-y-2">
            <h2 id="types-title" className="text-3xl font-bold">Browse by type</h2>
            <p className="text-lg text-muted">Pick what you're working with.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {toolCategories.map((cat) => {
              const count = toolsList.filter((t) => t.categoryId === cat.id).length;
              return (
                <Link
                  key={cat.id}
                  to={`/all-tools?cat=${cat.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-line bg-paper p-6 transition-colors hover:border-line-strong hover:bg-sand/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sand text-wine">
                      <ToolIcon name={cat.icon} size={21} />
                    </span>
                    <span className="text-sm font-semibold text-muted">{count} tools</span>
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-wine">{cat.title}</h3>
                  <p className="text-muted">{cat.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Popular */}
        <section className="space-y-6" aria-labelledby="popular-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="popular-title" className="text-3xl font-bold">Most popular</h2>
            <Link to="/all-tools" className="inline-flex items-center gap-1 font-semibold text-wine hover:underline">
              See all {total} tools <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {POPULAR.map(byId).filter(Boolean).map((t) => <ToolLink key={t.id} tool={t} />)}
          </div>
        </section>

        {/* How it works */}
        <section className="space-y-6" aria-labelledby="how-title">
          <h2 id="how-title" className="text-3xl font-bold">How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {[
              ['Pick a tool and your settings', 'Choose what you want, like MP3 at good quality. Everything is explained in plain words.'],
              ['Add your files', 'Drop in one file or a hundred. They are processed on your own computer, one after another.'],
              ['Download the results', 'Save each file, or get them all at once in a single .zip.'],
            ].map(([title, text], i) => (
              <li key={title} className="space-y-2 rounded-2xl border border-line bg-paper p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-wine text-sm font-bold text-paper" aria-hidden="true">{i + 1}</span>
                <h3 className="pt-1 text-lg font-bold">{title}</h3>
                <p className="text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Promise */}
        <section aria-labelledby="promise-title" className="rounded-2xl bg-wine px-6 py-10 text-paper sm:px-10">
          <h2 id="promise-title" className="max-w-2xl text-3xl font-bold">No ads. Ever.</h2>
          <p className="mt-3 max-w-2xl text-lg text-paper/85">
            Many free tool sites load hundreds of ads and trackers on every page. AudioBulk loads none, because your own computer does the work and we have no servers to pay for.
          </p>
          <ul className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              [Lock, 'Nothing is uploaded', 'Your files stay on your computer from start to finish.'],
              [Ban, 'No ads or trackers', 'Just the tool you came for.'],
              [UserRoundX, 'No sign-up', 'No account, no email, no limits.'],
            ].map(([Icon, title, text]) => (
              <li key={title} className="space-y-1.5">
                <Icon size={22} aria-hidden="true" />
                <p className="font-semibold">{title}</p>
                <p className="text-paper/80">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Closing */}
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Not sure where to start?</h2>
            <p className="text-muted">Look through every tool, sorted by type.</p>
          </div>
          <Link to="/all-tools" className="inline-flex items-center gap-2 rounded-lg bg-wine px-5 py-3 font-semibold text-paper hover:bg-wine-deep">
            See all {total} tools <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </Card>
      </div>
    </>
  );
}
