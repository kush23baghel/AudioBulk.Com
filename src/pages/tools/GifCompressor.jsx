import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function GifCompressor() {
  const [colors, setColors] = useState(128);
  const [fps, setFps] = useState(10);
  const [scale, setScale] = useState(100);
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.gif`;
    const paletteName = `palette_${uid}.png`;
    const outputName = `output_compressed_${uid}.gif`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
    onProgress(10);

    const w = scale < 100 ? `iw*${scale}/100` : 'iw';
    const scaleFilter = `fps=${fps},scale=${w}:-1:flags=lanczos`;

    // Pass 1: palettegen
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', `${scaleFilter},palettegen=max_colors=${colors}:stats_mode=diff`,
      paletteName
    ]);

    onProgress(50);
      progressHandler = ({ progress }) => onProgress(50 + progress * 50);
    ffmpeg.on('progress', progressHandler);

    // Pass 2: render with palette
    await ffmpeg.exec([
      '-i', inputName,
      '-i', paletteName,
      '-filter_complex', `${scaleFilter}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`,
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: 'image/gif' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return { blob, name: `${baseName}_compressed.gif` };
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
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Max Colors: {colors}</label>
        <input
          type="range" min={32} max={256} step={16} value={colors}
          onChange={e => setColors(Number(e.target.value))}
          className="range range-xs range-sky w-full"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>More compression</span>
          <span>Better quality</span>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Frame Rate: {fps} FPS</label>
        <input
          type="range" min={5} max={24} value={fps}
          onChange={e => setFps(Number(e.target.value))}
          className="range range-xs range-sky w-full"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Scale: {scale}%</label>
        <input
          type="range" min={25} max={100} step={5} value={scale}
          onChange={e => setScale(Number(e.target.value))}
          className="range range-xs range-sky w-full"
        />
      </div>
    </div>
  );

  return (
    <ToolPageLayout
      title="GIF Compressor"
      description="Reduce animated GIF file sizes by adjusting color depth, frame rate, and dimensions using 2-pass palettegen."
      icon="fa-file-zipper"
      categoryName="GIF & Image Tools"
      categoryPath="/all-tools?cat=gif-image"
      acceptTypes={{ 'image/gif': ['.gif'] }}
      optionsTitle="Compression Settings"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'What is the biggest factor for GIF size?', a: 'Frame rate has the biggest impact. Dropping from 25fps to 10fps can cut file size in half while still looking smooth.' },
        { q: 'What does max colors do?', a: 'GIFs support a max of 256 colors. Reducing the palette to 64 or 128 colors significantly shrinks the file at minimal visual cost.' }
      ]}
    />
  );
}
