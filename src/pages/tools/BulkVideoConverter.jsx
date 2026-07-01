import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const FORMAT_OPTIONS = [
  { label: 'MP4 (H.264)', ext: 'mp4', codec: 'libx264', mimeType: 'video/mp4' },
  { label: 'WebM (VP8)', ext: 'webm', codec: 'libvpx', mimeType: 'video/webm' },
  { label: 'AVI', ext: 'avi', codec: 'mpeg4', mimeType: 'video/x-msvideo' },
];

export default function BulkVideoConverter() {
  const [targetFormat, setTargetFormat] = useState(FORMAT_OPTIONS[0]);
  const [quality, setQuality] = useState(23);
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const uid = Math.random().toString(36).substring(7);
    const inExt = file.name.split('.').pop();
    const inputName = `input_${uid}.${inExt}`;
    const outputName = `output_${uid}.${targetFormat.ext}`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(progress * 100);
    ffmpeg.on('progress', progressHandler);

    const args = [
      '-i', inputName,
      '-c:v', targetFormat.codec,
      '-crf', String(quality),
      '-preset', 'veryfast',
      '-c:a', 'aac',
      '-b:a', '128k',
      outputName
    ];

    if (targetFormat.ext === 'webm') {
      // VP8 uses different quality param
      args[args.indexOf('-crf') + 1] = String(quality);
      args.splice(args.indexOf('-preset'), 2); // webm doesn't use preset
      args.splice(args.indexOf('-c:a'), 2, '-c:a', 'libvorbis'); // vorbis for webm
    }

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: targetFormat.mimeType });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return { blob, name: `${baseName}.${targetFormat.ext}` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Output Format</label>
        <div className="flex flex-col gap-1.5">
          {FORMAT_OPTIONS.map((f) => (
            <button
              key={f.ext}
              onClick={() => setTargetFormat(f)}
              disabled={processor.isProcessing}
              className={`btn btn-xs justify-start px-3 py-2.5 h-auto text-xs font-medium rounded-xl border disabled:opacity-50 disabled:cursor-not-allowed ${
                targetFormat.ext === f.ext
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Quality (CRF: {quality})
        </label>
        <input
          type="range"
          min={18}
          max={35}
          value={quality}
          disabled={processor.isProcessing}
          onChange={e => setQuality(Number(e.target.value))}
          className="range range-xs range-sky w-full disabled:opacity-50"
        />
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Best Quality</span>
          <span>Smaller File</span>
        </div>
      </div>
    </div>
  );

  return (
    <ToolPageLayout
      title="Bulk Video Converter"
      description="Transcode multiple video files into MP4, WebM, or AVI format. Control quality vs file size with CRF slider."
      icon="fa-video-slash"
      categoryName="Video Tools"
      categoryPath="/all-tools?cat=video"
      acceptTypes={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.ogv'] }}
      optionsTitle="Conversion Settings"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'What CRF value should I use?', a: 'CRF 18 is near-lossless. CRF 23 is the default quality. CRF 28-35 gives smaller files with more visible compression.' },
        { q: 'Which format should I use?', a: 'MP4 (H.264) for maximum compatibility. WebM for web embedding. AVI for legacy players.' }
      ]}
    />
  );
}
