import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { formatDuration } from '../../lib/audioInfo';
import { readVideoInfo } from '../../lib/videoInfo';
import { grabFrames, convertImage } from '../../lib/videoFrames';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';

const MAX_FRAMES = 300;
const EVEN_COUNT = 12;

const SPACING = [
  { value: '1', label: 'Every 1 second', hint: 'Lots of pictures' },
  { value: '2', label: 'Every 2 seconds', hint: 'A good all-round choice' },
  { value: '5', label: 'Every 5 seconds', hint: 'A few pictures' },
  { value: '10', label: 'Every 10 seconds', hint: 'Only the key moments' },
  { value: 'even', label: `${EVEN_COUNT} evenly spaced frames`, hint: 'The same number from every video, short or long' },
];

const FORMATS = [
  { value: 'jpg', label: 'JPG (small)', hint: 'Small files, great for sharing' },
  { value: 'png', label: 'PNG (perfect)', hint: 'No quality loss, much bigger files' },
];

// How many pictures this setting gives for a video of this length.
const countFrames = (spacing, duration) => {
  if (spacing === 'even') return EVEN_COUNT;
  if (!duration) return null;
  return Math.max(1, Math.ceil(duration / Number(spacing) - 1e-6));
};

export default function VideoFrameExtractor() {
  const [spacing, setSpacing] = useState('2');
  const [format, setFormat] = useState('jpg');

  const inspect = (info) => {
    if (!info || !info.ok) return null;
    if (info.duration && info.duration > 600) {
      return { tone: 'warn', text: 'This video is long, so it may take a while in the browser. A bigger gap between pictures will be faster.' };
    }
    const n = countFrames(spacing, info.duration);
    if (n === null) return null;
    if (n > MAX_FRAMES) {
      return { tone: 'warn', text: `This would be ${n} pictures. We keep the first ${MAX_FRAMES} only. Pick a bigger gap to cover the whole video.` };
    }
    const where = info.duration
      ? (spacing === 'even' ? ` spread across the ${formatDuration(info.duration)} video` : ` from the ${formatDuration(info.duration)} video`)
      : '';
    return { tone: 'info', text: `About ${n} picture${n === 1 ? '' : 's'}${where}.${n > 1 ? ' You get them in one .zip.' : ''}` };
  };

  const processFile = async (file, onProgress, info) => {
    const duration = info && info.ok && info.duration ? info.duration : null;
    const expected = countFrames(spacing, duration);
    const limit = expected === null || expected > MAX_FRAMES ? MAX_FRAMES : expected;
    const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const named = (blobs) => blobs.map((blob, i) => ({ blob, name: `${baseName}_frame_${String(i + 1).padStart(3, '0')}.${format}` }));

    // 1) The browser's own decoder: fast, exact times, no ffmpeg needed.
    if (duration) {
      const times = spacing === 'even'
        ? Array.from({ length: EVEN_COUNT }, (_, i) => (duration * (i + 0.5)) / EVEN_COUNT)
        : Array.from({ length: limit }, (_, i) => i * Number(spacing)).filter((t) => t < duration);
      try {
        const frames = named(await grabFrames(file, times, { type: mime, onProgress: (p) => onProgress(Math.min(99, p)) }));
        onProgress(100);
        return { blob: frames[0].blob, name: frames[0].name, extra: frames.slice(1) };
      } catch {
        // The browser can't play this format (e.g. some MKV/AVI). Fall back to ffmpeg below.
      }
    }

    // 2) ffmpeg fallback. Always PNG: ffmpeg.wasm's JPG encoder crashes on many H.264 videos.
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${id}.${inputExt}`;
    const pattern = `frame_${id}_%03d.png`;
    const frameName = (n) => `frame_${id}_${String(n).padStart(3, '0')}.png`;

    let progressHandler = null;
    let logHandler = null;
    let written = 0;
    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Some builds never send a progress event, so also count the "frame=" lines in the log.
      progressHandler = ({ progress }) => {
        if (progress > 0 && progress <= 1) onProgress(Math.min(99, progress * 100));
      };
      logHandler = ({ message }) => {
        const m = message.match(/frame=\s*(\d+)/);
        if (m) {
          written = Math.max(written, Number(m[1]));
          onProgress(Math.min(99, (written / limit) * 100));
        }
      };
      ffmpeg.on('progress', progressHandler);
      ffmpeg.on('log', logHandler);

      // -an -sn: ignore sound and subtitles. -frames:v: stop at the right count so ffmpeg never waits for more.
      const filter = spacing === 'even' && duration ? `fps=${EVEN_COUNT}/${duration.toFixed(3)}` : `fps=1/${spacing === 'even' ? 5 : spacing}`;
      await ffmpeg.exec(['-i', inputName, '-an', '-sn', '-vf', filter, '-frames:v', String(limit), '-c:v', 'png', pattern]);

      const blobs = [];
      for (let n = 1; n <= limit; n++) {
        let data;
        try { data = await ffmpeg.readFile(frameName(n)); } catch { break; }
        blobs.push(await convertImage(new Blob([data.buffer], { type: 'image/png' }), mime));
      }
      if (blobs.length === 0) throw new Error('No pictures could be taken from this video. Try a different video file.');
      const frames = named(blobs);
      onProgress(100);

      return { blob: frames[0].blob, name: frames[0].name, extra: frames.slice(1) };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      if (logHandler) ffmpeg.off('log', logHandler);
      await safeDelete(ffmpeg, inputName);
      for (let n = 1; n <= limit; n++) await safeDelete(ffmpeg, frameName(n));
    }
  };

  return (
    <BulkTool
      path="/tools/video-frame-extractor"
      name="Video Frame Extractor"
      title="Save pictures from a video"
      intro="Take still pictures out of your videos at the spacing you choose. Many pictures come together in one .zip."
      accept={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      dropHint="Video files like MP4, MOV and WebM."
      readInfo={readVideoInfo}
      processFile={processFile}
      inspect={inspect}
      verb={{ action: 'Take pictures', working: 'Taking pictures' }}
      steps={[
        {
          label: 'Pick how often to take a picture',
          content: <ChoiceChips label="Spacing" options={SPACING} value={spacing} onChange={setSpacing} />,
        },
        {
          label: 'Pick the picture type',
          content: <ChoiceChips label="Picture type" options={FORMATS} value={format} onChange={setFormat} />,
        },
      ]}
      faqs={[
        { q: 'Are my videos uploaded anywhere?', a: 'No. Everything happens inside your web browser, on your own computer. Your videos never leave your device.' },
        { q: 'Which type should I pick?', a: 'JPG makes small files that look great for almost everything. Pick PNG if you need every pixel exactly as in the video. PNG files are much bigger.' },
        { q: 'How many pictures can I get?', a: `Up to ${MAX_FRAMES} pictures per video. For a long video, pick a bigger gap or the evenly spaced choice so the pictures cover the whole video.` },
        { q: 'Are the pictures as sharp as the video?', a: 'They have the same size as the video. A picture cannot be sharper than the video it comes from.' },
        { q: 'Why is a long video slow?', a: 'Your browser does the work, which is slower than a desktop app. Large or long videos can take a few minutes.' },
      ]}
    />
  );
}
