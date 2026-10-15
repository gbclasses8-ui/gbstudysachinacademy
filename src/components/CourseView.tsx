import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ArrowLeft,
  Folder,
  Play,
  FileText,
  Clock,
  Calendar,
  Share2,
  Bookmark,
  Check,
  Search,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { fetchSubjects, fetchTopics, fetchMaterials } from '../services/api';
import { BatchItem, SubjectItem, TopicItem, MaterialItem, NavigationCrumb } from '../types';
import { BRAND } from '../constants';

interface CourseViewProps {
  batch: BatchItem;
  isEnrolled: boolean;
  onToggleEnroll: (id: string, e: React.MouseEvent) => void;
  onBackToBatches: () => void;
  onWatchVideo: (videoId: string, title?: string) => void;
  onOpenPdf: (pdfUrl: string, title?: string) => void;
  onShowToast: (msg: string) => void;
}

export const CourseView: React.FC<CourseViewProps> = ({
  batch,
  isEnrolled,
  onToggleEnroll,
  onBackToBatches,
  onWatchVideo,
  onOpenPdf,
  onShowToast,
}) => {
  const courseId = String(batch.id || batch.batch_id);

  // Navigation Stack (Breadcrumb depth)
  const [navStack, setNavStack] = useState<NavigationCrumb[]>([
    { type: 'root', title: 'Subjects' },
  ]);

  const [activeSubject, setActiveSubject] = useState<SubjectItem | null>(null);
  const [activeTopic, setActiveTopic] = useState<TopicItem | null>(null);

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);

  // Search within current view
  const [searchFilter, setSearchFilter] = useState('');

  const currentLevel = navStack[navStack.length - 1];

  // Load data according to current hierarchy level
  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        if (currentLevel.type === 'root') {
          const list = await fetchSubjects(courseId);
          if (isCurrent) {
            setSubjects(list);
            setLoading(false);
          }
        } else if (currentLevel.type === 'subject' && activeSubject) {
          const list = await fetchTopics(courseId, activeSubject.subjectid);
          if (isCurrent) {
            setTopics(list);
            setLoading(false);
          }
        } else if (currentLevel.type === 'topic' && activeSubject && activeTopic) {
          const list = await fetchMaterials(courseId, activeSubject.subjectid, activeTopic.topicid);
          if (isCurrent) {
            setMaterials(list);
            setLoading(false);
          }
        }
      } catch (err: any) {
        if (isCurrent) {
          console.warn('Course view loading notice:', err?.message || err);
          setError(err?.message || 'Content temporarily loading. Click below to try again.');
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCurrent = false;
    };
  }, [courseId, currentLevel.type, activeSubject?.subjectid, activeTopic?.topicid]);

  // Navigate deeper into subject
  const handleSelectSubject = (subj: SubjectItem) => {
    setActiveSubject(subj);
    setSearchFilter('');
    setNavStack((prev) => [...prev, { type: 'subject', id: subj.subjectid, title: subj.subject_name }]);
  };

  // Navigate deeper into topic
  const handleSelectTopic = (top: TopicItem) => {
    setActiveTopic(top);
    setSearchFilter('');
    setNavStack((prev) => [...prev, { type: 'topic', id: top.topicid, title: top.topic_name }]);
  };

  // Step back one level
  const handleBack = () => {
    if (navStack.length > 1) {
      const newStack = [...navStack];
      newStack.pop();
      setNavStack(newStack);
      setSearchFilter('');
      const last = newStack[newStack.length - 1];
      if (last.type === 'root') {
        setActiveSubject(null);
        setActiveTopic(null);
      } else if (last.type === 'subject') {
        setActiveTopic(null);
      }
    } else {
      onBackToBatches();
    }
  };

  // Jump directly to breadcrumb index
  const handleJumpToCrumb = (index: number) => {
    if (index === navStack.length - 1) return;
    const newStack = navStack.slice(0, index + 1);
    setNavStack(newStack);
    setSearchFilter('');
    const target = newStack[newStack.length - 1];
    if (target.type === 'root') {
      setActiveSubject(null);
      setActiveTopic(null);
    } else if (target.type === 'subject') {
      setActiveTopic(null);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      onShowToast('Course link copied to clipboard!');
    }
  };

  const formatDuration = (secsStr?: string | number, durationText?: string) => {
    if (secsStr && Number(secsStr) > 0) {
      let s = Number(secsStr);
      const h = Math.floor(s / 3600);
      s %= 3600;
      const m = Math.floor(s / 60);
      s %= 60;
      if (h > 0) {
        return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
      }
      return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    if (durationText) return durationText;
    return '';
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Filtered lists according to search input
  const filteredSubjects = subjects.filter((s) =>
    s.subject_name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );
  const filteredTopics = topics.filter((t) =>
    t.topic_name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );
  const filteredMaterials = materials.filter((m) =>
    (m.Title || m.title || '').toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen pb-28 md:pb-16">
      {/* Course Top Header / Hero */}
      <div className="relative bg-gradient-to-b from-[#180a24] to-[#0c0612] border-b border-pink-500/15 pt-4 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Actions: Back Button, Title, Share */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-pink-500/20 text-xs font-bold transition-all btn-press cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-pink-400" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Enroll button */}
              <button
                onClick={(e) => onToggleEnroll(courseId, e)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isEnrolled
                    ? 'bg-pink-500/15 text-pink-300 border border-pink-500/40'
                    : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20'
                }`}
              >
                {isEnrolled ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-pink-400" />
                    <span>Enrolled</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Enroll Batch</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-pink-500/20 text-xs transition-colors"
                title="Share Course"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Course Banner Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#140a1e]/80 border border-pink-500/25 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-black/60 shrink-0 border border-pink-500/20 relative">
              {batch.thumbnail || batch.batch_image ? (
                <img
                  src={batch.thumbnail || batch.batch_image}
                  alt={batch.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-pink-400">
                  <Sparkles className="w-8 h-8 opacity-60" />
                </div>
              )}
              <div className="absolute top-2 right-2 bg-pink-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                FREE
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-pink-400 font-bold mb-1 block">
                {BRAND.name} • Batch #{courseId}
              </span>
              <h1 className="text-base sm:text-xl font-bold text-white leading-snug">
                {batch.title || batch.batch_name}
              </h1>
              <p className="text-xs text-stone-400 mt-1.5">
                Full syllabus covered: Video classes, topic notes, practice test discussions & PDF handouts.
              </p>
            </div>
          </div>

          {/* Breadcrumb Navigation Bar */}
          <div className="mt-4 flex items-center gap-1.5 text-xs text-stone-400 overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={onBackToBatches}
              className="hover:text-pink-400 transition-colors whitespace-nowrap font-medium"
            >
              All Batches
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-pink-500/50 shrink-0" />

            {navStack.map((crumb, idx) => {
              const isLast = idx === navStack.length - 1;
              return (
                <React.Fragment key={idx}>
                  <button
                    onClick={() => handleJumpToCrumb(idx)}
                    className={`whitespace-nowrap transition-colors ${
                      isLast
                        ? 'text-pink-400 font-bold pointer-events-none drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                        : 'hover:text-white font-medium'
                    }`}
                  >
                    {crumb.title}
                  </button>
                  {!isLast && <ChevronRight className="w-3.5 h-3.5 text-pink-500/50 shrink-0" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Search within this section */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-pink-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={`Search in ${currentLevel.title}...`}
              className="w-full pl-10 pr-9 py-2.5 bg-[#140a1e] border border-pink-500/25 focus:border-pink-500 rounded-xl text-xs text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-pink-500/40"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 text-stone-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-pink-400 font-bold">
            {currentLevel.type === 'root' && `${filteredSubjects.length} Subjects`}
            {currentLevel.type === 'subject' && `${filteredTopics.length} Chapters`}
            {currentLevel.type === 'topic' && `${filteredMaterials.length} Lectures & Notes`}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-pink-400">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-xs text-stone-300 font-medium">Fetching real course data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center text-center py-16 px-4 bg-[#14091c]/80 border border-pink-500/30 rounded-2xl max-w-lg mx-auto gap-3">
            <AlertCircle className="w-10 h-10 text-rose-500" />
            <h3 className="text-sm font-bold text-white">Content Could Not Be Loaded</h3>
            <p className="text-xs text-stone-400">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                // Trigger re-fetch
                const current = { ...navStack[navStack.length - 1] };
                setNavStack([...navStack.slice(0, -1), current]);
              }}
              className="mt-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md btn-press cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && (
          <>
            {currentLevel.type === 'root' && filteredSubjects.length === 0 && (
              <div className="text-center py-16 text-stone-400 text-sm">
                No subjects found matching "{searchFilter}".
              </div>
            )}
            {currentLevel.type === 'subject' && filteredTopics.length === 0 && (
              <div className="text-center py-16 text-stone-400 text-sm">
                No chapters found matching "{searchFilter}".
              </div>
            )}
            {currentLevel.type === 'topic' && filteredMaterials.length === 0 && (
              <div className="text-center py-16 text-stone-400 text-sm">
                No lectures or notes found matching "{searchFilter}".
              </div>
            )}
          </>
        )}

        {/* LEVEL 0: Subjects List */}
        {!loading && !error && currentLevel.type === 'root' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredSubjects.map((subj) => (
              <div
                key={subj.subjectid}
                onClick={() => handleSelectSubject(subj)}
                className="card-pink-hover bg-[#140a1e]/90 border border-pink-500/20 hover:border-pink-500/40 rounded-xl p-3.5 flex items-center gap-3.5 cursor-pointer group shadow-md"
              >
                {/* Subject Logo / Folder Icon */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-pink-950/20 border border-pink-500/25 flex items-center justify-center shrink-0 p-1">
                  {subj.subject_logo ? (
                    <img
                      src={subj.subject_logo}
                      alt={subj.subject_name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Folder className="w-6 h-6 text-pink-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                    {subj.subject_name}
                  </h3>
                  <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                    Click to view chapters <ChevronRight className="w-3 h-3 text-pink-400" />
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-pink-300" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEVEL 1: Topics / Chapters List */}
        {!loading && !error && currentLevel.type === 'subject' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredTopics.map((top) => (
              <div
                key={top.topicid}
                onClick={() => handleSelectTopic(top)}
                className="card-pink-hover bg-[#140a1e]/90 border border-pink-500/20 hover:border-pink-500/40 rounded-xl p-3.5 flex items-center gap-3.5 cursor-pointer group shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-pink-950/20 border border-pink-500/25 flex items-center justify-center shrink-0 p-1">
                  {top.topic_logo ? (
                    <img
                      src={top.topic_logo}
                      alt={top.topic_name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Folder className="w-5 h-5 text-pink-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-2">
                    {top.topic_name}
                  </h3>
                  <span className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                    View classes & notes
                  </span>
                </div>

                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-pink-300" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LEVEL 2: Lectures & Notes List */}
        {!loading && !error && currentLevel.type === 'topic' && (
          <div className="space-y-3 sm:space-y-4">
            {filteredMaterials.map((item, idx) => {
              const type = (item.material_type || item.type || 'VIDEO').toUpperCase();
              const title = item.Title || item.title || `Lecture ${idx + 1}`;
              const videoId = String(item.id);
              const durationStr = formatDuration(item.duration_in_secs, item.duration);
              const dateStr = item.date_and_time || formatDateTime(item.event_date);
              const pdfUrl = item.pdf_link || item.file_link || item.download_link;

              if (type === 'VIDEO') {
                return (
                  <div
                    key={item.id}
                    className="card-pink-hover bg-[#140a1e]/90 border border-pink-500/20 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 shadow-md group"
                  >
                    {/* Thumbnail */}
                    <div
                      onClick={() => onWatchVideo(videoId, title)}
                      className="w-full sm:w-52 aspect-video bg-black rounded-xl overflow-hidden relative shrink-0 border border-pink-500/10 cursor-pointer"
                    >
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-pink-950/20 text-pink-400">
                          <Play className="w-8 h-8 opacity-60" />
                        </div>
                      )}

                      {/* Play overlay icon */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/50">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>

                      {/* Duration Tag */}
                      {durationStr && (
                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm border border-white/10 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {durationStr}
                        </div>
                      )}
                    </div>

                    {/* Details & Actions */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-pink-500/15 text-pink-300 border border-pink-500/30 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                            Video Class
                          </span>
                          {dateStr && (
                            <span className="text-[11px] text-stone-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {dateStr}
                            </span>
                          )}
                        </div>

                        <h3
                          onClick={() => onWatchVideo(videoId, title)}
                          className="text-sm sm:text-base font-bold text-white hover:text-pink-300 transition-colors cursor-pointer line-clamp-2"
                        >
                          {title}
                        </h3>
                      </div>

                      {/* Bottom buttons (Pink accent) */}
                      <div className="flex items-center gap-2.5 mt-3 pt-2 border-t border-pink-500/10">
                        <button
                          onClick={() => onWatchVideo(videoId, title)}
                          className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-md shadow-pink-500/25 btn-press cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Watch Lecture</span>
                        </button>

                        {pdfUrl && (
                          <button
                            onClick={() => onOpenPdf(pdfUrl, `${title} Notes`)}
                            className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Class Notes</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // PDF or Notes Material Card
              return (
                <div
                  key={item.id}
                  className="card-pink-hover bg-[#140a1e]/90 border border-pink-500/20 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shrink-0 text-pink-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="bg-pink-500/20 text-pink-300 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                          PDF Notes
                        </span>
                        {dateStr && <span className="text-[10px] text-stone-400">{dateStr}</span>}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">{title}</h3>
                    </div>
                  </div>

                  {pdfUrl && (
                    <button
                      onClick={() => onOpenPdf(pdfUrl, title)}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white px-3.5 py-2 rounded-xl text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-md shadow-pink-500/25 shrink-0 btn-press cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Open Notes</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
