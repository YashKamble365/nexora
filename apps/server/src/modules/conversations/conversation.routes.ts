import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authenticate } from '../../middleware/auth.js';
import { Conversation } from './conversation.model.js';
import { Message } from '../messages/message.model.js';
import { User } from '../users/user.model.js';
import { Institute } from '../institutes/institute.model.js';
import { getIO } from '../../socket/index.js';

export const conversationRouter = Router();

// 1. Get active conversations & channels for authenticated user
conversationRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let instituteId: Types.ObjectId | null = user.instituteId ? new Types.ObjectId(user.instituteId) : null;
    if (!instituteId && user.role === 'SUPER_ADMIN') {
      const firstInst = await Institute.findOne({ status: 'APPROVED' });
      if (firstInst) instituteId = firstInst._id as Types.ObjectId;
    }

    if (!instituteId) {
      res.json([]);
      return;
    }

    const userId = new Types.ObjectId(user.id);

    // Find:
    // A) Channels in this institute that match scope:
    //    - CAMPUS wide
    //    - DEPARTMENT matching user's department
    //    - BATCH matching user's department and academicYear (if student) or if faculty in that dept
    //    - CUSTOM where user is in participants
    // B) Direct conversations where user is participant and status is ACTIVE
    const query: any = user.role === 'SUPER_ADMIN'
      ? {
          $or: [
            { type: 'DIRECT', participants: userId, status: 'ACTIVE' },
            ...(instituteId ? [{ instituteId, type: 'CHANNEL' }] : []),
          ],
        }
      : {
          $or: [
            { type: 'DIRECT', participants: userId, status: 'ACTIVE' },
            {
              instituteId,
              type: 'CHANNEL',
              $or: [
                { scope: 'CAMPUS' },
                { scope: 'DEPARTMENT', department: user.department },
                ...(user.academicYear
                  ? [{ scope: 'BATCH', department: user.department, academicYear: user.academicYear }]
                  : [{ scope: 'BATCH', department: user.department }]),
                ...(user.academicYear
                  ? [
                      {
                        scope: 'SUBJECT',
                        department: user.department,
                        academicYear: user.academicYear,
                        ...(user.semester ? { semester: user.semester } : {}),
                      },
                    ]
                  : []),
                ...(user.role === 'FACULTY'
                  ? [{ scope: 'SUBJECT', creatorId: userId }, { scope: 'SUBJECT', department: user.department }]
                  : []),
                { scope: 'CUSTOM', participants: userId },
                { participants: userId },
              ],
            },
          ],
        };

    const conversations = await Conversation.find(query)
      .populate('participants', 'name email role facultyRole department academicYear avatarUrl isOnline institutionalId')
      .populate('pendingInvites', 'name email role facultyRole department academicYear avatarUrl isOnline institutionalId')
      .populate('joinRequests', 'name email role facultyRole department academicYear avatarUrl isOnline institutionalId')
      .populate('creatorId', 'name role department avatarUrl')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: 'name role facultyRole avatarUrl',
        },
      })
      .sort({ updatedAt: -1 })
      .lean();

    // Map to clean DTO structure
    const dtos = conversations.map((conv: any) => {
      const isDirect = conv.type === 'DIRECT';
      let name = conv.name;
      let otherParticipant = null;

      if (isDirect) {
        otherParticipant = conv.participants?.find((p: any) => p._id.toString() !== user.id);
        name = otherParticipant ? otherParticipant.name : 'Direct Message';
      }

      const isCreator = (conv.creatorId?._id?.toString() || conv.creatorId?.toString()) === user.id;
      const isAdmin = isCreator || conv.adminIds?.some((a: any) => a.toString() === user.id) || ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

      return {
        id: conv._id.toString(),
        type: conv.type,
        name,
        description: conv.description,
        scope: conv.scope,
        department: conv.department,
        academicYear: conv.academicYear,
        semester: conv.semester,
        subjectName: conv.subjectName,
        instituteId: conv.instituteId.toString(),
        accessMode: conv.accessMode || 'APPROVAL_REQUIRED',
        isDiscoverable: conv.isDiscoverable !== false,
        creatorId: conv.creatorId?._id?.toString() || conv.creatorId?.toString(),
        adminIds: conv.adminIds?.map((a: any) => a._id?.toString() || a.toString()) || [],
        participants: Array.from(new Map((conv.participants || []).filter((p: any) => p && p._id).map((p: any) => [p._id.toString(), p])).values()).map((p: any) => ({
          id: p._id.toString(),
          name: p.name,
          email: p.email,
          role: p.role,
          facultyRole: p.facultyRole,
          department: p.department,
          academicYear: p.academicYear,
          avatarUrl: p.avatarUrl,
          isOnline: p.isOnline,
          institutionalId: p.institutionalId,
        })),
        pendingInvites: Array.from(new Map((conv.pendingInvites || []).filter((p: any) => p && p._id).map((p: any) => [p._id.toString(), p])).values()).map((p: any) => ({
          id: p._id.toString(),
          name: p.name,
          role: p.role,
          department: p.department,
          avatarUrl: p.avatarUrl,
        })),
        joinRequests: isAdmin && conv.joinRequests
          ? Array.from(new Map((conv.joinRequests || []).filter((p: any) => p && p._id).map((p: any) => [p._id.toString(), p])).values()).map((p: any) => ({
              id: p._id.toString(),
              name: p.name,
              email: p.email,
              role: p.role,
              department: p.department,
              academicYear: p.academicYear,
              avatarUrl: p.avatarUrl,
              isOnline: p.isOnline,
              institutionalId: p.institutionalId,
            }))
          : [],
        otherParticipant,
        status: conv.status,
        initiatedBy: conv.initiatedBy?.toString(),
        isAnnouncementOnly: conv.isAnnouncementOnly || false,
        lastMessage: conv.lastMessage
          ? {
              id: conv.lastMessage._id.toString(),
              conversationId: conv._id.toString(),
              sender: {
                id: conv.lastMessage.senderId?._id?.toString() || '',
                name: conv.lastMessage.senderId?.name || 'Unknown',
                role: conv.lastMessage.senderId?.role || 'STUDENT',
                avatarUrl: conv.lastMessage.senderId?.avatarUrl,
              },
              content: conv.lastMessage.content,
              attachments: conv.lastMessage.attachments,
              createdAt: conv.lastMessage.createdAt?.toISOString(),
            }
          : undefined,
        isPinned: conv.pinnedBy?.some((p: any) => p.toString() === user.id) || false,
        isMuted: conv.mutedBy?.some((p: any) => p.toString() === user.id) || false,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
      };
    });

    res.json(dtos);
  } catch (err: any) {
    console.error('Fetch conversations error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch conversations' });
  }
});

// 2. Get DM requests for current user (incoming or sent)
conversationRouter.get(['/requests', '/requests/sent'], authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (!user.instituteId && user.role !== 'SUPER_ADMIN')) {
      res.json([]);
      return;
    }

    const userId = new Types.ObjectId(user.id);
    const isSentRoute = req.path.includes('/sent') || req.query.direction === 'sent';

    const query: any = {
      type: 'DIRECT',
      participants: userId,
    };

    if (isSentRoute) {
      query.initiatedBy = userId;
      query.status = { $in: ['REQUEST_PENDING', 'DECLINED'] };
    } else {
      query.initiatedBy = { $ne: userId };
      query.status = 'REQUEST_PENDING';
    }

    const requests = await Conversation.find(query)
      .populate('participants', 'name email role facultyRole department academicYear avatarUrl isOnline institutionalId')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: 'name role facultyRole avatarUrl department',
        },
      })
      .sort({ updatedAt: -1 })
      .lean();

    const dtos = requests.map((conv: any) => {
      const otherPerson = conv.participants?.find((p: any) => p._id.toString() !== user.id);
      const isInitiator = conv.initiatedBy?.toString() === user.id;

      return {
        id: conv._id.toString(),
        type: conv.type,
        name: otherPerson?.name || (isInitiator ? 'Sent Request' : 'Direct Message Request'),
        direction: isInitiator ? 'SENT' : 'INCOMING',
        otherUser: otherPerson
          ? {
              id: otherPerson._id.toString(),
              name: otherPerson.name,
              role: otherPerson.role,
              facultyRole: otherPerson.facultyRole,
              department: otherPerson.department,
              academicYear: otherPerson.academicYear,
              institutionalId: otherPerson.institutionalId,
              avatarUrl: otherPerson.avatarUrl,
            }
          : null,
        initiator: !isInitiator && otherPerson
          ? {
              id: otherPerson._id.toString(),
              name: otherPerson.name,
              role: otherPerson.role,
              department: otherPerson.department,
              academicYear: otherPerson.academicYear,
              institutionalId: otherPerson.institutionalId,
              avatarUrl: otherPerson.avatarUrl,
            }
          : { id: user.id, name: user.name, role: user.role },
        recipient: isInitiator && otherPerson
          ? {
              id: otherPerson._id.toString(),
              name: otherPerson.name,
              role: otherPerson.role,
              department: otherPerson.department,
              academicYear: otherPerson.academicYear,
              institutionalId: otherPerson.institutionalId,
              avatarUrl: otherPerson.avatarUrl,
            }
          : { id: user.id, name: user.name, role: user.role },
        status: conv.status,
        lastMessage: conv.lastMessage
          ? {
              id: conv.lastMessage._id.toString(),
              content: conv.lastMessage.content,
              createdAt: conv.lastMessage.createdAt?.toISOString(),
            }
          : undefined,
        createdAt: conv.createdAt.toISOString(),
      };
    });

    res.json(dtos);
  } catch (err: any) {
    console.error('Fetch requests error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch requests' });
  }
});

// 3. Initiate or find a Direct Message (with anti-harassment checks)
conversationRouter.post('/dm', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const sender = req.user;
    if (!sender || (!sender.instituteId && sender.role !== 'SUPER_ADMIN')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { recipientId, initialMessage } = req.body;

    if (!recipientId) {
      res.status(400).json({ error: 'recipientId is required' });
      return;
    }

    if (recipientId === sender.id) {
      res.status(400).json({ error: 'Cannot start conversation with yourself' });
      return;
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      res.status(404).json({ error: 'Recipient user not found' });
      return;
    }

    // RULE 1: If recipient is SUPER_ADMIN, only Campus Admins (ADMIN) or root (SUPER_ADMIN) can message them.
    if (recipient.role === 'SUPER_ADMIN') {
      if (sender.role !== 'ADMIN' && sender.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Only Campus Administrators can initiate direct messages with Super Admin.',
        });
        return;
      }
    }

    // RULE 2: If neither party is SUPER_ADMIN, both users must belong to same institute.
    if (sender.role !== 'SUPER_ADMIN' && recipient.role !== 'SUPER_ADMIN') {
      const senderInstId = sender.instituteId?.toString();
      const recipientInstId = recipient.instituteId?.toString();
      if (!senderInstId || !recipientInstId || senderInstId !== recipientInstId) {
        res.status(403).json({ error: 'Cannot message users outside your institute' });
        return;
      }
    }

    const recipientPrivacy = recipient.privacySettings?.dmPermission || 'ALLOW_ALL';
    const isSenderStaff = ['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(sender.role);
    const isRecipientStaff = ['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(recipient.role);

    // Privacy rule check for students sending messages
    if (!isSenderStaff) {
      if (recipientPrivacy === 'FACULTY_ONLY') {
        res.status(403).json({
          error: 'This user has privacy mode enabled and only accepts messages from Faculty and Coordinators.',
        });
        return;
      }

      if (recipientPrivacy === 'SAME_DEPARTMENT_ONLY' && recipient.department !== sender.department) {
        res.status(403).json({
          error: 'This user only accepts direct messages from students within their department.',
        });
        return;
      }
    }

    // Check if conversation already exists between the two
    const senderObjId = new Types.ObjectId(sender.id);
    const recipientObjId = new Types.ObjectId(recipientId);

    const existing = await Conversation.findOne({
      type: 'DIRECT',
      participants: { $all: [senderObjId, recipientObjId], $size: 2 },
    });

    if (existing) {
      // If blocked or declined
      if (existing.status === 'BLOCKED') {
        res.status(403).json({ error: 'Communication with this user is currently blocked.' });
        return;
      }
      res.json({ id: existing._id.toString(), status: existing.status, isNew: false });
      return;
    }

    // Resolve instituteId for conversation
    let convInstId: Types.ObjectId;
    if (sender.instituteId) {
      convInstId = new Types.ObjectId(sender.instituteId);
    } else if (recipient.instituteId) {
      convInstId = new Types.ObjectId(recipient.instituteId.toString());
    } else {
      const anyInst = (await Institute.findOne({ status: 'APPROVED' })) || (await Institute.findOne());
      convInstId = (anyInst?._id as Types.ObjectId) || new Types.ObjectId();
    }

    // If either party is Faculty/Admin/SuperAdmin, conversation starts immediately as ACTIVE.
    const initialStatus = isSenderStaff || isRecipientStaff ? 'ACTIVE' : 'REQUEST_PENDING';

    const conversation: any = await Conversation.create({
      type: 'DIRECT',
      instituteId: convInstId,
      participants: [senderObjId, recipientObjId],
      status: initialStatus,
      initiatedBy: senderObjId,
    });

    // If an initial message was included, save it
    if (initialMessage && initialMessage.trim().length > 0) {
      const msg = await Message.create({
        conversationId: conversation._id,
        senderId: senderObjId,
        content: initialMessage.trim(),
        readBy: [senderObjId],
      });

      conversation.lastMessage = msg._id as any;
      await conversation.save();

      // Emit socket notification to recipient
      const io = getIO();
      if (io) {
        io.to(`user_${recipientId}`).emit('new_dm_request', {
          conversationId: conversation._id.toString(),
          senderName: sender.name,
          initialMessage: initialMessage.trim(),
        });
      }
    }

    res.status(201).json({
      id: conversation._id.toString(),
      status: conversation.status,
      isNew: true,
    });
  } catch (err: any) {
    console.error('Create DM error:', err);
    res.status(500).json({ error: err.message || 'Failed to create direct conversation' });
  }
});

// 4. Accept a DM Request
conversationRouter.patch('/:id/accept', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      type: 'DIRECT',
      participants: new Types.ObjectId(user.id),
      status: 'REQUEST_PENDING',
    });

    if (!conversation) {
      res.status(404).json({ error: 'Pending conversation request not found' });
      return;
    }

    conversation.status = 'ACTIVE';
    await conversation.save();

    const io = getIO();
    if (io) {
      io.to(`conversation_${id}`).emit('dm_request_accepted', {
        conversationId: id,
        acceptedBy: user.name,
      });
      if (conversation.initiatedBy) {
        io.to(`user_${conversation.initiatedBy.toString()}`).emit('dm_request_accepted', {
          conversationId: id,
          acceptedBy: user.name,
        });
      }
    }

    res.json({ message: 'Conversation request accepted', status: 'ACTIVE' });
  } catch (err: any) {
    console.error('Accept DM error:', err);
    res.status(500).json({ error: err.message || 'Failed to accept conversation' });
  }
});

// 5. Decline a DM Request
conversationRouter.patch('/:id/decline', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      type: 'DIRECT',
      participants: new Types.ObjectId(user.id),
      status: 'REQUEST_PENDING',
    });

    if (!conversation) {
      res.status(404).json({ error: 'Pending conversation request not found' });
      return;
    }

    conversation.status = 'DECLINED';
    await conversation.save();

    const io = getIO();
    if (io && conversation.initiatedBy) {
      io.to(`user_${conversation.initiatedBy.toString()}`).emit('dm_request_declined', {
        conversationId: id,
        declinedBy: user.name,
      });
    }

    res.json({ message: 'Conversation request declined', status: 'DECLINED' });
  } catch (err: any) {
    console.error('Decline DM error:', err);
    res.status(500).json({ error: err.message || 'Failed to decline conversation' });
  }
});

// 5b. Withdraw / Cancel a Sent DM Request
conversationRouter.delete('/requests/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      type: 'DIRECT',
      initiatedBy: new Types.ObjectId(user.id),
      status: { $in: ['REQUEST_PENDING', 'DECLINED'] },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Sent request not found or cannot be withdrawn' });
      return;
    }

    await Message.deleteMany({ conversationId: conversation._id });
    await Conversation.deleteOne({ _id: conversation._id });

    res.json({ message: 'Request withdrawn successfully' });
  } catch (err: any) {
    console.error('Withdraw DM error:', err);
    res.status(500).json({ error: err.message || 'Failed to withdraw request' });
  }
});

// 6. Create custom channel (Admin & Faculty only)
conversationRouter.post('/channels', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (!user.instituteId && user.role !== 'SUPER_ADMIN')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(user.role)) {
      res.status(403).json({ error: 'Only faculty and administrators can create channels' });
      return;
    }

    let instituteId: Types.ObjectId | null = user.instituteId ? new Types.ObjectId(user.instituteId) : null;
    if (!instituteId && user.role === 'SUPER_ADMIN') {
      const firstInst = await Institute.findOne({ status: 'APPROVED' });
      if (firstInst) instituteId = firstInst._id as Types.ObjectId;
    }

    if (!instituteId) {
      res.status(400).json({ error: 'Institute identifier required' });
      return;
    }

    const { name, description, scope = 'CAMPUS', department, academicYear, semester, subjectName, isAnnouncementOnly = false } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: 'Channel name is required' });
      return;
    }

    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const channelName = cleanName.startsWith('#') ? cleanName : `#${cleanName}`;

    const channel = await Conversation.create({
      type: 'CHANNEL',
      name: channelName,
      description: description?.trim() || '',
      scope,
      department: scope === 'CAMPUS' ? undefined : (department || user.department),
      academicYear: (scope === 'CAMPUS' || scope === 'DEPARTMENT') ? undefined : academicYear,
      semester: scope === 'SUBJECT' ? semester : undefined,
      subjectName: scope === 'SUBJECT' ? subjectName?.trim() : undefined,
      instituteId,
      creatorId: new Types.ObjectId(user.id),
      adminIds: [new Types.ObjectId(user.id)],
      status: 'ACTIVE',
      isAnnouncementOnly: Boolean(isAnnouncementOnly),
      participants: [new Types.ObjectId(user.id)],
    });

    const populated = await Conversation.findById(channel._id)
      .populate('participants', 'name email role facultyRole department academicYear avatarUrl isOnline institutionalId')
      .populate('creatorId', 'name role department avatarUrl')
      .lean();

    const dto = {
      id: populated!._id.toString(),
      type: populated!.type,
      name: populated!.name,
      description: populated!.description,
      scope: populated!.scope,
      department: populated!.department,
      academicYear: populated!.academicYear,
      semester: populated!.semester,
      subjectName: populated!.subjectName,
      instituteId: populated!.instituteId.toString(),
      creatorId: (populated!.creatorId as any)?._id?.toString() || populated!.creatorId?.toString(),
      adminIds: populated!.adminIds?.map((a: any) => a._id?.toString() || a.toString()) || [],
      participants: (populated!.participants || []).map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        email: p.email,
        role: p.role,
        facultyRole: p.facultyRole,
        department: p.department,
        academicYear: p.academicYear,
        avatarUrl: p.avatarUrl,
        isOnline: p.isOnline,
        institutionalId: p.institutionalId,
      })),
      pendingInvites: [],
      joinRequests: [],
      status: populated!.status,
      isAnnouncementOnly: populated!.isAnnouncementOnly || false,
      createdAt: populated!.createdAt.toISOString(),
      updatedAt: populated!.updatedAt.toISOString(),
    };

    const io = getIO();
    if (io) {
      io.emit('channel_created', dto);
    }

    res.status(201).json(dto);
  } catch (err: any) {
    console.error('Create channel error:', err);
    res.status(500).json({ error: err.message || 'Failed to create channel' });
  }
});

// 7. POST /api/conversations/groups - Create Student Custom Group (Study circles, projects, clubs)
conversationRouter.post('/groups', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (!user.instituteId && user.role !== 'SUPER_ADMIN')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, description, level = 'DEPARTMENT', accessMode = 'APPROVAL_REQUIRED', isDiscoverable = true } = req.body;
    const initialInviteeIds = req.body.initialInviteeIds || req.body.invitedUserIds || [];

    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: 'Group name is required' });
      return;
    }

    const userId = new Types.ObjectId(user.id);
    let instituteId = user.instituteId ? new Types.ObjectId(user.instituteId) : null;
    if (!instituteId && user.role === 'SUPER_ADMIN') {
      const firstInst = await Institute.findOne({ status: 'APPROVED' });
      if (firstInst) instituteId = firstInst._id as Types.ObjectId;
    }

    if (!instituteId) {
      res.status(400).json({ error: 'Institute association required' });
      return;
    }

    // Rate limit: Max 10 active created groups per student
    if (user.role === 'STUDENT') {
      const createdCount = await Conversation.countDocuments({
        instituteId,
        creatorId: userId,
        scope: 'CUSTOM',
        type: 'CHANNEL',
      });
      if (createdCount >= 10) {
        res.status(400).json({ error: 'You have reached the maximum limit of 10 active student groups.' });
        return;
      }
    }

    // Validate and filter initial invitees
    const validInviteeObjIds: Types.ObjectId[] = [];
    if (Array.isArray(initialInviteeIds) && initialInviteeIds.length > 0) {
      const inviteeUsers = await User.find({
        _id: { $in: initialInviteeIds.filter((id: string) => Types.ObjectId.isValid(id)).map((id: string) => new Types.ObjectId(id)) },
        instituteId,
        status: 'ACTIVE',
      }).select('_id');

      inviteeUsers.forEach((u) => {
        if (u._id.toString() !== user.id) {
          validInviteeObjIds.push(u._id as Types.ObjectId);
        }
      });
    }

    const cleanName = name.trim();
    const groupName = cleanName.startsWith('#') ? cleanName : `#${cleanName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`;

    const group = await Conversation.create({
      type: 'CHANNEL',
      name: groupName,
      description: description?.trim() || '',
      scope: 'CUSTOM',
      department: level === 'DEPARTMENT' ? user.department : undefined,
      instituteId,
      creatorId: userId,
      adminIds: [userId],
      accessMode,
      isDiscoverable,
      status: 'ACTIVE',
      isAnnouncementOnly: false,
      participants: [userId],
      pendingInvites: validInviteeObjIds,
      joinRequests: [],
    });

    // Notify invitees via socket and notification in DB
    const io = getIO();
    if (validInviteeObjIds.length > 0) {
      const { Notification } = await import('../notifications/notification.model.js');
      const notifDocs = validInviteeObjIds.map((invId) => ({
        userId: invId,
        instituteId,
        title: 'Group Invitation',
        message: `${user.name} invited you to join ${groupName}`,
        type: 'SYSTEM',
        link: '/app/messages',
        isRead: false,
      }));
      await Notification.insertMany(notifDocs);

      if (io) {
        validInviteeObjIds.forEach((invId) => {
          io.to(`user_${invId.toString()}`).emit('group_invitation', {
            id: group._id.toString(),
            name: group.name,
            description: group.description,
            department: group.department,
            invitedBy: {
              id: user.id,
              name: user.name,
              role: user.role,
            },
          });
        });
      }
    }

    res.status(201).json(group);
  } catch (err: any) {
    console.error('Create student group error:', err);
    res.status(500).json({ error: err.message || 'Failed to create group' });
  }
});

// 7b. GET /api/conversations/groups/discover - Open discovery directory for campus and department groups
conversationRouter.get('/groups/discover', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (!user.instituteId && user.role !== 'SUPER_ADMIN')) {
      res.json([]);
      return;
    }

    let instituteId = user.instituteId ? new Types.ObjectId(user.instituteId) : null;
    if (!instituteId && user.role === 'SUPER_ADMIN') {
      const firstInst = await Institute.findOne({ status: 'APPROVED' });
      if (firstInst) instituteId = firstInst._id as Types.ObjectId;
    }

    if (!instituteId) {
      res.json([]);
      return;
    }

    const { search, scope: filterScope, department } = req.query;

    const query: any = {
      instituteId,
      type: 'CHANNEL',
      scope: 'CUSTOM',
      isDiscoverable: { $ne: false },
    };

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (filterScope === 'CAMPUS') {
      query.department = { $in: [null, undefined, ''] };
    } else if (filterScope === 'DEPARTMENT') {
      if (department && typeof department === 'string') {
        query.department = department;
      } else if (user.department) {
        query.department = user.department;
      }
    } else if (department && typeof department === 'string' && department !== 'ALL') {
      query.department = department;
    }

    const groups = await Conversation.find(query)
      .populate('creatorId', 'name role department avatarUrl')
      .sort({ updatedAt: -1 })
      .lean();

    const dtos = groups.map((g: any) => {
      const isMember = g.participants?.some((p: any) => p.toString() === user.id) || false;
      const hasRequestedJoin = g.joinRequests?.some((j: any) => j.toString() === user.id) || false;

      return {
        id: g._id.toString(),
        name: g.name,
        description: g.description,
        scope: g.department ? 'DEPARTMENT' : 'CAMPUS',
        department: g.department,
        accessMode: g.accessMode || 'APPROVAL_REQUIRED',
        memberCount: g.participants?.length || 0,
        creator: g.creatorId
          ? {
              id: g.creatorId._id?.toString() || g.creatorId.toString(),
              name: g.creatorId.name,
              role: g.creatorId.role,
              department: g.creatorId.department,
              avatarUrl: g.creatorId.avatarUrl,
            }
          : undefined,
        isMember,
        hasRequestedJoin,
        createdAt: g.createdAt?.toISOString(),
      };
    });

    res.json(dtos);
  } catch (err: any) {
    console.error('Discover groups error:', err);
    res.status(500).json({ error: err.message || 'Failed to discover groups' });
  }
});

// 8. GET /api/conversations/groups/invites - Pending Group Invites for current user
conversationRouter.get('/groups/invites', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (!user.instituteId && user.role !== 'SUPER_ADMIN')) {
      res.json([]);
      return;
    }

    const userId = new Types.ObjectId(user.id);
    const groups = await Conversation.find({
      type: 'CHANNEL',
      scope: 'CUSTOM',
      pendingInvites: userId,
    })
      .populate('creatorId', 'name role department avatarUrl')
      .sort({ updatedAt: -1 })
      .lean();

    const dtos = groups.map((g: any) => ({
      id: g._id.toString(),
      name: g.name,
      description: g.description,
      department: g.department,
      creator: g.creatorId
        ? {
            id: g.creatorId._id?.toString() || '',
            name: g.creatorId.name,
            role: g.creatorId.role,
            department: g.creatorId.department,
            avatarUrl: g.creatorId.avatarUrl,
          }
        : null,
      memberCount: g.participants?.length || 1,
      createdAt: g.createdAt?.toISOString(),
    }));

    res.json(dtos);
  } catch (err: any) {
    console.error('Fetch group invites error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch group invites' });
  }
});

// 9. POST /api/conversations/groups/:id/invite - Invite peer(s) to existing group
conversationRouter.post('/groups/:id/invite', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const { userIds } = req.body;

    const group = await Conversation.findOne({
      _id: id,
      type: 'CHANNEL',
      scope: 'CUSTOM',
      participants: new Types.ObjectId(user.id),
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found or you are not a member' });
      return;
    }

    const targets = Array.isArray(userIds) ? userIds : [req.body.userId];
    const newInvites: Types.ObjectId[] = [];

    for (const tId of targets) {
      if (!tId || !Types.ObjectId.isValid(tId)) continue;
      const tObjId = new Types.ObjectId(tId);
      const isAlreadyParticipant = group.participants.some((p: any) => p.toString() === tId);
      const isAlreadyInvited = group.pendingInvites?.some((p: any) => p.toString() === tId);
      if (!isAlreadyParticipant && !isAlreadyInvited && tId !== user.id) {
        group.pendingInvites = group.pendingInvites || [];
        group.pendingInvites.push(tObjId);
        newInvites.push(tObjId);
      }
    }

    await group.save();

    const io = getIO();
    if (newInvites.length > 0 && io) {
      newInvites.forEach((invId) => {
        io.to(`user_${invId.toString()}`).emit('group_invitation', {
          id: group._id.toString(),
          name: group.name,
          description: group.description,
          department: group.department,
          invitedBy: {
            id: user.id,
            name: user.name,
            role: user.role,
          },
        });
      });
    }

    res.json({ message: 'Invitations dispatched successfully', invitedCount: newInvites.length });
  } catch (err: any) {
    console.error('Invite to group error:', err);
    res.status(500).json({ error: err.message || 'Failed to dispatch invitations' });
  }
});

// 10. PATCH /api/conversations/groups/:id/accept-invite
conversationRouter.patch('/groups/:id/accept-invite', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const userId = new Types.ObjectId(user.id);

    const group = await Conversation.findOne({
      _id: id,
      type: 'CHANNEL',
      scope: 'CUSTOM',
      pendingInvites: userId,
    });

    if (!group) {
      res.status(404).json({ error: 'Pending group invitation not found' });
      return;
    }

    group.pendingInvites = (group.pendingInvites || []).filter((p: any) => p.toString() !== user.id);
    if (!group.participants.some((p: any) => p.toString() === user.id)) {
      group.participants.push(userId);
    }
    await group.save();

    const io = getIO();
    if (io) {
      io.to(`conversation_${id}`).emit('member_joined_group', {
        conversationId: id,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          department: user.department,
        },
      });
    }

    res.json({ message: 'Joined group successfully', group });
  } catch (err: any) {
    console.error('Accept group invite error:', err);
    res.status(500).json({ error: err.message || 'Failed to join group' });
  }
});

// 11. PATCH /api/conversations/groups/:id/decline-invite
conversationRouter.patch('/groups/:id/decline-invite', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const userId = new Types.ObjectId(user.id);

    const group = await Conversation.findOne({
      _id: id,
      type: 'CHANNEL',
      scope: 'CUSTOM',
      pendingInvites: userId,
    });

    if (!group) {
      res.status(404).json({ error: 'Pending group invitation not found' });
      return;
    }

    group.pendingInvites = (group.pendingInvites || []).filter((p: any) => p.toString() !== user.id);
    await group.save();

    res.json({ message: 'Group invitation declined' });
  } catch (err: any) {
    console.error('Decline group invite error:', err);
    res.status(500).json({ error: err.message || 'Failed to decline group invitation' });
  }
});

// 12. POST /api/conversations/groups/:id/leave
conversationRouter.post('/groups/:id/leave', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;

    const group = await Conversation.findOne({
      _id: id,
      type: 'CHANNEL',
      scope: 'CUSTOM',
      participants: new Types.ObjectId(user.id),
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found or you are not a member' });
      return;
    }

    group.participants = group.participants.filter((p: any) => p.toString() !== user.id);

    // If no participants left, delete group and clean messages
    if (group.participants.length === 0) {
      await Message.deleteMany({ conversationId: group._id });
      await Conversation.deleteOne({ _id: group._id });
      res.json({ message: 'Group disbanded as last member left' });
      return;
    }

    // If creator left, reassign creator to first remaining participant
    if (group.creatorId?.toString() === user.id && group.participants.length > 0) {
      group.creatorId = group.participants[0];
    }

    await group.save();

    const io = getIO();
    if (io) {
      io.to(`conversation_${id}`).emit('member_left_group', {
        conversationId: id,
        userId: user.id,
        userName: user.name,
      });
    }

    res.json({ message: 'Left group successfully' });
  } catch (err: any) {
    console.error('Leave group error:', err);
    res.status(500).json({ error: err.message || 'Failed to leave group' });
  }
});

// 13. DELETE /api/conversations/groups/:id - Disband group (Creator or Admin)
conversationRouter.delete('/groups/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;

    const isPlatformAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
    const query: any = {
      _id: id,
      type: 'CHANNEL',
      scope: 'CUSTOM',
    };
    if (!isPlatformAdmin) {
      query.creatorId = new Types.ObjectId(user.id);
    }

    const group = await Conversation.findOne(query);
    if (!group) {
      res.status(403).json({ error: 'Group not found or only the creator / campus admin can disband this group' });
      return;
    }

    await Message.deleteMany({ conversationId: group._id });
    await Conversation.deleteOne({ _id: group._id });

    const io = getIO();
    if (io) {
      io.to(`conversation_${id}`).emit('group_disbanded', {
        conversationId: id,
        groupName: group.name,
      });
    }

    res.json({ message: 'Group disbanded successfully' });
  } catch (err: any) {
    console.error('Disband group error:', err);
    res.status(500).json({ error: err.message || 'Failed to disband group' });
  }
});

// 14. POST /api/conversations/groups/:id/request-join - Request to join or open-join a discoverable group
conversationRouter.post('/groups/:id/request-join', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const userId = new Types.ObjectId(user.id);

    const group = await Conversation.findOne({
      _id: id,
      type: 'CHANNEL',
      scope: 'CUSTOM',
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    // Check if already participant
    if (group.participants.some((p: any) => p.toString() === user.id)) {
      res.status(400).json({ error: 'You are already a member of this group' });
      return;
    }

    if (group.accessMode === 'INVITE_ONLY') {
      res.status(403).json({ error: 'This group is private and invite-only' });
      return;
    }

    const io = getIO();

    // OPEN ACCESS -> direct join
    if (group.accessMode === 'OPEN') {
      group.participants.push(userId);
      group.pendingInvites = (group.pendingInvites || []).filter((p: any) => p.toString() !== user.id);
      group.joinRequests = (group.joinRequests || []).filter((j: any) => j.toString() !== user.id);
      await group.save();

      if (io) {
        io.to(`conversation_${id}`).emit('member_joined_group', {
          conversationId: id,
          user: {
            id: user.id,
            name: user.name,
            role: user.role,
            department: user.department,
          },
        });
      }

      res.json({ status: 'JOINED', message: 'Joined group successfully', group });
      return;
    }

    // APPROVAL REQUIRED
    if (group.joinRequests?.some((j: any) => j.toString() === user.id)) {
      res.status(400).json({ error: 'Join request already submitted and pending approval' });
      return;
    }

    group.joinRequests = group.joinRequests || [];
    group.joinRequests.push(userId);
    await group.save();

    // Dispatch socket event and DB notification to creator and all admins
    const adminTargets = [
      ...(group.creatorId ? [group.creatorId.toString()] : []),
      ...(group.adminIds?.map((a: any) => a.toString()) || []),
    ];
    const uniqueAdminIds = Array.from(new Set(adminTargets));

    const { Notification } = await import('../notifications/notification.model.js');
    const notifs = uniqueAdminIds.map((adminId) => ({
      userId: new Types.ObjectId(adminId),
      instituteId: group.instituteId,
      title: 'Group Join Request',
      message: `${user.name} requested to join ${group.name}`,
      type: 'SYSTEM',
      link: '/app/messages',
      isRead: false,
    }));
    await Notification.insertMany(notifs);

    if (io) {
      uniqueAdminIds.forEach((adminId) => {
        io.to(`user_${adminId}`).emit('group_join_requested', {
          groupId: id,
          groupName: group.name,
          applicant: {
            id: user.id,
            name: user.name,
            role: user.role,
            department: user.department,
            academicYear: user.academicYear,
            avatarUrl: user.avatarUrl,
            institutionalId: user.institutionalId,
          },
        });
      });
    }

    res.json({ status: 'REQUESTED', message: 'Join request sent to group admins' });
  } catch (err: any) {
    console.error('Request join group error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit join request' });
  }
});

// 15. POST /api/conversations/groups/:id/cancel-join-request
conversationRouter.post('/groups/:id/cancel-join-request', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;

    const group = await Conversation.findOne({
      _id: id,
      type: 'CHANNEL',
      scope: 'CUSTOM',
      joinRequests: new Types.ObjectId(user.id),
    });

    if (!group) {
      res.status(404).json({ error: 'Pending join request not found' });
      return;
    }

    group.joinRequests = (group.joinRequests || []).filter((j: any) => j.toString() !== user.id);
    await group.save();

    res.json({ message: 'Join request cancelled successfully' });
  } catch (err: any) {
    console.error('Cancel join request error:', err);
    res.status(500).json({ error: err.message || 'Failed to cancel join request' });
  }
});

// 16. PATCH /api/conversations/groups/:id/approve-join-request
conversationRouter.patch('/groups/:id/approve-join-request', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const { applicantId } = req.body;

    if (!applicantId) {
      res.status(400).json({ error: 'applicantId is required' });
      return;
    }

    const group = await Conversation.findOne({
      _id: id,
      type: 'CHANNEL',
      scope: 'CUSTOM',
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const isCreator = group.creatorId?.toString() === user.id;
    const isGroupAdmin = group.adminIds?.some((a: any) => a.toString() === user.id);
    const isPlatformAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (!isCreator && !isGroupAdmin && !isPlatformAdmin) {
      res.status(403).json({ error: 'Only group admins can approve join requests' });
      return;
    }

    const applicantObjId = new Types.ObjectId(applicantId);
    const isRequested = group.joinRequests?.some((j: any) => j.toString() === applicantId);
    if (!isRequested) {
      res.status(404).json({ error: 'Applicant request not found or already processed' });
      return;
    }

    // Move from joinRequests to participants
    group.joinRequests = (group.joinRequests || []).filter((j: any) => j.toString() !== applicantId);
    if (!group.participants.some((p: any) => p.toString() === applicantId)) {
      group.participants.push(applicantObjId);
    }
    await group.save();

    const applicantUser = await User.findById(applicantId).select('name email role department academicYear avatarUrl');

    const io = getIO();
    if (io) {
      io.to(`conversation_${id}`).emit('member_joined_group', {
        conversationId: id,
        user: {
          id: applicantId,
          name: applicantUser?.name || 'New Member',
          role: applicantUser?.role || 'STUDENT',
          department: applicantUser?.department,
        },
      });

      io.to(`user_${applicantId}`).emit('group_join_accepted', {
        groupId: id,
        groupName: group.name,
        approvedBy: user.name,
      });
    }

    const { Notification } = await import('../notifications/notification.model.js');
    await Notification.create({
      userId: applicantObjId,
      instituteId: group.instituteId,
      title: 'Group Request Approved',
      message: `Your request to join ${group.name} was approved!`,
      type: 'SYSTEM',
      link: '/app/messages',
      isRead: false,
    });

    res.json({ message: 'Join request approved', applicantId, memberCount: group.participants.length });
  } catch (err: any) {
    console.error('Approve join request error:', err);
    res.status(500).json({ error: err.message || 'Failed to approve join request' });
  }
});

// 17. PATCH /api/conversations/groups/:id/reject-join-request
conversationRouter.patch('/groups/:id/reject-join-request', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const { applicantId } = req.body;

    if (!applicantId) {
      res.status(400).json({ error: 'applicantId is required' });
      return;
    }

    const group = await Conversation.findOne({
      _id: id,
      type: 'CHANNEL',
      scope: 'CUSTOM',
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const isCreator = group.creatorId?.toString() === user.id;
    const isGroupAdmin = group.adminIds?.some((a: any) => a.toString() === user.id);
    const isPlatformAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (!isCreator && !isGroupAdmin && !isPlatformAdmin) {
      res.status(403).json({ error: 'Only group admins can reject join requests' });
      return;
    }

    group.joinRequests = (group.joinRequests || []).filter((j: any) => j.toString() !== applicantId);
    await group.save();

    const io = getIO();
    if (io) {
      io.to(`user_${applicantId}`).emit('group_join_rejected', {
        groupId: id,
        groupName: group.name,
      });
    }

    res.json({ message: 'Join request rejected', applicantId });
  } catch (err: any) {
    console.error('Reject join request error:', err);
    res.status(500).json({ error: err.message || 'Failed to reject join request' });
  }
});

// 18. PATCH /api/conversations/groups/:id/promote-admin
conversationRouter.patch('/groups/:id/promote-admin', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      res.status(400).json({ error: 'targetUserId is required' });
      return;
    }

    const group = await Conversation.findOne({
      _id: id,
      type: 'CHANNEL',
      scope: 'CUSTOM',
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const isCreator = group.creatorId?.toString() === user.id;
    const isPlatformAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (!isCreator && !isPlatformAdmin) {
      res.status(403).json({ error: 'Only the group creator can promote admins' });
      return;
    }

    const targetObjId = new Types.ObjectId(targetUserId);
    const isMember = group.participants.some((p: any) => p.toString() === targetUserId);
    if (!isMember) {
      res.status(400).json({ error: 'Target user must be a member of the group' });
      return;
    }

    group.adminIds = group.adminIds || [];
    if (!group.adminIds.some((a: any) => a.toString() === targetUserId)) {
      group.adminIds.push(targetObjId);
      await group.save();
    }

    const io = getIO();
    if (io) {
      io.to(`conversation_${id}`).emit('group_admin_updated', {
        conversationId: id,
        adminIds: group.adminIds.map((a: any) => a.toString()),
      });
    }

    res.json({ message: 'Member promoted to group admin', adminIds: group.adminIds });
  } catch (err: any) {
    console.error('Promote group admin error:', err);
    res.status(500).json({ error: err.message || 'Failed to promote member' });
  }
});

// 19. PATCH /api/conversations/groups/:id/demote-admin
conversationRouter.patch('/groups/:id/demote-admin', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { id } = req.params;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      res.status(400).json({ error: 'targetUserId is required' });
      return;
    }

    const group = await Conversation.findOne({
      _id: id,
      type: 'CHANNEL',
      scope: 'CUSTOM',
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const isCreator = group.creatorId?.toString() === user.id;
    const isPlatformAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (!isCreator && !isPlatformAdmin) {
      res.status(403).json({ error: 'Only the group creator can demote admins' });
      return;
    }

    if (group.creatorId?.toString() === targetUserId) {
      res.status(400).json({ error: 'Cannot demote group creator' });
      return;
    }

    group.adminIds = (group.adminIds || []).filter((a: any) => a.toString() !== targetUserId);
    await group.save();

    const io = getIO();
    if (io) {
      io.to(`conversation_${id}`).emit('group_admin_updated', {
        conversationId: id,
        adminIds: group.adminIds.map((a: any) => a.toString()),
      });
    }

    res.json({ message: 'Admin demoted to regular member', adminIds: group.adminIds });
  } catch (err: any) {
    console.error('Demote group admin error:', err);
    res.status(500).json({ error: err.message || 'Failed to demote member' });
  }
});

