import React from 'react';
import { Search, X, Sparkles, GraduationCap, PlayCircle, FileText } from 'lucide-react';
import { BRAND } from '../constants';

interface HeroBannerProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onOpenTelegram: () => void;
  totalBatches: number;
}

const CATEGORIES = [
  'All',
  'CTET',
  'BPSC TRE',
  'KVS/NVS',
  'UP SUPERTET',
  'UP TGT/PGT',
  'JHARKHAND TET',
];

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  totalBatches,
}) => {
  return (
    <section className="relative overflow-hidden pt-4 pb-3 sm:pt-7 sm:pb-6 border-b border-pink-500/15">
      {/* Subtle radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-gradient-to-b from-pink-500/10 via-rose-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Main Search Input (Matching "Filter batches..." from Screenshot) */}
          <div className="w-full relative mb-3 sm:mb-5">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-pink-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Filter batches..."
                className="w-full pl-11 pr-11 py-3.5 bg-[#160a22]/90 border border-pink-500/30 focus:border-pink-500 rounded-2xl text-sm sm:text-base text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 transition-all shadow-lg shadow-black/40"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3.5 text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Desktop/Tablet Welcome Tagline */}
          <div className="hidden sm:flex flex-col items-center mb-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-semibold mb-2 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Free Complete Batches • Video Lectures & PDF Notes</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Explore All Batches on{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500">
                {BRAND.name}
              </span>
            </h1>
          </div>

          {/* Desktop Stats Bar */}
          <div className="hidden sm:grid grid-cols-3 gap-3 my-2 w-full max-w-md">
            <div className="bg-[#170a24]/60 border border-pink-500/20 rounded-xl p-2.5">
              <div className="flex items-center justify-center gap-1.5 text-pink-400 text-xs font-bold">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{totalBatches} Batches</span>
              </div>
            </div>
            <div className="bg-[#170a24]/60 border border-pink-500/20 rounded-xl p-2.5">
              <div className="flex items-center justify-center gap-1.5 text-pink-400 text-xs font-bold">
                <PlayCircle className="w-3.5 h-3.5" />
                <span>HD Lectures</span>
              </div>
            </div>
            <div className="bg-[#170a24]/60 border border-pink-500/20 rounded-xl p-2.5">
              <div className="flex items-center justify-center gap-1.5 text-pink-400 text-xs font-bold">
                <FileText className="w-3.5 h-3.5" />
                <span>Class PDFs</span>
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 scrollbar-none justify-start sm:justify-center">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#ec1c6d] to-[#d81b60] text-white shadow-md shadow-pink-500/30'
                      : 'bg-[#180a26]/90 hover:bg-white/10 text-stone-300 hover:text-white border border-pink-500/20'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
