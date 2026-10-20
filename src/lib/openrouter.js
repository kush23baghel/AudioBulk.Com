// Calls OpenRouter with the visitor's own key (bring-your-own-key: never read from import.meta.env,
// Vite would publish it in the bundle).
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = import.meta.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct:free';
const TIMEOUT_MS = 60000;

export const MISSING_KEY_MESSAGE = 'Your AI key is missing. Add your free key in Settings (the gear button at the top) and try again.';

function readSetting(name) {
  try { return localStorage.getItem(name); } catch { return null; }
}

// The caller's cancel signal AND a time limit, so a stuck request can never spin forever.
function withTimeout(signal) {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  if (!signal) return timeout;
  return AbortSignal.any ? AbortSignal.any([signal, timeout]) : signal;
}

async function ask(apiKey, model, systemPrompt, userPrompt, signal) {
  let response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      signal: withTimeout(signal),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'AudioBulk',
      },
      body: JSON.stringify({
        model,
        // System prompt and user text are separate messages; user text never touches the system prompt.
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1600,
        // Some providers make the model "think" first, which used the whole budget and left the answer empty.
        reasoning: { enabled: false },
      }),
    });
  } catch (err) {
    if (signal?.aborted) throw new Error('Stopped.', { cause: err });
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new Error('The AI took too long to answer. Please try again in a moment.', { cause: err });
    }
    throw new Error('Could not reach the AI service. Check your internet connection and try again.', { cause: err });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = body.error?.message || (typeof body.error === 'string' ? body.error : response.statusText);
    if (response.status === 401) throw new Error('Your AI key was not accepted. Check it in Settings (the gear button).');
    if (response.status === 402) throw new Error('Your OpenRouter account is out of credit. Add credit or pick a free model in Settings.');
    if (response.status === 429) throw new Error('Too many requests right now. Wait a few seconds and try again.');
    throw new Error(`The AI service said: ${detail}`);
  }

  const data = await response.json().catch(() => null);
  return data?.choices?.[0]?.message?.content?.trim() || '';
}

export async function generateAIResponse(userPrompt, systemPrompt, signal = null) {
  const apiKey = readSetting('openRouterApiKey');
  if (!apiKey) throw new Error(MISSING_KEY_MESSAGE);
  const model = readSetting('openRouterModel') || DEFAULT_MODEL;

  // Empty answers happen now and then (busy provider); try once more before giving up.
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await ask(apiKey, model, systemPrompt, userPrompt, signal);
    if (text) return text;
  }
  throw new Error('The AI sent back an empty answer twice. Please try again, or pick a different model in Settings.');
}
