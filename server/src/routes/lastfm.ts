import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// Last.fm API base URL
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || '';
const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET || '';

// Helper to create Last.fm API signature
function createSignature(params: Record<string, string>): string {
  const sortedParams = Object.keys(params)
    .filter(key => key !== 'format')
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  return crypto.createHash('md5').update(sortedParams + LASTFM_API_SECRET).digest('hex');
}

// Get auth URL for Last.fm OAuth
router.get('/auth-url', authMiddleware, async (_req: AuthRequest, res): Promise<Response | void> => {
  if (!LASTFM_API_KEY) {
    return res.status(500).json({ error: 'Last.fm API key not configured' });
  }
  
  const callbackUrl = `${process.env.CLIENT_URL}/settings?lastfm=callback`;
  const authUrl = `https://www.last.fm/api/auth/?api_key=${LASTFM_API_KEY}&cb=${encodeURIComponent(callbackUrl)}`;
  
  res.json({ url: authUrl });
});

// Exchange token for session key
router.post('/callback', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }
    
    if (!LASTFM_API_KEY || !LASTFM_API_SECRET) {
      return res.status(500).json({ error: 'Last.fm API not configured' });
    }

    const params: Record<string, string> = {
      method: 'auth.getSession',
      api_key: LASTFM_API_KEY,
      token: token
    };
    
    params.api_sig = createSignature(params);
    params.format = 'json';
    
    const response = await fetch(LASTFM_API_URL + '?' + new URLSearchParams(params));
    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ error: data.message || 'Failed to authenticate with Last.fm' });
    }
    
    // Return session key and username
    res.json({
      sessionKey: data.session.key,
      username: data.session.name
    });
  } catch (error) {
    console.error('Last.fm callback error:', error);
    res.status(500).json({ error: 'Failed to complete Last.fm authentication' });
  }
});

// Scrobble a track (called when track finishes or after 4 minutes)
router.post('/scrobble', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const { sessionKey, artist, track, album, timestamp, duration } = req.body;
    
    if (!sessionKey || !artist || !track) {
      return res.status(400).json({ error: 'Session key, artist, and track are required' });
    }
    
    if (!LASTFM_API_KEY || !LASTFM_API_SECRET) {
      return res.status(500).json({ error: 'Last.fm API not configured' });
    }

    const params: Record<string, string> = {
      method: 'track.scrobble',
      api_key: LASTFM_API_KEY,
      sk: sessionKey,
      artist: artist,
      track: track,
      timestamp: timestamp || Math.floor(Date.now() / 1000).toString()
    };
    
    if (album) params.album = album;
    if (duration) params.duration = duration.toString();
    
    params.api_sig = createSignature(params);
    params.format = 'json';
    
    const response = await fetch(LASTFM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params)
    });
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ error: data.message || 'Failed to scrobble' });
    }
    
    res.json({ success: true, scrobbles: data.scrobbles });
  } catch (error) {
    console.error('Scrobble error:', error);
    res.status(500).json({ error: 'Failed to scrobble track' });
  }
});

// Update "Now Playing" status
router.post('/now-playing', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const { sessionKey, artist, track, album, duration } = req.body;
    
    if (!sessionKey || !artist || !track) {
      return res.status(400).json({ error: 'Session key, artist, and track are required' });
    }
    
    if (!LASTFM_API_KEY || !LASTFM_API_SECRET) {
      return res.status(500).json({ error: 'Last.fm API not configured' });
    }

    const params: Record<string, string> = {
      method: 'track.updateNowPlaying',
      api_key: LASTFM_API_KEY,
      sk: sessionKey,
      artist: artist,
      track: track
    };
    
    if (album) params.album = album;
    if (duration) params.duration = duration.toString();
    
    params.api_sig = createSignature(params);
    params.format = 'json';
    
    const response = await fetch(LASTFM_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params)
    });
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(400).json({ error: data.message || 'Failed to update now playing' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Now playing error:', error);
    res.status(500).json({ error: 'Failed to update now playing' });
  }
});

export default router;
