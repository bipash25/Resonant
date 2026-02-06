import { useEffect, useRef, useCallback, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Music,
  ChevronDown,
  ListMusic,
  Timer,
  Gauge
} from 'lucide-react';
import { usePlayerStore } from '../store/playerStore';
import api from '../lib/api';

declare global {
  interface Window {
    YT: {
      Player: new (id: string, config: unknown) => YouTubePlayer;
      PlayerState: { ENDED: number; PLAYING: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
  getIframe?: () => HTMLIFrameElement;
  setPlaybackQuality?: (quality: string) => void;
  setPlaybackRate?: (rate: number) => void;
}

// Sleep Timer Popup
function SleepTimerPopup({
  isOpen,
  onClose,
  sleepTimer,
  onSetTimer
}: {
  isOpen: boolean;
  onClose: () => void;
  sleepTimer: number | null;
  onSetTimer: (minutes: number | null) => void;
}) {
  if (!isOpen) return null;

  const options = [
    { label: 'Off', value: null },
    { label: '5 min', value: 5 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
  ];

  return (
    <div className="absolute bottom-full right-0 mb-2 bg-[#282828] rounded-lg shadow-xl p-2 min-w-[140px] z-50">
      <div className="text-xs text-[#b3b3b3] px-2 py-1 mb-1">Sleep Timer</div>
      {options.map((opt) => (
        <button
          key={opt.label}
          onClick={() => { onSetTimer(opt.value); onClose(); }}
          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-[#3e3e3e] transition-colors ${
            sleepTimer === opt.value ? 'text-[#1ed760]' : 'text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Playback Speed Popup
function PlaybackSpeedPopup({
  isOpen,
  onClose,
  speed,
  onSetSpeed
}: {
  isOpen: boolean;
  onClose: () => void;
  speed: number;
  onSetSpeed: (speed: number) => void;
}) {
  if (!isOpen) return null;

  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  return (
    <div className="absolute bottom-full right-0 mb-2 bg-[#282828] rounded-lg shadow-xl p-2 min-w-[100px] z-50">
      <div className="text-xs text-[#b3b3b3] px-2 py-1 mb-1">Speed</div>
      {speeds.map((s) => (
        <button
          key={s}
          onClick={() => { onSetSpeed(s); onClose(); }}
          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-[#3e3e3e] transition-colors ${
            speed === s ? 'text-[#1ed760]' : 'text-white'
          }`}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}

// Full-screen Now Playing Modal for mobile
function NowPlayingModal({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  progress,
  duration,
  volume,
  muted,
  shuffle,
  repeat,
  queue,
  queueIndex,
  playbackSpeed,
  sleepTimer,
  onToggle,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onLike,
  onSetPlaybackSpeed,
  onSetSleepTimer,
  formatTime
}: {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: any;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  queue: any[];
  queueIndex: number;
  playbackSpeed: number;
  sleepTimer: number | null;
  onToggle: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onLike: () => void;
  onSetPlaybackSpeed: (speed: number) => void;
  onSetSleepTimer: (minutes: number | null) => void;
  formatTime: (s: number) => string;
}) {
  const [showSpeedPopup, setShowSpeedPopup] = useState(false);
  const [showTimerPopup, setShowTimerPopup] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#2a2a2a] to-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="p-2 text-white">
          <ChevronDown size={28} />
        </button>
        <div className="text-center">
          <div className="text-xs text-[#b3b3b3] uppercase tracking-wider">Now Playing</div>
          {queue.length > 0 && (
            <div className="text-xs text-[#6a6a6a]">{queueIndex + 1} / {queue.length}</div>
          )}
        </div>
        <button className="p-2 text-[#b3b3b3]">
          <ListMusic size={24} />
        </button>
      </div>

      {/* Album Art */}
      <div className="flex-1 flex items-center justify-center px-8 py-4">
        <div className="w-full max-w-[320px] aspect-square bg-[#282828] rounded-lg shadow-2xl flex items-center justify-center overflow-hidden">
          {currentTrack?.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music size={80} className="text-[#6a6a6a]" />
          )}
        </div>
      </div>

      {/* Track Info & Controls */}
      <div className="px-6 pb-8">
        {/* Track info with like button */}
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0 flex-1">
            <div className="text-xl font-bold text-white truncate">
              {currentTrack?.title || 'No track'}
            </div>
            <div className="text-base text-[#b3b3b3] truncate">
              {currentTrack?.artist || 'Unknown artist'}
            </div>
          </div>
          <button
            onClick={onLike}
            className="p-3 text-[#b3b3b3] hover:text-white transition-colors flex-shrink-0"
          >
            <Heart
              size={24}
              fill={currentTrack?.isLiked ? '#1ed760' : 'transparent'}
              className={currentTrack?.isLiked ? 'text-[#1ed760]' : ''}
            />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={onSeek}
            className="w-full h-1 accent-white"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[#b3b3b3]">{formatTime(progress)}</span>
            <span className="text-xs text-[#b3b3b3]">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onToggleShuffle}
            className={`p-3 transition-colors ${
              shuffle ? 'text-[#1ed760]' : 'text-[#b3b3b3]'
            }`}
          >
            <Shuffle size={22} />
          </button>
          
          <button
            onClick={onPrevious}
            className="p-3 text-white"
            disabled={queue.length === 0}
          >
            <SkipBack size={32} fill="currentColor" />
          </button>
          
          <button
            onClick={onToggle}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center"
            disabled={!currentTrack}
          >
            {isPlaying ? (
              <Pause size={28} fill="black" className="text-black" />
            ) : (
              <Play size={28} fill="black" className="text-black ml-1" />
            )}
          </button>
          
          <button
            onClick={onNext}
            className="p-3 text-white"
            disabled={queue.length === 0}
          >
            <SkipForward size={32} fill="currentColor" />
          </button>
          
          <button
            onClick={onCycleRepeat}
            className={`p-3 transition-colors ${
              repeat !== 'off' ? 'text-[#1ed760]' : 'text-[#b3b3b3]'
            }`}
          >
            {repeat === 'one' ? <Repeat1 size={22} /> : <Repeat size={22} />}
          </button>
        </div>

        {/* Volume & extra controls */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onToggleMute}
            className="p-1 text-[#b3b3b3]"
          >
            {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-white"
          />
        </div>

        {/* Speed & Timer controls */}
        <div className="flex items-center justify-center gap-6">
          <div className="relative">
            <button
              onClick={() => setShowSpeedPopup(!showSpeedPopup)}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm ${
                playbackSpeed !== 1 ? 'text-[#1ed760] bg-[#1ed760]/10' : 'text-[#b3b3b3] bg-[#282828]'
              }`}
            >
              <Gauge size={16} />
              {playbackSpeed}x
            </button>
            <PlaybackSpeedPopup
              isOpen={showSpeedPopup}
              onClose={() => setShowSpeedPopup(false)}
              speed={playbackSpeed}
              onSetSpeed={onSetPlaybackSpeed}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowTimerPopup(!showTimerPopup)}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm ${
                sleepTimer ? 'text-[#1ed760] bg-[#1ed760]/10' : 'text-[#b3b3b3] bg-[#282828]'
              }`}
            >
              <Timer size={16} />
              {sleepTimer ? `${sleepTimer}m` : 'Timer'}
            </button>
            <SleepTimerPopup
              isOpen={showTimerPopup}
              onClose={() => setShowTimerPopup(false)}
              sleepTimer={sleepTimer}
              onSetTimer={onSetSleepTimer}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ytPlayerRef = useRef<YouTubePlayer | null>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<number | null>(null);
  const sleepTimerInterval = useRef<number | null>(null);
  const [ytApiReady, setYtApiReady] = useState(false);
  const [ytPlayerReady, setYtPlayerReady] = useState(false);
  const [ytPlayerKey, setYtPlayerKey] = useState(0);
  const [showNowPlaying, setShowNowPlaying] = useState(false);

  const {
    currentTrack,
    isPlaying,
    volume,
    muted,
    progress,
    duration,
    shuffle,
    repeat,
    queue,
    queueIndex,
    playbackSpeed,
    sleepTimer,
    play,
    pause,
    toggle,
    setVolume,
    toggleMute,
    setProgress,
    setDuration,
    setPlaybackSpeed,
    setSleepTimer,
    checkSleepTimer,
    next,
    previous,
    toggleShuffle,
    cycleRepeat
  } = usePlayerStore();

  // Media Session API - for lock screen controls
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Update metadata when track changes
    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist || 'Unknown artist',
        album: currentTrack.album || '',
        artwork: currentTrack.coverUrl ? [
          { src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' }
        ] : []
      });
    }

    // Set action handlers
    navigator.mediaSession.setActionHandler('play', () => play());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => previous());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        setProgress(details.seekTime);
        if (audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
        }
      }
    });

    // Update playback state
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Update position state
    if (duration > 0) {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: playbackSpeed,
        position: Math.min(progress, duration)
      });
    }

  }, [currentTrack, isPlaying, progress, duration, playbackSpeed, play, pause, previous, next, setProgress]);

  // Sleep timer check
  useEffect(() => {
    if (sleepTimer && isPlaying) {
      sleepTimerInterval.current = window.setInterval(() => {
        checkSleepTimer();
      }, 1000);
    }

    return () => {
      if (sleepTimerInterval.current) {
        clearInterval(sleepTimerInterval.current);
      }
    };
  }, [sleepTimer, isPlaying, checkSleepTimer]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setYtApiReady(true);
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => setYtApiReady(true);
    }
  }, []);

  // Determine source type
  const isYouTube = currentTrack?.sourceType === 'YOUTUBE';
  const isLocal = currentTrack?.sourceType === 'LOCAL';

  // Get local audio URL
  const getLocalUrl = useCallback(() => {
    if (isLocal && currentTrack?.filePath) {
      return `/uploads/${currentTrack.filePath}`;
    }
    return null;
  }, [isLocal, currentTrack]);

  // Handle ended callback
  const handleEnded = useCallback(() => {
    if (repeat === 'one') {
      if (audioRef.current) audioRef.current.currentTime = 0;
      if (ytPlayerRef.current && ytPlayerReady) {
        try {
          ytPlayerRef.current.seekTo(0, true);
        } catch (e) {
          console.warn('Failed to seek YouTube player:', e);
        }
      }
      play();
    } else {
      next();
    }
  }, [repeat, next, play, ytPlayerReady]);

  // Function to clean up YouTube player properly
  const cleanupYouTubePlayer = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    if (ytPlayerRef.current) {
      try {
        const iframe = ytPlayerRef.current.getIframe?.();
        ytPlayerRef.current.destroy();
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      } catch (e) {
        console.warn('Failed to destroy YouTube player:', e);
      }
      ytPlayerRef.current = null;
    }
    
    setYtPlayerReady(false);
    
    const container = ytContainerRef.current;
    if (container) {
      container.innerHTML = '<div id="yt-player"></div>';
    }
  }, []);

  // Handle YouTube player creation
  useEffect(() => {
    cleanupYouTubePlayer();

    if (!ytApiReady || !isYouTube || !currentTrack?.sourceId) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const playerDiv = document.getElementById('yt-player');
      if (!playerDiv) {
        console.warn('YouTube player container not found');
        return;
      }

      try {
        ytPlayerRef.current = new window.YT.Player('yt-player', {
          height: '1',
          width: '1',
          videoId: currentTrack.sourceId,
          playerVars: { 
            autoplay: 1, 
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
            playsinline: 1
          },
          events: {
            onReady: (e: { target: YouTubePlayer }) => {
              setYtPlayerReady(true);
              try {
                if (e.target.setPlaybackQuality) {
                  e.target.setPlaybackQuality('small');
                }
                if (e.target.setPlaybackRate) {
                  e.target.setPlaybackRate(playbackSpeed);
                }
                setDuration(e.target.getDuration());
                e.target.setVolume((muted ? 0 : volume) * 100);
                if (isPlaying) {
                  e.target.playVideo();
                }
              } catch (err) {
                console.warn('YouTube player onReady error:', err);
              }
            },
            onStateChange: (e: { data: number }) => {
              if (e.data === window.YT.PlayerState.ENDED) {
                handleEnded();
              }
            },
            onError: (e: { data: number }) => {
              console.error('YouTube player error:', e.data);
              next();
            }
          }
        });
      } catch (e) {
        console.error('Failed to create YouTube player:', e);
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [ytApiReady, isYouTube, currentTrack?.sourceId, cleanupYouTubePlayer]);

  // Cleanup YouTube when switching away from YouTube source
  useEffect(() => {
    if (!isYouTube && ytPlayerRef.current) {
      cleanupYouTubePlayer();
      setYtPlayerKey(prev => prev + 1);
    }
  }, [isYouTube, cleanupYouTubePlayer]);

  // Sync YouTube playback state
  useEffect(() => {
    if (!ytPlayerReady || !ytPlayerRef.current || !isYouTube) return;
    
    try {
      if (isPlaying) {
        ytPlayerRef.current.playVideo();
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        progressInterval.current = window.setInterval(() => {
          if (ytPlayerRef.current && ytPlayerReady) {
            try {
              setProgress(ytPlayerRef.current.getCurrentTime());
            } catch (e) {
              // Player might not be ready
            }
          }
        }, 1000);
      } else {
        ytPlayerRef.current.pauseVideo();
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
          progressInterval.current = null;
        }
      }
    } catch (e) {
      console.warn('Failed to sync YouTube playback:', e);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, ytPlayerReady, isYouTube, setProgress]);

  // Sync YouTube volume
  useEffect(() => {
    if (ytPlayerRef.current && ytPlayerReady) {
      try {
        ytPlayerRef.current.setVolume((muted ? 0 : volume) * 100);
      } catch (e) {
        // Ignore
      }
    }
  }, [volume, muted, ytPlayerReady]);

  // Sync YouTube playback speed
  useEffect(() => {
    if (ytPlayerRef.current && ytPlayerReady) {
      try {
        if (ytPlayerRef.current.setPlaybackRate) {
          ytPlayerRef.current.setPlaybackRate(playbackSpeed);
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [playbackSpeed, ytPlayerReady]);

  // Handle local audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLocal) return;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEndedLocal = () => handleEnded();

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEndedLocal);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEndedLocal);
    };
  }, [isLocal, setProgress, setDuration, handleEnded]);

  // Sync local audio playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLocal) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying, isLocal, currentTrack]);

  // Sync local audio volume
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  // Sync local audio playback speed
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Seek handler
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setProgress(time);
    
    if (audioRef.current && isLocal) {
      audioRef.current.currentTime = time;
    }
    if (ytPlayerRef.current && ytPlayerReady && isYouTube) {
      try {
        ytPlayerRef.current.seekTo(time, true);
      } catch (e) {
        console.warn('Failed to seek:', e);
      }
    }
  }, [setProgress, isLocal, isYouTube, ytPlayerReady]);

  // Like track
  const handleLike = async () => {
    if (!currentTrack) return;
    try {
      await api.post(`/tracks/${currentTrack.id}/like`);
    } catch (err) {
      console.error('Failed to like track:', err);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowLeft':
          if (e.shiftKey) previous();
          else handleSeek({ target: { value: String(Math.max(0, progress - 10)) } } as React.ChangeEvent<HTMLInputElement>);
          break;
        case 'ArrowRight':
          if (e.shiftKey) next();
          else handleSeek({ target: { value: String(Math.min(duration, progress + 10)) } } as React.ChangeEvent<HTMLInputElement>);
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'Escape':
          setShowNowPlaying(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, next, previous, toggleMute, progress, duration, handleSeek]);

  const localUrl = getLocalUrl();

  return (
    <>
      {/* Full-screen Now Playing Modal */}
      <NowPlayingModal
        isOpen={showNowPlaying}
        onClose={() => setShowNowPlaying(false)}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        volume={volume}
        muted={muted}
        shuffle={shuffle}
        repeat={repeat}
        queue={queue}
        queueIndex={queueIndex}
        playbackSpeed={playbackSpeed}
        sleepTimer={sleepTimer}
        onToggle={toggle}
        onNext={next}
        onPrevious={previous}
        onSeek={handleSeek}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
        onToggleShuffle={toggleShuffle}
        onCycleRepeat={cycleRepeat}
        onLike={handleLike}
        onSetPlaybackSpeed={setPlaybackSpeed}
        onSetSleepTimer={setSleepTimer}
        formatTime={formatTime}
      />

      <div className="h-16 md:h-20 bg-[#181818] border-t border-[#282828] flex items-center px-2 md:px-4">
        {/* Hidden audio element for local files */}
        {localUrl && (
          <audio ref={audioRef} src={localUrl} preload="metadata" />
        )}
        
        {/* Hidden YouTube player container */}
        <div 
          ref={ytContainerRef}
          key={ytPlayerKey}
          style={{ position: 'absolute', top: -9999, left: -9999, width: 1, height: 1, overflow: 'hidden' }}
        >
          <div id="yt-player"></div>
        </div>

        {/* Track info - clickable on mobile to open full-screen */}
        <div 
          className="flex items-center gap-2 md:gap-4 w-auto md:w-[30%] md:min-w-[180px] cursor-pointer md:cursor-default"
          onClick={() => currentTrack && window.innerWidth < 768 && setShowNowPlaying(true)}
        >
          {currentTrack ? (
            <>
              <div className="w-10 h-10 md:w-14 md:h-14 bg-[#282828] rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                {currentTrack.coverUrl ? (
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music size={20} className="text-[#6a6a6a]" />
                )}
              </div>
              <div className="min-w-0 flex-1 md:flex-initial max-w-[120px] md:max-w-none">
                <div className="text-xs md:text-sm font-medium text-white truncate">
                  {currentTrack.title}
                </div>
                <div className="text-xs text-[#b3b3b3] truncate">
                  {currentTrack.artist}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleLike(); }}
                className="p-1 md:p-2 text-[#b3b3b3] hover:text-white transition-colors flex-shrink-0 hidden md:block"
              >
                <Heart
                  size={16}
                  fill={currentTrack.isLiked ? '#1ed760' : 'transparent'}
                  className={currentTrack.isLiked ? 'text-[#1ed760]' : ''}
                />
              </button>
            </>
          ) : (
            <div className="text-xs md:text-sm text-[#6a6a6a]">No track</div>
          )}
        </div>

        {/* Playback controls - centered */}
        <div className="flex flex-col items-center flex-1 max-w-[722px] px-2">
          <div className="flex items-center gap-2 md:gap-4 mb-1 md:mb-2">
            <button
              onClick={toggleShuffle}
              className={`p-1 transition-colors hidden md:block ${
                shuffle ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
              }`}
            >
              <Shuffle size={16} />
            </button>
            
            <button
              onClick={previous}
              className="p-1 text-[#b3b3b3] hover:text-white transition-colors"
              disabled={queue.length === 0}
            >
              <SkipBack size={18} className="md:w-5 md:h-5" fill="currentColor" />
            </button>
            
            <button
              onClick={toggle}
              className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              disabled={!currentTrack}
            >
              {isPlaying ? (
                <Pause size={16} fill="black" className="text-black" />
              ) : (
                <Play size={16} fill="black" className="text-black ml-0.5" />
              )}
            </button>
            
            <button
              onClick={next}
              className="p-1 text-[#b3b3b3] hover:text-white transition-colors"
              disabled={queue.length === 0}
            >
              <SkipForward size={18} className="md:w-5 md:h-5" fill="currentColor" />
            </button>
            
            <button
              onClick={cycleRepeat}
              className={`p-1 transition-colors hidden md:block ${
                repeat !== 'off' ? 'text-[#1ed760]' : 'text-[#b3b3b3] hover:text-white'
              }`}
            >
              {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>

          {/* Progress bar - hidden on mobile in mini player */}
          <div className="hidden md:flex items-center gap-2 w-full">
            <span className="text-xs text-[#b3b3b3] w-10 text-right">
              {formatTime(progress)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-1 accent-white"
            />
            <span className="text-xs text-[#b3b3b3] w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & expand button */}
        <div className="flex items-center gap-2 w-auto md:w-[30%] justify-end">
          {/* Mobile: show expand button */}
          <button
            onClick={() => setShowNowPlaying(true)}
            className="p-2 text-[#b3b3b3] hover:text-white md:hidden"
            disabled={!currentTrack}
          >
            <ChevronDown size={20} className="rotate-180" />
          </button>

          {/* Desktop: extra controls */}
          <span className="text-xs text-[#6a6a6a] mr-1 hidden md:block">
            {playbackSpeed !== 1 && `${playbackSpeed}x`}
          </span>
          <span className="text-xs text-[#6a6a6a] mr-2 hidden md:block">
            {queue.length > 0 && `${queueIndex + 1}/${queue.length}`}
          </span>
          <button
            onClick={toggleMute}
            className="p-1 text-[#b3b3b3] hover:text-white transition-colors hidden md:block"
          >
            {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1 accent-white hidden md:block"
          />
        </div>
      </div>
    </>
  );
}
