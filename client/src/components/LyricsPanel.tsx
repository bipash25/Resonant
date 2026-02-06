import { useState, useEffect } from 'react';
import { X, Music2, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { Track } from '../types';

interface LyricsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export default function LyricsPanel({ isOpen, onClose, track }: LyricsPanelProps) {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !track) {
      setLyrics(null);
      setError(null);
      return;
    }

    const fetchLyrics = async () => {
      if (!track.artist || !track.title) {
        setError('Artist and title required to fetch lyrics');
        return;
      }

      setLoading(true);
      setError(null);
      setLyrics(null);

      try {
        const res = await api.get(`/tracks/lyrics/${encodeURIComponent(track.artist)}/${encodeURIComponent(track.title)}`);
        if (res.data.lyrics) {
          setLyrics(res.data.lyrics);
        } else {
          setError('Lyrics not found');
        }
      } catch {
        setError('Lyrics not found for this track');
      } finally {
        setLoading(false);
      }
    };

    fetchLyrics();
  }, [isOpen, track?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
      <div 
        className="w-full max-w-md bg-[#121212] h-full flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282828]">
          <div className="flex items-center gap-3">
            <Music2 className="w-5 h-5 text-[#1ed760]" />
            <h2 className="text-lg font-bold text-white">Lyrics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#282828] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#b3b3b3]" />
          </button>
        </div>

        {/* Track Info */}
        {track && (
          <div className="p-4 border-b border-[#282828]">
            <p className="text-white font-medium truncate">{track.title}</p>
            <p className="text-sm text-[#b3b3b3] truncate">{track.artist}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 text-[#b3b3b3]">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Searching for lyrics...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-64 text-[#b3b3b3]">
              <Music2 className="w-12 h-12 mb-4 opacity-50" />
              <p>{error}</p>
              <p className="text-sm mt-2 text-center">
                Try searching for "{track?.artist} {track?.title} lyrics" online
              </p>
            </div>
          )}

          {lyrics && !loading && (
            <div className="text-[#b3b3b3] whitespace-pre-wrap leading-relaxed text-sm">
              {lyrics}
            </div>
          )}

          {!track && (
            <div className="flex flex-col items-center justify-center h-64 text-[#b3b3b3]">
              <Music2 className="w-12 h-12 mb-4 opacity-50" />
              <p>No track playing</p>
              <p className="text-sm mt-1">Play a song to see its lyrics</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#282828] text-center">
          <p className="text-xs text-[#6a6a6a]">Lyrics powered by lyrics.ovh</p>
        </div>
      </div>
    </div>
  );
}
