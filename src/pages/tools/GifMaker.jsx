import { useState, useRef, useEffect, useId } from 'react';
import { ArrowUp, ArrowDown, X, Download, UploadCloud, Film } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card, ChoiceChips } from '../../ui/controls';
import { createGifEncoder } from '../../lib/gif';
import { formatBytes } from '../../lib/gifInfo';

const MAX_PICTURES = 60;
const SECONDS = [
  { value: '0.3', label: '0.3 s', hint: 'Fast, like a flip book' },
  { value: '0.5', label: '0.5 s' },
  { value: '1', label: '1 s', hint: 'A slideshow' },
  { value: '2', label: '2 s' },
];
const WIDTHS = [
  { value: '320', label: 'Small (320)', hint: 'Small file' },
  { value: '480', label: 'Medium (480)', hint: 'A good balance' },
  { value: '640', label: 'Large (640)', hint: 'Sharper, bigger file' },
];
const LOOPS = [
  { value: 'forever', label: 'Loop forever', hint: 'The GIF starts again when it ends.' },
  { value: 'once', label: 'Play once', hint: 'The GIF stops on the last picture.' },
];

const FAQS = [
  { q: 'What kinds of pictures can I use?', a: 'PNG, JPG and WebP pictures. You can add many at once and drag more in later.' },
  { q: 'What if my pictures are different shapes?', a: 'The first picture sets the shape of the GIF. Other pictures are fitted inside it with white space around them, so nothing is cut off.' },
  { q: 'How do I change the order?', a: 'Use the up and down arrows next to each picture. The GIF plays from the top of the list to the bottom.' },
  { q: 'Why is the GIF so big?', a: 'GIFs store every picture in full. Use fewer pictures, a smaller width, or a shorter time on each picture to make it smaller.' },
];

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('A picture could not be read.'));
    img.src = url;
  });
}

export default function GifMaker() {
  const [items, setItems] = useState([]); // { id, file, url, w, h }
  const [seconds, setSeconds] = useState('0.5');
  const [width, setWidth] = useState('480');
  const [loop, setLoop] = useState('forever');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { url, size }
  const urlsRef = useRef([]);
  const nextId = useRef(0);
  const resultUrlRef = useRef('');
  const inputId = useId();

  useEffect(() => () => {
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  const clearResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = '';
    setResult(null);
  };

  const addFiles = async (fileList) => {
    const picked = Array.from(fileList || []);
    if (!picked.length) return;
    const good = picked.filter((f) => /^image\/(png|jpe?g|webp)$/.test(f.type) || /\.(png|jpe?g|webp)$/i.test(f.name));
    setError(good.length < picked.length ? 'Some files were skipped. Only PNG, JPG and WebP pictures work here.' : '');
    const room = MAX_PICTURES - items.length;
    if (good.length > room) setError(`You can use up to ${MAX_PICTURES} pictures. The extra ones were skipped.`);
    const added = [];
    for (const file of good.slice(0, Math.max(0, room))) {
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImage(url);
        urlsRef.current.push(url);
        nextId.current += 1;
        added.push({ id: `p${nextId.current}`, file, url, w: img.naturalWidth, h: img.naturalHeight });
      } catch {
        URL.revokeObjectURL(url);
        setError(`"${file.name}" could not be read, so it was skipped.`);
      }
    }
    if (added.length) {
      clearResult();
      setItems((prev) => [...prev, ...added]);
    }
  };

  const move = (index, delta) => {
    setItems((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    clearResult();
  };

  const remove = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    clearResult();
  };

  const clearAll = () => { setItems([]); clearResult(); setError(''); };

  const first = items[0];
  const outW = first ? Math.min(Number(width), first.w) : Number(width);
  const evenOf = (n) => Math.max(2, Math.round(n / 2) * 2);
  const frameW = evenOf(outW);
  const frameH = first ? evenOf((first.h * outW) / first.w) : 0;
  const total = items.length * Number(seconds);
  const tooFew = items.length < 2;
  const heavy = items.length > 30 || (frameW * frameH * items.length > 40_000_000);

  const make = async () => {
    if (busy || tooFew) return;
    setBusy(true);
    setError('');
    setProgress(0);
    clearResult();
    // Every picture is fitted onto a white frame of the same size, then encoded in a background worker.
    const encoder = createGifEncoder({ width: frameW, height: frameH, loop, dither: true, lossy: 0 });
    try {
      const canvas = document.createElement('canvas');
      canvas.width = frameW;
      canvas.height = frameH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingQuality = 'high';
      let pending = null;
      for (let i = 0; i < items.length; i += 1) {
        const img = await loadImage(items[i].url);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, frameW, frameH);
        const scale = Math.min(frameW / img.naturalWidth, frameH / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, (frameW - dw) / 2, (frameH - dh) / 2, dw, dh);
        const rgba = ctx.getImageData(0, 0, frameW, frameH).data;
        await pending;
        pending = encoder.add(rgba, Number(seconds) * 1000);
        setProgress(Math.round(((i + 1) / items.length) * 97));
      }
      await pending;
      const blob = await encoder.finish();
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setProgress(100);
      setResult({ url, size: blob.size });
    } catch {
      encoder.cancel();
      setError('The GIF could not be made. Try fewer or smaller pictures, or different files.');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = 'my_pictures_audiobulk.gif';
    a.click();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <ToolFrame
      path="/tools/gif-maker"
      name="GIF Maker"
      title="Turn a set of pictures into an animated GIF"
      intro="Add your pictures, put them in order, and choose how long each one shows. The GIF is made on your computer."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Add your pictures</h2>
          <label
            htmlFor={inputId}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 text-center transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-wine ${items.length ? 'py-6' : 'py-12'} ${
              dragging ? 'border-wine bg-wine-soft' : 'border-line-strong bg-paper hover:bg-sand'
            }`}
          >
            <UploadCloud size={items.length ? 24 : 34} className="text-wine" aria-hidden="true" />
            <span className="font-bold text-ink">{items.length ? 'Add more pictures' : 'Drop pictures here, or click to choose them'}</span>
            <span className="text-sm text-muted">PNG, JPG or WebP. Up to {MAX_PICTURES} pictures.</span>
            <input
              id={inputId}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              className="sr-only"
              disabled={busy}
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            />
          </label>
          {items.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{items.length} {items.length === 1 ? 'picture' : 'pictures'}, shown from top to bottom</p>
                <Button variant="quiet" onClick={clearAll} disabled={busy}>Remove all</Button>
              </div>
              <ol className="space-y-2">
                {items.map((it, i) => (
                  <li key={it.id} className="flex items-center gap-3 rounded-xl border border-line bg-cream p-2">
                    <span className="w-6 text-center text-sm font-semibold text-muted">{i + 1}</span>
                    <img src={it.url} alt={`Picture ${i + 1}: ${it.file.name}`} className="h-14 w-14 shrink-0 rounded-lg bg-sunken object-cover" />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{it.file.name}</span>
                    <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} aria-label={`Move ${it.file.name} up`} className="rounded-lg p-2 text-muted hover:bg-sand hover:text-ink disabled:opacity-30">
                      <ArrowUp size={18} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} disabled={busy || i === items.length - 1} aria-label={`Move ${it.file.name} down`} className="rounded-lg p-2 text-muted hover:bg-sand hover:text-ink disabled:opacity-30">
                      <ArrowDown size={18} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => remove(it.id)} disabled={busy} aria-label={`Remove ${it.file.name}`} className="rounded-lg p-2 text-muted hover:bg-bad-soft hover:text-bad disabled:opacity-30">
                      <X size={18} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}
        </Card>

        <Card className="space-y-5">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Choose how it plays</h2>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Time on each picture</p>
            <ChoiceChips label="Seconds per picture" options={SECONDS} value={seconds} onChange={(v) => { setSeconds(v); clearResult(); }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Picture size</p>
            <ChoiceChips label="Width" options={WIDTHS} value={width} onChange={(v) => { setWidth(v); clearResult(); }} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">When it ends</p>
            <ChoiceChips label="Looping" options={LOOPS} value={loop} onChange={(v) => { setLoop(v); clearResult(); }} />
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">3</span>Make the GIF</h2>
          {items.length === 0 && <p className="text-sm text-muted">Add at least two pictures first.</p>}
          {items.length === 1 && <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink" role="status">Add one more picture. A GIF needs at least two.</p>}
          {!tooFew && (
            <p className="text-sm text-muted" role="status">
              {items.length} pictures, {Number(total.toFixed(1))} seconds long, {frameW}×{frameH}.
              {first && first.w < Number(width) ? ` Your first picture is only ${first.w} wide, so it will not be stretched.` : ''}
            </p>
          )}
          {heavy && !tooFew && <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink">That is a lot of picture data, so it may take a while and the GIF may be big. Fewer pictures or a smaller size will help.</p>}
          <div className="flex flex-wrap gap-3">
            <Button onClick={make} disabled={busy || tooFew}>
              <Film size={18} aria-hidden="true" />
              {busy ? 'Making GIF...' : 'Make GIF'}
            </Button>
          </div>
          {busy && (
            <div className="space-y-2" role="status">
              <div className="h-2 overflow-hidden rounded-full bg-sunken">
                <div className="h-full rounded-full bg-wine transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-sm text-muted">Making your GIF... {progress}%</p>
            </div>
          )}
          {error && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{error}</p>}
          {result && (
            <div className="space-y-3">
              <img src={result.url} alt="Your finished GIF" className="max-h-[420px] max-w-full rounded-xl border border-line bg-sunken" />
              <p className="text-sm text-muted">Your GIF is ready. File size {formatBytes(result.size)}.</p>
              <Button onClick={download}>
                <Download size={18} aria-hidden="true" />
                Download
              </Button>
            </div>
          )}
        </Card>
      </div>
    </ToolFrame>
  );
}
