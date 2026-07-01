import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TextToSpeech() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      setSelectedVoice((current) => current ?? (v.length > 0 ? v[0] : null));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = () => {
    if (!text.trim()) { setError('Please enter some text first.'); return; }
    if (!window.speechSynthesis) { setError('Your browser does not support speech synthesis.'); return; }
    setError('');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => { setIsSpeaking(false); setError('Speech synthesis failed.'); };
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools?cat=audio" className="hover:text-white transition-colors">Audio Tools</Link></li>
          <li className="text-sky-600 font-medium">Text to Speech</li>
        </ul>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-volume-low text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Text to Speech</h1>
          <p className="text-slate-400 text-sm">Convert text to spoken audio using your browser&apos;s built-in speech engine.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm text-red-400"><i className="fa-solid fa-circle-exclamation mr-2"></i>{error}</p>
        </div>
      )}

      <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Enter text to speak..."
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-y"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Voice</label>
          <select
            value={selectedVoice?.name ?? ''}
            onChange={(e) => setSelectedVoice(voices.find((v) => v.name === e.target.value) ?? null)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Speed: {rate.toFixed(1)}x</label>
            <input
              type="range" min={0.5} max={2} step={0.1} value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="range range-xs range-sky w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Pitch: {pitch.toFixed(1)}</label>
            <input
              type="range" min={0.5} max={2} step={0.1} value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="range range-xs range-sky w-full"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={speak}
            disabled={isSpeaking}
            className="flex-1 btn bg-sky-500 hover:bg-sky-600 border-0 text-white font-semibold rounded-xl gap-2"
          >
            <i className="fa-solid fa-play"></i>
            {isSpeaking ? 'Speaking...' : 'Speak'}
          </button>
          <button
            onClick={stop}
            className="btn bg-slate-200 hover:bg-slate-300 border-0 text-white font-semibold rounded-xl gap-2"
          >
            <i className="fa-solid fa-stop"></i>
            Stop
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-5 flex items-start gap-3">
        <i className="fa-solid fa-shield-halved text-emerald-600 text-xl mt-0.5"></i>
        <div>
          <p className="text-sm font-semibold text-white">100% Private</p>
          <p className="text-xs text-slate-400 mt-1">Speech is synthesized locally in your browser. No text is sent to any server.</p>
        </div>
      </div>
    </div>
  );
}
