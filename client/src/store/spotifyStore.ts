import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SpotifyUser {
  id: string;
  displayName: string;
  email: string;
  product: 'premium' | 'free';
}

interface SpotifyState {
  connected: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: SpotifyUser | null;
  deviceId: string | null;
  
  setAuth: (accessToken: string, refreshToken: string, expiresIn: number, user: SpotifyUser) => void;
  setDeviceId: (deviceId: string) => void;
  updateAccessToken: (accessToken: string, expiresIn: number) => void;
  disconnect: () => void;
  isTokenExpired: () => boolean;
}

export const useSpotifyStore = create<SpotifyState>()(
  persist(
    (set, get) => ({
      connected: false,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      deviceId: null,
      
      setAuth: (accessToken, refreshToken, expiresIn, user) => set({
        connected: true,
        accessToken,
        refreshToken,
        expiresAt: Date.now() + (expiresIn * 1000) - 60000, // 1 minute buffer
        user
      }),
      
      setDeviceId: (deviceId) => set({ deviceId }),
      
      updateAccessToken: (accessToken, expiresIn) => set({
        accessToken,
        expiresAt: Date.now() + (expiresIn * 1000) - 60000
      }),
      
      disconnect: () => set({
        connected: false,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        user: null,
        deviceId: null
      }),
      
      isTokenExpired: () => {
        const { expiresAt } = get();
        return !expiresAt || Date.now() >= expiresAt;
      }
    }),
    {
      name: 'resonant-spotify'
    }
  )
);
