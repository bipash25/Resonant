import { useState, useEffect } from 'react';
import { User, Lock, Palette, Volume2, Save, Check, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useThemeStore } from '../store/themeStore';
import { useLastfmStore } from '../store/lastfmStore';
import { useSpotifyStore } from '../store/spotifyStore';
import api from '../lib/api';

interface UserPreferences {
  defaultVolume: number;
  autoplay: boolean;
  showLyrics: boolean;
}

export function Settings() {
  const { user, updateUser, logout } = useAuthStore();
  const { volume, setVolume, crossfade, setCrossfade, radioMode, setRadioMode } = usePlayerStore();
  const { theme: currentTheme, setTheme } = useThemeStore();
  const { connected: lastfmConnected, username: lastfmUsername, setSession: setLastfmSession, disconnect: disconnectLastfm } = useLastfmStore();
  const { connected: spotifyConnected, user: spotifyUser, setAuth: setSpotifyAuth, disconnect: disconnectSpotify } = useSpotifyStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'password'>('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Profile state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const stored = localStorage.getItem('userPreferences');
    return stored ? JSON.parse(stored) : {
      theme: 'dark',
      defaultVolume: volume * 100,
      autoplay: true,
      showLyrics: false
    };
  });

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Handle Last.fm callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const isLastfmCallback = params.get('lastfm') === 'callback';
    
    if (token && isLastfmCallback) {
      // Exchange token for session
      api.post('/lastfm/callback', { token })
        .then(res => {
          setLastfmSession(res.data.username, res.data.sessionKey);
          // Clean URL
          window.history.replaceState({}, '', '/settings');
        })
        .catch(err => {
          console.error('Last.fm auth failed:', err);
          alert('Failed to connect Last.fm');
          window.history.replaceState({}, '', '/settings');
        });
    }
    
    // Handle Spotify callback
    const code = params.get('code');
    if (code && !token) {
      api.post('/spotify/callback', { code })
        .then(res => {
          setSpotifyAuth(
            res.data.accessToken,
            res.data.refreshToken,
            res.data.expiresIn,
            res.data.user
          );
          window.history.replaceState({}, '', '/settings');
        })
        .catch(err => {
          console.error('Spotify auth failed:', err);
          alert('Failed to connect Spotify');
          window.history.replaceState({}, '', '/settings');
        });
    }
  }, [setLastfmSession, setSpotifyAuth]);

  const savePreferences = (newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
    setVolume(newPrefs.defaultVolume / 100);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/me', { displayName });
      updateUser({ displayName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'preferences' as const, label: 'Preferences', icon: Palette },
    { id: 'password' as const, label: 'Password', icon: Lock },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === id
                ? 'bg-white text-black'
                : 'bg-[#232323] text-white hover:bg-[#2a2a2a]'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-[#181818] rounded-lg p-4 md:p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-[#242424] border border-[#535353] rounded-md text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 bg-[#242424] border border-[#535353] rounded-md text-[#6a6a6a] cursor-not-allowed"
            />
            <p className="text-xs text-[#6a6a6a] mt-1">Email cannot be changed</p>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#1ed760] text-black font-bold rounded-full hover:bg-[#1db954] transition-colors disabled:opacity-50"
          >
            {saved ? <Check size={18} /> : <Save size={18} />}
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-[#181818] rounded-lg p-4 md:p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Theme
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  currentTheme === 'dark'
                    ? 'bg-[#1ed760] text-black'
                    : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
                }`}
              >
                <Moon size={16} />
                Dark
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  currentTheme === 'light'
                    ? 'bg-[#1ed760] text-black'
                    : 'bg-[#242424] text-white hover:bg-[#2a2a2a]'
                }`}
              >
                <Sun size={16} />
                Light
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              <Volume2 size={16} className="inline mr-2" />
              Default Volume: {Math.round(preferences.defaultVolume)}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={preferences.defaultVolume}
              onChange={(e) => savePreferences({ ...preferences, defaultVolume: parseInt(e.target.value) })}
              className="w-full h-2 accent-[#1ed760]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Crossfade: {crossfade === 0 ? 'Off' : `${crossfade}s`}
            </label>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={crossfade}
              onChange={(e) => setCrossfade(parseInt(e.target.value))}
              className="w-full h-2 accent-[#1ed760]"
            />
            <p className="text-xs text-[#6a6a6a] mt-1">
              Smoothly fade between tracks (local files only)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-semibold text-white">
                Radio Mode
              </label>
              <p className="text-xs text-[#6a6a6a]">
                Auto-play similar YouTube tracks when queue ends
              </p>
            </div>
            <button
              onClick={() => setRadioMode(!radioMode)}
              className={`w-12 h-6 rounded-full transition-colors ${
                radioMode ? 'bg-[#1ed760]' : 'bg-[#535353]'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                radioMode ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-semibold text-white">
                Autoplay
              </label>
              <p className="text-xs text-[#6a6a6a]">
                Automatically play similar songs when queue ends
              </p>
            </div>
            <button
              onClick={() => savePreferences({ ...preferences, autoplay: !preferences.autoplay })}
              className={`w-12 h-6 rounded-full transition-colors ${
                preferences.autoplay ? 'bg-[#1ed760]' : 'bg-[#535353]'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                preferences.autoplay ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-semibold text-white">
                Show Lyrics
              </label>
              <p className="text-xs text-[#6a6a6a]">
                Display lyrics when available (coming soon)
              </p>
            </div>
            <button
              onClick={() => savePreferences({ ...preferences, showLyrics: !preferences.showLyrics })}
              className={`w-12 h-6 rounded-full transition-colors ${
                preferences.showLyrics ? 'bg-[#1ed760]' : 'bg-[#535353]'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                preferences.showLyrics ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Last.fm Integration */}
          <div className="border-t border-[#282828] pt-6 mt-6">
            <h3 className="text-sm font-semibold text-white mb-4">Last.fm Scrobbling</h3>
            {lastfmConnected ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Connected as <span className="text-[#1ed760]">{lastfmUsername}</span></p>
                  <p className="text-xs text-[#6a6a6a]">Your listening history is being scrobbled</p>
                </div>
                <button
                  onClick={disconnectLastfm}
                  className="px-4 py-2 text-sm border border-red-500 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Connect to Last.fm</p>
                  <p className="text-xs text-[#6a6a6a]">Scrobble your listening history</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.get('/lastfm/auth-url');
                      window.location.href = res.data.url;
                    } catch (err) {
                      console.error('Failed to get Last.fm auth URL:', err);
                      alert('Last.fm integration is not configured on the server');
                    }
                  }}
                  className="px-4 py-2 text-sm bg-[#d51007] text-white rounded-full hover:bg-[#ba0d06] transition-colors"
                >
                  Connect Last.fm
                </button>
              </div>
            )}
          </div>

          {/* Spotify Connect */}
          <div className="border-t border-[#282828] pt-6 mt-6">
            <h3 className="text-sm font-semibold text-white mb-4">Spotify Connect</h3>
            {spotifyConnected ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">
                    Connected as <span className="text-[#1ed760]">{spotifyUser?.displayName}</span>
                    {spotifyUser?.product !== 'premium' && (
                      <span className="ml-2 text-xs text-yellow-500">(Premium required for playback)</span>
                    )}
                  </p>
                  <p className="text-xs text-[#6a6a6a]">Stream from Spotify library</p>
                </div>
                <button
                  onClick={disconnectSpotify}
                  className="px-4 py-2 text-sm border border-red-500 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Connect to Spotify</p>
                  <p className="text-xs text-[#6a6a6a]">Requires Spotify Premium for playback</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.get('/spotify/auth-url');
                      window.location.href = res.data.url;
                    } catch (err) {
                      console.error('Failed to get Spotify auth URL:', err);
                      alert('Spotify integration is not configured on the server');
                    }
                  }}
                  className="px-4 py-2 text-sm bg-[#1ed760] text-black font-semibold rounded-full hover:bg-[#1db954] transition-colors"
                >
                  Connect Spotify
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-[#181818] rounded-lg p-4 md:p-6 space-y-6">
          {passwordError && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-md p-3 text-sm">
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#242424] border border-[#535353] rounded-md text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 bg-[#242424] border border-[#535353] rounded-md text-white placeholder-[#6a6a6a] focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#242424] border border-[#535353] rounded-md text-white focus:outline-none focus:border-white"
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="flex items-center gap-2 px-6 py-3 bg-[#1ed760] text-black font-bold rounded-full hover:bg-[#1db954] transition-colors disabled:opacity-50"
          >
            {saved ? <Check size={18} /> : <Lock size={18} />}
            {saved ? 'Password Changed!' : saving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="mt-8 bg-[#181818] rounded-lg p-4 md:p-6">
        <h2 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h2>
        <button
          onClick={logout}
          className="px-6 py-3 border border-red-500 text-red-500 font-semibold rounded-full hover:bg-red-500 hover:text-white transition-colors"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
