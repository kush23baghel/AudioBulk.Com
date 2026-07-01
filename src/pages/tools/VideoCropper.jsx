import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const ASPECT_RATIOS = [
  { label: '16:9 (Landscape)', w: 1920, h: 1080 },
  { label: '9:16 (Portrait/Reels)', w: 1080, h: 1920 },
  { label: '1:1 (Square)', w: 1080, h: 1080 },
  { label: '4:3 (Classic)', w: 1440, h: 1080 },
  { label: '4:5 (Instagram)', w: 1080, h: 1350 },
];

export default function VideoCropper() {
  const [ratio, setRatio] = useState(ASPECT_RATIOS[0]);
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split('.').pop();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.${ext}`;
    const outputName = `output_cropped_${uid}.mp4`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));

    const { w, h } = ratio;

    // Crop to center using crop filter
    // First scale to cover the target size, then crop to exact size
    const filter = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;
      progressHandler = ({ progress }) => onProgress(progress * 100);
    ffmpeg.on('progress', progressHandler);

    await ffmpeg.exec([
      '-i', inputName,
      '-vf', filter,
      '-c:v', 'libx264',
      '-crf', '23',
      '-preset', 'veryfast',
      '-c:a', 'copy',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: 'video/mp4' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const ratioLabel = ratio.label.replace(/[^a-zA-Z0-9]/g, '_');
    return { blob, name: `${baseName}_${ratioLabel}.mp4` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Target Aspect Ratio</label>
        <div className="flex flex-col gap-1.5">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r.label}
              onClick={() => setRatio(r)}
              className={`btn btn-xs justify-between px-3 py-2.5 h-auto text-xs font-medium rounded-xl border ${
                ratio.label === r.label
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <span>{r.label}</span>
              <span className="text-[10px] opacity-60">{r.w}×{r.h}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-sky-500/5 border border-sky-500/10 p-3">
        <p className="text-[10px] text-sky-600 leading-normal">
          Crops to the center of the video. Great for converting landscape footage to vertical Reels/TikTok format.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPageLayout
      title="Video Cropper"
      description="Crop aspect ratios (16:9 → 9:16 vertical for social clips). Center-crops your video to any standard aspect ratio."
      icon="fa-crop"
      categoryName="Video Tools"
      categoryPath="/all-tools?cat=video"
      acceptTypes={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      optionsTitle="Crop Ratio"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'What is center crop?', a: 'The tool scales the video to fill the target size and then trims the edges, keeping the center of the frame.' },
        { q: 'Why convert to vertical?', a: 'Platforms like TikTok, Instagram Reels, and YouTube Shorts require 9:16 portrait video.' }
      ]}
    />
  );
}
