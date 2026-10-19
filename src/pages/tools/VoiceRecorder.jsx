import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Pause, Play, Download, RotateCcw, AlertCircle } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card } from '../../ui/controls';

const FAQS = [
  { q: 'Is my voice uploaded anywhere?', a: 'No. The recording stays in your browser. It is only saved to your device when you press Download.' },
  { q: 'Why does my browser ask about the microphone?', a: 'Browsers always ask before a website can listen. Press Allow. You can change this later with the lock icon in the address bar.' },
  { q: 'What kind of file do I get?', a: 'Usually a .webm audio file, or .mp4 in some browsers. It plays in most players. To get an MP3 or WAV, run it through one of our converter tools.' },
  { q: 'Is there a time limit?', a: 'No fixed limit. Very long recordings use your device memory, so for hours of audio, record in several parts.' },
  { q: 'The meter does not move. What is wrong?', a: 'Check that the right microphone is selected in your browser or system settings, and that it is not muted.' },
];

const formatTime = (sec) => {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const pickMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return '';
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return options.find((t) => MediaRecorder.isTypeSupported(t)) || '';
};

const micErrorMessage = (err) => {
  const name = err && err.name;
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No microphone was found. Plug one in and try again.';
  }
  if (name === 'NotReadableError') {
    return 'Your microphone is being used by another app. Close that app and try again.';
  }
  return 'Your browser blocked the microphone. Allow it in the address bar and try again.';
};

export default function VoiceRecorder() {
  const [status, setStatus] = useState('idle'); // idle, recording, paused, done
  const [audioURL, setAudioURL] = useState(null);
  const [fileExt, setFileExt] = useState('webm');
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(0);
  const urlRef = useRef(null);

  // Timer: counts seconds only while recording
  useEffect(() => {
    if (status !== 'recording') return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const stopMeter = () => {
    cancelAnimationFrame(rafRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setLevel(0);
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Clean up on leaving the page
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.onstop = null;
      try { recorderRef.current.stop(); } catch { /* already stopped */ }
    }
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const startMeter = (stream) => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (let i = 0; i < data.length; i += 1) {
          peak = Math.max(peak, Math.abs(data[i] - 128));
        }
        setLevel(Math.min(1, (peak / 128) * 1.6));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // The meter is a nice extra; recording still works without it.
    }
  };

  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
      setError('This browser cannot record audio. Try a recent version of Chrome, Edge, Firefox or Safari.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const type = mr.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setFileExt(type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm');
        setAudioURL(url);
        setStatus('done');
        stopMeter();
        stopStream();
      };
      mr.start(100);
      recorderRef.current = mr;
      setElapsed(0);
      setStatus('recording');
      startMeter(stream);
    } catch (err) {
      stopStream();
      setError(micErrorMessage(err));
    }
  };

  const stopRecording = () => {
    const mr = recorderRef.current;
    if (mr && mr.state !== 'inactive') mr.stop();
  };

  const pauseRecording = () => {
    const mr = recorderRef.current;
    if (mr && mr.state === 'recording') {
      mr.pause();
      setStatus('paused');
      setLevel(0);
    }
  };

  const resumeRecording = () => {
    const mr = recorderRef.current;
    if (mr && mr.state === 'paused') {
      mr.resume();
      setStatus('recording');
    }
  };

  const recordAgain = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setAudioURL(null);
    setElapsed(0);
    setError('');
    setStatus('idle');
  };

  const download = () => {
    if (!audioURL) return;
    const a = document.createElement('a');
    a.href = audioURL;
    a.download = `recording_${Date.now()}.${fileExt}`;
    a.click();
  };

  const live = status === 'recording' || status === 'paused';
  const statusText = {
    idle: 'Press Record to start',
    recording: 'Recording…',
    paused: 'Paused',
    done: 'Done. Listen to it below.',
  }[status];

  return (
    <ToolFrame
      path="/tools/voice-recorder"
      name="Voice Recorder"
      title="Record your voice with your microphone"
      intro="Press Record, speak, then press Stop. You can listen back and save the recording. Nothing is uploaded."
      faqs={FAQS}
    >
      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-bad/30 bg-bad-soft p-4 text-bad">
          <AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-[15px] font-medium">{error}</p>
        </div>
      )}

      <Card className="flex flex-col items-center gap-6 py-8 text-center">
        <div>
          <div
            className={`font-mono text-6xl font-bold tracking-widest ${status === 'recording' ? 'text-bad' : 'text-ink'}`}
            aria-live="off"
          >
            {formatTime(elapsed)}
          </div>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted" role="status">
            {status === 'recording' && <span className="h-2 w-2 animate-pulse rounded-full bg-bad" aria-hidden="true" />}
            {statusText}
          </p>
        </div>

        {live && (
          <div className="w-full max-w-sm">
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-sunken"
              role="meter"
              aria-label="Microphone level"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(level * 100)}
            >
              <div
                className="h-full rounded-full bg-wine transition-[width] duration-100"
                style={{ width: `${Math.round(level * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted">This bar moves when the microphone hears you.</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          {status === 'idle' && (
            <Button onClick={startRecording}>
              <Mic size={18} aria-hidden="true" /> Record
            </Button>
          )}
          {status === 'recording' && (
            <>
              <Button variant="secondary" onClick={pauseRecording}>
                <Pause size={18} aria-hidden="true" /> Pause
              </Button>
              <Button onClick={stopRecording}>
                <Square size={18} aria-hidden="true" /> Stop
              </Button>
            </>
          )}
          {status === 'paused' && (
            <>
              <Button variant="secondary" onClick={resumeRecording}>
                <Play size={18} aria-hidden="true" /> Keep going
              </Button>
              <Button onClick={stopRecording}>
                <Square size={18} aria-hidden="true" /> Stop
              </Button>
            </>
          )}
          {status === 'done' && (
            <>
              <Button onClick={download}>
                <Download size={18} aria-hidden="true" /> Download
              </Button>
              <Button variant="secondary" onClick={recordAgain}>
                <RotateCcw size={18} aria-hidden="true" /> Record again
              </Button>
            </>
          )}
        </div>

        {status === 'done' && audioURL && (
          <audio controls src={audioURL} className="w-full max-w-md" />
        )}
      </Card>
    </ToolFrame>
  );
}
