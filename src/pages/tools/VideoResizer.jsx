import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const PRESETS = [
  { label: '4K (3840×2160)', w: 3840, h: 2160 },
  { label: '1080p (1920×1080)', w: 1920, h: 1080 },
  { label: '720p (1280×720)', w: 1280, h: 720 },
  { label: '480p (854×480)', w: 854, h: 480 },
  { label: '360p (640×360)', w: 640, h: 360 },
  { label: 'Square (1080×1080)', w: 1080, h: 1080 },
  { label: 'Portrait (1080×1920)', w: 1080, h: 1920 },
];

export default function VideoResizer() {
  const [preset, setPreset] = useState(PRESETS[1]);
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split('.').pop();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.${ext}`;
    const outputName = `output_resized_${uid}.${ext}`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));

    const w = useCustom ? (customW || -2) : preset.w;
    const h = useCustom ? (customH || -2) : preset.h;

    // Use -2 to maintain aspect ratio when one dimension is set
    const scale = `scale=${w}:${h}`;
      progressHandler = ({ progress }) => onProgress(progress * 100);
    ffmpeg.on('progress', progressHandler);

    await ffmpeg.exec([
      '-i', inputName,
      '-vf', scale,
      '-c:v', 'libx264',
      '-crf', '23',
      '-preset', 'veryfast',
      '-c:a', 'copy',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const label = useCustom ? `${w}x${h}` : `${preset.w}x${preset.h}`;
    return { blob, name: `${baseName}_${label}.${ext}` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Resolution Preset</label>
        <div className="flex flex-col gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => { setPreset(p); setUseCustom(false); }}
              className={`btn btn-xs justify-start px-3 py-2 h-auto text-xs font-medium rounded-xl border ${
                !useCustom && preset.label === p.label
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => setUseCustom(v => !v)}
          className={`w-full btn btn-xs px-3 py-2 h-auto text-xs font-medium rounded-xl border ${
            useCustom ? 'bg-sky-500 text-white border-sky-500' : 'bg-white/5 text-slate-300 border-white/10'
          }`}
        >
          Custom Resolution
        </button>
        {useCustom && (
          <div className="flex gap-2">
            <input
              type="number"
              value={customW}
              onChange={e => setCustomW(e.target.value)}
              placeholder="Width"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            <input
              type="number"
              value={customH}
              onChange={e => setCustomH(e.target.value)}
              placeholder="Height"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ToolPageLayout
      title="Video Resizer & Scaler"
      description="Scale your videos to standard resolutions (4K, 1080p, 720p) or custom dimensions. Maintains quality using H.264 encoding."
      icon="fa-expand-arrows-alt"
      categoryName="Video Tools"
      categoryPath="/all-tools?cat=video"
      acceptTypes={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      optionsTitle="Resize Settings"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'Can I upscale a video?', a: 'Yes, but upscaling beyond the original resolution will not add detail. It just makes the file larger.' },
        { q: 'Will audio be affected?', a: 'No. The audio track is copied without modification.' }
      ]}
    />
  );
}
