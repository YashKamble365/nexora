import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDatabase } from './config/db.js';
import authRouter from './modules/auth/auth.routes.js';
import noticeRouter from './modules/notices/notice.routes.js';
import complaintRouter from './modules/complaints/complaint.routes.js';
import eventRouter from './modules/events/event.routes.js';
import instituteRouter from './modules/institutes/institute.routes.js';
import approvalRouter from './modules/approvals/approval.routes.js';
import { conversationRouter } from './modules/conversations/conversation.routes.js';
import { messageRouter } from './modules/messages/message.routes.js';
import { userRouter } from './modules/users/user.routes.js';
import { reportRouter } from './modules/reports/report.routes.js';
import { uploadRouter } from './modules/upload/upload.routes.js';
import { pollRouter } from './modules/polls/poll.routes.js';
import { feedbackRouter } from './modules/feedback/feedback.routes.js';
import { fileRouter } from './modules/files/file.routes.js';
import { notificationRouter } from './modules/notifications/notification.routes.js';
import { searchRouter } from './modules/search/search.routes.js';
import { emergencyRouter } from './modules/emergency/emergency.routes.js';
import { auditRouter } from './modules/audit/audit.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { surveyRouter } from './modules/surveys/survey.routes.js';
import { initSocket } from './socket/index.js';
import {
  securityHeaders,
  apiRateLimiter,
  authRateLimiter,
  noSqlSanitizer,
  xssSanitizer,
} from './middleware/security.js';


import { authenticate, requireRole } from './middleware/auth.js';
import { User } from './modules/users/user.model.js';
import { Institute } from './modules/institutes/institute.model.js';
import { Notice } from './modules/notices/notice.model.js';
import { Complaint } from './modules/complaints/complaint.model.js';
import { Event } from './modules/events/event.model.js';

const app = express();
app.set('trust proxy', 1);
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Initialize Socket.IO Gateway
initSocket(httpServer);


app.use(securityHeaders);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      origin === process.env.FRONTEND_URL
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(noSqlSanitizer);
app.use(xssSanitizer);
app.use('/api', apiRateLimiter);
app.use('/api/auth', authRateLimiter);

// Connect to MongoDB Atlas
connectDatabase().catch(err => {
  console.error('Fatal: MongoDB connection failure during server bootstrap:', err.message);
});

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Nexora Campus Core API',
    database: 'MongoDB Atlas',
    timestamp: new Date().toISOString(),
  });
});

// Domain Routes
app.use('/api/auth', authRouter);
app.use('/api/institutes', instituteRouter);
app.use('/api/approvals', approvalRouter);
app.use('/api/notices', noticeRouter);
app.use('/api/complaints', complaintRouter);
app.use('/api/events', eventRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/messages', messageRouter);
app.use('/api/users', userRouter);
app.use('/api/reports', reportRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/polls', pollRouter);
app.use('/api/surveys', surveyRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/files', fileRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/search', searchRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/audit', auditRouter);
app.use('/api/admin/audit-logs', auditRouter);
app.use('/api/admin', adminRouter);



// Campus Overview Aggregated KPI Endpoint
app.get('/api/overview', async (_req, res) => {
  try {
    const [userCount, noticeCount, complaintCount, eventCount] = await Promise.all([
      User.countDocuments({ status: 'ACTIVE' }),
      Notice.countDocuments({ status: 'PUBLISHED' }),
      Complaint.countDocuments({ status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS'] } }),
      Event.countDocuments({ status: 'UPCOMING' }),
    ]);

    res.json({
      metrics: {
        activeUsers: userCount,
        publishedNotices: noticeCount,
        openComplaints: complaintCount,
        upcomingEvents: eventCount,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to aggregate overview metrics' });
  }
});

// Protected RBAC Admin System Check
app.get('/api/admin/system-check', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  const users = await User.find().select('name email role department status institutionalId').lean();

  res.json({
    message: 'Authorized administrative access granted',
    actor: req.user,
    system: {
      mongoStatus: 'CONNECTED',
      database: 'nexora_campus',
      totalRegisteredUsers: users.length,
      users,
    },
  });
});

httpServer.listen(PORT, () => {
  console.log(`Nexora Campus API server & Socket.IO running at http://localhost:${PORT}`);
});

export default app;

