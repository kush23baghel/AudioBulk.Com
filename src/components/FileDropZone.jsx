import { useDropzone } from 'react-dropzone';

export default function FileDropZone({ onFilesAdded, acceptTypes, icon = 'fa-cloud-arrow-up', title = 'Drag & Drop Files Here', subtitle = 'Supports bulk file selections' }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onFilesAdded(acceptedFiles);
      }
    },
    accept: acceptTypes,
  });

  return (
    <div
      {...getRootProps()}
      className={`relative group cursor-pointer overflow-hidden rounded-2xl border border-dashed p-10 text-center transition-all duration-300 ${
        isDragActive
          ? 'border-sky-400 bg-sky-900/20 shadow-[0_0_40px_rgba(14,165,233,0.15)]'
          : 'border-white/10 bg-slate-900/40 hover:border-sky-500/30 hover:bg-slate-900/60 shadow-lg'
      }`}
    >
      <input {...getInputProps()} />
      
      {/* Decorative background glow */}
      <div className="absolute -inset-10 bg-gradient-to-r from-sky-500/10 to-purple-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Animated icon */}
        <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-2xl transition-all duration-300 group-hover:scale-110 group-hover:border-sky-500/30 ${isDragActive ? 'text-sky-400 scale-110 border-sky-400/50 bg-sky-500/10' : 'text-slate-400'}`}>
          <i className={`fa-solid ${icon} ${isDragActive ? 'animate-bounce' : ''}`}></i>
        </div>

        <h3 className="text-lg font-bold text-white mb-1 font-outfit tracking-wide">
          {isDragActive ? 'Drop files now!' : title}
        </h3>
        <p className="text-sm text-slate-400 mb-6 max-w-xs font-medium">
          {subtitle}
        </p>

        <button
          type="button"
          className="btn-primary-glow px-6 py-2.5 text-sm"
        >
          <i className="fa-solid fa-folder-open mr-2 opacity-80"></i>
          Choose Files
        </button>
      </div>
    </div>
  );
}
