import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Library, Plus, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState, useEffect } from 'react';
import api from '../lib/api';
import type { Playlist } from '../types';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const res = await api.get('/playlists');
      setPlaylists(res.data);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const createPlaylist = async () => {
    try {
      const name = `My Playlist #${playlists.length + 1}`;
      const res = await api.post('/playlists', { name });
      setPlaylists([res.data, ...playlists]);
      navigate(`/playlist/${res.data.id}`);
      onNavigate?.();
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-4 py-3 rounded-md transition-colors ${
      isActive 
        ? 'bg-[#282828] text-white' 
        : 'text-[#b3b3b3] hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-black flex flex-col h-full">
      {/* Logo - hidden on mobile (shown in header) */}
      <div className="p-6 hidden lg:block">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Resonant
        </h1>
      </div>

      {/* Main nav */}
      <nav className="px-2 pt-4 lg:pt-0">
        <NavLink to="/" className={navLinkClass} onClick={handleNavClick}>
          <Home size={24} />
          <span className="font-semibold">Home</span>
        </NavLink>
        <NavLink to="/search" className={navLinkClass} onClick={handleNavClick}>
          <Search size={24} />
          <span className="font-semibold">Search</span>
        </NavLink>
        <NavLink to="/library" className={navLinkClass} onClick={handleNavClick}>
          <Library size={24} />
          <span className="font-semibold">Your Library</span>
        </NavLink>
        <NavLink to="/settings" className={navLinkClass} onClick={handleNavClick}>
          <Settings size={24} />
          <span className="font-semibold">Settings</span>
        </NavLink>
      </nav>

      {/* Playlists */}
      <div className="mt-6 px-2 flex-1 overflow-hidden flex flex-col">
        <button
          onClick={createPlaylist}
          className="flex items-center gap-4 px-4 py-3 text-[#b3b3b3] hover:text-white transition-colors w-full"
        >
          <div className="w-6 h-6 bg-[#b3b3b3] rounded-sm flex items-center justify-center group-hover:bg-white">
            <Plus size={16} className="text-black" />
          </div>
          <span className="font-semibold">Create Playlist</span>
        </button>

        <div className="mt-2 border-t border-[#282828] pt-2 overflow-y-auto flex-1">
          {playlists.map((playlist) => (
            <NavLink
              key={playlist.id}
              to={`/playlist/${playlist.id}`}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm truncate transition-colors ${
                  isActive ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
                }`
              }
            >
              {playlist.name}
            </NavLink>
          ))}
        </div>
      </div>

      {/* User section */}
      <div className="p-4 border-t border-[#282828]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#b3b3b3] truncate">
            {user?.displayName || user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 text-[#b3b3b3] hover:text-white transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
