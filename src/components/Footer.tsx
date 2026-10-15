import React from 'react';
import { Send, Heart } from 'lucide-react';
import { BRAND } from '../constants';

interface FooterProps {
  onOpenTelegram: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenTelegram }) => {
  return (
    <footer className="w-full border-t border-pink-500/15 bg-[#0a050f] text-stone-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-pink-500/30 p-0.5 bg-black shrink-0">
              <img
                src={BRAND.logo}
                alt={BRAND.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-white">GB</span>
                <span className="text-lg font-black text-pink-500">STUDY</span>
              </div>
              <p className="text-xs text-stone-400">
                Quality education for CTET, KVS, BPSC TRE, UP SUPERTET & Teaching aspirants.
              </p>
            </div>
          </div>

          {/* Telegram Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenTelegram}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-pink-500/20 btn-press cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Join Telegram Community</span>
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-pink-500/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} {BRAND.name}. All educational study materials & lectures.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> for students
          </p>
        </div>
      </div>
    </footer>
  );
};
