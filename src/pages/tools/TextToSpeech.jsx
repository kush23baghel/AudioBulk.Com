import { useState, useEffect, useId, useRef } from 'react';
import { Play, Pause, Square, Download } from 'lucide-react';
import AudioPreview from '../../ui/AudioPreview';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card } from '../../ui/controls';

const FAQS = [
  {
    q: 'Can I save the speech as an audio file?',
    a: 'Yes, with the AI voice. Choose "AI voice" at the top, press Make audio, then Download WAV. The device voice can\'t be saved, because your browser only reads it out loud.',
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

const MODEL_ID = 'onnx-community/Kokoro-82M-v1.0-ONNX';
const HAS_GPU = typeof navigator !== 'undefined' && !!navigator.gpu;
// Real file sizes of onnx-community/Kokoro-82M-v1.0-ONNX (fp32 model.onnx 310.5 MB, q8 model_quantized.onnx 88.1 MB) plus voice data.
const MODEL_MB = { gpu: 311, cpu: 88 };
const AI_VOICES = [
  ['af_heart', 'Heart (female, US)'],
  ['af_bella', 'Bella (female, US)'],
  ['af_nicole', 'Nicole (female, US)'],
  ['af_sarah', 'Sarah (female, US)'],
  ['am_michael', 'Michael (male, US)'],
  ['am_fenrir', 'Fenrir (male, US)'],
  ['am_puck', 'Puck (male, US)'],
  ['bf_emma', 'Emma (female, UK)'],
  ['bm_george', 'George (male, UK)'],
  ['bm_fable', 'Fable (male, UK)'],
];
const MAX_CHUNK = 300;

// Split into sentences, then pack them into pieces the model can handle.
function splitText(text) {
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [];
  const chunks = [];
  let current = '';
  const push = (piece) => {
    if (current && `${current} ${piece}`.length > MAX_CHUNK) { chunks.push(current); current = ''; }
    current = current ? `${current} ${piece}` : piece;
  };
  sentences.forEach((raw) => {
    let sentence = raw.trim();
    while (sentence.length > MAX_CHUNK) {
      let cut = sentence.lastIndexOf(' ', MAX_CHUNK);
      if (cut < 50) cut = MAX_CHUNK;
      push(sentence.slice(0, cut).trim());
      sentence = sentence.slice(cut).trim();
    }
    if (sentence) push(sentence);
  });
  if (current) chunks.push(current);
  return chunks;
}

function encodeWav(parts, sampleRate) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const buffer = new ArrayBuffer(44 + total * 2);
  const view = new DataView(buffer);
  const write = (offset, str) => { for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i)); };
  write(0, 'RIFF');
  view.setUint32(4, 36 + total * 2, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, total * 2, true);
  let offset = 44;
  parts.forEach((part) => {
    for (let i = 0; i < part.length; i += 1) {
      const v = Math.max(-1, Math.min(1, part[i]));
      view.setInt16(offset, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      offset += 2;
    }
  });
  return new Blob([buffer], { type: 'audio/wav' });
}

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
  const [mode, setMode] = useState('device'); // device | ai
  const [aiVoice, setAiVoice] = useState('af_heart');
  const [aiPhase, setAiPhase] = useState('idle'); // idle | loading | making
  const [loadPct, setLoadPct] = useState(0);
  const [makePct, setMakePct] = useState(0);
  const [aiUrl, setAiUrl] = useState('');
  const [aiBlob, setAiBlob] = useState(null);
  const [aiError, setAiError] = useState('');
  // Whether a real graphics card is usable (decides which AI voice download size to mention).
  const [gpuUsable, setGpuUsable] = useState(false);
  useEffect(() => {
    if (!HAS_GPU) return;
    navigator.gpu.requestAdapter().then((a) => setGpuUsable(Boolean(a))).catch(() => {});
  }, []);
  const [modelReady, setModelReady] = useState(false);
  const ttsRef = useRef(null);
  const aiUrlRef = useRef('');
  const aiVoiceId = useId();

  useEffect(() => () => { if (aiUrlRef.current) URL.revokeObjectURL(aiUrlRef.current); }, []);

  const clearAiResult = () => {
    if (aiUrlRef.current) URL.revokeObjectURL(aiUrlRef.current);
    aiUrlRef.current = '';
    setAiUrl('');
    setAiBlob(null);
  };

  const loadModel = async () => {
    if (ttsRef.current) return ttsRef.current;
    const { KokoroTTS } = await import('kokoro-js');
    const files = {};
    const progress_callback = (p) => {
      if (p && p.status === 'progress' && p.file && p.total) {
        files[p.file] = { loaded: p.loaded, total: p.total };
        const all = Object.values(files);
        const loaded = all.reduce((n, f) => n + f.loaded, 0);
        const total = all.reduce((n, f) => n + f.total, 0);
        setLoadPct(Math.min(100, Math.round((loaded / total) * 100)));
      }
    };
    let tts = null;
    // navigator.gpu can exist without a usable graphics card, so ask for a real adapter first.
    const adapter = HAS_GPU ? await navigator.gpu.requestAdapter().catch(() => null) : null;
    if (adapter) {
      try {
        tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'fp32', device: 'webgpu', progress_callback });
      } catch {
        tts = null;
      }
    }
    if (!tts) {
      tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: 'q8', device: 'wasm', progress_callback });
    }
    ttsRef.current = tts;
    setModelReady(true);
    return tts;
  };

  const makeAi = async () => {
    if (!text.trim()) { setAiError('Type or paste some text first.'); return; }
    setAiError('');
    clearAiResult();
    setMakePct(0);
    try {
      let tts = ttsRef.current;
      if (!tts) {
        setAiPhase('loading');
        setLoadPct(0);
        tts = await loadModel();
      }
      setAiPhase('making');
      const chunks = splitText(text);
      const parts = [];
      let rate = 24000;
      for (let i = 0; i < chunks.length; i += 1) {
        const audio = await tts.generate(chunks[i], { voice: aiVoice });
        parts.push(audio.audio);
        rate = audio.sampling_rate || rate;
        setMakePct(Math.round(((i + 1) / chunks.length) * 100));
      }
      const blob = encodeWav(parts, rate);
      const url = URL.createObjectURL(blob);
      aiUrlRef.current = url;
      setAiBlob(blob);
      setAiUrl(url);
    } catch (err) {
      const msg = String((err && err.message) || err).toLowerCase();
      if (ttsRef.current) {
        setAiError('The AI voice stopped while making your audio. Try a shorter text, or use the device voice instead.');
      } else if (/memory|alloc|oom/.test(msg)) {
        setAiError('Your device does not have enough memory for the AI voice. Please use the device voice instead.');
      } else {
        setAiError('The AI voice could not be downloaded. Check your internet connection and try again, or use the device voice instead.');
      }
    }
    setAiPhase('idle');
  };

  const downloadAi = () => {
    if (!aiBlob) return;
    const a = document.createElement('a');
    a.href = aiUrl;
    a.download = 'speech.wav';
    a.click();
  };

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
      <div className="mb-6 flex flex-wrap gap-3" role="group" aria-label="Voice type">
        <Button variant={mode === 'device' ? 'primary' : 'secondary'} onClick={() => setMode('device')} aria-pressed={mode === 'device'}>
          Device voice (instant)
        </Button>
        <Button variant={mode === 'ai' ? 'primary' : 'secondary'} onClick={() => setMode('ai')} aria-pressed={mode === 'ai'}>
          AI voice (more natural, can be saved)
        </Button>
      </div>
      {mode === 'ai' ? (
        <div className="space-y-6">
          <Card className="space-y-3">
            <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Type your text</h2>
            <label htmlFor={textId} className="sr-only">Text to turn into audio</label>
            <textarea
              id={textId}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={7}
              placeholder="Type or paste your text here..."
              className={`${inputStyle} resize-y`}
            />
            <p className="text-sm text-muted">{text.length.toLocaleString()} characters. Long text is cut into sentences and joined back into one file.</p>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Pick a voice</h2>
            <label htmlFor={aiVoiceId} className="sr-only">AI voice</label>
            <select id={aiVoiceId} value={aiVoice} onChange={(e) => setAiVoice(e.target.value)} className={inputStyle}>
              {AI_VOICES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <p className="text-sm text-muted">These voices speak English.</p>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-bold"><span className="mr-2 text-wine">3</span>Make the audio</h2>
            {!modelReady && (
              <p className="text-sm text-muted">
                The first time, your browser downloads the AI voice: about {gpuUsable ? MODEL_MB.gpu : MODEL_MB.cpu} MB, only the first time. After that it works from your device. Your text is not uploaded.
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={makeAi} disabled={aiPhase !== 'idle'}>
                {aiPhase === 'idle' ? 'Make audio' : 'Working...'}
              </Button>
            </div>
            <p className="text-sm text-muted" role="status">
              {aiPhase === 'loading' && `Downloading the AI voice... ${loadPct}%`}
              {aiPhase === 'making' && `Making your audio... ${makePct}%`}
            </p>
            {aiError && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{aiError}</p>}
            {aiUrl && (
              <div className="space-y-3">
                <AudioPreview url={aiUrl} label="AI voice" />
                <Button onClick={downloadAi}>
                  <Download size={18} aria-hidden="true" />
                  Download WAV
                </Button>
              </div>
            )}
          </Card>
        </div>
      ) : !supported ? (
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
