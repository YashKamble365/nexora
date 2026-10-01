import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authenticate } from '../../middleware/auth.js';
import { Message } from './message.model.js';
import { Conversation } from '../conversations/conversation.model.js';
import { getIO } from '../../socket/index.js';
import { dispatchNotification } from '../notifications/notification.service.js';

export const messageRouter = Router();

// 1. Get messages for a conversation
messageRouter.get('/:conversationId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (!user.instituteId && user.role !== 'SUPER_ADMIN')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversationId = req.params.conversationId as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Verify user belongs to same institute
    const userInstituteId = typeof user.instituteId === 'object' ? (user.instituteId as any)._id?.toString() || (user.instituteId as any).id : user.instituteId?.toString();
    if (user.role !== 'SUPER_ADMIN' && conversation.instituteId.toString() !== userInstituteId) {
      res.status(403).json({ error: 'Unauthorized to view this conversation' });
      return;
    }

    // If direct message, verify user is one of the participants
    if (conversation.type === 'DIRECT' && user.role !== 'SUPER_ADMIN') {
      const isParticipant = conversation.participants.some(
        (p: Types.ObjectId) => p.toString() === user.id
      );
      if (!isParticipant) {
        res.status(403).json({ error: 'You are not a participant in this conversation' });
        return;
      }
    }

    const messages = await Message.find({ conversationId: new Types.ObjectId(conversationId) })
      .populate('senderId', 'name role facultyRole avatarUrl department')
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    const dtos = messages.map((m: any) => ({
      id: m._id.toString(),
      conversationId: m.conversationId.toString(),
      sender: {
        id: m.senderId?._id?.toString() || '',
        name: m.senderId?.name || 'Unknown',
        role: m.senderId?.role || 'STUDENT',
        facultyRole: m.senderId?.facultyRole,
        avatarUrl: m.senderId?.avatarUrl,
        department: m.senderId?.department,
      },
      content: m.isUnsent ? 'This message was unsent' : m.content,
      attachments: m.isUnsent ? [] : (m.attachments || []),
      replyTo: m.replyTo,
      reactions: m.isUnsent ? [] : (m.reactions || []),
      isReadBy: m.readBy?.map((r: any) => r.toString()) || [],
      isUnsent: Boolean(m.isUnsent),
      unsentAt: m.unsentAt?.toISOString(),
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    res.json(dtos);
  } catch (err: any) {
    console.error('Fetch messages error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch messages' });
  }
});

// 2. Post a message to a conversation
messageRouter.post('/:conversationId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || (!user.instituteId && user.role !== 'SUPER_ADMIN')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversationId = req.params.conversationId as string;
    const { content, attachments, replyTo } = req.body;

    if ((!content || content.trim().length === 0) && (!attachments || attachments.length === 0)) {
      res.status(400).json({ error: 'Message content or attachment is required' });
      return;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Check announcement mode: only faculty or admin can post
    if (conversation.isAnnouncementOnly && !['ADMIN', 'SUPER_ADMIN', 'FACULTY'].includes(user.role)) {
      res.status(403).json({ error: 'This channel is announcement-only. Only faculty and admins can post.' });
      return;
    }

    // Direct message checks
    if (conversation.type === 'DIRECT' && user.role !== 'SUPER_ADMIN') {
      const isParticipant = conversation.participants.some(
        (p: Types.ObjectId) => p.toString() === user.id
      );
      if (!isParticipant) {
        res.status(403).json({ error: 'You are not a participant in this conversation' });
        return;
      }

      if (conversation.status === 'DECLINED' || conversation.status === 'BLOCKED') {
        res.status(403).json({ error: 'Cannot send messages to this conversation' });
        return;
      }
    }

    const userObjId = new Types.ObjectId(user.id);

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: userObjId,
      content: content?.trim() || '',
      attachments: attachments || [],
      replyTo,
      readBy: [userObjId],
    });

    conversation.lastMessage = message._id as any;
    await conversation.save();

    const populated = await Message.findById(message._id)
      .populate('senderId', 'name role facultyRole avatarUrl department')
      .lean();

    const dto = {
      id: populated!._id.toString(),
      conversationId: populated!.conversationId.toString(),
      sender: {
        id: (populated!.senderId as any)?._id?.toString() || user.id,
        name: (populated!.senderId as any)?.name || user.name,
        role: (populated!.senderId as any)?.role || user.role,
        facultyRole: (populated!.senderId as any)?.facultyRole || user.facultyRole,
        avatarUrl: (populated!.senderId as any)?.avatarUrl || user.avatarUrl,
        department: (populated!.senderId as any)?.department || user.department,
      },
      content: populated!.content,
      attachments: populated!.attachments || [],
      replyTo: populated!.replyTo,
      reactions: populated!.reactions || [],
      isReadBy: populated!.readBy?.map((r: any) => r.toString()) || [],
      isUnsent: false,
      createdAt: populated!.createdAt.toISOString(),
      updatedAt: populated!.updatedAt.toISOString(),
    };

    // Emit live message event to conversation room
    const io = getIO();
    if (io) {
      io.to(`conversation_${conversationId}`).emit('new_message', dto);
      // For direct conversations, also emit to each participant's personal room & dispatch notification
      if (conversation.type === 'DIRECT' && Array.isArray(conversation.participants)) {
        conversation.participants.forEach((p: any) => {
          const participantId = p.toString();
          io.to(`user_${participantId}`).emit('new_message', dto);
          if (participantId !== user.id && conversation.instituteId) {
            dispatchNotification({
              userId: participantId,
              instituteId: conversation.instituteId.toString(),
              title: user.name,
              message: content?.trim() || (attachments?.length ? 'Sent an attachment' : 'Sent a message'),
              type: 'MESSAGE',
              link: '/app/messages',
            }).catch((err) => console.error('DM notification dispatch error:', err));
          }
        });
      }
    }

    res.status(201).json(dto);
  } catch (err: any) {
    console.error('Send message error:', err);
    res.status(500).json({ error: err.message || 'Failed to send message' });
  }
});

// 3. Add or toggle reaction to a message
messageRouter.post('/:conversationId/messages/:messageId/react', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const messageId = req.params.messageId as string;
    const conversationId = req.params.conversationId as string;
    const { emoji } = req.body;

    if (!emoji) {
      res.status(400).json({ error: 'Emoji is required' });
      return;
    }

    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const existingIndex = message.reactions?.findIndex(
      (r) => r.emoji === emoji && r.userId.toString() === user.id
    );

    const userObjId = new Types.ObjectId(user.id);

    if (existingIndex !== undefined && existingIndex >= 0) {
      message.reactions?.splice(existingIndex, 1);
    } else {
      if (!message.reactions) message.reactions = [];
      message.reactions.push({ emoji, userId: userObjId });
    }

    await message.save();

    const io = getIO();
    if (io) {
      io.to(`conversation_${conversationId}`).emit('message_reaction_updated', {
        messageId,
        reactions: message.reactions,
      });
    }

    res.json({ messageId, reactions: message.reactions });
  } catch (err: any) {
    console.error('React error:', err);
    res.status(500).json({ error: err.message || 'Failed to toggle reaction' });
  }
});

// 4. Unsend a message (Sender or Admin)
messageRouter.delete('/:conversationId/messages/:messageId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { conversationId, messageId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Permission check: only sender or admin can unsend
    const isSender = message.senderId.toString() === user.id;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
    if (!isSender && !isAdmin) {
      res.status(403).json({ error: 'You can only unsend your own messages' });
      return;
    }

    if (message.isUnsent) {
      res.status(400).json({ error: 'Message is already unsent' });
      return;
    }

    message.isUnsent = true;
    message.content = 'This message was unsent';
    message.attachments = [];
    message.unsentAt = new Date();
    await message.save();

    const unsentPayload = {
      conversationId,
      messageId,
      isUnsent: true,
      content: 'This message was unsent',
      unsentAt: message.unsentAt.toISOString(),
    };

    const io = getIO();
    if (io) {
      io.to(`conversation_${conversationId}`).emit('message_unsent', unsentPayload);
      if (conversation.type === 'DIRECT' && Array.isArray(conversation.participants)) {
        conversation.participants.forEach((p: any) => {
          io.to(`user_${p.toString()}`).emit('message_unsent', unsentPayload);
        });
      }
    }

    res.json({
      message: 'Message unsent successfully',
      messageId,
      isUnsent: true,
    });
  } catch (err: any) {
    console.error('Unsend message error:', err);
    res.status(500).json({ error: err.message || 'Failed to unsend message' });
  }
});
