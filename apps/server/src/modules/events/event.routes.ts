import jwt from 'jsonwebtoken';
import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { Event } from './event.model.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { dispatchNotification, dispatchAudienceNotification } from '../notifications/notification.service.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nexora-campus-jwt-secret-key-2026';

const createEventSchema = z.object({
  title: z.string().min(3, 'Event title must be at least 3 characters'),
  description: z.string().min(5, 'Event description required'),
  category: z.string().default('Workshop'),
  venue: z.string().min(2, 'Venue required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationDeadline: z.string().min(1, 'Registration deadline is required'),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1').default(100),
});

// GET /api/events (List events with registration state & institute scoping)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, status } = req.query;
    const filter: Record<string, unknown> = {};

    let currentUserId = req.user?.id;
    let userInstituteId = req.user?.instituteId;
    const authHeader = req.headers.authorization;
    if ((!currentUserId || !userInstituteId) && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        currentUserId = decoded.id;
        userInstituteId = decoded.instituteId;
      } catch {
        // ignore invalid token for public listing
      }
    }

    if (userInstituteId) {
      filter.instituteId = new Types.ObjectId(userInstituteId);
    }

    // Auto-transition past events to COMPLETED
    const now = new Date();
    await Event.updateMany(
      {
        status: 'UPCOMING',
        endDate: { $lt: now },
        ...(userInstituteId ? { instituteId: new Types.ObjectId(userInstituteId) } : {}),
      },
      { $set: { status: 'COMPLETED' } }
    );

    if (category && category !== 'ALL') filter.category = category;
    if (status && status !== 'ALL') filter.status = status;

    const events = await Event.find(filter)
      .sort({ startDate: 1 })
      .limit(100)
      .lean();

    const enriched = events.map((ev) => {
      const isPast = new Date(ev.endDate) < now;
      const computedStatus = isPast && ev.status === 'UPCOMING' ? 'COMPLETED' : ev.status;
      return {
        ...ev,
        id: ev._id.toString(),
        status: computedStatus,
        registeredCount: ev.registeredUsers?.length || 0,
        isRegistered: currentUserId
          ? ev.registeredUsers?.some((uid) => uid.toString() === currentUserId)
          : false,
      };
    });

    res.json({ events: enriched });
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch campus events' });
  }
});

// POST /api/events (Create event - Faculty and Admin only)
router.post('/', authenticate, requireRole('FACULTY', 'ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = createEventSchema.safeParse(req.body);
  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten().fieldErrors;
    const errorDetails = Object.entries(fieldErrors)
      .map(([k, v]) => `${k}: ${v?.join(', ')}`)
      .join('; ');
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: errorDetails || 'Event validation failed',
      details: fieldErrors,
    });
    return;
  }

  const data = parseResult.data;

  try {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const registrationDeadline = new Date(data.registrationDeadline);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(registrationDeadline.getTime())) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid date/time provided. Please pick valid event dates.',
      });
      return;
    }

    if (endDate < startDate) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Event end time cannot be before event start time.',
      });
      return;
    }

    const instId = req.user?.instituteId;
    const event = await Event.create({
      ...data,
      instituteId: instId && Types.ObjectId.isValid(instId.toString()) ? new Types.ObjectId(instId.toString()) : undefined,
      startDate,
      endDate,
      registrationDeadline,
      organizer: {
        id: req.user!.id,
        name: req.user!.name,
        department: req.user!.department || 'Campus Administration',
      },
      registeredUsers: [],
      status: 'UPCOMING',
    });

    if (instId) {
      dispatchAudienceNotification({
        instituteId: instId.toString(),
        roles: ['STUDENT', 'FACULTY'],
        excludeUserId: req.user!.id,
        title: `New Event: ${event.title}`,
        message: `${event.category} • ${new Date(event.startDate).toLocaleDateString()} at ${event.venue}`,
        type: 'EVENT',
        link: '/app/events',
      }).catch((err) => console.error('Event publish notification error:', err));
    }

    res.status(201).json({
      message: 'Event created and announced on campus grid',
      event: {
        ...event.toJSON(),
        id: event._id.toString(),
        registeredCount: 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Event creation failed';
    res.status(500).json({ error: 'SERVER_ERROR', message });
  }
});

// POST /api/events/:id/register (1-Click student registration with capacity lock)
router.post('/:id/register', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'STUDENT') {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Event registration is strictly reserved for students. Faculty members participate as event organizers and evaluators.',
      });
      return;
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Event not found' });
      return;
    }

    if (event.instituteId && req.user?.instituteId && event.instituteId.toString() !== req.user.instituteId.toString()) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot register for events outside your campus institute' });
      return;
    }

    const userId = req.user!.id;

    // Check if deadline passed
    if (new Date() > new Date(event.registrationDeadline)) {
      res.status(400).json({ error: 'DEADLINE_PASSED', message: 'Registration deadline for this event has closed' });
      return;
    }

    // Check if already registered
    if (event.registeredUsers.some((uid) => uid.toString() === userId)) {
      res.status(409).json({ error: 'ALREADY_REGISTERED', message: 'You are already registered for this event' });
      return;
    }

    // Check capacity
    if (event.registeredUsers.length >= event.capacity) {
      res.status(400).json({ error: 'CAPACITY_REACHED', message: 'Event has reached full registration capacity' });
      return;
    }

    event.registeredUsers.push(userId as any);
    await event.save();

    const organizerInstId = event.instituteId || req.user?.instituteId;
    if (event.organizer?.id && organizerInstId) {
      dispatchNotification({
        userId: event.organizer.id.toString(),
        instituteId: organizerInstId.toString(),
        title: `New RSVP: ${event.title}`,
        message: `${req.user!.name} registered for ${event.title}`,
        type: 'EVENT',
        link: '/app/events',
      }).catch((err) => console.error('RSVP notification error:', err));
    }

    res.json({
      message: `Successfully registered for "${event.title}"! Pass has been issued.`,
      registeredCount: event.registeredUsers.length,
      capacity: event.capacity,
      isRegistered: true,
    });
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to process event registration' });
  }
});

// POST /api/events/:id/unregister (Cancel registration)
router.post('/:id/unregister', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user?.role !== 'STUDENT') {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Event unregistration is only applicable to students.',
      });
      return;
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Event not found' });
      return;
    }

    if (event.instituteId && req.user?.instituteId && event.instituteId.toString() !== req.user.instituteId.toString()) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot modify events outside your campus institute' });
      return;
    }

    const userId = req.user!.id;
    event.registeredUsers = event.registeredUsers.filter((uid) => uid.toString() !== userId);
    await event.save();

    res.json({
      message: `Registration cancelled for "${event.title}".`,
      registeredCount: event.registeredUsers.length,
      isRegistered: false,
    });
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to cancel event registration' });
  }
});

// GET /api/events/:id/attendees (View registered students - Faculty/Admin or Event Organizer)
router.get('/:id/attendees', authenticate, requireRole('FACULTY', 'ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registeredUsers', 'name email institutionalId department academicYear rollNumber')
      .lean();

    if (!event) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Event not found' });
      return;
    }

    if (event.instituteId && req.user?.instituteId && event.instituteId.toString() !== req.user.instituteId.toString()) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot inspect roster of other campus institutes' });
      return;
    }

    res.json({
      eventId: event._id.toString(),
      eventTitle: event.title,
      capacity: event.capacity,
      registeredCount: event.registeredUsers?.length || 0,
      attendees: event.registeredUsers || [],
    });
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve event attendees' });
  }
});

// DELETE /api/events/:id (Cancel/Delete event - Organizer or Admin)
router.delete('/:id', authenticate, requireRole('FACULTY', 'ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Event not found' });
      return;
    }

    if (event.instituteId && req.user?.instituteId && event.instituteId.toString() !== req.user.instituteId.toString()) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot delete events from other campus institutes' });
      return;
    }

    // Role jurisdiction check
    if (req.user!.role === 'FACULTY' && event.organizer.id.toString() !== req.user!.id) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Only the event organizer or campus admin can cancel this event' });
      return;
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: `Event "${event.title}" has been retracted.` });
  } catch {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete event' });
  }
});

export default router;
