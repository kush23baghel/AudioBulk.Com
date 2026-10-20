import { useState } from 'react';
import { saveAs } from 'file-saver';
import { downloadFiles } from '../lib/download';
import { Music, Film, Image, FileText, Download, X, LoaderCircle, CircleCheck, CircleAlert, Headphones, Info, TriangleAlert, Eye } from 'lucide-react';
import { describeAudio } from '../lib/audioInfo';
import { describeVideo } from '../lib/videoInfo';
import AudioPreview from './AudioPreview';

// How a result can be previewed, from its file name.
const PREVIEW = [
  { kind: 'video', test: /\.(mp4|webm|mov|mkv|ogv|m4v)$/i, label: 'Watch', Icon: Eye },
  { kind: 'image', test: /\.(png|jpe?g|webp|gif)$/i, label: 'View', Icon: Eye },
  { kind: 'audio', test: /\.(mp3|wav|m4a|aac|ogg|opus|flac)$/i, label: 'Listen', Icon: Headphones },
];
const previewFor = (name) => PREVIEW.find((p) => p.test.test(name));

function FileIcon({ file }) {
  const type = file?.type || '';
  const props = { size: 17, 'aria-hidden': true };
  if (type.startsWith('video/')) return <Film {...props} />;
  if (type.startsWith('image/')) return <Image {...props} />;
  if (type.startsWith('audio/')) return <Music {...props} />;
  return <FileText {...props} />;
}

function formatSize(bytes) {
  if (!bytes) return '0 KB';
  const units = ['bytes', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const n = bytes / Math.pow(1024, i);
  return `${n >= 10 || i === 0 ? Math.round(n) : n.toFixed(1)} ${units[i]}`;
}

// One status label per file, always with words (not color alone).
export function StatusPill({ item, workingWord }) {
  if (item.status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-wine">
        <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
        {workingWord}… {item.progress}%
      </span>
    );
  }
  if (item.status === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-0.5 text-sm font-semibold text-ok">
        <CircleCheck size={14} aria-hidden="true" /> Done
      </span>
    );
  }
  if (item.status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-bad-soft px-2.5 py-0.5 text-sm font-semibold text-bad">
        <CircleAlert size={14} aria-hidden="true" /> Didn't work
      </span>
    );
  }
  if (item.status === 'queued') {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
        <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> Waiting for another job…
      </span>
    );
  }
  return <span className="text-sm text-muted">Waiting</span>;
}

// A plain note about this file, shown before processing (from the tool's own checks).
function FileNote({ note }) {
  if (!note) return null;
  const warn = note.tone === 'warn';
  const Icon = warn ? TriangleAlert : Info;
  return (
    <p className={`mt-1.5 flex items-start gap-1.5 text-sm ${warn ? 'text-bad' : 'text-muted'}`}>
      <Icon size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {note.text}
    </p>
  );
}

function FileRow({ item, info, note, workingWord, onRemove, onDownloaded, busy }) {
  const [listening, setListening] = useState(false);
  const previewOut = item.outputs?.find((o) => previewFor(o.name));
  const preview = previewOut && previewFor(previewOut.name);
  const facts = [formatSize(item.size), info?.isVideo ? describeVideo(info) : describeAudio(info)].filter(Boolean).join(' · ');
  const outputs = item.outputs || [];
  const images = outputs.filter((o) => previewFor(o.name)?.kind === 'image');
  const allImages = outputs.length > 0 && images.length === outputs.length;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand text-wine">
        <FileIcon file={item.file} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium" title={item.name}>{item.name}</p>
        <p className="text-xs text-muted">{facts}</p>
        {item.status !== 'error' && item.status !== 'done' && <FileNote note={note} />}
        {item.status === 'error' && item.errorMsg && <p className="mt-1 text-sm text-bad">{item.errorMsg}</p>}
        {item.status === 'processing' && (
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-wine transition-[width]" style={{ width: `${item.progress}%` }} />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
        <StatusPill item={item} workingWord={workingWord} />
        {preview && (
          <button
            type="button"
            onClick={() => setListening((l) => !l)}
            aria-expanded={listening}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-sm font-semibold transition-colors ${
              listening ? 'border-wine bg-wine text-paper' : 'border-line-strong text-wine hover:bg-sand'
            }`}
          >
            <preview.Icon size={14} aria-hidden="true" /> {preview.label}
          </button>
        )}
        {/* One result: a format chip. Many results: ONE zip button, never a chip per result
            (37 chips from a long video once ran off the page). */}
        {outputs.length === 1 && (
          <button
            type="button"
            onClick={() => { saveAs(outputs[0].url, outputs[0].name); onDownloaded?.([outputs[0].url]); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-2.5 py-1 text-sm font-semibold text-wine hover:bg-sand"
            title={`Download ${outputs[0].name}`}
          >
            <Download size={14} aria-hidden="true" />
            {outputs[0].name.split('.').pop().toUpperCase()}
          </button>
        )}
        {outputs.length > 1 && (
          <button
            type="button"
            onClick={() => { downloadFiles(outputs, `${item.name.replace(/\.[^.]+$/, '') || 'files'}_audiobulk.zip`); onDownloaded?.(outputs.map((o) => o.url)); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-2.5 py-1 text-sm font-semibold text-wine hover:bg-sand"
            title={`Download all ${outputs.length} as one .zip`}
          >
            <Download size={14} aria-hidden="true" />
            {outputs.length} {allImages ? 'pictures' : 'files'} (.zip)
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={busy}
          className="rounded-lg p-1.5 text-muted hover:bg-sand hover:text-ink disabled:opacity-30"
          aria-label={`Remove ${item.name}`}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      {listening && preview && (
        <div className="basis-full">
          {preview.kind === 'audio' && <AudioPreview url={previewOut.url} label={previewOut.name} />}
          {preview.kind === 'video' && (
            <video src={previewOut.url} controls playsInline className="max-h-80 w-full rounded-xl border border-line bg-ink" aria-label={`Preview of ${previewOut.name}`} />
          )}
          {preview.kind === 'image' && (
            <div className="flex flex-wrap items-center gap-2">
              {images.slice(0, 12).map((o) => (
                <img key={o.url} src={o.url} alt={o.name} loading="lazy" className="h-24 max-w-full rounded-lg border border-line object-contain" />
              ))}
              {images.length > 12 && (
                <span className="rounded-lg bg-sand px-3 py-2 text-sm font-semibold text-wine">+{images.length - 12} more in the download</span>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function FileList({ queue, infos = {}, notes = {}, workingWord, onRemove, onDownloaded, busy }) {
  return (
    <ul className="divide-y divide-line">
      {queue.map((item) => (
        <FileRow key={item.id} item={item} info={infos[item.id]} note={notes[item.id]} workingWord={workingWord} onRemove={onRemove} onDownloaded={onDownloaded} busy={busy && item.status === 'processing'} />
      ))}
    </ul>
  );
}
