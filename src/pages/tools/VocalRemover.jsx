import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';
import { formatDuration } from '../../lib/audioInfo';

// Both filters give a two-speaker (stereo) result so it plays normally everywhere.
const MODES = [
  {
    value: 'remove',
    label: 'Remove the voice',
    hint: 'Keeps the music and lowers the singing. Good for karaoke.',
    suffix: 'no_voice',
    filter: 'pan=stereo|c0=0.5*c0-0.5*c1|c1=0.5*c0-0.5*c1',
  },
  {
    value: 'keep',
    label: 'Keep the voice',
    hint: 'Keeps what sits in the middle of the song, mostly the voice, and lowers the rest.',
    suffix: 'voice_only',
    filter: 'pan=stereo|c0=0.5*c0+0.5*c1|c1=0.5*c0+0.5*c1',
  },
];

export default function VocalRemover() {
  const [mode, setMode] = useState('remove');
  const chosen = MODES.find((m) => m.value === mode);

  const processFile = async (file, onProgress, info) => {
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.mp3`;
    let progressHandler = null;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // FFmpeg's log says "mono" or "stereo" for each audio stream.
      let hasAudio = false;
      let isMono = info?.channels === 1;
      const probe = ({ message }) => {
        if (message.includes('Audio:')) {
          hasAudio = true;
          if (/\bmono\b/i.test(message)) isMono = true;
        }
      };
      ffmpeg.on('log', probe);
      try { await ffmpeg.exec(['-i', inputName]); } catch { /* expected: no output file given */ }
      ffmpeg.off('log', probe);
      if (!hasAudio) throw new Error('This file has no sound in it. Try a different audio file.');
      if (isMono) throw new Error('This file is mono (one channel), so the voice cannot be separated from the music. Try a stereo version of the song.');

      progressHandler = ({ progress }) => onProgress(progress * 100);
      ffmpeg.on('progress', progressHandler);

      await ffmpeg.exec([
        '-i', inputName,
        '-vn',
        '-af', chosen.filter,
        '-c:a', 'libmp3lame',
        '-b:a', `${info?.kbps ? Math.min(320, Math.max(128, info.kbps)) : 192}k`,
        outputName,
      ]);

      const data = await ffmpeg.readFile(outputName);
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      return { blob: new Blob([data.buffer], { type: 'audio/mpeg' }), name: `${baseName}_${chosen.suffix}.mp3` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const inspect = (info) => {
    if (!info || !info.ok) return null;
    if (info.hasAudio === false) return { tone: 'warn', text: 'This file has no sound in it.' };
    if (info.channels === 1) return { tone: 'warn', text: "This file is mono, so the voice can't be separated. Try a stereo version of the song." };
    if (info.duration && info.duration < 5) return { tone: 'warn', text: `This file is very short (${formatDuration(info.duration)}), so there is little to hear.` };
    return { tone: 'info', text: 'Results vary by song. A voice placed in the middle of the mix comes out best.' };
  };

  return (
    <BulkTool
      path="/tools/vocal-remover"
      name="Vocal Remover"
      title="Take the voice out of a song, or keep mostly the voice"
      intro="Works best on stereo songs where the singer is in the middle of the mix. It is a simple trick, not artificial intelligence, so some voice or music may be left over."
      accept={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'] }}
      dropHint="Stereo songs like MP3, WAV, M4A and FLAC."
      processFile={processFile}
      inspect={inspect}
      steps={[
        {
          label: 'What do you want to keep?',
          content: <ChoiceChips label="Choose one" options={MODES} value={mode} onChange={setMode} />,
        },
      ]}
      faqs={[
        { q: 'How does it work?', a: 'In most songs the singer is placed in the middle, so the same voice is in the left and right speaker. Taking the two sides away from each other removes the middle. Adding them together keeps it.' },
        { q: 'Will the voice be gone completely?', a: 'Not always. Echo, backup singers and instruments that are also in the middle can stay or disappear with the voice. Expect a quieter voice, not a perfect clean track.' },
        { q: 'Why does my file give an error?', a: 'Mono files have only one channel, so there is nothing to compare and the voice cannot be separated. Use a stereo version of the song.' },
        { q: 'Why does "Keep the voice" still have music in it?', a: 'Drums, bass and other instruments are often in the middle too, so they stay as well. This tool cannot split them from the voice.' },
        { q: 'Are my files uploaded anywhere?', a: 'No. Your files are processed inside your web browser, on your own computer. They never leave your device.' },
      ]}
    />
  );
}
