import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function MetaAdPreview() {
  const [primaryText, setPrimaryText] = useState('Are you looking for the best audio tools? Check out AudioBulk today!');
  const [headline, setHeadline] = useState('AudioBulk - The Ultimate Audio Tool');
  const [description, setDescription] = useState('Convert, compress, and edit audio files in bulk for free.');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop');

  const truncateText = (text, limit) => {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-sm breadcrumbs text-slate-400">
        <ul>
          <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
          <li><Link to="/all-tools" className="hover:text-white transition-colors">Tools</Link></li>
          <li className="text-sky-600 font-medium">Meta Ad Preview</li>
        </ul>
      </div>

      <div className="flex items-center gap-3 border-b border-white/10 pb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-200 text-sky-600">
          <i className="fa-brands fa-meta text-lg"></i>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Meta Ad Preview</h1>
          <p className="text-slate-400 text-sm">Visualize your Facebook and Instagram feed ads before launching.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <h2 className="text-xl font-semibold text-white">Ad Content</h2>
          
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Primary Text</span>
            </label>
            <textarea 
              className="textarea textarea-bordered bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              placeholder="Enter your ad copy here..."
              value={primaryText}
              maxLength={125}
              onChange={(e) => setPrimaryText(e.target.value)}
              rows="4"
            ></textarea>
            <label className="label">
              <span className="label-text-alt text-slate-400">{primaryText.length}/125</span>
            </label>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Headline</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              placeholder="Enter headline..."
              value={headline}
              maxLength={40}
              onChange={(e) => setHeadline(e.target.value)}
            />
            <label className="label">
              <span className="label-text-alt text-slate-400">{headline.length}/40</span>
            </label>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Description</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              placeholder="Enter description..."
              value={description}
              maxLength={30}
              onChange={(e) => setDescription(e.target.value)}
            />
            <label className="label">
              <span className="label-text-alt text-slate-400">{description.length}/30</span>
            </label>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text text-slate-300">Image URL</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-sky-500 focus:ring-sky-500" 
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col items-center bg-[#0b1426]/80 backdrop-blur-md shadow-inner">
          <h2 className="text-xl font-semibold text-white mb-6 w-full text-left">Live Preview</h2>
          
          <div className="w-full max-w-[500px] bg-white/5 rounded-lg overflow-hidden shadow-lg border border-white/10">
            <div className="flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-400">
                <i className="fa-solid fa-user"></i>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-white text-sm">Your Page Name</span>
                  <span className="text-blue-500"><i className="fa-solid fa-circle-check text-xs"></i></span>
                </div>
                <span className="text-xs text-slate-400">Sponsored <i className="fa-solid fa-earth-americas ml-1"></i></span>
              </div>
              <div className="ml-auto text-slate-400">
                <i className="fa-solid fa-ellipsis"></i>
              </div>
            </div>

            <div className="px-3 pb-3 text-sm text-white whitespace-pre-wrap">
              {truncateText(primaryText, 125) || 'Primary text goes here...'}
            </div>

            <div className="w-full aspect-[4/5] bg-slate-100 flex items-center justify-center relative overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt="Ad media" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-400 flex flex-col items-center">
                  <i className="fa-regular fa-image text-3xl mb-2"></i>
                  <span>No image</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between bg-[#0b1426]/80 backdrop-blur-md shadow-inner p-3 border-t border-white/10">
              <div className="flex flex-col overflow-hidden pr-2">
                <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">example.com</span>
                <span className="font-semibold text-white text-sm">{truncateText(headline, 40) || 'Headline goes here'}</span>
                <span className="text-xs text-slate-400">{truncateText(description, 30) || 'Description goes here'}</span>
              </div>
              <button className="bg-slate-200 hover:bg-slate-300 text-white font-semibold px-4 py-2 rounded text-sm transition-colors flex-shrink-0">
                Learn more
              </button>
            </div>
            
            <div className="px-3 py-2 border-t border-white/10 flex justify-between items-center text-slate-400">
              <div className="flex items-center gap-1">
                <div className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"><i className="fa-solid fa-thumbs-up"></i></div>
                <div className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"><i className="fa-solid fa-heart"></i></div>
                <span className="text-xs ml-1">1.2K</span>
              </div>
              <span className="text-xs">140 Comments • 24 Shares</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
