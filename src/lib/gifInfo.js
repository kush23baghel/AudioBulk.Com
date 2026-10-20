// Reads a GIF's width, height and file size before processing (the browser's image decoder; fast).
export function readGifInfo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const done = (value) => { URL.revokeObjectURL(url); resolve(value); };
    const timer = setTimeout(() => done({ ok: false }), 8000);
    img.onload = () => { clearTimeout(timer); done({ ok: true, width: img.naturalWidth, height: img.naturalHeight, bytes: file.size }); };
    img.onerror = () => { clearTimeout(timer); done({ ok: false }); };
    img.src = url;
  });
}

export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
