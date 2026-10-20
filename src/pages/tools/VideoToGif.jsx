import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import BulkTool from '../../ui/BulkTool';
import useToolState from '../../hooks/useToolState';
import { ChoiceChips } from '../../ui/controls';
import { readVideoInfo } from '../../lib/videoInfo';
import { formatBytes } from '../../lib/gifInfo';
import { createGifEncoder, delayFor, fitWidth, openVideo } from '../../lib/gif';

const LENGTHS = [
  { value: '3', label: '3 seconds' },
  { value: '5', label: '5 seconds' },
  { value: '10', label: '10 seconds' },
  { value: '15', label: '15 seconds', hint: 'GIFs get big very quickly, so 15 seconds is the longest we allow.' },
];
const WIDTHS = [
  { value: '320', label: 'Small (320)', hint: 'Small file, good for chats' },
  { value: '480', label: 'Medium (480)', hint: 'A good balance' },
  { value: '640', label: 'Large (640)', hint: 'Sharper, but a much bigger file' },
];
const SMOOTH = [
  { value: '10', label: 'Basic (10)', hint: 'Smallest file, a little choppy' },
  { value: '15', label: 'Smooth (15)', hint: 'A good balance' },
  { value: '20', label: 'Very smooth (20)', hint: 'Looks best, biggest file' },
];

export default function VideoToGif() {
  const [start, setStart] = useToolState('start', '0');
  const [length, setLength] = useToolState('length', '5');
  const [width, setWidth] = useToolState('width', '480');
  const [fps, setFps] = useToolState('fps', '15');
  const startSec = Math.max(0, Number(start) || 0);
  const lenSec = Number(length);

  const inspect = (info) => {
    if (!info || !info.ok || !info.width) return null;
    if (info.isVideo === false) return { tone: 'warn', text: 'This file has no picture, so a GIF cannot be made from it.' };
    if (info.duration && startSec >= info.duration) {
      return { tone: 'warn', text: `The start (${startSec} s) is past the end of this video (${Math.round(info.duration)} s). Choose an earlier start.` };
    }
    const real = info.duration ? Math.min(lenSec, info.duration - startSec) : lenSec;
    const w = Math.min(Number(width), info.width);
    const h = Math.round((info.height * w) / info.width);
    // Rough rule of thumb: about 0.12 bytes per pixel per frame after the GIF squeeze.
    const estimate = w * h * Number(fps) * real * 0.12;
    const text = `${Math.round(real * 10) / 10} s clip at ${w}×${h}. The GIF will be around ${formatBytes(estimate)}.`;
    if (estimate > 15 * 1024 * 1024) return { tone: 'warn', text: `${text} That is big. Try a smaller size, fewer seconds or less smoothness.` };
    if (info.width < Number(width)) return { tone: 'info', text: `${text} Your video is only ${info.width} wide, so it will not be stretched.` };
    return { tone: 'info', text };
  };

  // Main engine: the browser decodes the frames, gifenc encodes them in a background worker.
  const viaBrowser = async (file, onProgress, name) => {
    const video = await openVideo(file);
    try {
      const end = video.duration ? Math.min(startSec + lenSec, video.duration) : startSec + lenSec;
      if (startSec >= end) throw new Error('The start is past the end of this video. Choose an earlier start.');
      const rate = Number(fps);
      const count = Math.max(1, Math.floor((end - startSec) * rate + 1e-6));
      const times = Array.from({ length: count }, (_, i) => startSec + i / rate);
      const { width: w, height: h } = fitWidth(video.width, video.height, Number(width));
      const encoder = createGifEncoder({ width: w, height: h, dither: true, lossy: 100 });
      try {
        let pending = null;
        let i = 0;
        for await (const rgba of video.frames(times, w, h)) {
          await pending; // the next frame is decoded while the last one is encoded
          pending = encoder.add(rgba, delayFor(i, rate));
          i += 1;
          onProgress((i / count) * 97);
        }
        await pending;
        return { blob: await encoder.finish(), name };
      } catch (err) {
        encoder.cancel();
        throw err;
      }
    } finally {
      video.close();
    }
  };

  const processFile = async (file, onProgress, info) => {
    if (info && info.ok && info.isVideo === false) throw new Error('This file has no picture. Choose a video file instead.');
    if (info && info.ok && info.duration && startSec >= info.duration) throw new Error('The start is past the end of this video. Choose an earlier start.');
    const name = `${file.name.replace(/\.[^.]+$/, '') || file.name}.gif`;
    try {
      return await viaBrowser(file, onProgress, name);
    } catch (err) {
      // Formats the browser can't play (some AVI/MKV) still work through ffmpeg.
      if (err.message !== 'decode' && err.message !== 'timeout') throw err;
      return viaFfmpeg(file, onProgress, info, name);
    }
  };

  const viaFfmpeg = async (file, onProgress, info, name) => {
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'mp4';
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.gif`;
    let progressHandler = null;
    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(Math.min(100, Math.max(0, progress * 100)));
      ffmpeg.on('progress', progressHandler);

      // Never make the picture wider than the video itself. One filter makes the colour palette and uses it.
      const w = info && info.width ? Math.min(Number(width), info.width) : Number(width);
      const filter = `[0:v]fps=${fps},scale=${w}:-2:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse`;
      await ffmpeg.exec([
        '-ss', String(startSec), '-t', String(lenSec),
        '-i', inputName,
        '-filter_complex', filter,
        '-loop', '0',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      if (!data || data.length === 0) throw new Error('Could not make a GIF from this video. Try a different file.');
      return { blob: new Blob([data.buffer], { type: 'image/gif' }), name };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  return (
    <BulkTool
      path="/tools/video-to-gif"
      name="Video to GIF"
      title="Turn a video clip into an animated GIF"
      intro="Pick the part of the video you want, and save it as a GIF that plays on its own and loops forever. GIFs have no sound."
      accept={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      dropHint="Videos like MP4, MOV, WebM and MKV."
      readInfo={readVideoInfo}
      processFile={processFile}
      inspect={inspect}
      verb={{ action: 'Make GIF', working: 'Making GIF' }}
      steps={[
        {
          label: 'Where should the GIF start?',
          content: (
            <div className="space-y-2">
              <label htmlFor="gif-start" className="text-sm font-semibold text-ink">Start at (seconds)</label>
              <input
                id="gif-start"
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="block w-28 rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine"
              />
              <p className="text-sm text-muted">Leave it at 0 to start at the beginning.</p>
            </div>
          ),
        },
        { label: 'How long should it be?', content: <ChoiceChips label="Length" options={LENGTHS} value={length} onChange={setLength} /> },
        { label: 'How big should the picture be?', content: <ChoiceChips label="Width" options={WIDTHS} value={width} onChange={setWidth} /> },
        { label: 'How smooth should it move?', content: <ChoiceChips label="Smoothness" options={SMOOTH} value={fps} onChange={setFps} /> },
      ]}
      faqs={[
        { q: 'Why is my GIF so big?', a: 'GIF is an old format and stores every picture in full. Choose a smaller size, a shorter clip or less smoothness to shrink it. The note under each video gives a rough size before you start.' },
        { q: 'Why is there a 15 second limit?', a: 'A long GIF can easily reach tens of megabytes and may be slow or impossible to share. For longer clips, an MP4 video is a much better choice.' },
        { q: 'Does the GIF have sound?', a: 'No. GIFs cannot carry sound. Only the picture is kept.' },
        { q: 'Why does it take a while?', a: 'The GIF is made inside your browser, on your own computer. Most clips take a few seconds. Nothing is uploaded.' },
      ]}
    />
  );
}
