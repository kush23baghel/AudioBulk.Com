import { useState, useEffect } from 'react';
import { downloadFiles } from '../lib/download';
import { saveAs } from 'file-saver';

function ImagePreview({ file }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!url) return null;
  return <img src={url} alt="preview" className="w-full h-full object-cover" />;
}

// Utility helper to format file size
const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function ProcessingQueue({ queue, isProcessing, overallProgress, onRemove, onClear, onProcess }) {
  if (!queue || queue.length === 0) return null;

  const hasDoneFiles = queue.some(item => item.status === 'done');
  const hasPendingOrError = queue.some(item => item.status === 'pending' || item.status === 'error');
  const allDone = !hasPendingOrError;

  const handleDownloadAll = () => {
    const outputs = [];
    queue.forEach((item) => {
      if (item.outputs && item.outputs.length > 0) {
        item.outputs.forEach((out) => {
          outputs.push({
            name: out.name,
            url: out.url,
          });
        });
      }
    });
    downloadFiles(outputs);
  };

  const handleDownloadSingle = (output) => {
    if (output.url) {
      saveAs(output.url, output.name);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-6 bg-slate-900/40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white font-outfit">Processing Queue</h3>
          <p className="text-xs text-slate-400 font-medium">
            {queue.length} file(s) loaded
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onClear}
            disabled={isProcessing}
            className="btn btn-sm btn-outline border-white/20 hover:bg-white/10 text-slate-300 disabled:opacity-30 rounded-xl"
          >
            Clear Queue
          </button>
          
          {hasDoneFiles && (
            <button
              onClick={handleDownloadAll}
              className="btn btn-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white border-0 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] rounded-xl"
            >
              <i className="fa-solid fa-download mr-1"></i>
              Download All
            </button>
          )}

          {isProcessing ? (
            <button
              disabled
              className="btn btn-sm btn-primary-glow border-0 font-semibold rounded-xl opacity-50 min-h-[2rem] h-8 px-4"
            >
              <span className="loading loading-spinner loading-xs mr-1"></span>
              Processing...
            </button>
          ) : (
            <>
              {hasPendingOrError ? (
                <button
                  onClick={() => onProcess(false)}
                  className="btn btn-sm btn-primary-glow border-0 font-semibold rounded-xl min-h-[2rem] h-8 px-4"
                >
                  <i className="fa-solid fa-play mr-1"></i>
                  {hasDoneFiles ? 'Process New Files' : 'Start Processing'}
                </button>
              ) : (
                <button
                  onClick={() => onProcess(true)}
                  className="btn btn-sm btn-outline border-sky-500/30 hover:bg-sky-500/10 text-sky-400 font-semibold rounded-xl min-h-[2rem] h-8 px-4 transition-all"
                >
                  <i className="fa-solid fa-rotate-left mr-1"></i>
                  Process Again
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Overall Progress Bar */}
      {isProcessing && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-300 tracking-wide uppercase">
            <span>Overall Batch Progress</span>
            <span className="text-sky-400">{overallProgress}%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-sky-500 to-purple-500 h-full transition-all duration-300 relative shadow-[0_0_10px_rgba(14,165,233,0.5)]"
              style={{ width: `${overallProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Files List */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="table w-full text-slate-300">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 text-xs uppercase font-outfit tracking-wider">
              <th className="bg-transparent font-semibold">File Name</th>
              <th className="bg-transparent font-semibold">Size</th>
              <th className="w-48 bg-transparent font-semibold">Progress / Status</th>
              <th className="w-24 bg-transparent font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((item) => (
              <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="max-w-xs font-medium text-slate-200">
                  <div className="flex items-center gap-3">
                    {item.file && item.file.type.startsWith('image/') ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black/20 flex items-center justify-center">
                        <ImagePreview file={item.file} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg border border-white/10 shrink-0 bg-black/20 flex items-center justify-center text-slate-500">
                        <i className={`fa-solid ${item.file?.type.startsWith('video/') ? 'fa-film' : item.file?.type.startsWith('audio/') ? 'fa-music' : 'fa-file'}`}></i>
                      </div>
                    )}
                    <span className="truncate pr-4" title={item.name}>{item.name}</span>
                  </div>
                </td>
                <td className="text-xs text-slate-400 font-medium">
                  {formatSize(item.size)}
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    {/* Status Badge & Progress */}
                    {item.status === 'pending' && (
                      <span className="badge badge-sm border border-white/10 bg-white/5 text-slate-400">
                        Queued
                      </span>
                    )}
                    
                    {item.status === 'processing' && (
                      <div className="flex items-center gap-2 w-full">
                        <span className="badge badge-sm border border-sky-500/30 bg-sky-500/10 text-sky-400 flex gap-1 items-center">
                          <span className="loading loading-spinner loading-xs h-3 w-3"></span>
                          Processing
                        </span>
                        <div className="w-24 bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                          <div
                            className="bg-sky-400 h-full transition-all duration-300 shadow-[0_0_5px_rgba(14,165,233,0.8)]"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-sky-400 font-bold">{item.progress}%</span>
                      </div>
                    )}

                    {item.status === 'done' && (
                      <span className="badge badge-sm border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex gap-1 items-center">
                        <i className="fa-solid fa-circle-check"></i>
                        Ready
                      </span>
                    )}

                    {item.status === 'error' && (
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className="badge badge-sm border border-red-500/30 bg-red-500/10 text-red-400 flex gap-1 items-center tooltip tooltip-bottom"
                          data-tip={item.errorMsg}
                        >
                          <i className="fa-solid fa-circle-xmark"></i>
                          Failed
                        </span>
                        {item.errorMsg && (
                          <span className="text-[10px] text-red-400/90 leading-tight max-w-[200px] block whitespace-normal">
                            {item.errorMsg}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1 flex-wrap">
                    {item.outputs && item.outputs.length > 0 && item.outputs.map((out, idx) => {
                      const ext = out.name.split('.').pop().toUpperCase();
                      return (
                        <button
                          key={idx}
                          onClick={() => handleDownloadSingle(out)}
                          className="btn btn-ghost btn-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg flex items-center gap-1 px-1.5"
                          title={`Download ${out.name}`}
                        >
                          <i className="fa-solid fa-download"></i>
                          <span className="text-[10px] font-bold">{ext}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => onRemove(item.id)}
                      disabled={isProcessing}
                      className="btn btn-ghost btn-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg disabled:opacity-30"
                    >
                      <i className="fa-regular fa-trash-can"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Next Steps Chaining */}
      {allDone && hasDoneFiles && (
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col items-center justify-center space-y-5 text-center animate-fade-in">
          <div className="flex items-center gap-2 text-emerald-400">
            <i className="fa-solid fa-circle-check text-xl animate-bounce"></i>
            <h4 className="text-base font-bold text-white font-outfit">Batch Processing Complete!</h4>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            All files processed successfully, 100% locally. Help support our server-free, private toolkit by sharing AudioBulk!
          </p>
          <div className="flex gap-2">
            <a 
              href="https://twitter.com/intent/tweet?text=Just%20bulk%20processed%20my%20media%20100%25%20locally%20and%20privately%20using%20AudioBulk!%20No%20file%20uploads%20needed.%20Check%20it%20out%20at%20https%3A%2F%2Faudiobulk.com%20%23localfirst%20%23privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-xs bg-[#1DA1F2] hover:bg-[#1a91da] text-white border-0 font-semibold rounded-lg flex items-center gap-1.5 px-3 py-1"
            >
              <i className="fa-brands fa-twitter"></i>
              Share on Twitter
            </a>
            <a 
              href="https://www.reddit.com/submit?url=https%3A%2F%2Faudiobulk.com&title=AudioBulk%20-%20Free%20Local-First%20Bulk%20Media%20Processor"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-xs bg-[#FF4500] hover:bg-[#e03d00] text-white border-0 font-semibold rounded-lg flex items-center gap-1.5 px-3 py-1"
            >
              <i className="fa-brands fa-reddit"></i>
              Share on Reddit
            </a>
          </div>
          <div className="w-full max-w-md h-px bg-white/5 my-2"></div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-manrope">Continue Workflow</h4>
          <div className="flex flex-wrap gap-2.5 justify-center">
            <a href="/all-tools?cat=video" className="btn btn-xs btn-outline border-white/10 hover:bg-white/5 text-slate-300 rounded-xl px-3 py-1">
              <i className="fa-solid fa-video text-violet-400"></i> Video Tools
            </a>
            <a href="/all-tools?cat=audio" className="btn btn-xs btn-outline border-white/10 hover:bg-white/5 text-slate-300 rounded-xl px-3 py-1">
              <i className="fa-solid fa-music text-sky-400"></i> Audio Tools
            </a>
            <a href="/all-tools?cat=utilities" className="btn btn-xs btn-outline border-white/10 hover:bg-white/5 text-slate-300 rounded-xl px-3 py-1">
              <i className="fa-solid fa-screwdriver-wrench text-slate-400"></i> Utilities
            </a>
            <a href="/all-tools" className="btn btn-xs btn-outline border-white/10 hover:bg-white/5 text-slate-300 rounded-xl px-3 py-1">
              View All 70 Tools
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
