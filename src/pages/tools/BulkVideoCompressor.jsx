import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { readVideoInfo } from '../../lib/videoInfo';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips, QualitySlider } from '../../ui/controls';

const LEVELS = [
  { label: 'Smallest', detail: 'Smallest file. The picture looks softer, fine for sharing quickly', crf: 32 },
  { label: 'Small', detail: 'Small file with a picture that still looks good', crf: 28 },
  { label: 'Balanced', detail: 'A good mix of small size and nice picture', crf: 24 },
  { label: 'Best quality', detail: 'Looks almost like the original, but the file is not much smaller', crf: 20 },
];

const SIZES = [
  { value: 'keep', label: 'Keep the size', hint: 'Only the file gets smaller' },
  { value: '720', label: 'Make it 720p', hint: 'HD. Much smaller, still sharp on most screens' },
  { value: '480', label: 'Make it 480p', hint: 'Smallest. Good for phones and quick sharing' },
];

const formatMB = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default function BulkVideoCompressor() {
  const [level, setLevel] = useState(2);
  const [size, setSize] = useState('keep');
  const chosen = LEVELS[level];

  const inspect = (info, file) => {
    if (!info || !info.ok) return null;
    if (info.isVideo === false) return { tone: 'warn', text: 'This does not look like a video, so it may not work.' };
    const heavy = (info.duration && info.duration > 600) || (info.width && info.width >= 3840);
    const target = size === 'keep' ? 0 : Number(size);
    const shrinks = target && info.height && info.height > target;

    // Rough "how much data per pixel" check, assuming about 30 pictures a second.
    if (info.width && info.height && info.duration && file && file.size) {
      const audioKbps = info.hasAudio && info.kbps ? info.kbps : 0;
      const videoKbps = Math.max(0, (file.size * 8) / info.duration / 1000 - audioKbps);
      const perPixel = (videoKbps * 1000) / (info.width * info.height * 30);
      if (perPixel < 0.05) {
        return {
          tone: 'warn',
          text: `This video is already small for its picture size (about ${Math.round(videoKbps)} kbps). Compressing it again may lose quality and save very little.`,
        };
      }
    }

    const parts = [];
    if (shrinks) {
      const w = Math.round((info.width * target) / info.height / 2) * 2;
      parts.push(`${info.width}×${info.height} → ${w}×${target}.`);
    } else if (target) {
      parts.push(`This video is already ${info.height}p, so the size stays the same (it is never made bigger).`);
    }
    // Savings depend a lot on the video, so give an honest range, not one number.
    const savings = ['usually be 60–85% smaller', 'usually be 45–70% smaller', 'usually be 20–55% smaller', 'often be only 10–30% smaller'][level];
    parts.push(`The file will ${savings}${shrinks ? ', and more because the picture gets smaller too' : ''}. The real amount depends on the video. If it would come out bigger, you keep the original.`);
    if (heavy) parts.push('A long or very large video may take a long time in the browser.');
    return { tone: heavy ? 'warn' : 'info', text: parts.join(' ') };
  };

  const processFile = async (file, onProgress, info) => {
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.mp4`;
    let progressHandler = null;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(Math.min(100, Math.max(0, progress * 100)));
      ffmpeg.on('progress', progressHandler);

      const target = size === 'keep' ? 0 : Number(size);
      const fast = file.size > 150 * 1048576 ? 'ultrafast' : 'veryfast';
      const args = ['-i', inputName, '-map', '0:v:0', '-map', '0:a:0?'];
      // Only ever shrink: min() keeps the height when it is already smaller. Height stays even.
      if (target) args.push('-vf', `scale=-2:trunc(min(${target}\\,ih)/2)*2`);
      args.push('-c:v', 'libx264', '-crf', String(chosen.crf), '-preset', fast, '-pix_fmt', 'yuv420p');
      if (info && info.ok && info.hasAudio !== false) args.push('-c:a', 'aac', '-b:a', '128k');
      args.push('-movflags', '+faststart', outputName);

      try {
        await ffmpeg.exec(args);
      } catch {
        throw new Error('This video could not be compressed. It may be damaged or in a format the browser cannot read. Try another file.');
      }

      const data = await ffmpeg.readFile(outputName);
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      if (!data || data.length === 0) throw new Error('The compressed video came out empty. Try a different file.');
      // If compressing made it bigger, keep the original instead of a worse, larger file.
      if (data.length >= file.size && /\.mp4$/i.test(file.name)) {
        return { blob: new Blob([await file.arrayBuffer()], { type: 'video/mp4' }), name: `${baseName}_already_small.mp4` };
      }
      return {
        blob: new Blob([data.buffer], { type: 'video/mp4' }),
        name: `${baseName}_${formatMB(data.length).replace(/\s/g, '').toLowerCase()}.mp4`,
      };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  return (
    <BulkTool
      path="/tools/bulk-video-compressor"
      name="Video Compressor"
      title="Make videos smaller"
      intro="Shrink many videos at once so they are easy to send or upload. Every video is saved as an MP4 that plays almost everywhere."
      accept={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      dropHint="Videos like MP4, MOV, WebM and MKV."
      processFile={processFile}
      readInfo={readVideoInfo}
      inspect={inspect}
      verb={{ action: 'Make smaller', working: 'Making smaller' }}
      steps={[
        {
          label: 'Pick how small',
          content: <QualitySlider label="Size" levels={LEVELS} value={level} onChange={setLevel} />,
        },
        {
          label: 'Also make it smaller in size? (optional)',
          content: <ChoiceChips label="Picture size" options={SIZES} value={size} onChange={setSize} />,
        },
      ]}
      faqs={[
        { q: 'Are my videos uploaded anywhere?', a: 'No. Your videos are changed inside your web browser, on your own computer. They never leave your device, and we never see them.' },
        { q: 'Why does it take a while?', a: 'Shrinking a video is hard work, and a browser is slower at it than a desktop app. Short clips are quick. Long or very large videos can take many minutes.' },
        { q: 'Will the video look worse?', a: 'A little, yes. Smaller files always give up some detail. "Balanced" is hard to tell apart from the original for most videos. "Smallest" looks softer.' },
        { q: 'What if my video is already small?', a: 'Compressing it again can lose quality and save very little. We warn you when we think that is the case. If the result would be bigger than the original MP4, we keep your original.' },
        { q: 'Can it make a small video bigger or sharper?', a: 'No. Picking 720p or 480p never makes a video larger, and it cannot add detail that was not there.' },
      ]}
    />
  );
}
