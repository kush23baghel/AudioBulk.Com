import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const speedOptions = [
  { label: '0.25x (Very Slow)', value: 0.25 },
  { label: '0.5x (Slow)', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1.0x (Normal)', value: 1.0 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x (Fast)', value: 1.5 },
  { label: '2.0x (Double)', value: 2.0 },
  { label: '4.0x (Very Fast)', value: 4.0 }
];

// Generates the chained atempo filter string for values < 0.5 or > 2.0
const getAtempoFilter = (speed) => {
  if (speed >= 0.5 && speed <= 2.0) {
    return `atempo=${speed}`;
  }
  if (speed > 2.0) {
    const parts = [];
    let remaining = speed;
    while (remaining > 2.0) {
      parts.push('atempo=2.0');
      remaining /= 2.0;
    }
    parts.push(`atempo=${remaining}`);
    return parts.join(',');
  }
  if (speed < 0.5) {
    const parts = [];
    let remaining = speed;
    while (remaining < 0.5) {
      parts.push('atempo=0.5');
      remaining *= 2.0;
    }
    parts.push(`atempo=${remaining}`);
    return parts.join(',');
  }
  return 'atempo=1.0';
};

export default function BulkSpeedChanger() {
  const [speed, setSpeed] = useState(1.5);
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const isVideo = file.type.startsWith('video') || ['.mp4', '.mkv', '.webm', '.mov', '.avi'].some(ext => file.name.endsWith(ext));
    
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'mp4';
    const inputName = `input_${Math.random().toString(36).substring(7)}.${inputExt}`;
    const outputName = `output_${Math.random().toString(36).substring(7)}.${inputExt}`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => {
      onProgress(progress * 100);
    };
    ffmpeg.on('progress', progressHandler);

    const args = ['-i', inputName];

    if (isVideo) {
      // For video, adjust video speed using setpts and audio speed using atempo
      args.push('-filter:v', `setpts=${1 / speed}*PTS`);
      args.push('-filter:a', getAtempoFilter(speed));
      args.push('-preset', 'veryfast');
    } else {
      // For audio only, adjust audio speed using atempo
      args.push('-filter:a', getAtempoFilter(speed));
    }

    args.push(outputName);

    await ffmpeg.exec(args);

    const outputData = await ffmpeg.readFile(outputName);

    // Cleanup FS
    const blob = new Blob([outputData.buffer], { type: file.type || 'application/octet-stream' });
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    return {
      blob,
      name: `${baseName}_${speed}x.${inputExt}`
    };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Choose Playback Speed</label>
        <div className="flex flex-col gap-2">
          {speedOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSpeed(opt.value)}
              disabled={processor.isProcessing}
              className={`btn btn-xs justify-between px-4 py-2.5 h-auto text-xs font-bold rounded-xl border border-white/10 ${
                speed === opt.value
                  ? 'bg-sky-500 hover:bg-sky-600 text-slate-950 border-0'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span>{opt.label}</span>
              {speed === opt.value && <i className="fa-solid fa-circle-check text-slate-950 text-sm"></i>}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 leading-normal">
        Changes speed without modifying the audio pitch. Works for both standalone audio files and full video uploads.
      </p>
    </div>
  );

  return (
    <ToolPageLayout
      title="Bulk Speed Changer"
      description="Increase or decrease playback speeds of multiple audio or video files simultaneously."
      icon="fa-gauge"
      categoryName="Audio Tools"
      categoryPath="/all-tools?cat=audio"
      acceptTypes={{
        'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'],
        'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv']
      }}
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: "Will this change the pitch of human vocals?", a: "No. The tool uses a pitch-preservation algorithm (atempo filter) to ensure voices stay natural, just faster or slower." }
      ]}
    />
  );
}
