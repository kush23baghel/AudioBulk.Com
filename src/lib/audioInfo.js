// Reads a file's basic facts (length, format, quality, channels) before any processing,
// using music-metadata (MIT). Only the header is read, so it is fast even for big files.
import { parseBlob } from 'music-metadata';

const LOSSLESS = new Set(['FLAC', 'WAVE', 'PCM', 'ALAC', 'AIFF']);

export async function readAudioInfo(file) {
  try {
    const { format } = await parseBlob(file, { skipCovers: true, duration: false });
    const container = (format.container || '').toUpperCase();
    const codec = (format.codec || '').toUpperCase();
    return {
      ok: true,
      duration: format.duration ?? null, // seconds
      kbps: format.bitrate ? Math.round(format.bitrate / 1000) : null,
      sampleRate: format.sampleRate ?? null,
      channels: format.numberOfChannels ?? null,
      container,
      codec,
      lossless: format.lossless ?? (LOSSLESS.has(container) || LOSSLESS.has(codec)),
      hasAudio: Boolean(format.numberOfChannels || format.codec),
    };
  } catch {
    // Unknown or unusual format: let ffmpeg try anyway; it reads far more formats.
    return { ok: false };
  }
}

export function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

// One short line people can read: "3:24 · MP3 · 128 kbps · stereo"
export function describeAudio(info) {
  if (!info?.ok) return null;
  const parts = [formatDuration(info.duration)];
  if (info.codec || info.container) parts.push((info.codec || info.container).replace(/^MPEG 1 LAYER 3$/, 'MP3').split(' ')[0]);
  if (info.kbps) parts.push(`${info.kbps} kbps`);
  if (info.channels === 1) parts.push('mono');
  else if (info.channels === 2) parts.push('stereo');
  return parts.filter(Boolean).join(' · ');
}
