import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
}

// Unified search - searches local DB and YouTube
router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { q, source } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results: {
      local: unknown[];
      youtube: unknown[];
    } = { local: [], youtube: [] };

    // Search local database
    if (!source || source === 'local' || source === 'all') {
      const localTracks = await prisma.track.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { artist: { contains: q, mode: 'insensitive' } },
            { album: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
      });
      results.local = localTracks;
    }

    // Search YouTube
    if ((!source || source === 'youtube' || source === 'all') && process.env.YOUTUBE_API_KEY) {
      try {
        const ytResponse = await fetch(
          `${YOUTUBE_API_URL}?` + new URLSearchParams({
            part: 'snippet',
            q: q + ' music',
            type: 'video',
            videoCategoryId: '10', // Music category
            maxResults: '20',
            key: process.env.YOUTUBE_API_KEY
          })
        );

        if (ytResponse.ok) {
          const ytData = await ytResponse.json() as { items: YouTubeSearchItem[] };
          results.youtube = ytData.items.map((item: YouTubeSearchItem) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            coverUrl: item.snippet.thumbnails.medium.url,
            sourceType: 'YOUTUBE',
            sourceId: item.id.videoId
          }));
        }
      } catch (ytError) {
        console.error('YouTube search error:', ytError);
        // Continue with local results only
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Save a YouTube track to database (for adding to playlists, liked songs, etc.)
router.post('/youtube/save', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { videoId, title, artist, coverUrl, duration } = req.body;

    if (!videoId || !title) {
      return res.status(400).json({ error: 'videoId and title are required' });
    }

    // Check if track already exists
    let track = await prisma.track.findFirst({
      where: { sourceType: 'YOUTUBE', sourceId: videoId }
    });

    if (!track) {
      track = await prisma.track.create({
        data: {
          title,
          artist: artist || 'Unknown',
          coverUrl,
          duration,
          sourceType: 'YOUTUBE',
          sourceId: videoId,
          uploadedBy: req.userId
        }
      });
    }

    res.json(track);
  } catch (error) {
    console.error('Save YouTube track error:', error);
    res.status(500).json({ error: 'Failed to save track' });
  }
});

export default router;
