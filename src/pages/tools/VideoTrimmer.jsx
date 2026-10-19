import { useState, useRef, useEffect, useId } from 'react';
import { Download, Scissors, UploadCloud } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card, ChoiceChips } from '../../ui/controls';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const FAQS = [
  {
    q: 'What is the difference between Exact cut and Fast cut?',
    a: 'Exact cut starts and ends right where you chose, but it rebuilds the video, so it takes longer. Fast cut copies the video without changing it, so it is quick and keeps full quality, but it may start a little earlier or later than you chose, at the nearest safe point in the video.',
  },
  {
    q: 'Why does a long video take a while?',
    a: 'The work happens inside your browser, on your own device, which is slower than a video app. Exact cut is the slow one. Fast cut is usually done in a few seconds.',
  },
  {
    q: 'Is my video uploaded anywhere?',
    a: 'No. The video stays on your device while it is cut.',
  },
  {
    q: 'Will the sound be kept?',
    a: 'Yes. If your video has sound, the cut clip keeps it.',
  },
];

const MIN_CLIP = 0.1;

function formatTime(seconds) {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const tenths = Math.round(safe * 10) / 10;
  const m = Math.floor(tenths / 60);
  const s = tenths - m * 60;
  const text = Number.isInteger(s) ? String(s).padStart(2, '0') : s.toFixed(1).padStart(4, '0');
  return `${m}:${text}`;
}

function formatClip(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Accepts "1:23", "1:23.5", "83" or "83.5". Returns seconds, or null when it is not a time.
function parseTime(text) {
  const clean = text.trim();
  if (!/^\d+(:\d{1,2})?(\.\d+)?$/.test(clean) && !/^\d+:\d{1,2}:\d{1,2}(\.\d+)?$/.test(clean)) return null;
  const parts = clean.split(':').map(Number);
  return parts.reduce((total, p) => total * 60 + p, 0);
}

export default function VideoTrimmer() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [startText, setStartText] = useState('0:00');
  const [endText, setEndText] = useState('0:00');
  const [mode, setMode] = useState('exact');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { url, name }
  const videoRef = useRef(null);
  const urlRef = useRef('');
  const resultUrlRef = useRef('');
  const inputId = useId();
  const startId = useId();
  const endId = useId();

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const clearResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = '';
    setResult(null);
  };

  const loadFile = (picked) => {
    if (!picked) return;
    if (!picked.type.startsWith('video/') && !/\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(picked.name)) {
      setError('That does not look like a video. Please choose an MP4, MOV, WebM, MKV or AVI file.');
      return;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    clearResult();
    const next = URL.createObjectURL(picked);
    urlRef.current = next;
    setError('');
    setFile(picked);
    setUrl(next);
    setDuration(0);
    setStart(0);
    setEnd(0);
    setStartText('0:00');
    setEndText('0:00');
  };

  const onMetadata = () => {
    const d = videoRef.current?.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    setDuration(d);
    setStart(0);
    setEnd(d);
    setStartText('0:00');
    setEndText(formatTime(d));
  };

  const applyStart = (value) => {
    setStart(value);
    setStartText(formatTime(value));
    clearResult();
  };
  const applyEnd = (value) => {
    setEnd(value);
    setEndText(formatTime(value));
    clearResult();
  };

  const commitStartText = () => {
    const v = parseTime(startText);
    if (v === null) { setStartText(formatTime(start)); return; }
    applyStart(Math.min(v, duration));
  };
  const commitEndText = () => {
    const v = parseTime(endText);
    if (v === null) { setEndText(formatTime(end)); return; }
    applyEnd(Math.min(v, duration));
  };

  const clipLength = end - start;
  let problem = '';
  if (file && duration > 0) {
    if (end > duration + 0.05) problem = `The end is past the end of the video (${formatTime(duration)}). Please choose an earlier end.`;
    else if (start < 0) problem = 'The start cannot be before the beginning of the video.';
    else if (clipLength <= 0) problem = 'The end must come after the start.';
    else if (clipLength < MIN_CLIP) problem = 'The clip must be at least 0.1 seconds long.';
  }

  const cut = async () => {
    if (!file || problem || busy) return;
    setBusy(true);
    setError('');
    setProgress(0);
    clearResult();
    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
    const exact = mode === 'exact';
    const outExt = exact ? 'mp4' : ext;
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.${ext}`;
    const outputName = `output_trim_${uid}.${outExt}`;
    let ffmpeg = null;
    let progressHandler = null;
    try {
      ffmpeg = await getFFmpeg();
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress: p }) => setProgress(Math.max(0, Math.min(100, Math.round(p * 100))));
      ffmpeg.on('progress', progressHandler);
      const length = Math.min(clipLength, duration - start).toFixed(3);
      const seek = ['-ss', start.toFixed(3), '-i', inputName, '-t', length];
      const args = exact
        ? [...seek, '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', outputName]
        : [...seek, '-c', 'copy', '-avoid_negative_ts', 'make_zero', outputName];
      const code = await ffmpeg.exec(args);
      if (code !== 0) throw new Error('exec failed');
      const data = await ffmpeg.readFile(outputName);
      if (!data || data.length === 0) throw new Error('empty');
      const type = exact || ext === 'mp4' ? 'video/mp4' : (file.type || 'video/mp4');
      const blob = new Blob([data.buffer], { type });
      const resultUrl = URL.createObjectURL(blob);
      resultUrlRef.current = resultUrl;
      setResult({ url: resultUrl, name: `${file.name.replace(/\.[^.]+$/, '')}_trimmed.${outExt}` });
    } catch {
      setError('This video could not be cut. Try Exact cut, or a different video file.');
    } finally {
      if (ffmpeg && progressHandler) ffmpeg.off('progress', progressHandler);
      if (ffmpeg) {
        await safeDelete(ffmpeg, inputName);
        await safeDelete(ffmpeg, outputName);
      }
      setBusy(false);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.name;
    a.click();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  };

  const inputStyle = 'w-28 rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine';
  const ready = Boolean(file) && duration > 0;
  const leftPct = ready ? Math.min(100, (start / duration) * 100) : 0;
  const widthPct = ready ? Math.max(0, Math.min(100, (end / duration) * 100) - leftPct) : 0;
  const heavy = ready && duration > 600 && mode === 'exact';

  return (
    <ToolFrame
      path="/tools/video-trimmer"
      name="Video Trimmer"
      title="Cut a part out of a video"
      intro="Add one video, watch it, and mark where the clip should start and end. Then press Cut video."
      faqs={FAQS}
    >
      <div className="space-y-6">
        {!file ? (
          <label
            htmlFor={inputId}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-wine ${
              dragging ? 'border-wine bg-wine-soft' : 'border-line-strong bg-paper hover:bg-sand'
            }`}
          >
            <UploadCloud size={36} className="text-wine" aria-hidden="true" />
            <span className="text-lg font-bold text-ink">Drop a video here, or click to choose one</span>
            <span className="text-sm text-muted">MP4, MOV, WebM, MKV or AVI. One video at a time.</span>
            <input
              id={inputId}
              type="file"
              accept="video/*,.mkv,.avi,.mov,.m4v"
              className="sr-only"
              onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ''; }}
            />
          </label>
        ) : (
          <>
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Watch and mark the clip</h2>
                <label htmlFor={inputId} className="cursor-pointer text-sm font-semibold text-wine underline">
                  Choose another video
                  <input
                    id={inputId}
                    type="file"
                    accept="video/*,.mkv,.avi,.mov,.m4v"
                    className="sr-only"
                    onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ''; }}
                  />
                </label>
              </div>
              <p className="truncate text-sm text-muted">{file.name}{ready ? ` · length ${formatTime(duration)}` : ''}</p>
              <video
                ref={videoRef}
                src={url}
                controls
                playsInline
                onLoadedMetadata={onMetadata}
                onError={() => setError('Your browser cannot play this video, so it cannot be previewed here. You can still type a start and end time, but it may not cut. Try an MP4 file.')}
                className="aspect-video max-h-[420px] w-full rounded-xl bg-ink"
              />
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" disabled={!ready || busy} onClick={() => applyStart(Math.min(videoRef.current?.currentTime ?? 0, duration))}>
                  Set start here
                </Button>
                <Button variant="secondary" disabled={!ready || busy} onClick={() => applyEnd(Math.min(videoRef.current?.currentTime ?? 0, duration))}>
                  Set end here
                </Button>
              </div>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <label htmlFor={startId} className="text-sm font-semibold text-ink">Start (m:ss)</label>
                  <input
                    id={startId}
                    type="text"
                    inputMode="decimal"
                    value={startText}
                    disabled={!ready || busy}
                    onChange={(e) => setStartText(e.target.value)}
                    onBlur={commitStartText}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitStartText(); }}
                    className={`block ${inputStyle}`}
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor={endId} className="text-sm font-semibold text-ink">End (m:ss)</label>
                  <input
                    id={endId}
                    type="text"
                    inputMode="decimal"
                    value={endText}
                    disabled={!ready || busy}
                    onChange={(e) => setEndText(e.target.value)}
                    onBlur={commitEndText}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitEndText(); }}
                    className={`block ${inputStyle}`}
                  />
                </div>
                <p className="pb-2 text-[15px] font-semibold text-ink" role="status">
                  {/* Short clips show exact seconds ("4.5 seconds"); longer ones show m:ss. */}
                  Clip length {ready && !problem ? (clipLength < 60 ? `${Number(clipLength.toFixed(1))} seconds` : formatClip(clipLength)) : '0 seconds'}
                </p>
              </div>
              <div
                className="relative h-3 overflow-hidden rounded-full bg-sunken"
                role="img"
                aria-label={ready ? `Chosen part: from ${formatTime(start)} to ${formatTime(end)} of ${formatTime(duration)}` : 'Chosen part of the video'}
              >
                <div className="absolute inset-y-0 rounded-full bg-wine" style={{ left: `${leftPct}%`, width: `${widthPct}%` }} />
              </div>
              {problem && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{problem}</p>}
            </Card>

            <Card className="space-y-4">
              <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>How should it be cut?</h2>
              <ChoiceChips
                label="Cut accuracy"
                options={[
                  { value: 'exact', label: 'Exact cut', hint: 'Exact cut (slower, re-encodes): starts and ends exactly where you chose. Makes an MP4 that plays everywhere.' },
                  { value: 'fast', label: 'Fast cut', hint: 'Fast cut (no quality loss, starts at the nearest keyframe): very quick, but the start may be a moment off. Keeps the original file type.' },
                ]}
                value={mode}
                onChange={(v) => { setMode(v); clearResult(); }}
              />
              {heavy && <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink">This video is long, so an exact cut may take a long time in your browser. Fast cut is much quicker.</p>}
            </Card>

            <Card className="space-y-4">
              <h2 className="text-lg font-bold"><span className="mr-2 text-wine">3</span>Cut the video</h2>
              <div className="flex flex-wrap gap-3">
                <Button onClick={cut} disabled={!ready || Boolean(problem) || busy}>
                  <Scissors size={18} aria-hidden="true" />
                  {busy ? 'Cutting...' : 'Cut video'}
                </Button>
              </div>
              {busy && (
                <div className="space-y-2" role="status">
                  <div className="h-2 overflow-hidden rounded-full bg-sunken">
                    <div className="h-full rounded-full bg-wine transition-[width] duration-200" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-sm text-muted">Cutting your video... {progress}%</p>
                </div>
              )}
              {error && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{error}</p>}
              {result && (
                <div className="space-y-3">
                  <video src={result.url} controls playsInline className="aspect-video max-h-[420px] w-full rounded-xl bg-ink" />
                  <Button onClick={download}>
                    <Download size={18} aria-hidden="true" />
                    Download
                  </Button>
                </div>
              )}
            </Card>
          </>
        )}
        {!file && error && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{error}</p>}
      </div>
    </ToolFrame>
  );
}
