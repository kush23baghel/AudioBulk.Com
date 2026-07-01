import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const bitrates = [64, 96, 128, 160, 192];

export default function BulkAudioCompressor() {
  const [bitrate, setBitrate] = useState(128);
  const processor = useBulkProcessor();

  // The compressor execution logic
  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();

    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${Math.random().toString(36).substring(7)}.${inputExt}`;
    const outputName = `output_${Math.random().toString(36).substring(7)}.mp3`;

    // Write file to virtual FS
    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => {
      // progress is a float between 0 and 1
      onProgress(progress * 100);
    };
    ffmpeg.on('progress', progressHandler);

    // Exec compression
    await ffmpeg.exec(['-i', inputName, '-c:a', 'libmp3lame', '-b:a', `${bitrate}k`, outputName]);

    // Read result
    const outputData = await ffmpeg.readFile(outputName);

    // Cleanup FS
    // Build Blob
    const blob = new Blob([outputData.buffer], { type: 'audio/mp3' });
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    return {
      blob,
      name: `${baseName}.mp3`
    };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-slate-300">Target Bitrate</label>
      <div className="grid grid-cols-3 gap-2">
        {bitrates.map((br) => (
          <button
            key={br}
            onClick={() => setBitrate(br)}
            disabled={processor.isProcessing}
            className={`btn btn-sm uppercase font-bold tracking-wider rounded-xl ${
              bitrate === br
                ? 'bg-sky-500 hover:bg-sky-600 text-slate-950 border-0'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            {br}kbps
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-400">
        Lower bitrate means smaller files but reduced audio quality. 128kbps is a good balance for most use cases.
      </p>
    </div>
  );

  return (
    <ToolPageLayout
      title="Bulk Audio Compressor"
      description="Reduce file sizes of multiple audio files by optimizing bitrate. Lower bitrate = smaller file but reduced quality."
      icon="fa-compress"
      categoryName="Audio Tools"
      categoryPath="/all-tools?cat=audio"
      acceptTypes={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'] }}
      optionsContent={optionsContent}
      optionsTitle="Compression Settings"
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: "How does audio compression work?", a: "Audio compression reduces file size by lowering the bitrate, which determines how much data is used per second of audio. Lower bitrates discard more audio detail to achieve smaller files." },
        { q: "Which bitrate should I choose?", a: "128kbps offers a good balance between quality and file size for most listeners. Use 192kbps for higher fidelity, or 64kbps when file size is the top priority (e.g. voice recordings or podcasts)." }
      ]}
    />
  );
}
