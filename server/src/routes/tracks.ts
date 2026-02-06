import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all tracks (with optional user filter and search)
router.get('/', optionalAuth, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const source = req.query.source as string | undefined;
    const userId = req.query.userId as string | undefined;
    const search = req.query.search as string | undefined;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (source) where.sourceType = source;
    if (userId) where.uploadedBy = userId;
    
    // Add search filter
    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { artist: { contains: search, mode: 'insensitive' } },
        { album: { contains: search, mode: 'insensitive' } }
      ];
    }

    const tracks = await prisma.track.findMany({
      where,
      include: {
        user: { select: { displayName: true } },
        likedBy: req.userId ? { where: { userId: req.userId } } : false
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add isLiked flag
    const tracksWithLiked = tracks.map(track => ({
      ...track,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isLiked: req.userId ? ((track as any).likedBy?.length > 0) : false,
      likedBy: undefined
    }));

    res.json(tracksWithLiked);
  } catch (error) {
    console.error('Get tracks error:', error);
    res.status(500).json({ error: 'Failed to get tracks' });
  }
});

// Get single track
router.get('/:id', optionalAuth, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const track = await prisma.track.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { displayName: true } },
        likedBy: req.userId ? { where: { userId: req.userId } } : false
      }
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json({
      ...track,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isLiked: req.userId ? ((track as any).likedBy?.length > 0) : false,
      likedBy: undefined
    });
  } catch (error) {
    console.error('Get track error:', error);
    res.status(500).json({ error: 'Failed to get track' });
  }
});

// Like/Unlike a track
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const trackId = req.params.id;
    const userId = req.userId!;

    const existing = await prisma.likedTrack.findUnique({
      where: { userId_trackId: { userId, trackId } }
    });

    if (existing) {
      // Unlike
      await prisma.likedTrack.delete({
        where: { id: existing.id }
      });
      res.json({ liked: false });
    } else {
      // Like
      await prisma.likedTrack.create({
        data: { userId, trackId }
      });
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Like track error:', error);
    res.status(500).json({ error: 'Failed to like track' });
  }
});

// Get user's liked tracks
router.get('/liked/me', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const likedTracks = await prisma.likedTrack.findMany({
      where: { userId: req.userId },
      include: { track: true },
      orderBy: { likedAt: 'desc' }
    });

    res.json(likedTracks.map(lt => ({ ...lt.track, isLiked: true })));
  } catch (error) {
    console.error('Get liked tracks error:', error);
    res.status(500).json({ error: 'Failed to get liked tracks' });
  }
});

// Record a track play (recently played)
router.post('/:id/play', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const trackId = req.params.id;
    const userId = req.userId!;

    // Create a new play record
    await prisma.recentlyPlayed.create({
      data: { userId, trackId }
    });

    // Clean up old records (keep only last 100 per user)
    const oldRecords = await prisma.recentlyPlayed.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      skip: 100,
      select: { id: true }
    });

    if (oldRecords.length > 0) {
      await prisma.recentlyPlayed.deleteMany({
        where: { id: { in: oldRecords.map(r => r.id) } }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Record play error:', error);
    res.status(500).json({ error: 'Failed to record play' });
  }
});

// Get recently played tracks
router.get('/history/recent', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const limitParam = req.query.limit;
    const limit = typeof limitParam === 'string' ? parseInt(limitParam) : 20;

    // Get distinct recent tracks (no duplicates)
    const recentPlays = await prisma.recentlyPlayed.findMany({
      where: { userId: req.userId },
      include: { 
        track: {
          include: {
            likedBy: req.userId ? { where: { userId: req.userId } } : false
          }
        }
      },
      orderBy: { playedAt: 'desc' },
      take: limit * 3 // Get more to filter duplicates
    });

    // Filter to unique tracks
    const seen = new Set<string>();
    const uniqueTracks = recentPlays
      .filter(rp => {
        if (seen.has(rp.trackId)) return false;
        seen.add(rp.trackId);
        return true;
      })
      .slice(0, limit)
      .map(rp => ({
        ...rp.track,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isLiked: ((rp.track as any).likedBy?.length > 0),
        likedBy: undefined,
        playedAt: rp.playedAt
      }));

    res.json(uniqueTracks);
  } catch (error) {
    console.error('Get recently played error:', error);
    res.status(500).json({ error: 'Failed to get recently played' });
  }
});

// Delete a track (owner only)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const track = await prisma.track.findUnique({
      where: { id: req.params.id }
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    if (track.uploadedBy !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this track' });
    }

    await prisma.track.delete({ where: { id: req.params.id } });
    res.json({ message: 'Track deleted' });
  } catch (error) {
    console.error('Delete track error:', error);
    res.status(500).json({ error: 'Failed to delete track' });
  }
});

export default router;
