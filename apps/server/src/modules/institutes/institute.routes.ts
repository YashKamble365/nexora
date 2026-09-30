import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Institute } from './institute.model.js';
import { User } from '../users/user.model.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

async function findTargetInstitute(idParam?: string | string[], callerInstId?: any): Promise<any> {
  const rawId = Array.isArray(idParam) ? idParam[0] : idParam;
  const callerIdStr = (callerInstId as any)?._id?.toString() || callerInstId?.toString();

  if (rawId && rawId !== 'current' && rawId !== '[object Object]' && mongoose.Types.ObjectId.isValid(rawId)) {
    const inst = await Institute.findById(rawId);
    if (inst) return inst;
  }

  if (callerIdStr && callerIdStr !== '[object Object]' && mongoose.Types.ObjectId.isValid(callerIdStr)) {
    const inst = await Institute.findById(callerIdStr);
    if (inst) return inst;
  }

  return (await Institute.findOne({ status: 'APPROVED' })) || (await Institute.findOne());
}

const registerInstituteSchema = z.object({
  name: z.string().min(3, 'Institute name must be at least 3 characters'),
  code: z.string().min(2, 'Institute code must be at least 2 characters').toUpperCase(),
  domain: z.string().optional(),
  address: z.string().optional(),
  departments: z.array(z.string()).min(1, 'At least one department is required'),
  adminName: z.string().min(2, 'Admin full name is required'),
  adminEmail: z.string().email('Valid institutional admin email required'),
  adminPassword: z.string().min(6, 'Admin password must be at least 6 characters'),
  institutionalId: z.string().min(2, 'Admin institutional ID required'),
});

const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
});

// GET /api/institutes (Public list of approved institutes for dropdowns)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const institutes = await Institute.find({ status: 'APPROVED' })
      .select('name code domain departments academicYears semesters address')
      .sort({ name: 1 })
      .lean();

    res.json({
      institutes: institutes.map((i) => ({
        ...i,
        id: i._id.toString(),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve institutes' });
  }
});

// GET /api/institutes/all (Super Admin view of all institutes with counts)
router.get('/all', authenticate, requireRole('SUPER_ADMIN'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const institutes = await Institute.find()
      .populate('adminUserId', 'name email status institutionalId')
      .sort({ createdAt: -1 })
      .lean();

    // Attach student & faculty counts
    const enriched = await Promise.all(
      institutes.map(async (inst) => {
        const [studentCount, facultyCount] = await Promise.all([
          User.countDocuments({ instituteId: inst._id, role: 'STUDENT', status: 'ACTIVE' }),
          User.countDocuments({ instituteId: inst._id, role: 'FACULTY', status: 'ACTIVE' }),
        ]);
        return {
          ...inst,
          id: inst._id.toString(),
          studentCount,
          facultyCount,
        };
      })
    );

    res.json({ institutes: enriched });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve all institutes' });
  }
});

// POST /api/institutes/register (College Admin registers institute & admin credentials)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parseResult = registerInstituteSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const data = parseResult.data;

  try {
    // Check if code or email already exists
    const existingInstitute = await Institute.findOne({ code: data.code.toUpperCase() });
    if (existingInstitute) {
      res.status(409).json({
        error: 'CONFLICT',
        message: `Institute with code "${data.code}" already exists in Nexora grid`,
      });
      return;
    }

    const existingUser = await User.findOne({ email: data.adminEmail.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        error: 'CONFLICT',
        message: 'Admin email is already registered in Nexora',
      });
      return;
    }

    // 1. Create Institute in PENDING_APPROVAL status
    const institute = await Institute.create({
      name: data.name,
      code: data.code.toUpperCase(),
      domain: data.domain,
      address: data.address,
      departments: data.departments,
      status: 'PENDING_APPROVAL',
    });

    // 2. Create Institute Admin User in PENDING status
    const passwordHash = await bcrypt.hash(data.adminPassword, 10);
    const adminUser = await User.create({
      name: data.adminName,
      email: data.adminEmail.toLowerCase(),
      passwordHash,
      role: 'ADMIN',
      status: 'PENDING',
      institutionalId: data.institutionalId,
      department: 'Institutional Administration',
      instituteId: institute._id,
      bio: `Campus Administrator for ${data.name}`,
    });

    // 3. Link Admin to Institute
    institute.adminUserId = adminUser._id;
    await institute.save();

    res.status(201).json({
      message: 'Institute registration submitted successfully. Nexora Super Admin will review and verify your campus.',
      institute: {
        id: institute._id,
        name: institute.name,
        code: institute.code,
        status: institute.status,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database error';
    res.status(500).json({ error: 'SERVER_ERROR', message });
  }
});

// PATCH /api/institutes/:id/status (Super Admin approve or reject)
router.patch('/:id/status', authenticate, requireRole('SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = updateStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  const { status, reason } = parseResult.data;

  try {
    const institute = await Institute.findById(req.params.id);
    if (!institute) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Institute not found' });
      return;
    }

    institute.status = status;
    await institute.save();

    // Update associated admin user status automatically
    if (institute.adminUserId) {
      await User.findByIdAndUpdate(institute.adminUserId, {
        status: status === 'APPROVED' ? 'ACTIVE' : 'REJECTED',
        rejectionReason: status === 'REJECTED' ? reason : undefined,
        approvedBy: req.user?.id,
        approvedAt: new Date(),
      });
    }

    // Also update any other users with role ADMIN for this institute
    await User.updateMany(
      { instituteId: institute._id, role: 'ADMIN' },
      {
        status: status === 'APPROVED' ? 'ACTIVE' : 'REJECTED',
        rejectionReason: status === 'REJECTED' ? reason : undefined,
        approvedBy: req.user?.id,
        approvedAt: new Date(),
      }
    );

    res.json({
      message: `Institute ${institute.name} has been ${status.toLowerCase()}`,
      institute,
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update institute status' });
  }
});

const updateStructureSchema = z.object({
  departments: z.array(z.string().min(1)).min(1, 'At least one department is required'),
  academicYears: z.array(z.string().min(1)).min(1, 'At least one academic year is required'),
  semesters: z.array(z.string().min(1)).min(1, 'At least one semester is required'),
});

// GET /api/institutes/:id/structure (Retrieve configured departments, years, semesters)
router.get('/:id/structure', async (req: Request, res: Response): Promise<void> => {
  try {
    const institute = await findTargetInstitute(req.params.id);

    if (!institute) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Institute not found' });
      return;
    }

    res.json({
      instituteId: institute._id,
      name: institute.name,
      code: institute.code,
      departments: institute.departments,
      academicYears: institute.academicYears,
      semesters: institute.semesters,
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve academic structure' });
  }
});

// PUT /api/institutes/:id/structure (Admin updates departments, years, semesters)
router.put('/:id/structure', authenticate, requireRole('ADMIN', 'SUPER_ADMIN'), async (req: Request, res: Response): Promise<void> => {
  const parseResult = updateStructureSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: parseResult.error.flatten().fieldErrors,
    });
    return;
  }

  try {
    const caller = await User.findById(req.user?.id);
    if (!caller) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const institute = await findTargetInstitute(req.params.id, caller.instituteId);
    if (!institute) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Institute not found' });
      return;
    }

    // Role check: Institute Admin can only modify their own institute
    const callerInstId = (caller.instituteId as any)?._id?.toString() || caller.instituteId?.toString();
    if (caller.role === 'ADMIN' && callerInstId && callerInstId !== institute._id.toString()) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot modify academic structure of another institute' });
      return;
    }

    const { departments, academicYears, semesters } = parseResult.data;

    // Deduplicate and trim strings
    institute.departments = Array.from(new Set(departments.map((d: string) => d.trim()))).filter(Boolean);
    institute.academicYears = Array.from(new Set(academicYears.map((y: string) => y.trim()))).filter(Boolean);
    institute.semesters = Array.from(new Set(semesters.map((s: string) => s.trim()))).filter(Boolean);

    await institute.save();

    res.json({
      message: 'Academic structure updated successfully',
      departments: institute.departments,
      academicYears: institute.academicYears,
      semesters: institute.semesters,
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update academic structure' });
  }
});

// GET /api/institutes/:id/subjects (Retrieve department subjects catalog)
router.get('/:id/subjects', async (req: Request, res: Response): Promise<void> => {
  try {
    const institute = await findTargetInstitute(req.params.id);

    if (!institute) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Institute not found' });
      return;
    }

    const { department } = req.query;
    let subjects = institute.departmentSubjects || [];
    if (department && typeof department === 'string' && department !== 'ALL') {
      const target = department.trim().toLowerCase();
      subjects = subjects.filter((s: any) => s.department?.trim().toLowerCase() === target);
    }

    res.json({
      instituteId: institute._id.toString(),
      subjects: subjects.map((s: any) => ({
        id: s._id?.toString(),
        department: s.department,
        name: s.name,
        code: s.code,
        academicYear: s.academicYear,
        semester: s.semester,
        addedBy: s.addedBy?.toString(),
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve subjects' });
  }
});

// POST /api/institutes/:id/subjects (Faculty Admin or Campus Admin adds subject)
router.post('/:id/subjects', authenticate, requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'), async (req: Request, res: Response): Promise<void> => {
  try {
    const caller = await User.findById(req.user?.id);
    if (!caller) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const institute = await findTargetInstitute(req.params.id, caller.instituteId);
    if (!institute) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Institute not found' });
      return;
    }

    const { department, name, code, academicYear, semester } = req.body;
    if (!department || !name || !academicYear || !semester) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Department, subject name, academic year, and semester are required' });
      return;
    }

    const callerInstId = (caller.instituteId as any)?._id?.toString() || caller.instituteId?.toString();
    if (caller.role === 'FACULTY') {
      if (callerInstId && callerInstId !== institute._id.toString()) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot modify subjects of another institute' });
        return;
      }
      // Faculty members / HOD / Coordinators can add subjects to their department
      if (caller.department && caller.department.trim().toLowerCase() !== department.trim().toLowerCase()) {
        res.status(403).json({ error: 'FORBIDDEN', message: `Faculty can only add subjects to their own department (${caller.department})` });
        return;
      }
    } else if (caller.role === 'ADMIN') {
      if (callerInstId && callerInstId !== institute._id.toString()) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot modify subjects of another institute' });
        return;
      }
    }

    if (!institute.departmentSubjects) {
      institute.departmentSubjects = [];
    }

    const trimmedName = name.trim();
    const trimmedDept = department.trim();
    const trimmedYear = academicYear.trim();
    const trimmedSem = semester.trim();

    // Check duplicate
    const isDup = institute.departmentSubjects.some(
      (s: any) =>
        s.department?.trim().toLowerCase() === trimmedDept.toLowerCase() &&
        s.name?.trim().toLowerCase() === trimmedName.toLowerCase() &&
        s.semester?.trim().toLowerCase() === trimmedSem.toLowerCase()
    );

    if (isDup) {
      res.status(400).json({
        error: 'DUPLICATE_SUBJECT',
        message: `Subject "${trimmedName}" is already registered for ${trimmedSem} in ${trimmedDept}`,
      });
      return;
    }

    const newSubject = {
      department: trimmedDept,
      name: trimmedName,
      code: code ? code.trim().toUpperCase() : undefined,
      academicYear: trimmedYear,
      semester: trimmedSem,
      addedBy: caller._id,
      createdAt: new Date(),
    };

    institute.departmentSubjects.push(newSubject as any);
    await institute.save();

    const created = institute.departmentSubjects[institute.departmentSubjects.length - 1];

    res.status(201).json({
      message: 'Subject added successfully',
      subject: {
        id: (created as any)._id?.toString(),
        department: created.department,
        name: created.name,
        code: created.code,
        academicYear: created.academicYear,
        semester: created.semester,
      },
    });
  } catch (error) {
    console.error('Failed to add subject error:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: (error as any)?.message || 'Failed to add subject' });
  }
});

// DELETE /api/institutes/:id/subjects/:subjectId (Faculty or Admin removes subject)
router.delete('/:id/subjects/:subjectId', authenticate, requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'), async (req: Request, res: Response): Promise<void> => {
  try {
    const caller = await User.findById(req.user?.id);
    if (!caller) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const institute = await findTargetInstitute(req.params.id, caller.instituteId);
    if (!institute) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Institute not found' });
      return;
    }

    const subject = (institute.departmentSubjects || []).find(
      (s: any) => s._id?.toString() === req.params.subjectId
    );

    if (!subject) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Subject not found in catalog' });
      return;
    }

    const callerInstId = (caller.instituteId as any)?._id?.toString() || caller.instituteId?.toString();
    if (caller.role === 'FACULTY') {
      if (callerInstId && callerInstId !== institute._id.toString()) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot modify subjects of another institute' });
        return;
      }
      if (caller.department && caller.department.trim().toLowerCase() !== subject.department.trim().toLowerCase()) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Faculty can only remove subjects from their own department' });
        return;
      }
    } else if (caller.role === 'ADMIN') {
      if (callerInstId && callerInstId !== institute._id.toString()) {
        res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot modify subjects of another institute' });
        return;
      }
    }

    institute.departmentSubjects = (institute.departmentSubjects || []).filter(
      (s: any) => s._id?.toString() !== req.params.subjectId
    );
    await institute.save();

    res.json({ message: 'Subject removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete subject' });
  }
});

export default router;
