import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function FbEmojisHub() {
  const [toast, setToast] = useState(null);

  const emojiCategories = {
    'Arrows & Pointers': ['👉', '👇', '👈', '👆', '➡️', '⬇️', '▶️', '⏩', '↪️', '🎯', '📍', '📌'],
    'Checkmarks & Approval': ['✅', '✔️', '☑️', '💯', '👍', '👏', '🙌', '🏆', '⭐', '🌟', '✨'],
    'Urgency & Attention': ['🔥', '🚨', '⚡', '⏰', '⏳', '📢', '🚀', '💥', '⚠️', '❗', '🛑', '🏃‍♂️'],
    'Faces & Expressions': ['😍', '😲', '😎', '🤔', '🤯', '🤫', '🤩', '🤑', '🥳', '😉', '🥰', '😅'],
    'Commerce & Sales': ['🛒', '🛍️', '💸', '💰', '💳', '💎', '🎁', '📦', '🚚', '🏷️', '📈', '📊']
  };

  const handleCopy = (emoji) => {
    navigator.clipboard.writeText(emoji);
    setToast(`Copied ${emoji} to clipboard!`);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success bg-emerald-500 text-white border-none shadow-lg">
            <span>{toast}</span>
          </div>
        </div>
      )}

      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Tools</Link></li>
          <li className="text-sky-600 font-medium">FB Emojis Hub</li>
        </ul>
      </div>

      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-face-smile-wink text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">FB Emojis Hub</h1>
          <p className="text-slate-400 text-sm">One-click copy the most effective emojis for Facebook & Instagram ads.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(emojiCategories).map(([category, emojis]) => (
          <div key={category} className="glass-card p-6 rounded-2xl border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">{category}</h2>
            <div className="grid grid-cols-6 gap-3">
              {emojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleCopy(emoji)}
                  className="h-12 text-2xl flex items-center justify-center bg-white/5 hover:bg-sky-500/20 hover:scale-110 border border-white/10 rounded-xl transition-all duration-200"
                  title="Click to copy"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="glass-card p-6 rounded-2xl border border-white/10 bg-sky-500/5">
        <h3 className="text-lg font-semibold text-white mb-2"><i className="fa-solid fa-lightbulb text-sky-600 mr-2"></i>Best Practices</h3>
        <ul className="list-disc list-inside text-slate-300 space-y-2 text-sm">
          <li>Use <strong>Arrows</strong> to direct attention to your CTA link.</li>
          <li>Use <strong>Checkmarks</strong> for bulleted lists of benefits.</li>
          <li>Use <strong>Urgency</strong> emojis for limited-time offers or flash sales.</li>
          <li>Don't overuse emojis. 2-3 per ad text is usually optimal.</li>
        </ul>
      </div>
    </div>
  );
}
