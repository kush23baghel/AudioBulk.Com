import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AiNamingAds() {
  const [campaignType, setCampaignType] = useState('PROS');
  const [targetAudience, setTargetAudience] = useState('US_18-35');
  const [placement, setPlacement] = useState('FB_IG');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [adName, setAdName] = useState('Video1');
  const [copied, setCopied] = useState(false);

  const generatedName = [campaignType, targetAudience, placement, date, adName]
    .filter(Boolean)
    .join('_')
    .replace(/\s+/g, '_');

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Tools</Link></li>
          <li className="text-sky-600 font-medium">Ad Naming Generator</li>
        </ul>
      </div>

      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-solid fa-spell-check text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ad Naming Generator</h1>
          <p className="text-slate-400 text-sm">Generate structured, UTM-style tracking names for your ad campaigns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Campaign Type</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              placeholder="e.g., PROS, RETARGETING"
              value={campaignType}
              onChange={(e) => setCampaignType(e.target.value)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Target Audience</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              placeholder="e.g., US_18-35"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Placement</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              placeholder="e.g., FB_IG, TIKTOK"
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Date</span>
            </label>
            <input 
              type="date" 
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Ad Name / Creative</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              placeholder="e.g., Video1, Image_Blue"
              value={adName}
              onChange={(e) => setAdName(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col justify-center items-center space-y-6">
          <div className="text-center w-full">
            <h2 className="text-xl font-semibold text-white mb-4">Generated Ad Name</h2>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 break-all text-sky-600 font-mono text-lg mb-6">
              {generatedName || 'Start typing to generate...'}
            </div>
            
            <button 
              onClick={handleCopy}
              disabled={!generatedName}
              className="btn btn-primary w-full bg-sky-500 hover:bg-sky-600 border-none text-white disabled:opacity-50"
            >
              <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
              {copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}
            </button>
          </div>
          
          <div className="bg-sky-500/10 border border-sky-200 rounded-xl p-4 text-sm text-sky-800 mt-auto">
            <p className="font-semibold mb-1"><i className="fa-solid fa-lightbulb mr-2 text-sky-600"></i>Pro Tip</p>
            <p>Consistent naming conventions make it much easier to filter and analyze performance in Ads Manager or Google Analytics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
