import { useState, useEffect, useMemo, useCallback } from 'react';
import { Upload, Music, Search, Clock, X, Play } from 'lucide-react';
import { TrackList } from '../components/TrackList';
import { usePlayerStore } from '../store/playerStore';
import api from '../lib/api';
import type { Track } from '../types';

export function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { setQueue, currentTrack } = usePlayerStore();

  const loadData = useCallback(async () => {
    try {
      const [tracksRes, recentRes] = await Promise.all([
        api.get('/tracks'),
        api.get('/tracks/history/recent?limit=10').catch(() => ({ data: [] }))
      ]);
      setTracks(tracksRes.data);
      setRecentTracks(recentRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time update: Refresh recently played when track changes
  useEffect(() => {
    if (currentTrack) {
      // Debounce the refresh to avoid too many calls
      const timer = setTimeout(() => {
        api.get('/tracks/history/recent?limit=10')
          .then(res => setRecentTracks(res.data))
          .catch(() => {});
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTrack?.id]);

  // Filter tracks based on search query
  const filteredTracks = useMemo(() => {
    if (!searchQuery.trim()) return tracks;
    
    const query = searchQuery.toLowerCase();
    return tracks.filter(track => 
      track.title.toLowerCase().includes(query) ||
      (track.artist?.toLowerCase().includes(query)) ||
      (track.album?.toLowerCase().includes(query))
    );
  }, [tracks, searchQuery]);

  const handlePlayRecent = async (track: Track, index: number) => {
    // Record play
    try {
      api.post(`/tracks/${track.id}/play`).catch(() => {});
    } catch (e) {
      // Ignore
    }
    // Play the track with recently played as queue
    setQueue(recentTracks, index);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    if (files.length === 1) {
      formData.append('file', files[0]);
      try {
        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setTracks([res.data, ...tracks]);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    } else {
      for (const file of files) {
        formData.append('files', file);
      }
      try {
        const res = await api.post('/upload/batch', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setTracks([...res.data.tracks, ...tracks]);
      } catch (err) {
        console.error('Batch upload failed:', err);
      }
    }
    
    setUploading(false);
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#1ed760]"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Good evening</h1>
        
        <label className={`flex items-center gap-2 px-4 py-2 bg-[#1ed760] text-black rounded-full font-semibold cursor-pointer hover:bg-[#1db954] transition-colors text-sm md:text-base ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <Upload size={18} />
          {uploading ? 'Uploading...' : 'Upload Music'}
          <input
            type="file"
            accept=".mp3,.m4a,.wav,.flac,.ogg,.aac"
            multiple
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Recently Played */}
      {recentTracks.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-[#b3b3b3]" />
            <h2 className="text-lg md:text-xl font-semibold">Recently Played</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {recentTracks.slice(0, 5).map((track, index) => (
              <div
                key={track.id}
                className="bg-[#181818] p-3 rounded-lg hover:bg-[#282828] transition-colors cursor-pointer group relative"
                onClick={() => handlePlayRecent(track, index)}
              >
                <div className="aspect-square bg-[#282828] rounded mb-3 overflow-hidden relative">
                  {track.coverUrl ? (
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music size={32} className="text-[#6a6a6a]" />
                    </div>
                  )}
                  {/* Play button overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 bg-[#1ed760] rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play size={20} fill="black" className="text-black ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="truncate text-sm font-medium">{track.title}</div>
                <div className="truncate text-xs text-[#b3b3b3]">{track.artist || 'Unknown'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      {tracks.length > 0 && (
        <div className="relative mb-6">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]" />
          <input
            type="text"
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-[#242424] border border-transparent rounded-full text-white placeholder-[#b3b3b3] focus:outline-none focus:border-white/30"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}

      {/* Tracks */}
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-[#282828] rounded-full flex items-center justify-center mb-4">
            <Music size={32} className="text-[#6a6a6a] md:w-10 md:h-10" />
          </div>
          <h2 className="text-lg md:text-xl font-semibold mb-2">No music yet</h2>
          <p className="text-[#b3b3b3] mb-6 text-sm md:text-base px-4">
            Upload your first track or search for music on YouTube
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            {searchQuery ? `Results for "${searchQuery}"` : 'Your Music'}
            {searchQuery && ` (${filteredTracks.length})`}
          </h2>
          {filteredTracks.length > 0 ? (
            <TrackList tracks={filteredTracks} />
          ) : (
            <div className="text-center py-12 text-[#b3b3b3]">
              No tracks found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
