import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { authenticate } from '../../middleware/auth.js';
import { User } from './user.model.js';
import { Complaint } from '../complaints/complaint.model.js';
import { Vote } from '../polls/poll.model.js';
import { AcademicFile } from '../files/file.model.js';
import { Notice } from '../notices/notice.model.js';
import { Feedback } from '../feedback/feedback.model.js';
import { Institute } from '../institutes/institute.model.js';

export const userRouter = Router();

// Helper to resolve student mentor & current semester curriculum
async function resolveStudentAcademics(userDoc: any) {
  if (userDoc.role !== 'STUDENT') return { mentor: undefined, currentSemesterSubjects: [] };

  const instituteObjId = (userDoc.instituteId as any)?._id || userDoc.instituteId;
  let mentor: any = undefined;

  // 1. Find assigned class coordinator for student's department and academicYear
  if (userDoc.academicYear) {
    const coordinator = await User.findOne({
      instituteId: instituteObjId,
      department: userDoc.department,
      role: 'FACULTY',
      facultyRole: 'CLASS_COORDINATOR',
      coordinatorYear: userDoc.academicYear,
      status: 'ACTIVE',
    }).select('name email facultyRole coordinatorYear avatarUrl').lean();

    if (coordinator) {
      mentor = {
        id: (coordinator as any)._id.toString(),
        name: coordinator.name,
        email: coordinator.email,
        facultyRole: coordinator.facultyRole,
        coordinatorYear: coordinator.coordinatorYear,
      };
    }
  }

  if (!mentor) {
    // Fallback to HoD
    const hod = await User.findOne({
      instituteId: instituteObjId,
      department: userDoc.department,
      role: 'FACULTY',
      facultyRole: 'HOD',
      status: 'ACTIVE',
    }).select('name email facultyRole avatarUrl').lean();

    if (hod) {
      mentor = {
        id: (hod as any)._id.toString(),
        name: hod.name,
        email: hod.email,
        facultyRole: 'HOD',
      };
    }
  }

  // 2. Find enrolled subjects for student's department, year, semester
  let currentSemesterSubjects: any[] = [];
  try {
    const instituteDoc = await Institute.findById(instituteObjId).lean();
    const deptSubjects = (instituteDoc?.departmentSubjects || []).filter(
      (s: any) =>
        s.department === userDoc.department &&
        (!userDoc.academicYear || s.academicYear === userDoc.academicYear) &&
        (!userDoc.semester || s.semester === userDoc.semester)
    );

    const facultyMembers = await User.find({
      instituteId: instituteObjId,
      role: 'FACULTY',
      status: 'ACTIVE',
      'teachingAssignments.department': userDoc.department,
    }).select('name teachingAssignments').lean();

    currentSemesterSubjects = deptSubjects.map((s: any) => {
      const assignedFac = facultyMembers.find((f: any) =>
        f.teachingAssignments?.some(
          (ta: any) =>
            ta.department === userDoc.department &&
            ta.subjectName?.toLowerCase() === s.name.toLowerCase() &&
            (!userDoc.academicYear || ta.academicYear === userDoc.academicYear) &&
            (!userDoc.semester || ta.semester === userDoc.semester)
        )
      );
      return {
        id: s._id?.toString(),
        name: s.name,
        code: s.code,
        facultyName: assignedFac?.name,
        facultyId: assignedFac ? (assignedFac as any)._id.toString() : undefined,
      };
    });
  } catch (err) {
    console.warn('Error resolving curriculum subjects for student:', err);
  }

  return { mentor, currentSemesterSubjects };
}

// 1. Scoped User Discovery Directory (Privacy-Safe)
userRouter.get('/directory', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { search, department, role, academicYear, instituteId } = req.query;

    const query: any = {
      status: 'ACTIVE',
      _id: { $ne: new Types.ObjectId(user.id) }, // exclude self
    };

    if (user.role === 'SUPER_ADMIN') {
      if (instituteId && instituteId !== 'ALL' && Types.ObjectId.isValid(instituteId as string)) {
        query.instituteId = new Types.ObjectId(instituteId as string);
      }
    } else {
      if (!user.instituteId) {
        res.status(400).json({ error: 'User does not belong to an institute' });
        return;
      }
      query.instituteId = new Types.ObjectId(user.instituteId);
    }

    if (department && department !== 'ALL') {
      query.department = department;
    }

    if (role && role !== 'ALL') {
      query.role = role;
    }

    if (academicYear && academicYear !== 'ALL') {
      query.academicYear = academicYear;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { institutionalId: { $regex: q, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('name role facultyRole department academicYear semester institutionalId avatarUrl isOnline privacySettings profileVisibility')
      .limit(60)
      .lean();

    const dtos = users.map((u: any) => ({
      id: u._id.toString(),
      name: u.name,
      role: u.role,
      facultyRole: u.facultyRole,
      department: u.department,
      academicYear: u.academicYear,
      semester: u.semester,
      institutionalId: u.institutionalId,
      avatarUrl: u.avatarUrl,
      isOnline: u.isOnline || false,
      dmPermission: u.privacySettings?.dmPermission || 'ALLOW_ALL',
      profileVisibility: u.profileVisibility || 'PUBLIC',
    }));

    res.json(dtos);
  } catch (err: any) {
    console.error('Directory fetch error:', err);
    res.status(500).json({ error: err.message || 'Failed to search directory' });
  }
});

// 2. Update user DM privacy settings
userRouter.patch('/privacy', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { dmPermission } = req.body;

    if (!['ALLOW_ALL', 'SAME_DEPARTMENT_ONLY', 'FACULTY_ONLY'].includes(dmPermission)) {
      res.status(400).json({ error: 'Invalid dmPermission value' });
      return;
    }

    const updated = await User.findByIdAndUpdate(
      new Types.ObjectId(user.id),
      { $set: { 'privacySettings.dmPermission': dmPermission } },
      { new: true }
    );

    res.json({
      message: 'Privacy settings updated successfully',
      privacySettings: updated?.privacySettings,
    });
  } catch (err: any) {
    console.error('Update privacy error:', err);
    res.status(500).json({ error: err.message || 'Failed to update privacy settings' });
  }
});

// 3. Get Current User Profile & Campus Stats
userRouter.get('/profile/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userDoc = await User.findById(new Types.ObjectId(authUser.id))
      .populate('instituteId', 'name code domain')
      .lean();

    if (!userDoc) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userId = new Types.ObjectId(authUser.id);
    const [complaintCount, voteCount, fileCount, noticeCount, reviews] = await Promise.all([
      Complaint.countDocuments({ 'submittedBy.id': userId }),
      Vote.countDocuments({ userId }),
      AcademicFile.countDocuments({ 'uploadedBy.id': userId } as any),
      Notice.countDocuments({ authorId: userId }),
      userDoc.role === 'FACULTY' ? Feedback.find({ facultyId: userId }).lean() : Promise.resolve([]),
    ]);

    let facultyRating = undefined;
    if (userDoc.role === 'FACULTY') {
      const count = reviews.length;
      if (count > 0) {
        const avgR = reviews.reduce((acc, r: any) => acc + (r.rating || 0), 0) / count;
        const avgC = reviews.reduce((acc, r: any) => acc + (r.clarity || 0), 0) / count;
        const avgP = reviews.reduce((acc, r: any) => acc + (r.pace || 0), 0) / count;
        facultyRating = {
          averageRating: Number(avgR.toFixed(1)),
          clarityAverage: Number(avgC.toFixed(1)),
          paceAverage: Number(avgP.toFixed(1)),
          totalReviews: count,
        };
      } else {
        facultyRating = {
          averageRating: 0,
          clarityAverage: 0,
          paceAverage: 0,
          totalReviews: 0,
        };
      }
    }

    const { mentor, currentSemesterSubjects } = await resolveStudentAcademics(userDoc);

    res.json({
      user: {
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
        status: userDoc.status,
        institutionalId: userDoc.institutionalId,
        department: userDoc.department,
        academicYear: userDoc.academicYear,
        semester: userDoc.semester,
        degreeProgram: (userDoc as any).degreeProgram,
        division: (userDoc as any).division,
        batchSection: (userDoc as any).batchSection,
        admissionYear: (userDoc as any).admissionYear,
        passingYear: (userDoc as any).passingYear,
        prnNumber: (userDoc as any).prnNumber,
        bloodGroup: (userDoc as any).bloodGroup,
        campusRoles: (userDoc as any).campusRoles || [],
        links: (userDoc as any).links || {},
        mentor,
        currentSemesterSubjects,
        facultyRole: userDoc.facultyRole,
        coordinatorYear: userDoc.coordinatorYear,
        teachingAssignments: (userDoc as any).teachingAssignments || [],
        facultyRating,
        avatarUrl: userDoc.avatarUrl || null,
        bio: userDoc.bio || '',
        isOnline: userDoc.isOnline,
        privacySettings: userDoc.privacySettings || { dmPermission: 'ALLOW_ALL' },
        institute: userDoc.instituteId ? {
          id: (userDoc.instituteId as any)._id?.toString(),
          name: (userDoc.instituteId as any).name,
          code: (userDoc.instituteId as any).code,
        } : null,
        createdAt: userDoc.createdAt,
      },
      stats: {
        complaintsFiled: complaintCount,
        votesCast: voteCount,
        filesShared: fileCount,
        noticesPublished: noticeCount,
      },
    });
  } catch (err: any) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch user profile' });
  }
});

// 4. Update Current User Profile (Bio, Name, Avatar, Academic info)
userRouter.patch('/profile/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      name,
      bio,
      avatarUrl,
      academicYear,
      semester,
      degreeProgram,
      division,
      batchSection,
      admissionYear,
      passingYear,
      prnNumber,
      bloodGroup,
      campusRoles,
      links,
      teachingAssignments,
    } = req.body;
    const updates: any = {};

    if (name && typeof name === 'string' && name.trim().length > 0) {
      updates.name = name.trim();
    }
    if (typeof bio === 'string') {
      updates.bio = bio.trim();
    }
    if (typeof avatarUrl === 'string') {
      updates.avatarUrl = avatarUrl.trim();
    }
    if (academicYear && typeof academicYear === 'string') {
      updates.academicYear = academicYear.trim();
    }
    if (semester && typeof semester === 'string') {
      updates.semester = semester.trim();
    }
    if (typeof degreeProgram === 'string') {
      updates.degreeProgram = degreeProgram.trim();
    }
    if (typeof division === 'string') {
      updates.division = division.trim();
    }
    if (typeof batchSection === 'string') {
      updates.batchSection = batchSection.trim();
    }
    if (typeof admissionYear === 'string') {
      updates.admissionYear = admissionYear.trim();
    }
    if (typeof passingYear === 'string') {
      updates.passingYear = passingYear.trim();
    }
    if (typeof prnNumber === 'string') {
      updates.prnNumber = prnNumber.trim();
    }
    if (typeof bloodGroup === 'string') {
      updates.bloodGroup = bloodGroup.trim().toUpperCase();
    }
    if (Array.isArray(campusRoles)) {
      updates.campusRoles = campusRoles;
    }
    if (links && typeof links === 'object') {
      updates.links = links;
    }
    if (Array.isArray(teachingAssignments)) {
      updates.teachingAssignments = teachingAssignments;
    }

    const updatedUser = await User.findByIdAndUpdate(
      new Types.ObjectId(authUser.id),
      { $set: updates },
      { new: true }
    ).populate('instituteId', 'name code domain');

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toJSON(),
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

// 5. Update User Settings & Notification Preferences
userRouter.patch('/settings', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { dmPermission, profileVisibility } = req.body;
    const updates: any = {};

    if (dmPermission && ['ALLOW_ALL', 'SAME_DEPARTMENT_ONLY', 'FACULTY_ONLY'].includes(dmPermission)) {
      updates['privacySettings.dmPermission'] = dmPermission;
    }

    // Only students can toggle profileVisibility; faculty and admin profiles are always public
    if (profileVisibility && ['PUBLIC', 'PRIVATE'].includes(profileVisibility)) {
      if (authUser.role === 'STUDENT') {
        updates.profileVisibility = profileVisibility;
      } else {
        updates.profileVisibility = 'PUBLIC';
      }
    }

    const updated = await User.findByIdAndUpdate(
      new Types.ObjectId(authUser.id),
      { $set: updates },
      { new: true }
    );

    res.json({
      message: 'Settings updated successfully',
      privacySettings: updated?.privacySettings,
      profileVisibility: updated?.profileVisibility || 'PUBLIC',
    });
  } catch (err: any) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: err.message || 'Failed to update settings' });
  }
});

// 6. View another person's profile from the People Directory (with Privacy Rules)
userRouter.get('/profile/:userId', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = req.params.userId as string;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const targetUser = await User.findById(new Types.ObjectId(userId))
      .populate('instituteId', 'name code domain')
      .lean();

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isSelf = authUser.id === userId;
    const isStaffRequester = ['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(authUser.role);
    const isTargetStaff = ['FACULTY', 'ADMIN', 'SUPER_ADMIN'].includes(targetUser.role);
    const isTargetPublic = targetUser.profileVisibility !== 'PRIVATE';

    // Faculty profiles are always public.
    // Full profile shown if:
    // 1) Target is staff (Faculty/Admin)
    // 2) Target student has public profile
    // 3) Requester is viewing own profile
    // 4) Requester is staff/admin (governance oversight)
    const canViewFull = isSelf || isStaffRequester || isTargetStaff || isTargetPublic;

    if (!canViewFull) {
      // Instagram-style private profile response: basic preview only
      res.json({
        isPrivate: true,
        canViewFull: false,
        user: {
          id: targetUser._id.toString(),
          name: targetUser.name,
          role: targetUser.role,
          department: targetUser.department,
          academicYear: targetUser.academicYear,
          avatarUrl: targetUser.avatarUrl || null,
          isOnline: targetUser.isOnline || false,
          profileVisibility: 'PRIVATE',
          dmPermission: targetUser.privacySettings?.dmPermission || 'ALLOW_ALL',
          institute: targetUser.instituteId ? {
            name: (targetUser.instituteId as any).name,
            code: (targetUser.instituteId as any).code,
          } : null,
        },
        stats: null,
      });
      return;
    }

    // Full profile: fetch campus activity stats
    const targetObjId = new Types.ObjectId(userId);
    const [complaintCount, voteCount, fileCount, noticeCount, reviews] = await Promise.all([
      Complaint.countDocuments({ 'submittedBy.id': targetObjId }),
      Vote.countDocuments({ userId: targetObjId }),
      AcademicFile.countDocuments({ 'uploadedBy.id': targetObjId } as any),
      Notice.countDocuments({ authorId: targetObjId }),
      targetUser.role === 'FACULTY' ? Feedback.find({ facultyId: targetObjId }).lean() : Promise.resolve([]),
    ]);

    let facultyRating = undefined;
    if (targetUser.role === 'FACULTY') {
      const count = reviews.length;
      if (count > 0) {
        const avgR = reviews.reduce((acc, r: any) => acc + (r.rating || 0), 0) / count;
        const avgC = reviews.reduce((acc, r: any) => acc + (r.clarity || 0), 0) / count;
        const avgP = reviews.reduce((acc, r: any) => acc + (r.pace || 0), 0) / count;
        facultyRating = {
          averageRating: Number(avgR.toFixed(1)),
          clarityAverage: Number(avgC.toFixed(1)),
          paceAverage: Number(avgP.toFixed(1)),
          totalReviews: count,
        };
      } else {
        facultyRating = {
          averageRating: 0,
          clarityAverage: 0,
          paceAverage: 0,
          totalReviews: 0,
        };
      }
    }

    const { mentor, currentSemesterSubjects } = await resolveStudentAcademics(targetUser);

    res.json({
      isPrivate: false,
      canViewFull: true,
      user: {
        id: targetUser._id.toString(),
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        department: targetUser.department,
        institutionalId: targetUser.institutionalId,
        academicYear: targetUser.academicYear,
        semester: targetUser.semester,
        degreeProgram: (targetUser as any).degreeProgram,
        division: (targetUser as any).division,
        batchSection: (targetUser as any).batchSection,
        admissionYear: (targetUser as any).admissionYear,
        passingYear: (targetUser as any).passingYear,
        prnNumber: (targetUser as any).prnNumber,
        bloodGroup: (targetUser as any).bloodGroup,
        campusRoles: (targetUser as any).campusRoles || [],
        links: (targetUser as any).links || {},
        mentor,
        currentSemesterSubjects,
        facultyRole: targetUser.facultyRole,
        coordinatorYear: targetUser.coordinatorYear,
        teachingAssignments: (targetUser as any).teachingAssignments || [],
        facultyRating,
        avatarUrl: targetUser.avatarUrl || null,
        bio: targetUser.bio || '',
        isOnline: targetUser.isOnline || false,
        profileVisibility: targetUser.profileVisibility || 'PUBLIC',
        dmPermission: targetUser.privacySettings?.dmPermission || 'ALLOW_ALL',
        institute: targetUser.instituteId ? {
          name: (targetUser.instituteId as any).name,
          code: (targetUser.instituteId as any).code,
        } : null,
        createdAt: targetUser.createdAt,
      },
      stats: {
        complaintsFiled: complaintCount,
        votesCast: voteCount,
        filesShared: fileCount,
        noticesPublished: noticeCount,
      },
    });
  } catch (err: any) {
    console.error('Fetch public profile error:', err);
    res.status(500).json({ error: err.message || 'Failed to view profile' });
  }
});
