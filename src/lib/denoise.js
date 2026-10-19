import createRNNWasmModule from '@jitsi/rnnoise-wasm/dist/rnnoise.js';
import wasmUrl from '@jitsi/rnnoise-wasm/dist/rnnoise.wasm?url';

const RATE = 48000; // RNNoise only works at 48 kHz
const FRAME = 480; // 10 ms
const SCALE = 32768; // RNNoise expects 16-bit range samples

let modulePromise = null;
function loadModule() {
  if (!modulePromise) {
    modulePromise = createRNNWasmModule({ locateFile: (f) => (f.endsWith('.wasm') ? wasmUrl : f) });
  }
  return modulePromise;
}

async function toMono48k(file) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  let decoded;
  try {
    decoded = await ctx.decodeAudioData(await file.arrayBuffer());
  } finally {
    ctx.close?.();
  }
  const length = Math.max(1, Math.ceil(decoded.duration * RATE));
  const offline = new OfflineAudioContext(1, length, RATE); // 1 channel: browser mixes down
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

function encodeWav(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

/** Removes background noise from a speech recording. Returns a mono 48 kHz WAV blob. */
export async function denoiseToWav(file, onProgress = () => {}) {
  let input;
  try {
    input = await toMono48k(file);
  } catch {
    throw new Error('This file could not be read. It may be damaged. Try a different file.');
  }
  const rnn = await loadModule();
  const state = rnn._rnnoise_create(0);
  const inPtr = rnn._malloc(FRAME * 4);
  const outPtr = rnn._malloc(FRAME * 4);
  const out = new Float32Array(input.length);
  try {
    const frames = Math.ceil(input.length / FRAME);
    for (let f = 0; f < frames; f++) {
      const start = f * FRAME;
      const chunk = input.subarray(start, Math.min(start + FRAME, input.length));
      const heapIn = rnn.HEAPF32; // re-read: memory can grow
      for (let i = 0; i < FRAME; i++) heapIn[(inPtr >> 2) + i] = (i < chunk.length ? chunk[i] : 0) * SCALE;
      rnn._rnnoise_process_frame(state, outPtr, inPtr);
      const heapOut = rnn.HEAPF32;
      for (let i = 0; i < chunk.length; i++) out[start + i] = heapOut[(outPtr >> 2) + i] / SCALE;
      if (f % 200 === 0) {
        onProgress((f / frames) * 100);
        await new Promise((r) => setTimeout(r, 0)); // let the page breathe
      }
    }
  } finally {
    rnn._free(inPtr);
    rnn._free(outPtr);
    rnn._rnnoise_destroy(state);
  }
  onProgress(100);
  return encodeWav(out, RATE);
}
