import { useState, useEffect, useId } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card, ChoiceChips } from '../../ui/controls';

const FAQS = [
  {
    q: 'Is this AI?',
    a: 'No. It does not think or guess. It simply joins the words you type, in the order and style you choose. That is all a good ad name needs.',
  },
  {
    q: 'Why bother with naming rules?',
    a: 'After a few months you may have hundreds of ads. If every name follows the same pattern, you can sort, search and compare them in your reports. "spring-sale_women-25-34_feed_2026-03_v2" tells you far more than "New ad copy 7".',
  },
  {
    q: 'Which separator should I use?',
    a: 'Pick one and always use the same. Underscores and dashes both work. Avoid spaces and special symbols, because some reports and web addresses handle them badly.',
  },
  {
    q: 'Where are my saved names kept?',
    a: 'Only in this browser on this device. If you clear your browser data they are gone, so use Copy all to keep a copy somewhere safe.',
  },
];

const STORE = 'audiobulk-ad-names';
const FIELDS = [
  { key: 'campaign', label: 'Campaign', placeholder: 'Spring Sale' },
  { key: 'audience', label: 'Audience', placeholder: 'Women 25-34' },
  { key: 'placement', label: 'Placement', placeholder: 'Feed' },
  { key: 'date', label: 'Date', placeholder: '2026-03' },
  { key: 'version', label: 'Version', placeholder: 'v1' },
  { key: 'custom', label: 'Custom (anything else)', placeholder: 'Video A' },
];

const SEPARATORS = { underscore: '_', dash: '-', dot: '.', none: '' };

function applyCase(word, style) {
  if (style === 'lower') return word.toLowerCase();
  if (style === 'upper') return word.toUpperCase();
  if (style === 'title') return word.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  return word;
}

// Builds a name from the filled fields. Spaces inside a field become the separator too.
function buildName(values, sep, style) {
  const s = SEPARATORS[sep];
  const joiner = sep === 'none' ? '' : s;
  return FIELDS.map((f) => values[f.key].trim())
    .filter(Boolean)
    .map((v) => {
      const cased = applyCase(v.replace(/[^\p{L}\p{N}\s.-]/gu, ''), style);
      return sep === 'none' ? cased.replace(/\s+/g, '') : cased.replace(/\s+/g, s);
    })
    .filter(Boolean)
    .join(joiner);
}

function loadSaved() {
  try {
    const list = JSON.parse(localStorage.getItem(STORE) || '[]');
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function AiNamingAds() {
  const [values, setValues] = useState({ campaign: 'Spring Sale', audience: 'Women 25-34', placement: 'Feed', date: '2026-03', version: 'v1', custom: '' });
  const [sep, setSep] = useState('underscore');
  const [style, setStyle] = useState('lower');
  const [saved, setSaved] = useState(loadSaved);
  const [note, setNote] = useState('');
  const idBase = useId();

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(saved)); } catch { /* storage blocked */ }
  }, [saved]);

  const name = buildName(values, sep, style);

  const copy = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      setNote(message);
    } catch {
      setNote('Copying is blocked in this browser. Select the text and copy it by hand.');
    }
    setTimeout(() => setNote(''), 2500);
  };

  const save = () => {
    if (!name) { setNote('Fill in at least one field first.'); return; }
    if (saved.includes(name)) { setNote('That name is already in your list.'); return; }
    setSaved([...saved, name]);
    setNote('Saved to your list.');
  };

  const inputStyle = 'block w-full rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine';

  return (
    <ToolFrame
      path="/tools/ai-naming-ads"
      name="Ad Name Builder"
      title="Build neat, matching names for your ads"
      intro="Fill in the boxes and get a clean name that follows the same pattern every time. This tool does not use AI. It just joins your words."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Fill in the parts</h2>
          <p className="text-sm text-muted">Leave a box empty to skip it. Good names say what the ad is, who sees it, where it shows and which version it is.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <label htmlFor={`${idBase}${f.key}`} className="text-sm font-semibold text-ink">{f.label}</label>
                <input
                  id={`${idBase}${f.key}`}
                  className={inputStyle}
                  placeholder={f.placeholder}
                  value={values[f.key]}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Choose the style</h2>
          <ChoiceChips
            label="Put between the parts"
            options={[
              { value: 'underscore', label: 'Underscore _' },
              { value: 'dash', label: 'Dash -' },
              { value: 'dot', label: 'Dot .' },
              { value: 'none', label: 'Nothing' },
            ]}
            value={sep}
            onChange={setSep}
          />
          <ChoiceChips
            label="Letters"
            options={[
              { value: 'lower', label: 'all lowercase' },
              { value: 'upper', label: 'ALL CAPS' },
              { value: 'title', label: 'Title Case' },
              { value: 'keep', label: 'As I typed' },
            ]}
            value={style}
            onChange={setStyle}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">3</span>Your ad name</h2>
          <p className="break-all rounded-lg bg-sunken px-4 py-3 font-mono text-[15px] text-ink" aria-live="polite">
            {name || 'Your name will show here'}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={!name} onClick={() => copy(name, 'Copied')}><Copy size={18} aria-hidden="true" />Copy name</Button>
            <Button variant="secondary" disabled={!name} onClick={save}><Plus size={18} aria-hidden="true" />Save to list</Button>
          </div>
          <p className="min-h-5 text-sm font-semibold text-ok" role="status">{note}</p>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">4</span>Saved names ({saved.length})</h2>
          {saved.length === 0 ? (
            <p className="text-sm text-muted">Nothing saved yet. Press Save to list to keep a name here.</p>
          ) : (
            <>
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {saved.map((s) => (
                  <li key={s} className="flex items-center gap-2 rounded-lg bg-paper px-3 py-2">
                    <span className="min-w-0 flex-1 break-all font-mono text-sm">{s}</span>
                    <button type="button" aria-label={`Copy ${s}`} className="rounded p-1 text-wine hover:bg-sand" onClick={() => copy(s, 'Copied')}><Copy size={16} aria-hidden="true" /></button>
                    <button type="button" aria-label={`Remove ${s}`} className="rounded p-1 text-bad hover:bg-sand" onClick={() => setSaved(saved.filter((x) => x !== s))}><Trash2 size={16} aria-hidden="true" /></button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => copy(saved.join('\n'), 'Copied all names')}><Copy size={18} aria-hidden="true" />Copy all</Button>
                <Button variant="quiet" onClick={() => setSaved([])}>Clear list</Button>
              </div>
            </>
          )}
        </Card>

        <Card className="space-y-2">
          <h2 className="text-lg font-bold">Naming tips</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
            <li>Use the same order every time, so names line up when you sort them.</li>
            <li>Keep each part short. Long names get cut off in Ads Manager.</li>
            <li>Use dates like 2026-03 (year first), so they sort in the right order.</li>
            <li>Change the version (v1, v2) when you change the ad, so you know which one won.</li>
          </ul>
        </Card>
      </div>
    </ToolFrame>
  );
}
