import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Notice } from './notice.model.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { dispatchAudienceNotification } from '../notifications/notification.service.js';

const router = Router();

const createNoticeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  summary: z.string().optional(),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'HIGH', 'CRITICAL', 'URGENT']).default('NORMAL'),
  category: z.enum(['ACADEMIC', 'ADMINISTRATIVE', 'EXAMINATION', 'PLACEMENT', 'SPORTS', 'URGENT']).default('ACADEMIC'),
  targetAudience: z.object({
    roles: z.array(z.enum(['STUDENT', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'])).default(['STUDENT', 'FACULTY']),
    departments: z.array(z.string()).default([]),
    academicYears: z.array(z.string()).optional(),
  }).optional(),
  expiresAt: z.string().optional(),
});

// GET /api/notices (List published notices with filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, priority, department, q } = req.query;
    const filter: Record<string, unknown> = { status: 'PUBLISHED' };

    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (department) filter['targetAudience.departments'] = { $in: [department, 'All Departments', ''] };

    if (q && typeof q === 'string') {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
      ];
    }

    const notices = await Notice.find(filter)
      .sort({ publishedAt: -1, priority: -1 })
      .limit(50)
      .lean();

    const safeNotices = notices.map((n) => ({
      ...n,
      id: n._id.toString(),
      hasRead: req.user ? n.readBy?.some((id) => id.toString() === req.user?.id) : false,
      readCount: n.readBy?.length || 0,
    }));

    res.json({ notices: safeNotices });
  } catch (err: unknown) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch campus notices' });
  }
});

// GET /api/notices/:id (Detail view)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const notice = await Notice.findById(req.params.id).lean();
    if (!notice) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Notice not found' });
      return;
    }

    res.json({
      notice: {
        ...notice,
        id: notice._id.toString(),
        readCount: notice.readBy?.length || 0,
      },
    });
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch notice details' });
  }
});

// POST /api/notices (Publish new notice - Faculty and Admins only)
router.post('/', authenticate, requireRole('FACULTY', 'ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = createNoticeSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const { title, content, summary, priority, category, targetAudience, expiresAt } = parseResult.data;

  try {
    const generatedSummary = summary || content.slice(0, 140) + '...';

    const notice = await Notice.create({
      instituteId: req.user!.instituteId ? new Types.ObjectId(req.user!.instituteId) : undefined,
      title,
      content,
      summary: generatedSummary,
      priority,
      category,
      status: 'PUBLISHED',
      targetAudience: targetAudience || {
        roles: ['STUDENT', 'FACULTY'],
        departments: [req.user!.department],
      },
      author: {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
        department: req.user!.department,
      },
      publishedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      readBy: [req.user!.id],
    });

    if (notice.instituteId) {
      dispatchAudienceNotification({
        instituteId: notice.instituteId.toString(),
        roles: (notice.targetAudience?.roles as any) || ['STUDENT', 'FACULTY'],
        departments: notice.targetAudience?.departments,
        academicYears: notice.targetAudience?.academicYears,
        excludeUserId: req.user!.id,
        title: `Notice: ${notice.title}`,
        message: notice.summary || notice.content.slice(0, 100),
        type: 'NOTICE',
        link: '/app/notices',
      }).catch((err) => console.error('Notice notification error:', err));
    }

    res.status(201).json({
      message: 'Notice published successfully across campus grid',
      notice: {
        ...notice.toJSON(),
        id: notice._id.toString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Notice publishing failed';
    res.status(500).json({ error: 'SERVER_ERROR', message });
  }
});

// PATCH /api/notices/:id/read (Track read receipts)
router.patch('/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Notice not found' });
      return;
    }

    const userId = req.user!.id;
    if (!notice.readBy.some((id) => id.toString() === userId)) {
      notice.readBy.push(userId as any);
      await notice.save();
    }

    res.json({ message: 'Read receipt recorded', readCount: notice.readBy.length });
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to record read receipt' });
  }
});

// DELETE /api/notices/:id (Delete notice)
router.delete('/:id', authenticate, requireRole('FACULTY', 'ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Notice not found' });
      return;
    }

    // Admins can delete any notice, faculty can delete their own
    if (req.user?.role !== 'ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      if (notice.author.id.toString() !== req.user?.id) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot delete notice published by another author' });
        return;
      }
    }

    await Notice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Notice retracted successfully' });
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete notice' });
  }
});

export default router;
