// "Your AI key" settings. Opens from the header or the "open-ai-settings" window event.
// Keeps the same localStorage keys as before, so people who already saved a key keep it.
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import Dialog from './Dialog';
import { Button } from './controls';

const KEY = 'openRouterApiKey';
const MODEL = 'openRouterModel';
const DEFAULT_MODEL = 'meta-llama/llama-3-8b-instruct:free';

function read(name, fallback = '') {
  try { return localStorage.getItem(name) || fallback; } catch { return fallback; }
}

function SettingsForm({ onDone }) {
  const [apiKey, setApiKey] = useState(() => read(KEY));
  const [model, setModel] = useState(() => read(MODEL, DEFAULT_MODEL));
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem(KEY, apiKey.trim());
      localStorage.setItem(MODEL, model.trim() || DEFAULT_MODEL);
    } catch { /* storage blocked: nothing we can do */ }
    setSaved(true);
    window.dispatchEvent(new Event('ai-settings-changed'));
    setTimeout(onDone, 700);
  };

  const remove = () => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setApiKey('');
    window.dispatchEvent(new Event('ai-settings-changed'));
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <p className="text-[15px] text-muted">
        The AI writing tools use <b className="text-ink">OpenRouter</b>, a service that connects to many AI models.
        Get a free key at{' '}
        <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="font-semibold text-wine underline underline-offset-2">openrouter.ai/keys</a>
        {' '}and paste it here.
      </p>

      <div className="space-y-2">
        <label htmlFor="ai-key" className="block font-semibold">Your AI key</label>
        <div className="flex items-center rounded-lg border border-line-strong bg-cream focus-within:outline focus-within:outline-3 focus-within:outline-wine">
          <input
            id="ai-key"
            type={show ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-…"
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent px-3 py-2.5 font-mono text-sm outline-none"
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="px-3 text-muted hover:text-ink" aria-label={show ? 'Hide key' : 'Show key'}>
            {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        </div>
        <p className="text-sm text-muted">Saved only in this browser. It is sent only to OpenRouter, never to us.</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="ai-model" className="block font-semibold">AI model <span className="font-normal text-muted">(optional)</span></label>
        <input
          id="ai-model"
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          spellCheck={false}
          className="w-full rounded-lg border border-line-strong bg-cream px-3 py-2.5 font-mono text-sm outline-none focus:outline focus:outline-3 focus:outline-wine"
        />
        <p className="text-sm text-muted">Leave this as it is unless you know which model you want.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">{saved ? <><Check size={17} aria-hidden="true" /> Saved</> : 'Save'}</Button>
        {apiKey && <Button variant="quiet" onClick={remove}>Remove my key</Button>}
      </div>
    </form>
  );
}

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('open-ai-settings', show);
    return () => window.removeEventListener('open-ai-settings', show);
  }, []);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="AI settings">
      <SettingsForm onDone={() => setOpen(false)} />
    </Dialog>
  );
}
