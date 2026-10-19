import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';
import { formatDuration } from '../../lib/audioInfo';

const SPEEDS = [
  { value: '0.25', label: '0.25×', hint: 'Four times slower. Good for picking out fast words.' },
  { value: '0.5', label: '0.5×', hint: 'Half speed. The file becomes twice as long.' },
  { value: '0.75', label: '0.75×', hint: 'A little slower. Easier to follow.' },
  { value: '1.25', label: '1.25×', hint: 'A little faster. Hardly changes how it sounds.' },
  { value: '1.5', label: '1.5×', hint: 'Faster, still easy to understand. Popular for podcasts.' },
  { value: '2', label: '2×', hint: 'Double speed. The file becomes half as long.' },
  { value: '3', label: '3×', hint: 'Three times faster. Good for skimming.' },
  { value: '4', label: '4×', hint: 'Four times faster. Speech gets hard to follow.' },
];

// One atempo filter only accepts 0.5 to 2.0, so bigger or smaller changes are chained.
const getAtempoFilter = (speed) => {
  const parts = [];
  let remaining = speed;
  while (remaining > 2) { parts.push('atempo=2.0'); remaining /= 2; }
  while (remaining < 0.5) { parts.push('atempo=0.5'); remaining *= 2; }
  parts.push(`atempo=${remaining}`);
  return parts.join(',');
};

const MIME = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac', flac: 'audio/flac', ogg: 'audio/ogg', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mkv: 'video/x-matroska' };
const VIDEO_EXT = ['mp4', 'mov', 'webm', 'mkv', 'avi'];
const LOSSY_AUDIO_EXT = ['mp3', 'm4a', 'aac', 'ogg'];

export default function BulkSpeedChanger() {
  const [speed, setSpeed] = useState('1.5');

  const processFile = async (file, onProgress, info) => {
    const ffmpeg = await getFFmpeg();
    const factor = Number(speed);
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : 'tmp';
    const isVideo = file.type.startsWith('video') || VIDEO_EXT.includes(inputExt);
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.${inputExt}`;
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

      const args = ['-i', inputName];
      if (isVideo) {
        // Video needs its picture sped up by the same amount, so sound and picture stay together.
        args.push('-filter:v', `setpts=${1 / factor}*PTS`, '-preset', 'veryfast');
      }
      args.push('-filter:a', getAtempoFilter(factor));
      // Keep the source quality: reuse the file's own bitrate instead of a fixed one.
      if (!isVideo && LOSSY_AUDIO_EXT.includes(inputExt) && info?.kbps) {
        args.push('-b:a', `${Math.min(320, Math.max(32, info.kbps))}k`);
      }
      args.push(outputName);
      const code = await ffmpeg.exec(args);
      if (code !== 0) throw new Error('This file could not be changed. It may be damaged. Try a different file.');

      const data = await ffmpeg.readFile(outputName);
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      const ext = inputExt === 'tmp' ? 'mp3' : inputExt;
      return { blob: new Blob([data.buffer], { type: MIME[ext] || 'application/octet-stream' }), name: `${baseName}_${speed}x.${ext}` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const inspect = (info) => {
    if (!info || !info.ok) return null;
    if (info.hasAudio === false) return { tone: 'warn', text: 'This file has no sound in it, so there is nothing to speed up.' };
    const factor = Number(speed);
    const length = info.duration ? `Length: ${formatDuration(info.duration)} → ${formatDuration(info.duration / factor)} at ${speed}×.` : '';
    if (factor > 2) return { tone: 'warn', text: `${length} Above 2× speech gets hard to follow.`.trim() };
    if (factor < 0.5) return { tone: 'warn', text: `${length} Very slow speeds can sound rough or echoey.`.trim() };
    return length ? { tone: 'info', text: length } : null;
  };

  return (
    <BulkTool
      path="/tools/bulk-audio-speed"
      name="Audio Speed Changer"
      title="Make audio faster or slower"
      intro="Speed up or slow down many audio files at once. Voices keep their natural sound, they do not turn squeaky or deep."
      accept={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'], 'video/*': ['.mp4', '.mov', '.webm', '.mkv'] }}
      dropHint="Audio files like MP3, WAV and M4A. Videos work too, and the picture speeds up with the sound."
      processFile={processFile}
      inspect={inspect}
      steps={[
        {
          label: 'Pick a speed',
          content: <ChoiceChips label="Speed" options={SPEEDS} value={speed} onChange={setSpeed} />,
        },
      ]}
      faqs={[
        { q: 'Are my files uploaded anywhere?', a: 'No. Your files are changed inside your web browser, on your own computer. They never leave your device.' },
        { q: 'Will the voice sound squeaky or deep?', a: 'No. The pitch stays the same, only the speed changes. Very fast or very slow settings can still sound a little rough.' },
        { q: 'Will the file be shorter or longer?', a: 'Yes. At 2× a 10 minute file becomes 5 minutes. At 0.5× it becomes 20 minutes.' },
        { q: 'Does it keep my file format?', a: 'Yes. An MP3 stays an MP3 and a WAV stays a WAV. The sound is saved again, so lossy formats like MP3 lose a tiny bit of quality.' },
        { q: 'Can I change the speed of a video?', a: 'Yes. Add an MP4, MOV or WebM video and the picture and sound both speed up or slow down together.' },
      ]}
    />
  );
}
