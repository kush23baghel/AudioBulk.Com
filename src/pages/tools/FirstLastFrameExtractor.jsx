import { useState } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

export default function FirstLastFrameExtractor() {
  const [format, setFormat] = useState('png');
  const processor = useBulkProcessor();

  const processFile = async (file, onProgress) => {
    const ffmpeg = await getFFmpeg();
    const ext = file.name.split('.').pop();
    const uid = Math.random().toString(36).substring(7);
    const inputName = `input_${uid}.${ext}`;
    const firstFrame = `first_${uid}.${format}`;
    const lastFrame = `last_${uid}.${format}`;

    let progressHandler = null;
    try {
            await ffmpeg.writeFile(inputName, await fetchFile(file));

    onProgress(20);

    // Extract first frame
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', 'select=eq(n\\,0)',
      '-q:v', '2',
      '-frames:v', '1',
      firstFrame
    ]);

    onProgress(60);

    // Extract last frame using sseof (seek from end of stream)
    await ffmpeg.exec([
      '-sseof', '-1',
      '-i', inputName,
      '-update', '1',
      '-q:v', '2',
      lastFrame
    ]);

    onProgress(90);

    const firstData = await ffmpeg.readFile(firstFrame);
    const lastData = await ffmpeg.readFile(lastFrame);

    const baseName = file.name.replace(/\.[^.]+$/, '');
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';

    // Return both as a zip-like array — we'll return the first frame first
    // and the layout component will handle download
    const firstBlob = new Blob([firstData.buffer], { type: mimeType });
    return { blob: firstBlob, name: `${baseName}_first_frame.${format}`, extra: [
      { blob: new Blob([lastData.buffer], { type: mimeType }), name: `${baseName}_last_frame.${format}` }
    ]};
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
      await safeDelete(ffmpeg, firstFrame);
      await safeDelete(ffmpeg, lastFrame);
    }
  };

  const optionsContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Output Format</label>
        {['png', 'jpg'].map(f => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`w-full btn btn-xs px-3 py-2.5 h-auto text-xs font-medium rounded-xl border ${
              format === f
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {f.toUpperCase()} {f === 'png' ? '(Lossless)' : '(Smaller)'}
          </button>
        ))}
      </div>
      <div className="rounded-xl bg-sky-500/5 border border-sky-500/10 p-3">
        <p className="text-[10px] text-sky-600 leading-normal">
          Extracts the very first frame (frame 0) and the last frame from each video. Both frames are available for download after processing.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPageLayout
      title="First & Last Frame Extractor"
      description="Grab key thumbnail screenshots (first and last frames) from multiple video files instantly."
      icon="fa-images"
      categoryName="Video Tools"
      categoryPath="/all-tools?cat=video"
      acceptTypes={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      optionsTitle="Frame Settings"
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: 'Can I extract frames from multiple videos?', a: 'Yes! Each video produces both a first and last frame. The first frame is downloaded directly; the last frame appears in the queue too.' },
        { q: 'Which format should I use?', a: 'PNG for highest quality thumbnails. JPEG for smaller files that upload faster.' }
      ]}
    />
  );
}
