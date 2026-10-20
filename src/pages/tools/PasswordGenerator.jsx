import { useState, useMemo, useRef, useId } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card } from '../../ui/controls';

const FAQS = [
  { q: 'Is this password really random?', a: 'Yes. It uses your browser\'s secure random number generator, the same kind used for encryption, and it avoids the small bias that simple methods have.' },
  { q: 'Is my password saved or sent anywhere?', a: 'No. It is made on your device and disappears when you close or refresh the page. Save it in a password manager.' },
  { q: 'How long should a password be?', a: 'At least 14 characters is good. 16 or more, with letters, numbers and symbols, is very strong. Longer is always better than clever.' },
  { q: 'What does "avoid look-alikes" do?', a: 'It leaves out characters that are easy to mix up when reading, such as 0 and O, or l, 1 and I. Handy if you have to type the password by hand.' },
];

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/',
};
const LOOKALIKE = /[0OoIl1|]/g;

// Random integer in [0, max) with no modulo bias: throw away values from the uneven tail.
function randomInt(max, cryptoObj = globalThis.crypto) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  let v;
  do {
    cryptoObj.getRandomValues(buf);
    v = buf[0];
  } while (v >= limit);
  return v % max;
}

function makePassword({ length, letters, numbers, symbols, noLookalikes }) {
  const clean = (str) => (noLookalikes ? str.replace(LOOKALIKE, '') : str);
  const groups = [];
  if (letters) groups.push(clean(SETS.lower), clean(SETS.upper));
  if (numbers) groups.push(clean(SETS.digits));
  if (symbols) groups.push(SETS.symbols);
  if (groups.length === 0) return '';
  const pool = groups.join('');
  const out = groups.slice(0, length).map((g) => g[randomInt(g.length)]); // one from each chosen kind
  while (out.length < length) out.push(pool[randomInt(pool.length)]);
  for (let i = out.length - 1; i > 0; i--) { // Fisher-Yates shuffle
    const j = randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join('');
}

function poolSize(o) {
  const clean = (str) => (o.noLookalikes ? str.replace(LOOKALIKE, '') : str);
  let n = 0;
  if (o.letters) n += clean(SETS.lower).length + clean(SETS.upper).length;
  if (o.numbers) n += clean(SETS.digits).length;
  if (o.symbols) n += SETS.symbols.length;
  return n;
}

function crackTime(bits) {
  const seconds = Math.pow(2, bits) / 2 / 1e10; // average case, 10 billion guesses a second
  if (seconds < 1) return 'less than a second';
  const units = [['year', 31557600], ['day', 86400], ['hour', 3600], ['minute', 60], ['second', 1]];
  if (seconds > 31557600 * 1e9) return 'longer than the age of the universe';
  for (const [name, size] of units) {
    if (seconds >= size) {
      const n = seconds / size;
      if (name === 'year' && n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} million years`;
      if (name === 'year' && n >= 1000) return `${Math.round(n).toLocaleString()} years`;
      const r = Math.round(n);
      return `about ${r.toLocaleString()} ${name}${r === 1 ? '' : 's'}`;
    }
  }
  return 'less than a second';
}

function strength(bits) {
  if (bits < 40) return { label: 'Weak', pct: 20, color: 'bg-bad' };
  if (bits < 60) return { label: 'Okay', pct: 45, color: 'bg-wine' };
  if (bits < 80) return { label: 'Strong', pct: 70, color: 'bg-wine' };
  return { label: 'Very strong', pct: 100, color: 'bg-ok' };
}

export default function PasswordGenerator() {
  const [opts, setOpts] = useState({ length: 16, letters: true, numbers: true, symbols: true, noLookalikes: false });
  const [password, setPassword] = useState(() => makePassword({ length: 16, letters: true, numbers: true, symbols: true, noLookalikes: false }));
  const [many, setMany] = useState([]);
  const [copied, setCopied] = useState('');
  const [note, setNote] = useState('');
  const timer = useRef(null);
  const lenId = useId();

  const bits = useMemo(() => {
    const n = poolSize(opts);
    return n > 1 ? opts.length * Math.log2(n) : 0;
  }, [opts]);
  const st = strength(bits);
  const none = !opts.letters && !opts.numbers && !opts.symbols;

  const update = (patch) => {
    const next = { ...opts, ...patch };
    setOpts(next);
    setMany([]);
    setPassword(makePassword(next));
  };

  const copy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value);
      setNote('');
      setCopied(key);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(''), 1800);
    } catch {
      setNote('Your browser blocked copying. Select the text and press Ctrl+C instead.');
    }
  };

  const toggles = [
    ['letters', 'Letters (a-z, A-Z)'],
    ['numbers', 'Numbers (0-9)'],
    ['symbols', 'Symbols (!@#$...)'],
    ['noLookalikes', 'Avoid look-alikes (0/O, l/1)'],
  ];

  return (
    <ToolFrame
      path="/tools/password-generator"
      name="Password Generator"
      title="Make a strong, random password"
      intro="A new password is ready for you. Pick how long it should be and what it can contain, then copy it."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Your password</h2>
          <div className="flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 select-all break-all rounded-lg bg-cream px-4 py-3 font-mono text-lg text-ink" aria-live="polite">
              {none ? 'Choose at least one kind of character below' : password}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" disabled={none} onClick={() => setPassword(makePassword(opts))}>
                <RefreshCw size={18} aria-hidden="true" />New password
              </Button>
              <Button disabled={none} onClick={() => copy(password, 'main')}>
                <Copy size={18} aria-hidden="true" />{copied === 'main' ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>
          {note && <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink" role="status">{note}</p>}
          {!none && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-semibold text-ink">{st.label}</span>
                <span className="text-muted">Would take a computer {crackTime(bits)} to guess</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-sunken" role="img" aria-label={`Password strength: ${st.label}`}>
                <div className={`h-full rounded-full transition-[width] duration-200 ${st.color}`} style={{ width: `${st.pct}%` }} />
              </div>
              <p className="text-xs text-muted">This is an estimate that assumes a very fast attacker making 10 billion guesses a second.</p>
            </div>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Settings</h2>
          <div className="space-y-2">
            <label htmlFor={lenId} className="text-sm font-semibold text-ink">Length: {opts.length} characters</label>
            <input
              id={lenId}
              type="range"
              min={8}
              max={64}
              step={1}
              value={opts.length}
              onChange={(e) => update({ length: Number(e.target.value) })}
              className="ab-range"
              style={{ '--fill': `${((opts.length - 8) / 56) * 100}%` }}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {toggles.map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-3 rounded-lg bg-cream px-4 py-2.5 text-[15px] text-ink">
                <input type="checkbox" checked={opts[key]} onChange={(e) => update({ [key]: e.target.checked })} className="size-4 accent-[var(--color-wine)]" />
                {label}
              </label>
            ))}
          </div>
          {none && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">Turn on letters, numbers or symbols so there is something to make a password from.</p>}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Need a few to choose from?</h2>
          <Button variant="secondary" disabled={none} onClick={() => setMany(Array.from({ length: 5 }, () => makePassword(opts)))}>
            Make 5 more
          </Button>
          {many.length > 0 && (
            <ul className="space-y-2">
              {many.map((p, i) => (
                <li key={`${i}-${p}`} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 select-all break-all rounded-lg bg-cream px-3 py-2 font-mono text-[15px] text-ink">{p}</span>
                  <Button variant="quiet" onClick={() => copy(p, `m${i}`)}>{copied === `m${i}` ? 'Copied' : 'Copy'}</Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </ToolFrame>
  );
}
