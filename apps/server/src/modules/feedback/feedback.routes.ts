import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Feedback } from './feedback.model.js';
import { User } from '../users/user.model.js';
import { authenticate } from '../../middleware/auth.js';

export const feedbackRouter = Router();

// 1. GET /api/feedback - Scoped Course & Faculty Evaluation Survey Results
feedbackRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const query: any = {
      instituteId: new Types.ObjectId(user.instituteId),
    };

    if (user.role === 'FACULTY') {
      query.facultyId = new Types.ObjectId(user.id);
    } else if (user.role === 'STUDENT') {
      // Students see their own submitted feedback
      query['submittedBy.id'] = new Types.ObjectId(user.id);
    }

    const feedbacks = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const dtos = feedbacks.map((f: any) => ({
      id: f._id.toString(),
      instituteId: f.instituteId.toString(),
      facultyId: f.facultyId.toString(),
      facultyName: f.facultyName,
      courseName: f.courseName,
      department: f.department,
      academicYear: f.academicYear,
      rating: f.rating,
      clarity: f.clarity,
      pace: f.pace,
      comments: f.comments,
      isAnonymous: f.isAnonymous,
      submittedBy: f.isAnonymous
        ? undefined
        : {
            id: f.submittedBy?.id?.toString() || '',
            name: f.submittedBy?.name || 'Student',
            role: f.submittedBy?.role || 'STUDENT',
          },
      createdAt: f.createdAt.toISOString(),
    }));

    res.json(dtos);
  } catch (err: any) {
    console.error('Fetch feedback error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch feedback' });
  }
});

// 2. POST /api/feedback - Submit Course & Faculty Evaluation
feedbackRouter.post('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const {
      facultyId,
      targetFacultyId,
      facultyName,
      courseName,
      department,
      academicYear,
      rating,
      clarity,
      pace,
      comments,
      comment,
      isAnonymous = true,
    } = req.body;

    const resolvedFacultyId = facultyId || targetFacultyId;
    const resolvedComments = comments || comment;

    if (!resolvedFacultyId || !courseName || !rating) {
      res.status(400).json({ error: 'Faculty, course name, and rating are required.' });
      return;
    }

    let resolvedFacultyName = facultyName;
    if (!resolvedFacultyName) {
      const facUser = await User.findById(resolvedFacultyId);
      resolvedFacultyName = facUser?.name || 'Faculty Member';
    }

    // Anti-fraud: 1 review per student per faculty per course
    const existingFeedback = await Feedback.findOne({
      instituteId: new Types.ObjectId(user.instituteId),
      facultyId: new Types.ObjectId(resolvedFacultyId),
      courseName: courseName.trim(),
      'submittedBy.id': new Types.ObjectId(user.id),
    });

    if (existingFeedback) {
      res.status(409).json({
        error: 'DUPLICATE_FEEDBACK',
        message: 'You have already submitted an evaluation for this course and professor.',
      });
      return;
    }

    const feedback = await Feedback.create({
      instituteId: new Types.ObjectId(user.instituteId),
      facultyId: new Types.ObjectId(resolvedFacultyId),
      facultyName: resolvedFacultyName.trim(),
      courseName: courseName.trim(),
      department: department || user.department,
      academicYear: academicYear || user.academicYear || 'Academic Year',
      rating: Number(rating),
      clarity: Number(clarity || rating),
      pace: Number(pace || rating),
      comments: resolvedComments?.trim(),
      isAnonymous: Boolean(isAnonymous),
      submittedBy: {
        id: new Types.ObjectId(user.id),
        name: isAnonymous ? 'Anonymous Student' : user.name,
        role: user.role,
      },
    });

    res.status(201).json({
      message: 'Evaluation submitted successfully. Thank you for your feedback.',
      feedback: {
        ...feedback.toJSON(),
        id: feedback._id.toString(),
      },
    });
  } catch (err: any) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to submit feedback' });
  }
});

// 3. GET /api/feedback/reminder-status (Check if student needs to be reminded)
feedbackRouter.get('/reminder-status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== 'STUDENT') {
      res.json({ needsReminder: false });
      return;
    }

    // Check if student submitted feedback in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentFeedback = await Feedback.findOne({
      'submittedBy.id': new Types.ObjectId(user.id),
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Check if there are faculty in the student's department
    const departmentFaculty = await User.countDocuments({
      instituteId: user.instituteId,
      department: user.department,
      role: 'FACULTY',
      status: 'ACTIVE',
    });

    res.json({
      needsReminder: !recentFeedback && departmentFaculty > 0,
      facultyAvailable: departmentFaculty,
      hasSubmittedRecently: Boolean(recentFeedback),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to check reminder status' });
  }
});
