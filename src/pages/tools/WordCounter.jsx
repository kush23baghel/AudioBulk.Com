import { useState, useEffect, useMemo, useId } from 'react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card } from '../../ui/controls';

const FAQS = [
  { q: 'How are words counted?', a: 'Anything separated by spaces or new lines counts as one word. So "well-known" is one word and "well known" is two.' },
  { q: 'How is reading time worked out?', a: 'We assume an adult reads about 238 words a minute and speaks about 150 words a minute. Your own pace may be faster or slower.' },
  { q: 'What are the top keywords?', a: 'The words you use most often, leaving out very common little words like "the" and "and". It helps you spot repeated words.' },
  { q: 'Is my text sent anywhere?', a: 'No. The counting happens in your browser and your text never leaves your device.' },
];

const STOP = new Set('the a an and or but if so of to in on at for with by from as is are was were be been it its this that these those i you he she we they them his her our your my me not no do does did have has had will would can could should than then there here what which who whom about into over also just very more most such'.split(' '));

const LIMITS = [
  { label: 'X (Twitter) post', max: 280 },
  { label: 'Instagram caption', max: 2200 },
  { label: 'Meta description (Google)', max: 160 },
];

function analyse(text) {
  const words = text.match(/\S+/g) || [];
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => /\S/.test(s)).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p) => /\S/.test(p)).length;
  const freq = new Map();
  for (const raw of text.toLowerCase().match(/[\p{L}\p{N}']+/gu) || []) {
    const w = raw.replace(/^'+|'+$/g, '');
    if (w.length < 3 || STOP.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const keywords = [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  return {
    words: words.length,
    chars: text.length,
    charsNoSpaces: text.replace(/\s/g, '').length,
    sentences,
    paragraphs,
    keywords,
  };
}

function minutes(words, wpm) {
  if (words === 0) return '0 sec';
  const secs = Math.max(1, Math.round((words / wpm) * 60));
  if (secs < 60) return `${secs} sec`;
  const m = Math.floor(secs / 60);
  return `${m} min ${secs % 60} sec`;
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-cream px-4 py-3">
      <p className="text-sm text-muted">{label}</p>
      <span className="text-2xl font-extrabold text-ink">{value}</span>
    </div>
  );
}

export default function WordCounter() {
  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const id = useId();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), 400);
    return () => clearTimeout(t);
  }, [text]);

  const s = useMemo(() => analyse(debounced), [debounced]);

  return (
    <ToolFrame
      path="/tools/word-counter"
      name="Word & Character Counter"
      title="Count the words and letters in your text"
      intro="Paste or type your text. You will see the counts, how long it takes to read, and whether it fits on social media."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <Card className="space-y-3">
          <label htmlFor={id} className="text-lg font-bold">Your text</label>
          <textarea
            id={id}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={9}
            placeholder="Paste or type your text here..."
            className="block w-full rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" disabled={!text} onClick={() => setText('')}>Clear text</Button>
            {!text && <p className="text-sm text-muted">Paste some text above to see the counts.</p>}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold">The counts</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Words" value={s.words} />
            <Stat label="Characters" value={s.chars} />
            <Stat label="Characters (no spaces)" value={s.charsNoSpaces} />
            <Stat label="Sentences" value={s.sentences} />
            <Stat label="Paragraphs" value={s.paragraphs} />
            <Stat label="Reading time" value={minutes(s.words, 238)} />
            <Stat label="Speaking time" value={minutes(s.words, 150)} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold">Does it fit?</h2>
          <div className="space-y-4">
            {LIMITS.map((l) => {
              const over = s.chars > l.max;
              const pct = Math.min(100, (s.chars / l.max) * 100);
              return (
                <div key={l.label} className="space-y-1.5">
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <span className="font-semibold text-ink">{l.label}</span>
                    <span className={over ? 'font-semibold text-bad' : 'text-muted'}>
                      {s.chars.toLocaleString()} of {l.max.toLocaleString()}
                      {over ? ` (${(s.chars - l.max).toLocaleString()} too many)` : ''}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-sunken" role="img" aria-label={`${l.label}: ${Math.round(pct)} percent of the limit used`}>
                    <div className={`h-full rounded-full ${over ? 'bg-bad' : 'bg-wine'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-lg font-bold">Words you use most</h2>
          {s.keywords.length === 0 ? (
            <p className="text-sm text-muted">Nothing to show yet. Add some text with a few longer words.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {s.keywords.map(([w, n]) => (
                <li key={w} className="rounded-full border border-line bg-cream px-3 py-1 text-sm text-ink">
                  {w} <span className="font-semibold text-wine">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </ToolFrame>
  );
}
