// GIF encoder that runs in a background worker (gifenc, MIT), so the page stays smooth.
// Frames arrive one at a time, so memory stays small however long the GIF is.
// Messages in:  {type:'start', width, height, loop, maxColors, dither, lossy, alpha}
//               {type:'frame', id, rgba, delay}   (rgba: full-size Uint8ClampedArray, delay in ms)
//               {type:'finish'}
// Messages out: {type:'ack', id}  {type:'done', bytes}  {type:'error', message}
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

// 4×4 ordered (Bayer) dithering: smooth gradients without the "crawling" noise that
// error-diffusion dithering causes from one frame to the next.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

function dither(rgba, width, height, spread) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = (y * width + x) * 4;
      if (rgba[p + 3] === 0) continue;
      const off = ((BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16 - 0.5) * spread;
      rgba[p] += off; // Uint8ClampedArray clamps to 0..255
      rgba[p + 1] += off;
      rgba[p + 2] += off;
    }
  }
}

// Fewer colours = bigger gaps between them = stronger dithering needed (256 → 24, 64 → 48).
const spreadFor = (colors) => 16 + 2048 / colors;

let gif = null;
let o = null; // options
let prev = null; // what the viewer currently sees (RGB), for skipping unchanged pixels

function encode(rgba, delay) {
  const { width, height, loop } = o;
  const repeat = loop === 'once' ? -1 : 0;

  // GIFs with see-through parts: one colour slot is "transparent"; each frame replaces the last.
  if (o.alpha) {
    const palette = quantize(rgba, o.maxColors, { format: 'rgba4444', oneBitAlpha: true });
    if (o.dither) dither(rgba, width, height, spreadFor(o.maxColors));
    const index = applyPalette(rgba, palette, 'rgba4444');
    const ti = palette.findIndex((c) => c[3] === 0);
    gif.writeFrame(index, width, height, { palette, delay, repeat, transparent: ti >= 0, transparentIndex: Math.max(0, ti), dispose: 2 });
    return;
  }

  // Normal GIFs: each frame gets its own best colours. Pixels that look the same as what is already
  // on screen become "transparent" so the old pixel shows through: much smaller files (as ffmpeg does).
  const colors = prev ? o.maxColors - 1 : o.maxColors;
  const palette = quantize(rgba, colors);
  if (o.dither) dither(rgba, width, height, spreadFor(colors));
  const index = applyPalette(rgba, palette);
  let transparentIndex = -1;
  if (prev) {
    transparentIndex = palette.length;
    const limit = o.lossy;
    for (let i = 0, j = 0; i < index.length; i++, j += 3) {
      const c = palette[index[i]];
      const dr = c[0] - prev[j];
      const dg = c[1] - prev[j + 1];
      const db = c[2] - prev[j + 2];
      if (dr * dr + dg * dg + db * db <= limit) {
        index[i] = transparentIndex;
      } else {
        prev[j] = c[0]; prev[j + 1] = c[1]; prev[j + 2] = c[2];
      }
    }
    palette.push([0, 0, 0]);
  } else {
    prev = new Uint8Array(width * height * 3);
    for (let i = 0, j = 0; i < index.length; i++, j += 3) {
      const c = palette[index[i]];
      prev[j] = c[0]; prev[j + 1] = c[1]; prev[j + 2] = c[2];
    }
  }
  gif.writeFrame(index, width, height, { palette, delay, repeat, transparent: transparentIndex >= 0, transparentIndex: Math.max(0, transparentIndex), dispose: 1 });
}

self.onmessage = ({ data }) => {
  try {
    if (data.type === 'start') {
      o = { maxColors: 256, dither: true, lossy: 0, alpha: false, loop: 'forever', ...data };
      gif = GIFEncoder();
      prev = null;
    } else if (data.type === 'frame') {
      encode(data.rgba, data.delay);
      self.postMessage({ type: 'ack', id: data.id });
    } else if (data.type === 'finish') {
      gif.finish();
      const bytes = gif.bytes();
      self.postMessage({ type: 'done', bytes }, [bytes.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err?.message || String(err) });
  }
};
