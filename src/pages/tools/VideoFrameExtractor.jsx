import { useState, useRef, useEffect } from 'react';
import ToolPageLayout from '../../components/ToolPageLayout';
import useBulkProcessor from '../../hooks/useBulkProcessor';
import { getFFmpeg, safeDelete } from '../../lib/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { downloadFiles } from '../../lib/download';

export default function VideoFrameExtractor() {
  const [interval, setIntervalVal] = useState(2); // 1 frame every X seconds
  const [format, setFormat] = useState('jpg'); // jpg or png
  const processor = useBulkProcessor();
  const [outputImages, setOutputImages] = useState([]); // Array of { name, blob, url }

  // 1. Track object URLs
  const objectURLsRef = useRef([]);

  // 2. Cleanup function
  const cleanupURLs = () => {
    objectURLsRef.current.forEach(url => URL.revokeObjectURL(url));
    objectURLsRef.current = [];
  };

  // Revoke on component unmount
  useEffect(() => {
    return cleanupURLs;
  }, []);

  const processFile = async (file, onProgress) => {
    // Revoke before starting a new extraction
    cleanupURLs();

    const ffmpeg = await getFFmpeg();
    const inputExt = file.name.includes('.') ? file.name.split('.').pop() : 'tmp';
    const inputName = `input_${Math.random().toString(36).substring(7)}.${inputExt}`;

    let progressHandler = null;
    try {
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      progressHandler = ({ progress }) => {
        onProgress(progress * 100);
      };
      ffmpeg.on('progress', progressHandler);

      // Extract frames using the fps filter
      const fpsFilter = `fps=1/${interval}`;
      
      // 3. Wrap extraction in try/finally
      try {
        await ffmpeg.exec([
          '-i', inputName,
          '-vf', fpsFilter,
          `frame_%03d.${format}`
        ]);

        // Read files sequentially until we get a read error (terminator)
        let idx = 1;
        const frames = [];
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

        while (true) {
          const frameFileName = `frame_${String(idx).padStart(3, '0')}.${format}`;
          try {
            const fileData = await ffmpeg.readFile(frameFileName);
            const imageBlob = new Blob([fileData.buffer], { type: format === 'jpg' ? 'image/jpeg' : 'image/png' });
            
            const url = URL.createObjectURL(imageBlob);
            objectURLsRef.current.push(url);

            frames.push({
              name: `${baseName}_frame_${idx}.${format}`,
              blob: imageBlob,
              url: url
            });

            idx++;
          } catch {
            // readFile failed - no more frames left
            break;
          }
        }

        // Update local display state
        setOutputImages(frames);

        // Wrap single frame or zip them up
        if (frames.length === 1) {
          return {
            blob: frames[0].blob,
            name: frames[0].name
          };
        } else if (frames.length > 1) {
          return {
            blob: frames[0].blob, // fallback
            name: frames[0].name
          };
        }

        throw new Error("No frames could be extracted from this video.");
      } finally {
        // Cleanup extracted frames dynamically written to WASM
        let cleanupIdx = 1;
        while (true) {
          const frameFileName = `frame_${String(cleanupIdx).padStart(3, '0')}.${format}`;
          try {
            await ffmpeg.deleteFile(frameFileName);
            cleanupIdx++;
          } catch {
            // No more files to delete
            break;
          }
        }
      }
    } finally {
      if (progressHandler) ffmpeg.off('progress', progressHandler);
      await safeDelete(ffmpeg, inputName);
    }
  };

  const handleDownloadAllFrames = () => {
    if (outputImages.length === 0) return;
    const downloadList = outputImages.map(img => ({ name: img.name, blob: img.blob }));
    downloadFiles(downloadList, 'extracted-frames.zip');
  };

  const optionsContent = (
    <div className="space-y-4">
      {/* Interval Setting */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-semibold text-slate-300">
          <span>Extract 1 Frame Every</span>
          <span className="text-sky-600 font-bold">{interval}s</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          value={interval}
          onChange={(e) => setIntervalVal(parseInt(e.target.value))}
          disabled={processor.isProcessing}
          className="range range-sky range-xs bg-white/5 border border-white/10 p-1 rounded-lg"
        />
        <div className="flex justify-between text-[9px] text-slate-400 font-bold px-1">
          <span>1s (Dense)</span>
          <span>10s</span>
          <span>20s (Sparse)</span>
        </div>
      </div>

      {/* Output Format */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Image Output Format</label>
        <div className="grid grid-cols-2 gap-2">
          {['jpg', 'png'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormat(fmt)}
              disabled={processor.isProcessing}
              className={`btn btn-xs uppercase font-bold py-2 h-auto rounded-xl border border-white/10 ${
                format === fmt
                  ? 'bg-sky-500 hover:bg-sky-600 text-slate-950 border-0'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {fmt === 'jpg' ? 'JPEG (Small)' : 'PNG (Lossless)'}
            </button>
          ))}
        </div>
      </div>

      {/* Extracted Display */}
      {outputImages.length > 0 && (
        <div className="border-t border-white/10 pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-300">
              Extracted {outputImages.length} frames
            </span>
            <button
              onClick={handleDownloadAllFrames}
              className="btn btn-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 border-0 font-bold"
            >
              Zip & Download
            </button>
          </div>
          <div data-lenis-prevent="true" className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto overscroll-contain p-1 bg-[#0b1426]/80 backdrop-blur-md shadow-inner rounded-xl border border-white/10">
            {outputImages.map((img, index) => (
              <a
                key={index}
                href={img.url}
                download={img.name}
                className="group relative aspect-video rounded-lg overflow-hidden border border-white/10"
              >
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <i className="fa-solid fa-arrow-down-long text-white text-xs"></i>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <ToolPageLayout
      title="Video Frame Extractor"
      description="Extract PNG or JPG image frames from video files at custom seconds-based intervals entirely client-side."
      icon="fa-film"
      categoryName="Video Tools"
      categoryPath="/all-tools?cat=video"
      acceptTypes={{ 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] }}
      optionsContent={optionsContent}
      {...processor}
      processFileFn={processFile}
      faqs={[
        { q: "How is this processed?", a: "FFmpeg.wasm runs in your browser, reading the video and generating frames. Because it is done client-side, it's 100% private and offline." }
      ]}
    />
  );
}
