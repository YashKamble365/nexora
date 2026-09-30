import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { EmergencyAlert } from './emergency.model.js';
import { Notification } from '../notifications/notification.model.js';
import { User } from '../users/user.model.js';
import { Institute } from '../institutes/institute.model.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { getIO } from '../../socket/index.js';
import { logAuditEvent } from '../audit/audit.routes.js';

export const emergencyRouter = Router();

// 1. GET /api/emergency/active - Current Active Broadcasts
emergencyRouter.get('/active', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (!user.instituteId && user.role !== 'SUPER_ADMIN')) {
      res.json([]);
      return;
    }

    const now = new Date();
    const query: any = {
      isActive: true,
    };
    if (user.role !== 'SUPER_ADMIN' && user.instituteId) {
      query.instituteId = new Types.ObjectId(user.instituteId);
    }

    const alerts = await EmergencyAlert.find(query).sort({ createdAt: -1 }).lean();

    // Auto-deactivate expired alerts
    const activeAlerts: any[] = [];
    for (const alert of alerts) {
      if (new Date(alert.expiresAt) < now) {
        await EmergencyAlert.findByIdAndUpdate(alert._id, { isActive: false });
      } else {
        activeAlerts.push({
          id: alert._id.toString(),
          instituteId: alert.instituteId.toString(),
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          affectedAreas: alert.affectedAreas,
          actionRequired: alert.actionRequired,
          issuedBy: {
            id: alert.issuedBy?.id?.toString() || '',
            name: alert.issuedBy?.name || 'Campus Administrator',
            role: alert.issuedBy?.role || 'ADMIN',
          },
          isActive: alert.isActive,
          expiresAt: alert.expiresAt.toISOString(),
          createdAt: alert.createdAt.toISOString(),
          updatedAt: alert.updatedAt.toISOString(),
        });
      }
    }

    res.json(activeAlerts);
  } catch (err: any) {
    console.error('Fetch active emergency alerts error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch emergency alerts' });
  }
});

// 2. GET /api/emergency/history - Past Emergency Declarations Archive
emergencyRouter.get('/history', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (!user.instituteId && user.role !== 'SUPER_ADMIN')) {
      res.json([]);
      return;
    }

    const query: any = { isActive: false };
    if (user.role !== 'SUPER_ADMIN' && user.instituteId) {
      query.instituteId = new Types.ObjectId(user.instituteId);
    }

    const alerts = await EmergencyAlert.find(query)
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const dtos = alerts.map((alert: any) => ({
      id: alert._id.toString(),
      instituteId: alert.instituteId?.toString() || '',
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      affectedAreas: alert.affectedAreas,
      actionRequired: alert.actionRequired,
      issuedBy: {
        id: alert.issuedBy?.id?.toString() || '',
        name: alert.issuedBy?.name || 'Administrator',
        role: alert.issuedBy?.role || 'ADMIN',
      },
      isActive: false,
      expiresAt: alert.expiresAt.toISOString(),
      resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : undefined,
      resolvedBy: alert.resolvedBy,
      resolutionNote: alert.resolutionNote,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
    }));

    res.json(dtos);
  } catch (err: any) {
    console.error('Fetch emergency history error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch emergency history' });
  }
});

// 3. POST /api/emergency - Declare High-Priority Campus Emergency (Admin, Super Admin & Faculty)
emergencyRouter.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { title, message, severity, affectedAreas, actionRequired, confirmationCode, expiresHours = 6 } = req.body;

      if (!title || !message || !severity || !actionRequired) {
        res.status(400).json({
          error: 'Title, detailed message, severity level, and mandatory action required are mandatory.',
        });
        return;
      }

      if (confirmationCode !== 'CONFIRM_BROADCAST') {
        res.status(400).json({
          error: 'INVALID_CONFIRMATION',
          message: 'Double-confirmation code "CONFIRM_BROADCAST" is required to authorize campus emergency sirens.',
        });
        return;
      }

      let instId = user.instituteId;
      if (!instId && req.body.instituteId) {
        instId = req.body.instituteId;
      }
      if (!instId) {
        const firstInst = await Institute.findOne({ status: 'APPROVED' });
        if (firstInst) instId = firstInst._id.toString();
      }
      if (!instId) {
        res.status(400).json({ error: 'No valid institute found for emergency broadcast' });
        return;
      }

      const expiresAt = new Date(Date.now() + Number(expiresHours) * 3600 * 1000);

      const alert = await EmergencyAlert.create({
        title: title.trim(),
        message: message.trim(),
        severity,
        affectedAreas: Array.isArray(affectedAreas) && affectedAreas.length > 0 ? affectedAreas : ['Entire Campus'],
        actionRequired: actionRequired.trim(),
        issuedBy: {
          id: new Types.ObjectId(user.id),
          name: user.name,
          role: user.role,
        },
        instituteId: new Types.ObjectId(instId),
        isActive: true,
        expiresAt,
      });

      const dto = {
        id: alert._id.toString(),
        instituteId: alert.instituteId.toString(),
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        affectedAreas: alert.affectedAreas,
        actionRequired: alert.actionRequired,
        issuedBy: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        isActive: true,
        expiresAt: alert.expiresAt.toISOString(),
        createdAt: alert.createdAt.toISOString(),
        updatedAt: alert.updatedAt.toISOString(),
      };

      // 1. Broadcast instantaneously to all connected browser sockets in the institute & super admin
      const io = getIO();
      if (io) {
        io.to(`institute_${instId}`).emit('emergency_alert_broadcast', dto);
        io.to('super_admin_room').emit('emergency_alert_broadcast', dto);
      }

      // 2. Insert high-priority Notification records for audit trail
      const instituteUsers = await User.find({
        instituteId: new Types.ObjectId(instId),
        status: 'ACTIVE',
      }).select('_id').lean();

      const notifDocs = instituteUsers.map((u: any) => ({
        userId: u._id,
        instituteId: new Types.ObjectId(instId),
        title: `EMERGENCY ALERT: ${alert.title}`,
        message: alert.actionRequired,
        type: 'SYSTEM',
        link: '/app/emergency',
        isRead: false,
      }));

      const insertedNotifs = await Notification.insertMany(notifDocs);

      if (io) {
        insertedNotifs.forEach((n: any) => {
          io.to(`user_${n.userId.toString()}`).emit('new_notification', {
            id: n._id.toString(),
            userId: n.userId.toString(),
            title: n.title,
            message: n.message,
            type: n.type,
            link: n.link,
            isRead: n.isRead,
            createdAt: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(),
          });
        });
      }

      await logAuditEvent({
        actor: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
        action: 'EMERGENCY_BROADCAST',
        entityType: 'EMERGENCY_ALERT',
        entityId: alert._id.toString(),
        metadata: {
          title: alert.title,
          severity: alert.severity,
          affectedAreas: alert.affectedAreas,
          actionRequired: alert.actionRequired,
        },
        ipAddress: req.ip || '127.0.0.1',
      });

      res.status(201).json({
        message: 'Emergency broadcast triggered and delivered to all institutional channels.',
        alert: dto,
      });
    } catch (err: any) {
      console.error('Declare emergency error:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'Failed to issue emergency alert' });
    }
  }
);

// 4. PATCH /api/emergency/:id/deactivate - Deactivate / Issue All-Clear
emergencyRouter.patch(
  ['/:id/deactivate', '/:id/resolve'],
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { id } = req.params;
      const { resolutionNote } = req.body;

      let alert;
      if (user.role === 'SUPER_ADMIN') {
        alert = await EmergencyAlert.findById(id);
      } else {
        alert = await EmergencyAlert.findOne({
          _id: id,
          instituteId: new Types.ObjectId(user.instituteId),
        });
      }

      if (!alert) {
        res.status(404).json({ error: 'Emergency alert not found' });
        return;
      }

      alert.isActive = false;
      alert.resolvedAt = new Date();
      alert.resolvedBy = {
        id: new Types.ObjectId(user.id),
        name: user.name,
      };
      alert.resolutionNote = resolutionNote?.trim() || 'All-clear issued by campus administration. Safe to resume operations.';
      await alert.save();

      // Emit All-Clear to institute room and super admin
      const io = getIO();
      if (io) {
        io.to(`institute_${alert.instituteId}`).emit('emergency_alert_deactivated', {
          id: alert._id.toString(),
          resolutionNote: alert.resolutionNote,
        });
        io.to('super_admin_room').emit('emergency_alert_deactivated', {
          id: alert._id.toString(),
          resolutionNote: alert.resolutionNote,
        });
      }

      await logAuditEvent({
        actor: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
        action: 'EMERGENCY_DEACTIVATED',
        entityType: 'EMERGENCY_ALERT',
        entityId: alert._id.toString(),
        metadata: {
          title: alert.title,
          resolutionNote: alert.resolutionNote,
        },
        ipAddress: req.ip || '127.0.0.1',
      });

      res.json({
        message: 'Emergency state deactivated. All-clear broadcast delivered.',
        alert: {
          ...alert.toJSON(),
          id: alert._id.toString(),
        },
      });
    } catch (err: any) {
      console.error('Deactivate emergency error:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'Failed to deactivate alert' });
    }
  }
);
