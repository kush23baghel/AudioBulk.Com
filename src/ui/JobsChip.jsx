// Header chip: shows a running job or finished files from any tool, so you can open other tools
// while something works. Hidden when there is nothing to show.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle, CircleCheck, ArrowRight } from 'lucide-react';
import { toolsList } from '../data/tools';
import { useJobsSummary } from '../lib/jobStore';
import Dialog from './Dialog';

const nameOf = (path) => toolsList.find((t) => t.path === path)?.name || 'A tool';
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function JobsChip() {
  const { running, waiting, ready, perTool } = useJobsSummary();
  const [open, setOpen] = useState(false);
  if (!running && !waiting && !ready) return null;

  const busy = Boolean(running || waiting);
  const text = running
    ? `${nameOf(running.path)} · ${running.progress}%${waiting ? ` · ${waiting} waiting` : ''}`
    : waiting
      ? `${plural(waiting, 'file')} waiting`
      : `${plural(ready, 'file')} ready`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Your jobs: ${text}`}
        title="Your jobs"
        className={`flex min-w-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
          busy ? 'border-wine/40 bg-wine-soft text-wine' : 'border-ok/40 bg-ok-soft text-ok'
        } hover:shadow-lift`}
      >
        {busy ? <LoaderCircle size={16} className="shrink-0 animate-spin" aria-hidden="true" /> : <CircleCheck size={16} className="shrink-0" aria-hidden="true" />}
        <span className="hidden max-w-[16rem] truncate md:inline" aria-live="polite">{text}</span>
        <span className="md:hidden">{running ? `${running.progress}%` : waiting || ready}</span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Your jobs">
        <p className="text-sm text-muted">Jobs keep running while you use other tools. Finished files stay until you close this tab.</p>
        <ul className="divide-y divide-line">
          {perTool.map((t) => (
            <li key={t.path}>
              <Link to={t.path} onClick={() => setOpen(false)} className="flex items-center gap-3 py-3 hover:text-wine">
                {t.working ? <LoaderCircle size={17} className="shrink-0 animate-spin text-wine" aria-hidden="true" /> : <CircleCheck size={17} className="shrink-0 text-ok" aria-hidden="true" />}
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{nameOf(t.path)}</span>
                  <span className="block text-sm text-muted">
                    {t.working
                      ? running?.path === t.path ? `Working · ${running.progress}%` : 'Waiting its turn'
                      : `${t.done} of ${plural(t.total, 'file')} done`}
                  </span>
                </span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
