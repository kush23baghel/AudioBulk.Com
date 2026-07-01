import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function VocalRemover() {
  const [mode, setMode] = useState('instrumental'); // instrumental or vocals
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split('.').pop();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.${ext}`;
    const outputName = `output_${uid}.mp3`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(progress * 100);
    ffmpeg.on('progress', progressHandler);

    // Center channel extraction using pan filter.
    // Vocals are typically center-panned. Side channel (L-R) = instrumental.
    // Center channel (L+R-side) = vocals estimate.
    let filter;
    if (mode === 'instrumental') {
      // Side channel (L-R): removes center-panned vocals
      filter = 'pan=stereo|c0=c0-c1|c1=c1-c0';
    } else {
      // Center channel (L+R mix): isolates vocals
      filter = 'pan=mono|c0=0.5*c0+0.5*c1';
    }

    await ffmpeg.exec([
      '-i', inputName,
      '-af', filter,
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return { blob, name: `${baseName}_${mode}.mp3` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Output Mode</label>
        {[
          { value: 'instrumental', label: 'Instrumental Track', desc: 'Removes center-panned vocals using L-R channel subtraction' },
          { value: 'vocals', label: 'Vocal Track', desc: 'Extracts center-panned vocal content from stereo mix' },
        ].map(m => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`w-full text-left btn btn-xs px-3 py-3 h-auto rounded-xl border flex flex-col gap-0.5 ${
              mode === m.value
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <span className="font-semibold text-xs">{m.label}</span>
            <span className="text-[10px] opacity-70">{m.desc}</span>
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
        <p className="text-[10px] text-amber-400 leading-normal">
          ⚠️ Works best on stereo tracks with center-panned vocals. Results vary by mix. Professional AI separation requires a server-side ML model.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPageLayout
      title="Vocal Remover / Splitter"
      description="Extract instrumental or vocal tracks from stereo audio files using center-channel extraction technique. Browser-local, no upload needed."
      icon="fa-microphone-slash"
      categoryName="Audio Tools"
      categoryPath="/all-tools?cat=audio"
      acceptTypes={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'] }}
      optionsTitle="Separation Mode"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'How does this work without AI?', a: 'Vocals are typically mixed in the center of a stereo track. By subtracting the left and right channels, we remove the center-panned content. This is called "center channel removal".' },
        { q: 'What if the result has artefacts?', a: 'The technique works best on professionally mixed tracks. Mono-mixed or non-standard recordings may not produce clean results.' }
      ]}
    />
  );
}
