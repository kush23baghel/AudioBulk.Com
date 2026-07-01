import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function ImageHueAdjuster() {
  const [imageURL, setImageURL] = useState(null);
  const [outputURL, setOutputURL] = useState(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageURL(URL.createObjectURL(file));
    setOutputURL(null);
  };

  const applyFilters = () => {
    if (!imgRef.current || !canvasRef.current) return;
    setProcessing(true);
    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.filter = [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturation}%)`,
      `hue-rotate(${hue}deg)`,
      `grayscale(${grayscale}%)`,
      `sepia(${sepia}%)`,
    ].join(' ');

    ctx.drawImage(img, 0, 0);
    const url = canvas.toDataURL('image/png');
    setOutputURL(url);
    setProcessing(false);
  };

  const download = () => {
    if (!outputURL) return;
    const a = document.createElement('a');
    a.href = outputURL;
    a.download = `adjusted_image.png`;
    a.click();
  };

  const reset = () => {
    setBrightness(100); setContrast(100); setSaturation(100);
    setHue(0); setGrayscale(0); setSepia(0);
    setOutputURL(null);
  };

  const sliders = [
    { label: 'Brightness', value: brightness, set: setBrightness, min: 0, max: 200, unit: '%' },
    { label: 'Contrast', value: contrast, set: setContrast, min: 0, max: 200, unit: '%' },
    { label: 'Saturation', value: saturation, set: setSaturation, min: 0, max: 200, unit: '%' },
    { label: 'Hue Rotate', value: hue, set: setHue, min: 0, max: 360, unit: '°' },
    { label: 'Grayscale', value: grayscale, set: setGrayscale, min: 0, max: 100, unit: '%' },
    { label: 'Sepia', value: sepia, set: setSepia, min: 0, max: 100, unit: '%' },
  ];

  const filterStyle = {
    filter: [
      `brightness(${brightness}%)`,
      `contrast(${contrast}%)`,
      `saturate(${saturation}%)`,
      `hue-rotate(${hue}deg)`,
      `grayscale(${grayscale}%)`,
      `sepia(${sepia}%)`,
    ].join(' ')
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white">Home</Link></li>
          <li><Link to="/all-tools?cat=gif-image" className="hover:text-white">GIF & Image Tools</Link></li>
          <li className="text-sky-600 font-medium">Image Color Adjuster</li>
        </ul>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-palette text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Image Color Adjuster</h1>
          <p className="text-slate-400 text-sm">Modify brightness, contrast, saturation, hue, grayscale, and sepia. Live preview included.</p>
        </div>
      </div>

      {!imageURL ? (
        <div
          className="rounded-2xl border-2 border-dashed border-white/10 hover:border-sky-500/50 bg-white/5 p-20 text-center cursor-pointer transition-all"
          onClick={() => document.getElementById('hue-file-input').click()}
        >
          <i className="fa-solid fa-palette text-5xl text-slate-400 mb-4"></i>
          <p className="text-slate-400 text-sm">Click to upload an image</p>
          <input id="hue-file-input" type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Preview</p>
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img
                ref={imgRef}
                src={imageURL}
                alt="Preview"
                style={filterStyle}
                className="w-full object-contain max-h-80"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <button
                onClick={applyFilters}
                disabled={processing}
                className="flex-1 btn bg-sky-500 hover:bg-sky-600 border-0 text-white font-semibold rounded-xl gap-2"
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                {processing ? 'Applying...' : 'Apply & Save'}
              </button>
              <button onClick={reset} className="btn btn-outline border-white/10 text-slate-400 rounded-xl">
                Reset
              </button>
            </div>
            {outputURL && (
              <button onClick={download} className="w-full btn bg-emerald-500 hover:bg-emerald-600 border-0 text-white rounded-xl gap-2">
                <i className="fa-solid fa-download"></i> Download PNG
              </button>
            )}
            <button onClick={() => { setImageURL(null); setOutputURL(null); reset(); }}
              className="w-full btn btn-outline btn-sm border-white/10 text-slate-400 rounded-xl">
              Upload Different Image
            </button>
          </div>

          <div className="space-y-5">
            <div className="glass-card rounded-2xl border border-white/10 p-5 space-y-5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-outfit border-b border-white/10 pb-2">Adjustments</h3>
              {sliders.map(s => (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex justify-between">
                    <label className="text-xs font-semibold text-slate-300">{s.label}</label>
                    <span className="text-xs text-sky-600 font-mono">{s.value}{s.unit}</span>
                  </div>
                  <input
                    type="range" min={s.min} max={s.max} value={s.value}
                    onChange={e => { s.set(Number(e.target.value)); setOutputURL(null); }}
                    className="range range-xs range-sky w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
