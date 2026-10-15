import React from 'react';
import { Home, Layers, Search, Send, Heart } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'all' | 'wishlist';
  onSelectTab: (tab: 'all' | 'wishlist') => void;
  savedCount: number;
  onOpenSearch: () => void;
  onOpenTelegram: () => void;
  onGoHome: () => void;
  isInsideCourse?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  savedCount,
  onOpenSearch,
  onOpenTelegram,
  onGoHome,
  isInsideCourse,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0d0614]/95 backdrop-blur-xl border-t border-pink-500/20 py-1.5 px-3 shadow-[0_-8px_25px_rgba(0,0,0,0.8)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Home Tab */}
        <button
          onClick={onGoHome}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            !isInsideCourse && currentTab === 'all'
              ? 'text-pink-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">Home</span>
        </button>

        {/* 2. Batches Tab */}
        <button
          onClick={() => {
            onGoHome();
            onSelectTab('all');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            !isInsideCourse && currentTab === 'all'
              ? 'text-pink-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">Batches</span>
        </button>

        {/* 3. Search Tab */}
        <button
          onClick={onOpenSearch}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer text-stone-400 hover:text-pink-400"
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold tracking-tight">Search</span>
        </button>

        {/* 4. Telegram Tab */}
        <button
          onClick={onOpenTelegram}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer text-stone-400 hover:text-pink-400"
        >
          <Send className="w-5 h-5 mb-0.5 text-pink-400" />
          <span className="text-[10px] font-bold tracking-tight text-pink-400">Telegram</span>
        </button>

        {/* 5. Saved / Enrollments Tab */}
        <button
          onClick={() => onSelectTab('wishlist')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer relative ${
            currentTab === 'wishlist'
              ? 'text-pink-500'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="relative">
            <Heart
              className={`w-5 h-5 mb-0.5 ${
                currentTab === 'wishlist' ? 'fill-pink-500 text-pink-500' : ''
              }`}
            />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-pink-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {savedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-tight">Saved</span>
        </button>
      </div>
    </nav>
  );
};
