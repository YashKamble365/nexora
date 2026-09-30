import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Survey, SurveyResponse } from './survey.model.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { dispatchAudienceNotification } from '../notifications/notification.service.js';
import { COAttainmentItem, SurveyAnalyticsDTO } from '@nexora/types';

export const surveyRouter = Router();

// 1. GET /api/surveys - Scoped list of academic & course exit surveys
surveyRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User does not belong to an institute' });
      return;
    }

    const { status, type, department, academicYear, scope } = req.query;
    const now = new Date();

    const query: any = {
      instituteId: new Types.ObjectId(user.instituteId),
    };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (type && type !== 'ALL') {
      query.type = type;
    }

    // Role-based visibility
    if (user.role === 'STUDENT') {
      // Students see active surveys for their department and academic year
      query.department = user.department;
      if (user.academicYear) {
        query.academicYear = { $in: [user.academicYear, 'ALL'] };
      }
    } else if (user.role === 'FACULTY') {
      if (scope === 'MY_CREATED') {
        query['author.id'] = new Types.ObjectId(user.id);
      } else {
        // Faculty see surveys in their department or ones they created
        query.$or = [
          { department: user.department },
          { 'author.id': new Types.ObjectId(user.id) },
        ];
      }
    } else if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      if (department && department !== 'ALL') {
        query.department = department;
      }
    }

    if (academicYear && academicYear !== 'ALL') {
      query.academicYear = academicYear;
    }

    const surveys = await Survey.find(query).sort({ createdAt: -1 }).lean();

    // Auto-close expired surveys
    const updatedSurveys = await Promise.all(
      surveys.map(async (s: any) => {
        if (s.status === 'ACTIVE' && new Date(s.endDate) < now) {
          await Survey.findByIdAndUpdate(s._id, { status: 'CLOSED' });
          s.status = 'CLOSED';
        }
        return s;
      })
    );

    // If student, check whether they have already responded
    const surveyIds = updatedSurveys.map((s: any) => s._id);
    const studentResponses = user.role === 'STUDENT'
      ? await SurveyResponse.find({
          studentId: new Types.ObjectId(user.id),
          surveyId: { $in: surveyIds },
        }).select('surveyId').lean()
      : [];

    const respondedSet = new Set(studentResponses.map((r: any) => r.surveyId.toString()));

    const dtos = updatedSurveys.map((s: any) => ({
      id: s._id.toString(),
      title: s.title,
      description: s.description,
      type: s.type,
      department: s.department,
      courseName: s.courseName,
      courseCode: s.courseCode,
      academicYear: s.academicYear,
      semester: s.semester,
      author: {
        id: s.author?.id ? s.author.id.toString() : '',
        name: s.author?.name || 'Faculty Member',
        role: s.author?.role || 'FACULTY',
        department: s.author?.department,
        facultyRole: s.author?.facultyRole,
      },
      questions: s.questions || [],
      status: s.status,
      isAnonymous: s.isAnonymous,
      endDate: s.endDate?.toISOString(),
      totalResponses: s.totalResponses || 0,
      hasResponded: respondedSet.has(s._id.toString()),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));

    res.json(dtos);
  } catch (err: any) {
    console.error('Fetch surveys error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch surveys' });
  }
});

// 2. POST /api/surveys - Create New Academic or Course Exit Survey
surveyRouter.post(
  '/',
  authenticate,
  requireRole('FACULTY', 'ADMIN', 'SUPER_ADMIN'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      if (!user.instituteId) {
        res.status(401).json({ error: 'UNAUTHORIZED', message: 'User does not belong to an institute' });
        return;
      }

      const {
        title,
        description,
        type = 'COURSE_EXIT',
        department,
        courseName,
        courseCode,
        academicYear,
        semester,
        questions,
        endDate,
        isAnonymous = true,
      } = req.body;

      const targetDept = department || user.department;
      if (!title || !targetDept || !academicYear || !semester || !endDate) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Title, department, academic year, semester, and deadline are required.',
        });
        return;
      }

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'At least one survey question or Course Outcome is required.',
        });
        return;
      }

      const formattedQuestions = questions.map((q: any, idx: number) => ({
        id: q.id || `q_${Date.now()}_${idx}`,
        text: q.text?.trim() || `Question ${idx + 1}`,
        type: q.type || 'RATING_5',
        coTag: q.coTag?.trim() || undefined,
        options: Array.isArray(q.options) ? q.options.filter(Boolean) : undefined,
        required: q.required !== false,
      }));

      const survey = await Survey.create({
        instituteId: new Types.ObjectId(user.instituteId),
        title: title.trim(),
        description: description?.trim(),
        type,
        department: targetDept,
        courseName: courseName?.trim(),
        courseCode: courseCode?.trim()?.toUpperCase(),
        academicYear,
        semester,
        author: {
          id: new Types.ObjectId(user.id),
          name: user.name || 'Faculty Member',
          role: user.role,
          department: user.department,
          facultyRole: user.facultyRole,
        },
        questions: formattedQuestions,
        status: 'ACTIVE',
        isAnonymous,
        endDate: new Date(endDate),
        totalResponses: 0,
      });

      // Dispatch real-time push notification to targeted students
      dispatchAudienceNotification({
        instituteId: user.instituteId,
        roles: ['STUDENT'],
        departments: [targetDept],
        academicYears: [academicYear],
        title: `New Survey: ${survey.title}`,
        message: `${courseName ? `${courseName} • ` : ''}Please submit your responses before ${new Date(endDate).toLocaleDateString()}`,
        type: 'SURVEY',
        link: '/app/polls?tab=SURVEYS',
      });

      res.status(201).json({
        message: 'Survey created and published successfully',
        survey: {
          id: survey._id.toString(),
          title: survey.title,
          type: survey.type,
          department: survey.department,
          courseName: survey.courseName,
          courseCode: survey.courseCode,
          academicYear: survey.academicYear,
          semester: survey.semester,
          questions: survey.questions,
          status: survey.status,
          endDate: survey.endDate.toISOString(),
          totalResponses: 0,
        },
      });
    } catch (err: any) {
      console.error('Create survey error:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'Failed to create survey' });
    }
  }
);

// 3. GET /api/surveys/:id - Fetch single survey details
surveyRouter.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const survey = await Survey.findById(req.params.id).lean();
    if (!survey || survey.instituteId.toString() !== user.instituteId) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Survey not found' });
      return;
    }

    let hasResponded = false;
    if (user.role === 'STUDENT') {
      const resp = await SurveyResponse.findOne({
        surveyId: survey._id,
        studentId: new Types.ObjectId(user.id),
      }).lean();
      hasResponded = Boolean(resp);
    }

    res.json({
      id: survey._id.toString(),
      title: survey.title,
      description: survey.description,
      type: survey.type,
      department: survey.department,
      courseName: survey.courseName,
      courseCode: survey.courseCode,
      academicYear: survey.academicYear,
      author: {
        id: survey.author?.id ? survey.author.id.toString() : '',
        name: survey.author?.name || 'Faculty Member',
        role: (survey.author?.role as any) || 'FACULTY',
        department: survey.author?.department,
        facultyRole: survey.author?.facultyRole,
      },
      questions: survey.questions,
      status: survey.status,
      isAnonymous: survey.isAnonymous,
      endDate: survey.endDate.toISOString(),
      totalResponses: survey.totalResponses,
      hasResponded,
      createdAt: survey.createdAt.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to retrieve survey' });
  }
});

// 4. POST /api/surveys/:id/respond - Submit answers as a student
surveyRouter.post('/:id/respond', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    if (user.role !== 'STUDENT') {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Only students can submit survey evaluations' });
      return;
    }

    const survey = await Survey.findById(req.params.id);
    if (!survey || survey.instituteId.toString() !== user.instituteId) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Survey not found' });
      return;
    }

    if (survey.status !== 'ACTIVE' || new Date(survey.endDate) < new Date()) {
      res.status(400).json({ error: 'SURVEY_CLOSED', message: 'This survey is closed or deadline has passed' });
      return;
    }

    // Check duplicate
    const existing = await SurveyResponse.findOne({
      surveyId: survey._id,
      studentId: new Types.ObjectId(user.id),
    });
    if (existing) {
      res.status(409).json({ error: 'ALREADY_SUBMITTED', message: 'You have already submitted this survey' });
      return;
    }

    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Survey answers array is required' });
      return;
    }

    // Validate required questions
    for (const q of survey.questions) {
      if (q.required) {
        const provided = answers.find((a: any) => a.questionId === q.id);
        if (!provided) {
          res.status(400).json({ error: 'VALIDATION_ERROR', message: `Please answer required question: "${q.text}"` });
          return;
        }
        if (q.type === 'RATING_5' && (typeof provided.ratingValue !== 'number' || provided.ratingValue < 1 || provided.ratingValue > 5)) {
          res.status(400).json({ error: 'VALIDATION_ERROR', message: `Rating between 1 and 5 required for: "${q.text}"` });
          return;
        }
      }
    }

    const formattedAnswers = answers.map((a: any) => ({
      questionId: a.questionId,
      ratingValue: a.ratingValue ? Math.min(5, Math.max(1, Number(a.ratingValue))) : undefined,
      textValue: a.textValue?.trim() || undefined,
      selectedOptions: Array.isArray(a.selectedOptions) ? a.selectedOptions : undefined,
    }));

    await SurveyResponse.create({
      surveyId: survey._id,
      studentId: new Types.ObjectId(user.id),
      instituteId: new Types.ObjectId(user.instituteId),
      answers: formattedAnswers,
      isAnonymous: survey.isAnonymous,
    });

    // Increment count atomically
    survey.totalResponses += 1;
    await survey.save();

    res.status(201).json({
      message: 'Survey response submitted successfully. Thank you for your feedback!',
      totalResponses: survey.totalResponses,
    });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: 'ALREADY_SUBMITTED', message: 'You have already submitted this survey' });
      return;
    }
    console.error('Submit survey response error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'Failed to submit response' });
  }
});

// 5. GET /api/surveys/:id/analytics - Comprehensive CO Attainment & response analytics
surveyRouter.get('/:id/analytics', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const survey = await Survey.findById(req.params.id).lean();
    if (!survey || survey.instituteId.toString() !== user.instituteId) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Survey not found' });
      return;
    }

    // Permission: author, HoD of department, or Admin
    const isAuthor = survey.author.id.toString() === user.id;
    const isDeptHod = user.role === 'FACULTY' && user.facultyRole === 'HOD' && user.department === survey.department;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (!isAuthor && !isDeptHod && !isAdmin) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Only course instructor, HoD, or Admin can inspect survey analytics' });
      return;
    }

    const responses = await SurveyResponse.find({ surveyId: survey._id }).lean();
    const totalResponses = responses.length;

    // Process questions
    const coAttainmentList: COAttainmentItem[] = [];
    const questionStatsList: any[] = [];

    let totalCoPercentageSum = 0;
    let coCount = 0;

    for (const q of survey.questions) {
      if (q.type === 'RATING_5') {
        let ratingSum = 0;
        let ratingCount = 0;
        const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        for (const resp of responses) {
          const ans = resp.answers.find((a) => a.questionId === q.id);
          if (ans && typeof ans.ratingValue === 'number') {
            ratingSum += ans.ratingValue;
            ratingCount += 1;
            distribution[ans.ratingValue] = (distribution[ans.ratingValue] || 0) + 1;
          }
        }

        const avgRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : 0;
        const percentage = Number(((avgRating / 5) * 100).toFixed(1));
        const level: 'HIGH' | 'MODERATE' | 'LOW' =
          percentage >= 75 ? 'HIGH' : percentage >= 60 ? 'MODERATE' : 'LOW';

        questionStatsList.push({
          questionId: q.id,
          text: q.text,
          type: q.type,
          coTag: q.coTag,
          averageRating: avgRating,
          responseCount: ratingCount,
          distribution,
        });

        if (q.coTag) {
          coAttainmentList.push({
            coTag: q.coTag,
            questionText: q.text,
            averageRating: avgRating,
            percentage,
            responseCount: ratingCount,
            level,
          });
          totalCoPercentageSum += percentage;
          coCount += 1;
        }
      } else if (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') {
        const optionCounts: Record<string, number> = {};
        if (q.options) {
          q.options.forEach((opt) => {
            optionCounts[opt] = 0;
          });
        }

        for (const resp of responses) {
          const ans = resp.answers.find((a) => a.questionId === q.id);
          if (ans?.selectedOptions) {
            for (const sel of ans.selectedOptions) {
              optionCounts[sel] = (optionCounts[sel] || 0) + 1;
            }
          }
        }

        questionStatsList.push({
          questionId: q.id,
          text: q.text,
          type: q.type,
          optionCounts,
        });
      } else if (q.type === 'TEXT') {
        const textResponses: string[] = [];
        for (const resp of responses) {
          const ans = resp.answers.find((a) => a.questionId === q.id);
          if (ans?.textValue && ans.textValue.trim().length > 0) {
            textResponses.push(ans.textValue.trim());
          }
        }

        questionStatsList.push({
          questionId: q.id,
          text: q.text,
          type: q.type,
          textResponses,
        });
      }
    }

    const overallAttainmentPercentage =
      coCount > 0 ? Number((totalCoPercentageSum / coCount).toFixed(1)) : 0;

    const analyticsDTO: SurveyAnalyticsDTO = {
      survey: {
        id: survey._id.toString(),
        title: survey.title,
        description: survey.description,
        type: survey.type,
        department: survey.department,
        courseName: survey.courseName,
        courseCode: survey.courseCode,
        academicYear: survey.academicYear,
        semester: survey.semester,
        author: {
          id: survey.author?.id ? survey.author.id.toString() : '',
          name: survey.author?.name || 'Faculty Member',
          role: (survey.author?.role as any) || 'FACULTY',
          department: survey.author?.department,
          facultyRole: survey.author?.facultyRole,
        },
        questions: survey.questions,
        status: survey.status,
        isAnonymous: survey.isAnonymous,
        endDate: survey.endDate.toISOString(),
        totalResponses,
        createdAt: survey.createdAt.toISOString(),
        updatedAt: survey.updatedAt.toISOString(),
      },
      totalResponses,
      coAttainment: coAttainmentList,
      overallAttainmentPercentage,
      questionStats: questionStatsList,
    };

    res.json(analyticsDTO);
  } catch (err: any) {
    console.error('Fetch survey analytics error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to compute survey analytics' });
  }
});

// 6. PATCH /api/surveys/:id/status - Toggle ACTIVE / CLOSED
surveyRouter.patch('/:id/status', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const { status } = req.body;
    if (!['ACTIVE', 'CLOSED'].includes(status)) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Status must be ACTIVE or CLOSED' });
      return;
    }

    const survey = await Survey.findById(req.params.id);
    if (!survey || survey.instituteId.toString() !== user.instituteId) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Survey not found' });
      return;
    }

    const isAuthor = survey.author.id.toString() === user.id;
    const isDeptHod = user.role === 'FACULTY' && user.facultyRole === 'HOD' && user.department === survey.department;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (!isAuthor && !isDeptHod && !isAdmin) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Unauthorized to change survey status' });
      return;
    }

    survey.status = status;
    await survey.save();

    res.json({ message: `Survey marked as ${status.toLowerCase()}`, status: survey.status });
  } catch (err: any) {
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to update survey status' });
  }
});
