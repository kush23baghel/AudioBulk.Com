// The page template for every "pick settings → add files → process → download" tool.
// A tool page only describes its settings and how to process one file; this module does the rest:
// numbered steps, file list, progress and downloads, inside the shared ToolFrame.
import { useEffect } from 'react';
import { saveAs } from 'file-saver';
import { readAudioInfo } from '../lib/audioInfo';
import { Download, Lock, RotateCcw, ArrowRight, LoaderCircle } from 'lucide-react';
import useBulkProcessor from '../hooks/useBulkProcessor';
import { jobStore, useJobsSummary } from '../lib/jobStore';
import { toolsList } from '../data/tools';
import { downloadFiles } from '../lib/download';
import { Button, Card } from './controls';
import DropZone from './DropZone';
import FileList from './FileList';
import ToolFrame from './ToolFrame';

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
const KEEP_WARN = 1024 ** 3; // over 1 GB of finished files kept in memory: suggest downloading and clearing

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
  // Optional check run on each file's details before processing, using the current settings:
  // (info, file) => ({ tone: 'warn' | 'info', text }) | null. info comes from readInfo below.
  inspect,
  // How to read a file's details: readAudioInfo (default) or readVideoInfo from src/lib/videoInfo.js.
  readInfo = readAudioInfo,
}) {
  // The files and jobs live in the shared job store (src/lib/jobStore.js), not in this page,
  // so they keep running, and stay here, while you use other tools.
  const { queue, isProcessing, addFiles, removeFile, clearQueue, processQueue, markDownloaded } = useBulkProcessor(path);
  const { running, keptBytes } = useJobsSummary();

  // Read every added file's details once (length, format, quality, channels).
  useEffect(() => { jobStore.readInfos(path, readInfo); }, [queue, path, readInfo]);
  const infos = Object.fromEntries(queue.map((item) => [item.id, item.info]));

  const notes = {};
  if (inspect) {
    queue.forEach((item) => {
      if (item.info) notes[item.id] = inspect(item.info, item.file) || null;
    });
  }

  // processFile gets the file's details as a third argument (may be { ok: false } for unusual files).
  const run = (forceAll) => processQueue(processFile, forceAll);

  const waiting = queue.filter((i) => i.status === 'pending').length;
  const done = queue.filter((i) => i.status === 'done').length;
  const failed = queue.filter((i) => i.status === 'error').length;
  const outputs = queue.flatMap((i) => i.outputs || []);
  const finished = queue.length > 0 && waiting === 0 && !isProcessing;
  const zipName = `audiobulk-${path.split('/').pop()}.zip`;
  // Our files are waiting while another tool's job runs.
  const behindOther = queue.some((i) => i.status === 'queued') && running && running.path !== path;
  const otherName = running && toolsList.find((t) => t.path === running.path)?.name;

  const downloadAll = () => {
    if (outputs.length === 1) saveAs(outputs[0].url, outputs[0].name);
    else downloadFiles(outputs, zipName);
    markDownloaded(outputs.map((o) => o.url));
  };

  return (
    <ToolFrame path={path} name={name} title={title} intro={intro} faqs={faqs}>
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
                <FileList queue={queue} infos={infos} notes={notes} workingWord={verb.working} onRemove={removeFile} onDownloaded={markDownloaded} busy={isProcessing} />
                <DropZone onFiles={addFiles} accept={accept} compact disabled={isProcessing} />
              </div>
            )}
          </Step>
        </ol>

        {queue.length > 0 && (
          <div className="space-y-4 border-t border-line pt-6">
            {behindOther && (
              <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink" role="status">
                Waiting: {otherName ? `${otherName} is` : 'another tool is'} finishing a job first. Yours starts right after, even if you open another page.
              </p>
            )}
            {keptBytes > KEEP_WARN && (
              <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink">
                You're keeping {(keptBytes / 1024 ** 3).toFixed(1)} GB of finished files in this tab. Download them and press "Start over" to free up memory.
              </p>
            )}
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
                <Button onClick={() => run(false)}>
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
                <Button variant="secondary" onClick={() => run(true)}>
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
          {queue.length > 0 && ' You can open other tools while this works. Finished files stay here until you close this tab.'}
        </p>
      </Card>
    </ToolFrame>
  );
}
