import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function VoiceRecorder() {
  const [status, setStatus] = useState('idle'); // idle, recording, paused, done
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const mediaRecorder = useRef(null);
  const chunks = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = e => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioURL(url);
        setStatus('done');
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(100);
      mediaRecorder.current = mr;
      setElapsed(0);
      setStatus('recording');
    } catch {
      setError('Microphone access denied. Please allow microphone access in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.pause();
      setStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
      mediaRecorder.current.resume();
      setStatus('recording');
    }
  };

  const reset = () => {
    setStatus('idle');
    setAudioURL(null);
    setAudioBlob(null);
    setElapsed(0);
    setError('');
  };

  const download = () => {
    if (!audioBlob) return;
    const a = document.createElement('a');
    a.href = audioURL;
    a.download = `recording_${Date.now()}.webm`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools?cat=audio" className="hover:text-white transition-colors">Audio Tools</Link></li>
          <li className="text-sky-600 font-medium">Voice Recorder</li>
        </ul>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-microphone text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Voice Recorder</h1>
          <p className="text-slate-400 text-sm">Record high-quality audio directly from your microphone. Fully private, no uploads.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm text-red-400"><i className="fa-solid fa-circle-exclamation mr-2"></i>{error}</p>
        </div>
      )}

      <div className="glass-card rounded-2xl border border-white/10 p-10 flex flex-col items-center gap-8">
        {/* Timer */}
        <div className="text-center">
          <div className={`text-6xl font-mono font-bold tracking-widest ${status === 'recording' ? 'text-red-400' : 'text-white'}`}>
            {formatTime(elapsed)}
          </div>
          <p className="text-sm text-slate-400 mt-2">
            {status === 'idle' && 'Press record to start'}
            {status === 'recording' && <span className="flex items-center gap-1.5 justify-center"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>Recording...</span>}
            {status === 'paused' && 'Paused'}
            {status === 'done' && 'Recording complete'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {status === 'idle' && (
            <button
              onClick={startRecording}
              className="btn btn-circle btn-lg bg-red-500 hover:bg-red-600 border-0 text-white"
            >
              <i className="fa-solid fa-microphone text-xl"></i>
            </button>
          )}
          {status === 'recording' && (
            <>
              <button onClick={pauseRecording} className="btn btn-circle bg-amber-500 hover:bg-amber-600 border-0 text-white">
                <i className="fa-solid fa-pause"></i>
              </button>
              <button onClick={stopRecording} className="btn btn-circle btn-lg bg-slate-700 hover:bg-slate-600 border-0 text-white">
                <i className="fa-solid fa-stop text-xl"></i>
              </button>
            </>
          )}
          {status === 'paused' && (
            <>
              <button onClick={resumeRecording} className="btn btn-circle bg-emerald-500 hover:bg-emerald-600 border-0 text-white">
                <i className="fa-solid fa-play"></i>
              </button>
              <button onClick={stopRecording} className="btn btn-circle btn-lg bg-slate-700 hover:bg-slate-600 border-0 text-white">
                <i className="fa-solid fa-stop text-xl"></i>
              </button>
            </>
          )}
          {status === 'done' && (
            <button onClick={reset} className="btn btn-circle bg-sky-500 hover:bg-sky-600 border-0 text-white">
              <i className="fa-solid fa-rotate-left"></i>
            </button>
          )}
        </div>

        {/* Playback */}
        {audioURL && (
          <div className="w-full space-y-4">
            <audio controls src={audioURL} className="w-full rounded-xl" />
            <button
              onClick={download}
              className="w-full btn bg-sky-500 hover:bg-sky-600 border-0 text-white font-semibold rounded-xl gap-2"
            >
              <i className="fa-solid fa-download"></i>
              Download Recording (.webm)
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-5 flex items-start gap-3">
        <i className="fa-solid fa-shield-halved text-emerald-600 text-xl mt-0.5"></i>
        <div>
          <p className="text-sm font-semibold text-white">100% Private</p>
          <p className="text-xs text-slate-400 mt-1">Your audio is recorded directly in your browser memory using the Web Audio API. Nothing is uploaded to any server.</p>
        </div>
      </div>
    </div>
  );
}
