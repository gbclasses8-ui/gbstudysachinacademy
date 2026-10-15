import React from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { BRAND } from '../constants';

interface PdfViewerModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  url,
  title,
  onClose,
}) => {
  const proxiedUrl = `/api/pdf?url=${encodeURIComponent(url)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-5"
      role="dialog"
      aria-modal="true"
    >
      <div className="glass-modal relative w-full h-[94vh] max-w-5xl rounded-2xl overflow-hidden flex flex-col border border-pink-500/30 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-[#140a20] border-b border-pink-500/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center shrink-0 border border-pink-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {title || 'Lecture Notes / Document'}
              </h3>
              <span className="text-[10px] text-pink-400 font-medium">
                {BRAND.name} Official Study Material
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Open in new tab */}
            <a
              href={proxiedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Full Tab</span>
            </a>

            {/* Direct Download Button */}
            <a
              href={proxiedUrl}
              download
              className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md shadow-pink-500/25 btn-press transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Frame */}
        <div className="flex-1 w-full bg-[#18181b] relative">
          <iframe
            src={proxiedUrl}
            title={title}
            className="w-full h-full border-0"
          />

          {/* Quick Fallback Notice if browser doesn't render PDF inline */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#120a1c]/90 border border-pink-500/20 px-3 py-1.5 rounded-full text-[11px] text-stone-300 pointer-events-auto flex items-center gap-2 shadow-lg">
            <span>Having trouble viewing?</span>
            <a
              href={proxiedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-pink-400 hover:underline font-bold"
            >
              Click to Open Directly
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
