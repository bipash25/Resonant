import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LastfmState {
  connected: boolean;
  username: string | null;
  sessionKey: string | null;
  
  setSession: (username: string, sessionKey: string) => void;
  disconnect: () => void;
}

export const useLastfmStore = create<LastfmState>()(
  persist(
    (set) => ({
      connected: false,
      username: null,
      sessionKey: null,
      
      setSession: (username, sessionKey) => set({
        connected: true,
        username,
        sessionKey
      }),
      
      disconnect: () => set({
        connected: false,
        username: null,
        sessionKey: null
      })
    }),
    {
      name: 'resonant-lastfm'
    }
  )
);
