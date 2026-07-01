import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function BulkVideoCompressor() {
  const [quality, setQuality] = useState('medium'); // low, medium, high
  const [resolution, setResolution] = useState('original'); // original, 1080p, 720p, 480p
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${Math.random().toString(36).substring(7)}.${inputExt}`;
    const outputName = `output_${Math.random().toString(36).substring(7)}.mp4`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => {
      onProgress(progress * 100);
    };
    ffmpeg.on('progress', progressHandler);

    // Build FFmpeg command args
    const args = ['-i', inputName];

    // Video Codec
    args.push('-c:v', 'libx264');

    // Quality CRF setting (CRF 18-28 is standard; 28 is smaller, 23 is default)
    const crfValue = quality === 'high' ? '22' : quality === 'medium' ? '26' : '30';
    args.push('-crf', crfValue);
    args.push('-preset', 'veryfast'); // critical for browser performance

    // Resolution scaling filter
    if (resolution === '1080p') {
      args.push('-vf', 'scale=-2:1080');
    } else if (resolution === '720p') {
      args.push('-vf', 'scale=-2:720');
    } else if (resolution === '480p') {
      args.push('-vf', 'scale=-2:480');
    }

    // Audio copy
    args.push('-c:a', 'aac');

    args.push(outputName);

    // Exec
    await ffmpeg.exec(args);

    const outputData = await ffmpeg.readFile(outputName);

    // Cleanup FS
    const blob = new Blob([outputData.buffer], { type: 'video/mp4' });
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    return {
      blob,
      name: `${baseName}_compressed.mp4`
    };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-5">
      {/* Quality Presets */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Compression Level</label>
        <div className="grid grid-cols-3 gap-2">
          {['low', 'medium', 'high'].map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              disabled={processor.isProcessing}
              className={`btn btn-xs uppercase font-bold py-2 h-auto rounded-xl border border-white/10 ${
                quality === q
                  ? 'bg-sky-500 hover:bg-sky-600 text-slate-950 border-0'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {q === 'low' ? 'Small' : q === 'medium' ? 'Balanced' : 'High Quality'}
            </button>
          ))}
        </div>
      </div>

      {/* Resolution Scales */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Target Resolution</label>
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          disabled={processor.isProcessing}
          className="select select-sm select-bordered w-full bg-white/5 border-white/10 rounded-xl text-slate-300"
        >
          <option value="original">Original Aspect Ratio</option>
          <option value="1080p">1080p Full HD</option>
          <option value="720p">720p HD</option>
          <option value="480p">480p SD</option>
        </select>
      </div>
      <p className="text-[10px] text-slate-400 leading-normal">
        Compressing videos in browser takes time. For large videos, select "Balanced" or "Small" with "720p" or "480p" to speed up the process.
      </p>
    </div>
  );

  return (
    <ToolPageLayout
      title="Bulk Video Compressor"
      description="Reduce video dimensions and bitrates locally. Adjust resolution or quality presets to fit upload limits."
      icon="fa-compress-arrows-alt"
      categoryName="Video Tools"
      categoryPath="/all-tools?cat=video"
      acceptTypes={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: "Is it secure to compress my videos here?", a: "Yes. The compression runs entirely on your device inside your web browser. No part of your video is sent to the internet." },
        { q: "Why is video compression slow?", a: "Video encoding requires heavy mathematical computations. Because it runs inside a browser sandbox, it takes longer than native desktop software." }
      ]}
    />
  );
}
