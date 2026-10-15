import React from 'react';
import { Layers, Bookmark, Send, Search, Heart } from 'lucide-react';
import { BRAND } from '../constants';

interface NavbarProps {
  currentTab: 'all' | 'wishlist';
  onSelectTab: (tab: 'all' | 'wishlist') => void;
  enrollmentCount: number;
  onOpenTelegram: () => void;
  onOpenSearch: () => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  enrollmentCount,
  onOpenTelegram,
  onOpenSearch,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full glass-nav border-b border-pink-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-3 text-left btn-press cursor-pointer group"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden border-2 border-pink-500/40 p-0.5 bg-black shadow-lg shadow-pink-500/20 group-hover:border-pink-500 transition-colors shrink-0">
            <img
              src={BRAND.logo}
              alt={BRAND.name}
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xl sm:text-2xl font-black tracking-wider text-white">
                GB
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500 drop-shadow-[0_0_12px_rgba(236,72,153,0.6)]">
                STUDY
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-pink-300/80 font-medium tracking-normal block mt-1 truncate">
              Free Batches, Lectures & Notes
            </span>
          </div>
        </button>

        {/* Center Navigation (Desktop & Laptop only) */}
        <nav className="hidden md:flex items-center gap-2 bg-[#170a24]/80 border border-pink-500/20 p-1.5 rounded-2xl">
          <button
            onClick={() => onSelectTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'all'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            All Batches
          </button>

          <button
            onClick={() => onSelectTab('wishlist')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              currentTab === 'wishlist'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/30'
                : 'text-stone-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            My Enrollments
            {enrollmentCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-white text-pink-600 rounded-full text-[10px] font-black">
                {enrollmentCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Action Icons & Telegram Button */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Circular Search Icon Button */}
          <button
            onClick={onOpenSearch}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#180b26]/90 hover:bg-pink-500/20 border border-pink-500/30 text-stone-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-sm"
            title="Search batches"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-pink-400" />
          </button>

          {/* Circular Heart/Saved Icon Button */}
          <button
            onClick={() => onSelectTab('wishlist')}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#180b26]/90 hover:bg-pink-500/20 border border-pink-500/30 flex items-center justify-center transition-all cursor-pointer relative shadow-sm ${
              currentTab === 'wishlist'
                ? 'border-pink-500 text-pink-400 bg-pink-500/20'
                : 'text-stone-300 hover:text-white'
            }`}
            title="Saved Batches"
            aria-label="Saved"
          >
            <Heart
              className={`w-4 h-4 ${
                currentTab === 'wishlist' || enrollmentCount > 0
                  ? 'fill-pink-500 text-pink-500'
                  : 'text-pink-400'
              }`}
            />
            {enrollmentCount > 0 && currentTab !== 'wishlist' && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            )}
          </button>

          {/* Telegram Pill Button (Matching Screenshot) */}
          <button
            onClick={onOpenTelegram}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#ec1c6d] via-[#f02279] to-[#d81b60] hover:from-[#f02279] hover:to-[#ec1c6d] text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-pink-500/30 btn-press cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram</span>
          </button>
        </div>
      </div>
    </header>
  );
};
