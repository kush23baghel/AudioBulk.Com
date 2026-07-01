import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function WordCounter() {
  const [text, setText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      setDebouncedText(text);
      setIsCalculating(false);
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [text]);

  const charCountWithSpaces = debouncedText.length;
  const charCountWithoutSpaces = debouncedText.replace(/\s/g, '').length;
  
  const wordsArray = debouncedText.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = wordsArray.length;

  const sentences = debouncedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const paragraphs = debouncedText.split(/\n+/).filter(p => p.trim().length > 0).length;

  // Reading time (average 225 WPM)
  const readingTime = Math.ceil(wordCount / 225);
  // Speaking time (average 150 WPM)
  const speakingTime = Math.ceil(wordCount / 150);

  // Character density calculation
  const getDensity = () => {
    const freq = {};
    const cleanText = debouncedText.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const char of cleanText) {
      freq[char] = (freq[char] || 0) + 1;
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const densities = getDensity();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      {/* Breadcrumbs */}
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Utilities</Link></li>
          <li className="text-sky-600 font-medium">Word Counter</li>
        </ul>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-hashtag text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-outfit">Word & Character Counter</h1>
          <p className="text-slate-400 text-sm">Analyze word densities, speaking/reading times, and character lengths in real-time.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Text Input */}
        <div className="lg:col-span-2 space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here to analyze..."
            className="w-full h-80 p-6 rounded-3xl bg-[#0b1426]/80 backdrop-blur-md border border-white/10 text-slate-200 placeholder:text-slate-500 shadow-inner focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all font-sans text-lg leading-relaxed resize-none custom-scrollbar"
          />
          <div className="flex justify-between items-center text-xs text-slate-400 px-2">
            <span className="flex items-center gap-2">
              Runs locally on your browser 
              {isCalculating && <span className="loading loading-spinner loading-xs text-sky-500"></span>}
            </span>
            <button
              onClick={() => setText('')}
              className="text-slate-400 hover:text-white font-medium transition-colors"
            >
              Clear Text
            </button>
          </div>
        </div>

        {/* Right Column: Statistics */}
        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6 border border-white/10 space-y-5 shadow-2xl relative">
            {isCalculating && (
              <div className="absolute inset-0 z-10 bg-[#0b1426]/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                 <span className="loading loading-spinner loading-md text-sky-500"></span>
              </div>
            )}
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-3 font-outfit flex items-center gap-2">
              <i className="fa-solid fa-chart-pie text-sky-500"></i> Metrics Dashboard
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0b1426]/60 rounded-2xl p-4 border border-white/5 text-center shadow-inner">
                <span className="block text-[10px] uppercase font-bold text-slate-500 font-outfit mb-1">Words</span>
                <span className="text-3xl font-bold text-sky-400 font-outfit">{wordCount}</span>
              </div>
              <div className="bg-[#0b1426]/60 rounded-2xl p-4 border border-white/5 text-center shadow-inner">
                <span className="block text-[10px] uppercase font-bold text-slate-500 font-outfit mb-1">Characters</span>
                <span className="text-3xl font-bold text-purple-400 font-outfit">{charCountWithSpaces}</span>
              </div>
              <div className="bg-[#0b1426]/60 rounded-2xl p-4 border border-white/5 text-center shadow-inner">
                <span className="block text-[10px] uppercase font-bold text-slate-500 font-outfit mb-1">No Spaces</span>
                <span className="text-xl font-bold text-slate-300 font-outfit mt-1 block">{charCountWithoutSpaces}</span>
              </div>
              <div className="bg-[#0b1426]/60 rounded-2xl p-4 border border-white/5 text-center shadow-inner">
                <span className="block text-[10px] uppercase font-bold text-slate-500 font-outfit mb-1">Sentences</span>
                <span className="text-xl font-bold text-slate-300 font-outfit mt-1 block">{sentences}</span>
              </div>
            </div>

            {/* Time Estimates */}
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex justify-between text-xs text-slate-400">
                <span><i className="fa-regular fa-eye mr-1.5 text-sky-600"></i> Reading Time</span>
                <span className="font-semibold text-slate-100">{readingTime} min</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span><i className="fa-regular fa-comment mr-1.5 text-purple-600"></i> Speaking Time</span>
                <span className="font-semibold text-slate-100">{speakingTime} min</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span><i className="fa-solid fa-indent mr-1.5 text-pink-600"></i> Paragraphs</span>
                <span className="font-semibold text-slate-100">{paragraphs}</span>
              </div>
            </div>

            {/* Density list */}
            {densities.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-white/10">
                <span className="block text-[10px] uppercase font-bold text-slate-400 font-outfit">
                  Top Character Density
                </span>
                <div className="space-y-1.5">
                  {densities.map(([char, count]) => {
                    const pct = Math.round((count / charCountWithoutSpaces) * 100);
                    return (
                      <div key={char} className="flex items-center justify-between text-xs">
                        <span className="font-mono uppercase text-slate-300">{char}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-sky-400 h-full" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="text-slate-400 text-[10px] font-bold">{count} ({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
