// The page template for every "add files → pick settings → process → download" tool.
// A tool page only describes its settings and how to process one file; this module does the rest:
// numbered steps, file list, progress, downloads, related tools, FAQ, SEO.
import { Link } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { Download, Lock, RotateCcw, ArrowRight, LoaderCircle } from 'lucide-react';
import useBulkProcessor from '../hooks/useBulkProcessor';
import { downloadFiles } from '../lib/download';
import { toolsList, toolCategories } from '../data/tools';
import SeoMeta from '../components/SeoMeta';
import { Button, Card } from './controls';
import DropZone from './DropZone';
import FileList from './FileList';
import Faq from './Faq';

function Step({ number, label, locked = false, children }) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)] gap-4">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-wine text-sm font-bold text-paper" aria-hidden="true">
        {number}
      </span>
      <div className="min-w-0 space-y-3">
        <h2 className="pt-0.5 text-lg font-bold">{label}</h2>
        {/* Settings can't change mid-batch; a disabled fieldset locks every control inside it. */}
        <fieldset disabled={locked} className="min-w-0">{children}</fieldset>
      </div>
    </li>
  );
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function BulkTool({
  path,
  name,
  title,
  intro,
  accept,
  dropHint,
  steps = [],
  processFile,
  verb = { action: 'Convert', working: 'Converting' },
  faqs = [],
}) {
  const { queue, isProcessing, addFiles, removeFile, clearQueue, processQueue } = useBulkProcessor();

  const tool = toolsList.find((t) => t.path === path);
  const category = toolCategories.find((c) => c.id === tool?.categoryId);
  const related = toolsList.filter((t) => t.categoryId === tool?.categoryId && t.path !== path).slice(0, 8);

  const waiting = queue.filter((i) => i.status === 'pending').length;
  const done = queue.filter((i) => i.status === 'done').length;
  const failed = queue.filter((i) => i.status === 'error').length;
  const outputs = queue.flatMap((i) => i.outputs || []);
  const finished = queue.length > 0 && waiting === 0 && !isProcessing;

  const downloadAll = () => {
    if (outputs.length === 1) saveAs(outputs[0].url, outputs[0].name);
    else downloadFiles(outputs, `audiobulk-${tool?.id || 'files'}.zip`);
  };

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
            <p className="max-w-2xl text-lg text-muted">{intro}</p>
          </header>

          <Card className="space-y-8">
            <ol className="space-y-8">
              {steps.map((s, i) => (
                <Step key={s.label} number={i + 1} label={s.label} locked={isProcessing}>{s.content}</Step>
              ))}
              <Step number={steps.length + 1} label="Add your files">
                {queue.length === 0 ? (
                  <DropZone onFiles={addFiles} accept={accept} hint={dropHint} />
                ) : (
                  <div className="space-y-3">
                    <FileList queue={queue} workingWord={verb.working} onRemove={removeFile} busy={isProcessing} />
                    <DropZone onFiles={addFiles} accept={accept} compact disabled={isProcessing} />
                  </div>
                )}
              </Step>
            </ol>

            {queue.length > 0 && (
              <div className="space-y-4 border-t border-line pt-6">
                {finished && done > 0 && (
                  <p className="font-semibold text-ok" role="status">
                    All done. {plural(done, 'file')} ready to download.
                    {failed > 0 && <span className="text-bad"> {plural(failed, 'file')} didn't work. The reason is shown next to each one.</span>}
                  </p>
                )}
                {finished && done === 0 && failed > 0 && (
                  <p className="font-semibold text-bad" role="status">
                    {failed === 1 ? "That file didn't work." : "Those files didn't work."} The reason is shown next to each file. Remove it and try a different file.
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {isProcessing ? (
                    <Button disabled>
                      <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
                      {verb.working} your files…
                    </Button>
                  ) : waiting > 0 ? (
                    <Button onClick={() => processQueue(processFile)}>
                      {verb.action} {plural(waiting, 'file')} <ArrowRight size={17} aria-hidden="true" />
                    </Button>
                  ) : (
                    done > 0 && (
                      <Button onClick={downloadAll}>
                        <Download size={17} aria-hidden="true" />
                        {outputs.length > 1 ? `Download all (${outputs.length}) as .zip` : 'Download'}
                      </Button>
                    )
                  )}
                  {finished && done > 0 && (
                    <Button variant="secondary" onClick={() => processQueue(processFile, true)}>
                      <RotateCcw size={16} aria-hidden="true" /> {verb.action} again with new settings
                    </Button>
                  )}
                  <Button variant="quiet" onClick={clearQueue}>
                    {isProcessing ? 'Stop and clear' : 'Start over'}
                  </Button>
                </div>
              </div>
            )}

            <p className="flex items-center gap-2 text-sm text-muted">
              <Lock size={15} className="shrink-0 text-wine" aria-hidden="true" />
              Your files stay on your computer. Nothing is uploaded.
            </p>
          </Card>

          <Faq items={faqs} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {related.length > 0 && (
            <Card className="space-y-3">
              <h2 className="text-base font-bold">More {category?.title.toLowerCase()}</h2>
              <ul className="-mx-2 space-y-0.5">
                {related.map((t) => (
                  <li key={t.path}>
                    <Link to={t.path} className="block rounded-lg px-2 py-1.5 text-[15px] text-ink hover:bg-sand hover:text-wine">
                      {t.name}
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
