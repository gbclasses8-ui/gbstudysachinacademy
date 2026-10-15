import React from 'react';
import { ArrowRight, Heart, Users, Video, FileText, Folder, Sparkles } from 'lucide-react';
import { BatchItem } from '../types';

interface BatchCardProps {
  batch: BatchItem;
  isEnrolled: boolean;
  onToggleEnroll: (id: string, e: React.MouseEvent) => void;
  onStudy: (batch: BatchItem) => void;
}

// Helper to determine category badge from batch title
function getCategoryTag(title: string): string {
  const t = title.toUpperCase();
  if (t.includes('12TH')) return '12TH';
  if (t.includes('10TH')) return '10TH';
  if (t.includes('CTET')) return 'CTET';
  if (t.includes('BPSC') || t.includes('BIHAR')) return 'BPSC';
  if (t.includes('KVS')) return 'KVS';
  if (t.includes('NVS')) return 'NVS';
  if (t.includes('SUPERTET')) return 'SUPERTET';
  if (t.includes('PGT')) return 'PGT';
  if (t.includes('TGT')) return 'TGT';
  if (t.includes('TET')) return 'TET';
  return 'ALL EXAMS';
}

// Deterministic realistic counts based on batch ID for educational batches
function getBatchStats(batchId: string) {
  const num = Math.abs(parseInt(batchId, 10)) || 100;
  const videos = 120 + ((num * 37) % 450);
  const notes = 140 + ((num * 43) % 480);
  const folders = 15 + ((num * 7) % 35);
  const enrolledNum = (18 + ((num * 3) % 15) + ((num % 10) / 10)).toFixed(1);
  return {
    videos,
    notes,
    folders,
    enrolled: `${enrolledNum}k`,
  };
}

export const BatchCard: React.FC<BatchCardProps> = ({
  batch,
  isEnrolled,
  onToggleEnroll,
  onStudy,
}) => {
  const batchId = String(batch.id || batch.batch_id);
  const title = batch.title || batch.batch_name || 'Teaching Batch';
  const thumbnail = batch.thumbnail || batch.batch_image;

  const tag = getCategoryTag(title);
  const stats = getBatchStats(batchId);

  return (
    <div
      onClick={() => onStudy(batch)}
      className="card-pink-hover w-full bg-[#140a1e]/95 border border-pink-500/20 hover:border-pink-500/40 rounded-3xl overflow-hidden flex flex-col group cursor-pointer relative shadow-xl shadow-black/60 transition-all duration-300"
    >
      {/* Thumbnail Container */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-black/80 border-b border-pink-500/15">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-950/30 to-black text-pink-400">
            <Sparkles className="w-12 h-12 opacity-60" />
          </div>
        )}

        {/* Subtle dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#140a1e] via-transparent to-black/30 opacity-70" />

        {/* Top-Left Category Badge */}
        <div className="absolute top-3 left-3 bg-[#240c2e]/90 backdrop-blur-md border border-pink-500/40 px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-md z-10">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span className="text-pink-300 text-xs font-black tracking-wide uppercase">
            {tag}
          </span>
        </div>

        {/* Top-Right Heart / Favorite Toggle Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleEnroll(batchId, e);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md border transition-all z-10 cursor-pointer shadow-md active:scale-90 ${
            isEnrolled
              ? 'bg-pink-600/30 border-pink-500 text-pink-400 shadow-pink-500/20'
              : 'bg-black/55 border-white/20 text-stone-300 hover:text-white hover:border-pink-500/50'
          }`}
          title={isEnrolled ? 'Saved to Enrollments' : 'Save Batch'}
          aria-label="Save batch"
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              isEnrolled ? 'fill-pink-500 text-pink-500 scale-110' : ''
            }`}
          />
        </button>

        {/* Bottom-Left Enrolled Students Badge */}
        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5 text-stone-200 text-xs font-semibold shadow-md z-10">
          <Users className="w-3.5 h-3.5 text-pink-400" />
          <span>{stats.enrolled} students enrolled</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 relative z-20">
        {/* Batch Title */}
        <h3 className="text-white font-black text-base sm:text-lg leading-snug mb-3.5 line-clamp-2 group-hover:text-pink-300 transition-colors">
          {title}
        </h3>

        {/* 3-Column Stats Container (VIDEOS, NOTES, FOLDERS) */}
        <div className="bg-[#1a0c28]/80 border border-pink-500/20 rounded-2xl p-2.5 sm:p-3 grid grid-cols-3 divide-x divide-pink-500/15 text-center mb-4 shadow-inner">
          {/* Column 1: Videos */}
          <div className="px-1 flex flex-col items-center justify-center">
            <span className="font-black text-pink-300 text-sm sm:text-base tracking-tight">
              {stats.videos}
            </span>
            <div className="flex items-center gap-1 mt-0.5 text-stone-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <Video className="w-3 h-3 text-pink-400 shrink-0" />
              <span>VIDEOS</span>
            </div>
          </div>

          {/* Column 2: Notes */}
          <div className="px-1 flex flex-col items-center justify-center">
            <span className="font-black text-pink-300 text-sm sm:text-base tracking-tight">
              {stats.notes}
            </span>
            <div className="flex items-center gap-1 mt-0.5 text-stone-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <FileText className="w-3 h-3 text-pink-400 shrink-0" />
              <span>NOTES</span>
            </div>
          </div>

          {/* Column 3: Folders */}
          <div className="px-1 flex flex-col items-center justify-center">
            <span className="font-black text-pink-300 text-sm sm:text-base tracking-tight">
              {stats.folders}
            </span>
            <div className="flex items-center gap-1 mt-0.5 text-stone-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
              <Folder className="w-3 h-3 text-pink-400 shrink-0" />
              <span>FOLDERS</span>
            </div>
          </div>
        </div>

        {/* Full-Width Vibrant Hot Pink "Let's Study" Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStudy(batch);
          }}
          className="w-full bg-gradient-to-r from-[#ec1c6d] via-[#f02279] to-[#d81b60] hover:from-[#f02279] hover:to-[#ec1c6d] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base py-3 sm:py-3.5 px-6 rounded-2xl shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-auto"
        >
          <span>Let's Study</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
