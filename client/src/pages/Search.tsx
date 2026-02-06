import { useState, useCallback } from 'react';
import { Search as SearchIcon, Music, Play, Plus } from 'lucide-react';
import api from '../lib/api';
import type { Track, SearchResults } from '../types';
import { usePlayerStore } from '../store/playerStore';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ local: [], youtube: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  const { setQueue, addToQueue } = usePlayerStore();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ local: [], youtube: [] });
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      const res = await api.get('/search', { params: { q, source: 'all' } });
      setResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const playTrack = (_track: Track, allTracks: Track[], index: number) => {
    setQueue(allTracks, index);
  };

  const handleAddToQueue = (track: Track) => {
    // For YouTube tracks, save to DB first
    if (track.sourceType === 'YOUTUBE' && !track.id.startsWith('c')) {
      api.post('/search/youtube/save', {
        videoId: track.sourceId,
        title: track.title,
        artist: track.artist,
        coverUrl: track.coverUrl
      }).then(res => {
        addToQueue(res.data);
      });
    } else {
      addToQueue(track);
    }
  };

  const allResults = [...results.local, ...results.youtube];

  return (
    <div>
      {/* Search input */}
      <form onSubmit={handleSubmit} className="mb-6 md:mb-8">
        <div className="relative w-full md:max-w-md">
          <SearchIcon 
            size={20} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6a6a6a]" 
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            className="w-full pl-12 pr-4 py-3 bg-[#242424] rounded-full text-white placeholder-[#6a6a6a] focus:outline-none focus:ring-2 focus:ring-white text-sm md:text-base"
          />
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#1ed760]"></div>
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <div className="space-y-6 md:space-y-8">
          {/* Local results */}
          {results.local.length > 0 && (
            <section>
              <h2 className="text-lg md:text-xl font-bold mb-4">Your Library</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {results.local.map((track, index) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    onPlay={() => playTrack(track, results.local, index)}
                    onAddToQueue={() => handleAddToQueue(track)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* YouTube results */}
          {results.youtube.length > 0 && (
            <section>
              <h2 className="text-lg md:text-xl font-bold mb-4">YouTube</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {results.youtube.map((track, index) => (
                  <TrackCard
                    key={track.sourceId || index}
                    track={track}
                    onPlay={() => playTrack(track, results.youtube, index)}
                    onAddToQueue={() => handleAddToQueue(track)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* No results */}
          {allResults.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#b3b3b3]">
                No results found for "{query}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial state */}
      {!searched && !loading && (
        <div className="text-center py-12 md:py-20">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Search for music</h2>
          <p className="text-[#b3b3b3] text-sm md:text-base">
            Find songs in your library or on YouTube
          </p>
        </div>
      )}
    </div>
  );
}

// Track card component
function TrackCard({ 
  track, 
  onPlay, 
  onAddToQueue 
}: { 
  track: Track; 
  onPlay: () => void; 
  onAddToQueue: () => void;
}) {
  return (
    <div className="bg-[#181818] p-3 md:p-4 rounded-lg hover:bg-[#282828] transition-colors group cursor-pointer" onClick={onPlay}>
      <div className="relative mb-3 md:mb-4">
        <div className="aspect-square bg-[#282828] rounded-md overflow-hidden">
          {track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music size={32} className="text-[#6a6a6a] md:w-12 md:h-12" />
            </div>
          )}
        </div>
        
        {/* Play button */}
        <button
          onClick={(e) => { e.stopPropagation(); onPlay(); }}
          className="absolute bottom-2 right-2 w-10 h-10 md:w-12 md:h-12 bg-[#1ed760] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all shadow-lg hover:scale-105"
        >
          <Play size={20} fill="black" className="text-black ml-0.5 md:w-6 md:h-6" />
        </button>
      </div>
      
      <h3 className="font-semibold text-white truncate mb-1 text-sm md:text-base">{track.title}</h3>
      <p className="text-xs md:text-sm text-[#b3b3b3] truncate">{track.artist}</p>
      
      {/* Add to queue button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAddToQueue();
        }}
        className="mt-2 flex items-center gap-1 text-xs text-[#b3b3b3] hover:text-white transition-colors"
      >
        <Plus size={14} />
        <span className="hidden sm:inline">Add to queue</span>
        <span className="sm:hidden">Queue</span>
      </button>
    </div>
  );
}
