import { useEffect, useRef, useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { Download, Film, RotateCcw } from 'lucide-react';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import ToolFrame from '../../ui/ToolFrame';
import DropZone from '../../ui/DropZone';
import { Button, Card, ChoiceChips } from '../../ui/controls';

const METHODS = [
  { value: 'fill', label: 'Fill from around it', hint: 'Fills the box using the picture next to it. Works best on small logos over plain or soft backgrounds.' },
  { value: 'blur', label: 'Blur it', hint: 'Blurs the box so the logo is hard to read. Always works, but the blur stays visible.' },
];

const MIN_BOX = 8; // smallest box in video pixels

// Keeps the box inside the picture. delogo needs the box to sit at least 1 pixel away from every edge.
function clampBox(box, vw, vh) {
  const x = Math.max(1, Math.min(Math.round(box.x), vw - 3));
  const y = Math.max(1, Math.min(Math.round(box.y), vh - 3));
  const w = Math.max(1, Math.min(Math.round(box.w), vw - 1 - x));
  const h = Math.max(1, Math.min(Math.round(box.h), vh - 1 - y));
  return { x, y, w, h };
}

function buildArgs(method, box, inputName, outputName) {
  const { x, y, w, h } = box;
  const common = ['-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', outputName];
  if (method === 'fill') {
    return ['-i', inputName, '-vf', `delogo=x=${x}:y=${y}:w=${w}:h=${h}`, ...common];
  }
  const radius = Math.max(1, Math.min(10, Math.floor(Math.min(w, h) / 4)));
  const graph = `[0:v]crop=${w}:${h}:${x}:${y},boxblur=${radius}[b];[0:v][b]overlay=${x}:${y}[outv]`;
  return ['-i', inputName, '-filter_complex', graph, '-map', '[outv]', '-map', '0:a?', ...common];
}

export default function WatermarkRemover() {
  const [file, setFile] = useState(null);
  const [size, setSize] = useState(null); // { w, h } in video pixels
  const [box, setBox] = useState(null); // in video pixels
  const [method, setMethod] = useState('fill');
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { url, name }
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

  // Load the picked video and draw its first frame on the canvas.
  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    video.playsInline = true;
    let cancelled = false;
    video.onloadedmetadata = () => {
      try { video.currentTime = Math.min(0.1, (video.duration || 0.1) / 2); } catch { /* ignore */ }
    };
    video.onseeked = () => {
      if (cancelled) return;
      setSize({ w: video.videoWidth, h: video.videoHeight });
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
      });
    };
    video.onerror = () => {
      if (!cancelled) setError('This video could not be opened. Try an MP4, MOV or WebM file.');
    };
    video.src = url;
    return () => { cancelled = true; video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); };
  }, [file]);

  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const pickFile = (files) => {
    setFile(files[0]);
    setSize(null);
    setBox(null);
    setError('');
    setResult(null);
    setProgress(0);
  };

  const startOver = () => {
    setFile(null);
    setSize(null);
    setBox(null);
    setError('');
    setResult(null);
  };

  const toVideoPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x: px * size.w, y: py * size.h };
  };

  const onPointerDown = (e) => {
    if (!size || working) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = toVideoPoint(e);
    setBox(null);
    setResult(null);
  };

  const onPointerMove = (e) => {
    const start = dragRef.current;
    if (!start || !size) return;
    const p = toVideoPoint(e);
    setBox({ x: Math.min(start.x, p.x), y: Math.min(start.y, p.y), w: Math.abs(p.x - start.x), h: Math.abs(p.y - start.y) });
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setBox((b) => (b && b.w >= MIN_BOX && b.h >= MIN_BOX ? b : null));
  };

  const remove = async () => {
    if (!file || !size || !box) return;
    setWorking(true);
    setError('');
    setResult(null);
    setProgress(0);
    const safe = clampBox(box, size.w, size.h);
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'mp4';
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.mp4`;
    let ffmpeg = null;
    let progressHandler = null;
    try {
      ffmpeg = await getFFmpeg();
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress: p }) => setProgress(Math.max(0, Math.min(100, p * 100)));
      ffmpeg.on('progress', progressHandler);
      await ffmpeg.exec(buildArgs(method, safe, inputName, outputName));
      const data = await ffmpeg.readFile(outputName);
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      setResult({ url: URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })), name: `${baseName}_no_logo.mp4` });
      setProgress(100);
    } catch {
      setError('Something went wrong while editing this video. Try a smaller box, or a different video.');
    } finally {
      if (ffmpeg) {
        if (progressHandler) ffmpeg.off('progress', progressHandler);
        await safeDelete(ffmpeg, inputName);
        await safeDelete(ffmpeg, outputName);
      }
      setWorking(false);
    }
  };

  const heavy = size && (size.w >= 3840 || (file && file.size > 300 * 1024 * 1024));

  return (
    <ToolFrame
      path="/tools/watermark-remover"
      name="Watermark Remover"
      title="Hide a logo or watermark in your video"
      intro="Draw a box around the logo and we will cover it up. It hides the logo, but it cannot bring back exactly what was behind it."
      faqs={[
        { q: 'Is my video uploaded anywhere?', a: 'No. The video is edited inside your web browser, on your own computer. It never leaves your device.' },
        { q: 'Will the logo disappear completely?', a: 'Not perfectly. We cannot know what was hidden under the logo, so we hide it by filling or blurring that spot. On plain backgrounds it can look very clean. On busy pictures you may see a smudge.' },
        { q: 'Which method should I pick?', a: '"Fill from around it" copies the look of the area next to the box. It is best for small logos. "Blur it" is the safe choice if the fill looks odd. Keep the box as small as you can.' },
        { q: 'What about a logo that moves around?', a: 'This tool covers one fixed spot for the whole video. A logo that moves, or one that appears in different corners, needs several passes or a different tool.' },
        { q: 'Will the sound and quality stay the same?', a: 'The sound is copied as it is. The picture is saved again as an MP4, so there is a very small quality change. Long or very large videos can take a while in a browser.' },
      ]}
    >
      {!file ? (
        <DropZone onFiles={pickFile} accept={{ 'video/*': ['.mp4', '.mov', '.webm', '.mkv', '.avi'] }} hint="One video: MP4, MOV, WebM or MKV." />
      ) : (
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                <Film size={16} className="shrink-0 text-wine" aria-hidden="true" />
                <span className="truncate">{file.name}</span>
                {size && <span className="font-normal text-muted">{size.w}×{size.h}</span>}
              </p>
              <Button variant="quiet" onClick={startOver} disabled={working}>
                <RotateCcw size={15} aria-hidden="true" /> Choose another video
              </Button>
            </div>

            <p className="text-sm text-muted">
              <span className="font-semibold text-ink">1.</span> Press and drag on the picture to draw a box around the logo. Draw again to redo it.
            </p>

            <div className="relative mx-auto w-full max-w-3xl select-none overflow-hidden rounded-xl bg-sunken" style={size ? { aspectRatio: `${size.w} / ${size.h}` } : { minHeight: 180 }}>
              <canvas
                ref={canvasRef}
                className={`block h-full w-full ${size ? 'cursor-crosshair' : 'invisible'}`}
                style={{ touchAction: 'none' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-label="First picture of your video. Drag to draw a box around the logo."
              />
              {!size && !error && <p className="absolute inset-0 flex items-center justify-center text-sm text-muted">Loading the first picture...</p>}
              {box && size && (
                <div
                  className="pointer-events-none absolute border-2 border-wine bg-wine/15"
                  style={{
                    left: `${(box.x / size.w) * 100}%`,
                    top: `${(box.y / size.h) * 100}%`,
                    width: `${(box.w / size.w) * 100}%`,
                    height: `${(box.h / size.h) * 100}%`,
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.85)',
                  }}
                />
              )}
            </div>
            {size && !box && <p className="text-sm text-muted">No box yet. Drag over the logo.</p>}
            {box && <p className="text-sm text-muted">Box ready: {Math.round(box.w)}×{Math.round(box.h)} pixels. Keep it as small as you can for the cleanest look.</p>}
            {heavy && <p className="rounded-lg bg-sand px-3 py-2 text-sm">This is a big video. It may take a long time to edit in the browser.</p>}
          </Card>

          <Card className="space-y-4">
            <p className="text-sm font-semibold"><span className="mr-1">2.</span> Pick a method</p>
            <ChoiceChips label="Method" options={METHODS} value={method} onChange={setMethod} />
          </Card>

          <Card className="space-y-4">
            <p className="text-sm font-semibold"><span className="mr-1">3.</span> Remove the watermark</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={remove} disabled={!box || !size || working}>
                {working ? 'Working...' : 'Remove watermark'}
              </Button>
              {!box && size && <span className="text-sm text-muted">Draw a box first.</span>}
            </div>
            {working && (
              <div className="space-y-1" role="status">
                <div className="h-2 overflow-hidden rounded-full bg-sunken">
                  <div className="h-full rounded-full bg-wine transition-[width] duration-200" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-sm text-muted">Editing your video... {Math.round(progress)}%</p>
              </div>
            )}
            {error && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{error}</p>}
            {result && (
              <div className="space-y-3">
                <video src={result.url} controls playsInline className="w-full max-w-3xl rounded-xl bg-sunken" />
                <p className="text-sm text-muted">Done. Play it to check the spot. If you can still see the logo, try a slightly bigger box or the other method.</p>
                <a href={result.url} download={result.name} className="inline-flex items-center gap-2 rounded-lg bg-wine px-4 py-2.5 text-[15px] font-semibold text-paper hover:bg-wine-deep">
                  <Download size={16} aria-hidden="true" /> Download MP4
                </a>
              </div>
            )}
          </Card>
        </div>
      )}
    </ToolFrame>
  );
}
