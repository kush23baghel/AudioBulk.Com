import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const EQ_PRESETS = [
  { label: 'Bass Boost', filter: 'bass=g=10:f=100:w=0.5' },
  { label: 'Treble Boost', filter: 'treble=g=8:f=5000:w=0.5' },
  { label: 'Voice Enhance', filter: 'equalizer=f=300:width_type=o:width=2:g=3,equalizer=f=3000:width_type=o:width=2:g=4' },
  { label: 'Remove Bass', filter: 'bass=g=-15:f=100:w=0.5' },
  { label: 'Vocal Remove (EQ)', filter: 'equalizer=f=300:width_type=o:width=2:g=-20,equalizer=f=3000:width_type=o:width=2:g=-20' },
  { label: 'Radio Effect', filter: 'highpass=f=300,lowpass=f=3400,equalizer=f=1500:width_type=o:width=2:g=4' },
  { label: 'Deep Bass', filter: 'bass=g=15:f=60:w=0.3,treble=g=-5:f=10000:w=0.5' },
  { label: 'Flat (No EQ)', filter: null },
];

export default function AudioEqualizer() {
  const [preset, setPreset] = useState(EQ_PRESETS[0]);
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split('.').pop();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.${ext}`;
    const finalOut = `output_eq_${uid}.mp3`;

    let progressHandler = null;
    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(progress * 100);
      ffmpeg.on('progress', progressHandler);
    const args = ['-i', inputName];
    if (preset.filter) args.push('-af', preset.filter);
    args.push('-c:a', 'libmp3lame', '-b:a', '192k', finalOut);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(finalOut);
    const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return { blob, name: `${baseName}_${preset.label.replace(/\s+/g, '_')}.mp3` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, finalOut);
    }
  };

  const optionsContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">EQ Preset</label>
        <div className="flex flex-col gap-1.5">
          {EQ_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => setPreset(p)}
              className={`btn btn-xs justify-start px-3 py-2.5 h-auto text-xs font-medium rounded-xl border ${
                preset.label === p.label
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {preset.filter && (
        <div className="rounded-xl bg-white/5 border border-white/10 p-3">
          <p className="text-[10px] text-slate-400 font-mono break-all">{preset.filter}</p>
        </div>
      )}
    </div>
  );

  return (
    <ToolPageLayout
      title="Audio Equalizer"
      description="Apply bass boost, vocal highlights, radio effects, or custom EQ filters to your audio files. Outputs MP3 at 192kbps."
      icon="fa-sliders-h"
      categoryName="Audio Tools"
      categoryPath="/all-tools?cat=audio"
      acceptTypes={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'] }}
      optionsTitle="EQ Presets"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'What is an equalizer?', a: 'An EQ boosts or cuts specific frequency ranges. Bass boost enhances low frequencies (kick drums, bass guitar), treble boost enhances highs (cymbals, vocals).' },
        { q: 'What format is the output?', a: 'Output is always MP3 at 192kbps for broad compatibility.' }
      ]}
    />
  );
}
