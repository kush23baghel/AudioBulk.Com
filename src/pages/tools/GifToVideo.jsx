import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function GifToVideo() {
  const [format, setFormat] = useState('mp4');
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.gif`;
    const outputName = `output_${uid}.${format}`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(progress * 100);
    ffmpeg.on('progress', progressHandler);

    let args;
    if (format === 'mp4') {
      args = [
        '-i', inputName,
        '-movflags', 'faststart',
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', // ensure even dimensions
        '-c:v', 'libx264',
        '-crf', '18',
        '-preset', 'veryfast',
        outputName
      ];
    } else {
      args = [
        '-i', inputName,
        '-c:v', 'libvpx',
        '-b:v', '1M',
        '-auto-alt-ref', '0',
        outputName
      ];
    }

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';
    const blob = new Blob([data.buffer], { type: mimeType });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return { blob, name: `${baseName}.${format}` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Output Format</label>
        {['mp4', 'webm'].map(f => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`w-full btn btn-xs px-3 py-2.5 h-auto text-xs font-medium rounded-xl border ${
              format === f
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {f.toUpperCase()} {f === 'mp4' ? '(Most Compatible)' : '(Web Optimized)'}
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3">
        <p className="text-[10px] text-emerald-600 leading-normal">
          MP4 output uses H.264 with yuv420p pixel format for maximum device compatibility. CRF 18 = near-lossless quality.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPageLayout
      title="GIF to Video Converter"
      description="Convert animated GIFs into looping MP4 or WebM video files. MP4 output is compatible with all major platforms."
      icon="fa-film"
      categoryName="GIF & Image Tools"
      categoryPath="/all-tools?cat=gif-image"
      acceptTypes={{ 'image/gif': ['.gif'] }}
      optionsTitle="Output Format"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'Why convert GIF to video?', a: 'MP4 files are typically 5-10x smaller than equivalent GIFs and are supported on more platforms including Twitter and Slack.' },
        { q: 'Will the loop be preserved?', a: 'Yes, the animation is looped by default. Most video platforms auto-loop short clips.' }
      ]}
    />
  );
}
