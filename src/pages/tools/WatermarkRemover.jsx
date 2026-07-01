import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function WatermarkRemover() {
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [w, setW] = useState(200);
  const [h, setH] = useState(50);
  const [mode, setMode] = useState('blur'); // blur or delogo
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split('.').pop();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.${ext}`;
    const outputName = `output_nwm_${uid}.${ext}`;

    let progressHandler = null;
    try {
      // Get exact video dimensions in JS to perfectly clamp coordinates
      const dimensions = await new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          resolve({ w: video.videoWidth, h: video.videoHeight });
        };
        video.onerror = () => resolve({ w: 9999, h: 9999 }); // Fallback
        video.src = URL.createObjectURL(file);
      });

      const safeX = Math.max(0, Math.min(x, dimensions.w - 1));
      const safeY = Math.max(0, Math.min(y, dimensions.h - 1));
      const safeW = Math.max(1, Math.min(w, dimensions.w - safeX));
      const safeH = Math.max(1, Math.min(h, dimensions.h - safeY));

      await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(progress * 100);
      ffmpeg.on('progress', progressHandler);

      let filter;
      if (mode === 'blur') {
        filter = `[0:v]crop=${safeW}:${safeH}:${safeX}:${safeY},boxblur=10[blurred];[0:v][blurred]overlay=${safeX}:${safeY}[outv]`;
      } else {
        filter = `delogo=x=${safeX}:y=${safeY}:w=${safeW}:h=${safeH}`;
      }

      const args = mode === 'blur'
        ? ['-i', inputName, '-filter_complex', filter, '-map', '[outv]', '-map', '0:a?', '-c:a', 'copy', outputName]
        : ['-i', inputName, '-vf', filter, '-c:a', 'copy', outputName];

      await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: file.type || 'video/mp4' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return { blob, name: `${baseName}_no_watermark.${ext}` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-4">
      <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
        <p className="text-[10px] text-amber-400 leading-normal">
          ⚠️ You must manually specify the watermark position and size. To find pixel coordinates, right-click your video and check properties, or use a media player with coordinate display.
        </p>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Removal Mode</label>
        {[
          { v: 'blur', l: 'Blur Region', d: 'Heavy gaussian blur over the area' },
          { v: 'delogo', l: 'delogo Filter', d: 'Replaces region using neighboring pixels' },
        ].map(m => (
          <button key={m.v} onClick={() => setMode(m.v)}
            className={`w-full text-left btn btn-xs px-3 py-3 h-auto rounded-xl border flex flex-col gap-0.5 ${mode === m.v ? 'bg-sky-500 text-white border-sky-500' : 'bg-white/5 text-slate-300 border-white/10'}`}
          >
            <span className="font-semibold">{m.l}</span>
            <span className="text-[10px] opacity-70">{m.d}</span>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Watermark Position (px)</p>
        <div className="grid grid-cols-2 gap-2">
          {[['X Position', x, setX], ['Y Position', y, setY], ['Width', w, setW], ['Height', h, setH]].map(([label, val, set]) => (
            <div key={label} className="space-y-1">
              <label className="text-[10px] text-slate-400">{label}</label>
              <input type="number" value={val} min={0} onChange={e => set(Number(e.target.value))}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <ToolPageLayout
      title="Video Watermark Remover"
      description="Remove or blur watermark overlays from video files using blur or delogo filter. Specify the watermark region coordinates."
      icon="fa-circle-xmark"
      categoryName="Video Tools"
      categoryPath="/all-tools?cat=video"
      acceptTypes={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm'] }}
      optionsTitle="Watermark Settings"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'How do I find the watermark coordinates?', a: 'Play the video in VLC Media Player. Go to Tools > Media Information. The video track shows dimensions. Use screenshot tools to measure the watermark region in pixels.' },
        { q: 'Which mode produces better results?', a: 'The delogo filter uses neighboring pixel information to fill the region and often looks cleaner. Blur is more aggressive and always visible.' }
      ]}
    />
  );
}
