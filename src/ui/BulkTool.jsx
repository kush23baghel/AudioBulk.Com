// The page template for every "pick settings → add files → process → download" tool.
// A tool page only describes its settings and how to process one file; this module does the rest:
// numbered steps, file list, progress and downloads, inside the shared ToolFrame.
import { useEffect, useRef, useState } from 'react';
import { saveAs } from 'file-saver';
import { readAudioInfo } from '../lib/audioInfo';
import { Download, Lock, RotateCcw, ArrowRight, LoaderCircle } from 'lucide-react';
import useBulkProcessor from '../hooks/useBulkProcessor';
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
  const { queue, isProcessing, addFiles, removeFile, clearQueue, processQueue } = useBulkProcessor();

  // Read every added file's details once (length, format, quality, channels).
  const [infos, setInfos] = useState({});
  const infoByFile = useRef(new Map());
  const started = useRef(new Set());
  useEffect(() => {
    queue.filter((item) => item.file && !started.current.has(item.id)).forEach(async (item) => {
      started.current.add(item.id);
      const info = await readInfo(item.file);
      infoByFile.current.set(item.file, info);
      setInfos((prev) => ({ ...prev, [item.id]: info }));
    });
  }, [queue, readInfo]);

  const notes = {};
  if (inspect) {
    queue.forEach((item) => {
      const info = infos[item.id];
      if (info) notes[item.id] = inspect(info, item.file) || null;
    });
  }

  // processFile gets the file's details as a third argument (may be { ok: false } for unusual files).
  const run = (forceAll) => processQueue(
    (file, onProgress) => processFile(file, onProgress, infoByFile.current.get(file) || { ok: false }),
    forceAll,
  );

  const waiting = queue.filter((i) => i.status === 'pending').length;
  const done = queue.filter((i) => i.status === 'done').length;
  const failed = queue.filter((i) => i.status === 'error').length;
  const outputs = queue.flatMap((i) => i.outputs || []);
  const finished = queue.length > 0 && waiting === 0 && !isProcessing;
  const zipName = `audiobulk-${path.split('/').pop()}.zip`;

  const downloadAll = () => {
    if (outputs.length === 1) saveAs(outputs[0].url, outputs[0].name);
    else downloadFiles(outputs, zipName);
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
                <FileList queue={queue} infos={infos} notes={notes} workingWord={verb.working} onRemove={removeFile} busy={isProcessing} />
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
        </p>
      </Card>
    </ToolFrame>
  );
}
