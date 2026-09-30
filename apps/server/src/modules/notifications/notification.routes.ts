import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Notification } from './notification.model.js';
import { authenticate } from '../../middleware/auth.js';

export const notificationRouter = Router();

// 1. GET /api/notifications - User's Live Activity & Alert Feed
notificationRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const notifications = await Notification.find({
      userId: new Types.ObjectId(user.id),
      instituteId: new Types.ObjectId(user.instituteId),
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const dtos = notifications.map((n: any) => ({
      id: n._id.toString(),
      userId: n.userId.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));

    res.json(dtos);
  } catch (err: any) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch notifications' });
  }
});

// 2. PATCH /api/notifications/:id/read - Mark Single Notification Read
notificationRouter.patch('/:id/read', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(user.id) },
      { isRead: true }
    );

    res.json({ message: 'Marked read' });
  } catch (err: any) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to mark read' });
  }
});

// 3. PATCH /api/notifications/read-all - Mark All Read
notificationRouter.patch('/read-all', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    await Notification.updateMany(
      { userId: new Types.ObjectId(user.id), isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err: any) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to mark all read' });
  }
});
