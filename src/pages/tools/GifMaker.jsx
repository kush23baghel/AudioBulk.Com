import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function GifMaker() {
  const [fps, setFps] = useState(10);
  const [loop, setLoop] = useState(0); // 0 = infinite
  const [width, setWidth] = useState(480);
  const processor = useBulkProcessor();

  // This tool receives image files and combines them into a GIF
  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const uid = Math.random().toString(36).substring(7);
    const ext = file.name.split('.').pop().toLowerCase();
    const inputName = `input_${uid}.${ext}`;
    const paletteName = `palette_${uid}.png`;
    const outputName = `output_${uid}.gif`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
    onProgress(20);

    // Scale filter
    const scaleFilter = `fps=${fps},scale=${width}:-2:flags=lanczos`;

    // Pass 1: palette
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', `${scaleFilter},palettegen`,
      paletteName
    ]);
    onProgress(60);
      progressHandler = ({ progress }) => onProgress(60 + progress * 40);
    ffmpeg.on('progress', progressHandler);

    // Pass 2: GIF
    await ffmpeg.exec([
      '-i', inputName,
      '-i', paletteName,
      '-filter_complex', `${scaleFilter}[x];[x][1:v]paletteuse`,
      '-loop', String(loop),
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: 'image/gif' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return { blob, name: `${baseName}.gif` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
      await safeDelete(ffmpeg, paletteName);
    }
  };

  const optionsContent = (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Frame Rate: {fps} FPS</label>
        <input
          type="range" min={5} max={30} value={fps}
          onChange={e => setFps(Number(e.target.value))}
          className="range range-xs range-sky w-full"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Width: {width}px</label>
        <input
          type="range" min={100} max={800} step={20} value={width}
          onChange={e => setWidth(Number(e.target.value))}
          className="range range-xs range-sky w-full"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Loop Count</label>
        {[
          { label: 'Infinite Loop', value: 0 },
          { label: 'Play Once', value: 1 },
          { label: 'Loop 3 Times', value: 3 },
        ].map(l => (
          <button key={l.value} onClick={() => setLoop(l.value)}
            className={`w-full btn btn-xs px-3 py-2 h-auto text-xs font-medium rounded-xl border ${
              loop === l.value ? 'bg-sky-500 text-white border-sky-500' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >{l.label}</button>
        ))}
      </div>
      <p className="text-[10px] text-slate-400">
        Drop an image or short video clip to convert it into an animated GIF.
      </p>
    </div>
  );

  return (
    <ToolPageLayout
      title="GIF Maker"
      description="Create animated GIFs from image sequences or short video clips. Supports PNG, JPG, WebP, and video input formats."
      icon="fa-square-plus"
      categoryName="GIF & Image Tools"
      categoryPath="/all-tools?cat=gif-image"
      acceptTypes={{
        'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
        'video/*': ['.mp4', '.webm', '.mov', '.gif']
      }}
      optionsTitle="GIF Settings"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'Can I make a GIF from images?', a: 'Yes! Drop individual PNG/JPG frames and they will each be converted to GIF. For multi-frame GIFs from a sequence, use a video clip as input.' },
        { q: 'Why is the GIF file large?', a: 'GIFs are inherently large. Lower the FPS and width to reduce file size significantly.' }
      ]}
    />
  );
}
