// Calls OpenRouter with the visitor's own key (bring-your-own-key: never read from import.meta.env,
// Vite would publish it in the bundle).
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
// "openrouter/free" picks whichever free model is up right now (single free models come and go).
export const DEFAULT_MODEL = 'openrouter/free';
const TIMEOUT_MS = 90000;

export const MISSING_KEY_MESSAGE = 'Your AI key is missing. Add your free key in Settings (the gear button at the top) and try again.';

// Old default that OpenRouter has removed; anyone who saved it moves to the new default.
const RETIRED = ['meta-llama/llama-3-8b-instruct:free'];

function readSetting(name) {
  try { return localStorage.getItem(name); } catch { return null; }
}

export function currentModel() {
  const saved = readSetting('openRouterModel');
  return saved && !RETIRED.includes(saved) ? saved : DEFAULT_MODEL;
}

// The caller's cancel signal AND a time limit, so a stuck request can never spin forever.
function withTimeout(signal) {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  if (!signal) return timeout;
  return AbortSignal.any ? AbortSignal.any([signal, timeout]) : signal;
}

async function post(apiKey, body, signal) {
  try {
    return await fetch(ENDPOINT, {
      method: 'POST',
      signal: withTimeout(signal),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AudioBulk',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (signal?.aborted) throw new Error('Stopped.', { cause: err });
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('The AI took too long to answer. Please try again in a moment.', { cause: err });
    }
    throw new Error('Could not reach the AI service. Check your internet connection and try again.', { cause: err });
  }
}

// One chat call. messages = [{role, content}, …]. Returns the answer text ('' if the model sent nothing).
export async function chat(messages, { temperature = 0.7, maxTokens = 2400, signal = null } = {}) {
  const apiKey = readSetting('openRouterApiKey');
  if (!apiKey) throw new Error(MISSING_KEY_MESSAGE);
  const model = currentModel();

  // Thinking off: some providers spend the whole budget "thinking" and leave the answer empty.
  // A few models refuse that setting, so ask again without it.
  const body = { model, messages, temperature, max_tokens: maxTokens, reasoning: { enabled: false } };
  let response = await post(apiKey, body, signal);
  let error = response.ok ? null : await response.json().catch(() => ({}));
  if (response.status === 400 && /reasoning/i.test(error?.error?.message || '')) {
    delete body.reasoning;
    response = await post(apiKey, body, signal);
    error = response.ok ? null : await response.json().catch(() => ({}));
  }

  if (!response.ok) {
    const detail = error?.error?.message || (typeof error?.error === 'string' ? error.error : response.statusText);
    if (response.status === 401) throw new Error('Your AI key was not accepted. Check it in Settings (the gear button).');
    if (response.status === 402) throw new Error('Your OpenRouter account is out of credit. Add credit or pick a free model in Settings.');
    if (response.status === 429) throw new Error('The AI model is busy right now. Wait a few seconds and try again, or pick another model in Settings.');
    if (response.status === 404) throw new Error(`The model "${model}" is not available any more. Pick another one in Settings.`);
    throw new Error(`The AI service said: ${detail}`);
  }

  const data = await response.json().catch(() => null);
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

// Simple one-shot call, kept for older callers.
export async function generateAIResponse(userPrompt, systemPrompt, signal = null) {
  const messages = [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }];
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await chat(messages, { signal });
    if (text) return text;
  }
  throw new Error('The AI sent back an empty answer twice. Please try again, or pick a different model in Settings.');
}
