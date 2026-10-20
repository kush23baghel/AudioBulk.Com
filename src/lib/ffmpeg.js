import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance = null;
let loadPromise = null;
let loadingInstance = null; // the engine while it is still downloading, so Stop can cancel it too

export async function safeDelete(ffmpeg, filename) {
  if (!filename) return;
  try {
    await ffmpeg.deleteFile(filename);
  } catch {
    // Ignore missing temp files during cleanup
  }
}

async function initFFmpeg() {
  const ffmpeg = new FFmpeg();
  loadingInstance = ffmpeg;

  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg Log]', message);
  });

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
  const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
  // Stopped while downloading: don't start an engine nobody wants any more.
  if (loadingInstance !== ffmpeg) throw new Error('Stopped.');
  await ffmpeg.load({ coreURL, wasmURL });
  if (loadingInstance !== ffmpeg) {
    ffmpeg.terminate();
    throw new Error('Stopped.');
  }
  loadingInstance = null;
  ffmpegInstance = ffmpeg;
  return ffmpegInstance;
}

export const loadFFmpeg = () => {
  if (loadPromise) return loadPromise;

  const mine = initFFmpeg().catch((error) => {
    if (error?.message !== 'Stopped.') console.error('Failed to load FFmpeg.wasm:', error);
    if (loadPromise === mine) loadPromise = null; // a newer load may have started since
    throw error;
  });
  loadPromise = mine;
  return mine;
};

export const getFFmpeg = async () => {
  if (ffmpegInstance) return ffmpegInstance;
  return await loadFFmpeg();
};

export async function terminateFFmpeg() {
  // Still downloading: cancel that too, or a "stopped" job would start once it arrives.
  if (loadingInstance) {
    try { loadingInstance.terminate(); } catch { /* not started yet */ }
    loadingInstance = null;
    loadPromise = null;
  }
  if (ffmpegInstance) {
    try {
      ffmpegInstance.terminate();
    } catch (err) {
      console.error('Error terminating FFmpeg:', err);
    }
    ffmpegInstance = null;
    loadPromise = null;
  }
}

