import { useState, useRef, useId } from 'react';
import { Copy, Eraser } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card } from '../../ui/controls';

const FAQS = [
  {
    q: 'How do I use these?',
    a: 'Click an emoji. It is copied, and also added to the box at the bottom where you can build a line of text. Then paste it into your Facebook post or ad.',
  },
  {
    q: 'Do emojis really help ads?',
    a: 'Sometimes. One or two can make a line easier to spot and scan. Too many look messy and can feel spammy. Test with and without.',
  },
  {
    q: 'Will they look the same for everyone?',
    a: 'No. Each phone and computer draws emojis in its own style. The meaning stays the same, but the look changes a little.',
  },
  {
    q: 'Why is nothing copied?',
    a: 'Some browsers block copying. If that happens, the emoji still goes into the box below, so you can select it there and copy by hand.',
  },
];

const GROUPS = [
  { name: 'Urgency', emojis: ['⏰', '⌛', '🔥', '⚡', '🚨', '❗', '‼️', '⏳', '📢', '🏃'] },
  { name: 'Money and deals', emojis: ['💰', '💵', '💸', '🏷️', '🎁', '🛍️', '🛒', '💲', '🤑', '🆓', '💯', '🎉'] },
  { name: 'Social proof', emojis: ['⭐', '🌟', '👍', '❤️', '🏆', '🥇', '👏', '🙌', '💬', '✅', '✔️', '🗣️'] },
  { name: 'Arrows and pointers', emojis: ['👉', '👇', '👆', '👈', '➡️', '⬇️', '⬆️', '↪️', '▶️', '🔽', '🔗', '📍'] },
  { name: 'Happy and friendly', emojis: ['😀', '😊', '😍', '🥰', '😎', '🤩', '😉', '🙂', '🤗', '👋', '🙏', '💪'] },
  { name: 'Business and tips', emojis: ['📦', '🚚', '📅', '🔔', '📣', '💡', '📈', '🎯', '🔒', '📲', '✨', '🆕'] },
];

export default function FbEmojisHub() {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const boxRef = useRef(null);
  const boxId = useId();
  const timer = useRef(null);

  const flash = (message) => {
    setNote(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(''), 2500);
  };

  const copyText = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value);
      flash(message);
    } catch {
      flash('Copying is blocked here. Select the text in the box and copy it by hand.');
    }
  };

  const pick = (emoji) => {
    const box = boxRef.current;
    const start = box ? box.selectionStart ?? text.length : text.length;
    const end = box ? box.selectionEnd ?? text.length : text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    copyText(emoji, `Copied ${emoji}`);
    requestAnimationFrame(() => {
      if (box) { box.focus(); box.setSelectionRange(start + emoji.length, start + emoji.length); }
    });
  };

  return (
    <ToolFrame
      path="/tools/fb-emojis-hub"
      name="Facebook Emoji Picker"
      title="Copy emojis that work well in Facebook posts and ads"
      intro="Click any emoji to copy it. It is also added to the box at the bottom, so you can build a line of text and copy the whole thing."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <Card className="space-y-5">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Pick emojis</h2>
          {GROUPS.map((g) => (
            <div key={g.name} className="space-y-2">
              <h3 className="text-sm font-semibold text-ink">{g.name}</h3>
              <div className="flex flex-wrap gap-2">
                {g.emojis.map((e) => (
                  <button
                    key={e}
                    type="button"
                    aria-label={`Copy ${e}`}
                    onClick={() => pick(e)}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-paper text-2xl hover:bg-sand focus-visible:outline focus-visible:outline-3 focus-visible:outline-wine"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Build your line</h2>
          <label htmlFor={boxId} className="sr-only">Your line of text</label>
          <textarea
            id={boxId}
            ref={boxRef}
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type here, then click emojis to add them. Example: 🔥 Flash sale ends tonight 👉"
            className="block w-full rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine"
          />
          <div className="flex flex-wrap gap-3">
            <Button disabled={!text} onClick={() => copyText(text, 'Copied your line')}><Copy size={18} aria-hidden="true" />Copy line</Button>
            <Button variant="secondary" disabled={!text} onClick={() => setText('')}><Eraser size={18} aria-hidden="true" />Clear</Button>
          </div>
          <p className="min-h-5 text-sm font-semibold text-ok" role="status">{note}</p>
          <p className="text-sm text-muted">Tip: one to three emojis in a line is plenty.</p>
        </Card>
      </div>
    </ToolFrame>
  );
}
