import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../users/user.model.js';
import { Institute } from '../institutes/institute.model.js';
import { authenticate } from '../../middleware/auth.js';
import { UserDTO } from '@nexora/types';
import { notifyAdminsAndHod } from '../notifications/notification.service.js';

const router = Router();
const getJwtSecret = () => process.env.JWT_SECRET || 'nexora-campus-jwt-secret-key-2026';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  institutionalId: z.string().min(2, 'Institutional ID / Roll number required'),
  instituteId: z.string().min(2, 'Please select your educational institute'),
  department: z.string().min(2, 'Department required'),
  role: z.enum(['STUDENT', 'FACULTY', 'ADMIN']),
  academicYear: z.string().optional(),
  semester: z.string().optional(),
  degreeProgram: z.string().optional(),
  division: z.string().optional(),
  batchSection: z.string().optional(),
  prnNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
  facultyRole: z.enum(['HOD', 'CLASS_COORDINATOR', 'PROFESSOR', 'ASSISTANT_PROFESSOR']).optional(),
  coordinatorYear: z.string().optional(),
  teachingAssignments: z.array(
    z.object({
      subjectName: z.string().min(1),
      subjectCode: z.string().optional(),
      department: z.string().optional(),
      academicYear: z.string().min(1),
      semester: z.string().min(1),
      division: z.string().optional(),
    })
  ).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password required'),
});

// Helper to issue cookie and token
function issueToken(res: Response, user: any) {
  const instName =
    user.instituteName ||
    (user.instituteId && typeof user.instituteId === 'object' ? user.instituteId.name : undefined);
  const instCode =
    user.instituteCode ||
    (user.instituteId && typeof user.instituteId === 'object' ? user.instituteId.code : undefined);

  const tokenPayload = {
    id: user.id || user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    institutionalId: user.institutionalId,
    instituteId: (user.instituteId && typeof user.instituteId === 'object')
      ? (user.instituteId.id || user.instituteId._id)?.toString()
      : user.instituteId?.toString(),
    instituteName: instName,
    instituteCode: instCode,
    academicYear: user.academicYear,
    semester: user.semester,
    facultyRole: user.facultyRole,
    coordinatorYear: user.coordinatorYear,
  };

  const token = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: '7d' });

  res.cookie('nexora_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  return token;
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parseResult = registerSchema.safeParse(req.body);
  if (!parseResult.success) {
    const fieldErrors = parseResult.error.flatten().fieldErrors;
    const msg = Object.entries(fieldErrors)
      .map(([k, errs]) => `${k}: ${(errs as string[]).join(', ')}`)
      .join('; ');

    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: msg || 'Registration input validation failed',
      details: fieldErrors,
    });
    return;
  }

  const {
    name,
    email,
    password,
    institutionalId,
    instituteId,
    department,
    role,
    academicYear,
    semester,
    degreeProgram,
    division,
    batchSection,
    prnNumber,
    bloodGroup,
    facultyRole,
    coordinatorYear,
    teachingAssignments,
  } = parseResult.data;

  try {
    // 1. Verify institute exists and is approved
    const institute = await Institute.findById(instituteId);
    if (!institute) {
      res.status(404).json({ error: 'INSTITUTE_NOT_FOUND', message: 'Selected institute not found' });
      return;
    }

    if (institute.status !== 'APPROVED') {
      res.status(400).json({
        error: 'INSTITUTE_NOT_ACTIVE',
        message: 'This institute is still pending approval by Nexora Super Admin',
      });
      return;
    }

    // Strict validation: Only departments added by Institute Admin are permitted
    if (!institute.departments.includes(department)) {
      res.status(400).json({
        error: 'INVALID_DEPARTMENT',
        message: `Department "${department}" is not configured by your institute administration. Available: ${institute.departments.join(', ')}`,
      });
      return;
    }

    // If Student: Validate Academic Year & Semester against Institute Admin configuration
    if (role === 'STUDENT') {
      if (academicYear && !institute.academicYears.includes(academicYear)) {
        res.status(400).json({
          error: 'INVALID_ACADEMIC_YEAR',
          message: `Academic year "${academicYear}" is not configured by your institute administration. Available: ${institute.academicYears.join(', ')}`,
        });
        return;
      }

      if (semester && !institute.semesters.includes(semester)) {
        res.status(400).json({
          error: 'INVALID_SEMESTER',
          message: `Semester "${semester}" is not configured by your institute administration. Available: ${institute.semesters.join(', ')}`,
        });
        return;
      }
    }

    // If Class Coordinator: Validate Coordinator Year against Institute Admin configuration
    if (role === 'FACULTY' && facultyRole === 'CLASS_COORDINATOR') {
      if (coordinatorYear && !institute.academicYears.includes(coordinatorYear)) {
        res.status(400).json({
          error: 'INVALID_COORDINATOR_YEAR',
          message: `Coordination year "${coordinatorYear}" is not configured by your institute administration. Available: ${institute.academicYears.join(', ')}`,
        });
        return;
      }
    }

    // 2. Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({
        error: 'CONFLICT',
        message: 'An account with this email address already exists',
      });
      return;
    }

    // 3. Hash password and create user in PENDING status
    const passwordHash = await bcrypt.hash(password, 10);
    const sanitizedAssignments = (role === 'FACULTY' && Array.isArray(teachingAssignments))
      ? teachingAssignments.map((t) => ({
          ...t,
          department: t.department || department,
        }))
      : [];

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      status: 'PENDING',
      institutionalId,
      instituteId: institute._id,
      department,
      academicYear: role === 'STUDENT' ? academicYear : undefined,
      semester: role === 'STUDENT' ? semester : undefined,
      degreeProgram: role === 'STUDENT' ? degreeProgram : undefined,
      division: role === 'STUDENT' ? division : undefined,
      batchSection: role === 'STUDENT' ? batchSection : undefined,
      prnNumber: role === 'STUDENT' ? prnNumber : undefined,
      bloodGroup: role === 'STUDENT' ? bloodGroup : undefined,
      facultyRole: role === 'FACULTY' ? facultyRole : undefined,
      coordinatorYear: role === 'FACULTY' && facultyRole === 'CLASS_COORDINATOR' ? coordinatorYear : undefined,
      teachingAssignments: sanitizedAssignments,
      bio: role === 'STUDENT' ? `Student, ${department}` : `Faculty Member, ${department}`,
    });

    const safeUser: any = newUser.toJSON();
    safeUser.instituteName = institute.name;
    safeUser.instituteCode = institute.code;

    if (newUser.instituteId) {
      notifyAdminsAndHod(newUser.instituteId, newUser.department, {
        title: 'New Registration Pending Approval',
        message: `${newUser.name} (${newUser.role}, ${newUser.department}) submitted registration`,
        type: 'SYSTEM',
        link: '/app/approvals',
      }).catch((err) => console.error('Register approval notification error:', err));
    }

    res.status(201).json({
      message:
        role === 'STUDENT'
          ? 'Registration submitted! Your Class Coordinator or Department HoD will review and activate your account.'
          : 'Faculty registration submitted! Your Institute Administrator will review and activate your account.',
      user: safeUser,
      status: 'PENDING',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(500).json({ error: 'SERVER_ERROR', message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const { email, password } = parseResult.data;

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).populate('instituteId', 'name code status');

    if (!user) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
      return;
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
      return;
    }

    // Check account status
    if (user.status === 'PENDING') {
      res.status(403).json({
        error: 'ACCOUNT_PENDING',
        message:
          user.role === 'STUDENT'
            ? 'Your student account is pending approval by your Class Coordinator or HoD.'
            : 'Your faculty account is pending approval by your Institute Administrator.',
        status: 'PENDING',
      });
      return;
    }

    if (user.status === 'REJECTED') {
      res.status(403).json({
        error: 'ACCOUNT_REJECTED',
        message: user.rejectionReason || 'Your registration request was rejected by your institute.',
        status: 'REJECTED',
      });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your institutional account has been suspended. Please contact your campus administrator.',
        status: 'SUSPENDED',
      });
      return;
    }

    // Set online
    user.isOnline = true;
    await user.save();

    const safeUser: any = user.toJSON();
    if (user.instituteId && typeof user.instituteId === 'object') {
      safeUser.instituteName = (user.instituteId as any).name;
      safeUser.instituteCode = (user.instituteId as any).code;
    }
    const token = issueToken(res, safeUser);

    res.json({
      message: 'Sign in successful',
      user: safeUser,
      token,
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Authentication process failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  res.clearCookie('nexora_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.clearCookie('nexora_token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id)
      .populate('instituteId', 'name code domain')
      .lean();

    if (!user) {
      res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User record not found' });
      return;
    }

    const { passwordHash: _, ...safeUser } = user;
    if (safeUser.instituteId && typeof safeUser.instituteId === 'object') {
      (safeUser as any).instituteName = (safeUser.instituteId as any).name;
      (safeUser as any).instituteCode = (safeUser.instituteId as any).code;
    }
    res.json({ user: safeUser });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve profile' });
  }
});

// GET /api/auth/demo-users
router.get('/demo-users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const demoUsers = await User.find({ status: 'ACTIVE' })
      .limit(10)
      .populate('instituteId', 'name code')
      .sort({ role: 1 })
      .lean();

    const safeUsers = demoUsers.map(({ passwordHash: _, ...u }) => ({
      ...u,
      id: u._id.toString(),
    }));

    res.json({ users: safeUsers });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve demo accounts' });
  }
});

export default router;
