import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Spotify API credentials
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || '';

// Scopes needed for playback control
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
].join(' ');

// Get authorization URL
router.get('/auth-url', authMiddleware, async (_req: AuthRequest, res): Promise<Response | void> => {
  if (!SPOTIFY_CLIENT_ID) {
    return res.status(500).json({ error: 'Spotify not configured' });
  }

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SCOPES,
    show_dialog: 'true'
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params}`;
  res.json({ url: authUrl });
});

// Exchange code for tokens
router.post('/callback', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Spotify not configured' });
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error_description || 'Failed to authenticate' });
    }

    // Get user profile
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${data.access_token}` }
    });
    const profile = await profileRes.json();

    res.json({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      user: {
        id: profile.id,
        displayName: profile.display_name,
        email: profile.email,
        product: profile.product // 'premium' or 'free'
      }
    });
  } catch (error) {
    console.error('Spotify callback error:', error);
    res.status(500).json({ error: 'Failed to complete Spotify authentication' });
  }
});

// Refresh access token
router.post('/refresh', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Spotify not configured' });
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error_description || 'Failed to refresh token' });
    }

    res.json({
      accessToken: data.access_token,
      expiresIn: data.expires_in
    });
  } catch (error) {
    console.error('Spotify refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Transfer playback to device
router.put('/transfer', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const { accessToken, deviceId, play } = req.body;

    const response = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_ids: [deviceId],
        play: play ?? false
      })
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message || 'Failed to transfer playback' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Transfer playback error:', error);
    res.status(500).json({ error: 'Failed to transfer playback' });
  }
});

// Play a track
router.put('/play', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const { accessToken, deviceId, uris, contextUri, offset } = req.body;

    const body: Record<string, unknown> = {};
    if (uris) body.uris = uris;
    if (contextUri) body.context_uri = contextUri;
    if (offset !== undefined) body.offset = { position: offset };

    const url = deviceId 
      ? `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`
      : 'https://api.spotify.com/v1/me/player/play';

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.error?.message || 'Failed to play' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Play error:', error);
    res.status(500).json({ error: 'Failed to play' });
  }
});

// Search Spotify
router.get('/search', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const { q, accessToken, type = 'track', limit = 10 } = req.query;

    if (!q || !accessToken) {
      return res.status(400).json({ error: 'Query and access token required' });
    }

    const params = new URLSearchParams({
      q: q as string,
      type: type as string,
      limit: limit as string
    });

    const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Spotify search error:', error);
    res.status(500).json({ error: 'Failed to search Spotify' });
  }
});

export default router;
