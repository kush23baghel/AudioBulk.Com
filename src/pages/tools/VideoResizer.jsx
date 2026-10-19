import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';
import { readVideoInfo } from '../../lib/videoInfo';

const SIZES = [
  { value: '1080', label: '1080p', hint: 'Full HD, 1920×1080 for a wide video', height: 1080 },
  { value: '720', label: '720p', hint: 'HD, 1280×720. Good for sharing', height: 720 },
  { value: '480', label: '480p', hint: 'Smaller file, 854×480', height: 480 },
  { value: '360', label: '360p', hint: 'Very small file, 640×360', height: 360 },
  { value: 'square', label: 'Square for Instagram (1080×1080)', hint: 'Same width and height', w: 1080, h: 1080 },
  { value: 'vertical', label: 'Vertical for TikTok/Reels (1080×1920)', hint: 'Tall phone screen', w: 1080, h: 1920 },
];

const FITS = [
  { value: 'fit', label: 'Fit with bars', hint: 'Shows the whole picture and adds black bars where needed' },
  { value: 'fill', label: 'Fill and cut edges', hint: 'Fills the whole frame and trims what sticks out' },
];

const even = (n) => Math.max(2, Math.round(n / 2) * 2);

export default function VideoResizer() {
  const [sizeValue, setSizeValue] = useState('720');
  const [fit, setFit] = useState('fit');
  const size = SIZES.find((s) => s.value === sizeValue);
  const isFixed = Boolean(size.w);

  const inspect = (info) => {
    if (!info || !info.ok || !info.width || !info.height) return null;
    const heavy = info.duration > 600 || info.width >= 3840;
    const slow = heavy ? ' This is a big video, so it may take a long time in your browser.' : '';
    if (isFixed) {
      const ratio = info.width / info.height;
      const same = Math.abs(ratio - size.w / size.h) < 0.02;
      const how = same ? '' : fit === 'fit' ? ' Black bars will be added.' : ' Edges will be trimmed.';
      return { tone: heavy ? 'warn' : 'info', text: `${info.width}×${info.height} → ${size.w}×${size.h}.${how}${slow}` };
    }
    const newW = even(info.width * (size.height / info.height));
    if (info.height === size.height) {
      return { tone: 'info', text: `This video is already ${size.height}p, so only a fresh copy will be made.${slow}` };
    }
    if (size.height > info.height) {
      return { tone: 'warn', text: `${info.width}×${info.height} → ${newW}×${size.height}. This makes the video bigger, not sharper. It adds no detail and the file gets larger.${slow}` };
    }
    const smaller = Math.round((1 - (newW * size.height) / (info.width * info.height)) * 100);
    return { tone: heavy ? 'warn' : 'info', text: `${info.width}×${info.height} → ${newW}×${size.height}, about ${smaller}% fewer pixels, so a smaller file.${slow}` };
  };

  const processFile = async (file, onProgress, info) => {
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'mp4';
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.mp4`;
    let progressHandler = null;

    try {
      if (info && info.ok && info.isVideo === false) {
        throw new Error('This file has no picture. Choose a video file instead.');
      }
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      let filter;
      let suffix;
      if (isFixed) {
        const { w, h } = size;
        filter = fit === 'fit'
          ? `scale=${w}:${h}:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1`
          : `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1`;
        suffix = `_${w}x${h}${fit === 'fit' ? '_bars' : '_filled'}`;
      } else {
        filter = `scale=-2:${size.height},setsar=1`;
        suffix = `_${size.height}p`;
      }

      progressHandler = ({ progress }) => onProgress(Math.min(100, Math.max(0, progress * 100)));
      ffmpeg.on('progress', progressHandler);

      // Sound is kept (saved as AAC so it plays everywhere); silent videos stay silent.
      await ffmpeg.exec([
        '-i', inputName,
        '-map', '0:v:0', '-map', '0:a:0?',
        '-vf', filter,
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      if (!data || data.length === 0) throw new Error('Could not resize this video. Try a different file.');
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      return { blob: new Blob([data.buffer], { type: 'video/mp4' }), name: `${baseName}${suffix}.mp4` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const steps = [
    {
      label: 'Pick a size',
      content: <ChoiceChips label="Size" options={SIZES} value={sizeValue} onChange={setSizeValue} />,
    },
  ];
  if (isFixed) {
    steps.push({
      label: 'Pick what to do with the extra space',
      content: <ChoiceChips label="Shape" options={FITS} value={fit} onChange={setFit} />,
    });
  }

  return (
    <BulkTool
      path="/tools/video-resizer"
      name="Video Resizer"
      title="Make videos bigger or smaller"
      intro="Change the size of many videos at once, for sharing, saving space, or posting to Instagram and TikTok. Videos are saved as MP4."
      accept={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      dropHint="Videos like MP4, MOV, WebM and MKV."
      readInfo={readVideoInfo}
      processFile={processFile}
      inspect={inspect}
      verb={{ action: 'Resize', working: 'Resizing' }}
      steps={steps}
      faqs={[
        { q: 'Does the picture stay the right shape?', a: 'For 1080p, 720p, 480p and 360p, yes. The shape is kept and only the size changes. For Square and Vertical, you choose between black bars or trimmed edges.' },
        { q: 'Can I make a video bigger?', a: 'You can, but it will not look sharper. Making a video bigger adds no detail. It only makes the file larger.' },
        { q: 'Will the sound change?', a: 'The sound is kept. It is saved again in a format that plays everywhere, so there can be a very small difference. Videos with no sound stay silent.' },
        { q: 'Why is it slow?', a: 'Your videos are changed inside your browser, on your own computer, which is slower than a video editor. Long or very large videos can take a while. Nothing is uploaded.' },
      ]}
    />
  );
}
