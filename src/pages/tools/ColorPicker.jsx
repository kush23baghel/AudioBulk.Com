import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

export default function ColorPicker() {
  const [imageURL, setImageURL] = useState(null);
  const [palette, setPalette] = useState([]);
  const [hoveredColor, setHoveredColor] = useState(null);
  const [copied, setCopied] = useState('');
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageURL(url);
    setPalette([]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setImageURL(url);
    setPalette([]);
  };

  const extractPalette = useCallback(() => {
    if (!imgRef.current || !canvasRef.current) return;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const colorMap = {};

    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      const r = Math.round(data[i] / 32) * 32;
      const g = Math.round(data[i + 1] / 32) * 32;
      const b = Math.round(data[i + 2] / 32) * 32;
      const alpha = data[i + 3];
      if (alpha < 128) continue; // skip transparent
      const key = `${r},${g},${b}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }

    // Sort by frequency and take top 12
    const sorted = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([key]) => {
        const [r, g, b] = key.split(',').map(Number);
        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        return { r, g, b, hex };
      });

    setPalette(sorted);
  }, []);

  const pickColor = useCallback((e) => {
    if (!canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.naturalWidth / imgRef.current.offsetWidth;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.offsetHeight;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(v => v.toString(16).padStart(2, '0')).join('');
    setHoveredColor(hex);
  }, []);

  const copyColor = (hex) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white">Home</Link></li>
          <li><Link to="/all-tools?cat=gif-image" className="hover:text-white">GIF & Image Tools</Link></li>
          <li className="text-sky-600 font-medium">Color Picker</li>
        </ul>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-eye-dropper text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Color Picker & Palette</h1>
          <p className="text-slate-400 text-sm">Upload an image to extract its color palette or pick specific pixel colors.</p>
        </div>
      </div>

      {!imageURL ? (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="rounded-2xl border-2 border-dashed border-white/10 hover:border-sky-500/50 bg-white/5 p-20 text-center cursor-pointer transition-all"
          onClick={() => document.getElementById('color-file-input').click()}
        >
          <i className="fa-solid fa-image text-5xl text-slate-400 mb-4"></i>
          <p className="text-slate-400 text-sm">Drop an image here, or click to upload</p>
          <p className="text-slate-400 text-xs mt-1">Supports PNG, JPG, WebP, GIF</p>
          <input id="color-file-input" type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-white/10 cursor-crosshair">
              <img
                ref={imgRef}
                src={imageURL}
                alt="Uploaded"
                onLoad={extractPalette}
                onMouseMove={pickColor}
                className="w-full object-contain max-h-96"
              />
              {hoveredColor && (
                <div className="absolute top-2 left-2 flex items-center gap-2 bg-slate-950/90 border border-white/10 rounded-lg px-3 py-1.5">
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: hoveredColor }}></div>
                  <span className="text-xs font-mono text-white">{hoveredColor}</span>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            {hoveredColor && (
              <button
                onClick={() => copyColor(hoveredColor)}
                className="w-full btn bg-sky-500 hover:bg-sky-600 border-0 text-white rounded-xl gap-2"
              >
                <i className="fa-solid fa-copy"></i>
                {copied === hoveredColor ? 'Copied!' : `Copy ${hoveredColor}`}
              </button>
            )}
            <button
              onClick={() => { setImageURL(null); setPalette([]); }}
              className="w-full btn btn-outline btn-sm rounded-xl text-slate-400 border-white/10"
            >
              Upload Another Image
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit">Extracted Palette</h3>
            <div className="grid grid-cols-3 gap-3">
              {palette.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => copyColor(c.hex)}
                  className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all"
                  title={c.hex}
                >
                  <div className="h-16" style={{ backgroundColor: c.hex }}></div>
                  <div className="px-2 py-1.5 bg-slate-900/90 text-center">
                    <p className="text-[10px] font-mono text-slate-300">{c.hex}</p>
                    <p className="text-[9px] text-slate-400">rgb({c.r},{c.g},{c.b})</p>
                  </div>
                  {copied === c.hex && (
                    <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center">
                      <i className="fa-solid fa-check text-sky-600 text-xl"></i>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {palette.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-8">Loading palette...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
