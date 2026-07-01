import { useState } from 'react';

function SettingsForm({ onClose }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openRouterApiKey') || '');
  const [model, setModel] = useState(() => localStorage.getItem('openRouterModel') || 'meta-llama/llama-3-8b-instruct:free');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('openRouterApiKey', apiKey.trim());
    localStorage.setItem('openRouterModel', model.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="w-full max-w-md nav-glass rounded-2xl border border-white/10 p-6 md:p-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-sora font-bold text-white flex items-center gap-2">
          <i className="fa-solid fa-gear text-sky-400"></i> API Settings
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">OpenRouter API Key</label>
          <input
            type="password"
            placeholder="sk-or-v1-..."
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-sm"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-2">
            Your key is saved locally in your browser. It is never sent to our servers.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">AI Model</label>
          <input
            type="text"
            placeholder="meta-llama/llama-3-8b-instruct:free"
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all text-sm"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full btn-primary-glow flex justify-center items-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
        >
          {saved ? (
            <><i className="fa-solid fa-check"></i> Saved!</>
          ) : (
            'Save Settings'
          )}
        </button>
      </div>
    </div>
  );
}

export default function SettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <SettingsForm onClose={onClose} />
    </div>
  );
}
