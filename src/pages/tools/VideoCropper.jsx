import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { readVideoInfo } from '../../lib/videoInfo';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';
import useToolState from '../../hooks/useToolState';

const SHAPES = [
  { value: '16:9', label: 'Wide (16:9)', hint: 'YouTube and TV', rw: 16, rh: 9 },
  { value: '9:16', label: 'Vertical (9:16)', hint: 'Reels, TikTok, Shorts', rw: 9, rh: 16 },
  { value: '1:1', label: 'Square (1:1)', hint: 'Feed posts', rw: 1, rh: 1 },
  { value: '4:5', label: 'Portrait (4:5)', hint: 'Instagram feed', rw: 4, rh: 5 },
  { value: '4:3', label: 'Classic (4:3)', hint: 'Older TV shape', rw: 4, rh: 3 },
];

const KEEPS = [
  { value: 'center', label: 'Center', hint: 'Keep the middle' },
  { value: 'top', label: 'Top', hint: 'Keep the top' },
  { value: 'bottom', label: 'Bottom', hint: 'Keep the bottom' },
  { value: 'left', label: 'Left', hint: 'Keep the left side' },
  { value: 'right', label: 'Right', hint: 'Keep the right side' },
];

const even = (n) => Math.max(2, Math.floor(n / 2) * 2);

// Works out the crop box. Never scales: the picture is only cut, so it is never stretched or upscaled.
const cropBox = (width, height, shape, keep) => {
  const wide = width * shape.rh > height * shape.rw; // the video is wider than the target shape
  let w = width;
  let h = height;
  if (wide) w = even((height * shape.rw) / shape.rh);
  else h = even((width * shape.rh) / shape.rw);
  w = Math.min(w, even(width));
  h = Math.min(h, even(height));
  let x = even((width - w) / 2);
  let y = even((height - h) / 2);
  let usedKeep = 'center';
  if (wide) {
    if (keep === 'left') { x = 0; usedKeep = 'left'; }
    if (keep === 'right') { x = even(width - w); usedKeep = 'right'; }
  } else {
    if (keep === 'top') { y = 0; usedKeep = 'top'; }
    if (keep === 'bottom') { y = even(height - h); usedKeep = 'bottom'; }
  }
  const nothing = w >= width - 1 && h >= height - 1;
  return { w, h, x, y, wide, usedKeep, nothing };
};

const KEEP_WORDS = {
  center: 'keeps the middle',
  top: 'keeps the top',
  bottom: 'keeps the bottom',
  left: 'keeps the left side',
  right: 'keeps the right side',
};

export default function VideoCropper() {
  const [shapeValue, setShapeValue] = useToolState('shapeValue', '9:16');
  const [keep, setKeep] = useToolState('keep', 'center');
  const shape = SHAPES.find((s) => s.value === shapeValue);

  const inspect = (info) => {
    if (!info || !info.ok || !info.width || !info.height) return null;
    const box = cropBox(info.width, info.height, shape, keep);
    if (box.nothing) return { tone: 'warn', text: `This video is already ${shape.value}, so there is nothing to crop.` };
    let text = `${info.width}×${info.height} → ${box.w}×${box.h} (${KEEP_WORDS[box.usedKeep]})`;
    if (box.usedKeep === 'center' && keep !== 'center') {
      text += `. This cut is ${box.wide ? 'sideways' : 'up and down'}, so only ${box.wide ? 'Left, Center or Right' : 'Top, Center or Bottom'} applies.`;
    }
    if ((info.duration && info.duration > 600) || info.width >= 3840) {
      return { tone: 'warn', text: `${text}. This is a big video and may take a long time in the browser.` };
    }
    return { tone: 'info', text };
  };

  const processFile = async (file, onProgress, info) => {
    if (!info || !info.ok || !info.width || !info.height) {
      throw new Error('We could not read the size of this video. Try an MP4 or WebM file.');
    }
    const box = cropBox(info.width, info.height, shape, keep);
    if (box.nothing) throw new Error(`This video is already ${shape.value}, so there is nothing to crop.`);

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

      // Only cuts the picture (no scaling). Sound is kept and saved as AAC.
      await ffmpeg.exec([
        '-i', inputName,
        '-map', '0:v:0', '-map', '0:a?',
        '-vf', `crop=${box.w}:${box.h}:${box.x}:${box.y}`,
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '128k',
        '-movflags', '+faststart',
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      return {
        blob: new Blob([data.buffer], { type: 'video/mp4' }),
        name: `${baseName}_${shape.value.replace(':', 'x')}.mp4`,
      };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  return (
    <BulkTool
      path="/tools/video-cropper"
      name="Video Cropper"
      title="Cut your video to a new shape"
      intro="Trim the edges of a video to wide, vertical, square or portrait. The picture is cut, not stretched, and never made bigger."
      accept={{ 'video/*': ['.mp4', '.mov', '.webm', '.mkv', '.avi'] }}
      dropHint="Videos like MP4, MOV and WebM."
      readInfo={readVideoInfo}
      processFile={processFile}
      inspect={inspect}
      verb={{ action: 'Crop videos', working: 'Cropping' }}
      steps={[
        {
          label: 'Pick the new shape',
          content: <ChoiceChips label="Shape" options={SHAPES} value={shapeValue} onChange={setShapeValue} />,
        },
        {
          label: 'Pick which part to keep',
          content: <ChoiceChips label="Keep" options={KEEPS} value={keep} onChange={setKeep} />,
        },
      ]}
      faqs={[
        { q: 'Does this stretch or squash my video?', a: 'No. It cuts away the edges and keeps the rest exactly as it was. Nothing is stretched, and the video is never made bigger.' },
        { q: 'Which part is kept?', a: 'You choose. Center keeps the middle. Left and Right are for cutting a wide video sideways. Top and Bottom are for cutting a tall video up and down.' },
        { q: 'Why is my video a bit smaller than I expected?', a: 'The size is rounded down to an even number so every player can play it. That can make it one pixel narrower.' },
        { q: 'Will the sound be kept?', a: 'Yes. If the video has sound, it is kept. The result is saved as an MP4.' },
        { q: 'Does it get worse in quality?', a: 'The video is saved again after cropping, so there can be a very small loss. It stays sharp for normal use.' },
      ]}
    />
  );
}
