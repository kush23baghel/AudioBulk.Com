import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips, QualitySlider } from '../../ui/controls';

const FORMATS = [
  { value: 'mp3', label: 'MP3', hint: 'Plays on every phone, computer and car. Pick this if you are not sure.', mime: 'audio/mpeg', codec: ['-c:a', 'libmp3lame'] },
  { value: 'm4a', label: 'M4A', hint: 'Often sounds a bit better at the same size. Works best on iPhone and Mac.', mime: 'audio/mp4', codec: ['-c:a', 'aac'] },
];

const LEVELS = [
  { label: 'Smallest file', detail: 'about 64 kbps, fine for voice and podcasts', kbps: '64k' },
  { label: 'Small', detail: 'about 96 kbps, good for talking and casual listening', kbps: '96k' },
  { label: 'Balanced', detail: 'about 128 kbps, good for most music', kbps: '128k' },
  { label: 'Better sound', detail: 'about 160 kbps, close to the original for most people', kbps: '160k' },
  { label: 'Best sound', detail: 'about 192 kbps, hard to tell from the original', kbps: '192k' },
];

const formatSize = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default function BulkAudioCompressor() {
  const [format, setFormat] = useState('mp3');
  const [level, setLevel] = useState(2);
  const fmt = FORMATS.find((f) => f.value === format);
  const chosenKbps = parseInt(LEVELS[level].kbps, 10);

  // A file already at or below the chosen level would only grow, so keep its own quality.
  const alreadySmall = (info) => Boolean(info?.ok && !info.lossless && info.kbps && info.kbps <= chosenKbps);

  const inspect = (info, file) => {
    if (!info?.ok) return null;
    if (alreadySmall(info)) {
      return { tone: 'warn', text: `Already small. This file is ${info.kbps} kbps, so this would not make it smaller. It will keep its own quality.` };
    }
    if (!info.duration) return null;
    const est = (chosenKbps * 1000 * info.duration) / 8;
    const voiceTip = info.channels === 1 && chosenKbps > 64 ? ' This looks like a voice recording, so "Smallest file" is enough.' : '';
    if (est >= file.size) {
      return { tone: 'warn', text: `Already small. About ${formatSize(file.size)} now, and this would not make it smaller.` };
    }
    return { tone: 'info', text: `About ${formatSize(file.size)} now, around ${formatSize(est)} after.${voiceTip}` };
  };

  const processFile = async (file, onProgress, info) => {
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.${fmt.value}`;
    let progressHandler = null;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      progressHandler = ({ progress }) => onProgress(progress * 100);
      ffmpeg.on('progress', progressHandler);

      // -vn drops cover art and video so only the sound is kept.
      // Keep the source quality when it is already at or below the chosen level, and keep mono as mono.
      const kbps = alreadySmall(info) ? Math.max(32, info.kbps) : chosenKbps;
      const monoArgs = info?.ok && info.channels === 1 ? ['-ac', '1'] : [];
      await ffmpeg.exec(['-i', inputName, '-vn', ...monoArgs, ...fmt.codec, '-b:a', `${kbps}k`, outputName]);

      const data = await ffmpeg.readFile(outputName);
      if (!data || data.length === 0) {
        throw new Error('This file could not be made smaller. Check that it is a working audio file and try again.');
      }
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      return { blob: new Blob([data.buffer], { type: fmt.mime }), name: `${baseName}_smaller.${fmt.value}` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  return (
    <BulkTool
      path="/tools/bulk-audio-compressor"
      name="Audio Compressor"
      title="Make audio files smaller"
      intro="Shrink your audio files so they take less space and send faster. Choose how small you want them, add your files, and get them all back at once."
      accept={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'] }}
      dropHint="Audio files like WAV, MP3, M4A and FLAC."
      processFile={processFile}
      inspect={inspect}
      verb={{ action: 'Make smaller', working: 'Making smaller' }}
      steps={[
        {
          label: 'Pick a format',
          content: <ChoiceChips label="Format" options={FORMATS} value={format} onChange={setFormat} />,
        },
        {
          label: 'Pick a size',
          content: <QualitySlider label="Size" levels={LEVELS} value={level} onChange={setLevel} />,
        },
      ]}
      faqs={[
        { q: 'How much smaller will my files get?', a: 'It depends on what you start with. Big files like WAV usually shrink a lot, often to a tenth of their size. Files that are already MP3 or M4A shrink less.' },
        { q: 'Will it sound worse?', a: 'A little, because making a file smaller means throwing away sound detail that is hard to hear. "Balanced" is fine for most music. Use "Best sound" if you care about quality.' },
        { q: 'Can a file get bigger?', a: 'Yes, if it was already very small. For example, a 64 kbps MP3 made "Best sound" gets bigger and does not sound better. Pick a smaller level for those.' },
        { q: 'Are my files uploaded anywhere?', a: 'No. Everything happens inside your web browser, on your own computer. Your files never leave your device.' },
      ]}
    />
  );
}
