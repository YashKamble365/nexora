import { Types } from 'mongoose';
import { Notification } from './notification.model.js';
import { User } from '../users/user.model.js';
import { getIO } from '../../socket/index.js';
import { NotificationDTO, NotificationType, Role } from '@nexora/types';

export interface SingleNotificationParams {
  userId: string | Types.ObjectId;
  instituteId: string | Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

export interface AudienceNotificationParams {
  instituteId: string | Types.ObjectId;
  roles?: Role[];
  departments?: string[];
  academicYears?: string[];
  excludeUserId?: string | Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

/**
 * Dispatches a notification to a single user with MongoDB persistence and real-time Socket.IO emission.
 */
export async function dispatchNotification(
  params: SingleNotificationParams
): Promise<NotificationDTO | null> {
  try {
    const userIdObj = new Types.ObjectId(params.userId);
    const instituteIdObj = new Types.ObjectId(params.instituteId);

    const notification = await Notification.create({
      userId: userIdObj,
      instituteId: instituteIdObj,
      title: params.title.trim(),
      message: params.message.trim(),
      type: params.type,
      link: params.link,
      isRead: false,
    });

    const dto: NotificationDTO = {
      id: notification._id.toString(),
      userId: notification.userId.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };

    const io = getIO();
    if (io) {
      io.to(`user_${dto.userId}`).emit('new_notification', dto);
    }

    return dto;
  } catch (err) {
    console.error('dispatchNotification error:', err);
    return null;
  }
}

/**
 * Dispatches bulk notifications to an audience matching specified criteria (roles, departments, academic years).
 */
export async function dispatchAudienceNotification(
  params: AudienceNotificationParams
): Promise<number> {
  try {
    const query: Record<string, unknown> = {
      status: 'ACTIVE',
    };

    if (params.instituteId) {
      query.instituteId = new Types.ObjectId(params.instituteId);
    }

    if (params.roles && params.roles.length > 0) {
      query.role = { $in: params.roles };
    }

    if (params.departments && params.departments.length > 0) {
      const activeDepts = params.departments.filter(
        (d) => d && d !== 'All Departments' && d.trim().length > 0
      );
      if (activeDepts.length > 0) {
        query.department = { $in: activeDepts };
      }
    }

    if (params.academicYears && params.academicYears.length > 0) {
      const activeYears = params.academicYears.filter((y) => y && y.trim().length > 0);
      if (activeYears.length > 0) {
        query.academicYear = { $in: activeYears };
      }
    }

    if (params.excludeUserId) {
      query._id = { $ne: new Types.ObjectId(params.excludeUserId) };
    }

    const recipients = await User.find(query).select('_id').lean();
    if (!recipients.length) return 0;

    const now = new Date();
    const instId = new Types.ObjectId(params.instituteId);
    const docs = recipients.map((r: any) => ({
      userId: r._id,
      instituteId: instId,
      title: params.title.trim(),
      message: params.message.trim(),
      type: params.type,
      link: params.link,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    }));

    const inserted = await Notification.insertMany(docs);

    const io = getIO();
    if (io) {
      inserted.forEach((item: any) => {
        const dto: NotificationDTO = {
          id: item._id.toString(),
          userId: item.userId.toString(),
          title: item.title,
          message: item.message,
          type: item.type,
          link: item.link,
          isRead: item.isRead,
          createdAt: item.createdAt ? item.createdAt.toISOString() : now.toISOString(),
        };
        io.to(`user_${dto.userId}`).emit('new_notification', dto);
      });
    }

    return inserted.length;
  } catch (err) {
    console.error('dispatchAudienceNotification error:', err);
    return 0;
  }
}

/**
 * Helper to notify department HoDs and Campus Admins (e.g. for new complaints, pending registrations).
 */
export async function notifyAdminsAndHod(
  instituteId: string | Types.ObjectId,
  department: string | undefined,
  payload: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    excludeUserId?: string | Types.ObjectId;
  }
): Promise<number> {
  try {
    const instId = new Types.ObjectId(instituteId);
    const orClauses: Record<string, unknown>[] = [
      { role: { $in: ['ADMIN', 'SUPER_ADMIN'] } },
    ];

    if (department && department !== 'All Departments') {
      orClauses.push({
        role: 'FACULTY',
        facultyRole: 'HOD',
        department,
      });
    } else {
      orClauses.push({
        role: 'FACULTY',
        facultyRole: 'HOD',
      });
    }

    const query: Record<string, unknown> = {
      instituteId: instId,
      status: 'ACTIVE',
      $or: orClauses,
    };

    if (payload.excludeUserId) {
      query._id = { $ne: new Types.ObjectId(payload.excludeUserId) };
    }

    const recipients = await User.find(query).select('_id').lean();
    if (!recipients.length) return 0;

    const now = new Date();
    const docs = recipients.map((r: any) => ({
      userId: r._id,
      instituteId: instId,
      title: payload.title.trim(),
      message: payload.message.trim(),
      type: payload.type,
      link: payload.link,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    }));

    const inserted = await Notification.insertMany(docs);

    const io = getIO();
    if (io) {
      inserted.forEach((item: any) => {
        const dto: NotificationDTO = {
          id: item._id.toString(),
          userId: item.userId.toString(),
          title: item.title,
          message: item.message,
          type: item.type,
          link: item.link,
          isRead: item.isRead,
          createdAt: item.createdAt ? item.createdAt.toISOString() : now.toISOString(),
        };
        io.to(`user_${dto.userId}`).emit('new_notification', dto);
      });
    }

    return inserted.length;
  } catch (err) {
    console.error('notifyAdminsAndHod error:', err);
    return 0;
  }
}
