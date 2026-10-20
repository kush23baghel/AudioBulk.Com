import { useState, useMemo, useId } from 'react';
import ToolFrame from '../../ui/ToolFrame';
import { Card } from '../../ui/controls';

const FAQS = [
  { q: 'How is the percentage worked out?', a: 'We list the different words in each text, ignoring capital letters and punctuation. The score is how many words both texts share, out of all the different words used in either.' },
  { q: 'Does word order matter?', a: 'No. "The cat sat" and "sat the cat" score 100%. This tool compares which words are used, not how they are arranged.' },
  { q: 'Can it catch copied work?', a: 'It is a quick guide only. A high score means the texts use mostly the same words. It cannot prove anyone copied anything.' },
  { q: 'Is my text uploaded?', a: 'No. The comparison happens in your browser.' },
];

const WORD_RE = /[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu;
const wordsOf = (t) => (t.toLowerCase().match(WORD_RE) || []);

function compare(a, b) {
  const A = new Set(wordsOf(a));
  const B = new Set(wordsOf(b));
  if (A.size === 0 || B.size === 0) return null;
  const common = new Set([...A].filter((w) => B.has(w)));
  const union = new Set([...A, ...B]).size;
  return { percent: Math.round((common.size / union) * 100), common };
}

function meaning(p) {
  if (p >= 90) return 'Almost the same';
  if (p >= 70) return 'Very similar';
  if (p >= 40) return 'Some words in common';
  if (p > 0) return 'Mostly different';
  return 'Nothing in common';
}

function Highlighted({ text, common }) {
  const bits = text.split(/([\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*)/u);
  return (
    <p className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-cream p-3 text-[15px] text-ink">
      {bits.map((b, i) => (i % 2 === 1 && common.has(b.toLowerCase())
        ? <mark key={i} className="rounded bg-wine-soft px-0.5 text-ink">{b}</mark>
        : b))}
    </p>
  );
}

export default function TextSimilarity() {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const idA = useId();
  const idB = useId();
  const result = useMemo(() => compare(a, b), [a, b]);
  const area = 'block w-full rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine';

  return (
    <ToolFrame
      path="/tools/text-similarity"
      name="Text Similarity Checker"
      title="See how similar two texts are"
      intro="Paste one text in each box. You will get a score and see which words they share."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-2">
            <label htmlFor={idA} className="text-lg font-bold">First text</label>
            <textarea id={idA} value={a} onChange={(e) => setA(e.target.value)} rows={8} placeholder="Paste first text here..." className={area} />
          </Card>
          <Card className="space-y-2">
            <label htmlFor={idB} className="text-lg font-bold">Second text</label>
            <textarea id={idB} value={b} onChange={(e) => setB(e.target.value)} rows={8} placeholder="Paste second text here..." className={area} />
          </Card>
        </div>

        <Card className="space-y-4">
          {result ? (
            <>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1" role="status">
                <div><span className="text-6xl font-extrabold text-wine">{result.percent}</span><span className="text-2xl font-bold text-wine">%</span></div>
                <p className="text-xl font-bold text-ink">{meaning(result.percent)}</p>
              </div>
              <p className="text-sm text-muted">
                How we worked it out: we compared the different words in each text, ignoring capital letters and punctuation. The score is the shared words divided by all the different words used. Word order is not counted.
              </p>
              {result.common.size > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5"><h2 className="text-sm font-semibold text-ink">Words in common, in the first text</h2><Highlighted text={a} common={result.common} /></div>
                  <div className="space-y-1.5"><h2 className="text-sm font-semibold text-ink">Words in common, in the second text</h2><Highlighted text={b} common={result.common} /></div>
                </div>
              )}
            </>
          ) : (
            <p className="text-[15px] text-muted">Paste some text into both boxes to see how similar they are.</p>
          )}
        </Card>
      </div>
    </ToolFrame>
  );
}
