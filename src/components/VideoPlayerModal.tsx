import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  FileText,
  Settings,
  Download,
  AlertCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { fetchVideoDetails } from '../services/api';
import { VideoDetailsResponse, QualityOption } from '../types';
import { BRAND } from '../constants';

interface VideoPlayerModalProps {
  courseId: string;
  videoId: string;
  onClose: () => void;
  onOpenPdf: (url: string, title?: string) => void;
  batchTitle?: string;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  courseId,
  videoId,
  onClose,
  onOpenPdf,
  batchTitle,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoDetailsResponse | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedQuality, setSelectedQuality] = useState<string>('auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Player mode: 'hls' | 'mp4' | 'yt' | 'iframe'
  const [playerMode, setPlayerMode] = useState<'hls' | 'mp4' | 'yt' | 'iframe'>('hls');
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safe Play wrapper to prevent "The play() request was interrupted by a call to pause()"
  const safePlay = () => {
    if (!videoRef.current) return;
    try {
      const promise = videoRef.current.play();
      if (promise !== undefined) {
        playPromiseRef.current = promise;
        promise
          .then(() => {
            playPromiseRef.current = null;
          })
          .catch((err) => {
            playPromiseRef.current = null;
            // AbortError is normal when a pause or source switch interrupts play()
            if (err && err.name !== 'AbortError') {
              console.warn('Playback prevented:', err);
            }
          });
      }
    } catch {
      // Ignore synchronous play error
    }
  };

  // Safe Pause wrapper to await any in-flight play promise
  const safePause = () => {
    if (!videoRef.current) return;
    if (playPromiseRef.current) {
      playPromiseRef.current
        .then(() => {
          if (videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
          }
        })
        .catch(() => {});
    } else {
      if (!videoRef.current.paused) {
        videoRef.current.pause();
      }
    }
  };

  // Fetch video details
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchVideoDetails(courseId, videoId)
      .then((data) => {
        if (!isMounted) return;
        setVideoData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Failed to load video details:', err);
        setError(err.message || 'Unable to load video details from server');
        setLoading(false);
      });

    return () => {
      isMounted = false;
      safePause();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [courseId, videoId]);

  // Setup playback once videoData is loaded
  useEffect(() => {
    if (!videoData) return;

    // Check for YouTube
    const defLink = videoData.decoded_video_link || '';
    const isYT = defLink && !defLink.includes('http') && defLink.length === 11;
    if (isYT) {
      setPlayerMode('yt');
      setYtVideoId(defLink);
      return;
    }

    if (defLink.includes('youtube.com') || defLink.includes('youtu.be')) {
      const match = defLink.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match) {
        setPlayerMode('yt');
        setYtVideoId(match[1]);
        return;
      }
    }

    // Check for direct MP4
    let directMp4Url: string | null = null;
    if (videoData.player_url && videoData.player_url.includes('url=')) {
      const match = videoData.player_url.match(/url=([^&]+)/);
      if (match) {
        const extUrl = decodeURIComponent(match[1]);
        if (extUrl.toLowerCase().includes('.mp4')) {
          directMp4Url = extUrl;
        }
      }
    }
    if (!directMp4Url && defLink.toLowerCase().includes('.mp4')) {
      directMp4Url = defLink;
    }

    // If direct MP4
    if (directMp4Url && (!videoData.qualities || videoData.qualities.length === 0)) {
      setPlayerMode('mp4');
      if (videoRef.current) {
        videoRef.current.src = directMp4Url;
        safePlay();
      }
      return;
    }

    // Default to HLS
    setPlayerMode('hls');
    startHlsStream();
  }, [videoData, selectedQuality]);

  const startHlsStream = () => {
    if (!videoRef.current || !videoData) return;

    safePause();
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const videoEl = videoRef.current;
    const qualities = videoData.qualities || [];
    let targetRawUrl = '';

    if (selectedQuality !== 'auto') {
      const q = qualities.find((item) => item.quality === selectedQuality);
      if (q) targetRawUrl = q.url || q.path || '';
    }

    if (!targetRawUrl) {
      if (qualities.length > 0) {
        // Prefer 720p, 480p, or first
        const pref =
          qualities.find((q) => q.quality === '720p') ||
          qualities.find((q) => q.quality === '480p') ||
          qualities[0];
        targetRawUrl = pref.url || pref.path || '';
      } else if (videoData.decoded_video_link) {
        targetRawUrl = videoData.decoded_video_link;
      }
    }

    if (!targetRawUrl) {
      if (videoData.player_url) {
        setPlayerMode('iframe');
        return;
      }
      setError('No playable video stream found');
      return;
    }

    // Stream through our /video proxy
    const streamProxyUrl = `/video?url=${encodeURIComponent(targetRawUrl)}`;

    if (Hls.isSupported()) {
      const hls = new Hls({
        startPosition: -1,
        enableWorker: true,
        lowLatencyMode: true,
        xhrSetup: (xhr) => {
          xhr.withCredentials = false;
        },
      });

      hls.loadSource(streamProxyUrl);
      hls.attachMedia(videoEl);
      hlsRef.current = hls;

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setError(null);
        safePlay();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              if (videoData.decoded_video_link && targetRawUrl !== videoData.decoded_video_link) {
                videoEl.src = `/video?url=${encodeURIComponent(videoData.decoded_video_link)}`;
                safePlay();
              } else if (videoData.player_url) {
                setPlayerMode('iframe');
              } else {
                setError('Stream network error. Click retry or use alternate player.');
              }
              break;
          }
        }
      });
    } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple Safari HLS
      videoEl.src = streamProxyUrl;
      safePlay();
    } else {
      // Fallback
      if (videoData.player_url) {
        setPlayerMode('iframe');
      } else {
        setError('HLS playback is not supported by your browser');
      }
    }

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(videoEl.currentTime);
    const onDurationChange = () => setDuration(videoEl.duration || 0);

    videoEl.addEventListener('play', onPlay);
    videoEl.addEventListener('pause', onPause);
    videoEl.addEventListener('timeupdate', onTimeUpdate);
    videoEl.addEventListener('durationchange', onDurationChange);

    return () => {
      videoEl.removeEventListener('play', onPlay);
      videoEl.removeEventListener('pause', onPause);
      videoEl.removeEventListener('timeupdate', onTimeUpdate);
      videoEl.removeEventListener('durationchange', onDurationChange);
    };
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      safePlay();
    } else {
      safePause();
    }
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
    );
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMute = !isMuted;
    setIsMuted(newMute);
    videoRef.current.muted = newMute;
  };

  const handleSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettingsMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const pdfUrl = videoData?.decoded_pdf_link || videoData?.pdf_viewer;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-0 sm:p-4 overflow-hidden"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === ' ' || e.key === 'k') {
          e.preventDefault();
          togglePlay();
        }
        if (e.key === 'ArrowLeft') skipTime(-10);
        if (e.key === 'ArrowRight') skipTime(10);
        if (e.key === 'f') toggleFullscreen();
      }}
      tabIndex={0}
    >
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className="relative w-full h-full sm:max-w-6xl sm:max-h-[92vh] sm:rounded-2xl bg-black border border-pink-500/30 overflow-hidden flex flex-col justify-between shadow-2xl shadow-pink-500/15"
      >
        {/* Top Control Bar */}
        <div
          className={`absolute top-0 inset-x-0 z-30 bg-gradient-to-b from-black/95 via-black/70 to-transparent p-4 sm:p-6 flex items-center justify-between gap-3 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Title info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-pink-500/40 p-0.5 shrink-0 hidden sm:block bg-black">
              <img src={BRAND.logo} alt="GB STUDY" className="w-full h-full object-cover rounded" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-pink-400 font-bold uppercase tracking-wider block truncate">
                {batchTitle || BRAND.name}
              </span>
              <h2 className="text-xs sm:text-sm md:text-base font-bold text-white truncate">
                {videoData?.title || 'Loading Lecture...'}
              </h2>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {pdfUrl && (
              <button
                onClick={() => onOpenPdf(pdfUrl, `${videoData?.title || 'Lecture'} Notes`)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md shadow-pink-500/30 btn-press cursor-pointer"
                title="View PDF Notes"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Class Notes</span>
                <span className="sm:hidden">Notes</span>
              </button>
            )}

            {/* Alternate Player switch */}
            {videoData?.player_url && (
              <button
                onClick={() => setPlayerMode(playerMode === 'iframe' ? 'hls' : 'iframe')}
                className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-stone-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Toggle Web Player"
              >
                <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
                <span>{playerMode === 'iframe' ? 'Custom Player' : 'Web Player'}</span>
              </button>
            )}

            <button
              onClick={() => {
                safePause();
                onClose();
              }}
              className="p-2 text-stone-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              title="Close Player (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Main Viewport */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-pink-400">
              <Loader2 className="w-10 h-10 animate-spin" />
              <p className="text-xs text-stone-300 font-medium tracking-wide">
                Connecting video stream...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center text-center p-6 max-w-md bg-[#160a22]/95 border border-pink-500/30 rounded-2xl gap-3">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <h3 className="text-sm font-bold text-white">Playback Error</h3>
              <p className="text-xs text-stone-300 leading-relaxed">{error}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => {
                    setError(null);
                    startHlsStream();
                  }}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
                {videoData?.player_url && (
                  <button
                    onClick={() => {
                      setError(null);
                      setPlayerMode('iframe');
                    }}
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Web Player
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 1. YouTube Player Mode */}
          {playerMode === 'yt' && ytVideoId && (
            <iframe
              src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&rel=0`}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
            />
          )}

          {/* 2. Embedded Akamai Web Player Mode */}
          {playerMode === 'iframe' && videoData?.player_url && (
            <iframe
              src={videoData.player_url}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
            />
          )}

          {/* 3. Native / HLS HTML5 Video Tag */}
          {(playerMode === 'hls' || playerMode === 'mp4') && (
            <video
              ref={videoRef}
              onClick={togglePlay}
              playsInline
              className={`w-full h-full object-contain cursor-pointer ${
                loading || error ? 'hidden' : 'block'
              }`}
            />
          )}
        </div>

        {/* Video Controls Overlay for HTML5 / HLS Player */}
        {(playerMode === 'hls' || playerMode === 'mp4') && (
          <div
            className={`absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-4 sm:p-6 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Timeline Progress Bar */}
            <div className="flex items-center gap-3 mb-2.5">
              <span className="text-[11px] font-mono text-stone-300 min-w-[45px]">
                {formatTime(currentTime)}
              </span>
              <div className="relative flex-1 flex items-center group">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500 group-hover:h-2.5 transition-all"
                />
              </div>
              <span className="text-[11px] font-mono text-stone-400 min-w-[45px]">
                {formatTime(duration)}
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-between gap-3">
              {/* Play & Skip Buttons */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={togglePlay}
                  className="p-2 sm:p-2.5 bg-pink-500 hover:bg-pink-400 text-white rounded-xl shadow-md shadow-pink-500/30 btn-press cursor-pointer"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => skipTime(-10)}
                  className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Rewind 10s (←)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => skipTime(10)}
                  className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Forward 10s (→)"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Volume slider */}
                <div className="hidden sm:flex items-center gap-1.5 ml-2 group">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolume}
                    className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
              </div>

              {/* Settings (Speed, Quality, Fullscreen) */}
              <div className="flex items-center gap-1 sm:gap-2 relative">
                {/* Speed & Quality Menu Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/15 text-stone-200 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-pink-400" />
                    <span>{playbackSpeed}x</span>
                  </button>

                  {/* Settings dropdown menu */}
                  {showSettingsMenu && (
                    <div className="absolute bottom-11 right-0 bg-[#160a22] border border-pink-500/30 rounded-xl p-3 shadow-2xl min-w-[200px] z-50 text-xs">
                      <div className="text-stone-400 font-bold uppercase text-[10px] tracking-wider mb-2 border-b border-white/10 pb-1">
                        Playback Speed
                      </div>
                      <div className="grid grid-cols-3 gap-1 mb-3">
                        {[0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleSpeed(s)}
                            className={`py-1 rounded text-center font-bold cursor-pointer ${
                              playbackSpeed === s
                                ? 'bg-pink-500 text-white'
                                : 'bg-white/5 text-stone-300 hover:bg-white/10'
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>

                      {/* Stream Quality Selector */}
                      {videoData?.qualities && videoData.qualities.length > 0 && (
                        <>
                          <div className="text-stone-400 font-bold uppercase text-[10px] tracking-wider mb-2 border-b border-white/10 pb-1">
                            Stream Quality
                          </div>
                          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                            <button
                              onClick={() => {
                                setSelectedQuality('auto');
                                setShowSettingsMenu(false);
                              }}
                              className={`text-left px-2 py-1 rounded font-medium cursor-pointer ${
                                selectedQuality === 'auto'
                                  ? 'bg-pink-500/20 text-pink-400'
                                  : 'text-stone-300 hover:bg-white/5'
                              }`}
                            >
                              Auto
                            </button>
                            {videoData.qualities.map((q: QualityOption, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSelectedQuality(q.quality);
                                  setShowSettingsMenu(false);
                                }}
                                className={`text-left px-2 py-1 rounded font-medium cursor-pointer ${
                                  selectedQuality === q.quality
                                    ? 'bg-pink-500/20 text-pink-400'
                                    : 'text-stone-300 hover:bg-white/5'
                                }`}
                              >
                                {q.quality}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                  title="Toggle Fullscreen (F)"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
