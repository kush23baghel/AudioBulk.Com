import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';

const PRESETS = [
  { value: 'more-bass', label: 'More bass', hint: 'Fuller, deeper sound. Good for music on small speakers.', suffix: 'more_bass', filter: 'bass=g=8:f=100:w=0.5' },
  { value: 'less-bass', label: 'Less bass', hint: 'Takes away rumble and boominess.', suffix: 'less_bass', filter: 'bass=g=-10:f=100:w=0.5' },
  { value: 'clear-voice', label: 'Clear voice', hint: 'Makes speech easier to understand, like a talk recorded on a phone.', suffix: 'clear_voice', filter: 'highpass=f=80,equalizer=f=250:width_type=o:width=2:g=-3,equalizer=f=3000:width_type=o:width=2:g=4' },
  { value: 'brighter', label: 'Brighter', hint: 'Adds sparkle and detail to dull-sounding audio.', suffix: 'brighter', filter: 'treble=g=6:f=5000:w=0.5' },
  { value: 'radio', label: 'Radio sound', hint: 'Thin and punchy, like an old radio or a phone call.', suffix: 'radio', filter: 'highpass=f=300,lowpass=f=3400,equalizer=f=1500:width_type=o:width=2:g=4' },
  { value: 'no-hum', label: 'Remove low hum', hint: 'Cuts the low buzz from fans, air conditioners and power lines.', suffix: 'no_hum', filter: 'highpass=f=100,equalizer=f=50:width_type=q:width=8:g=-20,equalizer=f=60:width_type=q:width=8:g=-20' },
];

const OUTPUTS = [
  { value: 'same', label: 'Same as my file', hint: 'Keeps your file type when it can. Files it cannot keep become MP3.' },
  { value: 'mp3', label: 'MP3', hint: 'Plays on every phone, computer and car.' },
];

const MP3 = { ext: 'mp3', mime: 'audio/mpeg', codec: ['-c:a', 'libmp3lame', '-b:a', '192k'] };
const SAME_FORMATS = {
  mp3: MP3,
  wav: { ext: 'wav', mime: 'audio/wav', codec: ['-c:a', 'pcm_s16le'] },
  flac: { ext: 'flac', mime: 'audio/flac', codec: ['-c:a', 'flac'] },
  m4a: { ext: 'm4a', mime: 'audio/mp4', codec: ['-c:a', 'aac', '-b:a', '192k'] },
  aac: { ext: 'aac', mime: 'audio/aac', codec: ['-c:a', 'aac', '-b:a', '192k'] },
  ogg: { ext: 'ogg', mime: 'audio/ogg', codec: ['-c:a', 'libvorbis', '-q:a', '5'] },
};

export default function AudioEqualizer() {
  const [presetValue, setPresetValue] = useState('more-bass');
  const [output, setOutput] = useState('same');
  const preset = PRESETS.find((p) => p.value === presetValue);

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'tmp';
    const target = output === 'same' ? (SAME_FORMATS[inputExt] || MP3) : MP3;
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.${target.ext}`;
    let progressHandler = null;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      let hasAudio = false;
      const probe = ({ message }) => { if (message.includes('Audio:')) hasAudio = true; };
      ffmpeg.on('log', probe);
      try { await ffmpeg.exec(['-i', inputName]); } catch { /* expected: no output file given */ }
      ffmpeg.off('log', probe);
      if (!hasAudio) throw new Error('This file has no sound in it. Try a different audio file, or a video that has sound.');

      progressHandler = ({ progress }) => onProgress(progress * 100);
      ffmpeg.on('progress', progressHandler);

      // -vn drops cover art and video so the result is audio only.
      const code = await ffmpeg.exec(['-i', inputName, '-vn', '-af', preset.filter, ...target.codec, outputName]);
      if (code !== 0) throw new Error('This file could not be changed. It may be damaged. Try a different file.');

      const data = await ffmpeg.readFile(outputName);
      if (!data || data.length === 0) throw new Error('This file could not be changed. It may be damaged. Try a different file.');
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      return { blob: new Blob([data.buffer], { type: target.mime }), name: `${baseName}_${preset.suffix}.${target.ext}` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  return (
    <BulkTool
      path="/tools/audio-equalizer"
      name="Audio Equalizer"
      title="Change how your audio sounds"
      intro="Pick a sound like More bass or Clear voice and apply it to your files in one click. Add as many files as you like."
      accept={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma', '.opus'], 'video/*': ['.mp4', '.mov', '.webm', '.mkv'] }}
      dropHint="Audio files like MP3, WAV, M4A and FLAC. Videos work too: you get just the sound."
      processFile={processFile}
      steps={[
        {
          label: 'Pick a sound',
          content: <ChoiceChips label="Sound" options={PRESETS} value={presetValue} onChange={setPresetValue} />,
        },
        {
          label: 'Pick the file type',
          content: <ChoiceChips label="File type" options={OUTPUTS} value={output} onChange={setOutput} />,
        },
      ]}
      faqs={[
        { q: 'Are my files uploaded anywhere?', a: 'No. Your files are changed inside your web browser, on your own computer. They never leave your device, and we never see them.' },
        { q: 'What does an equalizer do?', a: 'It makes some parts of the sound louder or quieter. Low sounds are the bass, like drums. High sounds are the treble, like cymbals and the "s" in speech.' },
        { q: 'Can I hear it before I download?', a: 'Not yet. Try one sound on one file first, play the result, and come back if you want a different one.' },
        { q: 'Will "Clear voice" remove background noise?', a: 'Not completely. It lifts the parts of the sound that make speech easy to understand and cuts low rumble, but it cannot remove noise like traffic or chatter.' },
        { q: 'Which file type should I pick?', a: '"Same as my file" is best for most people. If your file is a type we cannot save in, such as WMA or a video, you get an MP3 instead.' },
      ]}
    />
  );
}
