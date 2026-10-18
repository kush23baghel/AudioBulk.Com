import { toolsList, toolCategories } from '../../src/data/tools.js';

export { toolsList, toolCategories };

// Console/network noise that is expected and unrelated to app correctness:
// third-party CDNs (fonts, FontAwesome CSS, ffmpeg core), favicons, and the
// dev-only React DevTools nudge. Anything else counts as a real page error.
const IGNORED_ERROR_PATTERNS = [
  /favicon/i,
  /manifest/i,
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
  /cdnjs\.cloudflare\.com/i,
  /unpkg\.com/i,
  /font-awesome/i,
  /Download the React DevTools/i,
  /\[FFmpeg Log\]/i,
  /ERR_INTERNET_DISCONNECTED/i,
  /net::ERR_/i, // network fetch failures for the CDNs above in offline CI
];

export function isIgnoredError(text) {
  return IGNORED_ERROR_PATTERNS.some((re) => re.test(text));
}

// Attach listeners that record genuine console errors and uncaught exceptions.
// Returns an array that fills as the page runs; assert it stays empty.
export function collectPageErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!isIgnoredError(text)) errors.push(`console.error: ${text}`);
    }
  });
  page.on('pageerror', (err) => {
    const text = err.message || String(err);
    if (!isIgnoredError(text)) errors.push(`pageerror: ${text}`);
  });
  return errors;
}
