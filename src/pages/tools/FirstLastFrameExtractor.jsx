import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { readVideoInfo } from '../../lib/videoInfo';
import { grabFrames, convertImage } from '../../lib/videoFrames';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';

const WHICH = [
  { value: 'both', label: 'First and last', hint: 'Two pictures from each video' },
  { value: 'first', label: 'First only', hint: 'The opening picture' },
  { value: 'last', label: 'Last only', hint: 'The closing picture' },
];

const FORMATS = [
  { value: 'jpg', label: 'JPG', hint: 'Smaller files, great for sharing and thumbnails' },
  { value: 'png', label: 'PNG', hint: 'Sharpest quality, bigger files' },
];

export default function FirstLastFrameExtractor() {
  const [which, setWhich] = useState('both');
  const [format, setFormat] = useState('jpg');

  const inspect = (info) => {
    if (!info || !info.ok) return null;
    if (info.isVideo === false) return { tone: 'warn', text: 'This does not look like a video, so there are no pictures to take.' };
    const size = info.width && info.height ? `${info.width}×${info.height}` : null;
    const count = which === 'both' ? 'two pictures' : 'one picture';
    if (info.duration && info.duration > 600) {
      return { tone: 'warn', text: `Will save ${count}${size ? ` at ${size}` : ''}. This video is long, so finding the last picture may take a while in the browser.` };
    }
    return { tone: 'info', text: `Will save ${count}${size ? `, each ${size}` : ''}, the same size as the video.` };
  };

  const processFile = async (file, onProgress) => {
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
    const wanted = [which !== 'last' && 'first', which !== 'first' && 'last'].filter(Boolean);

    // 1) The browser's own decoder: fast and exact (-0 = the very last frame).
    try {
      const blobs = await grabFrames(file, wanted.map((w) => (w === 'first' ? 0 : -0)), { type: mime, onProgress });
      const pieces = blobs.map((blob, i) => ({ blob, name: `${baseName}_${wanted[i]}.${format}` }));
      return { ...pieces[0], extra: pieces.slice(1) };
    } catch {
      // The browser can't play this format. Fall back to ffmpeg below.
    }

    // 2) ffmpeg fallback. Always PNG: ffmpeg.wasm's JPG encoder crashes on many H.264 videos.
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${id}.${inputExt}`;
    const firstName = `first_${id}.png`;
    const lastName = `last_${id}.png`;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      onProgress(10);

      if (which !== 'last') {
        await ffmpeg.exec(['-i', inputName, '-an', '-frames:v', '1', '-c:v', 'png', firstName]);
      }
      onProgress(which === 'first' ? 80 : 45);

      if (which !== 'first') {
        // Jump to half a second before the end and keep overwriting one picture,
        // so what is left is the very last frame of the video.
        await ffmpeg.exec(['-sseof', '-0.5', '-i', inputName, '-an', '-update', '1', '-c:v', 'png', lastName]);
        onProgress(85);
      }

      const pieces = [];
      if (which !== 'last') {
        const data = await ffmpeg.readFile(firstName);
        pieces.push({ blob: await convertImage(new Blob([data.buffer], { type: 'image/png' }), mime), name: `${baseName}_first.${format}` });
      }
      if (which !== 'first') {
        let data;
        try { data = await ffmpeg.readFile(lastName); } catch { data = null; }
        if (!data || !data.length) throw new Error('Could not get the last picture from this video. Try another video.');
        pieces.push({ blob: await convertImage(new Blob([data.buffer], { type: 'image/png' }), mime), name: `${baseName}_last.${format}` });
      }
      return { ...pieces[0], extra: pieces.slice(1) };
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Could not get')) throw err;
      throw new Error('Could not read pictures from this file. Make sure it is a working video.', { cause: err });
    } finally {
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, firstName);
      await safeDelete(ffmpeg, lastName);
    }
  };

  return (
    <BulkTool
      path="/tools/first-last-frame-extractor"
      name="First & Last Frame"
      title="Save the first and last picture of a video"
      intro="Grab the opening and closing picture of many videos at once, the same size as the video. Handy for thumbnails and covers."
      accept={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      dropHint="Video files like MP4, MOV, WebM and MKV."
      readInfo={readVideoInfo}
      processFile={processFile}
      inspect={inspect}
      verb={{ action: 'Save pictures', working: 'Saving pictures' }}
      steps={[
        {
          label: 'Pick which pictures you want',
          content: <ChoiceChips label="Pictures" options={WHICH} value={which} onChange={setWhich} />,
        },
        {
          label: 'Pick the picture type',
          content: <ChoiceChips label="Type" options={FORMATS} value={format} onChange={setFormat} />,
        },
      ]}
      faqs={[
        { q: 'Is the last picture really the last one?', a: 'Yes. We jump to the very end of the video and save the final picture, so it is the closing moment, not a picture from the start.' },
        { q: 'How big are the pictures?', a: 'The same size as your video. A 1280×720 video gives 1280×720 pictures.' },
        { q: 'Which type should I pick?', a: 'JPG is smaller and good for most things. PNG keeps every detail but the files are bigger.' },
        { q: 'Where do I get the pictures?', a: 'Each video gives files ending in _first and _last. With many files, you can download everything as one zip.' },
        { q: 'Are my videos uploaded anywhere?', a: 'No. Everything happens in your web browser, on your own computer. Your videos never leave your device.' },
      ]}
    />
  );
}
