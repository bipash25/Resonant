import { create } from 'zustand';
import type { Track } from '../types';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  // Current playback
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
  progress: number;      // Current time in seconds
  duration: number;      // Total duration in seconds
  playbackSpeed: number; // 0.5 - 2.0
  
  // Queue
  queue: Track[];
  queueIndex: number;
  
  // Playback modes
  shuffle: boolean;
  repeat: RepeatMode;
  
  // Sleep timer
  sleepTimer: number | null;  // Minutes remaining, null = off
  sleepTimerEnd: number | null; // Timestamp when timer ends
  
  // Actions
  setTrack: (track: Track) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  
  // Queue actions
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  
  // Mode actions
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  
  // Sleep timer actions
  setSleepTimer: (minutes: number | null) => void;
  checkSleepTimer: () => boolean; // Returns true if should stop
  
  // Track actions
  toggleCurrentTrackLike: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.7,
  muted: false,
  progress: 0,
  duration: 0,
  playbackSpeed: 1.0,
  
  queue: [],
  queueIndex: 0,
  
  shuffle: false,
  repeat: 'off',
  
  sleepTimer: null,
  sleepTimerEnd: null,
  
  setTrack: (track) => set({ currentTrack: track, progress: 0, isPlaying: true }),
  
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggle: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setVolume: (volume) => set({ volume, muted: volume === 0 }),
  toggleMute: () => set((state) => ({ muted: !state.muted })),
  
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: Math.max(0.5, Math.min(2.0, speed)) }),
  
  setQueue: (tracks, startIndex = 0) => {
    set({
      queue: tracks,
      queueIndex: startIndex,
      currentTrack: tracks[startIndex] || null,
      isPlaying: true,
      progress: 0
    });
  },
  
  addToQueue: (track) => set((state) => ({
    queue: [...state.queue, track]
  })),
  
  removeFromQueue: (index) => set((state) => {
    const newQueue = [...state.queue];
    newQueue.splice(index, 1);
    
    let newIndex = state.queueIndex;
    if (index < state.queueIndex) {
      newIndex = Math.max(0, state.queueIndex - 1);
    } else if (index === state.queueIndex && index >= newQueue.length) {
      newIndex = Math.max(0, newQueue.length - 1);
    }
    
    return {
      queue: newQueue,
      queueIndex: newIndex,
      currentTrack: newQueue[newIndex] || null
    };
  }),
  
  clearQueue: () => set({
    queue: [],
    queueIndex: 0,
    currentTrack: null,
    isPlaying: false
  }),
  
  reorderQueue: (fromIndex, toIndex) => set((state) => {
    const newQueue = [...state.queue];
    const [removed] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, removed);
    
    // Adjust current index if needed
    let newQueueIndex = state.queueIndex;
    if (state.queueIndex === fromIndex) {
      newQueueIndex = toIndex;
    } else if (fromIndex < state.queueIndex && toIndex >= state.queueIndex) {
      newQueueIndex--;
    } else if (fromIndex > state.queueIndex && toIndex <= state.queueIndex) {
      newQueueIndex++;
    }
    
    return { queue: newQueue, queueIndex: newQueueIndex };
  }),
  
  next: () => {
    const state = get();
    const { queue, queueIndex, repeat, shuffle } = state;
    
    if (queue.length === 0) return;
    
    let nextIndex: number;
    
    if (shuffle) {
      // Random track (excluding current if possible)
      const available = queue.length > 1 
        ? queue.map((_, i) => i).filter(i => i !== queueIndex)
        : [0];
      nextIndex = available[Math.floor(Math.random() * available.length)];
    } else {
      nextIndex = queueIndex + 1;
      
      if (nextIndex >= queue.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else {
          // End of queue
          set({ isPlaying: false });
          return;
        }
      }
    }
    
    set({
      queueIndex: nextIndex,
      currentTrack: queue[nextIndex],
      progress: 0,
      isPlaying: true
    });
  },
  
  previous: () => {
    const state = get();
    const { queue, queueIndex, progress, repeat } = state;
    
    if (queue.length === 0) return;
    
    // If more than 3 seconds in, restart current track
    if (progress > 3) {
      set({ progress: 0 });
      return;
    }
    
    let prevIndex = queueIndex - 1;
    
    if (prevIndex < 0) {
      if (repeat === 'all') {
        prevIndex = queue.length - 1;
      } else {
        prevIndex = 0;
      }
    }
    
    set({
      queueIndex: prevIndex,
      currentTrack: queue[prevIndex],
      progress: 0,
      isPlaying: true
    });
  },
  
  jumpTo: (index) => {
    const { queue } = get();
    if (index >= 0 && index < queue.length) {
      set({
        queueIndex: index,
        currentTrack: queue[index],
        progress: 0,
        isPlaying: true
      });
    }
  },
  
  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
  
  cycleRepeat: () => set((state) => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(state.repeat);
    return { repeat: modes[(currentIndex + 1) % modes.length] };
  }),
  
  setSleepTimer: (minutes) => {
    if (minutes === null) {
      set({ sleepTimer: null, sleepTimerEnd: null });
    } else {
      set({
        sleepTimer: minutes,
        sleepTimerEnd: Date.now() + minutes * 60 * 1000
      });
    }
  },
  
  checkSleepTimer: () => {
    const { sleepTimerEnd, isPlaying } = get();
    if (sleepTimerEnd && isPlaying && Date.now() >= sleepTimerEnd) {
      set({ isPlaying: false, sleepTimer: null, sleepTimerEnd: null });
      return true;
    }
    return false;
  },
  
  toggleCurrentTrackLike: () => {
    const { currentTrack, queue, queueIndex } = get();
    if (!currentTrack) return;
    
    const newIsLiked = !currentTrack.isLiked;
    const updatedTrack = { ...currentTrack, isLiked: newIsLiked };
    const updatedQueue = [...queue];
    updatedQueue[queueIndex] = updatedTrack;
    
    set({
      currentTrack: updatedTrack,
      queue: updatedQueue
    });
  }
}));
