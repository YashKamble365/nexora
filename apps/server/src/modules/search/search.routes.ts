import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../users/user.model.js';
import { Notice } from '../notices/notice.model.js';
import { Event } from '../events/event.model.js';
import { AcademicFile } from '../files/file.model.js';
import { authenticate } from '../../middleware/auth.js';

export const searchRouter = Router();

// GET /api/search - Global Quick Command Search
searchRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!q || q.length < 2) {
      res.json({ people: [], notices: [], events: [], files: [] });
      return;
    }

    const instituteId = new Types.ObjectId(user.instituteId);
    const regex = { $regex: q, $options: 'i' };

    const [people, notices, events, files] = await Promise.all([
      User.find({
        instituteId,
        status: 'ACTIVE',
        $or: [{ name: regex }, { institutionalId: regex }, { department: regex }],
      })
        .select('name role department academicYear institutionalId avatarUrl isOnline')
        .limit(6)
        .lean(),

      Notice.find({
        instituteId,
        status: 'PUBLISHED',
        $or: [{ title: regex }, { summary: regex }, { content: regex }],
      })
        .select('title summary priority category publishedAt')
        .limit(5)
        .lean(),

      Event.find({
        instituteId,
        status: { $in: ['UPCOMING', 'DRAFT'] },
        $or: [{ title: regex }, { venue: regex }, { description: regex }],
      })
        .select('title venue startDate category')
        .limit(5)
        .lean(),

      AcademicFile.find({
        instituteId,
        $or: [{ title: regex }, { subjectCode: regex }, { fileName: regex }, { description: regex }],
      })
        .select('title fileName category fileUrl subjectCode fileSize')
        .limit(5)
        .lean(),
    ]);

    res.json({
      people: people.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        role: p.role,
        department: p.department,
        academicYear: p.academicYear,
        institutionalId: p.institutionalId,
        isOnline: p.isOnline,
      })),
      notices: notices.map((n: any) => ({
        id: n._id.toString(),
        title: n.title,
        summary: n.summary,
        priority: n.priority,
        category: n.category,
      })),
      events: events.map((e: any) => ({
        id: e._id.toString(),
        title: e.title,
        venue: e.venue,
        startDate: e.startDate?.toISOString(),
        category: e.category,
      })),
      files: files.map((f: any) => ({
        id: f._id.toString(),
        title: f.title,
        fileName: f.fileName,
        category: f.category,
        fileUrl: f.fileUrl,
        subjectCode: f.subjectCode,
      })),
    });
  } catch (err: any) {
    console.error('Global search error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to perform search' });
  }
});
