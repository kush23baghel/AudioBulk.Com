import { useState, useId } from 'react';
import { Copy } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card, ChoiceChips } from '../../ui/controls';

const FAQS = [
  {
    q: 'Does this tool talk to ChatGPT?',
    a: 'No. It only writes the prompt for you. Copy it and paste it into ChatGPT, or any other AI chat tool, yourself.',
  },
  {
    q: 'Why do the prompts ask for so much detail?',
    a: 'An AI writes much better ads when it knows who the ad is for, what it sells and how it should sound. A vague request gets a vague ad.',
  },
  {
    q: 'Can I trust the ads it writes?',
    a: 'Treat them as first drafts. Check every claim is true, and check the result follows the ad rules of the platform you use. Never publish promises you cannot keep.',
  },
  {
    q: 'What are the [brackets] in a prompt?',
    a: 'If you leave a box empty, the prompt shows its name in brackets, like [product]. Fill it in before you paste, or tell the AI the answer in your own words.',
  },
];

const PROMPTS = [
  { id: 'launch', goal: 'Product launch', title: 'Launch announcement ads', text: 'Write 5 Facebook ad variations announcing the launch of {product} to {audience}. Tone: {tone}. For each one give a headline under 40 characters, main text under 125 characters, and a call to action button suggestion. Put the main benefit in the first line.' },
  { id: 'launch2', goal: 'Product launch', title: 'Teaser before launch', text: 'Write 3 short teaser posts building curiosity for an upcoming launch of {product}. The audience is {audience}. Tone: {tone}. Do not reveal everything. End each with a reason to follow or sign up.' },
  { id: 'sale', goal: 'Sale or discount', title: 'Limited-time sale', text: 'Write 5 ad texts for a limited-time sale on {product}. Audience: {audience}. Tone: {tone}. Create honest urgency without sounding pushy. Keep each under 125 characters and add one headline under 40 characters per ad.' },
  { id: 'sale2', goal: 'Sale or discount', title: 'Last chance reminder', text: 'Write 4 "last chance" ad variations for {product}, aimed at {audience}. Tone: {tone}. Mention that time is running out, state one clear benefit, and finish with a simple instruction to act now.' },
  { id: 'retarget', goal: 'Retargeting', title: 'Visited but did not buy', text: 'Write 5 retargeting ads for people who looked at {product} but did not buy. They are part of this audience: {audience}. Tone: {tone}. Answer one common worry in each ad (price, trust, fit or timing) and give a gentle reason to come back.' },
  { id: 'cart', goal: 'Retargeting', title: 'Abandoned cart', text: 'Write 3 friendly ads reminding {audience} that they left {product} in their cart. Tone: {tone}. Keep them short, helpful and never guilt-tripping. Include a simple call to action.' },
  { id: 'proof', goal: 'Trust and proof', title: 'Customer review ad', text: 'Turn this idea into 4 ads built around customer reviews of {product}: customers love it and say it works. Audience: {audience}. Tone: {tone}. Use placeholder quotes in [brackets] that I will replace with real reviews. Do not invent statistics.' },
  { id: 'story', goal: 'Trust and proof', title: 'Brand story ad', text: 'Write 3 short ads that tell the story of why {product} exists, for {audience}. Tone: {tone}. Start with a problem the reader recognises and end with how the product helps. Keep each under 600 characters.' },
  { id: 'problem', goal: 'Find new angles', title: '10 ad angles', text: 'List 10 different marketing angles for {product} aimed at {audience}. Tone: {tone}. For each angle give a one-line hook and say which problem or desire it speaks to. Do not repeat ideas.' },
  { id: 'hooks', goal: 'Find new angles', title: 'Scroll-stopping hooks', text: 'Write 15 opening lines (hooks) for ads about {product}, for {audience}. Tone: {tone}. Mix questions, bold statements and surprising facts. Each under 12 words. Do not make claims that cannot be proven.' },
  { id: 'video', goal: 'Video and Reels', title: '30-second video script', text: 'Write a 30-second video ad script for {product}, speaking to {audience}. Tone: {tone}. Split it into: hook (first 3 seconds), problem, solution, proof, call to action. Show what is on screen and what is said, in two columns.' },
  { id: 'ugc', goal: 'Video and Reels', title: 'Creator-style video brief', text: 'Write a brief for a creator filming a casual, phone-shot video about {product} for {audience}. Tone: {tone}. Include 3 hook options, the key points to mention, things not to say, and a closing line.' },
  { id: 'email', goal: 'Other', title: 'Rewrite my ad shorter', text: 'Here is my ad for {product}: [paste your ad here]. Rewrite it in 3 shorter versions for {audience}. Tone: {tone}. Keep the main benefit and keep each under 125 characters.' },
  { id: 'test', goal: 'Other', title: 'A/B test ideas', text: 'I advertise {product} to {audience}. Suggest 8 simple A/B tests for my ads (headline, picture, offer, button, audience and so on). For each, say what to change, what to measure, and how long to run it. Tone of my brand: {tone}.' },
];

const GOALS = ['All', ...Array.from(new Set(PROMPTS.map((p) => p.goal)))];

function fill(template, values) {
  return template
    .replace(/\{product\}/g, values.product.trim() || '[product]')
    .replace(/\{audience\}/g, values.audience.trim() || '[audience]')
    .replace(/\{tone\}/g, values.tone.trim() || '[tone]');
}

export default function ChatgptAdPrompts() {
  const [values, setValues] = useState({ product: 'organic dog treats', audience: 'busy dog owners aged 25 to 45', tone: 'warm and friendly' });
  const [goal, setGoal] = useState('All');
  const [copiedId, setCopiedId] = useState('');
  const [note, setNote] = useState('');
  const idBase = useId();

  const copy = async (p) => {
    try {
      await navigator.clipboard.writeText(fill(p.text, values));
      setCopiedId(p.id);
      setNote('');
      setTimeout(() => setCopiedId((cur) => (cur === p.id ? '' : cur)), 2500);
    } catch {
      setNote('Copying is blocked in this browser. Select the prompt text and copy it by hand.');
    }
  };

  const shown = PROMPTS.filter((p) => goal === 'All' || p.goal === goal);
  const inputStyle = 'block w-full rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine';
  const fields = [
    { key: 'product', label: 'Product or offer', placeholder: 'e.g. organic dog treats' },
    { key: 'audience', label: 'Who it is for', placeholder: 'e.g. busy dog owners' },
    { key: 'tone', label: 'Tone of voice', placeholder: 'e.g. warm and friendly' },
  ];

  return (
    <ToolFrame
      path="/tools/chatgpt-ad-prompts"
      name="ChatGPT Ad Prompts"
      title="Ready-made prompts that get ChatGPT to write your ads"
      intro="Fill in your product, your audience and the tone you want. Every prompt updates with your words. Copy one and paste it into ChatGPT or any AI chat."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>About your ad</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <label htmlFor={`${idBase}${f.key}`} className="text-sm font-semibold text-ink">{f.label}</label>
                <input
                  id={`${idBase}${f.key}`}
                  className={inputStyle}
                  placeholder={f.placeholder}
                  value={values[f.key]}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Pick a prompt</h2>
          <ChoiceChips
            label="What do you want the ad to do?"
            options={GOALS.map((g) => ({ value: g, label: g }))}
            value={goal}
            onChange={setGoal}
          />
          {note && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{note}</p>}
          <div className="space-y-4">
            {shown.map((p) => (
              <div key={p.id} className="space-y-3 rounded-lg border border-line bg-paper p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-ink">{p.title}</h3>
                  <span className="rounded-full bg-wine-soft px-3 py-1 text-xs font-semibold text-wine">{p.goal}</span>
                </div>
                <p className="whitespace-pre-line break-words text-sm text-ink">{fill(p.text, values)}</p>
                <Button variant="secondary" onClick={() => copy(p)}>
                  <Copy size={18} aria-hidden="true" />
                  {copiedId === p.id ? 'Copied' : 'Copy prompt'}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ToolFrame>
  );
}
