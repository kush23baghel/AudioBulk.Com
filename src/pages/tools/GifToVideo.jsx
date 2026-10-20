import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';
import { readGifInfo } from '../../lib/gifInfo';

const LOOPS = [
  { value: '1', label: 'Play once' },
  { value: '3', label: 'Repeat 3 times' },
  { value: '5', label: 'Repeat 5 times', hint: 'Handy when the GIF is very short and you want a longer video.' },
];

export default function GifToVideo() {
  const [loops, setLoops] = useState('1');

  const inspect = (info) => {
    if (!info) return null;
    if (!info.ok) return { tone: 'warn', text: 'This does not look like a GIF your browser can read. It may be damaged.' };
    const w = Math.floor(info.width / 2) * 2;
    const h = Math.floor(info.height / 2) * 2;
    const odd = w !== info.width || h !== info.height;
    return { tone: 'info', text: `${info.width}×${info.height} GIF becomes an MP4${odd ? ` (${w}×${h}, trimmed by a pixel because videos need even sizes)` : ''}. It will have no sound, because GIFs have none.` };
  };

  const processFile = async (file, onProgress, info) => {
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputName = `input_${id}.gif`;
    const outputName = `output_${id}.mp4`;
    let progressHandler = null;
    try {
      if (info && !info.ok) throw new Error('This GIF could not be read. Try a different file.');
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(Math.min(100, Math.max(0, progress * 100)));
      ffmpeg.on('progress', progressHandler);

      // -stream_loop N repeats the GIF N more times, so "play 3 times" means loop 2.
      await ffmpeg.exec([
        '-stream_loop', String(Number(loops) - 1),
        '-i', inputName,
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v', 'libx264', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', '-an',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      if (!data || data.length === 0) throw new Error('Could not turn this GIF into a video. Try a different file.');
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      return { blob: new Blob([data.buffer], { type: 'video/mp4' }), name: `${baseName}.mp4` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  return (
    <BulkTool
      path="/tools/gif-to-video"
      name="GIF to Video"
      title="Turn animated GIFs into MP4 videos"
      intro="Change GIFs into MP4 videos that are usually much smaller and play everywhere. GIFs have no sound, so the videos are silent."
      accept={{ 'image/gif': ['.gif'] }}
      dropHint="Animated GIF files."
      readInfo={readGifInfo}
      processFile={processFile}
      inspect={inspect}
      verb={{ action: 'Make video', working: 'Making video' }}
      steps={[{ label: 'How many times should it play?', content: <ChoiceChips label="Repeats" options={LOOPS} value={loops} onChange={setLoops} /> }]}
      faqs={[
        { q: 'Why make a GIF into a video?', a: 'An MP4 is often ten times smaller than the same GIF, and many sites and phones handle videos better.' },
        { q: 'Will there be sound?', a: 'No. GIFs have no sound, so the video is silent.' },
        { q: 'Why is the size a pixel smaller sometimes?', a: 'Videos need an even width and height. If your GIF has an odd one, a single row or column of pixels is trimmed.' },
        { q: 'Will the video loop by itself?', a: 'An MP4 plays the number of times you chose and then stops. Most apps let you set a video to repeat.' },
      ]}
    />
  );
}
