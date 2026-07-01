import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function VideoToGif() {
  const [fps, setFps] = useState(10);
  const [width, setWidth] = useState(480);
  const [startSec, setStartSec] = useState('');
  const [duration, setDuration] = useState('');
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split('.').pop();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.${ext}`;
    const paletteName = `palette_${uid}.png`;
    const outputName = `output_${uid}.gif`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));

    onProgress(10);

    // 2-pass palettegen approach for high-quality GIFs
    const timeArgs = [];
    if (startSec) timeArgs.push('-ss', String(startSec));
    if (duration) timeArgs.push('-t', String(duration));

    const filter = `fps=${fps},scale=${width}:-1:flags=lanczos`;

    // Pass 1: generate palette
    await ffmpeg.exec([
      ...timeArgs,
      '-i', inputName,
      '-vf', `${filter},palettegen`,
      paletteName
    ]);

    onProgress(50);
      progressHandler = ({ progress }) => onProgress(50 + progress * 50);
    ffmpeg.on('progress', progressHandler);

    // Pass 2: use palette to render GIF
    await ffmpeg.exec([
      ...timeArgs,
      '-i', inputName,
      '-i', paletteName,
      '-filter_complex', `${filter}[x];[x][1:v]paletteuse`,
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
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Frame Rate (FPS): {fps}</label>
        <input
          type="range" min={5} max={24} value={fps}
          onChange={e => setFps(Number(e.target.value))}
          className="range range-xs range-sky w-full"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Smaller file (5fps)</span>
          <span>Smoother (24fps)</span>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Width: {width}px</label>
        <input
          type="range" min={160} max={720} step={20} value={width}
          onChange={e => setWidth(Number(e.target.value))}
          className="range range-xs range-sky w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase">Start (sec)</label>
          <input
            type="number" value={startSec} onChange={e => setStartSec(e.target.value)}
            placeholder="e.g. 5" min={0}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-400 uppercase">Duration (sec)</label>
          <input
            type="number" value={duration} onChange={e => setDuration(e.target.value)}
            placeholder="e.g. 10" min={1}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>
      <p className="text-[10px] text-slate-400">Leave Start/Duration blank to convert the full video. Uses 2-pass palettegen for optimal quality.</p>
    </div>
  );

  return (
    <ToolPageLayout
      title="Video to GIF Converter"
      description="Convert MP4 or WebM videos into high-quality animated GIFs using 2-pass palettegen algorithm."
      icon="fa-exchange-alt"
      categoryName="GIF & Image Tools"
      categoryPath="/all-tools?cat=gif-image"
      acceptTypes={{ 'video/*': ['.mp4', '.webm', '.mov', '.avi'] }}
      optionsTitle="GIF Settings"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'What is 2-pass palettegen?', a: 'We first analyze the video to generate an optimal 256-color palette for your specific content, then use it to render the GIF. This produces far better results than a simple conversion.' },
        { q: 'Why is my GIF file large?', a: 'GIFs store frames without video compression. Lower the FPS and width to reduce file size significantly.' }
      ]}
    />
  );
}
