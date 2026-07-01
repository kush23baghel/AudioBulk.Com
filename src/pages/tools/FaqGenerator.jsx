import { useState } from 'react';
import { Link } from 'react-router-dom';

const TEMPLATES = [
  "What is {word}?",
  "How do I use {word}?",
  "Why is {word} important?",
  "Can you explain more about {word}?",
  "What are the benefits of {word}?"
];

const STOP_WORDS = new Set(['the', 'and', 'are', 'you', 'for', 'that', 'this', 'with', 'have', 'but', 'not', 'was', 'from', 'they', 'will', 'would', 'your', 'can', 'what', 'how', 'when', 'where', 'why', 'who', 'which']);

export default function FaqGenerator() {
  const [input, setInput] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFaqs = () => {
    if (!input.trim()) {
      setFaqs([]);
      return;
    }
    
    setIsGenerating(true);

    setTimeout(() => {
      // Extract capitalized words or long words
      let words = input.match(/\b[A-Z][a-z]{2,}\b|\b[a-zA-Z]{5,}\b/g) || [];
      
      // Count frequencies
      let counts = {};
      for (let w of words) {
        let lower = w.toLowerCase();
        if (STOP_WORDS.has(lower)) continue;
        
        counts[w] = (counts[w] || 0) + 1;
      }

      // Sort by frequency
      let sortedWords = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      
      // Pick top words
      let topWords = sortedWords.slice(0, 5);
      
      // Fallback if no words found
      if (topWords.length === 0) {
        topWords = ['this concept', 'the main topic', 'the features'];
      }

      // Generate FAQs
      let newFaqs = [];
      let templateIndices = Array.from({length: TEMPLATES.length}, (_, i) => i);
      
      // shuffle templates
      for (let i = templateIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [templateIndices[i], templateIndices[j]] = [templateIndices[j], templateIndices[i]];
      }

      let limit = Math.min(topWords.length, 5);
      for (let i = 0; i < limit; i++) {
        let word = topWords[i];
        let template = TEMPLATES[templateIndices[i % TEMPLATES.length]];
        let question = template.replace('{word}', word);
        let answer = `Based on the provided text, ${word} is a key concept that frequently appears. To provide a complete answer, consider explaining its context within your specific domain.`;
        
        newFaqs.push({ question, answer });
      }

      setFaqs(newFaqs);
      setIsGenerating(false);
    }, 50);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Tools</Link></li>
          <li className="text-sky-600 font-medium">FAQ Generator</li>
        </ul>
      </div>
      
      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-question text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-outfit">FAQ Generator</h1>
          <p className="text-slate-400 text-sm">Automatically generate frequently asked questions from your text.</p>
        </div>
      </div>
      
      <div className="glass-card p-8 rounded-2xl border border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-slate-300 font-medium block">Source Text</label>
          <textarea
            className="textarea w-full h-80 bg-[#0b1426]/80 backdrop-blur-md shadow-inner border-white/10 text-white leading-relaxed"
            placeholder="Paste an article, documentation, or any text here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          ></textarea>
          <button 
            onClick={generateFaqs}
            disabled={isGenerating}
            className="btn btn-primary w-full bg-sky-500 hover:bg-sky-600 border-none text-white h-14 text-lg disabled:opacity-50"
          >
            {isGenerating ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-bolt mr-2"></i>}
            {isGenerating ? 'Generating...' : 'Generate FAQs'}
          </button>
        </div>
        
        <div className="space-y-4">
          <label className="text-slate-300 font-medium block">Generated FAQs</label>
          
          {faqs.length === 0 ? (
            <div className="h-80 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-400 flex-col gap-3 bg-white/5">
              <i className="fa-regular fa-lightbulb text-4xl mb-2 opacity-50"></i>
              <p>FAQs will appear here</p>
            </div>
          ) : (
            <div className="space-y-4 h-[24rem] overflow-y-auto overscroll-contain pr-2 custom-scrollbar">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-sky-300 transition-colors">
                  <h3 className="text-white font-medium text-lg mb-2 flex items-start gap-3">
                    <span className="text-sky-600 font-bold shrink-0">Q:</span>
                    {faq.question}
                  </h3>
                  <p className="text-slate-400 text-sm flex items-start gap-3 leading-relaxed">
                    <span className="text-emerald-600 font-bold shrink-0">A:</span>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
