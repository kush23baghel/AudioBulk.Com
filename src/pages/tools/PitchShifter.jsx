import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';

const STEP_OPTIONS = Array.from({ length: 25 }, (_, i) => {
  const value = i - 12;
  const label = value === 0 ? '0' : value > 0 ? `+${value}` : `−${Math.abs(value)}`;
  let hint = `${Math.abs(value)} ${Math.abs(value) === 1 ? 'step' : 'steps'} ${value > 0 ? 'higher' : 'lower'}.`;
  if (value === 0) hint = 'No change. The sound stays the same.';
  if (Math.abs(value) === 12) hint = `One full octave ${value > 0 ? 'higher' : 'lower'}. A voice sounds like a different person.`;
  return { value, label, hint };
});

// atempo only accepts 0.5 to 2 per filter, so split bigger changes into a chain.
function tempoChain(factor) {
  const parts = [];
  let left = factor;
  while (left > 2) { parts.push('atempo=2'); left /= 2; }
  while (left < 0.5) { parts.push('atempo=0.5'); left /= 0.5; }
  parts.push(`atempo=${left.toFixed(6)}`);
  return parts.join(',');
}

export default function PitchShifter() {
  const [steps, setSteps] = useState(3);

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.mp3`;
    let progressHandler = null;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Read the file's own sample rate and check there is sound in it.
      let hasAudio = false;
      let origRate = 44100;
      const probe = ({ message }) => {
        if (message.includes('Audio:')) {
          hasAudio = true;
          const match = message.match(/(\d{4,6}) Hz/);
          if (match) origRate = Number(match[1]);
        }
      };
      ffmpeg.on('log', probe);
      try { await ffmpeg.exec(['-i', inputName]); } catch { /* expected: no output file given */ }
      ffmpeg.off('log', probe);
      if (!hasAudio) throw new Error('This file has no sound in it. Try a different audio file, or a video that has sound.');

      progressHandler = ({ progress }) => onProgress(progress * 100);
      ffmpeg.on('progress', progressHandler);

      // asetrate changes pitch but also speed. atempo = 1/ratio puts the speed back, so the length stays the same.
      const ratio = Math.pow(2, steps / 12);
      const newRate = Math.round(origRate * ratio);
      const filter = steps === 0
        ? 'anull'
        : `asetrate=${newRate},aresample=${origRate},${tempoChain(1 / ratio)}`;

      await ffmpeg.exec(['-i', inputName, '-vn', '-af', filter, '-c:a', 'libmp3lame', '-b:a', '192k', outputName]);

      const data = await ffmpeg.readFile(outputName);
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      const sign = steps > 0 ? '+' : steps < 0 ? '-' : '';
      return { blob: new Blob([data.buffer], { type: 'audio/mpeg' }), name: `${baseName}_pitch${sign}${Math.abs(steps)}.mp3` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  return (
    <BulkTool
      path="/tools/pitch-shifter"
      name="Pitch Shifter"
      title="Make audio sound higher or lower"
      intro="Move the pitch of a song or voice up or down without changing how long it lasts. Handy for singing along in a key that suits you."
      accept={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'], 'video/*': ['.mp4', '.mov', '.webm', '.mkv'] }}
      dropHint="Audio files like MP3, WAV, M4A and FLAC. Videos work too: you get just the sound."
      processFile={processFile}
      verb={{ action: 'Change pitch', working: 'Changing pitch' }}
      steps={[
        {
          label: 'Pick how many steps',
          content: (
            <div className="space-y-3">
              <p className="text-sm text-muted">Plus makes it higher, minus makes it lower. 12 steps is one octave, like singing the same note an octave up.</p>
              <ChoiceChips label="Steps" options={STEP_OPTIONS} value={steps} onChange={setSteps} />
            </div>
          ),
        },
      ]}
      faqs={[
        { q: 'What is a "step"?', a: 'A step is the smallest jump between two notes on a piano (also called a semitone). 12 steps make one octave. +3 steps means three notes higher.' },
        { q: 'Will my audio get faster or slower?', a: 'No. The length stays the same. Only the pitch changes.' },
        { q: 'Will it sound perfect?', a: 'Small changes (up to about 4 steps) sound natural. Big changes can sound a little robotic or watery, especially on voices.' },
        { q: 'What format do I get back?', a: 'An MP3 file. Your original file is never changed.' },
        { q: 'Are my files uploaded anywhere?', a: 'No. Everything happens inside your web browser, on your own computer. Your files never leave your device.' },
      ]}
    />
  );
}
