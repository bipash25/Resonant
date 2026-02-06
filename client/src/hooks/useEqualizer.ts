import { useEffect, useRef, useCallback } from 'react';
import { useEqualizerStore } from '../store/equalizerStore';

interface UseEqualizerOptions {
  audioElement: HTMLAudioElement | null;
  enabled?: boolean;
}

export function useEqualizer({ audioElement }: UseEqualizerOptions) {
  const { enabled, bands } = useEqualizerStore();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const connectedRef = useRef(false);

  const setupAudioContext = useCallback(() => {
    if (!audioElement || connectedRef.current) return;

    try {
      // Create or resume AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      
      // Create source from audio element (can only be done once per element)
      if (!sourceNodeRef.current) {
        sourceNodeRef.current = ctx.createMediaElementSource(audioElement);
      }

      // Create biquad filters for each frequency band
      const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      filtersRef.current = frequencies.map((freq, index) => {
        const filter = ctx.createBiquadFilter();
        filter.type = index === 0 ? 'lowshelf' : index === frequencies.length - 1 ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1; // Quality factor for peaking filters
        filter.gain.value = 0;
        return filter;
      });

      // Connect: source -> filters -> destination
      let lastNode: AudioNode = sourceNodeRef.current;
      filtersRef.current.forEach(filter => {
        lastNode.connect(filter);
        lastNode = filter;
      });
      lastNode.connect(ctx.destination);

      connectedRef.current = true;
    } catch (error) {
      console.error('Failed to setup Web Audio EQ:', error);
    }
  }, [audioElement]);

  // Setup audio context when audio element is available
  useEffect(() => {
    if (audioElement && !connectedRef.current) {
      // Wait for user interaction (autoplay policy)
      const setupOnPlay = () => {
        setupAudioContext();
        audioElement.removeEventListener('play', setupOnPlay);
      };
      
      audioElement.addEventListener('play', setupOnPlay);
      
      // Try setup immediately in case already playing
      if (!audioElement.paused) {
        setupAudioContext();
      }

      return () => {
        audioElement.removeEventListener('play', setupOnPlay);
      };
    }
  }, [audioElement, setupAudioContext]);

  // Update filter gains when bands change
  useEffect(() => {
    if (!enabled || filtersRef.current.length === 0) {
      // Reset all gains to 0 when disabled
      filtersRef.current.forEach(filter => {
        filter.gain.value = 0;
      });
      return;
    }

    // Apply band gains
    bands.forEach((band, index) => {
      if (filtersRef.current[index]) {
        filtersRef.current[index].gain.value = band.gain;
      }
    });
  }, [enabled, bands]);

  // Resume AudioContext if suspended (browser autoplay policy)
  useEffect(() => {
    const ctx = audioContextRef.current;
    if (ctx && ctx.state === 'suspended') {
      const resume = () => {
        ctx.resume();
        document.removeEventListener('click', resume);
        document.removeEventListener('keydown', resume);
      };
      document.addEventListener('click', resume);
      document.addEventListener('keydown', resume);
      
      return () => {
        document.removeEventListener('click', resume);
        document.removeEventListener('keydown', resume);
      };
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't close the context, just disconnect
      // Closing would prevent reconnection
    };
  }, []);

  return {
    isConnected: connectedRef.current,
    audioContext: audioContextRef.current
  };
}
