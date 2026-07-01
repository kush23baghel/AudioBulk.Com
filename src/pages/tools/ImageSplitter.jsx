import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function ImageSplitter() {
  const [imageURL, setImageURL] = useState(null);
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(3);
  const [tiles, setTiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageURL(URL.createObjectURL(file));
    setTiles([]);
  };

  const splitImage = async () => {
    if (!imgRef.current || !canvasRef.current) return;
    setIsProcessing(true);
    setTiles([]);

    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = img.naturalWidth;
    const H = img.naturalHeight;

    const tileW = Math.floor(W / cols);
    const tileH = Math.floor(H / rows);
    const newTiles = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        canvas.width = tileW;
        canvas.height = tileH;
        ctx.drawImage(img, c * tileW, r * tileH, tileW, tileH, 0, 0, tileW, tileH);
        const url = canvas.toDataURL('image/png');
        newTiles.push({ url, row: r + 1, col: c + 1, index: r * cols + c + 1 });
      }
    }

    setTiles(newTiles);
    setIsProcessing(false);
  };

  const downloadAll = () => {
    tiles.forEach((tile, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = tile.url;
        a.download = `tile_${tile.row}x${tile.col}.png`;
        a.click();
      }, i * 150);
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white">Home</Link></li>
          <li><Link to="/all-tools?cat=gif-image" className="hover:text-white">GIF & Image Tools</Link></li>
          <li className="text-sky-600 font-medium">Image Splitter</li>
        </ul>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-border-all text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Image Splitter</h1>
          <p className="text-slate-400 text-sm">Slice a single image into a grid of equal tiles for carousel uploads or Instagram grids.</p>
        </div>
      </div>

      {!imageURL ? (
        <div
          className="rounded-2xl border-2 border-dashed border-white/10 hover:border-sky-500/50 bg-white/5 p-20 text-center cursor-pointer transition-all"
          onClick={() => document.getElementById('splitter-file').click()}
        >
          <i className="fa-solid fa-border-all text-5xl text-slate-400 mb-4"></i>
          <p className="text-slate-400 text-sm">Click to upload an image to split</p>
          <input id="splitter-file" type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <img ref={imgRef} src={imageURL} alt="Source" className="w-full rounded-xl border border-white/10 object-contain max-h-80" />
            <canvas ref={canvasRef} className="hidden" />
            {tiles.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">Tiles ({rows}×{cols} = {tiles.length} pieces)</p>
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                  {tiles.map(tile => (
                    <div key={tile.index} className="relative group">
                      <img src={tile.url} alt={`Tile ${tile.index}`} className="w-full rounded-lg border border-white/10" />
                      <a
                        href={tile.url}
                        download={`tile_${tile.row}x${tile.col}.png`}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                      >
                        <i className="fa-solid fa-download text-white text-lg"></i>
                      </a>
                      <p className="text-center text-[9px] text-slate-400 mt-0.5">{tile.row},{tile.col}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit border-b border-white/10 pb-2">Grid Settings</h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Columns: {cols}</label>
                <input type="range" min={1} max={6} value={cols} onChange={e => { setCols(Number(e.target.value)); setTiles([]); }}
                  className="range range-xs range-sky w-full" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Rows: {rows}</label>
                <input type="range" min={1} max={6} value={rows} onChange={e => { setRows(Number(e.target.value)); setTiles([]); }}
                  className="range range-xs range-sky w-full" />
              </div>
              <div className="rounded-xl bg-[#0b1426]/80 backdrop-blur-md shadow-inner border border-white/10 p-3 text-center">
                <p className="text-sm text-white font-bold">{rows * cols} tiles</p>
                <p className="text-[10px] text-slate-400">{rows} rows × {cols} columns</p>
              </div>
              <button
                onClick={splitImage}
                disabled={isProcessing}
                className="w-full btn bg-sky-500 hover:bg-sky-600 border-0 text-white font-semibold rounded-xl gap-2"
              >
                <i className="fa-solid fa-border-all"></i>
                {isProcessing ? 'Splitting...' : 'Split Image'}
              </button>
              {tiles.length > 0 && (
                <button onClick={downloadAll} className="w-full btn bg-emerald-500 hover:bg-emerald-600 border-0 text-white rounded-xl gap-2">
                  <i className="fa-solid fa-download"></i> Download All Tiles
                </button>
              )}
            </div>
            <button onClick={() => { setImageURL(null); setTiles([]); }} className="w-full btn btn-outline btn-sm border-white/10 text-slate-400 rounded-xl">
              Upload Different Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
