import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const formats = ['mp3', 'wav', 'aac', 'm4a'];

export default function BulkVideoToAudioConverter() {
  const [targetFormat, setTargetFormat] = useState('mp3');
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${Math.random().toString(36).substring(7)}.${inputExt}`;
    const outputName = `output_${Math.random().toString(36).substring(7)}.${targetFormat}`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));

      // BUG-12 FIX: Probe for audio stream BEFORE attempting extraction.
      // FFmpeg logs stream info on -i; parse the log for an "Audio:" descriptor.
      let hasAudioStream = false;
      const probeHandler = ({ message }) => {
        if (message.includes('Audio:')) hasAudioStream = true;
      };
      ffmpeg.on('log', probeHandler);
      // -i with no output args emits stream info then exits with error code — that's expected.
      try { await ffmpeg.exec(['-i', inputName]); } catch (_) { /* probe always "fails" — that's fine */ }
      ffmpeg.off('log', probeHandler);

      if (!hasAudioStream) {
        throw new Error('No audio track found in this video. Please upload a video file that contains an audio stream.');
      }

      progressHandler = ({ progress }) => {
      onProgress(progress * 100);
    };
    ffmpeg.on('progress', progressHandler);

    // Command: -vn disables video track, extracting audio only
    const args = ['-i', inputName, '-vn'];
    
    if (targetFormat === 'mp3') {
      args.push('-acodec', 'libmp3lame', '-ab', '192k');
    } else if (targetFormat === 'wav') {
      args.push('-acodec', 'pcm_s16le');
    } else if (targetFormat === 'aac' || targetFormat === 'm4a') {
      args.push('-acodec', 'aac', '-ab', '192k');
    }

    args.push(outputName);

    await ffmpeg.exec(args);

    const outputData = await ffmpeg.readFile(outputName);

    // Cleanup FS
    const mimeTypes = {
      mp3: 'audio/mp3',
      wav: 'audio/wav',
      aac: 'audio/aac',
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
      <label className="text-xs font-semibold text-slate-300">Audio Extract Format</label>
      <div className="grid grid-cols-2 gap-2">
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
        Disables the video tracks and copies or transcodes the audio stream locally.
      </p>
    </div>
  );

  return (
    <ToolPageLayout
      title="Video to Audio Converter"
      description="Extract pure audio soundtracks from MP4, WebM, MOV, or AVI video files in bulk."
      icon="fa-file-audio"
      categoryName="Audio Tools"
      categoryPath="/all-tools?cat=audio"
      acceptTypes={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: "Does this convert WAV or AAC audio files too?", a: "No, this tool specifically accepts video uploads to extract their embedded audio tracks. For audio file transcode, use the Bulk Audio Converter." }
      ]}
    />
  );
}
