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
  { label: 'Smaller file', detail: 'about 64 kbps, fine for voice and podcasts', kbps: '64k' },
  { label: 'Standard', detail: 'about 128 kbps, good for most music', kbps: '128k' },
  { label: 'Good', detail: 'about 192 kbps, hard to tell from the original', kbps: '192k' },
  { label: 'Best sound', detail: 'the highest quality this format allows (up to 320 kbps)', kbps: '320k' },
];

export default function BulkAudioConverter() {
  const [format, setFormat] = useState('mp3');
  const [quality, setQuality] = useState(1);
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

      // FFmpeg's log prints "Audio:" for every audio stream. None means there is nothing to convert.
      let hasAudio = false;
      const probe = ({ message }) => { if (message.includes('Audio:')) hasAudio = true; };
      ffmpeg.on('log', probe);
      try { await ffmpeg.exec(['-i', inputName]); } catch { /* expected: no output file given */ }
      ffmpeg.off('log', probe);
      if (!hasAudio) throw new Error('This file has no sound in it. Try a different audio file, or a video that has sound.');

      progressHandler = ({ progress }) => onProgress(progress * 100);
      ffmpeg.on('progress', progressHandler);

      const qualityArgs = fmt.lossless ? [] : ['-b:a', QUALITY[quality].kbps];
      // -vn drops cover art and video so a video file becomes audio only.
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
      path="/tools/bulk-audio-converter"
      name="Bulk Audio Converter"
      title="Change audio files to another format"
      intro="Turn MP3, WAV, M4A, FLAC, OGG and more into the format you need. Add as many files as you like and convert them all at once."
      accept={{ 'audio/*': ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a', '.wma', '.opus'], 'video/*': ['.mp4', '.mov', '.webm', '.mkv'] }}
      dropHint="Audio files like MP3, WAV, M4A and FLAC. Videos work too: you get just the sound."
      processFile={processFile}
      steps={[
        {
          label: 'Pick a format',
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
        { q: 'Are my files uploaded anywhere?', a: 'No. Your files are converted inside your web browser, on your own computer. They never leave your device, and we never see them.' },
        { q: 'Which format should I pick?', a: 'Pick MP3 if you are not sure. It plays everywhere. Pick WAV or FLAC if you need perfect quality, for example for editing. Pick M4A for iPhone and Mac.' },
        { q: 'How many files can I convert at once?', a: 'As many as you like. More files and bigger files take longer, because your computer does the work. Single files over 500 MB are too big for a web browser.' },
        { q: 'Can I get the sound out of a video?', a: 'Yes. Add an MP4, MOV or WebM video and you will get just the audio, in the format you picked.' },
        { q: 'Why does "Best sound" not make my MP3 sound better?', a: 'Converting can keep quality, but it cannot add quality that was not there. If the original file is 128 kbps, choosing 320 kbps only makes the file bigger.' },
      ]}
    />
  );
}
