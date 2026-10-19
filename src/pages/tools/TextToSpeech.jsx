import { useState, useEffect, useId } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card } from '../../ui/controls';

const FAQS = [
  {
    q: 'Can I save the speech as an audio file?',
    a: "No. Your browser reads the text out loud; it can't save it as a file. If you need a file, you could record your computer's sound with a screen recorder while it plays.",
  },
  {
    q: 'Why does the list of voices look different on my phone and my computer?',
    a: 'The voices come from your device, not from this site. Different phones, computers and browsers come with different voices and languages.',
  },
  {
    q: 'Is my text sent anywhere?',
    a: "The text is read by your device's own speech engine. This page does not upload it. Some browsers may use an online voice if you pick one that says it is online.",
  },
  {
    q: 'The voice list is empty. What can I do?',
    a: 'Try again in a few seconds, since some browsers load voices slowly. If it stays empty, try Chrome, Edge or Safari, or add a voice in your device language settings.',
  },
];

function RangeSlider({ label, value, onChange, low, high, min, max, step }) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="ab-range"
        style={{ '--fill': `${fill}%` }}
      />
      <div className="flex justify-between text-xs text-muted">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

export default function TextToSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  const [text, setText] = useState('');
  const [voices, setVoices] = useState([]);
  const [voiceName, setVoiceName] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [status, setStatus] = useState('idle'); // idle | speaking | paused
  const [error, setError] = useState('');
  const textId = useId();
  const voiceId = useId();

  useEffect(() => {
    if (!supported) return undefined;
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const list = synth.getVoices();
      setVoices(list);
      setVoiceName((current) => current || (list.length > 0 ? list[0].name : ''));
    };
    loadVoices();
    synth.onvoiceschanged = loadVoices;
    return () => {
      synth.onvoiceschanged = null;
      synth.cancel();
    };
  }, [supported]);

  const play = () => {
    if (!text.trim()) { setError('Type or paste some text first.'); return; }
    setError('');
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.name === voiceName);
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle');
    utterance.onerror = (e) => {
      setStatus('idle');
      if (e.error !== 'canceled' && e.error !== 'interrupted') {
        setError('Your browser could not read this out loud. Try another voice.');
      }
    };
    synth.speak(utterance);
  };

  const pause = () => { window.speechSynthesis.pause(); setStatus('paused'); };
  const resume = () => { window.speechSynthesis.resume(); setStatus('speaking'); };
  const stop = () => { window.speechSynthesis.cancel(); setStatus('idle'); };

  const inputStyle = 'w-full rounded-lg border border-line-strong bg-cream px-4 py-2.5 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine';

  return (
    <ToolFrame
      path="/tools/text-to-speech"
      name="Text to Speech"
      title="Hear your text read out loud"
      intro="Type or paste some text, pick a voice, and press Play. Your device reads it to you."
      faqs={FAQS}
    >
      {!supported ? (
        <Card>
          <p className="text-ink">
            This browser can&apos;t read text out loud. Try the latest Chrome, Edge or Safari.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Type your text</h2>
            <label htmlFor={textId} className="sr-only">Text to read</label>
            <textarea
              id={textId}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              placeholder="Type or paste your text here..."
              className={`${inputStyle} resize-y`}
            />
            <p className="text-sm text-muted">{text.length.toLocaleString()} characters</p>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Pick a voice</h2>
            {voices.length === 0 ? (
              <p className="text-sm text-muted">
                No voices found yet. Some browsers need a few seconds to load them. If this stays empty, your device has no voices installed.
              </p>
            ) : (
              <>
                <label htmlFor={voiceId} className="sr-only">Voice</label>
                <select
                  id={voiceId}
                  value={voiceName}
                  onChange={(e) => setVoiceName(e.target.value)}
                  className={inputStyle}
                >
                  {voices.map((v) => (
                    <option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} ({v.lang})</option>
                  ))}
                </select>
              </>
            )}
          </Card>

          <Card className="space-y-6">
            <h2 className="text-lg font-bold"><span className="mr-2 text-wine">3</span>Set the speed and tone</h2>
            <RangeSlider label="Speed" value={rate} onChange={setRate} low="Slower" high="Faster" min={0.5} max={2} step={0.1} />
            <RangeSlider label="Voice tone" value={pitch} onChange={setPitch} low="Lower" high="Higher" min={0.5} max={2} step={0.1} />
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-bold"><span className="mr-2 text-wine">4</span>Listen</h2>
            <div className="flex flex-wrap gap-3">
              <Button onClick={play} disabled={voices.length === 0}>
                <Play size={18} aria-hidden="true" />
                {status === 'idle' ? 'Play' : 'Play again'}
              </Button>
              {status === 'paused' ? (
                <Button variant="secondary" onClick={resume}>
                  <Play size={18} aria-hidden="true" />
                  Resume
                </Button>
              ) : (
                <Button variant="secondary" onClick={pause} disabled={status !== 'speaking'}>
                  <Pause size={18} aria-hidden="true" />
                  Pause
                </Button>
              )}
              <Button variant="quiet" onClick={stop} disabled={status === 'idle'}>
                <Square size={18} aria-hidden="true" />
                Stop
              </Button>
            </div>
            <p className="text-sm text-muted" role="status">
              {status === 'speaking' && 'Reading out loud...'}
              {status === 'paused' && 'Paused.'}
              {status === 'idle' && 'This reads the text out loud. It does not make an audio file.'}
            </p>
            {error && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{error}</p>}
          </Card>
        </div>
      )}
    </ToolFrame>
  );
}
