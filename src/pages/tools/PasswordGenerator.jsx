import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const password = useMemo(() => {
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let charSet = '';
    if (includeLowercase) charSet += lowercaseChars;
    if (includeUppercase) charSet += uppercaseChars;
    if (includeNumbers) charSet += numberChars;
    if (includeSymbols) charSet += symbolChars;

    if (!charSet) return '';

    const secureRandomIndex = (max) => {
      const array = new Uint32Array(1);
      let value;
      do {
        window.crypto.getRandomValues(array);
        value = array[0];
      } while (value >= Math.floor(0x100000000 / max) * max);
      return value % max;
    };

    let result = '';
    for (let i = 0; i < length; i++) {
      result += charSet[secureRandomIndex(charSet.length)];
    }
    return result;
    // refreshKey forces a new random password when the user clicks Regenerate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, includeLowercase, includeUppercase, includeNumbers, includeSymbols, refreshKey]);

  const generatePassword = () => {
    setRefreshKey((k) => k + 1);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Tools</Link></li>
          <li className="text-sky-600 font-medium">Password Generator</li>
        </ul>
      </div>
      
      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-key text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight font-outfit">Secure Password Generator</h1>
          <p className="text-slate-400 text-sm">Create strong, cryptographically secure passwords locally.</p>
        </div>
      </div>
      
      <div className="glass-card p-8 rounded-2xl border border-white/10 max-w-2xl">
        
        <div className="relative mb-8">
          <input 
            type="text" 
            readOnly 
            value={password}
            placeholder="Click Generate"
            className="input input-lg w-full bg-[#0b1426]/80 backdrop-blur-md shadow-inner border-white/10 text-white font-mono text-xl pr-32 h-16"
          />
          <button 
            onClick={copyToClipboard}
            className="absolute right-2 top-2 btn btn-primary bg-sky-500 hover:bg-sky-600 border-none text-white min-h-0 h-12 px-4"
          >
            {copied ? <i className="fa-solid fa-check"></i> : <i className="fa-regular fa-copy"></i>}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="space-y-8">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-slate-300 font-medium">Password Length</label>
              <span className="text-sky-600 font-bold text-lg bg-sky-500/10 px-3 py-1 rounded-lg border border-sky-200">{length}</span>
            </div>
            <input 
              type="range" 
              min="8" 
              max="64" 
              value={length} 
              onChange={(e) => setLength(parseInt(e.target.value))}
              className="range range-info range-sm" 
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2 px-1">
              <span>8</span>
              <span>36</span>
              <span>64</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-sky-300 transition-colors">
              <input type="checkbox" className="checkbox checkbox-info checkbox-sm" checked={includeLowercase} onChange={e => setIncludeLowercase(e.target.checked)} />
              <span className="label-text text-slate-300">Lowercase (a-z)</span>
            </label>
            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-sky-300 transition-colors">
              <input type="checkbox" className="checkbox checkbox-info checkbox-sm" checked={includeUppercase} onChange={e => setIncludeUppercase(e.target.checked)} />
              <span className="label-text text-slate-300">Uppercase (A-Z)</span>
            </label>
            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-sky-300 transition-colors">
              <input type="checkbox" className="checkbox checkbox-info checkbox-sm" checked={includeNumbers} onChange={e => setIncludeNumbers(e.target.checked)} />
              <span className="label-text text-slate-300">Numbers (0-9)</span>
            </label>
            <label className="label cursor-pointer justify-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-sky-300 transition-colors">
              <input type="checkbox" className="checkbox checkbox-info checkbox-sm" checked={includeSymbols} onChange={e => setIncludeSymbols(e.target.checked)} />
              <span className="label-text text-slate-300">Symbols (!@#)</span>
            </label>
          </div>

          <button 
            onClick={generatePassword}
            disabled={!includeLowercase && !includeUppercase && !includeNumbers && !includeSymbols}
            className="btn btn-primary w-full bg-sky-500 hover:bg-sky-600 border-none text-white h-14 text-lg disabled:opacity-50"
          >
            <i className="fa-solid fa-bolt mr-2"></i>
            {(!includeLowercase && !includeUppercase && !includeNumbers && !includeSymbols) ? 'Select at least one type' : 'Generate Password'}
          </button>
        </div>
      </div>
    </div>
  );
}
