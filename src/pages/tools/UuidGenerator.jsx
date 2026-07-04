import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function UuidGenerator() {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(5);

  const generateUUID = () => {
    // Generate UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleGenerate = () => {
    const newUuids = [];
    const num = Math.min(Math.max(1, count), 100);
    for (let i = 0; i < num; i++) {
      newUuids.push(generateUUID());
    }
    setUuids(newUuids);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
  };

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden">
      
      {/* BACKGROUND MESH */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        
        {/* BACK LINK */}
        <Link 
          to="/all-tools?cat=utilities" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
            <i className="fa-solid fa-arrow-left text-xs"></i>
          </div>
          Back to Utilities
        </Link>

        {/* HEADER */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 border border-white/10 shadow-glass-inset mb-6">
            <i className="fa-solid fa-fingerprint text-xl text-sky-400"></i>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-sora text-white mb-4 tracking-tight">
            UUID / GUID Generator
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            Generate random, secure Version 4 UUIDs instantly in bulk. All generated locally in your browser.
          </p>
        </div>

        {/* TOOL CONTENT */}
        <div className="space-y-6 max-w-2xl">
          
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 space-y-4">
            <label className="block text-sm font-semibold text-slate-300">How many UUIDs?</label>
            <div className="flex gap-4">
              <input 
                type="number"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
                className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sky-500/50 w-32"
              />
              <button 
                onClick={handleGenerate} 
                className="flex-1 btn-primary-glow inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl"
              >
                <i className="fa-solid fa-bolt mr-2"></i> Generate
              </button>
            </div>
          </div>

          {uuids.length > 0 && (
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 space-y-4 relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-300">Generated UUIDs ({uuids.length})</label>
                <button 
                  onClick={handleCopy} 
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                >
                  <i className="fa-regular fa-copy mr-2"></i> Copy All
                </button>
              </div>
              
              <div className="w-full h-[250px] rounded-xl bg-slate-950/80 border border-white/5 p-4 text-sm text-sky-400/90 font-mono overflow-y-auto overscroll-contain whitespace-pre-wrap leading-relaxed">
                {uuids.join('\n')}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
