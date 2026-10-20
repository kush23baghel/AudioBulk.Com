// The fixed workflow every AI tool runs, whatever the model:
//   1. ask  →  2. clean the answer  →  3. check it against the tool's rules  →
//   4. if a rule is broken, send ONE follow-up naming exactly what is wrong  →  5. keep the better answer.
// No browser code here: the page passes in `chat` (src/lib/openrouter.js), the test script passes its own.

// Phrases models fall back on when they have nothing specific to say. Shared by every tool.
export const BANNED = [
  'in a world where', 'tapestry', 'delve', 'testament to', 'symphony of', 'nestled', 'bustling', 'vibrant',
  'embark', 'unleash', 'unlock the', 'elevate your', 'game-changer', 'game changer', "in today's", 'fast-paced',
  'little did', 'shrouded in', 'realm of', 'ever-evolving', 'seamless', 'captivating', 'it is important to note',
  "it's important to note", 'in conclusion', 'plethora', 'myriad', 'beacon of', 'navigate the complexities',
  'a sense of wonder', 'only time will tell', 'the stuff of legends', 'whispers of', 'dive into', 'look no further',
];

const PREAMBLE = /^(?:(?:sure|certainly|of course|absolutely|okay|ok|great|alright)\b[^\n]{0,80}[!.:]|here(?:'s| is| are)\b[^\n]{0,100}:)\s*$/i;
const SIGN_OFF = /^(?:i hope|hope (?:this|you)|let me know|feel free|would you like|if you (?:want|need|would like|'d like)|happy to help|want me to|enjoy[!.]?$|good luck[!.]?$)/i;

export const wordCount = (s) => (s.match(/\S+/g) || []).length;

// Simple guess: is this text English? (Headings are checked by name only for English answers.)
// (Only words that are not also common in Spanish, French, German, etc.)
export const looksEnglish = (s) => (s.match(/\b(the|and|of|with|who|that|this|is|are|you|your|his|her|they)\b/gi) || []).length >= 3 || wordCount(s) < 6;

// 1. Remove what is never part of the answer: hidden thinking, a code fence around everything,
//    "Sure! Here is…" openers and "Let me know…" closers.
export function cleanAnswer(raw) {
  let text = String(raw || '').replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '').trim();
  const fenced = /^```[a-z]*\s*\n([\s\S]*?)\n```$/i.exec(text);
  if (fenced) text = fenced[1].trim();
  // A title line copied with the template's brackets: "**(My Title)**" → "**My Title**".
  const lines = text.split('\n').map((l) => l.replace(/^(\s*(?:#{1,6}\s+(?:\*\*)?|\*\*))\(([^()]+)\)((?:\*\*)?\s*)$/, '$1$2$3'));
  while (lines.length && (!lines[0].trim() || PREAMBLE.test(lines[0].trim()))) lines.shift();
  while (lines.length && (!lines.at(-1).trim() || /^(-{3,}|\*{3,}|_{3,})$/.test(lines.at(-1).trim()) || SIGN_OFF.test(lines.at(-1).trim()))) lines.pop();
  return lines.join('\n').trim();
}

const STOP = new Set(['and', 'the', 'for', 'with', 'of', 'or', 'a', 'an', 'to', 'in']);
// Significant words of a heading, so "Title & Logline" still counts as "Title and Logline".
const headingWords = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ').filter((w) => w.length > 1 && !STOP.has(w));
const isHeadingLine = (line) => /^\s*(#{1,6}\s|\*\*[^*]+\*\*\s*:?\s*$|\*\*[^*]+:\*\*)/.test(line);

// 2. Check an answer against a tool's plan (built by the tool in src/data/aiTools.js):
//    { sections: [...], count: {n, match: RegExp, label}, maxWords, input }
//    Returns a list of plain problems; empty list = good answer.
export function checkAnswer(text, plan) {
  const problems = [];
  if (!text.trim()) return ['The answer was empty.'];
  const lines = text.split('\n');

  if (plan.sections?.length && looksEnglish(text)) {
    const headings = lines.filter(isHeadingLine).map((h) => new Set(headingWords(h)));
    const missing = plan.sections.filter((s) => !headings.some((h) => headingWords(s).every((w) => h.has(w))));
    if (missing.length) problems.push(`These heading lines are missing: ${missing.map((s) => `"## ${s}"`).join(', ')}. Write each one exactly like that, word for word, as its own line (they are fixed labels, not titles), with the content below it.`);
  }

  if (plan.count) {
    const found = lines.filter((l) => plan.count.match.test(l)).length;
    if (found !== plan.count.n) problems.push(`You wrote ${found} ${plan.count.label}, but exactly ${plan.count.n} were asked for.`);
  }

  if (plan.maxWords) {
    const words = wordCount(text);
    if (words > plan.maxWords * 1.5) problems.push(`${TOO_LONG} ${words} words, but the limit is ${plan.maxWords}.`);
  }

  const source = (plan.input || '').toLowerCase();
  const lower = text.toLowerCase();
  const slop = BANNED.filter((p) => lower.includes(p) && !source.includes(p));
  if (slop.length >= 2) problems.push(`Remove these overused phrases and say something specific instead: "${slop.join('", "')}".`);

  return problems;
}

const TOO_LONG = 'Far too long:';
const score = (problems) => problems.length;

// Length is the only problem: a separate, simple "shorten this" job works far better on small models
// than asking them to redo their own answer (they rewrite it at the same length).
async function shorten(chat, text, maxWords, signal) {
  const messages = [
    { role: 'system', content: 'You shorten texts. Keep the same layout, every heading, every list item, all names and the best details. Cut repetition, weaker sentences and extra description. Output only the shortened text, with nothing before or after it.' },
    // Text first, instruction last; a paragraph count helps models that cannot count words.
    { role: 'user', content: `<text>\n${text}\n</text>\n\nThe text above is too long (${wordCount(text)} words). Rewrite it in about ${Math.round(maxWords * 0.85)} words (roughly ${Math.max(1, Math.round(maxWords / 70))} short paragraphs or parts). Keep every heading and list item, the names, the main events and the ending; make each part shorter.` },
  ];
  return cleanAnswer(await chat(messages, { temperature: 0.2, signal }));
}

// 3–5. Run a tool: ask, clean, check, fix once, keep the better answer.
// chat(messages, {temperature, maxTokens, signal}) → text
export async function runTool(chat, prompt, { signal } = {}) {
  const { system, user, plan, temperature } = prompt;
  const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];

  let first = cleanAnswer(await chat(messages, { temperature, signal }));
  if (!first) first = cleanAnswer(await chat(messages, { temperature, signal })); // busy provider: one more try
  if (!first) throw new Error('The AI sent back an empty answer twice. Please try again, or pick a different model in Settings.');

  const problems = checkAnswer(first, plan);
  if (!problems.length) return { text: first, fixed: false, problems: [], firstProblems: [] };

  const fixMsg = [
    'Your answer broke these rules:',
    ...problems.map((p) => `- ${p}`),
    '',
    'Write the whole answer again with these fixed. Keep everything else that was good.',
    'Follow the output format exactly. Output only the corrected answer, with nothing before or after it.',
  ].join('\n');
  let second = '';
  try {
    second = problems.every((p) => p.startsWith(TOO_LONG))
      ? await shorten(chat, first, plan.maxWords, signal)
      : cleanAnswer(await chat([...messages, { role: 'assistant', content: first }, { role: 'user', content: fixMsg }], { temperature: Math.min(temperature, 0.5), signal }));
  } catch (err) {
    if (signal?.aborted) throw err;
  }
  if (!second) return { text: first, fixed: false, problems, firstProblems: problems };
  const after = checkAnswer(second, plan);
  return score(after) <= score(problems)
    ? { text: second, fixed: true, problems: after, firstProblems: problems }
    : { text: first, fixed: false, problems, firstProblems: problems };
}

// "Make it better": a review-and-rewrite pass the visitor asks for.
export async function improveAnswer(chat, prompt, current, { signal } = {}) {
  const { system, user, plan, temperature } = prompt;
  const ask = [
    'Make this answer clearly better. First, silently find its weakest parts:',
    '- anything generic that could fit any request instead of this one',
    '- vague words where a concrete name, number, place or example should be',
    '- clichés, repeated ideas, or details from my request that were ignored',
    '- anything that breaks the format or the rules',
    'Then write the whole answer again with those parts fixed. Same format, same length limit.',
    'Output only the improved answer, with nothing before or after it.',
  ].join('\n');
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
    { role: 'assistant', content: current },
    { role: 'user', content: ask },
  ];
  const text = cleanAnswer(await chat(messages, { temperature, signal }));
  if (!text) throw new Error('The AI sent back an empty answer. Please try again.');
  const problems = checkAnswer(text, plan);
  // Never swap a good answer for one that breaks the format.
  if (problems.length > checkAnswer(current, plan).length) return { text: current, fixed: false, problems, kept: true };
  return { text, fixed: false, problems };
}
