import { fetchFile } from '@ffmpeg/util';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { readVideoInfo } from '../../lib/videoInfo';
import BulkTool from '../../ui/BulkTool';
import { ChoiceChips, QualitySlider } from '../../ui/controls';
import useToolState from '../../hooks/useToolState';

const FORMATS = [
  { value: 'mp4', label: 'MP4', hint: 'Plays everywhere: phones, computers, TVs and social media. Pick this if you are not sure.', mime: 'video/mp4', copyFrom: ['mp4', 'm4v'], audio: ['-c:a', 'aac', '-b:a', '128k'] },
  { value: 'webm', label: 'WebM', hint: 'Made for websites. Small files that play in every web browser.', mime: 'video/webm', copyFrom: ['webm'], audio: ['-c:a', 'libvorbis', '-b:a', '128k'] },
  { value: 'mov', label: 'MOV', hint: 'The Apple format. Good for Mac, iPhone and video editing apps.', mime: 'video/quicktime', copyFrom: ['mov'], audio: ['-c:a', 'aac', '-b:a', '128k'] },
  { value: 'mkv', label: 'MKV', hint: 'Flexible format that holds almost anything. Good for keeping movies.', mime: 'video/x-matroska', copyFrom: ['mkv'], audio: ['-c:a', 'aac', '-b:a', '128k'] },
];

// CRF: lower number means better picture and a bigger file. WebM (VP8) uses a different scale.
const QUALITY = [
  { label: 'Smaller file', detail: 'a clearly smaller file, with a little less detail', x264: '28', vp8: '20' },
  { label: 'Standard', detail: 'good picture for most videos', x264: '23', vp8: '12' },
  { label: 'Best', detail: 'looks almost the same as the original, but the file is bigger', x264: '18', vp8: '8' },
];

const extOf = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');

export default function BulkVideoConverter() {
  const [format, setFormat] = useToolState('format', 'mp4');
  const [quality, setQuality] = useToolState('quality', 1);
  const fmt = FORMATS.find((f) => f.value === format);

  const inspect = (info, file) => {
    if (!info?.ok) return null;
    if (info.isVideo === false) return { tone: 'warn', text: 'This file does not seem to have a picture. Pick a video file.' };
    const sameFormat = fmt.copyFrom.includes(extOf(file.name));
    if (info.duration > 600 || info.width >= 3840) {
      return { tone: 'warn', text: 'This is a long or very large video. Changing it can take a long time in your browser. Keep this tab open.' };
    }
    if (sameFormat) {
      return { tone: 'info', text: `Already ${fmt.label}. Standard videos are copied without loss, which is fast. Others are converted.` };
    }
    return { tone: 'info', text: `Will be saved as ${fmt.label}${info.width ? ` at the same size (${info.width}Ã—${info.height})` : ''}.` };
  };

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const id = Math.random().toString(36).slice(2, 9);
    const inputExt = extOf(file.name) || 'tmp';
    const inputName = `input_${id}.${inputExt}`;
    const outputName = `output_${id}.${fmt.value}`;
    let progressHandler = null;

    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Read the log to learn which picture format and whether there is sound.
      let videoCodec = '';
      let hasAudio = false;
      const probe = ({ message }) => {
        const v = message.match(/Video: (\w+)/);
        if (v && !videoCodec && !message.includes('attached pic')) videoCodec = v[1].toLowerCase();
        if (message.includes('Audio:')) hasAudio = true;
      };
      ffmpeg.on('log', probe);
      try { await ffmpeg.exec(['-i', inputName]); } catch { /* expected: no output file given */ }
      ffmpeg.off('log', probe);
      if (!videoCodec) throw new Error('This file has no picture in it. Try a different video file.');

      progressHandler = ({ progress }) => onProgress(Math.min(100, Math.max(0, progress * 100)));
      ffmpeg.on('progress', progressHandler);

      const maps = ['-map', '0:v:0', ...(hasAudio ? ['-map', '0:a:0'] : []), '-sn'];
      const sameContainer = fmt.copyFrom.includes(inputExt);
      const canCopy = sameContainer && (fmt.value === 'webm' ? ['vp8', 'vp9'].includes(videoCodec) : videoCodec === 'h264');

      let args;
      if (canCopy) {
        // Same container and a picture format we keep: no re-encoding, so nothing is lost.
        args = ['-i', inputName, ...maps, '-c', 'copy'];
        if (fmt.value === 'mp4' || fmt.value === 'mov') args.push('-movflags', '+faststart');
      } else if (fmt.value === 'webm') {
        args = ['-i', inputName, ...maps, '-c:v', 'libvpx', '-b:v', '0', '-crf', QUALITY[quality].vp8, '-deadline', 'realtime', '-cpu-used', '5', '-pix_fmt', 'yuv420p',
          ...(hasAudio ? fmt.audio : [])];
      } else {
        const preset = file.size > 200 * 1024 * 1024 ? 'ultrafast' : 'veryfast';
        args = ['-i', inputName, ...maps, '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-preset', preset, '-crf', QUALITY[quality].x264, '-pix_fmt', 'yuv420p',
          ...(hasAudio ? fmt.audio : [])];
        if (fmt.value === 'mp4' || fmt.value === 'mov') args.push('-movflags', '+faststart');
      }
      args.push(outputName);

      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      if (!data || data.length === 0) throw new Error('This video could not be converted. Try a different video file.');
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
      path="/tools/bulk-video-converter"
      name="Bulk Video Converter"
      title="Change videos to another format"
      intro="Turn your videos into MP4, WebM, MOV or MKV. Add as many as you like and convert them all at once."
      accept={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.ogv', '.m4v'] }}
      dropHint="Video files like MP4, MOV, AVI, WebM and MKV."
      readInfo={readVideoInfo}
      processFile={processFile}
      inspect={inspect}
      steps={[
        {
          label: 'Pick a format',
          content: <ChoiceChips label="Format" options={FORMATS} value={format} onChange={setFormat} />,
        },
        {
          label: 'Pick quality',
          content: <QualitySlider label="Quality" levels={QUALITY} value={quality} onChange={setQuality} />,
        },
      ]}
      faqs={[
        { q: 'Are my videos uploaded anywhere?', a: 'No. Your videos are converted inside your web browser, on your own computer. They never leave your device, and we never see them.' },
        { q: 'Which format should I pick?', a: 'Pick MP4 if you are not sure. It plays almost everywhere. Pick WebM for your own website. Pick MOV for Apple apps and editing.' },
        { q: 'Why is it slow?', a: 'Your own computer does the work, inside the browser. That is slower than a video app. Long and large videos can take many minutes, so keep the tab open.' },
        { q: 'Will I lose quality?', a: 'If the video is already in the format you pick, it is copied with no loss. Otherwise it is converted, which always loses a tiny bit. "Best" keeps it almost identical.' },
        { q: 'Does it change the size of the picture?', a: 'No. The width and height stay the same. Only the format and file size change.' },
      ]}
    />
  );
}
