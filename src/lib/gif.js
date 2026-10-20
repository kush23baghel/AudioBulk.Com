// The GIF engine for every GIF tool, without ffmpeg:
//   - encode: gifenc in a background worker (src/lib/gifWorker.js), frames streamed one at a time
//   - decode: gifuct-js, with each full frame rebuilt the way browsers show it (disposal rules)
//   - video frames: the browser's own video decoder (seek → canvas)
import { parseGIF, decompressFrame } from 'gifuct-js';

// Browsers play very short GIF delays (under 20 ms) as 100 ms, so we never write one.
export const MIN_DELAY = 20;

// ---------- encoding ----------

// opts: { width, height, loop: 'forever'|'once', maxColors, dither, lossy, alpha }
export function createGifEncoder(opts) {
  const worker = new Worker(new URL('./gifWorker.js', import.meta.url), { type: 'module' });
  const waits = new Map();
  let nextId = 0;
  let finished = null;
  let failure = null;

  const fail = (message) => {
    failure = new Error(message || 'The GIF could not be made.');
    waits.forEach((w) => w.reject(failure));
    waits.clear();
    finished?.reject(failure);
    worker.terminate();
  };
  worker.onmessage = ({ data }) => {
    if (data.type === 'ack') { waits.get(data.id)?.resolve(); waits.delete(data.id); }
    else if (data.type === 'done') { finished?.resolve(new Blob([data.bytes], { type: 'image/gif' })); worker.terminate(); }
    else if (data.type === 'error') fail(data.message);
  };
  worker.onerror = (e) => { e.preventDefault?.(); fail(e.message); };
  worker.postMessage({ type: 'start', ...opts });

  return {
    // rgba: full-size Uint8ClampedArray (handed over to the worker, don't reuse it). Resolves when encoded.
    add(rgba, delay) {
      if (failure) return Promise.reject(failure);
      const id = ++nextId;
      const p = new Promise((resolve, reject) => waits.set(id, { resolve, reject }));
      worker.postMessage({ type: 'frame', id, rgba, delay: Math.max(MIN_DELAY, Math.round(delay)) }, [rgba.buffer]);
      return p;
    },
    finish() {
      if (failure) return Promise.reject(failure);
      return new Promise((resolve, reject) => { finished = { resolve, reject }; worker.postMessage({ type: 'finish' }); });
    },
    cancel() { worker.terminate(); },
  };
}

// Frame times that add up exactly (GIF delays are in 1/100 s, so 15 fps can't be 66.67 ms every frame).
export function delayFor(i, fps) {
  return (Math.round(((i + 1) * 100) / fps) - Math.round((i * 100) / fps)) * 10;
}

// ---------- decoding ----------

// Opens a GIF. frames() yields every frame as the full picture a viewer sees: { rgba, delay }.
export async function openGif(file) {
  let parsed;
  try { parsed = parseGIF(await file.arrayBuffer()); } catch { throw new Error('This GIF could not be read. It may be damaged.'); }
  const width = parsed.lsd?.width;
  const height = parsed.lsd?.height;
  const raw = (parsed.frames || []).filter((f) => f.image);
  if (!width || !height || !raw.length) throw new Error('This GIF could not be read. It may be damaged.');

  function* frames() {
    const canvas = new Uint8ClampedArray(width * height * 4); // starts fully transparent
    let saved = null;
    for (const f of raw) {
      const fr = decompressFrame(f, parsed.gct, false);
      const { top, left, width: fw, height: fh } = fr.dims;
      const ct = fr.colorTable || [];
      const ti = fr.transparentIndex;
      if (fr.disposalType === 3) saved = canvas.slice();
      for (let y = 0; y < fh; y++) {
        const cy = top + y;
        if (cy >= height) break;
        for (let x = 0; x < fw; x++) {
          const cx = left + x;
          if (cx >= width) continue;
          const ci = fr.pixels[y * fw + x];
          if (ci === ti || !ct[ci]) continue;
          const c = ct[ci];
          const p = (cy * width + cx) * 4;
          canvas[p] = c[0]; canvas[p + 1] = c[1]; canvas[p + 2] = c[2]; canvas[p + 3] = 255;
        }
      }
      // Missing or tiny delays play as 100 ms in browsers; match what people actually see.
      const delay = !fr.delay || fr.delay < MIN_DELAY ? 100 : fr.delay;
      yield { rgba: canvas.slice(), delay };
      if (fr.disposalType === 2) {
        for (let y = top; y < Math.min(height, top + fh); y++) canvas.fill(0, (y * width + left) * 4, (y * width + Math.min(width, left + fw)) * 4);
      } else if (fr.disposalType === 3 && saved) {
        canvas.set(saved);
      }
    }
  }

  // One quick pass: total length, and whether any frame has see-through pixels.
  let duration = 0;
  let alpha = false;
  for (const { rgba, delay } of frames()) {
    duration += delay;
    if (!alpha) for (let p = 3; p < rgba.length; p += 4) if (rgba[p] === 0) { alpha = true; break; }
  }
  return { width, height, count: raw.length, duration, alpha, frames };
}

// ---------- picture helpers ----------

// Resize and/or crop one RGBA frame. crop = {x, y, w, h} in source pixels.
export function transformFrame(rgba, srcW, srcH, outW, outH, crop = null) {
  if (!crop && outW === srcW && outH === srcH) return rgba;
  const src = new OffscreenCanvas(srcW, srcH);
  src.getContext('2d').putImageData(new ImageData(rgba, srcW, srcH), 0, 0);
  const dst = new OffscreenCanvas(outW, outH);
  const ctx = dst.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  const c = crop || { x: 0, y: 0, w: srcW, h: srcH };
  ctx.drawImage(src, c.x, c.y, c.w, c.h, 0, 0, outW, outH);
  return ctx.getImageData(0, 0, outW, outH).data;
}

// Never stretch: the output is at most `maxWidth` wide, and never wider than the source.
export function fitWidth(srcW, srcH, maxWidth) {
  const w = Math.max(1, Math.min(srcW, Math.round(maxWidth || srcW)));
  return { width: w, height: Math.max(1, Math.round((srcH * w) / srcW)) };
}

// ---------- GIF in → change → GIF out (editor and compressor) ----------

const MAX_HELD_BYTES = 600 * 1024 * 1024; // reversing has to hold every frame in memory

// opts: { maxWidth, square, speed, reverse, maxFps, maxColors, dither, lossy, onProgress }
export async function reencodeGif(file, opts = {}) {
  const { maxWidth = 0, square = false, speed = 1, reverse = false, maxFps = 0, maxColors = 256, dither = true, lossy = 100, onProgress } = opts;
  const gif = await openGif(file);

  let crop = null;
  let srcW = gif.width;
  let srcH = gif.height;
  if (square && gif.width !== gif.height) {
    const side = Math.min(gif.width, gif.height);
    crop = { x: Math.floor((gif.width - side) / 2), y: Math.floor((gif.height - side) / 2), w: side, h: side };
    srcW = side;
    srcH = side;
  }
  const { width, height } = maxWidth ? fitWidth(srcW, srcH, maxWidth) : { width: srcW, height: srcH };

  // 1. every frame at the new size
  let done = 0;
  function* sized() {
    for (const f of gif.frames()) {
      yield { rgba: transformFrame(f.rgba, gif.width, gif.height, width, height, crop), delay: f.delay / speed };
      done += 1;
      onProgress?.((done / gif.count) * 97);
    }
  }
  // 2. backwards, if asked (needs all frames at once)
  function* ordered() {
    if (!reverse) { yield* sized(); return; }
    if (width * height * 4 * gif.count > MAX_HELD_BYTES) throw new Error('This GIF is too big to reverse in the browser. Make it smaller first (GIF Editor → Resize).');
    yield* [...sized()].reverse();
  }
  // 3. never shorter than the frame-rate limit or the 20 ms browser minimum: join quick frames
  //    (the first picture stays, their times add up), so the total length is always right.
  const minGap = Math.max(MIN_DELAY, maxFps ? 1000 / maxFps : 0);
  function* timed() {
    let held = null;
    for (const f of ordered()) {
      if (held && held.delay < minGap) { held.delay += f.delay; continue; }
      if (held) yield held;
      held = f;
    }
    if (held) yield held;
  }

  const encoder = createGifEncoder({ width, height, maxColors, dither, lossy, alpha: gif.alpha });
  try {
    let clock = 0; // keep rounding to 1/100 s from drifting
    let pending = null;
    let frames = 0;
    for (const f of timed()) {
      const delay = Math.round((clock + f.delay) / 10) * 10 - Math.round(clock / 10) * 10;
      clock += f.delay;
      await pending;
      pending = encoder.add(f.rgba, delay);
      frames += 1;
    }
    await pending;
    const blob = await encoder.finish();
    onProgress?.(100);
    return { blob, width, height, frames, before: { width: gif.width, height: gif.height, frames: gif.count, duration: gif.duration } };
  } catch (err) {
    encoder.cancel();
    throw err;
  }
}

// ---------- video ----------

function once(target, event, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, timeoutMs);
    const ok = () => { cleanup(); resolve(); };
    const bad = () => { cleanup(); reject(new Error('decode')); };
    const cleanup = () => { clearTimeout(timer); target.removeEventListener(event, ok); target.removeEventListener('error', bad); };
    target.addEventListener(event, ok);
    target.addEventListener('error', bad);
  });
}

// Opens a video with the browser's decoder. Throws Error('decode') if the browser can't play it.
export async function openVideo(file) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  const close = () => { video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); };
  try {
    video.src = url;
    await once(video, 'loadeddata', 15000);
    if (!video.videoWidth) throw new Error('decode');
  } catch (err) {
    close();
    throw err;
  }
  const duration = Number.isFinite(video.duration) ? video.duration : 0;

  // Yields the picture at each time in `times` (seconds), drawn at outW × outH.
  async function* frames(times, outW, outH) {
    const canvas = new OffscreenCanvas(outW, outH);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    for (const t of times) {
      // 1 ms past the asked time: a time exactly on a frame boundary (1/15 s in a 30 fps video) can
      // round down and show the previous frame. The very end is a hair before the duration.
      const at = Math.min(t + 0.001, Math.max(0, duration - 0.005));
      if (Math.abs(video.currentTime - at) > 0.0005) {
        video.currentTime = at;
        await once(video, 'seeked', 15000);
      }
      ctx.drawImage(video, 0, 0, outW, outH);
      yield ctx.getImageData(0, 0, outW, outH).data;
    }
  }
  return { width: video.videoWidth, height: video.videoHeight, duration, frames, close };
}
