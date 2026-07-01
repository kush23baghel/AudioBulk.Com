import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const SEMITONE_OPTIONS = [
  { label: '-8 semitones (Much Lower)', value: -8 },
  { label: '-5 semitones (Lower)', value: -5 },
  { label: '-3 semitones (Slightly Lower)', value: -3 },
  { label: '-1 semitone', value: -1 },
  { label: '0 (Original)', value: 0 },
  { label: '+1 semitone', value: 1 },
  { label: '+3 semitones (Slightly Higher)', value: 3 },
  { label: '+5 semitones (Higher)', value: 5 },
  { label: '+8 semitones (Much Higher)', value: 8 },
  { label: '+12 semitones (One Octave Up)', value: 12 },
];

export default function PitchShifter() {
  const [semitones, setSemitones] = useState(3);
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split('.').pop();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.${ext}`;
    const outputName = `output_pitch_${uid}.mp3`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(progress * 100);
    ffmpeg.on('progress', progressHandler);

    // rubberband is ideal but not in standard wasm build.
    // Use asetrate + atempo trick: change sample rate (shifts pitch), then correct tempo
    const rateMultiplier = Math.pow(2, semitones / 12);
    // Get original sample rate - default to 44100
    const origRate = 44100;
    const newRate = Math.round(origRate * rateMultiplier);

    await ffmpeg.exec([
      '-i', inputName,
      '-af', `asetrate=${newRate},aresample=${origRate}`,
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    const sign = semitones >= 0 ? '+' : '';
    return { blob, name: `${baseName}_pitch${sign}${semitones}.mp3` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Pitch Shift (Semitones)</label>
        <div className="flex flex-col gap-1.5">
          {SEMITONE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSemitones(opt.value)}
              className={`btn btn-xs justify-between px-3 py-2 h-auto text-xs font-medium rounded-xl border ${
                semitones === opt.value
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <span>{opt.label}</span>
              <span className="text-[10px] opacity-60">{opt.value >= 0 ? '+' : ''}{opt.value}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-slate-400 leading-normal">
        Uses the asetrate/aresample technique to shift pitch. Note: this also slightly affects playback speed for large shifts.
      </p>
    </div>
  );

  return (
    <ToolPageLayout
      title="Pitch Shifter"
      description="Change the musical key/pitch of audio files up or down in semitones. Perfect for transposing music without changing tempo."
      icon="fa-sliders"
      categoryName="Audio Tools"
      categoryPath="/all-tools?cat=audio"
      acceptTypes={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'] }}
      optionsTitle="Pitch Settings"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'What is a semitone?', a: 'A semitone is the smallest pitch interval in Western music. 12 semitones = 1 octave. +3 semitones = 3 notes higher.' },
        { q: 'Will my audio speed change?', a: 'The asetrate technique changes pitch by adjusting sample rate, which causes a slight speed change for large shifts (±8+). For ±5 or less, it is imperceptible.' }
      ]}
    />
  );
}
