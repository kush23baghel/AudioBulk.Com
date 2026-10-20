import { useState, useRef, useEffect, useId } from 'react';
import { Download, Scissors, UploadCloud } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card, ChoiceChips } from '../../ui/controls';
import { downloadFiles } from '../../lib/download';

const FAQS = [
  {
    q: 'How do I make an Instagram carousel?',
    a: 'Choose "1 x 3 (carousel)". Your picture is cut into three side-by-side pieces. Post them in order (r1c1, r1c2, r1c3) and they join up as you swipe.',
  },
  {
    q: 'Why are some pieces one pixel bigger than others?',
    a: 'If the picture width or height cannot be shared out perfectly evenly, some pieces get one extra pixel. You will not see the difference, and no part of the picture is lost.',
  },
  {
    q: 'What do the file names mean?',
    a: 'r1c2 means row 1, column 2, counting from the top left. So name_r1c1.png is the top left piece.',
  },
  {
    q: 'Is my picture uploaded anywhere?',
    a: 'No. The picture is cut on your own device and never leaves it.',
  },
];

const PRESETS = [
  { value: 'carousel', label: '1 x 3 (carousel)', rows: 1, cols: 3, hint: 'One row, three columns. Made for Instagram carousels.' },
  { value: '3x3', label: '3 x 3', rows: 3, cols: 3, hint: 'Nine pieces, like an Instagram profile grid.' },
  { value: '2x2', label: '2 x 2', rows: 2, cols: 2, hint: 'Four equal pieces.' },
  { value: '2x1', label: '2 x 1', rows: 1, cols: 2, hint: 'Two pieces side by side.' },
  { value: 'custom', label: 'Custom', hint: 'Choose your own rows and columns, up to 10 each.' },
];

const MAX_SIDE = 10;
const BIG_PIXELS = 25_000_000;

// Where each cut falls. Rounding means pieces differ by at most 1 pixel.
function cutPoints(total, parts) {
  const points = [];
  for (let i = 0; i <= parts; i += 1) points.push(Math.round((i * total) / parts));
  return points;
}

function clampCount(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_SIDE, Math.max(1, n));
}

export default function ImageSplitter() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [preset, setPreset] = useState('carousel');
  const [customRows, setCustomRows] = useState(2);
  const [customCols, setCustomCols] = useState(2);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pieces, setPieces] = useState([]); // { name, blob, url }
  const imgRef = useRef(null);
  const urlRef = useRef('');
  const piecesRef = useRef([]);
  const inputId = useId();
  const rowsId = useId();
  const colsId = useId();

  const chosen = PRESETS.find((p) => p.value === preset);
  const rows = preset === 'custom' ? customRows : chosen.rows;
  const cols = preset === 'custom' ? customCols : chosen.cols;

  const revokePieces = () => {
    piecesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
    piecesRef.current = [];
  };

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    piecesRef.current.forEach((p) => URL.revokeObjectURL(p.url));
  }, []);

  const clearPieces = () => {
    revokePieces();
    setPieces([]);
  };

  const loadFile = (picked) => {
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      setError('That does not look like a picture. Please choose a PNG, JPG, WebP or GIF image.');
      return;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    clearPieces();
    const next = URL.createObjectURL(picked);
    urlRef.current = next;
    setError('');
    setSize({ w: 0, h: 0 });
    setFile(picked);
    setUrl(next);
  };

  const onImageLoad = () => {
    const img = imgRef.current;
    if (img) setSize({ w: img.naturalWidth, h: img.naturalHeight });
  };

  const ready = Boolean(file) && size.w > 0;
  const tooManyForSize = ready && (cols > size.w || rows > size.h);
  const uneven = ready && !tooManyForSize && (size.w % cols !== 0 || size.h % rows !== 0);
  const huge = ready && size.w * size.h > BIG_PIXELS;

  const split = async () => {
    if (!ready || busy || tooManyForSize) return;
    setBusy(true);
    setError('');
    clearPieces();
    try {
      const img = imgRef.current;
      const xs = cutPoints(size.w, cols);
      const ys = cutPoints(size.h, rows);
      const base = file.name.replace(/\.[^.]+$/, '');
      const made = [];
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const w = xs[c + 1] - xs[c];
          const h = ys[r + 1] - ys[r];
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, xs[c], ys[r], w, h, 0, 0, w, h);
          const blob = await new Promise((resolve) => { canvas.toBlob(resolve, 'image/png'); });
          if (!blob) throw new Error('blob');
          made.push({ name: `${base}_r${r + 1}c${c + 1}.png`, blob, url: URL.createObjectURL(blob) });
        }
      }
      piecesRef.current = made;
      setPieces(made);
    } catch {
      setError('The picture could not be cut. It may be too large for your device. Try a smaller picture.');
    } finally {
      setBusy(false);
    }
  };

  const downloadAll = () => {
    downloadFiles(pieces.map((p) => ({ name: p.name, blob: p.blob })), `${file.name.replace(/\.[^.]+$/, '')}_pieces.zip`);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  };

  const inputStyle = 'w-24 rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine';

  const vLines = Array.from({ length: cols - 1 }, (_, i) => ((i + 1) / cols) * 100);
  const hLines = Array.from({ length: rows - 1 }, (_, i) => ((i + 1) / rows) * 100);

  return (
    <ToolFrame
      path="/tools/image-splitter"
      name="Image Splitter"
      title="Cut a picture into a grid of pieces"
      intro="Add one picture, choose how many rows and columns, and check the lines on the preview. Then press Split picture."
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
                <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Choose the grid</h2>
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
              <ChoiceChips
                label="Grid"
                options={PRESETS.map(({ value, label, hint }) => ({ value, label, hint }))}
                value={preset}
                onChange={(v) => { setPreset(v); clearPieces(); }}
              />
              {preset === 'custom' && (
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-1">
                    <label htmlFor={rowsId} className="text-sm font-semibold text-ink">Rows (1 to 10)</label>
                    <input
                      id={rowsId}
                      type="number"
                      min="1"
                      max={MAX_SIDE}
                      value={customRows}
                      onChange={(e) => { setCustomRows(clampCount(e.target.value)); clearPieces(); }}
                      className={`block ${inputStyle}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={colsId} className="text-sm font-semibold text-ink">Columns (1 to 10)</label>
                    <input
                      id={colsId}
                      type="number"
                      min="1"
                      max={MAX_SIDE}
                      value={customCols}
                      onChange={(e) => { setCustomCols(clampCount(e.target.value)); clearPieces(); }}
                      className={`block ${inputStyle}`}
                    />
                  </div>
                </div>
              )}
              <p className="truncate text-sm text-muted">
                {file.name}{ready ? ` Â· ${size.w} x ${size.h} pixels Â· ${rows * cols} piece${rows * cols === 1 ? '' : 's'}` : ''}
              </p>
              <div className="relative mx-auto w-fit max-w-full overflow-hidden rounded-xl bg-sunken">
                <img
                  ref={imgRef}
                  src={url}
                  alt="Your picture with grid lines on top"
                  onLoad={onImageLoad}
                  onError={() => setError('Your browser cannot open this picture. Try a PNG or JPG file.')}
                  className="block max-h-[420px] max-w-full"
                />
                {ready && (
                  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {vLines.map((p) => (
                      <div key={`v${p}`} className="absolute inset-y-0 w-0 border-l-2 border-dashed border-white" style={{ left: `${p}%`, filter: 'drop-shadow(0 0 1px #000)' }} />
                    ))}
                    {hLines.map((p) => (
                      <div key={`h${p}`} className="absolute inset-x-0 h-0 border-t-2 border-dashed border-white" style={{ top: `${p}%`, filter: 'drop-shadow(0 0 1px #000)' }} />
                    ))}
                  </div>
                )}
              </div>
              {tooManyForSize && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">This picture is too small for that many pieces. Choose fewer rows or columns.</p>}
              {uneven && <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink">The picture does not divide perfectly evenly, so some pieces will be 1 pixel bigger than others. Nothing is lost.</p>}
              {huge && <p className="rounded-lg bg-sand px-4 py-3 text-sm text-ink">This picture is very large, so splitting may be slow and use a lot of memory on your device.</p>}
            </Card>

            <Card className="space-y-4">
              <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Split the picture</h2>
              <div className="flex flex-wrap gap-3">
                <Button onClick={split} disabled={!ready || busy || tooManyForSize}>
                  <Scissors size={18} aria-hidden="true" />
                  {busy ? 'Splitting...' : 'Split picture'}
                </Button>
                {pieces.length > 0 && (
                  <Button variant="secondary" onClick={downloadAll}>
                    <Download size={18} aria-hidden="true" />
                    Download all (.zip)
                  </Button>
                )}
              </div>
              {error && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{error}</p>}
              {pieces.length > 0 && (
                <>
                  <p className="text-sm text-muted" role="status">Done. {pieces.length} piece{pieces.length === 1 ? '' : 's'} ready. Tap a piece to save just that one.</p>
                  <ul className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(cols, 4)}, minmax(0, 1fr))` }}>
                    {pieces.map((p) => (
                      <li key={p.name} className="space-y-1">
                        <a href={p.url} download={p.name} className="block overflow-hidden rounded-lg border border-line bg-sunken">
                          <img src={p.url} alt={p.name} className="block w-full" />
                        </a>
                        <p className="truncate text-xs text-muted">{p.name}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          </>
        )}
        {!file && error && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{error}</p>}
      </div>
    </ToolFrame>
  );
}

