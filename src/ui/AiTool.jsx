// One page for every AI writing tool. Each tool is just data in src/data/aiTools.js:
// title, intro, input label, example, option chips, how to build the prompt, FAQs.
import { useEffect, useRef, useState } from 'react';
import { Sparkles, Copy, Check, RotateCcw, Square, KeyRound, LoaderCircle } from 'lucide-react';
import { aiTools } from '../data/aiTools';
import { toolsList } from '../data/tools';
import { generateAIResponse } from '../lib/openrouter';
import useAiKeyStatus from '../hooks/useAiKeyStatus';
import ToolFrame from './ToolFrame';
import { Button, Card, ChoiceChips } from './controls';

const openSettings = () => window.dispatchEvent(new Event('open-ai-settings'));
const MAX_INPUT = 6000;

// Tiny, safe Markdown view (headings, bullets, numbered lists, **bold**). No HTML injection.
function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

function ResultText({ text }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = /^\s*[-*•]\s+(.*)/.exec(line);
    const numbered = /^\s*(\d+)[.)]\s+(.*)/.exec(line);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) { list = { ordered, items: [], key: i }; blocks.push(list); }
      list.items.push(bullet ? bullet[1] : numbered[2]);
      return;
    }
    list = null;
    const heading = /^#{1,6}\s+(.*)/.exec(line);
    if (heading) blocks.push({ heading: heading[1], key: i });
    else if (line.trim()) blocks.push({ para: line, key: i });
  });
  return blocks.map((b) => {
    if (b.items) {
      const Tag = b.ordered ? 'ol' : 'ul';
      return <Tag key={b.key} className={`ml-5 space-y-1 ${b.ordered ? 'list-decimal' : 'list-disc'}`}>{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</Tag>;
    }
    if (b.heading) return <h3 key={b.key} className="pt-2 text-lg font-bold text-ink">{b.heading.replace(/\*\*/g, '')}</h3>;
    return <p key={b.key}><Inline text={b.para} /></p>;
  });
}

export default function AiTool({ id }) {
  const def = aiTools[id];
  const tool = toolsList.find((t) => t.id === id);
  const hasKey = useAiKeyStatus();
  const [input, setInput] = useState('');
  const [opts, setOpts] = useState(() => Object.fromEntries((def?.options || []).map((g) => [g.id, g.default ?? g.choices[0]?.value])));
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  if (!def || !tool) return null;

  const generate = async () => {
    if (!input.trim()) { setError('Type what you want first, or press "Try an example".'); return; }
    setError('');
    setResult('');
    setBusy(true);
    abortRef.current = new AbortController();
    try {
      const { system, user } = def.buildPrompt(input.trim(), opts);
      setResult(await generateAIResponse(user, system, abortRef.current.signal));
    } catch (err) {
      if (err.message !== 'Stopped.') setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { setError('Copying was blocked by your browser. Select the text and copy it by hand.'); }
  };

  const onKeyDown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !busy) generate(); };

  return (
    <ToolFrame path={tool.path} name={tool.name} title={def.title} intro={def.intro} faqs={def.faqs}>
      {!hasKey && (
        <Card className="flex flex-col gap-3 border-wine/30 bg-wine-soft/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wine text-paper"><KeyRound size={17} aria-hidden="true" /></span>
            <div>
              <p className="font-semibold">Add your free AI key to use this tool</p>
              <p className="text-sm text-muted">It takes a minute, it's free, and it's saved only in this browser.</p>
            </div>
          </div>
          <Button onClick={openSettings}>Add AI key</Button>
        </Card>
      )}

      <Card className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <label htmlFor={`ai-input-${id}`} className="text-lg font-bold">{def.inputLabel}</label>
            <button type="button" onClick={() => setInput(def.example)} className="text-sm font-semibold text-wine hover:underline">Try an example</button>
          </div>
          <textarea
            id={`ai-input-${id}`}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
            onKeyDown={onKeyDown}
            placeholder={def.placeholder}
            rows={5}
            className="w-full resize-y rounded-xl border border-line-strong bg-cream px-4 py-3 text-[15px] outline-none placeholder:text-muted focus:border-wine/60 focus:shadow-lift"
          />
          <p className="text-xs text-muted">{input.length.toLocaleString()} / {MAX_INPUT.toLocaleString()} characters · Ctrl + Enter to generate</p>
        </div>

        {(def.options || []).map((g) => (
          <div key={g.id} className="space-y-2">
            <p className="font-semibold">{g.label}</p>
            <ChoiceChips label={g.label} options={g.choices} value={opts[g.id]} onChange={(v) => setOpts((o) => ({ ...o, [g.id]: v }))} />
          </div>
        ))}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={generate} disabled={busy}>
            {busy ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
            {busy ? 'Writing…' : 'Generate'}
          </Button>
          {busy && <Button variant="quiet" onClick={() => abortRef.current?.abort()}><Square size={15} aria-hidden="true" /> Stop</Button>}
        </div>
        {error && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
      </Card>

      {(busy || result) && (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">Your result</h2>
            {result && !busy && (
              <div className="flex gap-2">
                <Button variant="secondary" onClick={copy}>{copied ? <><Check size={16} aria-hidden="true" /> Copied</> : <><Copy size={16} aria-hidden="true" /> Copy</>}</Button>
                <Button variant="secondary" onClick={generate}><RotateCcw size={16} aria-hidden="true" /> Try again</Button>
              </div>
            )}
          </div>
          <div data-lenis-prevent="" className="max-h-[32rem] space-y-3 overflow-y-auto rounded-xl bg-cream px-4 py-3 text-[15px] leading-relaxed text-ink/90" aria-live="polite">
            {busy ? <p className="flex items-center gap-2 text-muted"><LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> The AI is writing. This usually takes 5–20 seconds.</p> : <ResultText text={result} />}
          </div>
        </Card>
      )}
    </ToolFrame>
  );
}
