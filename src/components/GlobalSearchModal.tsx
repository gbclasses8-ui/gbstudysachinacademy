import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { BatchItem } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  batches: BatchItem[];
  onSelectBatch: (batch: BatchItem) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  batches,
  onSelectBatch,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = query.trim()
    ? batches.filter((b) => {
        const q = query.toLowerCase();
        return (
          (b.title || '').toLowerCase().includes(q) ||
          (b.batch_name || '').toLowerCase().includes(q) ||
          String(b.id || b.batch_id).includes(q)
        );
      })
    : batches.slice(0, 8); // quick recommendations

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass-modal relative w-full max-w-2xl rounded-2xl overflow-hidden border border-pink-500/30 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-pink-500/20 bg-[#160a22]">
          <Search className="w-5 h-5 text-pink-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type course, exam name or batch ID (e.g., CTET, KVS, BPSC)..."
            className="w-full bg-transparent text-sm text-white placeholder-stone-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-stone-400 hover:text-white p-1 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs bg-white/10 hover:bg-white/15 px-2 py-1 rounded text-stone-300"
          >
            ESC
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1.5">
          <div className="px-2 py-1 text-[11px] font-bold text-pink-400 uppercase tracking-wider flex items-center justify-between">
            <span>{query ? `Search Results (${filtered.length})` : 'Popular Batches'}</span>
            {!query && <span className="flex items-center gap-1 text-[10px] text-stone-400"><Sparkles className="w-3 h-3 text-pink-400" /> Featured</span>}
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              No batches found matching "{query}".
            </div>
          ) : (
            filtered.map((batch) => {
              const id = String(batch.id || batch.batch_id);
              const title = batch.title || batch.batch_name || 'Teaching Batch';
              return (
                <div
                  key={id}
                  onClick={() => {
                    onSelectBatch(batch);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-pink-500/15 border border-transparent hover:border-pink-500/30 cursor-pointer group transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-8 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-pink-500/20">
                      {batch.thumbnail || batch.batch_image ? (
                        <img
                          src={batch.thumbnail || batch.batch_image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-pink-400">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-pink-300 transition-colors truncate">
                        {title}
                      </h4>
                      <span className="text-[10px] text-stone-400">Batch #{id} • 100% Free</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-pink-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <span>Study</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
