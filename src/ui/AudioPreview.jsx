// Listen to a result before downloading: a waveform (wavesurfer.js, BSD-3) with play/pause.
import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, LoaderCircle } from 'lucide-react';

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export default function AudioPreview({ url, label = 'result' }) {
  const box = useRef(null);
  const ws = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const w = WaveSurfer.create({
      container: box.current,
      url,
      height: 48,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      cursorWidth: 1,
      waveColor: css('--color-line-strong') || '#D4C094',
      progressColor: css('--color-wine') || '#7F011F',
      cursorColor: css('--color-wine') || '#7F011F',
      normalize: true,
    });
    ws.current = w;
    w.on('ready', () => setReady(true));
    w.on('play', () => setPlaying(true));
    w.on('pause', () => setPlaying(false));
    w.on('finish', () => setPlaying(false));
    w.on('error', () => setFailed(true));
    return () => w.destroy();
  }, [url]);

  if (failed) return <p className="text-sm text-muted">This file can't be previewed here, but you can still download it.</p>;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-cream px-3 py-2">
      <button
        type="button"
        onClick={() => ws.current?.playPause()}
        disabled={!ready}
        aria-label={playing ? `Pause ${label}` : `Play ${label}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-wine text-paper transition-[background-color,transform] duration-200 hover:bg-wine-deep active:scale-95 disabled:opacity-50"
      >
        {!ready ? <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> : playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} className="translate-x-[1px]" aria-hidden="true" />}
      </button>
      <div ref={box} className="min-w-0 flex-1" />
    </div>
  );
}
