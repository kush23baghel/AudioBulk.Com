import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { readVideoInfo } from '../../lib/videoInfo';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips } from '../../ui/controls';

const MODES = [
  { value: 'remove', label: 'Remove all sound', hint: 'The video becomes completely silent' },
  { value: 'quiet', label: 'Make it quieter instead', hint: 'Keeps the sound but turns it down to about a third' },
];

export default function VideoMuter() {
  const [mode, setMode] = useState('remove');

  const inspect = (info) => {
    if (!info || !info.ok) return null;
    if (info.hasAudio === false) return { tone: 'warn', text: 'This video has no sound already, nothing to remove.' };
    const heavy = info.duration > 600 || info.width >= 3840;
    const note = mode === 'remove'
      ? 'The sound will be removed and the picture copied untouched, so there is no quality loss and it is fast.'
      : 'The sound will be turned down to about a third. The picture is copied untouched.';
    return { tone: heavy ? 'warn' : 'info', text: heavy ? `${note} This is a big video, so it may take a while in your browser.` : note };
  };

  const processFile = async (file, onProgress, info) => {
    if (info && info.ok && info.hasAudio === false) {
      throw new Error('This video has no sound already, so there is nothing to change. Try a different video.');
    }
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'mp4';
    const inputName = `input_${id}.${ext}`;
    const outputName = `output_${id}.${ext}`;
    let progressHandler = null;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(progress * 100);
      ffmpeg.on('progress', progressHandler);

      let args;
      if (mode === 'remove') {
        // Picture is copied as it is; the sound is dropped.
        args = ['-i', inputName, '-map', '0:v', '-an', '-c:v', 'copy', outputName];
      } else {
        // Picture is copied as it is; only the sound is saved again, quieter.
        const audioCodec = ext.toLowerCase() === 'webm' ? 'libopus' : 'aac';
        args = ['-i', inputName, '-map', '0:v', '-map', '0:a', '-c:v', 'copy', '-filter:a', 'volume=0.3', '-c:a', audioCodec, outputName];
      }
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      return {
        blob: new Blob([data.buffer], { type: file.type || 'video/mp4' }),
        name: `${baseName}${mode === 'remove' ? '_muted' : '_quieter'}.${ext}`,
      };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  return (
    <BulkTool
      path="/tools/video-muter"
      name="Video Muter"
      title="Remove the sound from videos"
      intro="Make many videos silent in one go. The picture is copied exactly as it is, so there is no quality loss and it finishes fast."
      accept={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      dropHint="Video files like MP4, MOV, WebM and MKV."
      readInfo={readVideoInfo}
      processFile={processFile}
      inspect={inspect}
      verb={{ action: 'Remove sound', working: 'Removing sound' }}
      steps={[
        {
          label: 'Pick what to do with the sound',
          content: <ChoiceChips label="Sound" options={MODES} value={mode} onChange={setMode} />,
        },
      ]}
      faqs={[
        { q: 'Will my video look worse?', a: 'No. The picture is copied as it is and never saved again, so it looks exactly the same and the file keeps its size and length.' },
        { q: 'Why is it so fast?', a: 'Nothing has to be redrawn. We only leave out the sound and copy the picture across.' },
        { q: 'Can I get the sound back later?', a: 'No. The new file has no sound in it, so keep your original if you might need it.' },
        { q: 'What does "Make it quieter" do?', a: 'It keeps the sound but turns it down to about a third. The sound is saved again, so there can be a very small change in its quality. The picture is still untouched.' },
        { q: 'Are my videos uploaded anywhere?', a: 'No. Your videos are changed inside your web browser, on your own computer. They never leave your device.' },
      ]}
    />
  );
}
