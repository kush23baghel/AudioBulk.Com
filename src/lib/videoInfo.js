// Reads a video's facts before processing: width, height, length (from the browser's own
// video decoder) and whether it has sound (from music-metadata). Fast: only metadata is read.
import { readAudioInfo } from './audioInfo';

function readDimensions(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    const done = (value) => { URL.revokeObjectURL(url); v.removeAttribute('src'); resolve(value); };
    const timer = setTimeout(() => done(null), 8000);
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => { clearTimeout(timer); done({ width: v.videoWidth || null, height: v.videoHeight || null, duration: Number.isFinite(v.duration) ? v.duration : null }); };
    v.onerror = () => { clearTimeout(timer); done(null); };
    v.src = url;
  });
}

export async function readVideoInfo(file) {
  const [dims, audio] = await Promise.all([readDimensions(file), readAudioInfo(file)]);
  if (!dims && !audio.ok) return { ok: false };
  return {
    ok: true,
    width: dims?.width ?? null,
    height: dims?.height ?? null,
    duration: dims?.duration ?? audio.duration ?? null,
    // music-metadata reports the audio track's channels; none means the video is silent (when readable).
    hasAudio: audio.ok ? Boolean(audio.channels) : null,
    channels: audio.channels ?? null,
    kbps: audio.kbps ?? null,
    container: audio.container || (file.name.split('.').pop() || '').toUpperCase(),
    isVideo: Boolean(dims?.width),
  };
}

// "1280×720 · 0:12 · with sound"
export function describeVideo(info) {
  if (!info?.ok) return null;
  const parts = [];
  if (info.width && info.height) parts.push(`${info.width}×${info.height}`);
  if (info.duration) {
    const s = Math.round(info.duration);
    parts.push(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
  }
  if (info.hasAudio === true) parts.push('with sound');
  if (info.hasAudio === false) parts.push('no sound');
  return parts.join(' · ');
}
