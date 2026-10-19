import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Lock, Ban, UserRoundX, Check } from 'lucide-react';
import { toolCategories, toolsList } from '../data/tools';
import SeoMeta from '../components/SeoMeta';
import { Card } from '../ui/controls';
import { ToolCard, CategoryCard } from '../ui/ToolCard';
import { Reveal, StaggerList, StaggerItem } from '../ui/motion';

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

const PREVIEW_FILES = ['podcast-episode-12.wav', 'interview.m4a', 'voice-note.ogg'];
const EASE = [0.22, 1, 0.36, 1];

const byId = (id) => toolsList.find((t) => t.id === id);
const openSearch = () => window.dispatchEvent(new Event('open-command-palette'));

// A rounded panel in the deeper cream, so card grids stand out without full-width stripes.
function Band({ children }) {
  return (
    <div className="mx-auto max-w-[100rem] px-4 sm:px-6">
      <div className="rounded-3xl bg-sunken px-5 py-10 sm:px-8">{children}</div>
    </div>
  );
}

// A small picture of a real tool. On load each file "converts" and turns Done, one after another.
function ToolPreview() {
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
      className="rounded-2xl border border-line bg-paper p-5 shadow-lift"
    >
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
            {PREVIEW_FILES.map((f, i) => {
              const start = 0.6 + i * 0.55;
              return (
                <div key={f} className="relative overflow-hidden rounded-lg bg-cream px-3 py-2">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-sand"
                    initial={{ width: '0%' }}
                    animate={{ width: ['0%', '100%', '100%'], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.75, times: [0, 0.8, 1], ease: 'easeOut', delay: start }}
                  />
                  <div className="relative flex items-center justify-between gap-2">
                    <span className="truncate">{f}</span>
                    <motion.span
                      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, ease: EASE, delay: start + 0.6 }}
                    >
                      <Check size={12} /> Done
                    </motion.span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <motion.div
          className="rounded-lg bg-wine px-4 py-2.5 text-center font-semibold text-paper"
          initial={{ opacity: 0.35 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 + PREVIEW_FILES.length * 0.55 + 0.4 }}
        >
          Download all (3) as .zip
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const total = toolsList.length;

  return (
    <>
      <SeoMeta />

      {/* Hero */}
      <section className="mx-auto grid max-w-[100rem] items-center gap-10 px-4 pb-12 pt-10 sm:px-6 sm:pt-14 @4xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
        >
          <h1 className="text-4xl font-extrabold leading-[1.08] @2xl:text-5xl @5xl:text-[3.6rem]">
            Free tools for audio, video, GIFs and <span className="text-wine">writing.</span>
          </h1>
          <p className="max-w-xl text-lg text-muted sm:text-xl">
            {total} tools that work right in your browser. No ads, no sign-up, and your files never leave your computer.
          </p>

          <button
            type="button"
            onClick={openSearch}
            className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-line-strong bg-paper px-4 py-3.5 text-left text-lg text-muted transition-[border-color,box-shadow] duration-200 hover:border-wine/60 hover:shadow-lift"
          >
            <Search size={21} className="text-wine" aria-hidden="true" />
            <span className="flex-1">What do you want to do?</span>
            <kbd className="hidden rounded border border-line px-1.5 text-xs sm:inline">Ctrl K</kbd>
          </button>

          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => {
              const t = byId(q.id);
              return t && (
                <Link
                  key={q.id}
                  to={t.path}
                  viewTransition
                  className="rounded-full border border-line-strong bg-paper px-4 py-1.5 text-sm font-semibold transition-colors duration-200 hover:border-wine hover:bg-wine hover:text-paper active:scale-[0.97]"
                >
                  {q.label}
                </Link>
              );
            })}
          </div>
        </motion.div>
        <ToolPreview />
      </section>

      {/* Categories (recently used and favorites live in the right sidebar) */}
      <Band>
        <section className="space-y-6" aria-labelledby="types-title">
          <Reveal className="space-y-2">
            <h2 id="types-title" className="text-3xl font-bold">Browse by type</h2>
            <p className="text-lg text-muted">Pick what you're working with.</p>
          </Reveal>
          <StaggerList className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
            {toolCategories.map((cat) => (
              <StaggerItem key={cat.id}>
                <CategoryCard category={cat} count={toolsList.filter((t) => t.categoryId === cat.id).length} />
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      </Band>

      {/* Popular */}
      <section className="mx-auto max-w-[100rem] space-y-6 px-4 py-14 sm:px-6" aria-labelledby="popular-title">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="popular-title" className="text-3xl font-bold">Most popular</h2>
          <Link to="/all-tools" viewTransition className="group inline-flex items-center gap-1 font-semibold text-wine">
            See all {total} tools <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </Reveal>
        <StaggerList className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4">
          {POPULAR.map(byId).filter(Boolean).map((t) => <StaggerItem key={t.id}><ToolCard tool={t} /></StaggerItem>)}
        </StaggerList>
      </section>

      {/* How it works */}
      <Band>
        <section className="space-y-6" aria-labelledby="how-title">
          <Reveal><h2 id="how-title" className="text-3xl font-bold">How it works</h2></Reveal>
          <StaggerList className="grid gap-4 @3xl:grid-cols-3">
            {[
              ['Pick a tool and your settings', 'Choose what you want, like MP3 at good quality. Everything is explained in plain words.'],
              ['Add your files', 'Drop in one file or a hundred. They are processed on your own computer, one after another.'],
              ['Download the results', 'Save each file, or get them all at once in a single .zip.'],
            ].map(([title, text], i) => (
              <StaggerItem key={title} className="space-y-2 rounded-2xl border border-line bg-paper p-6">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-wine text-sm font-bold text-paper" aria-hidden="true">{i + 1}</span>
                <h3 className="pt-1 text-lg font-bold">{title}</h3>
                <p className="text-muted">{text}</p>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>
      </Band>

      <div className="mx-auto max-w-[100rem] space-y-12 px-4 pb-16 pt-14 sm:px-6">
        {/* Promise */}
        <Reveal as="section" aria-labelledby="promise-title" className="rounded-2xl bg-wine px-6 py-10 text-paper sm:px-10">
          <h2 id="promise-title" className="max-w-2xl text-3xl font-bold">No ads. Ever.</h2>
          <p className="mt-3 max-w-2xl text-lg text-paper/85">
            Many free tool sites load hundreds of ads and trackers on every page. AudioBulk loads none, because your own computer does the work and we have no servers to pay for.
          </p>
          <ul className="mt-8 grid gap-6 @2xl:grid-cols-3">
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
        </Reveal>

        {/* Closing */}
        <Reveal>
          <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Not sure where to start?</h2>
              <p className="text-muted">Look through every tool, sorted by type.</p>
            </div>
            <Link to="/all-tools" viewTransition className="group inline-flex items-center gap-2 rounded-lg bg-wine px-5 py-3 font-semibold text-paper transition-colors hover:bg-wine-deep active:scale-[0.98]">
              See all {total} tools <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Card>
        </Reveal>
      </div>
    </>
  );
}
