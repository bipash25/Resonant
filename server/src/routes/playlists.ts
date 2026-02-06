import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createPlaylistSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().default(false)
});

const addTrackSchema = z.object({
  trackId: z.string()
});

// Get user's playlists
router.get('/', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId: req.userId },
      include: {
        tracks: {
          include: { track: true },
          orderBy: { position: 'asc' },
          take: 4  // For cover preview
        },
        _count: { select: { tracks: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(playlists);
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ error: 'Failed to get playlists' });
  }
});

// Get single playlist
router.get('/:id', optionalAuth, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const playlistId = req.params.id;
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        user: { select: { displayName: true } },
        tracks: {
          include: { track: true },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    // Check if user can access
    if (!playlist.isPublic && playlist.userId !== req.userId) {
      return res.status(403).json({ error: 'Playlist is private' });
    }

    res.json(playlist);
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ error: 'Failed to get playlist' });
  }
});

// Create playlist
router.post('/', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const data = createPlaylistSchema.parse(req.body);

    const playlist = await prisma.playlist.create({
      data: {
        ...data,
        userId: req.userId!
      }
    });

    res.status(201).json(playlist);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

// Update playlist
router.patch('/:id', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const playlistId = req.params.id;
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.playlist.update({
      where: { id: playlistId },
      data: req.body
    });

    res.json(updated);
  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({ error: 'Failed to update playlist' });
  }
});

// Delete playlist
router.delete('/:id', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const playlistId = req.params.id;
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.playlist.delete({ where: { id: playlistId } });
    res.json({ message: 'Playlist deleted' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

// Add track to playlist
router.post('/:id/tracks', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const { trackId } = addTrackSchema.parse(req.body);
    const playlistId = req.params.id;

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get next position
    const lastTrack = await prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { position: 'desc' }
    });

    const position = (lastTrack?.position ?? -1) + 1;

    const playlistTrack = await prisma.playlistTrack.create({
      data: { playlistId, trackId, position },
      include: { track: true }
    });

    res.status(201).json(playlistTrack);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Add track error:', error);
    res.status(500).json({ error: 'Failed to add track' });
  }
});

// Remove track from playlist
router.delete('/:id/tracks/:trackId', authMiddleware, async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const playlistId = req.params.id;
    const trackId = req.params.trackId;

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }

    if (playlist.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.playlistTrack.delete({
      where: { playlistId_trackId: { playlistId, trackId } }
    });

    res.json({ message: 'Track removed from playlist' });
  } catch (error) {
    console.error('Remove track error:', error);
    res.status(500).json({ error: 'Failed to remove track' });
  }
});

export default router;
