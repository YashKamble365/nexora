import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { Report } from './report.model.js';
import { Message } from '../messages/message.model.js';
import { Conversation } from '../conversations/conversation.model.js';

export const reportRouter = Router();

// 1. Submit a harassment / misuse report
reportRouter.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { reportedUserId, conversationId, messageId, reason } = req.body;

    if (!reportedUserId || !conversationId || !reason) {
      res.status(400).json({ error: 'reportedUserId, conversationId, and reason are required' });
      return;
    }

    // Capture snapshot of recent messages as unalterable audit evidence
    const recentMessages = await Message.find({ conversationId: new Types.ObjectId(conversationId) })
      .populate('senderId', 'name institutionalId role')
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    const snapshot = JSON.stringify(
      recentMessages.reverse().map((m: any) => ({
        sender: m.senderId?.name,
        role: m.senderId?.role,
        id: m.senderId?.institutionalId,
        content: m.content,
        timestamp: m.createdAt,
      }))
    );

    const report = await Report.create({
      instituteId: new Types.ObjectId(user.instituteId),
      reporterId: new Types.ObjectId(user.id),
      reportedUserId: new Types.ObjectId(reportedUserId),
      conversationId: new Types.ObjectId(conversationId),
      messageId: messageId ? new Types.ObjectId(messageId) : undefined,
      reason: reason.trim(),
      contextSnapshot: snapshot,
      status: 'PENDING',
    });

    res.status(201).json({
      message: 'Report submitted successfully. Campus administration has been notified.',
      reportId: report._id.toString(),
    });
  } catch (err: any) {
    console.error('Submit report error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit report' });
  }
});

// 2. Get reports for institute administration review
reportRouter.get(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      let instituteId: Types.ObjectId | null = user.instituteId ? new Types.ObjectId(user.instituteId) : null;
      if (!instituteId && user.role === 'SUPER_ADMIN') {
        const { Institute } = await import('../institutes/institute.model.js');
        const firstInst = await Institute.findOne({ status: 'APPROVED' });
        if (firstInst) instituteId = firstInst._id as Types.ObjectId;
      }

      const query = instituteId && user.role !== 'SUPER_ADMIN' ? { instituteId } : {};
      const reports = await Report.find(query)
        .populate('reporterId', 'name institutionalId department role')
        .populate('reportedUserId', 'name institutionalId department role')
        .sort({ createdAt: -1 })
        .lean();

      const dtos = reports.map((r: any) => ({
        ...r,
        id: r._id.toString(),
      }));

      res.json(dtos);
    } catch (err: any) {
      console.error('Fetch reports error:', err);
      res.status(500).json({ error: err.message || 'Failed to fetch reports' });
    }
  }
);

// 3. Resolve or dismiss report
reportRouter.patch(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      let instituteId: Types.ObjectId | null = user.instituteId ? new Types.ObjectId(user.instituteId) : null;
      if (!instituteId && user.role === 'SUPER_ADMIN') {
        const { Institute } = await import('../institutes/institute.model.js');
        const firstInst = await Institute.findOne({ status: 'APPROVED' });
        if (firstInst) instituteId = firstInst._id as Types.ObjectId;
      }

      const { id } = req.params;
      const { status, resolutionNotes, blockUserInConversation } = req.body;

      const query: any = { _id: id };
      if (instituteId && user.role !== 'SUPER_ADMIN') {
        query.instituteId = instituteId;
      }

      const report = await Report.findOne(query);

      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      report.status = status || report.status;
      report.resolutionNotes = resolutionNotes || report.resolutionNotes;
      report.resolvedBy = new Types.ObjectId(user.id);
      report.resolvedAt = new Date();
      await report.save();

      // If disciplinary action includes blocking the conversation
      if (blockUserInConversation && report.conversationId) {
        await Conversation.findByIdAndUpdate(report.conversationId, {
          status: 'BLOCKED',
        });
      }

      res.json({ message: 'Report updated successfully', report });
    } catch (err: any) {
      console.error('Update report error:', err);
      res.status(500).json({ error: err.message || 'Failed to update report' });
    }
  }
);
