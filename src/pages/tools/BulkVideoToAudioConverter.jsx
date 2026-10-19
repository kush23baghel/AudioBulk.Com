import { useState } from 'react';
import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips, QualitySlider } from '../../ui/controls';

const FORMATS = [
  { value: 'mp3', label: 'MP3', hint: 'Plays on every phone, computer and car. Pick this if you are not sure.', mime: 'audio/mpeg', codec: ['-c:a', 'libmp3lame'] },
  { value: 'm4a', label: 'M4A', hint: 'Good sound in a small file. Works best on iPhone and Mac.', mime: 'audio/mp4', codec: ['-c:a', 'aac'] },
  { value: 'wav', label: 'WAV', hint: 'Perfect quality, but big files. Good for editing.', mime: 'audio/wav', codec: ['-c:a', 'pcm_s16le'], lossless: true },
  { value: 'flac', label: 'FLAC', hint: 'Perfect quality in about half the size of WAV.', mime: 'audio/flac', codec: ['-c:a', 'flac'], lossless: true },
  { value: 'ogg', label: 'OGG', hint: 'Small files, popular for games and websites.', mime: 'audio/ogg', codec: [] },
  { value: 'aac', label: 'AAC', hint: 'Small files with good sound. Used by YouTube and many apps.', mime: 'audio/aac', codec: ['-c:a', 'aac'] },
];

const QUALITY = [
  { label: 'Smaller file', detail: 'about 64 kbps, fine for talking', kbps: '64k' },
  { label: 'Standard', detail: 'about 128 kbps, good for most videos', kbps: '128k' },
  { label: 'Good', detail: 'about 192 kbps, hard to tell from the original', kbps: '192k' },
  { label: 'Best sound', detail: 'the highest quality this format allows (up to 320 kbps)', kbps: '320k' },
];

export default function BulkVideoToAudioConverter() {
  const [format, setFormat] = useState('mp3');
  const [quality, setQuality] = useState(2);
  const fmt = FORMATS.find((f) => f.value === format);

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.${fmt.value}`;
    let progressHandler = null;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // FFmpeg's log prints "Audio:" for every sound track. None means the video is silent.
      let hasAudio = false;
      const probe = ({ message }) => { if (message.includes('Audio:')) hasAudio = true; };
      ffmpeg.on('log', probe);
      try { await ffmpeg.exec(['-i', inputName]); } catch { /* expected: no output file given */ }
      ffmpeg.off('log', probe);
      if (!hasAudio) throw new Error('This video has no sound in it, so there is nothing to take out. Try a video that has sound.');

      progressHandler = ({ progress }) => onProgress(progress * 100);
      ffmpeg.on('progress', progressHandler);

      const qualityArgs = fmt.lossless ? [] : ['-b:a', QUALITY[quality].kbps];
      // -vn drops the picture so only the sound is kept.
      await ffmpeg.exec(['-i', inputName, '-vn', ...fmt.codec, ...qualityArgs, outputName]);

      const data = await ffmpeg.readFile(outputName);
      const baseName = file.name.replace(/\.[^.]+$/, '') || file.name;
      return { blob: new Blob([data.buffer], { type: fmt.mime }), name: `${baseName}.${fmt.value}` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  return (
    <BulkTool
      path="/tools/bulk-video-to-audio"
      name="Video to Audio"
      title="Get the sound out of your videos"
      intro="Turn MP4, MOV, WebM and other videos into audio files. Add as many videos as you like and save just the sound from each one."
      accept={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v', '.flv', '.wmv', '.3gp'] }}
      dropHint="Video files like MP4, MOV, WebM, AVI and MKV."
      processFile={processFile}
      steps={[
        {
          label: 'Pick an audio format',
          content: <ChoiceChips label="Format" options={FORMATS} value={format} onChange={setFormat} />,
        },
        {
          label: 'Pick quality',
          content: (
            <QualitySlider
              label="Quality"
              levels={QUALITY}
              value={quality}
              onChange={setQuality}
              disabled={fmt.lossless}
              disabledNote={`${fmt.label} always keeps perfect quality, so there is nothing to choose.`}
            />
          ),
        },
      ]}
      faqs={[
        { q: 'Are my videos uploaded anywhere?', a: 'No. Your videos are handled inside your web browser, on your own computer. They never leave your device, and we never see them.' },
        { q: 'Which format should I pick?', a: 'Pick MP3 if you are not sure. It plays everywhere. Pick M4A for iPhone and Mac. Pick WAV or FLAC if you want to edit the sound later.' },
        { q: 'Why does it say my video has no sound?', a: 'Some videos, like screen recordings or silent clips, do not contain any audio. There is nothing to take out of them.' },
        { q: 'Does the audio match the video length?', a: 'Yes. You get the whole sound track, from start to end, just without the picture.' },
        { q: 'Can I change audio files into other formats?', a: 'Yes, but with a different tool. This one is made for videos. Use Bulk Audio Converter for audio files.' },
      ]}
    />
  );
}
