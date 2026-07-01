import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function JsonSqlFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  const formatJson = () => {
    setError('');
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const parsed = JSON.parse(input);
        setOutput(JSON.stringify(parsed, null, 2));
      } catch (err) {
        setError('Invalid JSON: ' + err.message);
      } finally {
        setIsCalculating(false);
      }
    }, 10);
  };

  const formatSql = () => {
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }
    
    setIsCalculating(true);
    setTimeout(() => {
      try {
        let formatted = input
          .replace(/\s+/g, ' ')
          .replace(/\b(SELECT|FROM|WHERE|AND|OR|INNER JOIN|LEFT JOIN|RIGHT JOIN|ORDER BY|GROUP BY|HAVING|LIMIT)\b/gi, match => `\n${match.toUpperCase()}`);
        
        setOutput(formatted.trim());
      } catch (err) {
        setError('Error formatting SQL: ' + err.message);
      } finally {
        setIsCalculating(false);
      }
    }, 10);
  };

  const copyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Tools</Link></li>
          <li className="text-sky-600 font-medium">JSON & SQL Formatter</li>
        </ul>
      </div>
      
      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-code text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-outfit">JSON & SQL Formatter</h1>
          <p className="text-slate-400 text-sm">Quickly beautify your JSON data or format simple SQL queries.</p>
        </div>
      </div>
      
      <div className="glass-card p-8 rounded-2xl border border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <label className="text-slate-300 font-medium flex justify-between">
            Input Code
            {error && <span className="text-red-400 text-sm">{error}</span>}
          </label>
          <textarea
            className="textarea w-full h-96 bg-[#0b1426]/80 backdrop-blur-md shadow-inner border-white/10 text-white font-mono leading-relaxed"
            placeholder="Paste your JSON or SQL here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          ></textarea>
          <div className="flex gap-4">
            <button onClick={formatJson} disabled={isCalculating} className="btn bg-sky-500 hover:bg-sky-600 border-none text-white flex-1 h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {isCalculating ? <span className="loading loading-spinner loading-sm"></span> : <i className="fa-brands fa-js mr-2"></i>} 
              {isCalculating ? ' Formatting...' : ' Format JSON'}
            </button>
            <button onClick={formatSql} disabled={isCalculating} className="btn bg-emerald-500 hover:bg-emerald-600 border-none text-white flex-1 h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed">
              {isCalculating ? <span className="loading loading-spinner loading-sm"></span> : <i className="fa-solid fa-database mr-2"></i>} 
              {isCalculating ? ' Formatting...' : ' Format SQL'}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="text-slate-300 font-medium">Formatted Output</label>
            <button onClick={copyOutput} className="btn btn-sm btn-ghost text-sky-600 hover:bg-sky-500/10">
              <i className="fa-regular fa-copy"></i> Copy Output
            </button>
          </div>
          <textarea
            className="textarea w-full h-96 bg-[#0b1426]/80 backdrop-blur-md shadow-inner border-white/10 text-sky-800 font-mono leading-relaxed"
            placeholder={isCalculating ? "Formatting in progress..." : "Output will appear here..."}
            readOnly
            value={output}
          ></textarea>
        </div>
      </div>
    </div>
  );
}
