import { useState } from 'react';
import { reencodeGif } from '../../lib/gif';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';
import { readGifInfo, formatBytes } from '../../lib/gifInfo';

const ACTIONS = [
  { value: 'resize', label: 'Resize', hint: 'Change how wide the GIF is. The shape stays the same.' },
  { value: 'speed', label: 'Speed', hint: 'Make the GIF play faster or slower.' },
  { value: 'reverse', label: 'Reverse', hint: 'Play the GIF backwards.' },
  { value: 'square', label: 'Crop to square', hint: 'Cuts the sides (or top and bottom) from the middle to make a square.' },
];
const WIDTHS = [
  { value: '320', label: '320 wide' },
  { value: '480', label: '480 wide' },
  { value: '640', label: '640 wide' },
];
const SPEEDS = [
  { value: '0.5', label: 'Slower (0.5×)' },
  { value: '1.5', label: 'Faster (1.5×)' },
  { value: '2', label: 'Twice as fast (2×)' },
];

export default function GifEditor() {
  const [action, setAction] = useState('resize');
  const [width, setWidth] = useState('480');
  const [speed, setSpeed] = useState('2');

  const inspect = (info, file) => {
    if (!info) return null;
    if (!info.ok) return { tone: 'warn', text: 'This does not look like a GIF your browser can read. It may be damaged.' };
    const big = file.size > 15 * 1024 * 1024 ? ' This GIF is large, so it may take a while in your browser.' : '';
    const now = `${info.width}×${info.height}, ${formatBytes(file.size)}.`;
    if (action === 'resize') {
      if (Number(width) >= info.width) return { tone: 'warn', text: `${now} It is already ${info.width} wide, so choosing ${width} will not make it sharper. Pick a smaller width.${big}` };
      return { tone: 'info', text: `${now} Will become ${width}×${Math.round((info.height * Number(width)) / info.width)}.${big}` };
    }
    if (action === 'square') {
      if (info.width === info.height) return { tone: 'info', text: `${now} It is already square, so only a copy will be made.${big}` };
      const side = Math.min(info.width, info.height);
      return { tone: 'info', text: `${now} Will be cut to ${side}×${side} from the middle.${big}` };
    }
    if (action === 'speed') return { tone: 'info', text: `${now} Will play at ${speed}× speed.${big}` };
    return { tone: 'info', text: `${now} Will play backwards.${big}` };
  };

  const processFile = async (file, onProgress, info) => {
    if (info && !info.ok) throw new Error('This GIF could not be read. Try a different file.');
    const edits = {
      resize: [{ maxWidth: Number(width) }, `${width}w`],
      speed: [{ speed: Number(speed) }, `${speed}x`],
      reverse: [{ reverse: true }, 'reversed'],
      square: [{ square: true }, 'square'],
    };
    const [opts, suffix] = edits[action];
    const { blob } = await reencodeGif(file, { ...opts, onProgress });
    const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
    return { blob, name: `${baseName}_${suffix}.gif` };
  };

  const steps = [{ label: 'What do you want to do?', content: <ChoiceChips label="Action" options={ACTIONS} value={action} onChange={setAction} /> }];
  if (action === 'resize') steps.push({ label: 'Pick a width', content: <ChoiceChips label="Width" options={WIDTHS} value={width} onChange={setWidth} /> });
  if (action === 'speed') steps.push({ label: 'Pick a speed', content: <ChoiceChips label="Speed" options={SPEEDS} value={speed} onChange={setSpeed} /> });

  return (
    <BulkTool
      path="/tools/gif-editor"
      name="GIF Editor"
      title="Resize, speed up, reverse or crop GIFs"
      intro="Pick one change and apply it to many GIFs at once. Need two changes? Run the tool again on the new GIFs."
      accept={{ 'image/gif': ['.gif'] }}
      dropHint="Animated GIF files."
      readInfo={readGifInfo}
      processFile={processFile}
      inspect={inspect}
      verb={{ action: 'Edit', working: 'Editing' }}
      steps={steps}
      faqs={[
        { q: 'Can I do more than one change?', a: 'One at a time. Edit your GIFs, then add the new ones and apply the next change.' },
        { q: 'Does the GIF still loop?', a: 'Yes. The edited GIF repeats forever.' },
        { q: 'Does speed change the length?', a: 'Yes. Faster means a shorter GIF and slower means a longer one. When a sped-up GIF would be faster than browsers can play, some frames are joined so it still plays at the right speed everywhere.' },
        { q: 'Is quality lost?', a: 'A little can be, because each GIF is saved again with a fresh set of colors. Resizing smaller usually looks fine.' },
      ]}
    />
  );
}
