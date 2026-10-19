import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import BulkTool from '../../ui/BulkTool';
import { QualitySlider } from '../../ui/controls';

const LEVELS = [
  { label: 'Much quieter', detail: '25% of the original volume', factor: 0.25 },
  { label: 'Quieter', detail: '50% of the original volume, about half as loud', factor: 0.5 },
  { label: 'A little quieter', detail: '75% of the original volume', factor: 0.75 },
  { label: 'A little louder', detail: '125% of the original volume', factor: 1.25 },
  { label: 'Louder', detail: '150% of the original volume', factor: 1.5 },
  { label: 'Twice as loud', detail: '200% of the original volume. Already loud files may start to crackle', factor: 2 },
  { label: 'Much louder', detail: '300% of the original volume. Very loud settings can make the sound crackle or distort', factor: 3 },
];

export default function BulkVolumeChanger() {
  const [level, setLevel] = useState(3);
  const chosen = LEVELS[level];

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.${inputExt}`;
    let progressHandler = null;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // FFmpeg's log prints "Audio:" for every audio stream. None means there is nothing to change.
      let hasAudio = false;
      const probe = ({ message }) => { if (message.includes('Audio:')) hasAudio = true; };
      ffmpeg.on('log', probe);
      try { await ffmpeg.exec(['-i', inputName]); } catch { /* expected: no output file given */ }
      ffmpeg.off('log', probe);
      if (!hasAudio) throw new Error('This file has no sound in it. Try a different audio file, or a video that has sound.');

      progressHandler = ({ progress }) => onProgress(progress * 100);
      ffmpeg.on('progress', progressHandler);

      // Videos keep their picture untouched (-c:v copy), so only the sound is processed.
      await ffmpeg.exec(['-i', inputName, '-map', '0:v?', '-map', '0:a', '-c:v', 'copy', '-filter:a', `volume=${chosen.factor}`, outputName]);

      const data = await ffmpeg.readFile(outputName);
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      return {
        blob: new Blob([data.buffer], { type: file.type || 'application/octet-stream' }),
        name: `${baseName}_${Math.round(chosen.factor * 100)}pct.${inputExt}`,
      };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  return (
    <BulkTool
      path="/tools/bulk-audio-volume"
      name="Volume Changer"
      title="Make audio louder or quieter"
      intro="Turn the volume of many files up or down in one go. Your files keep their original format, and videos keep their picture."
      accept={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'], 'video/*': ['.mp4', '.mov', '.webm', '.mkv'] }}
      dropHint="Audio files like MP3, WAV and M4A. Videos work too: only the sound is changed."
      processFile={processFile}
      verb={{ action: 'Change volume', working: 'Changing volume' }}
      steps={[
        {
          label: 'Pick how loud',
          content: <QualitySlider label="Volume" levels={LEVELS} value={level} onChange={setLevel} />,
        },
      ]}
      faqs={[
        { q: 'Are my files uploaded anywhere?', a: 'No. Your files are changed inside your web browser, on your own computer. They never leave your device, and we never see them.' },
        { q: 'Why does very loud audio crackle?', a: 'Every file has a loudest point it can hold. If you push the sound past it, the loudest parts get cut off and sound harsh. If you hear crackling, go back and pick a lower setting.' },
        { q: 'Can I make quiet audio loud without any crackle?', a: 'Not always. A small boost like "A little louder" is usually safe. Big boosts work best on files that are quiet to begin with.' },
        { q: 'Will my video get worse?', a: 'No. The picture is copied as it is. Only the sound is changed, so videos finish quickly.' },
        { q: 'Does this keep my file format?', a: 'Yes. An MP3 stays an MP3 and a WAV stays a WAV. Formats like MP3 are saved again after the change, so there can be a very small loss in quality.' },
      ]}
    />
  );
}
