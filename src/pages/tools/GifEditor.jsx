import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const GIF_OPERATIONS = [
  { label: 'Reverse GIF', id: 'reverse', desc: 'Play the animation backwards' },
  { label: 'Resize GIF', id: 'resize', desc: 'Scale to a specific width' },
  { label: 'Speed Up (2x)', id: 'speedup', desc: 'Double the animation speed' },
  { label: 'Slow Down (0.5x)', id: 'slowdown', desc: 'Half the animation speed' },
  { label: 'Crop Square (Center)', id: 'crop', desc: 'Crop to a square from center' },
];

export default function GifEditor() {
  const [operation, setOperation] = useState(GIF_OPERATIONS[0]);
  const [resizeWidth, setResizeWidth] = useState(320);
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.gif`;
    const paletteName = `palette_${uid}.png`;
    const outputName = `output_${uid}.gif`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
    onProgress(10);

    let filterChain = '';
    switch (operation.id) {
      case 'reverse':
        filterChain = 'reverse';
        break;
      case 'resize':
        filterChain = `scale=${resizeWidth}:-1:flags=lanczos`;
        break;
      case 'speedup':
        filterChain = 'setpts=0.5*PTS';
        break;
      case 'slowdown':
        filterChain = 'setpts=2*PTS';
        break;
      case 'crop':
        filterChain = 'crop=min(iw\\,ih):min(iw\\,ih)';
        break;
      default:
        filterChain = 'null';
    }

    // Pass 1: palette from filtered output
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', `${filterChain},palettegen`,
      paletteName
    ]);

    onProgress(50);
      progressHandler = ({ progress }) => onProgress(50 + progress * 50);
    ffmpeg.on('progress', progressHandler);

    // Pass 2: render GIF
    await ffmpeg.exec([
      '-i', inputName,
      '-i', paletteName,
      '-filter_complex', `[0:v]${filterChain}[x];[x][1:v]paletteuse`,
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: 'image/gif' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return { blob, name: `${baseName}_${operation.id}.gif` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
      await safeDelete(ffmpeg, paletteName);
    }
  };

  const optionsContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Operation</label>
        <div className="flex flex-col gap-1.5">
          {GIF_OPERATIONS.map((op) => (
            <button
              key={op.id}
              onClick={() => setOperation(op)}
              className={`text-left btn btn-xs px-3 py-3 h-auto rounded-xl border flex flex-col gap-0.5 ${
                operation.id === op.id
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <span className="text-xs font-semibold">{op.label}</span>
              <span className="text-[10px] opacity-70">{op.desc}</span>
            </button>
          ))}
        </div>
      </div>
      {operation.id === 'resize' && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Target Width: {resizeWidth}px</label>
          <input
            type="range" min={100} max={800} step={20} value={resizeWidth}
            onChange={e => setResizeWidth(Number(e.target.value))}
            className="range range-xs range-sky w-full"
          />
        </div>
      )}
    </div>
  );

  return (
    <ToolPageLayout
      title="GIF Editor"
      description="Reverse, resize, crop, or change the speed of animated GIF files. All processing done locally in browser."
      icon="fa-pen-to-square"
      categoryName="GIF & Image Tools"
      categoryPath="/all-tools?cat=gif-image"
      acceptTypes={{ 'image/gif': ['.gif'] }}
      optionsTitle="Edit Operation"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'Can I apply multiple operations?', a: 'Currently one operation per run. Run the tool again on the output file to chain effects.' },
        { q: 'Why does it take a while?', a: 'GIF editing uses a 2-pass palettegen process for high-quality output, which requires two render passes.' }
      ]}
    />
  );
}
