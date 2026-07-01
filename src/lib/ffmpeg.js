import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

let ffmpegInstance = null;
let loadPromise = null;

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

  ffmpeg.on('log', ({ message }) => {
    console.log('[FFmpeg Log]', message);
  });

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  ffmpegInstance = ffmpeg;
  return ffmpegInstance;
}

export const loadFFmpeg = () => {
  if (loadPromise) return loadPromise;

  loadPromise = initFFmpeg().catch((error) => {
    console.error('Failed to load FFmpeg.wasm:', error);
    loadPromise = null;
    throw error;
  });

  return loadPromise;
};

export const getFFmpeg = async () => {
  if (ffmpegInstance) return ffmpegInstance;
  return await loadFFmpeg();
};

export async function terminateFFmpeg() {
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

