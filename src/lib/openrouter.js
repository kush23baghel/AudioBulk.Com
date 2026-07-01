export async function generateAIResponse(userPrompt, systemPrompt, signal = null) {
  const apiKey = localStorage.getItem('openRouterApiKey') || import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = localStorage.getItem('openRouterModel') || import.meta.env.VITE_OPENROUTER_MODEL || "meta-llama/llama-3-8b-instruct:free";

  if (!apiKey) {
    throw new Error("OpenRouter API key is missing. Please set it in the Settings panel.");
  }

  const fetchSignal = signal || AbortSignal.timeout(30000);

  let response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: fetchSignal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, // Required for OpenRouter rankings
        "X-Title": "AudioBulk", // Required for OpenRouter rankings
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            // System prompt stands alone. No user content ever touches this string.
            role: "system",
            content: systemPrompt
          },
          {
            // Raw user input in its own message. The model's native role boundary
            // is the delimiter — no XML tags, no string interpolation, no bypass surface.
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw new Error("The AI took too long to respond or the request was aborted.");
    }
    throw new Error("Network error. Please check your internet connection.");
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const errMsg = err.error?.message || (typeof err.error === 'string' ? err.error : response.statusText);
    throw new Error(`API Error: ${errMsg}`);
  }

  try {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response generated.";
  } catch (err) {
    throw new Error("Received an invalid response from OpenRouter (Network Proxy Error).");
  }
}
