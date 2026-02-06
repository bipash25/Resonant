import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, MoreHorizontal, Pencil, Trash2, Music, Clock } from 'lucide-react';
import { TrackList } from '../components/TrackList';
import api from '../lib/api';
import type { Playlist as PlaylistType, Track } from '../types';
import { usePlayerStore } from '../store/playerStore';

export function Playlist() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<PlaylistType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  
  const { currentTrack, isPlaying, setQueue, toggle } = usePlayerStore();

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/playlists/${id}`);
      setPlaylist(res.data);
      setEditName(res.data.name);
    } catch (err) {
      console.error('Failed to load playlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const tracks: Track[] = playlist?.tracks?.map(pt => pt.track) || [];
  
  const isPlaylistPlaying = currentTrack && tracks.some(t => t.id === currentTrack.id) && isPlaying;

  const handlePlayAll = () => {
    if (tracks.length === 0) return;
    
    if (isPlaylistPlaying) {
      toggle();
    } else {
      setQueue(tracks, 0);
    }
  };

  const handleSaveName = async () => {
    if (!id || !editName.trim()) return;
    
    try {
      await api.patch(`/playlists/${id}`, { name: editName });
      setPlaylist(prev => prev ? { ...prev, name: editName } : null);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update playlist:', err);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this playlist?')) return;
    
    try {
      await api.delete(`/playlists/${id}`);
      navigate('/library');
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  const getTotalDuration = () => {
    const total = tracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${mins} min`;
    }
    return `${mins} min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#1ed760]"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Playlist not found</h2>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-end gap-6 mb-8">
        {/* Cover */}
        <div className="w-48 h-48 bg-[#282828] rounded-md shadow-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
          {playlist.coverUrl ? (
            <img
              src={playlist.coverUrl}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : tracks.length > 0 && tracks[0].coverUrl ? (
            <img
              src={tracks[0].coverUrl}
              alt={playlist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Music size={64} className="text-[#6a6a6a]" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="text-sm uppercase tracking-wider mb-2">Playlist</p>
          
          {editing ? (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                className="text-5xl font-bold bg-transparent border-b-2 border-white focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="px-3 py-1 bg-white text-black rounded-full text-sm font-semibold"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1 text-white text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1 className="text-5xl font-bold mb-4 truncate">{playlist.name}</h1>
          )}
          
          {playlist.description && (
            <p className="text-[#b3b3b3] mb-2">{playlist.description}</p>
          )}
          
          <div className="flex items-center gap-2 text-sm text-[#b3b3b3]">
            <Clock size={16} />
            <span>{tracks.length} songs</span>
            <span className="mx-1">•</span>
            <span>{getTotalDuration()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
          className="w-14 h-14 bg-[#1ed760] rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaylistPlaying ? (
            <Pause size={28} fill="black" className="text-black" />
          ) : (
            <Play size={28} fill="black" className="text-black ml-1" />
          )}
        </button>

        <button
          onClick={() => setEditing(true)}
          className="p-2 text-[#b3b3b3] hover:text-white transition-colors"
          title="Edit"
        >
          <Pencil size={20} />
        </button>

        <button
          onClick={handleDelete}
          className="p-2 text-[#b3b3b3] hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 size={20} />
        </button>

        <button className="p-2 text-[#b3b3b3] hover:text-white transition-colors">
          <MoreHorizontal size={24} />
        </button>
      </div>

      {/* Tracks */}
      {tracks.length > 0 ? (
        <TrackList tracks={tracks} />
      ) : (
        <div className="text-center py-12 border border-dashed border-[#282828] rounded-lg">
          <p className="text-[#b3b3b3] mb-2">This playlist is empty</p>
          <p className="text-sm text-[#6a6a6a]">
            Search for songs and add them to this playlist
          </p>
        </div>
      )}
    </div>
  );
}
