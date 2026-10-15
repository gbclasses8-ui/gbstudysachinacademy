import React from 'react';
import { Send, X, Sparkles, BookOpen, FileText, Bell } from 'lucide-react';
import { BRAND } from '../constants';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleJoin = () => {
    window.open(BRAND.telegramUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity">
      <div 
        className="glass-modal relative w-full max-w-md rounded-2xl overflow-hidden p-6 sm:p-7 border border-pink-500/30 text-white animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-pink-500 p-0.5 shadow-lg shadow-pink-500/30 bg-black">
              <img
                src={BRAND.logo}
                alt={BRAND.name}
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full p-1.5 shadow-md border-2 border-[#12091a]">
              <Send className="w-4 h-4 text-white" />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/15 text-pink-400 border border-pink-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Official Channel
          </span>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
            {BRAND.telegramTitle}
          </h2>

          <p className="text-stone-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Get instant access to free classes, handwritten PDF notes, answer keys & exam notifications directly on your phone!
          </p>
        </div>

        {/* Benefits list */}
        <div className="my-5 bg-white/5 border border-pink-500/10 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-stone-200">
            <div className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span>All Batches (CTET, KVS, BPSC TRE, UP SUPERTET)</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-stone-200">
            <div className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span>Daily Handwritten Class PDFs & Study Materials</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-stone-200">
            <div className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <span>Instant Lecture & Exam Notification Alerts</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-2">
          <button
            onClick={handleJoin}
            className="flex-1 bg-gradient-to-r from-pink-500 via-pink-600 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-bold py-3 px-5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 btn-press transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Join Telegram
          </button>
          <button
            onClick={onClose}
            className="sm:w-28 bg-white/10 hover:bg-white/15 text-stone-300 hover:text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
