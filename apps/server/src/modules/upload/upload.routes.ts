import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../../middleware/auth.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ukppz0tr',
  api_key: process.env.CLOUDINARY_API_KEY || '665945279242384',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'dRUBS107p0VGRIZJuo8L3zurJjI',
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Disallow dangerous executables
    const dangerousExtensions = /\.(exe|bat|cmd|sh|bin|msi|vbs)$/i;
    if (file.originalname.match(dangerousExtensions)) {
      return cb(new Error('Executable file uploads are forbidden for security.'));
    }
    cb(null, true);
  },
});

export const uploadRouter = Router();

uploadRouter.post(
  '/',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const originalName = req.file.originalname;
      const mimeType = req.file.mimetype;
      const size = req.file.size;

      // Determine resource type: images and pdfs/documents
      let resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto';
      if (mimeType.startsWith('image/')) {
        resourceType = 'image';
      } else if (mimeType.startsWith('video/')) {
        resourceType = 'video';
      } else {
        resourceType = 'raw';
      }

      const streamUpload = (fileBuffer: Buffer) => {
        return new Promise<any>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'nexora_campus',
              resource_type: resourceType,
              use_filename: true,
              filename_override: originalName,
            },
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          );
          stream.end(fileBuffer);
        });
      };

      const result = await streamUpload(req.file.buffer);

      res.json({
        url: result.secure_url,
        publicId: result.public_id,
        name: originalName,
        size,
        mimeType,
      });
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      res.status(500).json({ error: err.message || 'File upload to Cloudinary failed' });
    }
  }
);
