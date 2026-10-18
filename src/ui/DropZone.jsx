import { useDropzone } from 'react-dropzone';
import { Upload, Plus } from 'lucide-react';

// Big drop area when empty; a slim "add more" bar once files are in.
export default function DropZone({ onFiles, accept, hint, compact = false, disabled = false }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files.length && onFiles(files),
    accept,
    disabled,
  });

  if (compact) {
    return (
      <div
        {...getRootProps()}
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-semibold transition-colors ${
          isDragActive ? 'border-wine bg-wine-soft text-wine' : 'border-line-strong text-muted hover:bg-sand hover:text-ink'
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <Plus size={16} aria-hidden="true" />
        {isDragActive ? 'Drop to add them' : 'Add more files'}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
        isDragActive ? 'border-wine bg-wine-soft' : 'border-line-strong bg-cream hover:bg-sand/60'
      }`}
    >
      <input {...getInputProps()} />
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-wine text-paper">
        <Upload size={22} aria-hidden="true" />
      </span>
      <p className="text-base font-semibold">
        {isDragActive ? 'Drop your files here' : <>Drop files here, or <span className="text-wine underline underline-offset-4">choose files</span></>}
      </p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
    </div>
  );
}
