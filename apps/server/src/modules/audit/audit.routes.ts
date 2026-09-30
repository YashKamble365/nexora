import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { AuditLog } from './audit.model.js';

export const auditRouter = Router();

export async function logAuditEvent(params: {
  actor: { id: string | Types.ObjectId; name: string; role: any; email: string };
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await AuditLog.create({
      actor: {
        id: new Types.ObjectId(params.actor.id),
        name: params.actor.name,
        role: params.actor.role,
        email: params.actor.email,
      },
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
    });
  } catch (err) {
    console.error('Audit log write error:', err);
  }
}

// GET /api/audit
auditRouter.get('/', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, entityType, search, limit = 50, page = 1 } = req.query;
    const query: any = {};

    if (action && action !== 'ALL') {
      query.action = action;
    }
    if (entityType && entityType !== 'ALL') {
      query.entityType = entityType;
    }
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim();
      query.$or = [
        { 'actor.name': { $regex: q, $options: 'i' } },
        { 'actor.email': { $regex: q, $options: 'i' } },
        { action: { $regex: q, $options: 'i' } },
        { entityId: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    res.json({
      data: logs.map((l: any) => ({
        id: l._id.toString(),
        actor: {
          id: l.actor?.id?.toString() || '',
          name: l.actor?.name || 'System',
          role: l.actor?.role || 'SYSTEM',
          email: l.actor?.email || 'system@nexora.edu',
        },
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        metadata: l.metadata,
        ipAddress: l.ipAddress || '127.0.0.1',
        createdAt: l.createdAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err: any) {
    console.error('Audit log fetch error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch audit trail' });
  }
});
