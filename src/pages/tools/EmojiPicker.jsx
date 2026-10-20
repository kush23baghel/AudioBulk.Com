import { useState, useMemo, useRef, useId } from 'react';
import ToolFrame from '../../ui/ToolFrame';
import { Button, Card } from '../../ui/controls';

const FAQS = [
  { q: 'How do I use an emoji?', a: 'Click it. It is copied, and you can paste it anywhere with Ctrl+V (or Cmd+V on a Mac).' },
  { q: 'Why does an emoji look different on my friend\'s phone?', a: 'Every phone and computer draws emojis in its own style. The meaning stays the same, only the picture changes a little.' },
  { q: 'Can I search in plain words?', a: 'Yes. Try "happy", "heart", "food" or "birthday". It looks at each emoji\'s name and a few related words.' },
  { q: 'Where are my recent emojis kept?', a: 'Only in your own browser, on your device. Clearing your browser data removes them.' },
];

// Each entry: emoji | name | extra search words
const RAW = {
  Smileys: [
    '😀|grinning face|happy smile', '😃|big smile|happy joy', '😄|smiling eyes|happy laugh', '😁|beaming|grin happy', '😆|laughing|haha lol', '😅|sweat smile|relief nervous', '😂|tears of joy|lol funny laugh', '🤣|rolling on the floor|lol funny', '🙂|slight smile|fine ok', '😉|wink|flirt', '😊|blushing smile|happy shy', '😇|angel|innocent halo', '🥰|love face|hearts adore', '😍|heart eyes|love crush', '🤩|star struck|wow amazing', '😘|blowing kiss|love', '😋|yum|tasty delicious', '😜|silly wink|crazy tongue', '🤪|zany|crazy wild', '🤔|thinking|hmm question', '🤨|raised eyebrow|doubt suspicious', '😐|neutral|meh blank', '😶|no mouth|silent speechless', '🙄|rolling eyes|annoyed whatever', '😏|smirk|sly', '😴|sleeping|tired zzz', '😪|sleepy|tired', '🤤|drooling|want hungry', '😎|cool sunglasses|awesome', '🤓|nerd|geek smart', '🥳|party face|celebrate birthday', '😭|crying loudly|sad tears', '😢|crying|sad tear', '😞|disappointed|sad', '😡|angry|mad rage', '🤬|swearing|angry cursing', '😱|screaming|shocked scared fear', '😨|fearful|scared worried', '🤯|mind blown|shocked wow', '🥺|pleading|please puppy eyes', '😳|flushed|embarrassed', '🤗|hugging|hug warm', '🤫|shushing|quiet secret', '🤭|hand over mouth|oops giggle', '😷|face mask|sick ill', '🤒|thermometer|sick fever', '🤢|nauseated|sick gross', '🥶|cold face|freezing', '🥵|hot face|sweating', '😈|smiling devil|naughty', '💀|skull|dead dying', '👻|ghost|halloween spooky', '🤡|clown|silly', '💩|poop|funny',
  ],
  People: [
    '👍|thumbs up|yes good like approve', '👎|thumbs down|no bad dislike', '👌|ok hand|perfect fine', '✌️|victory|peace', '🤞|crossed fingers|luck hope', '🤟|love you gesture|rock', '🤘|rock on|metal', '👋|waving hand|hello bye', '🤚|raised back of hand|stop', '✋|raised hand|high five stop', '👏|clapping|applause bravo congrats', '🙌|raising hands|celebrate hooray', '🙏|folded hands|please thanks pray', '🤝|handshake|deal agreement', '💪|flexed bicep|strong muscle', '👀|eyes|look watching', '🧠|brain|smart think', '👶|baby|child', '🧒|child|kid', '👩|woman|lady', '👨|man|guy', '🧓|older person|senior', '👮|police officer|cop', '👷|construction worker|builder', '🧑‍💻|technologist|developer coder computer', '🧑‍🍳|cook|chef', '🧑‍🎓|student|graduate', '🧑‍⚕️|health worker|doctor nurse', '🦸|superhero|hero', '🧙|mage|wizard magic', '🧜|merperson|mermaid', '🚶|person walking|walk', '🏃|person running|run exercise', '💃|woman dancing|dance party', '🕺|man dancing|dance party',
  ],
  Animals: [
    '🐶|dog face|puppy pet', '🐱|cat face|kitten pet', '🐭|mouse face|rodent', '🐹|hamster|pet', '🐰|rabbit face|bunny', '🦊|fox|clever', '🐻|bear|teddy', '🐼|panda|bear', '🐨|koala|australia', '🐯|tiger face|cat', '🦁|lion|king', '🐮|cow face|farm', '🐷|pig face|farm', '🐸|frog|toad', '🐵|monkey face|ape', '🙈|see no evil monkey|shy', '🐔|chicken|hen farm', '🐧|penguin|bird cold', '🐦|bird|tweet', '🦆|duck|quack', '🦉|owl|wise night', '🦄|unicorn|magic', '🐝|honeybee|bee insect', '🦋|butterfly|insect pretty', '🐛|bug|insect caterpillar', '🐌|snail|slow', '🐢|turtle|slow', '🐍|snake|reptile', '🐙|octopus|sea', '🐠|tropical fish|sea', '🐬|dolphin|sea', '🐳|whale|sea', '🦈|shark|sea', '🐘|elephant|big', '🦒|giraffe|tall', '🐎|horse|ride', '🐕|dog|pet', '🐈|cat|pet', '🌸|cherry blossom|flower spring', '🌹|rose|flower love', '🌻|sunflower|flower', '🌲|evergreen tree|forest pine', '🌴|palm tree|beach tropical', '🍀|four leaf clover|luck', '🌵|cactus|desert',
  ],
  Food: [
    '🍎|red apple|fruit', '🍌|banana|fruit', '🍇|grapes|fruit wine', '🍓|strawberry|fruit berry', '🍉|watermelon|fruit summer', '🍊|tangerine|orange fruit', '🍋|lemon|fruit sour', '🍍|pineapple|fruit tropical', '🥭|mango|fruit', '🍑|peach|fruit', '🍒|cherries|fruit', '🥑|avocado|healthy', '🍅|tomato|vegetable', '🥕|carrot|vegetable', '🌽|corn|vegetable', '🥦|broccoli|vegetable healthy', '🍞|bread|toast', '🥐|croissant|bread breakfast', '🧀|cheese|dairy', '🥚|egg|breakfast', '🍳|cooking|fried egg breakfast', '🥞|pancakes|breakfast', '🥓|bacon|breakfast', '🍔|hamburger|burger fast food', '🍟|french fries|fast food chips', '🍕|pizza|fast food slice', '🌭|hot dog|fast food', '🌮|taco|mexican', '🌯|burrito|mexican wrap', '🍝|spaghetti|pasta italian', '🍜|steaming bowl|noodles ramen', '🍣|sushi|japanese fish', '🍱|bento box|japanese lunch', '🍦|soft ice cream|dessert', '🍩|doughnut|dessert sweet', '🍪|cookie|dessert sweet biscuit', '🎂|birthday cake|party dessert', '🍰|shortcake|dessert cake', '🍫|chocolate bar|sweet', '🍬|candy|sweet', '🍿|popcorn|movie snack', '☕|hot beverage|coffee tea', '🍵|teacup|tea green', '🍺|beer mug|drink pub', '🍷|wine glass|drink', '🥂|clinking glasses|cheers celebrate toast', '🍹|tropical drink|cocktail', '🥤|cup with straw|soda drink', '🧃|juice box|drink',
  ],
  Activities: [
    '⚽|soccer ball|football sport', '🏀|basketball|sport', '🏈|american football|sport', '⚾|baseball|sport', '🎾|tennis|sport', '🏐|volleyball|sport', '🏓|ping pong|table tennis', '🏸|badminton|sport', '🥊|boxing glove|fight', '🏆|trophy|win champion award', '🥇|gold medal|first win', '🎯|bullseye|target goal', '🎮|video game|controller gaming', '🎲|dice|game luck', '♟️|chess pawn|game', '🧩|puzzle piece|game', '🎨|artist palette|paint art', '🎬|clapper board|movie film', '🎤|microphone|sing karaoke', '🎧|headphone|music listen', '🎵|musical note|music song', '🎸|guitar|music', '🎹|piano|music keyboard', '🥁|drum|music', '🎉|party popper|celebrate congratulations', '🎊|confetti ball|celebrate party', '🎁|wrapped gift|present birthday', '🎈|balloon|party birthday', '🎄|christmas tree|holiday', '🎃|jack o lantern|halloween pumpkin',
  ],
  Travel: [
    '🚗|car|automobile drive', '🚕|taxi|cab', '🚌|bus|transport', '🚓|police car|cop', '🚑|ambulance|emergency', '🚒|fire engine|emergency', '🚲|bicycle|bike', '🏍️|motorcycle|bike', '🚂|locomotive|train', '🚆|train|rail', '✈️|airplane|flight travel', '🚀|rocket|launch space startup', '🚁|helicopter|fly', '⛵|sailboat|boat', '🚢|ship|boat cruise', '🏠|house|home', '🏢|office building|work', '🏥|hospital|health', '🏫|school|education', '🏖️|beach|holiday vacation', '⛰️|mountain|hike', '🌋|volcano|eruption', '🗽|statue of liberty|new york', '🗼|tokyo tower|japan', '🏰|castle|fairy tale', '🌍|globe europe africa|world earth', '🌎|globe americas|world earth', '🌏|globe asia|world earth', '🗺️|world map|travel', '🧭|compass|direction', '⛽|fuel pump|petrol gas', '🌅|sunrise|morning', '🌙|crescent moon|night', '⭐|star|favorite', '🌈|rainbow|colorful', '☀️|sun|sunny weather', '☁️|cloud|weather', '🌧️|rain cloud|weather', '⛈️|thunderstorm|weather', '❄️|snowflake|cold winter', '🔥|fire|hot lit', '💧|droplet|water', '🌊|wave|sea ocean',
  ],
  Objects: [
    '📱|mobile phone|smartphone', '💻|laptop|computer', '🖥️|desktop computer|pc', '⌨️|keyboard|typing', '🖱️|computer mouse|click', '📷|camera|photo', '📹|video camera|film', '📺|television|tv', '📻|radio|music', '⏰|alarm clock|time wake', '⌚|watch|time', '💡|light bulb|idea', '🔋|battery|power', '🔌|electric plug|power', '💰|money bag|cash rich', '💵|dollar|cash money', '💳|credit card|payment', '💎|gem stone|diamond', '🔧|wrench|tool fix', '🔨|hammer|tool', '⚙️|gear|settings', '🔒|locked|security private', '🔓|unlocked|open', '🔑|key|password', '📦|package|box delivery', '📌|pushpin|pin', '📎|paperclip|attach', '✂️|scissors|cut', '📝|memo|note write', '📚|books|read study', '📖|open book|read', '📅|calendar|date', '📊|bar chart|graph stats', '📈|chart increasing|growth up', '📉|chart decreasing|down', '✉️|envelope|mail email', '📧|e-mail|mail', '📣|megaphone|announce', '🔔|bell|notification', '🔍|magnifying glass|search find', '🧲|magnet|attract', '🛒|shopping cart|buy', '🎙️|studio microphone|podcast', '🧪|test tube|science lab', '🔬|microscope|science',
  ],
  Symbols: [
    '❤️|red heart|love', '🧡|orange heart|love', '💛|yellow heart|love', '💚|green heart|love', '💙|blue heart|love', '💜|purple heart|love', '🖤|black heart|love', '🤍|white heart|love', '💔|broken heart|sad', '💕|two hearts|love', '💖|sparkling heart|love', '💯|hundred points|perfect score', '✨|sparkles|magic shine new', '💥|collision|boom bang', '💫|dizzy|stars', '💤|zzz|sleep', '💬|speech balloon|chat comment', '💭|thought balloon|think', '✅|check mark button|done yes', '❌|cross mark|no wrong', '⚠️|warning|caution', '🚫|prohibited|forbidden no', '❓|question mark|help', '❗|exclamation mark|important', '➕|plus|add', '➖|minus|subtract', '✔️|check mark|done', '➡️|right arrow|next', '⬅️|left arrow|back', '⬆️|up arrow|up', '⬇️|down arrow|down', '🔄|counterclockwise arrows|refresh reload', '♻️|recycling|green eco', '🔴|red circle|dot', '🟢|green circle|dot', '🔵|blue circle|dot', '⭕|hollow red circle|ring', '🏁|chequered flag|finish race', '🚩|triangular flag|warning', '🏳️‍🌈|rainbow flag|pride', '©️|copyright|legal', '™️|trade mark|brand',
  ],
};

const CATEGORIES = Object.keys(RAW);
const ALL = CATEGORIES.flatMap((cat) => RAW[cat].map((row) => {
  const [e, name, words = ''] = row.split('|');
  return { e, name, words, cat };
}));

const KEY = 'ab-emoji-recent';
function loadRecent() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 24) : [];
  } catch { return []; }
}
function saveRecent(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage may be blocked */ }
}

export default function EmojiPicker() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [recent, setRecent] = useState(loadRecent);
  const [message, setMessage] = useState('');
  const timer = useRef(null);
  const searchId = useId();

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL.filter((x) => (cat === 'All' || x.cat === cat) && (!q || `${x.name} ${x.words} ${x.cat}`.toLowerCase().includes(q)));
  }, [query, cat]);

  const flash = (text) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(''), 2200);
  };

  const pick = async (x) => {
    const next = [x.e, ...recent.filter((r) => r !== x.e)].slice(0, 24);
    setRecent(next);
    saveRecent(next);
    try {
      await navigator.clipboard.writeText(x.e);
      flash(`Copied ${x.e}  (${x.name})`);
    } catch {
      flash(`Your browser blocked copying. Select ${x.e} and press Ctrl+C instead.`);
    }
  };

  const nameOf = (e) => ALL.find((x) => x.e === e)?.name || e;
  const cell = 'flex size-12 items-center justify-center rounded-lg text-2xl transition-colors hover:bg-sand focus-visible:outline focus-visible:outline-3 focus-visible:outline-wine';

  return (
    <ToolFrame
      path="/tools/emoji-picker"
      name="Emoji Picker"
      title="Find an emoji and copy it"
      intro="Search by name, or browse a group. Click any emoji to copy it, then paste it where you need it."
      faqs={FAQS}
    >
      <div className="space-y-6">
        <Card className="space-y-4">
          <label htmlFor={searchId} className="text-lg font-bold">Search</label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try happy, heart, pizza or birthday"
            className="block w-full rounded-lg border border-line-strong bg-cream px-3 py-2 text-[15px] text-ink focus:outline focus:outline-3 focus:outline-wine"
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Groups">
            {['All', ...CATEGORIES].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${cat === c ? 'border-wine bg-wine text-paper' : 'border-line bg-cream text-ink hover:bg-sand'}`}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="min-h-6 text-sm font-semibold text-ok" role="status">{message}</p>
        </Card>

        {recent.length > 0 && !query && (
          <Card className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Recently used</h2>
              <Button variant="quiet" onClick={() => { setRecent([]); saveRecent([]); }}>Clear</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {recent.map((e) => (
                <button key={e} type="button" className={cell} title={nameOf(e)} aria-label={`Copy ${nameOf(e)}`} onClick={() => pick({ e, name: nameOf(e) })}>{e}</button>
              ))}
            </div>
          </Card>
        )}

        <Card className="space-y-3">
          <h2 className="text-lg font-bold">{shown.length} emoji</h2>
          {shown.length === 0 ? (
            <p className="text-sm text-muted">No emoji match that. Try a simpler word, like "smile" or "heart".</p>
          ) : (
            <div className="flex max-h-[28rem] flex-wrap gap-1 overflow-y-auto">
              {shown.map((x) => (
                <button key={x.e + x.name} type="button" className={cell} title={x.name} aria-label={`Copy ${x.name}`} onClick={() => pick(x)}>{x.e}</button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </ToolFrame>
  );
}
