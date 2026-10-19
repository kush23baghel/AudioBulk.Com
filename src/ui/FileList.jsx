import { saveAs } from 'file-saver';
import { Music, Film, Image, FileText, Download, X, LoaderCircle, CircleCheck, CircleAlert } from 'lucide-react';

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
  return <span className="text-sm text-muted">Waiting</span>;
}

function FileRow({ item, workingWord, onRemove, busy }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand text-wine">
        <FileIcon file={item.file} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium" title={item.name}>{item.name}</p>
        <p className="text-xs text-muted">{formatSize(item.size)}</p>
        {item.status === 'error' && item.errorMsg && <p className="mt-1 text-sm text-bad">{item.errorMsg}</p>}
        {item.status === 'processing' && (
          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-wine transition-[width]" style={{ width: `${item.progress}%` }} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <StatusPill item={item} workingWord={workingWord} />
        {item.outputs?.map((out) => (
          <button
            key={out.url}
            type="button"
            onClick={() => saveAs(out.url, out.name)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-2.5 py-1 text-sm font-semibold text-wine hover:bg-sand"
            title={`Download ${out.name}`}
          >
            <Download size={14} aria-hidden="true" />
            {out.name.split('.').pop().toUpperCase()}
          </button>
        ))}
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
    </li>
  );
}

export default function FileList({ queue, workingWord, onRemove, busy }) {
  return (
    <ul className="divide-y divide-line">
      {queue.map((item) => (
        <FileRow key={item.id} item={item} workingWord={workingWord} onRemove={onRemove} busy={busy} />
      ))}
    </ul>
  );
}
