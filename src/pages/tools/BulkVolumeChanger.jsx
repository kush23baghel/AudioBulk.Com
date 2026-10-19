import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips, QualitySlider } from '../../ui/controls';

const LEVELS = [
  { label: 'Much quieter', detail: '25% of the original volume', factor: 0.25 },
  { label: 'Quieter', detail: '50% of the original volume, about half as loud', factor: 0.5 },
  { label: 'A little quieter', detail: '75% of the original volume', factor: 0.75 },
  { label: 'A little louder', detail: '125% of the original volume', factor: 1.25 },
  { label: 'Louder', detail: '150% of the original volume', factor: 1.5 },
  { label: 'Twice as loud', detail: '200% of the original volume. Already loud files may start to crackle', factor: 2 },
  { label: 'Much louder', detail: '300% of the original volume. Very loud settings can make the sound crackle or distort', factor: 3 },
];

const TARGETS = [
  { value: '-16', label: 'Podcast & voice', hint: '-16 LUFS. Clear and steady for speech' },
  { value: '-14', label: 'Music streaming', hint: '-14 LUFS. Like Spotify and YouTube' },
  { value: '-23', label: 'Quiet background', hint: '-23 LUFS. Soft, sits behind other sounds' },
];

const MODES = [
  { value: 'same', label: 'Same loudness for every file', hint: 'Recommended for playlists and podcasts' },
  { value: 'amount', label: 'Turn up or down by an amount', hint: 'Every file changes by the same amount' },
];

// Reads the numbers loudnorm prints after its first (measuring) run.
const readMeasure = (text) => {
  const get = (key) => {
    const m = text.match(new RegExp('"' + key + '"\\s*:\\s*"(-?[\\d.]+|-?inf)"'));
    return m ? m[1] : null;
  };
  const out = { i: get('input_i'), tp: get('input_tp'), lra: get('input_lra'), thresh: get('input_thresh'), offset: get('target_offset') };
  const bad = Object.values(out).some((v) => v === null || v.includes('inf'));
  return bad ? null : out;
};

export default function BulkVolumeChanger() {
  const [mode, setMode] = useState('same');
  const [target, setTarget] = useState('-16');
  const [level, setLevel] = useState(3);
  const chosen = LEVELS[level];
  const targetInfo = TARGETS.find((t) => t.value === target);

  const inspect = (info) => {
    if (!info || !info.ok) return null;
    if (info.hasAudio === false) return { tone: 'warn', text: 'This file has no sound, so there is nothing to change.' };
    if (mode === 'same') {
      if (info.duration && info.duration < 3) return { tone: 'warn', text: 'This file is very short, so the loudness match may be a little off.' };
      return { tone: 'info', text: `Will be matched to ${targetInfo.label.toLowerCase()} loudness (${target} LUFS) without clipping.` };
    }
    if (chosen.factor >= 2) {
      return { tone: 'warn', text: 'A big boost on a file that is already loud can crackle. We cannot tell how loud this file is before changing it. If it sounds harsh, use "Same loudness" instead, which never clips.' };
    }
    if (chosen.factor > 1) return { tone: 'info', text: 'If this file is already loud, a boost may start to crackle. Listen after.' };
    return null;
  };

  const processFile = async (file, onProgress, info) => {
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

      let filter = `volume=${chosen.factor}`;
      let suffix = `_${Math.round(chosen.factor * 100)}pct`;
      if (mode === 'same') {
        const base = `loudnorm=I=${target}:TP=-1.5:LRA=11`;
        suffix = `_${target.replace('-', 'minus')}LUFS`;
        // Pass 1: measure the file. Pass 2: apply an exact, straight gain using those numbers.
        let log = '';
        const grab = ({ message }) => { log += message + '\n'; };
        ffmpeg.on('log', grab);
        try { await ffmpeg.exec(['-i', inputName, '-map', '0:a', '-filter:a', base + ':print_format=json', '-f', 'null', '-']); } finally { ffmpeg.off('log', grab); }
        const m = readMeasure(log);
        if (!m) throw new Error('This file is silent or too quiet to measure. Try a different file.');
        // loudnorm outputs a very high sample rate by default, so set it back to the file's own.
        const rate = info && info.ok && info.sampleRate ? info.sampleRate : 44100;
        // The browser's ffmpeg can't pick a channel layout after loudnorm on its own
        // ("Cannot select channel layout"), so name it: mono stays mono, everything else stereo.
        const layout = info && info.ok && info.channels === 1 ? 'mono' : 'stereo';
        filter = `${base}:measured_I=${m.i}:measured_TP=${m.tp}:measured_LRA=${m.lra}:measured_thresh=${m.thresh}:offset=${m.offset}:linear=true,aresample=${rate},aformat=channel_layouts=${layout}`;
      }

      // Videos keep their picture untouched (-c:v copy), so only the sound is processed.
      await ffmpeg.exec(['-i', inputName, '-map', '0:v?', '-map', '0:a', '-c:v', 'copy', '-filter:a', filter, outputName]);

      const data = await ffmpeg.readFile(outputName);
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      return {
        blob: new Blob([data.buffer], { type: file.type || 'application/octet-stream' }),
        name: `${baseName}${suffix}.${inputExt}`,
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
      inspect={inspect}
      verb={{ action: 'Change volume', working: 'Changing volume' }}
      steps={[
        {
          label: 'Pick how to change the volume',
          content: <ChoiceChips label="Method" options={MODES} value={mode} onChange={setMode} />,
        },
        {
          label: mode === 'same' ? 'Pick the loudness' : 'Pick how loud',
          content: mode === 'same'
            ? <ChoiceChips label="Loudness" options={TARGETS} value={target} onChange={setTarget} />
            : <QualitySlider label="Volume" levels={LEVELS} value={level} onChange={setLevel} />,
        },
      ]}
      faqs={[
        { q: 'What does "same loudness" do?', a: 'It measures how loud each file really sounds and raises or lowers it to the loudness you picked, so a whole playlist or podcast feels even. It keeps the loudest peaks under a safe limit so nothing crackles.' },
        { q: 'Are my files uploaded anywhere?', a: 'No. Your files are changed inside your web browser, on your own computer. They never leave your device, and we never see them.' },
        { q: 'Why does very loud audio crackle?', a: 'Every file has a loudest point it can hold. If you push the sound past it, the loudest parts get cut off and sound harsh. If you hear crackling, go back and pick a lower setting.' },
        { q: 'Can I make quiet audio loud without any crackle?', a: 'Not always. A small boost like "A little louder" is usually safe. Big boosts work best on files that are quiet to begin with.' },
        { q: 'Will my video get worse?', a: 'No. The picture is copied as it is. Only the sound is changed, so videos finish quickly.' },
        { q: 'Does this keep my file format?', a: 'Yes. An MP3 stays an MP3 and a WAV stays a WAV. Formats like MP3 are saved again after the change, so there can be a very small loss in quality.' },
      ]}
    />
  );
}
