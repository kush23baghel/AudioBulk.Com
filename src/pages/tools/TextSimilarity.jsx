import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TextSimilarity() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [debouncedText1, setDebouncedText1] = useState('');
  const [debouncedText2, setDebouncedText2] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      setDebouncedText1(text1);
      setDebouncedText2(text2);
      setIsCalculating(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [text1, text2]);

  const similarity = useMemo(() => {
    if (!debouncedText1.trim() && !debouncedText2.trim()) return 0;
    
    const getWords = (text) => {
      return new Set(text.toLowerCase().match(/\w+/g) || []);
    };

    const words1 = getWords(debouncedText1);
    const words2 = getWords(debouncedText2);

    if (words1.size === 0 && words2.size === 0) return 0;

    let intersection = 0;
    for (let word of words1) {
      if (words2.has(word)) {
        intersection++;
      }
    }

    const union = words1.size + words2.size - intersection;
    if (union === 0) return 0;

    return Math.round((intersection / union) * 100);
  }, [debouncedText1, debouncedText2]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Tools</Link></li>
          <li className="text-sky-600 font-medium">Text Similarity</li>
        </ul>
      </div>
      
      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-scale-balanced text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-outfit">Text Similarity Checker</h1>
          <p className="text-slate-400 text-sm">Compare two texts and find their Jaccard similarity percentage.</p>
        </div>
      </div>
      
      <div className="glass-card p-8 rounded-2xl border border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        <div className="space-y-4">
          <label className="text-slate-300 font-medium block">Text 1</label>
          <textarea
            className="textarea w-full h-80 bg-[#0b1426]/80 backdrop-blur-md shadow-inner border-white/10 text-white leading-relaxed"
            placeholder="Paste first text here..."
            value={text1}
            onChange={(e) => setText1(e.target.value)}
          ></textarea>
        </div>
        
        <div className="space-y-4">
          <label className="text-slate-300 font-medium block">Text 2</label>
          <textarea
            className="textarea w-full h-80 bg-[#0b1426]/80 backdrop-blur-md shadow-inner border-white/10 text-white leading-relaxed"
            placeholder="Paste second text here..."
            value={text2}
            onChange={(e) => setText2(e.target.value)}
          ></textarea>
        </div>

        <div className="col-span-1 lg:col-span-2 flex flex-col items-center justify-center pt-6 relative">
          {isCalculating && (
            <div className="absolute inset-0 z-10 bg-[#0b1426]/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
              <span className="loading loading-spinner loading-md text-sky-500 mb-2"></span>
              <span className="text-sm text-sky-400">Calculating...</span>
            </div>
          )}
          <div className="text-slate-400 mb-2">Jaccard Similarity</div>
          <div className="flex items-end gap-2">
            <span className="text-6xl font-bold text-sky-600 font-outfit">{similarity}</span>
            <span className="text-3xl text-sky-500/50 pb-1">%</span>
          </div>
          <div className="w-full max-w-md bg-slate-100 rounded-full h-4 mt-6 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-sky-500 to-emerald-400 h-4 rounded-full transition-all duration-500" 
              style={{ width: `${similarity}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
