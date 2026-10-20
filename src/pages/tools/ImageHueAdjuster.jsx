import { useState, useRef, useEffect, useId } from 'react';
import { Download, Eye, RotateCcw, UploadCloud } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card, ChoiceChips } from '../../ui/controls';

const FAQS = [
  {
    q: 'What does "Color shift" do?',
    a: 'It slides all the colors around the color wheel. Small amounts make a picture look a little warmer (more orange) or cooler (more blue-green). Large amounts turn reds into greens and so on, which is fun but not true "warmth".',
  },
  {
    q: 'Will my picture lose size or quality?',
    a: 'The saved picture keeps its original width and height. PNG keeps every detail. JPG makes a smaller file with a tiny loss in detail.',
  },
  {
    q: 'How do I compare with the original?',
    a: 'Press and hold the "Hold to see original" button. Let go to see your changes again.',
  },
  {
    q: 'Is my picture uploaded anywhere?',
    a: 'No. All changes happen on your own device.',
  },
];

const DEFAULTS = { brightness: 100, contrast: 100, saturation: 100, hue: 0 };

const SLIDERS = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, unit: '%', note: 'Lighter or darker' },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, unit: '%', note: 'Difference between light and dark' },
  { key: 'saturation', label: 'Saturation', min: 0, max: 300, unit: '%', note: '0 is black and white, higher is more vivid' },
  { key: 'hue', label: 'Color shift (warmth)', min: -180, max: 180, unit: ' deg', note: 'Slides every color around the color wheel' },
];

function filterString(v) {
  return `brightness(${v.brightness}%) contrast(${v.contrast}%) saturate(${v.saturation}%) hue-rotate(${v.hue}deg)`;
}

export default function ImageHueAdjuster() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [vals, setVals] = useState(DEFAULTS);
  const [showOriginal, setShowOriginal] = useState(false);
  const [format, setFormat] = useState('png');
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const imgRef = useRef(null);
  const urlRef = useRef('');
  const inputId = useId();
  const idBase = useId();

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const loadFile = (picked) => {
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setError('That does not look like a picture. Please choose a PNG, JPG, WebP or GIF image.');
      return;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const next = URL.createObjectURL(picked);
    urlRef.current = next;
    setError('');
    setVals(DEFAULTS);
    setSize({ w: 0, h: 0 });
    setFile(picked);
    setUrl(next);
  };

  const onImageLoad = () => {
    const img = imgRef.current;
    if (img) setSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const ready = Boolean(file) && size.w > 0;
  const changed = Object.keys(DEFAULTS).some((k) => vals[k] !== DEFAULTS[k]);
  const huge = ready && size.w * size.h > 25_000_000;

  const save = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size.w;
      canvas.height = size.h;
      const ctx = canvas.getContext('2d');
      if (typeof ctx.filter === 'undefined') {
        throw new Error('nofilter');
      }
      if (format === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size.w, size.h);
      }
      ctx.filter = filterString(vals);
      ctx.drawImage(imgRef.current, 0, 0, size.w, size.h);
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const blob = await new Promise((resolve) => { canvas.toBlob(resolve, mime, 0.92); });
      if (!blob) throw new Error('blob');
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `${file.name.replace(/\.[^.]+$/, '')}_adjusted.${format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(href), 10000);
    } catch (e) {
      setError(e.message === 'nofilter'
        ? 'Your browser cannot save these color changes. Please try Chrome, Edge or Firefox.'
        : 'The picture could not be saved. It may be too large for your device.');
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  };

  return (
    <ToolFrame
      path="/tools/image-hue-adjuster"
      name="Image Color Adjuster"
      title="Change the brightness and colors of a picture"
      intro="Add one picture and move the sliders. You see the result straight away. When you like it, save the picture."
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
            <span className="text-lg font-bold text-ink">Drop a picture here, or click to choose one</span>
            <span className="text-sm text-muted">PNG, JPG, WebP or GIF. One picture at a time.</span>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ''; }}
            />
          </label>
        ) : (
          <>
            <Card className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Adjust the picture</h2>
                <label htmlFor={inputId} className="cursor-pointer text-sm font-semibold text-wine underline">
                  Choose another picture
                  <input
                    id={inputId}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => { loadFile(e.target.files?.[0]); e.target.value = ''; }}
                  />
                </label>
              </div>
              <p className="truncate text-sm text-muted">{file.name}{ready ? ` · ${size.w} x ${size.h} pixels` : ''}</p>
              <div className="mx-auto w-fit max-w-full overflow-hidden rounded-xl bg-sunken">
                <img
                  ref={imgRef}
                  src={url}
                  alt={showOriginal ? 'Your original picture' : 'Your picture with the changes applied'}
                  onLoad={onImageLoad}
                  onError={() => setError('Your browser cannot open this picture. Try a PNG or JPG file.')}
                  style={{ filter: showOriginal ? 'none' : filterString(vals) }}
                  className="block max-h-[420px] max-w-full"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onPointerDown={() => setShowOriginal(true)}
                  onPointerUp={() => setShowOriginal(false)}
                  onPointerLeave={() => setShowOriginal(false)}
                  onPointerCancel={() => setShowOriginal(false)}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setShowOriginal(true); }}
                  onKeyUp={() => setShowOriginal(false)}
                  onBlur={() => setShowOriginal(false)}
                  disabled={!changed}
                >
                  <Eye size={18} aria-hidden="true" />
                  Hold to see original
                </Button>
                <Button variant="quiet" onClick={() => setVals(DEFAULTS)} disabled={!changed}>
                  <RotateCcw size={18} aria-hidden="true" />
                  Reset
                </Button>
              </div>
              <div className="space-y-4">
                {SLIDERS.map((s) => (
                  <div key={s.key} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <label htmlFor={`${idBase}${s.key}`} className="text-sm font-semibold text-ink">{s.label}</label>
                      <span className="text-sm tabular-nums text-muted">{vals[s.key]}{s.unit}</span>
                    </div>
                    <input
                      id={`${idBase}${s.key}`}
                      type="range"
                      min={s.min}
                      max={s.max}
                      value={vals[s.key]}
                      onChange={(e) => setVals((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))}
                      className="block w-full accent-wine"
                    />
                    <p className="text-xs text-muted">{s.note}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="space-y-4">
              <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Save it</h2>
              <ChoiceChips
                label="File type"
                options={[
                  { value: 'png', label: 'PNG', hint: 'PNG: keeps every detail, bigger file.' },
                  { value: 'jpg', label: 'JPG', hint: 'JPG: smaller file, tiny loss in detail.' },
                ]}
                value={format}
                onChange={setFormat}
              />
              <p className="text-sm text-muted">The saved picture keeps its original size{ready ? ` (${size.w} x ${size.h})` : ''}.</p>
              {huge && <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink">This picture is very large, so saving may take a moment.</p>}
              <Button onClick={save} disabled={!ready || busy}>
                <Download size={18} aria-hidden="true" />
                {busy ? 'Saving...' : 'Download picture'}
              </Button>
              {error && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{error}</p>}
            </Card>
          </>
        )}
        {!file && error && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{error}</p>}
      </div>
    </ToolFrame>
  );
}
