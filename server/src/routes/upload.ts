import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import * as mm from 'music-metadata';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Configure multer
const storage = multer.diskStorage({
  destination: path.resolve(__dirname, '../../../uploads'),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '50')) * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.mp3', '.m4a', '.wav', '.flac', '.ogg', '.aac'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: ' + allowedTypes.join(', ')));
    }
  }
});

// Upload single track
router.post('/', authMiddleware, upload.single('file'), async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Extract metadata
    let metadata = null;
    try {
      metadata = await mm.parseFile(req.file.path);
    } catch (e) {
      console.warn('Could not parse metadata:', e);
    }

    const title = req.body.title || metadata?.common.title || path.basename(req.file.originalname, path.extname(req.file.originalname));
    const artist = req.body.artist || metadata?.common.artist || 'Unknown Artist';
    const album = req.body.album || metadata?.common.album;
    const duration = metadata?.format.duration ? Math.round(metadata.format.duration) : null;

    const track = await prisma.track.create({
      data: {
        title,
        artist,
        album,
        duration,
        coverUrl: null,
        sourceType: 'LOCAL',
        filePath: req.file.filename,
        uploadedBy: req.userId
      }
    });

    res.status(201).json(track);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload multiple tracks
router.post('/batch', authMiddleware, upload.array('files', 20), async (req: AuthRequest, res): Promise<Response | void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const tracks = await Promise.all(files.map(async (file) => {
      let metadata = null;
      try {
        metadata = await mm.parseFile(file.path);
      } catch (e) {
        console.warn('Could not parse metadata for', file.originalname);
      }

      const title = metadata?.common.title || path.basename(file.originalname, path.extname(file.originalname));
      const artist = metadata?.common.artist || 'Unknown Artist';
      const album = metadata?.common.album;
      const duration = metadata?.format.duration ? Math.round(metadata.format.duration) : null;

      return prisma.track.create({
        data: {
          title,
          artist,
          album,
          duration,
          sourceType: 'LOCAL',
          filePath: file.filename,
          uploadedBy: req.userId
        }
      });
    }));

    res.status(201).json({ uploaded: tracks.length, tracks });
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({ error: 'Batch upload failed' });
  }
});

export default router;
