import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { BatchCard } from './components/BatchCard';
import { CourseView } from './components/CourseView';
import { TelegramModal } from './components/TelegramModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { fetchBatchesList } from './services/api';
import { BatchItem } from './types';
import { Loader2, BookmarkX, Layers, CheckCircle2 } from 'lucide-react';

const BATCHES_PER_PAGE = 12;

export default function App() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'all' | 'wishlist'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [displayedCount, setDisplayedCount] = useState(BATCHES_PER_PAGE);

  // Enrollments saved in localStorage
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gbstudy_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected Course for deep navigation
  const [selectedCourse, setSelectedCourse] = useState<BatchItem | null>(null);

  // Modal States
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ courseId: string; videoId: string; title?: string } | null>(null);
  const [activePdf, setActivePdf] = useState<{ url: string; title: string } | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Load batches on initial render
  useEffect(() => {
    fetchBatchesList()
      .then((data) => {
        setBatches(data);
        setLoading(false);

        // Check if course is in URL search params (e.g., ?id=364 or ?courseId=364)
        const params = new URLSearchParams(window.location.search);
        const cid = params.get('id') || params.get('courseId');
        if (cid) {
          const found = data.find((b) => String(b.id || b.batch_id) === String(cid));
          if (found) {
            setSelectedCourse(found);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching batches:', err);
        setLoading(false);
      });

    // Show Telegram popup automatically on site load
    const timer = setTimeout(() => {
      setIsTelegramOpen(true);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const cid = params.get('id') || params.get('courseId');
      if (cid && batches.length > 0) {
        const found = batches.find((b) => String(b.id || b.batch_id) === String(cid));
        if (found) {
          setSelectedCourse(found);
          return;
        }
      }
      setSelectedCourse(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [batches]);

  // Keyboard shortcut ⌘K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleEnroll = (batchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const idStr = String(batchId);
    let updated: string[];

    if (wishlist.includes(idStr)) {
      updated = wishlist.filter((id) => id !== idStr);
      showToast('Removed from My Enrollments');
    } else {
      updated = [...wishlist, idStr];
      showToast('Saved to My Enrollments!');
    }

    setWishlist(updated);
    try {
      localStorage.setItem('gbstudy_wishlist', JSON.stringify(updated));
    } catch (err) {
      console.warn('Could not save to localStorage', err);
    }
  };

  const handleSelectCourse = (batch: BatchItem) => {
    setSelectedCourse(batch);
    const id = String(batch.id || batch.batch_id);
    const newUrl = `${window.location.pathname}?id=${id}`;
    window.history.pushState({ courseId: id }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToBatches = () => {
    setSelectedCourse(null);
    window.history.pushState({}, '', window.location.pathname);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter batches based on tab, category, and search query
  const filteredBatches = batches.filter((batch) => {
    const id = String(batch.id || batch.batch_id);
    const title = (batch.title || batch.batch_name || '').toLowerCase();

    // Tab filter
    if (currentTab === 'wishlist' && !wishlist.includes(id)) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'All') {
      const matchCat =
        (selectedCategory === 'CTET' && title.includes('ctet')) ||
        (selectedCategory === 'BPSC TRE' && (title.includes('bpsc') || title.includes('bihar tre'))) ||
        (selectedCategory === 'KVS/NVS' && (title.includes('kvs') || title.includes('nvs'))) ||
        (selectedCategory === 'UP SUPERTET' && title.includes('supertet')) ||
        (selectedCategory === 'UP TGT/PGT' && (title.includes('tgt') || title.includes('pgt'))) ||
        (selectedCategory === 'JHARKHAND TET' && title.includes('jharkhand'));
      if (!matchCat) return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return title.includes(q) || id.includes(q);
    }

    return true;
  });

  const visibleBatches = filteredBatches.slice(0, displayedCount);

  return (
    <div className="min-h-screen flex flex-col font-sans text-stone-100 bg-[#0b0612] antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs bg-pink-950/95 border border-pink-500/50 text-pink-200 shadow-2xl shadow-pink-500/30 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedCourse(null);
          setCurrentTab(tab);
          setDisplayedCount(BATCHES_PER_PAGE);
        }}
        enrollmentCount={wishlist.length}
        onOpenTelegram={() => setIsTelegramOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onGoHome={handleBackToBatches}
      />

      {/* Main Content Area with bottom navigation clearance */}
      <main className="flex-1 pb-20 md:pb-8">
        {selectedCourse ? (
          /* Course Hierarchy View */
          <CourseView
            batch={selectedCourse}
            isEnrolled={wishlist.includes(String(selectedCourse.id || selectedCourse.batch_id))}
            onToggleEnroll={handleToggleEnroll}
            onBackToBatches={handleBackToBatches}
            onWatchVideo={(videoId, title) => {
              setActiveVideo({
                courseId: String(selectedCourse.id || selectedCourse.batch_id),
                videoId,
                title,
              });
            }}
            onOpenPdf={(url, title) => {
              setActivePdf({ url, title: title || 'Lecture Notes' });
            }}
            onShowToast={showToast}
          />
        ) : (
          /* Batches Grid / Home View */
          <div>
            <HeroBanner
              searchQuery={searchQuery}
              onSearchChange={(q) => {
                setSearchQuery(q);
                setDisplayedCount(BATCHES_PER_PAGE);
              }}
              selectedCategory={selectedCategory}
              onCategoryChange={(cat) => {
                setSelectedCategory(cat);
                setDisplayedCount(BATCHES_PER_PAGE);
              }}
              onOpenTelegram={() => setIsTelegramOpen(true)}
              totalBatches={batches.length}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
              {/* Section Header */}
              <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-pink-500" />
                    <span>
                      {currentTab === 'wishlist' ? 'My Enrolled Batches' : 'Explore All Batches'}
                    </span>
                  </h2>
                  <p className="text-xs text-stone-400 mt-1">
                    {currentTab === 'wishlist'
                      ? 'Batches you have saved for regular study'
                      : `Showing ${visibleBatches.length} of ${filteredBatches.length} batches`}
                  </p>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-pink-400">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p className="text-xs text-stone-300 font-medium">Loading courses...</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredBatches.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-[#130a1e]/60 border border-pink-500/20 rounded-3xl max-w-md mx-auto">
                  <BookmarkX className="w-12 h-12 text-pink-500/50 mb-3" />
                  <h3 className="text-base font-bold text-white">No Batches Found</h3>
                  <p className="text-xs text-stone-400 mt-1 max-w-xs">
                    {currentTab === 'wishlist'
                      ? 'You have not enrolled in any batch yet. Explore batches and click "Heart" to save.'
                      : 'No batches match your selected search or category filters.'}
                  </p>
                  {currentTab === 'wishlist' && (
                    <button
                      onClick={() => setCurrentTab('all')}
                      className="mt-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-pink-500/30 btn-press cursor-pointer"
                    >
                      Browse All Batches
                    </button>
                  )}
                </div>
              )}

              {/* Mobile First Adaptive Responsive Batches Grid */}
              {/* On Mobile: 1 column wide cards (matching Screenshot 2!) */}
              {/* On Tablet: 2 columns */}
              {/* On Laptop/Desktop: 3 columns */}
              {!loading && filteredBatches.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                  {visibleBatches.map((batch) => {
                    const id = String(batch.id || batch.batch_id);
                    return (
                      <BatchCard
                        key={id}
                        batch={batch}
                        isEnrolled={wishlist.includes(id)}
                        onToggleEnroll={handleToggleEnroll}
                        onStudy={handleSelectCourse}
                      />
                    );
                  })}
                </div>
              )}

              {/* Load More Button */}
              {!loading && visibleBatches.length < filteredBatches.length && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={() => setDisplayedCount((prev) => prev + BATCHES_PER_PAGE)}
                    className="bg-[#160a22]/90 hover:bg-pink-500/20 border border-pink-500/30 hover:border-pink-500/60 text-stone-200 hover:text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all btn-press cursor-pointer"
                  >
                    <span>Load More Batches</span>
                    <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2.5 py-0.5 rounded-full font-mono">
                      +{filteredBatches.length - visibleBatches.length} remaining
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Global Footer (with margin for mobile bottom bar) */}
      <div className="mb-14 md:mb-0">
        <Footer onOpenTelegram={() => setIsTelegramOpen(true)} />
      </div>

      {/* Mobile Bottom Navigation Bar (Matching Screenshot) */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedCourse(null);
          setCurrentTab(tab);
          setDisplayedCount(BATCHES_PER_PAGE);
        }}
        savedCount={wishlist.length}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenTelegram={() => setIsTelegramOpen(true)}
        onGoHome={handleBackToBatches}
        isInsideCourse={!!selectedCourse}
      />

      {/* Telegram Channel Popup */}
      <TelegramModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
      />

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        batches={batches}
        onSelectBatch={handleSelectCourse}
      />

      {/* Video Player Modal */}
      {activeVideo && (
        <VideoPlayerModal
          courseId={activeVideo.courseId}
          videoId={activeVideo.videoId}
          batchTitle={activeVideo.title}
          onClose={() => setActiveVideo(null)}
          onOpenPdf={(url, title) => {
            setActivePdf({ url, title: title || 'Lecture Notes' });
          }}
        />
      )}

      {/* PDF Notes Viewer Modal */}
      {activePdf && (
        <PdfViewerModal
          url={activePdf.url}
          title={activePdf.title}
          onClose={() => setActivePdf(null)}
        />
      )}
    </div>
  );
}
