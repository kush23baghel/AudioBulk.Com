import { useState } from 'react';
import { reencodeGif } from '../../lib/gif';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';
import { readGifInfo, formatBytes } from '../../lib/gifInfo';

const COLORS = [
  { value: '256', label: 'Most colors (256)', hint: 'Best looking, smallest saving' },
  { value: '128', label: 'Fewer colors (128)', hint: 'A good balance' },
  { value: '64', label: 'Few colors (64)', hint: 'Smallest file, the picture looks a bit flatter' },
];
const SIZES = [
  { value: '0', label: 'Keep size' },
  { value: '480', label: 'Up to 480 wide' },
  { value: '320', label: 'Up to 320 wide', hint: 'Makes the biggest difference to the file size.' },
];
const SPEEDS = [
  { value: '0', label: 'Keep smoothness' },
  { value: '12', label: 'Lower (12)' },
  { value: '8', label: 'Lowest (8)', hint: 'Smaller file, but the movement gets choppy.' },
];

export default function GifCompressor() {
  const [colors, setColors] = useState('128');
  const [maxWidth, setMaxWidth] = useState('0');
  const [fps, setFps] = useState('0');

  const inspect = (info, file) => {
    if (!info) return null;
    if (!info.ok) return { tone: 'warn', text: 'This does not look like a GIF your browser can read. It may be damaged.' };
    const size = formatBytes(file.size);
    if (colors === '256' && maxWidth === '0' && fps === '0') {
      return { tone: 'warn', text: `${size} now. With these settings almost nothing is removed, so the file may not get smaller. Pick fewer colors, a smaller width or lower smoothness.` };
    }
    const bits = [];
    if (colors !== '256') bits.push(`${colors} colors`);
    if (maxWidth !== '0' && info.width > Number(maxWidth)) bits.push(`${maxWidth} wide instead of ${info.width}`);
    if (fps !== '0') bits.push(`at most ${fps} pictures a second`);
    return { tone: 'info', text: `${size} now. It will be saved with ${bits.length ? bits.join(', ') : 'the same size'}. If the new file is not smaller, your original is kept.` };
  };

  const processFile = async (file, onProgress, info) => {
    if (info && !info.ok) throw new Error('This GIF could not be read. Try a different file.');
    // No dithering and a looser "same pixel" match: both make the file much easier to squeeze.
    const lossy = { 256: 150, 128: 300, 64: 500 }[colors];
    const { blob } = await reencodeGif(file, {
      maxColors: Number(colors),
      maxWidth: Number(maxWidth),
      maxFps: Number(fps),
      dither: false,
      lossy,
      onProgress,
    });
    const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
    // A bigger result is no use, so give the original back in that case.
    if (blob.size >= file.size) return { blob: file, name: `${baseName}_already_small.gif` };
    return { blob, name: `${baseName}_smaller.gif` };
  };

  return (
    <BulkTool
      path="/tools/gif-compressor"
      name="GIF Compressor"
      title="Make GIFs smaller"
      intro="Shrink many GIFs at once so they load faster and are easier to send. If a GIF cannot be made smaller, you get the original back."
      accept={{ 'image/gif': ['.gif'] }}
      dropHint="Animated GIF files."
      readInfo={readGifInfo}
      processFile={processFile}
      inspect={inspect}
      verb={{ action: 'Shrink', working: 'Shrinking' }}
      steps={[
        { label: 'How many colors to keep?', content: <ChoiceChips label="Colors" options={COLORS} value={colors} onChange={setColors} /> },
        { label: 'Make the picture smaller?', content: <ChoiceChips label="Width" options={SIZES} value={maxWidth} onChange={setMaxWidth} /> },
        { label: 'Use fewer pictures a second?', content: <ChoiceChips label="Smoothness" options={SPEEDS} value={fps} onChange={setFps} /> },
      ]}
      faqs={[
        { q: 'What makes a GIF smaller?', a: 'Fewer colors, a smaller picture, and fewer pictures every second. Each one trades a little quality for size. A smaller width usually saves the most.' },
        { q: 'Why did I get my original back?', a: 'Some GIFs are already very tight. If the new file would be bigger, we keep your original so you never get a worse result.' },
        { q: 'Will it still loop?', a: 'Yes. The new GIF repeats forever.' },
        { q: 'Are my GIFs uploaded?', a: 'No. They are shrunk inside your browser and stay on your computer.' },
      ]}
    />
  );
}
