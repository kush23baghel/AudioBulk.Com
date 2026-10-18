import { test, expect } from '@playwright/test';

// @slow — excluded from the default run (see grepInvert in playwright.config.js).
// Run explicitly with:  RUN_SLOW=1 npx playwright test --grep @slow
// This is the only test that actually exercises ffmpeg.wasm: it downloads the ~25MB
// core from unpkg and runs a real conversion, so it's slow and network-dependent.

// A minimal but valid 16-bit PCM mono WAV (a few samples of silence). ffmpeg decodes
// this as a real audio stream, satisfying the tool's "has audio" probe.
function tinyWavBuffer() {
  const sampleRate = 8000;
  const numSamples = 800; // 0.1s
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // audio format = PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32); // block align
  buf.writeUInt16LE(16, 34); // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  return buf; // sample data left as zeros (silence)
}

test('@slow ffmpeg converts a real audio file end-to-end', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/tools/bulk-audio-converter');

  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'silence.wav',
    mimeType: 'audio/wav',
    buffer: tinyWavBuffer(),
  });

  // File should appear in the queue.
  await expect(page.getByText('silence.wav')).toBeVisible();

  await page.getByRole('button', { name: /^Convert 1 file/i }).click();

  // Conversion completes when the main Download button appears (status becomes 'done').
  await expect(page.getByRole('button', { name: /^Download$/i })).toBeVisible({ timeout: 150_000 });
});
