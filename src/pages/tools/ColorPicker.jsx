import { useState, useRef, useEffect, useId } from 'react';
import { Copy, Check, UploadCloud } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Card } from '../../ui/controls';

const FAQS = [
  {
    q: 'What is a HEX code?',
    a: 'A HEX code is a short way to write a color, like #FF8800. It is used in websites, design apps and social media tools. The six characters are the amounts of red, green and blue.',
  },
  {
    q: 'What is RGB?',
    a: 'RGB lists how much red, green and blue light make the color, each from 0 (none) to 255 (full). So rgb(255, 0, 0) is pure red. HSL describes the same color as hue (the color on the wheel), saturation (how vivid) and lightness (how light).',
  },
  {
    q: 'How are the "Main colors" found?',
    a: 'The picture is shrunk to a small copy, and similar colors are grouped together. Each group is shown as one color. It is a good guide, but a different method could give slightly different results.',
  },
  {
    q: 'Is my picture uploaded anywhere?',
    a: 'No. Everything happens on your own device.',
  },
];

const clamp255 = (n) => Math.max(0, Math.min(255, Math.round(n)));

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

// Median cut: repeatedly split the box with the widest colour range at its median.
// `pixels` is a flat RGBA array (like canvas data). Transparent pixels are skipped.
function medianCutPalette(pixels, count = 6) {
  const colors = [];
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] >= 125) colors.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  if (colors.length === 0) return [];
  const boxes = [colors];
  while (boxes.length < count) {
    let best = -1;
    let bestRange = 0;
    let bestChannel = 0;
    boxes.forEach((box, idx) => {
      if (box.length < 2) return;
      for (let ch = 0; ch < 3; ch += 1) {
        let lo = 255;
        let hi = 0;
        for (const c of box) {
          if (c[ch] < lo) lo = c[ch];
          if (c[ch] > hi) hi = c[ch];
        }
        if (hi - lo > bestRange) { bestRange = hi - lo; best = idx; bestChannel = ch; }
      }
    });
    if (best < 0) break; // nothing left to split
    const box = boxes[best].slice().sort((a, b) => a[bestChannel] - b[bestChannel]);
    const mid = Math.floor(box.length / 2);
    boxes.splice(best, 1, box.slice(0, mid), box.slice(mid));
  }
  return boxes
    .filter((box) => box.length > 0)
    .map((box) => {
      const sum = [0, 0, 0];
      box.forEach((c) => { sum[0] += c[0]; sum[1] += c[1]; sum[2] += c[2]; });
      return { rgb: sum.map((v) => Math.round(v / box.length)), size: box.length };
    })
    .sort((a, b) => b.size - a.size)
    .reduce((merged, item) => {
      // A cut can fall inside one solid color; merge boxes that came out (almost) the same.
      const twin = merged.find((m) => Math.hypot(m.rgb[0] - item.rgb[0], m.rgb[1] - item.rgb[1], m.rgb[2] - item.rgb[2]) < 16);
      if (twin) twin.size += item.size;
      else merged.push({ rgb: item.rgb, size: item.size });
      return merged;
    }, [])
    .map((b) => b.rgb);
}

function CopyButton({ text, label }) {
  const [state, setState] = useState('idle'); // idle | copied | failed
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('failed');
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState('idle'), 1800);
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line-strong bg-paper px-3 py-1.5 text-sm font-semibold text-ink hover:bg-sand"
    >
      {state === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      <span role="status">{state === 'copied' ? 'Copied' : state === 'failed' ? 'Select and copy by hand' : 'Copy'}</span>
    </button>
  );
}

function ColorReadout({ rgb }) {
  const hex = rgbToHex(...rgb);
  const [h, s, l] = rgbToHsl(...rgb);
  const rows = [
    { label: 'HEX', value: hex },
    { label: 'RGB', value: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` },
    { label: 'HSL', value: `hsl(${h}, ${s}%, ${l}%)` },
  ];
  return (
    <div className="space-y-3">
      <div className="h-16 rounded-xl border border-line-strong" style={{ backgroundColor: hex }} role="img" aria-label={`Color ${hex}`} />
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3">
            <span className="min-w-0 text-[15px] text-ink"><span className="mr-2 inline-block w-10 font-bold">{r.label}</span><span className="break-all font-mono">{r.value}</span></span>
            <CopyButton text={r.value} label={r.label} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const MAX_SAMPLE = 4000;

export default function ColorPicker() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [picked, setPicked] = useState(null); // [r, g, b]
  const [marker, setMarker] = useState(null); // { x, y } in percent
  const [palette, setPalette] = useState([]);
  const [manual, setManual] = useState('#8B2E4A');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const imgRef = useRef(null);
  const sampleRef = useRef(null); // canvas with the picture at (nearly) full size
  const urlRef = useRef('');
  const inputId = useId();
  const manualId = useId();

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const loadFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('That does not look like a picture. Please choose a PNG, JPG, WebP or GIF image.');
      return;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const next = URL.createObjectURL(f);
    urlRef.current = next;
    sampleRef.current = null;
    setError('');
    setPicked(null);
    setMarker(null);
    setPalette([]);
    setFile(f);
    setUrl(next);
  };

  const onImageLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    try {
      const scale = Math.min(1, MAX_SAMPLE / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      sampleRef.current = canvas;
      // Small copy for the palette.
      const small = document.createElement('canvas');
      const k = Math.min(1, 100 / Math.max(canvas.width, canvas.height));
      small.width = Math.max(1, Math.round(canvas.width * k));
      small.height = Math.max(1, Math.round(canvas.height * k));
      const sctx = small.getContext('2d', { willReadFrequently: true });
      sctx.drawImage(canvas, 0, 0, small.width, small.height);
      setPalette(medianCutPalette(sctx.getImageData(0, 0, small.width, small.height).data, 6));
    } catch {
      setError('Colors could not be read from this picture. Try a PNG or JPG file.');
    }
  };

  const pick = (e) => {
    const img = imgRef.current;
    const canvas = sampleRef.current;
    if (!img || !canvas) return;
    const rect = img.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
    const x = Math.min(canvas.width - 1, Math.floor(fx * canvas.width));
    const y = Math.min(canvas.height - 1, Math.floor(fy * canvas.height));
    const d = canvas.getContext('2d', { willReadFrequently: true }).getImageData(x, y, 1, 1).data;
    if (d[3] === 0) {
      setError('That spot is see-through, so it has no color. Try another spot.');
      return;
    }
    setError('');
    setPicked([d[0], d[1], d[2]]);
    setMarker({ x: fx * 100, y: fy * 100 });
  };

  const manualRgb = hexToRgb(manual);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  };

  return (
    <ToolFrame
      path="/tools/color-picker"
      name="Color Picker"
      title="Find the exact colors in a picture"
      intro="Add a picture and tap anywhere on it to get that color's code. You also get the main colors of the picture."
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
                <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Tap the picture to pick a color</h2>
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
              <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-xl bg-sunken">
                <img
                  ref={imgRef}
                  src={url}
                  alt="Your picture. Tap or click anywhere to pick a color."
                  onLoad={onImageLoad}
                  onError={() => setError('Your browser cannot open this picture. Try a PNG or JPG file.')}
                  onClick={pick}
                  draggable={false}
                  className="block max-h-[480px] max-w-full cursor-crosshair"
                />
                {marker && (
                  <span
                    className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1.5px_#000]"
                    style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                    aria-hidden="true"
                  />
                )}
              </div>
              {error && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{error}</p>}
              {picked ? <ColorReadout rgb={picked} /> : <p className="text-sm text-muted">No color picked yet. Tap a spot on the picture.</p>}
            </Card>

            <Card className="space-y-4">
              <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Main colors</h2>
              {palette.length > 0 ? (
                <ul className="space-y-2">
                  {palette.map((c) => {
                    const hex = rgbToHex(...c);
                    return (
                      <li key={hex} className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setPicked(c)}
                          className="flex min-w-0 items-center gap-3 text-left"
                          aria-label={`Show details for ${hex}`}
                        >
                          <span className="h-9 w-9 shrink-0 rounded-lg border border-line-strong" style={{ backgroundColor: hex }} />
                          <span className="font-mono text-[15px] text-ink">{hex}</span>
                        </button>
                        <CopyButton text={hex} label={hex} />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted">Looking for the main colors...</p>
              )}
            </Card>
          </>
        )}

        <Card className="space-y-4">
          <h2 className="text-lg font-bold">{file ? <span className="mr-2 text-wine">3</span> : null}Check a color by hand</h2>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor={manualId} className="text-sm font-semibold text-ink">Pick a color</label>
            <input
              id={manualId}
              type="color"
              value={manualRgb ? rgbToHex(...manualRgb).toLowerCase() : '#000000'}
              onChange={(e) => setManual(e.target.value.toUpperCase())}
              className="h-10 w-16 cursor-pointer rounded-lg border border-line-strong bg-cream"
            />
            <input
              type="text"
              aria-label="Type a HEX code"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              className="w-32 rounded-lg border border-line-strong bg-cream px-3 py-2 font-mono text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine"
            />
          </div>
          {manualRgb
            ? <ColorReadout rgb={manualRgb} />
            : <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">Type a HEX code with 6 characters, like #FF8800.</p>}
          <p className="text-sm text-muted">
            HEX is the color written as six characters (red, green, blue). RGB writes the same color as three numbers from 0 to 255. Websites and design apps accept both.
          </p>
        </Card>
      </div>
    </ToolFrame>
  );
}

