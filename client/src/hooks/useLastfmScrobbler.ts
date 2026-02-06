import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useLastfmStore } from '../store/lastfmStore';
import api from '../lib/api';

const SCROBBLE_THRESHOLD = 0.5; // Scrobble after 50% of track or 4 minutes
const MIN_SCROBBLE_TIME = 30; // Minimum 30 seconds to scrobble

export function useLastfmScrobbler() {
  const { currentTrack, isPlaying, progress, duration } = usePlayerStore();
  const { connected, sessionKey } = useLastfmStore();
  
  const lastScrobbledId = useRef<string | null>(null);
  const hasUpdatedNowPlaying = useRef(false);
  const trackStartTime = useRef<number>(0);

  // Update "Now Playing" when track changes
  useEffect(() => {
    if (!connected || !sessionKey || !currentTrack || !isPlaying) {
      hasUpdatedNowPlaying.current = false;
      return;
    }

    if (!currentTrack.artist) return; // Need artist for Last.fm

    // Only update once per track
    if (hasUpdatedNowPlaying.current) return;
    hasUpdatedNowPlaying.current = true;
    trackStartTime.current = Date.now();

    api.post('/lastfm/now-playing', {
      sessionKey,
      artist: currentTrack.artist,
      track: currentTrack.title,
      album: currentTrack.album,
      duration: duration > 0 ? Math.floor(duration) : undefined
    }).catch(err => {
      console.error('Failed to update Now Playing:', err);
    });
  }, [connected, sessionKey, currentTrack?.id, isPlaying]);

  // Scrobble when conditions are met
  useEffect(() => {
    if (!connected || !sessionKey || !currentTrack || !isPlaying) return;
    if (!currentTrack.artist) return; // Need artist for Last.fm
    if (lastScrobbledId.current === currentTrack.id) return; // Already scrobbled

    // Check scrobble conditions
    const playTime = progress;
    const halfDuration = duration > 0 ? duration * SCROBBLE_THRESHOLD : Infinity;
    const fourMinutes = 240;

    const shouldScrobble = playTime >= MIN_SCROBBLE_TIME && 
                          (playTime >= halfDuration || playTime >= fourMinutes);

    if (shouldScrobble) {
      lastScrobbledId.current = currentTrack.id;
      
      api.post('/lastfm/scrobble', {
        sessionKey,
        artist: currentTrack.artist,
        track: currentTrack.title,
        album: currentTrack.album,
        timestamp: Math.floor(trackStartTime.current / 1000),
        duration: duration > 0 ? Math.floor(duration) : undefined
      }).catch(err => {
        console.error('Failed to scrobble:', err);
        // Reset so we can try again
        lastScrobbledId.current = null;
      });
    }
  }, [connected, sessionKey, currentTrack, isPlaying, progress, duration]);

  // Reset when track changes
  useEffect(() => {
    lastScrobbledId.current = null;
    hasUpdatedNowPlaying.current = false;
    trackStartTime.current = Date.now();
  }, [currentTrack?.id]);
}
