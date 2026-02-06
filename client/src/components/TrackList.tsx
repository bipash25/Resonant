import { Play, Pause, MoreHorizontal, Heart, Music } from 'lucide-react';
import type { Track } from '../types';
import { usePlayerStore } from '../store/playerStore';
import api from '../lib/api';

interface TrackListProps {
  tracks: Track[];
  showIndex?: boolean;
  onPlay?: (track: Track, index: number) => void;
}

export function TrackList({ tracks, showIndex = true, onPlay }: TrackListProps) {
  const { currentTrack, isPlaying, setQueue, toggle } = usePlayerStore();

  const handlePlay = async (track: Track, index: number) => {
    // Record play for recently played
    try {
      api.post(`/tracks/${track.id}/play`).catch(() => {});
    } catch (e) {
      // Ignore errors for analytics
    }

    if (onPlay) {
      onPlay(track, index);
    } else {
      // Default: set entire list as queue
      setQueue(tracks, index);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCurrentTrack = (track: Track) => currentTrack?.id === track.id;

  return (
    <div className="w-full">
      {/* Header - hidden on mobile */}
      <div className="hidden md:grid grid-cols-[16px_4fr_3fr_1fr] gap-4 px-4 py-2 text-xs text-[#b3b3b3] border-b border-[#282828] uppercase tracking-wider">
        <div className="text-center">#</div>
        <div>Title</div>
        <div>Album</div>
        <div className="text-right">Duration</div>
      </div>

      {/* Tracks */}
      <div className="divide-y divide-[#282828]/50">
        {tracks.map((track, index) => {
          const isCurrent = isCurrentTrack(track);
          
          return (
            <div
              key={track.id}
              className="flex md:grid md:grid-cols-[16px_4fr_3fr_1fr] gap-2 md:gap-4 px-2 md:px-4 py-2 md:py-3 hover:bg-white/10 rounded group cursor-pointer"
              onClick={() => handlePlay(track, index)}
              onDoubleClick={() => handlePlay(track, index)}
            >
              {/* Index / Play button - hidden on mobile */}
              <div className="hidden md:flex items-center justify-center">
                {isCurrent && isPlaying ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggle(); }}
                    className="text-[#1ed760]"
                  >
                    <Pause size={14} fill="currentColor" />
                  </button>
                ) : (
                  <>
                    <span className={`group-hover:hidden text-sm ${isCurrent ? 'text-[#1ed760]' : 'text-[#b3b3b3]'}`}>
                      {showIndex ? index + 1 : ''}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePlay(track, index); }}
                      className="hidden group-hover:block text-white"
                    >
                      <Play size={14} fill="currentColor" />
                    </button>
                  </>
                )}
              </div>

              {/* Title & Artist */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 md:w-10 md:h-10 bg-[#282828] rounded flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                  {track.coverUrl ? (
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music size={16} className="text-[#6a6a6a]" />
                  )}
                  {/* Mobile play indicator */}
                  {isCurrent && isPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center md:hidden">
                      <Pause size={16} fill="white" className="text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-medium truncate ${isCurrent ? 'text-[#1ed760]' : 'text-white'}`}>
                    {track.title}
                  </div>
                  <div className="text-xs text-[#b3b3b3] truncate">
                    {track.artist || 'Unknown Artist'}
                  </div>
                </div>
              </div>

              {/* Album - hidden on mobile */}
              <div className="hidden md:flex items-center text-sm text-[#b3b3b3] truncate">
                {track.album || '-'}
              </div>

              {/* Duration & Actions */}
              <div className="flex items-center justify-end gap-1 md:gap-2">
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-[#b3b3b3] hover:text-white opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Heart size={14} fill={track.isLiked ? '#1ed760' : 'transparent'} className={track.isLiked ? 'text-[#1ed760]' : ''} />
                </button>
                <span className="text-xs md:text-sm text-[#b3b3b3] w-10 md:w-12 text-right">
                  {formatDuration(track.duration)}
                </span>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-[#b3b3b3] hover:text-white hidden md:block opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
