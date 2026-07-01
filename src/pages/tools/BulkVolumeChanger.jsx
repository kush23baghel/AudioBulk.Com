import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function BulkVolumeChanger() {
  const [volume, setVolume] = useState(150); // percentage: 0 to 300
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

    const volumeValue = (volume / 100).toFixed(2);
    const args = ['-i', inputName];

    if (isVideo) {
      // PRO-TIP: We copy the video stream directly without re-encoding (-c:v copy),
      // and only process/filter the audio stream. This makes video volume changes extremely fast!
      args.push('-c:v', 'copy');
      args.push('-filter:a', `volume=${volumeValue}`);
    } else {
      args.push('-filter:a', `volume=${volumeValue}`);
    }

    args.push(outputName);

    await ffmpeg.exec(args);

    const outputData = await ffmpeg.readFile(outputName);

    // Cleanup FS
    const blob = new Blob([outputData.buffer], { type: file.type || 'application/octet-stream' });
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    return {
      blob,
      name: `${baseName}_volume_${volume}pct.${inputExt}`
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
        <div className="flex justify-between text-xs font-semibold text-slate-300">
          <span>Target Volume Gain</span>
          <span className="text-sky-600 font-bold">{volume}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="300"
          value={volume}
          onChange={(e) => setVolume(parseInt(e.target.value))}
          disabled={processor.isProcessing}
          className="range range-sky range-xs bg-white/5 border border-white/10 p-1 rounded-lg"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-bold px-1">
          <span>Mute (0%)</span>
          <span>Normal (100%)</span>
          <span>Loud (300%)</span>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 leading-normal">
        Boosting volume past 150% can lead to digital audio clipping/distortion if the source file is already recorded at a high volume.
      </p>
    </div>
  );

  return (
    <ToolPageLayout
      title="Bulk Volume Changer"
      description="Boost or reduce the loudness of multiple audio tracks or video background sounds instantly."
      icon="fa-volume-high"
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
        { q: "Will this re-encode my videos?", a: "No. The video stream is copied block-for-block. Only the audio track is transcoded with the new volume, which takes just a few seconds." }
      ]}
    />
  );
}
