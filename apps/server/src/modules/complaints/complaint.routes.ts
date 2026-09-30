import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Complaint } from './complaint.model.js';
import { User } from '../users/user.model.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { dispatchNotification, notifyAdminsAndHod } from '../notifications/notification.service.js';

export const complaintRouter = Router();

// Helper to mask anonymous submissions
function sanitizeComplaint(complaint: any, viewerId: string, viewerRole: string) {
  const isOwner = complaint.submittedBy?.id?.toString() === viewerId;
  const isSuper = viewerRole === 'SUPER_ADMIN';

  if (complaint.isAnonymous && !isOwner && !isSuper) {
    return {
      ...complaint,
      submittedBy: {
        id: undefined,
        name: 'Anonymous Whistleblower',
        department: complaint.department,
      },
    };
  }
  return complaint;
}

// Helper to compute stage step for student visualization
export function getComplaintStage(status: string): { step: number; label: string; isComplete: boolean } {
  switch (status) {
    case 'SUBMITTED':
      return { step: 1, label: 'Ticket Filed', isComplete: false };
    case 'UNDER_REVIEW':
      return { step: 2, label: 'Under Department Review', isComplete: false };
    case 'ASSIGNED':
      return { step: 3, label: 'Grievance Officer Assigned', isComplete: false };
    case 'IN_PROGRESS':
      return { step: 4, label: 'Investigation & Resolution In Progress', isComplete: false };
    case 'RESOLVED':
      return { step: 5, label: 'Grievance Resolved', isComplete: true };
    case 'CLOSED':
      return { step: 5, label: 'Case Closed', isComplete: true };
    case 'REJECTED':
      return { step: -1, label: 'Dismissed / Rejected', isComplete: true };
    default:
      return { step: 1, label: 'Submitted', isComplete: false };
  }
}

// 1. GET /api/complaints - Filtered & Scoped Complaints List
complaintRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }
    if (!user.instituteId && user.role !== 'SUPER_ADMIN') {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User does not belong to an institute' });
      return;
    }

    const { status, category, priority, department, scope, search } = req.query;

    const conditions: any[] = [];
    if (user.role !== 'SUPER_ADMIN' && user.instituteId) {
      conditions.push({ instituteId: new Types.ObjectId(user.instituteId) });
    }

    // Role-based visibility
    if (user.role === 'STUDENT') {
      if (scope === 'ALL') {
        // Public board: show public/anonymous or own
        conditions.push({
          $or: [
            { 'submittedBy.id': new Types.ObjectId(user.id) },
            { isAnonymous: true },
          ],
        });
      } else {
        // By default, students see their own filed tickets
        conditions.push({ 'submittedBy.id': new Types.ObjectId(user.id) });
      }
    } else if (user.role === 'FACULTY') {
      // Faculty see their department's tickets or tickets assigned to them
      if (department && department !== 'ALL') {
        conditions.push({ department });
      } else {
        conditions.push({
          $or: [
            { department: user.department },
            { 'assignedTo.id': new Types.ObjectId(user.id) },
          ],
        });
      }
    } else if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      if (department && department !== 'ALL') {
        conditions.push({ department });
      }
    }

    if (status && status !== 'ALL') {
      conditions.push({ status });
    }

    if (category && category !== 'ALL') {
      conditions.push({ category });
    }

    if (priority && priority !== 'ALL') {
      conditions.push({ priority });
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim();
      conditions.push({
        $or: [
          { ticketNumber: { $regex: q, $options: 'i' } },
          { subject: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
        ],
      });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};

    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const sanitized = complaints.map((c: any) => ({
      ...sanitizeComplaint(c, user.id, user.role),
      id: c._id.toString(),
      stage: getComplaintStage(c.status),
    }));

    res.json({ complaints: sanitized });
  } catch (err: any) {
    console.error('Fetch complaints error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch complaints' });
  }
});

// 2. GET /api/complaints/track/:ticketNumber - Track Grievance Status & Visual Audit Stepper
complaintRouter.get('/track/:ticketNumber', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const ticketParam = req.params.ticketNumber;
    const ticketNumber = typeof ticketParam === 'string' ? ticketParam : Array.isArray(ticketParam) ? ticketParam[0] : '';
    if (!ticketNumber || ticketNumber.trim().length === 0) {
      res.status(400).json({ error: 'Ticket number is required' });
      return;
    }

    const cleanTicket = ticketNumber.trim();
    const complaint = await Complaint.findOne({
      ticketNumber: { $regex: new RegExp(`^${cleanTicket}$`, 'i') },
      instituteId: new Types.ObjectId(user.instituteId),
    }).lean();

    if (!complaint) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: `No grievance ticket found matching "${cleanTicket}". Please verify the ticket number format (e.g. TKT-202609-1234).`,
      });
      return;
    }

    const sanitized = sanitizeComplaint(complaint, user.id, user.role);
    const stage = getComplaintStage(complaint.status);

    res.json({
      complaint: {
        ...sanitized,
        id: (complaint as any)._id.toString(),
      },
      stage,
    });
  } catch (err: any) {
    console.error('Track complaint error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to track grievance ticket' });
  }
});

// 2. GET /api/complaints/stats - Live Summary Metrics
complaintRouter.get('/stats', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const instituteFilter = { instituteId: new Types.ObjectId(user.instituteId) };

    const [total, submitted, underReview, inProgress, resolved, urgent] = await Promise.all([
      Complaint.countDocuments(instituteFilter),
      Complaint.countDocuments({ ...instituteFilter, status: 'SUBMITTED' }),
      Complaint.countDocuments({ ...instituteFilter, status: 'UNDER_REVIEW' }),
      Complaint.countDocuments({ ...instituteFilter, status: 'IN_PROGRESS' }),
      Complaint.countDocuments({ ...instituteFilter, status: 'RESOLVED' }),
      Complaint.countDocuments({ ...instituteFilter, priority: 'URGENT', status: { $ne: 'RESOLVED' } }),
    ]);

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 100;

    res.json({
      stats: {
        total,
        submitted,
        underReview,
        inProgress,
        resolved,
        urgent,
        resolutionRate,
      },
    });
  } catch (err: any) {
    console.error('Complaint stats error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to calculate complaint stats' });
  }
});

// 3. GET /api/complaints/:id - Single Ticket Details with Timeline
complaintRouter.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const { id } = req.params;
    const complaint = await Complaint.findById(id).lean();

    if (!complaint) {
      res.status(404).json({ error: 'Complaint ticket not found' });
      return;
    }

    if (complaint.instituteId.toString() !== user.instituteId) {
      res.status(403).json({ error: 'Unauthorized to view complaint from another institute' });
      return;
    }

    const sanitized = sanitizeComplaint(complaint, user.id, user.role);
    res.json({
      ...sanitized,
      id: sanitized._id.toString(),
    });
  } catch (err: any) {
    console.error('Fetch complaint by id error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch complaint' });
  }
});

// 4. POST /api/complaints - File a Grievance (with Whistleblower & Cloudinary attachments)
complaintRouter.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const { subject, description, category, priority, department, location, isAnonymous, attachments } = req.body;

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      res.status(400).json({ error: 'Subject is required and cannot be empty' });
      return;
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      res.status(400).json({ error: 'Description is required and cannot be empty' });
      return;
    }

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      res.status(400).json({ error: 'Category is required' });
      return;
    }

    // Mandatory evidence validation: at least 1 supporting document/image required
    if (!Array.isArray(attachments) || attachments.length === 0) {
      res.status(400).json({
        error: 'EVIDENCE_REQUIRED',
        message: 'Supporting evidence is mandatory for submission of grievances. Please upload at least one photo, document, or proof file.',
      });
      return;
    }

    const validAttachments = attachments.filter(
      (a: any) => a && typeof a.url === 'string' && a.url.trim().length > 0
    );

    if (validAttachments.length === 0) {
      res.status(400).json({
        error: 'INVALID_EVIDENCE',
        message: 'Valid supporting evidence file attachment with URL is required.',
      });
      return;
    }

    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${dateStr}-${randomSuffix}`;

    const complaint: any = await Complaint.create({
      ticketNumber,
      instituteId: new Types.ObjectId(user.instituteId),
      subject: subject.trim(),
      description: description.trim(),
      category: category as any,
      priority: (priority || 'MEDIUM') as any,
      department: department || user.department,
      location: location?.trim(),
      isAnonymous: Boolean(isAnonymous),
      submittedBy: {
        id: new Types.ObjectId(user.id),
        name: isAnonymous ? 'Anonymous Whistleblower' : user.name,
        department: user.department,
      },
      attachments: validAttachments,
      status: 'SUBMITTED',
      timeline: [
        {
          status: 'SUBMITTED',
          actor: {
            id: new Types.ObjectId(user.id),
            name: isAnonymous ? 'Anonymous Student' : user.name,
            role: user.role,
          },
          note: 'Grievance ticket registered in campus system.',
          createdAt: new Date(),
        },
      ],
    });

    if (complaint.instituteId) {
      notifyAdminsAndHod(complaint.instituteId, complaint.department, {
        title: 'New Grievance Ticket',
        message: `#${complaint.ticketNumber} (${complaint.category}): ${complaint.subject}`,
        type: 'COMPLAINT',
        link: '/app/complaints',
        excludeUserId: user.id,
      }).catch((err) => console.error('Grievance notification error:', err));
    }

    res.status(201).json({
      message: 'Grievance ticket created successfully',
      complaint: {
        ...complaint.toJSON(),
        id: complaint._id.toString(),
      },
    });
  } catch (err: any) {
    console.error('Create complaint error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'Failed to file grievance' });
  }
});

// 5. PATCH /api/complaints/:id/status - Update Status & Append Timeline Note
complaintRouter.patch(
  '/:id/status',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { status, note } = req.body;

      if (!status) {
        res.status(400).json({ error: 'Status is required' });
        return;
      }

      const complaint = await Complaint.findOne({
        _id: id,
        instituteId: new Types.ObjectId(user.instituteId),
      });

      if (!complaint) {
        res.status(404).json({ error: 'Complaint not found' });
        return;
      }

      complaint.status = status;
      if (status === 'RESOLVED') {
        complaint.resolvedAt = new Date();
      }

      complaint.timeline.push({
        status,
        actor: {
          id: new Types.ObjectId(user.id),
          name: user.name,
          role: user.role,
        },
        note: note?.trim() || `Status progressed to ${status}`,
        createdAt: new Date(),
      });

      await complaint.save();

      if (complaint.submittedBy?.id && complaint.instituteId) {
        dispatchNotification({
          userId: complaint.submittedBy.id.toString(),
          instituteId: complaint.instituteId.toString(),
          title: `Grievance #${complaint.ticketNumber} Updated`,
          message: `Status changed to ${status}${note ? ': ' + note.trim() : ''}`,
          type: 'COMPLAINT',
          link: '/app/complaints',
        }).catch((err) => console.error('Status notification error:', err));
      }

      res.json({
        message: 'Status updated successfully',
        complaint: {
          ...complaint.toJSON(),
          id: complaint._id.toString(),
        },
      });
    } catch (err: any) {
      console.error('Update status error:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update ticket status' });
    }
  }
);

// 6. PATCH /api/complaints/:id/assign - Assign Ticket to Staff Member
complaintRouter.patch(
  '/:id/assign',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { assignedToUserId, note } = req.body;

      if (!assignedToUserId) {
        res.status(400).json({ error: 'assignedToUserId is required' });
        return;
      }

      const assignee = await User.findById(assignedToUserId);
      if (!assignee) {
        res.status(404).json({ error: 'Assignee user not found' });
        return;
      }

      const complaint = await Complaint.findOne({
        _id: id,
        instituteId: new Types.ObjectId(user.instituteId),
      });

      if (!complaint) {
        res.status(404).json({ error: 'Complaint not found' });
        return;
      }

      complaint.assignedTo = {
        id: assignee._id as any,
        name: assignee.name,
        role: assignee.role,
      };

      if (complaint.status === 'SUBMITTED' || complaint.status === 'UNDER_REVIEW') {
        complaint.status = 'ASSIGNED';
      }

      complaint.timeline.push({
        status: complaint.status,
        actor: {
          id: new Types.ObjectId(user.id),
          name: user.name,
          role: user.role,
        },
        note: note?.trim() || `Assigned to ${assignee.name} (${assignee.role})`,
        createdAt: new Date(),
      });

      await complaint.save();

      if (assignee._id && complaint.instituteId) {
        dispatchNotification({
          userId: assignee._id.toString(),
          instituteId: complaint.instituteId.toString(),
          title: 'Grievance Ticket Assigned to You',
          message: `#${complaint.ticketNumber}: ${complaint.subject}`,
          type: 'COMPLAINT',
          link: '/app/complaints',
        }).catch((err) => console.error('Assignee notification error:', err));
      }

      res.json({
        message: 'Complaint assigned successfully',
        complaint: {
          ...complaint.toJSON(),
          id: complaint._id.toString(),
        },
      });
    } catch (err: any) {
      console.error('Assign complaint error:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to assign complaint' });
    }
  }
);

// 7. POST /api/complaints/:id/timeline - Add Comment / Update to Timeline
complaintRouter.post(
  '/:id/timeline',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { note } = req.body;

      if (!note || note.trim().length === 0) {
        res.status(400).json({ error: 'Note content is required' });
        return;
      }

      const complaint = await Complaint.findOne({
        _id: id,
        instituteId: new Types.ObjectId(user.instituteId),
      });

      if (!complaint) {
        res.status(404).json({ error: 'Complaint not found' });
        return;
      }

      const isOwner = complaint.submittedBy?.id?.toString() === user.id;
      const isStaff = ['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
      if (!isOwner && !isStaff) {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Only the grievance filer or authorized faculty/admin can post updates to this ticket timeline.',
        });
        return;
      }

      complaint.timeline.push({
        status: complaint.status,
        actor: {
          id: new Types.ObjectId(user.id),
          name: complaint.isAnonymous && isOwner ? 'Anonymous Whistleblower' : user.name,
          role: user.role,
        },
        note: note.trim(),
        createdAt: new Date(),
      });

      await complaint.save();

      res.status(201).json({
        message: 'Note added to timeline',
        timeline: complaint.timeline,
      });
    } catch (err: any) {
      console.error('Add timeline note error:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to add timeline note' });
    }
  }
);

export default complaintRouter;
