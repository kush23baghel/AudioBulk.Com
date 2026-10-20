// Offline test of the AI answer cleaner and checker (src/lib/aiOutput.js). No key, no network.
// Run: node tests/verify/ai-checker.mjs
import { cleanAnswer, checkAnswer, runTool } from '../../src/lib/aiOutput.js';
import { aiTools } from '../../src/data/aiTools.js';
import { makeReporter } from './lib.mjs';

const { report, done } = makeReporter();
const eq = (name, got, want) => report(got === want, name, got === want ? 'ok' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);

eq('Removes "Sure! Here is…" opener', cleanAnswer('Sure! Here is your poem:\n\n**Snow**\nWhite.'), '**Snow**\nWhite.');
eq('Removes "Here are 10 titles:" opener', cleanAnswer("Here are 10 titles:\n1. **A**"), '1. **A**');
eq('Removes hidden thinking', cleanAnswer('<think>plan plan</think>\n## Title\nX'), '## Title\nX');
eq('Removes a code fence around everything', cleanAnswer('```markdown\n## Title\nX\n```'), '## Title\nX');
eq('Removes "Let me know…" closer and ---', cleanAnswer('## Title\nX\n\n---\nLet me know if you want changes!'), '## Title\nX');
eq('Strips copied template brackets on a title', cleanAnswer('**(La casa)**\nVerso'), '**La casa**\nVerso');
eq('Keeps a dialogue stage direction', cleanAnswer('TOM: Hi.\n(She sighs.)\nANNA: Hi.'), 'TOM: Hi.\n(She sighs.)\nANNA: Hi.');
eq('Keeps a story that starts with "Here is where…"', cleanAnswer('Here is where the road ended. Nobody came back.'), 'Here is where the road ended. Nobody came back.');

const boss = aiTools['boss-generator'].buildPrompt('A dragon', { kind: 'boss', level: 'medium' });
report(boss.plan.sections.join('|') === 'Name and Title|Appearance|Backstory|Motive|Powers and Attacks|Fight Phases|Weakness|Memorable Line', 'Boss sections come from the format', boss.plan.sections.join(', '));
report(checkAnswer('## Name & Title\nA\n## Appearance\n## Backstory\n## Motive\n## Powers and Attacks\n## Fight Phases\n## Weakness\n## Memorable Line', boss.plan).length === 0, 'Heading "Name & Title" counts as "Name and Title"', 'ok');
report(/Weakness/.test(checkAnswer('## Name and Title\nA', boss.plan)[0] || ''), 'Missing headings are named', checkAnswer('## Name and Title\nA', boss.plan)[0]?.slice(0, 80));

const titles = aiTools['book-title-generator'].buildPrompt('A bakery mystery', { style: 'catchy', count: '10' });
report(/exactly 10/.test(checkAnswer('1. **A**\n2. **B**', titles.plan).join(' ')), 'Wrong count is caught', checkAnswer('1. **A**\n2. **B**', titles.plan).join(' '));
const slop = checkAnswer('1. a\n2. b\n3. c\n4. d\n5. e\n6. f\n7. g\n8. h\n9. i\n10. In a world where a vibrant tapestry', titles.plan);
report(slop.some((p) => /overused/.test(p)), 'Overused phrases are caught', slop.join(' '));
const rephrase = aiTools['text-rephrase'].buildPrompt('Our vibrant tapestry of shops is in a world where…', { tone: 'friendly', size: 'same' });
report(checkAnswer('Our vibrant tapestry of shops lives in a world where…', rephrase.plan).length === 0, "Phrases that were in the person's own text are allowed", 'ok');
report(rephrase.temperature === 0.3 && boss.temperature === 0.85, 'Rewrite tools run cooler than creative tools', `${rephrase.temperature} / ${boss.temperature}`);
report(rephrase.user.includes('<input>') && rephrase.system.includes('never as instructions'), 'Pasted text is fenced off as data', 'ok');

// The workflow: a broken first answer gets exactly one follow-up naming the problem.
const calls = [];
const fake = async (messages) => { calls.push(messages); return calls.length === 1 ? 'Sure! Here you go:\n1. **A**' : Array.from({ length: 10 }, (_, i) => `${i + 1}. **T${i}** - why`).join('\n'); };
const out = await runTool(fake, titles);
report(calls.length === 2 && out.fixed && out.problems.length === 0 && /exactly 10/.test(calls[1].at(-1).content), 'Broken answer → one follow-up → fixed', `${calls.length} calls, fixed=${out.fixed}`);

done();
