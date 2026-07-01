import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toolCategories, toolsList } from '../data/tools';
import SeoMeta from '../components/SeoMeta';

const CAT_ICON_CLASSES = {
  audio: 'icon-audio',
  video: 'icon-video',
  'gif-image': 'icon-gif',
  'ai-generators': 'icon-ai',
  marketing: 'icon-marketing',
  utilities: 'icon-utilities',
};

export default function AllTools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const activeCategory = searchParams.get('cat') || 'all';

  const handleCategoryChange = (catId) => {
    if (catId === 'all') {
      searchParams.delete('cat');
    } else {
      searchParams.set('cat', catId);
    }
    setSearchParams(searchParams);
    setSearchQuery('');
  };

  const filteredTools = toolsList.filter((tool) => {
    const matchesCat = activeCategory === 'all' || tool.categoryId === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || tool.name.toLowerCase().includes(q) || tool.desc.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen" style={{ background: '#060e20' }}>
      <SeoMeta 
        title="Directory of All Tools" 
        description="Browse all 70+ free, private, and fast browser-based tools for audio, video, image, AI writing, and marketing tasks." 
      />
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 left-0 w-80 h-80 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="space-y-2">
            <span className="font-manrope text-xs font-semibold uppercase tracking-wider text-sky-400">
              Browse
            </span>
            <h1 className="font-sora font-extrabold text-white tracking-tight"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}>
              Tools <span className="text-gradient">Directory</span>
            </h1>
            <p className="text-slate-400 text-sm">
              {filteredTools.length} tools · all free, all private, all local
            </p>
          </div>

          <div className="w-full md:w-80 relative">
            <div className="flex items-center gap-3 rounded-xl px-4 py-3 input-glass">
              <i className="fa-solid fa-magnifying-glass text-slate-500 text-sm flex-shrink-0"></i>
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none text-sm"
                aria-label="Search tools"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
                  aria-label="Clear search">
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <button
            onClick={() => handleCategoryChange('all')}
            className={`pill-tab ${activeCategory === 'all' ? 'active' : ''}`}
          >
            <i className="fa-solid fa-grid-2 text-xs"></i>
            All Tools
            <span className="ml-1 opacity-70">({toolsList.length})</span>
          </button>
          {toolCategories.map((cat) => {
            const count = toolsList.filter((t) => t.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`pill-tab ${
                  activeCategory === cat.id
                    ? cat.id === 'ai-generators' ? 'active-ai' : 'active'
                    : ''
                }`}
              >
                <i className={`fa-solid ${cat.icon} text-xs`}></i>
                {cat.title.split(' ')[0]} {cat.title.split(' ')[1] || ''}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        <ToolsGrid
          key={`${activeCategory}-${searchQuery}`}
          filteredTools={filteredTools}
          searchQuery={searchQuery}
          onReset={() => { setSearchQuery(''); handleCategoryChange('all'); }}
        />
      </div>
    </div>
  );
}

function ToolsGrid({ filteredTools, searchQuery, onReset }) {
  const [visibleCount, setVisibleCount] = useState(18);
  const displayedTools = filteredTools.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTools.length;

  if (filteredTools.length === 0) {
    return (
      <div className="text-center py-24 text-slate-500">
        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mx-auto mb-6">
          <i className="fa-regular fa-face-thinking text-3xl text-slate-600"></i>
        </div>
        <h3 className="font-sora font-bold text-white text-xl mb-2">No Tools Found</h3>
        <p className="text-sm text-slate-500 mb-6">
          No tools matched "{searchQuery}" in this category.
        </p>
        <button
          onClick={onReset}
          className="btn-primary-glow inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl"
        >
          <i className="fa-solid fa-rotate-left text-xs"></i>
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedTools.map((tool, idx) => (
          <ToolCard key={tool.id} tool={tool} idx={idx} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-6">
          <button
            onClick={() => setVisibleCount((v) => v + 18)}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
            style={{ borderColor: 'rgba(255,255,255,0.10)' }}
          >
            <i className="fa-solid fa-chevron-down text-xs"></i>
            Show More ({filteredTools.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </>
  );
}

function ToolCard({ tool, idx }) {
  const iconClass = CAT_ICON_CLASSES[tool.categoryId] || 'icon-utilities';
  const isAiCat = tool.categoryId === 'ai-generators';
  const delay = (idx % 6) * 60;

  return (
    <Link
      to={tool.path}
      className={`glass-card glass-card-hover rounded-2xl p-5 flex gap-4 items-start group ${isAiCat ? 'glass-card-ai' : ''}`}
      style={{
        animation: `fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms both`,
      }}
    >
      <div className={`flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl ${iconClass} transition-all duration-200 group-hover:scale-110`}>
        <i className={`fa-solid ${tool.icon} text-lg`}></i>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={`font-sora font-semibold text-sm text-white transition-colors leading-snug ${
            isAiCat ? 'group-hover:text-violet-300' : 'group-hover:text-sky-300'
          }`}>
            {tool.name}
          </h3>
          {tool.isAi && (
            <span className="badge-ai flex-shrink-0">
              <i className="fa-solid fa-wand-magic-sparkles text-[9px]"></i>
              AI
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
          {tool.desc}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center self-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-0 group-hover:translate-x-1">
        <i className={`fa-solid fa-arrow-right text-xs ${isAiCat ? 'text-violet-400' : 'text-sky-400'}`}></i>
      </div>
    </Link>
  );
}
