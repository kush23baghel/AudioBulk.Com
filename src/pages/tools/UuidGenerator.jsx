import { useState, useRef, useId } from 'react';
import { Copy, Download } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card } from '../../ui/controls';

const FAQS = [
  { q: 'What is a UUID?', a: 'A UUID is a long random ID, like 3b241101-e2bb-4255-8caf-4136c566a962. It is used to give things (users, orders, files) a name that nobody else will ever pick.' },
  { q: 'Could two of them be the same?', a: 'In practice, no. The chance is so tiny it can be ignored, even if you make billions.' },
  { q: 'Which version is this?', a: 'Version 4, the random kind. It is the most common one for databases and apps.' },
  { q: 'Are they sent anywhere?', a: 'No. They are made in your browser and are not saved or uploaded.' },
];

function uuidV4() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  const b = globalThis.crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function build(count, upper, noDashes) {
  const list = [];
  for (let i = 0; i < count; i++) {
    let id = uuidV4();
    if (noDashes) id = id.replace(/-/g, '');
    list.push(upper ? id.toUpperCase() : id);
  }
  return list;
}

export default function UuidGenerator() {
  const [count, setCount] = useState('5');
  const [upper, setUpper] = useState(false);
  const [noDashes, setNoDashes] = useState(false);
  const [ids, setIds] = useState(() => build(1, false, false));
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState('');
  const timer = useRef(null);
  const countId = useId();

  const generate = () => {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      setError('Please enter a whole number from 1 to 1000.');
      return;
    }
    setError('');
    setIds(build(n, upper, noDashes));
  };

  // Changing a format option re-formats what is already shown, so the list never goes stale.
  const reformat = (nextUpper, nextNoDashes) => {
    setIds((list) => list.map((id) => {
      const base = id.toLowerCase();
      const dashed = nextNoDashes ? base.replace(/-/g, '') : (base.includes('-') ? base : `${base.slice(0, 8)}-${base.slice(8, 12)}-${base.slice(12, 16)}-${base.slice(16, 20)}-${base.slice(20)}`);
      return nextUpper ? dashed.toUpperCase() : dashed;
    }));
  };

  const text = ids.join('\n');

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setNote('');
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setNote('Your browser blocked copying. Select the list and press Ctrl+C instead.');
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([`${text}\n`], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'uuids.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <ToolFrame
      path="/tools/uuid-generator"
      name="UUID Generator"
      title="Make random unique IDs (UUIDs)"
      intro="Choose how many you need, press Generate, then copy the list or save it as a text file."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Settings</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label htmlFor={countId} className="text-sm font-semibold text-ink">How many (1 to 1000)</label>
              <input
                id={countId}
                type="number"
                min={1}
                max={1000}
                value={count}
                onChange={(e) => setCount(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') generate(); }}
                className="block w-32 rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-cream px-4 py-2.5 text-[15px] text-ink">
              <input type="checkbox" checked={upper} onChange={(e) => { setUpper(e.target.checked); reformat(e.target.checked, noDashes); }} className="size-4 accent-[var(--color-wine)]" />
              Capital letters
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-cream px-4 py-2.5 text-[15px] text-ink">
              <input type="checkbox" checked={noDashes} onChange={(e) => { setNoDashes(e.target.checked); reformat(upper, e.target.checked); }} className="size-4 accent-[var(--color-wine)]" />
              No dashes
            </label>
            <Button onClick={generate}>Generate</Button>
          </div>
          {error && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{error}</p>}
        </Card>

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Your IDs ({ids.length})</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={copyAll}>
                <Copy size={18} aria-hidden="true" />{copied ? 'Copied' : 'Copy all'}
              </Button>
              <Button variant="secondary" onClick={download}>
                <Download size={18} aria-hidden="true" />Save as .txt
              </Button>
            </div>
          </div>
          {note && <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink" role="status">{note}</p>}
          <div className="max-h-80 overflow-y-auto whitespace-pre rounded-lg bg-cream p-4 font-mono text-sm text-ink select-all overflow-x-auto" tabIndex={0} aria-label="Generated UUIDs">{text}</div>
        </Card>
      </div>
    </ToolFrame>
  );
}
