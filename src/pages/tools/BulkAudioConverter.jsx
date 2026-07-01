import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const formats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];

export default function BulkAudioConverter() {
  const [targetFormat, setTargetFormat] = useState('mp3');
  const processor = useBulkProcessor();

  // The converter execution logic
  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${Math.random().toString(36).substring(7)}.${inputExt}`;
    const outputName = `output_${Math.random().toString(36).substring(7)}.${targetFormat}`;

    // Write file to virtual FS
    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Probe for audio stream — catches silent MP4s or video-only files dropped here.
      // FFmpeg's log emits "Audio:" for any audio stream; absence means no extractable audio.
      let hasAudioStream = false;
      const probeHandler = ({ message }) => {
        if (message.includes('Audio:')) hasAudioStream = true;
      };
      ffmpeg.on('log', probeHandler);
      try { await ffmpeg.exec(['-i', inputName]); } catch (_) { /* expected — no output file */ }
      ffmpeg.off('log', probeHandler);

      if (!hasAudioStream) {
        throw new Error('No audio stream detected. Please upload an audio file or a video file that contains an audio track.');
      }

      progressHandler = ({ progress }) => {
      // progress is a float between 0 and 1
      onProgress(progress * 100);
    };
    ffmpeg.on('progress', progressHandler);

    // Exec transcode
    await ffmpeg.exec(['-i', inputName, outputName]);

    // Read result
    const outputData = await ffmpeg.readFile(outputName);

    // Cleanup FS
    // Build Blob
    const mimeTypes = {
      mp3: 'audio/mp3',
      wav: 'audio/wav',
      aac: 'audio/aac',
      flac: 'audio/flac',
      ogg: 'audio/ogg',
      m4a: 'audio/x-m4a'
    };
    const blob = new Blob([outputData.buffer], { type: mimeTypes[targetFormat] || 'audio/octet-stream' });
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    return {
      blob,
      name: `${baseName}.${targetFormat}`
    };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-slate-300">Target Audio Format</label>
      <div className="grid grid-cols-3 gap-2">
        {formats.map((fmt) => (
          <button
            key={fmt}
            onClick={() => setTargetFormat(fmt)}
            disabled={processor.isProcessing}
            className={`btn btn-sm uppercase font-bold tracking-wider rounded-xl ${
              targetFormat === fmt
                ? 'bg-sky-500 hover:bg-sky-600 text-slate-950 border-0'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
            }`}
          >
            {fmt}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-400">
        All audio conversions happen inside WebAssembly. No data is shared online.
      </p>
    </div>
  );

  return (
    <ToolPageLayout
      title="Bulk Audio Converter"
      description="Select your target format and upload multiple audio tracks to convert them instantly in bulk."
      icon="fa-arrows-rotate"
      categoryName="Audio Tools"
      categoryPath="/all-tools?cat=audio"
      acceptTypes={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma', '.mp4'] }}
      optionsContent={optionsContent}
      optionsTitle="Conversion Settings"
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: "Can I convert video files to audio?", a: "Yes. You can drop MP4 or WebM video files here to extract/transcode their audio directly into your selected audio format." },
        { q: "Is there a file size limit?", a: "The tool works locally, so it uses your device's memory. Batch files up to 100MB process smoothly on most modern hardware." }
      ]}
    />
  );
}
