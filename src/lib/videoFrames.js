// Takes still pictures from a video at given times, using the browser's own video decoder
// (seek → draw on a canvas → save as JPG/PNG). Much faster than ffmpeg.wasm and avoids its
// JPG encoder crash ("memory access out of bounds") on H.264 videos.
// Throws if the browser can't play this format; callers can then fall back to ffmpeg.

function once(target, event, timeoutMs, errorEvent = 'error') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, timeoutMs);
    const ok = () => { cleanup(); resolve(); };
    const bad = () => { cleanup(); reject(new Error('decode')); };
    const cleanup = () => { clearTimeout(timer); target.removeEventListener(event, ok); target.removeEventListener(errorEvent, bad); };
    target.addEventListener(event, ok);
    target.addEventListener(errorEvent, bad);
  });
}

const toBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), type, quality));

// times: seconds; a negative number counts back from the end (-0 → the very last frame).
export async function grabFrames(file, times, { type = 'image/jpeg', quality = 0.92, onProgress } = {}) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  try {
    video.src = url;
    await once(video, 'loadeddata', 15000);
    if (!video.videoWidth) throw new Error('decode');
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    const out = [];
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      // The last frame lives a hair before the end; seeking to the exact end can show nothing.
      // 5 ms is inside the final frame even at 120 fps (0.05 s landed one frame early at 30 fps).
      const at = Object.is(t, -0) || t < 0 ? Math.max(0, duration + t - 0.005) : Math.min(t, Math.max(0, duration - 0.005));
      if (Math.abs(video.currentTime - at) > 0.001 || i === 0) {
        video.currentTime = at;
        await once(video, 'seeked', 15000);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      out.push(await toBlob(canvas, type, quality));
      onProgress?.(((i + 1) / times.length) * 100);
    }
    return out;
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}

// Turns a PNG (from the ffmpeg fallback) into the chosen picture type.
export async function convertImage(blob, type = 'image/jpeg', quality = 0.92) {
  if (type === 'image/png') return blob;
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  bitmap.close();
  return toBlob(canvas, type, quality);
}
