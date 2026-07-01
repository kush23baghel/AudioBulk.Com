import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function VideoMuter() {
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split('.').pop();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.${ext}`;
    const outputName = `output_muted_${uid}.${ext}`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => onProgress(progress * 100);
    ffmpeg.on('progress', progressHandler);

    await ffmpeg.exec([
      '-i', inputName,
      '-an',        // remove audio
      '-c:v', 'copy', // keep video stream as-is
      outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: file.type || 'video/mp4' });
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return { blob, name: `${baseName}_muted.${ext}` };
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, outputName);
    }
  };

  const optionsContent = (
    <div className="space-y-4">
      <div className="rounded-xl bg-purple-500/5 border border-purple-500/10 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-volume-xmark text-purple-600 text-lg"></i>
          <p className="text-sm font-semibold text-white">Audio Removal</p>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          The audio track will be completely removed from your video. The video stream is copied without re-encoding, so the process is instant and lossless.
        </p>
      </div>
      <ul className="space-y-2 text-xs text-slate-400">
        <li className="flex items-center gap-2"><i className="fa-solid fa-check text-emerald-600"></i> No quality loss</li>
        <li className="flex items-center gap-2"><i className="fa-solid fa-check text-emerald-600"></i> Instant processing</li>
        <li className="flex items-center gap-2"><i className="fa-solid fa-check text-emerald-600"></i> Same output format</li>
        <li className="flex items-center gap-2"><i className="fa-solid fa-check text-emerald-600"></i> Works on MP4, MOV, AVI, WebM</li>
      </ul>
    </div>
  );

  return (
    <ToolPageLayout
      title="Video Muter"
      description="Strip and silence audio tracks from video files in bulk. Uses stream-copy for instant, lossless audio removal."
      icon="fa-volume-xmark"
      categoryName="Video Tools"
      categoryPath="/all-tools?cat=video"
      acceptTypes={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      optionsTitle="Mute Settings"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'Will the video quality change?', a: 'No. We use stream copy (-c:v copy) which preserves the original video quality perfectly.' },
        { q: 'Can I mute multiple videos at once?', a: 'Yes! Drop multiple video files and they will all be muted in sequence.' }
      ]}
    />
  );
}
