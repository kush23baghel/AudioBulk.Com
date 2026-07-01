import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateAIResponse } from '../../lib/openrouter';

export default function AiCharacter() {
  const abortRef = useRef(null);
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsGenerating(true);
    setResult('');
    setError('');
    
    abortRef.current = new AbortController();
    try {
      const response = await generateAIResponse(
        input, "You are an expert AI Character Generator. Output highly creative, professional results. Do not include conversational filler like 'Here is your...'. Just output the final result."
      , abortRef.current.signal);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Breadcrumbs */}
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-violet-400 transition-colors">Home</Link></li>
          <li><Link to="/all-tools?cat=ai-generators" className="hover:text-violet-400 transition-colors">AI Generators</Link></li>
          <li className="text-violet-400 font-medium">AI Character Generator</li>
        </ul>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 shadow-lg shadow-violet-500/20">
          <i className="fa-solid fa-user-ninja text-xl"></i>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-sora">AI Character Generator</h1>
          <p className="text-slate-400 text-sm">Powered by OpenRouter AI model.</p>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Input */}
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Your Prompt / Idea</label>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="E.g., Provide details for ai character generator..."
                rows={8}
                className="w-full rounded-2xl bg-slate-950/40 border border-white/5 px-4 py-3.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all resize-none font-sans"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !input.trim()}
              className="w-full btn bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 border-0 text-white font-semibold rounded-2xl shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isGenerating ? (
                <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Generating...</>
              ) : (
                <><i className="fa-solid fa-wand-magic-sparkles mr-2"></i> Generate</>
              )}
            </button>
          </div>

          {/* Right Column: Output */}
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Generated Result</label>
            <div className="w-full h-[250px] rounded-2xl bg-slate-950/60 border border-white/5 p-5 text-sm text-slate-300 overflow-y-auto overscroll-contain whitespace-pre-wrap leading-relaxed relative font-sans">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full text-violet-400/50">
                  <div className="flex flex-col items-center gap-3">
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl"></i>
                    <span className="text-xs text-slate-400 animate-pulse font-manrope">AI is crafting your response...</span>
                  </div>
                </div>
              ) : error ? (
                <span className="text-rose-400 font-medium">{error}</span>
              ) : result ? (
                result
              ) : (
                <span className="text-slate-400 italic font-manrope">Your generated content will appear here...</span>
              )}
            </div>
            
            {result && !isGenerating && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn btn-sm bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-violet-500/30 text-slate-300 hover:text-white rounded-xl py-2 h-auto mt-2 transition-all flex items-center justify-center gap-2"
              >
                {copied ? (
                  <><i className="fa-solid fa-check text-emerald-400"></i> Copied to Clipboard!</>
                ) : (
                  <><i className="fa-regular fa-copy text-violet-400"></i> Copy to Clipboard</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
