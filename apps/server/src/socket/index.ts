import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { User, IUserDocument } from '../modules/users/user.model.js';
import { Conversation } from '../modules/conversations/conversation.model.js';

let io: SocketIOServer | null = null;

interface AuthenticatedSocket extends Socket {
  data: {
    user?: IUserDocument;
  };
}

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        // Allow localhost and 127.0.0.1 on any port, or FRONTEND_URL
        if (
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
          origin === process.env.FRONTEND_URL
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Authentication Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Token can come from auth object or authorization header
      let token = socket.handshake.auth?.token;

      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const secret = process.env.JWT_SECRET || 'nexora-campus-jwt-secret-key-2026';
      let decoded: any;
      try {
        decoded = jwt.verify(token, secret);
      } catch {
        try {
          decoded = jwt.verify(token, 'nexora-secret-key-development-2026');
        } catch {
          return next(new Error('Invalid socket authentication token'));
        }
      }

      const userId = decoded.id || decoded.userId;
      if (!userId) {
        return next(new Error('Malformed authentication token'));
      }

      let user: IUserDocument | null = null;
      if (Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId);
      }

      // Fallback: If user wasn't found by ObjectId, lookup by email or institutionalId
      if (!user) {
        user = await User.findOne({
          $or: [
            { email: decoded.email?.toLowerCase() || '' },
            { institutionalId: userId },
            ...(decoded.institutionalId ? [{ institutionalId: decoded.institutionalId }] : []),
          ],
        });
      }

      if (!user || user.status !== 'ACTIVE') {
        return next(new Error('User inactive or not found'));
      }

      socket.data.user = user;
      next();
    } catch (err: any) {
      next(new Error('Invalid socket authentication token'));
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const user = socket.data.user;
    if (!user) return;

    const userId = user._id.toString();
    const instituteId = user.instituteId?.toString();

    // 1. Mark user online in DB
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // 2. Join personal notification room & institute room
    socket.join(`user_${userId}`);
    if (instituteId) {
      socket.join(`institute_${instituteId}`);
      // Broadcast online status to institute grid
      socket.to(`institute_${instituteId}`).emit('user_status_changed', {
        userId,
        isOnline: true,
      });
    }

    if (user.role === 'SUPER_ADMIN') {
      socket.join('super_admin_room');
    }

    // 3. Room management with participant authorization check
    socket.on('join_conversation', async (conversationId: string) => {
      try {
        if (!conversationId || !Types.ObjectId.isValid(conversationId)) return;
        const query: any = {
          _id: new Types.ObjectId(conversationId),
          $or: [
            { type: 'CHANNEL' },
            { participants: user._id },
          ],
        };
        if (user.role !== 'SUPER_ADMIN' && user.instituteId) {
          query.instituteId = user.instituteId;
        }

        const conv = await Conversation.findOne(query);
        if (conv) {
          socket.join(`conversation_${conversationId}`);
        }
      } catch (err) {
        // Drop unauthorized join
      }
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // 4. Typing indicators
    socket.on('typing_start', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        name: user.name,
      });
    });

    socket.on('typing_stop', ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation_${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId,
      });
    });

    // 5. Disconnect handler
    socket.on('disconnect', async () => {
      const sockets = await io?.in(`user_${userId}`).fetchSockets();
      if (!sockets || sockets.length === 0) {
        await User.findByIdAndUpdate(userId, { isOnline: false });
        if (instituteId) {
          socket.to(`institute_${instituteId}`).emit('user_status_changed', {
            userId,
            isOnline: false,
          });
        }
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}
