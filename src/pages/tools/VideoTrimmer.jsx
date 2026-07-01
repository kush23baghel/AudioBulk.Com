import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function VideoTrimmer() {
  const [startTime, setStartTime] = useState('00:00:00');
  const [endTime, setEndTime] = useState('00:00:30');
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split('.').pop();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.${ext}`;
    const outputName = `output_trimmed_${uid}.${ext}`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(progress * 100);
    ffmpeg.on('progress', progressHandler);

    await ffmpeg.exec([
      '-i', inputName,
      '-ss', startTime,
      '-to', endTime,
      '-c', 'copy',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: file.type || 'video/mp4' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return { blob, name: `${baseName}_trimmed.${ext}` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Start Time</label>
        <input
          type="text"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          placeholder="HH:MM:SS"
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
        <p className="text-[10px] text-slate-400">Format: HH:MM:SS (e.g. 00:00:05)</p>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">End Time</label>
        <input
          type="text"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          placeholder="HH:MM:SS"
          className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
        />
        <p className="text-[10px] text-slate-400">Format: HH:MM:SS (e.g. 00:01:30)</p>
      </div>
      <div className="rounded-xl bg-sky-500/5 border border-sky-500/10 p-3">
        <p className="text-[10px] text-sky-600 leading-normal">
          Uses stream copy (no re-encode) for instant trimming. Output format matches the input.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPageLayout
      title="Video Cutter & Trimmer"
      description="Trim or cut specific duration clips from your video files. Set start and end time stamps to extract the exact segment you need."
      icon="fa-scissors"
      categoryName="Video Tools"
      categoryPath="/all-tools?cat=video"
      acceptTypes={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      optionsTitle="Trim Settings"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'Does trimming re-encode the video?', a: 'No. We use -c copy (stream copy) which is instant and lossless. The output quality is identical to the input.' },
        { q: 'What if my end time is longer than the video?', a: 'FFmpeg will automatically stop at the end of the video, so it is safe to overestimate the end time.' }
      ]}
    />
  );
}
