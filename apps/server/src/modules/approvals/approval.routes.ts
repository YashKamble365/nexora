import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { User, IUserDocument } from '../users/user.model.js';
import { Institute } from '../institutes/institute.model.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { dispatchNotification } from '../notifications/notification.service.js';

const router = Router();

// GET /api/approvals/pending
// Hierarchical query based on caller's authority
router.get('/pending', authenticate, requireRole('FACULTY', 'ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const callerId = req.user?.id;
    const caller = await User.findById(callerId);
    if (!caller) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Caller profile not found' });
      return;
    }

    let filter: Record<string, unknown> = { status: 'PENDING' };

    if (caller.role === 'SUPER_ADMIN') {
      const { instituteId } = req.query;
      if (instituteId && instituteId !== 'ALL' && Types.ObjectId.isValid(instituteId as string)) {
        filter.instituteId = new Types.ObjectId(instituteId as string);
      }
    } else if (caller.role === 'ADMIN') {
      // Institute Admin sees all pending faculty & students in their institute
      filter = {
        instituteId: caller.instituteId,
        status: 'PENDING',
        role: { $in: ['STUDENT', 'FACULTY'] },
        _id: { $ne: caller._id },
      };
    } else if (caller.role === 'FACULTY') {
      if (caller.facultyRole === 'HOD') {
        // HoD sees all pending students and faculty within their department in their institute
        filter = {
          instituteId: caller.instituteId,
          department: caller.department,
          status: 'PENDING',
          role: { $in: ['STUDENT', 'FACULTY'] },
          _id: { $ne: caller._id },
        };
      } else if (caller.facultyRole === 'CLASS_COORDINATOR') {
        // Class Coordinator sees pending students in their department AND assigned academicYear
        filter = {
          instituteId: caller.instituteId,
          department: caller.department,
          academicYear: caller.coordinatorYear,
          status: 'PENDING',
          role: 'STUDENT',
        };
      } else {
        // Regular professor cannot approve unless assigned
        res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Only Class Coordinators, HoDs, and Institute Admins have student approval authority',
        });
        return;
      }
    }

    const pendingUsers = await User.find(filter)
      .populate('instituteId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    // Map to safe DTO
    const safeUsers = pendingUsers.map((u) => {
      const inst = u.instituteId as unknown as { _id: string; name: string; code: string } | undefined;
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        institutionalId: u.institutionalId,
        department: u.department,
        academicYear: u.academicYear,
        facultyRole: u.facultyRole,
        coordinatorYear: u.coordinatorYear,
        instituteId: inst ? inst._id.toString() : undefined,
        instituteName: inst ? inst.name : undefined,
        instituteCode: inst ? inst.code : undefined,
        createdAt: u.createdAt,
      };
    });

    res.json({
      pendingUsers: safeUsers,
      callerScope: {
        role: caller.role,
        facultyRole: caller.facultyRole,
        department: caller.department,
        coordinatorYear: caller.coordinatorYear,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve pending approvals' });
  }
});

const decisionSchema = z.object({
  status: z.enum(['ACTIVE', 'REJECTED']),
  reason: z.string().optional(),
});

// PATCH /api/approvals/users/:id
router.patch('/users/:id', authenticate, requireRole('FACULTY', 'ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = decisionSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors });
    return;
  }

  const { status, reason } = parseResult.data;

  try {
    const caller = await User.findById(req.user?.id);
    if (!caller) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Caller profile not found' });
      return;
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      res.status(404).json({ error: 'TARGET_NOT_FOUND', message: 'Target user record not found' });
      return;
    }

    // Jurisdiction checks
    if (caller.role !== 'SUPER_ADMIN') {
      // Must be same institute
      if (caller.instituteId?.toString() !== targetUser.instituteId?.toString()) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot approve users outside your registered institute' });
        return;
      }

      if (caller.role === 'FACULTY') {
        if (caller.facultyRole === 'HOD') {
          // HoD can verify students and faculty in their own department
          if (!['STUDENT', 'FACULTY'].includes(targetUser.role)) {
            res.status(403).json({ error: 'FORBIDDEN', message: 'HoD can only verify students and faculty' });
            return;
          }
          if (caller.department !== targetUser.department) {
            res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot approve users from another department' });
            return;
          }
          if (targetUser._id.toString() === caller._id.toString()) {
            res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot approve your own account' });
            return;
          }
        } else if (caller.facultyRole === 'CLASS_COORDINATOR') {
          if (targetUser.role !== 'STUDENT') {
            res.status(403).json({ error: 'FORBIDDEN', message: 'Class coordinators can only verify student registrations' });
            return;
          }

          if (caller.department !== targetUser.department) {
            res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot approve students from another department' });
            return;
          }

          if (caller.coordinatorYear && targetUser.academicYear && caller.coordinatorYear !== targetUser.academicYear) {
            res.status(403).json({
              error: 'FORBIDDEN',
              message: `You are coordinator for ${caller.coordinatorYear}, not ${targetUser.academicYear}`,
            });
            return;
          }
        } else {
          res.status(403).json({ error: 'FORBIDDEN', message: 'Regular faculty cannot approve registrations' });
          return;
        }
      }
    }

    targetUser.status = status;
    targetUser.approvedBy = caller._id;
    targetUser.approvedAt = new Date();
    if (status === 'REJECTED') {
      targetUser.rejectionReason = reason || 'Registration details could not be verified by institute coordinator';
    }

    await targetUser.save();

    if (targetUser.instituteId) {
      dispatchNotification({
        userId: targetUser._id.toString(),
        instituteId: targetUser.instituteId.toString(),
        title: status === 'ACTIVE' ? 'Account Approved' : 'Registration Declined',
        message: status === 'ACTIVE'
          ? `Your Nexora campus profile has been verified and approved by ${caller.name}.`
          : `Registration was declined: ${targetUser.rejectionReason}`,
        type: 'SYSTEM',
        link: '/app',
      }).catch((err) => console.error('Approval notification error:', err));
    }

    res.json({
      message: `User ${targetUser.name} has been ${status === 'ACTIVE' ? 'approved and activated' : 'rejected'}`,
      user: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        status: targetUser.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update approval decision' });
  }
});

// POST /api/approvals/users/batch (Batch approve)
router.post('/users/batch', authenticate, requireRole('FACULTY', 'ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const batchSchema = z.object({
    userIds: z.array(z.string()).min(1),
    status: z.enum(['ACTIVE', 'REJECTED']),
  });

  const parseResult = batchSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'VALIDATION_ERROR', details: parseResult.error.flatten().fieldErrors });
    return;
  }

  const { userIds, status } = parseResult.data;

  try {
    const caller = await User.findById(req.user?.id);
    if (!caller) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Caller profile not found' });
      return;
    }

    let filter: Record<string, unknown> = { _id: { $in: userIds }, status: 'PENDING' };

    if (caller.role === 'ADMIN') {
      filter.instituteId = caller.instituteId;
    } else if (caller.role === 'FACULTY') {
      filter.instituteId = caller.instituteId;
      filter.department = caller.department;
      if (caller.facultyRole === 'HOD') {
        filter.role = { $in: ['STUDENT', 'FACULTY'] };
        filter._id = { $in: userIds, $ne: caller._id };
      } else if (caller.facultyRole === 'CLASS_COORDINATOR') {
        filter.role = 'STUDENT';
        if (caller.coordinatorYear) {
          filter.academicYear = caller.coordinatorYear;
        }
      } else {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Regular faculty cannot batch approve' });
        return;
      }
    }

    const result = await User.updateMany(filter, {
      $set: {
        status,
        approvedBy: caller._id,
        approvedAt: new Date(),
      },
    });

    if (Array.isArray(userIds)) {
      userIds.forEach((uid) => {
        dispatchNotification({
          userId: uid,
          instituteId: caller.instituteId ? caller.instituteId.toString() : '',
          title: status === 'ACTIVE' ? 'Account Approved' : 'Registration Declined',
          message: status === 'ACTIVE'
            ? `Your Nexora campus profile has been verified and approved by ${caller.name}.`
            : 'Your registration was declined by your institute administrator.',
          type: 'SYSTEM',
          link: '/app',
        }).catch((err) => console.error('Batch approval notification error:', err));
      });
    }

    res.json({
      message: `Successfully processed ${result.modifiedCount} user records`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to process batch approval' });
  }
});

export default router;
