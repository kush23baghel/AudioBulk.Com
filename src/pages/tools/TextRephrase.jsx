import { useState } from 'react';
import { Link } from 'react-router-dom';

const SYNONYMS = {
  'good': 'excellent',
  'bad': 'subpar',
  'fast': 'quick',
  'slow': 'sluggish',
  'happy': 'joyful',
  'sad': 'sorrowful',
  'big': 'substantial',
  'small': 'diminutive',
  'very': 'highly',
  'important': 'crucial',
  'new': 'novel',
  'old': 'ancient',
  'right': 'correct',
  'wrong': 'incorrect',
  'hard': 'difficult',
  'easy': 'effortless',
  'use': 'utilize',
  'make': 'create'
};

const TRANSITIONS = [
  "Furthermore, ",
  "In addition, ",
  "Moreover, ",
  "Notably, ",
  "Interestingly, ",
  "As a matter of fact, "
];

export default function TextRephrase() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const rephraseText = () => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    let sentences = input.split(/(?<=[.?!])\s+/);
    
    let rephrasedSentences = sentences.map((sentence, index) => {
      let words = sentence.split(' ');
      let newWords = words.map(word => {
        let cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
        let punctuation = word.replace(/[a-zA-Z]/g, '');
        
        if (SYNONYMS[cleanWord]) {
          let replaced = SYNONYMS[cleanWord];
          // Match original capitalization
          if (word[0] && word[0] === word[0].toUpperCase()) {
            replaced = replaced.charAt(0).toUpperCase() + replaced.slice(1);
          }
          return replaced + punctuation;
        }
        return word;
      });
      
      let newSentence = newWords.join(' ');
      
      // Randomly add a transition word to sentences after the first one
      if (index > 0 && Math.random() > 0.5 && /^[A-Z]/.test(newSentence)) {
        const transition = TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)];
        newSentence = newSentence.charAt(0).toLowerCase() + newSentence.slice(1);
        newSentence = transition + newSentence;
      }

      return newSentence;
    });

    setOutput(rephrasedSentences.join(' '));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Tools</Link></li>
          <li className="text-sky-600 font-medium">Text Rephraser</li>
        </ul>
      </div>
      
      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-arrows-rotate text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-outfit">Text Rephraser</h1>
          <p className="text-slate-400 text-sm">A mock heuristic rephraser for demonstration purposes.</p>
        </div>
      </div>
      
      <div className="glass-card p-8 rounded-2xl border border-white/10">
        <div className="bg-sky-500/10 border border-sky-200 text-sky-800 px-4 py-3 rounded-xl mb-8 flex items-start gap-3">
          <i className="fa-solid fa-circle-info mt-1"></i>
          <div>
            <p className="font-medium">Heuristic Demonstration</p>
            <p className="text-sm opacity-80 mt-1">This tool runs locally using simple synonym swapping and random transition word insertion. It does not use AI. Try using words like "good", "fast", "big", or "important" to see it in action.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-slate-300 font-medium block">Original Text</label>
            <textarea
              className="textarea w-full h-80 bg-[#0b1426]/80 backdrop-blur-md shadow-inner border-white/10 text-white leading-relaxed"
              placeholder="Paste your text here to be rephrased..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            ></textarea>
            <button 
              onClick={rephraseText}
              className="btn btn-primary w-full bg-sky-500 hover:bg-sky-600 border-none text-white h-14 text-lg"
            >
              <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
              Rephrase Text
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-slate-300 font-medium block">Rephrased Output</label>
              <button 
                onClick={() => navigator.clipboard.writeText(output)} 
                className="btn btn-sm btn-ghost text-sky-600 hover:bg-sky-500/10"
                disabled={!output}
              >
                <i className="fa-regular fa-copy"></i> Copy Output
              </button>
            </div>
            <textarea
              className="textarea w-full h-80 bg-[#0b1426]/80 backdrop-blur-md shadow-inner border-white/10 text-white leading-relaxed"
              placeholder="Rephrased text will appear here..."
              readOnly
              value={output}
            ></textarea>
          </div>
        </div>
      </div>
    </div>
  );
}
