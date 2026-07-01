import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toolsList, toolCategories } from '../data/tools';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Keyboard shortcut listener (Cmd+K / Ctrl+K) & Custom Event Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleOpenEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleOpenEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleOpenEvent);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Filter tools
  const filteredTools = React.useMemo(() => {
    return query === '' 
      ? toolsList.slice(0, 8) // Show first 8 initially
      : toolsList.filter(tool => {
          const nameMatch = tool.name?.toLowerCase().includes(query.toLowerCase());
          const descMatch = tool.desc?.toLowerCase().includes(query.toLowerCase());
          const catMatch = toolCategories.find(c => c.id === tool.categoryId)?.title?.toLowerCase().includes(query.toLowerCase());
          return nameMatch || descMatch || catMatch;
        }).slice(0, 10); // Limit results
  }, [query]);

  // Keyboard navigation within the modal
  useEffect(() => {
    const handleNavigation = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => filteredTools.length ? (prev < filteredTools.length - 1 ? prev + 1 : 0) : 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => filteredTools.length ? (prev > 0 ? prev - 1 : filteredTools.length - 1) : 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredTools.length > 0) {
          const selectedTool = filteredTools[selectedIndex];
          navigate(selectedTool.path);
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleNavigation);
    return () => window.removeEventListener('keydown', handleNavigation);
  }, [isOpen, filteredTools, selectedIndex, navigate]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal Content */}
      <div 
        className="relative w-full max-w-2xl bg-[#0b1426] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Area */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 bg-[#0f1b33]">
          <i className="fa-solid fa-magnifying-glass text-slate-400 text-lg mr-3"></i>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-white text-lg placeholder-slate-500 font-manrope"
            placeholder="Search 70+ tools (e.g., 'Trim video')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <div className="hidden sm:flex items-center gap-1">
            <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-slate-400 font-mono">ESC</kbd>
            <span className="text-xs text-slate-500">to close</span>
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <i className="fa-regular fa-face-frown text-3xl mb-3 opacity-50"></i>
              <p className="font-manrope">No tools found for "{query}"</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider font-manrope">
                {query === '' ? 'Suggested Tools' : 'Search Results'}
              </div>
              {filteredTools.map((tool, idx) => {
                const isSelected = idx === selectedIndex;
                const cat = toolCategories.find(c => c.id === tool.categoryId);
                
                return (
                  <button
                    key={tool.id}
                    className={`flex items-center w-full px-3 py-3 rounded-xl text-left transition-colors duration-150 ${
                      isSelected ? 'bg-sky-500/15 border border-sky-500/30' : 'hover:bg-white/5 border border-transparent'
                    }`}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      navigate(tool.path);
                      setIsOpen(false);
                    }}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                      isSelected ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-slate-400'
                    }`}>
                      <i className={`fa-solid ${tool.icon} text-lg`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {tool.name}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          isSelected ? 'bg-sky-500/20 text-sky-300' : 'bg-white/5 text-slate-500'
                        }`}>
                          {cat?.title || 'Tool'}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-sky-200/70' : 'text-slate-500'}`}>
                        {tool.desc}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="ml-3 hidden sm:block">
                        <i className="fa-solid fa-arrow-turn-down fa-rotate-90 text-sky-500 text-sm opacity-60"></i>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/5 bg-[#0b1426] flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-500 font-manrope">
            <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded">↑</kbd><kbd className="bg-white/10 px-1.5 py-0.5 rounded">↓</kbd> to navigate</span>
            <span className="flex items-center gap-1.5"><kbd className="bg-white/10 px-1.5 py-0.5 rounded">↵</kbd> to select</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AudioBulk Pro Search</span>
          </div>
        </div>
      </div>
    </div>
  );
}
