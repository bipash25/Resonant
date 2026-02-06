import { useState, useEffect } from 'react';
import { Heart, Music, Clock } from 'lucide-react';
import { TrackList } from '../components/TrackList';
import api from '../lib/api';
import type { Track, Playlist } from '../types';

type Tab = 'playlists' | 'liked';

export function Library() {
  const [tab, setTab] = useState<Tab>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [playlistsRes, likedRes] = await Promise.all([
        api.get('/playlists'),
        api.get('/tracks/liked/me')
      ]);
      setPlaylists(playlistsRes.data);
      setLikedTracks(likedRes.data);
    } catch (err) {
      console.error('Failed to load library:', err);
    } finally {
      setLoading(false);
    }
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
      <h1 className="text-3xl font-bold mb-6">Your Library</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('playlists')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === 'playlists'
              ? 'bg-white text-black'
              : 'bg-[#232323] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          Playlists
        </button>
        <button
          onClick={() => setTab('liked')}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            tab === 'liked'
              ? 'bg-white text-black'
              : 'bg-[#232323] text-white hover:bg-[#2a2a2a]'
          }`}
        >
          Liked Songs
        </button>
      </div>

      {/* Playlists tab */}
      {tab === 'playlists' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {playlists.map((playlist) => (
            <a
              key={playlist.id}
              href={`/playlist/${playlist.id}`}
              className="bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition-colors group"
            >
              <div className="aspect-square bg-[#282828] rounded-md mb-4 overflow-hidden grid grid-cols-2 grid-rows-2">
                {playlist.tracks && playlist.tracks.length > 0 ? (
                  playlist.tracks.slice(0, 4).map((pt, i) => (
                    <div key={i} className="bg-[#333]">
                      {pt.track.coverUrl ? (
                        <img
                          src={pt.track.coverUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music size={16} className="text-[#6a6a6a]" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 row-span-2 flex items-center justify-center">
                    <Music size={48} className="text-[#6a6a6a]" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
              <p className="text-sm text-[#b3b3b3]">
                {playlist._count?.tracks || 0} songs
              </p>
            </a>
          ))}

          {playlists.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-[#b3b3b3]">No playlists yet. Create one from the sidebar!</p>
            </div>
          )}
        </div>
      )}

      {/* Liked songs tab */}
      {tab === 'liked' && (
        <div>
          {/* Header card */}
          <div className="flex items-end gap-6 mb-6 p-6 bg-gradient-to-b from-purple-900/50 to-transparent rounded-lg">
            <div className="w-48 h-48 bg-gradient-to-br from-purple-700 to-blue-300 rounded-md flex items-center justify-center shadow-2xl">
              <Heart size={64} fill="white" className="text-white" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-wider mb-2">Playlist</p>
              <h2 className="text-5xl font-bold mb-4">Liked Songs</h2>
              <div className="flex items-center gap-2 text-sm text-[#b3b3b3]">
                <Clock size={16} />
                <span>{likedTracks.length} songs</span>
              </div>
            </div>
          </div>

          {likedTracks.length > 0 ? (
            <TrackList tracks={likedTracks} />
          ) : (
            <div className="text-center py-12">
              <p className="text-[#b3b3b3]">Songs you like will appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
