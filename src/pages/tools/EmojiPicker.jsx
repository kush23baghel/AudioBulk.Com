import { useState } from 'react';
import { Link } from 'react-router-dom';

const emojiGroups = {
  "Smileys & People": [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", 
    "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", 
    "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", 
    "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", 
    "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", 
    "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "👻", "💀"
  ],
  "Gestures & Body": [
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", 
    "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", 
    "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀"
  ],
  "Nature & Animals": [
    "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", 
    "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦢", "🦉", "🦤", "🦩", 
    " peacock", "🦚", "🦜", "🐊", "🐢", "🦎", "🐍", "🐲", "🐉", "🦕", "🦖", "🐳", "🐋", "🐬", "🐟", "🐠", 
    "🐡", "🦈", "🐙", "🐚", "🐌", "🦋", "🐛", "🐜", "🐝", "🪲", "🐞", "🦗", "🕷️", "🕸️", "🦂", "🦟"
  ],
  "Food & Drink": [
    "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", " melon", "🍈", "🍒", "🍑", "🥭", "🍍", 
    "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🥔", "🍠", "🥐", 
    "🍞", "🥖", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖", "🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪"
  ],
  "Marketing & Actions": [
    "🚀", "🔥", "💥", "⚡", "✨", "🎯", "💯", "📈", "🗣️", "📢", "📣", "🔔", "💰", "💸", "💳", "🛒", 
    "📦", "🎁", "🎨", "🎬", "🎤", "🎧", "🏆", "💎", "🌟", "💡", "📌", "📍", "🔒", "🔑", "✅", "❌", 
    "⚠️", "🛑", "🆕", "🆓", "🔥", "👇", "👉", "👑", "🚨", "📅", "📈", "📉", "📊", "📋", "📁", "💻"
  ]
};

export default function EmojiPicker() {
  const [search, setSearch] = useState('');
  const [copiedEmoji, setCopiedEmoji] = useState('');

  const handleCopy = (emoji) => {
    navigator.clipboard.writeText(emoji);
    setCopiedEmoji(emoji);
    setTimeout(() => setCopiedEmoji(''), 1500);
  };

  const getFilteredEmojis = (emojis) => {
    return emojis.filter(e => e.includes(search)); // Simple filter (normally emojis don't contain words unless matched via an index, but this is a fallback)
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Breadcrumbs */}
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Utilities</Link></li>
          <li className="text-sky-600 font-medium">Emoji Picker</li>
        </ul>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
            <i className="fa-solid fa-icons text-lg"></i>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Emoji Picker & Copy Hub</h1>
            <p className="text-slate-400 text-sm">Click on any emoji to copy it to your clipboard instantly.</p>
          </div>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search emojis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Copy popup */}
        {copiedEmoji && (
          <div className="alert bg-emerald-50 border-emerald-200 text-emerald-600 rounded-xl px-4 py-2 flex items-center gap-2 max-w-xs animate-bounce shadow-md">
            <span className="text-lg">{copiedEmoji}</span>
            <span className="text-xs font-bold font-outfit">Copied to Clipboard!</span>
          </div>
        )}
      </div>

      {/* Emoji grid layout */}
      <div className="grid grid-cols-1 gap-8">
        {Object.entries(emojiGroups).map(([groupName, emojis]) => (
          <div key={groupName} className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2 font-outfit flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
              {groupName}
            </h3>

            <div className="flex flex-wrap gap-2">
              {getFilteredEmojis(emojis).map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCopy(emoji)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-2xl hover:bg-white/10 hover:scale-110 active:scale-95 transition-all"
                  title="Click to Copy"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
