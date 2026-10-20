import { useState, useRef, useEffect, useId } from 'react';
import { ImagePlus, Globe, ThumbsUp, MessageCircle, Share2, Heart, Send, Bookmark, X } from 'lucide-react';
import ToolFrame from '../../ui/ToolFrame';
import { Card, ChoiceChips } from '../../ui/controls';

const FAQS = [
  {
    q: 'Are these previews exact?',
    a: 'They are close, not perfect. Facebook and Instagram change their layouts now and then, and they look a little different on each phone. Use this to check your words and your picture, then look at the official preview in Meta Ads Manager before you spend money.',
  },
  {
    q: 'Why does my text get cut off with "See more"?',
    a: 'Both apps only show the first part of your main text. After about 125 characters the rest is hidden behind "See more". Put your most important words first.',
  },
  {
    q: 'What picture size should I use?',
    a: 'A square picture (1080 by 1080) works well in the feeds. For Stories use a tall picture (1080 by 1920) and keep text away from the top and bottom, where buttons and your profile name cover it.',
  },
  {
    q: 'Is my picture uploaded anywhere?',
    a: 'No. It stays in your browser and is gone when you close the page.',
  },
];

const LIMITS = { primary: 125, headline: 40, description: 30 };

// Returns the text as it would first appear, plus whether it was cut.
function truncatePrimary(text, limit = LIMITS.primary) {
  if (text.length <= limit) return { shown: text, cut: false };
  const slice = text.slice(0, limit);
  const lastSpace = slice.lastIndexOf(' ');
  const shown = (lastSpace > limit * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd();
  return { shown, cut: true };
}

const CTAS = ['Learn More', 'Shop Now', 'Sign Up', 'Book Now', 'Download', 'Contact Us', 'Get Offer', 'Order Now', 'Subscribe', 'Apply Now'];

const inputStyle = 'block w-full rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine';

function Counter({ value, limit }) {
  const over = value.length > limit;
  return (
    <span className={`text-xs ${over ? 'font-semibold text-bad' : 'text-muted'}`}>
      {value.length} / {limit}{over ? ' (over, may be cut)' : ''}
    </span>
  );
}

function Picture({ image, className }) {
  return image ? (
    <img src={image} alt="Your ad" className={`w-full object-cover ${className}`} />
  ) : (
    <div className={`flex w-full items-center justify-center bg-sunken text-sm text-muted ${className}`}>Your picture goes here</div>
  );
}

function FacebookFeed({ page, text, headline, description, cta, image }) {
  const { shown, cut } = truncatePrimary(text);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white text-[#050505]">
      <div className="flex items-center gap-2 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wine-soft font-bold text-wine">{(page[0] || 'P').toUpperCase()}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{page || 'Your Page'}</p>
          <p className="flex items-center gap-1 text-xs text-[#65676b]">Sponsored · <Globe size={11} aria-hidden="true" /></p>
        </div>
      </div>
      <p className="whitespace-pre-line break-words px-3 pb-3 text-[15px]">
        {text ? <>{shown}{cut && <>… <span className="font-semibold text-[#65676b]">See more</span></>}</> : <span className="text-[#65676b]">Your main text shows here.</span>}
      </p>
      <Picture image={image} className="aspect-square" />
      <div className="flex items-center gap-3 bg-[#f0f2f5] p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs uppercase text-[#65676b]">yourwebsite.com</p>
          <p className="truncate text-[15px] font-semibold">{headline || 'Your headline'}</p>
          <p className="truncate text-sm text-[#65676b]">{description || 'Your description'}</p>
        </div>
        <span className="shrink-0 rounded-md bg-[#e4e6eb] px-3 py-2 text-sm font-semibold">{cta}</span>
      </div>
      <div className="flex justify-around border-t border-[#ced0d4] py-2 text-sm font-semibold text-[#65676b]">
        <span className="flex items-center gap-1"><ThumbsUp size={16} aria-hidden="true" /> Like</span>
        <span className="flex items-center gap-1"><MessageCircle size={16} aria-hidden="true" /> Comment</span>
        <span className="flex items-center gap-1"><Share2 size={16} aria-hidden="true" /> Share</span>
      </div>
    </div>
  );
}

function InstagramFeed({ page, text, headline, cta, image }) {
  const { shown, cut } = truncatePrimary(text);
  const handle = (page || 'yourpage').toLowerCase().replace(/\s+/g, '');
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white text-[#262626]">
      <div className="flex items-center gap-2 p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-wine-soft text-sm font-bold text-wine">{(page[0] || 'P').toUpperCase()}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{handle}</p>
          <p className="text-xs text-[#8e8e8e]">Sponsored</p>
        </div>
      </div>
      <Picture image={image} className="aspect-square" />
      <div className="flex items-center justify-between bg-[#0095f6] px-3 py-2 text-sm font-semibold text-white">
        <span className="truncate">{headline || cta}</span>
        <span>{cta} &rsaquo;</span>
      </div>
      <div className="flex items-center justify-between p-3 text-[#262626]">
        <span className="flex gap-3"><Heart size={22} aria-hidden="true" /><MessageCircle size={22} aria-hidden="true" /><Send size={22} aria-hidden="true" /></span>
        <Bookmark size={22} aria-hidden="true" />
      </div>
      <p className="whitespace-pre-line break-words px-3 pb-3 text-sm">
        <span className="font-semibold">{handle}</span>{' '}
        {text ? <>{shown}{cut && <>… <span className="text-[#8e8e8e]">more</span></>}</> : <span className="text-[#8e8e8e]">Your main text shows here.</span>}
      </p>
    </div>
  );
}

function InstagramStory({ page, headline, cta, image }) {
  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[260px] overflow-hidden rounded-2xl bg-ink">
      {image ? <img src={image} alt="Your ad" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center bg-sunken text-sm text-muted">Your picture goes here</div>}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/50 to-transparent p-3 text-white">
        <div className="mb-2 h-0.5 rounded bg-white/70" />
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-wine">{(page[0] || 'P').toUpperCase()}</div>
          <span className="truncate text-xs font-semibold">{page || 'Your Page'}</span>
          <span className="text-xs opacity-80">Sponsored</span>
          <X size={16} className="ml-auto" aria-hidden="true" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-center text-white">
        {headline && <p className="mb-2 line-clamp-2 text-sm font-semibold">{headline}</p>}
        <span className="inline-block rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink">{cta}</span>
        <p className="mt-1 text-[10px] opacity-80">Swipe up</p>
      </div>
    </div>
  );
}

export default function MetaAdPreview() {
  const [page, setPage] = useState('Sunrise Coffee');
  const [text, setText] = useState('Fresh roasted beans delivered to your door every week. Try our best-selling blend today and taste the difference in your very first cup. Free shipping on your first order.');
  const [headline, setHeadline] = useState('Fresh coffee, delivered');
  const [description, setDescription] = useState('Free shipping today');
  const [cta, setCta] = useState('Shop Now');
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState('facebook');
  const imageRef = useRef('');
  const ids = { page: useId(), text: useId(), headline: useId(), description: useId(), cta: useId(), file: useId() };

  useEffect(() => () => { if (imageRef.current) URL.revokeObjectURL(imageRef.current); }, []);

  const pick = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('That is not a picture. Please choose a PNG, JPG or WebP image.'); return; }
    if (imageRef.current) URL.revokeObjectURL(imageRef.current);
    imageRef.current = URL.createObjectURL(file);
    setImage(imageRef.current);
    setError('');
  };

  const warnings = [];
  if (text.length > LIMITS.primary) warnings.push(`Main text is ${text.length} characters. Only about ${LIMITS.primary} show before "See more", so put your key message first.`);
  if (headline.length > LIMITS.headline) warnings.push(`Headline is ${headline.length} characters. About ${LIMITS.headline} is the most that shows on a phone.`);
  if (description.length > LIMITS.description) warnings.push(`Description is ${description.length} characters. About ${LIMITS.description} is the most that shows.`);
  if (!image) warnings.push('Add a picture to see the real layout.');

  const props = { page, text, headline, description, cta, image };

  return (
    <ToolFrame
      path="/tools/meta-ad-preview"
      name="Facebook & Instagram Ad Preview"
      title="See how your ad will look before you post it"
      intro="Type your ad words and add a picture. The previews below update as you type, and warn you when text is too long."
      faqs={FAQS}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">1</span>Your ad</h2>
          <div className="space-y-1">
            <label htmlFor={ids.page} className="text-sm font-semibold text-ink">Page name</label>
            <input id={ids.page} className={inputStyle} value={page} onChange={(e) => setPage(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-2">
              <label htmlFor={ids.text} className="text-sm font-semibold text-ink">Main text</label>
              <Counter value={text} limit={LIMITS.primary} />
            </div>
            <textarea id={ids.text} rows={4} className={inputStyle} value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-2">
              <label htmlFor={ids.headline} className="text-sm font-semibold text-ink">Headline</label>
              <Counter value={headline} limit={LIMITS.headline} />
            </div>
            <input id={ids.headline} className={inputStyle} value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-2">
              <label htmlFor={ids.description} className="text-sm font-semibold text-ink">Description</label>
              <Counter value={description} limit={LIMITS.description} />
            </div>
            <input id={ids.description} className={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.cta} className="text-sm font-semibold text-ink">Button</label>
            <select id={ids.cta} className={inputStyle} value={cta} onChange={(e) => setCta(e.target.value)}>
              {CTAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor={ids.file} className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-line-strong bg-paper px-4 py-3 text-sm font-semibold text-wine hover:bg-sand has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-wine">
              <ImagePlus size={20} aria-hidden="true" />
              {image ? 'Choose a different picture' : 'Add a picture'}
              <input id={ids.file} type="file" accept="image/*" className="sr-only" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          </div>
          {error && <p className="rounded-lg bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">{error}</p>}
          {warnings.length > 0 && (
            <ul className="space-y-2" aria-label="Warnings">
              {warnings.map((w) => <li key={w} className="rounded-lg bg-sand px-4 py-2 text-sm text-ink">{w}</li>)}
            </ul>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold"><span className="mr-2 text-wine">2</span>Preview</h2>
          <ChoiceChips
            label="Where will it show?"
            options={[
              { value: 'facebook', label: 'Facebook Feed' },
              { value: 'instagram', label: 'Instagram Feed' },
              { value: 'story', label: 'Instagram Story' },
            ]}
            value={view}
            onChange={setView}
          />
          <div className="mx-auto w-full max-w-[400px]">
            {view === 'facebook' && <FacebookFeed {...props} />}
            {view === 'instagram' && <InstagramFeed {...props} />}
            {view === 'story' && <InstagramStory {...props} />}
          </div>
          {view === 'story' && <p className="text-sm text-muted">Stories show a tall picture. Keep important words away from the top and bottom. The main text is not shown on Stories, so say it in the picture.</p>}
        </Card>
      </div>
    </ToolFrame>
  );
}
