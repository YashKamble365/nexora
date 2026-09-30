import { Router, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Poll, Vote } from './poll.model.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { dispatchAudienceNotification } from '../notifications/notification.service.js';

export const pollRouter = Router();

// 1. GET /api/polls - Scoped & Audience-Targeted Polls List
pollRouter.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User does not belong to an institute' });
      return;
    }

    const { status } = req.query;
    const now = new Date();

    const query: any = {
      instituteId: new Types.ObjectId(user.instituteId),
    };

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const polls = await Poll.find(query).sort({ createdAt: -1 }).lean();

    // Auto-update expired polls
    const updatedPolls = await Promise.all(
      polls.map(async (p: any) => {
        if (p.status === 'ACTIVE' && new Date(p.endDate) < now) {
          await Poll.findByIdAndUpdate(p._id, { status: 'CLOSED' });
          p.status = 'CLOSED';
        }
        return p;
      })
    );

    // Filter by target audience eligibility if student/faculty
    const eligiblePolls = updatedPolls.filter((p: any) => {
      const authorId = p.author?.id ? p.author.id.toString() : (p.author?._id ? p.author._id.toString() : '');
      const isAuthor = Boolean(authorId && authorId === user.id);
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
      const isFaculty = user.role === 'FACULTY';

      // Authors and Admins are always eligible to view and inspect their campus polls
      if (isAuthor || isAdmin) {
        return true;
      }

      // Faculty can view polls created within their department or institute-wide
      if (isFaculty) {
        const targetDepts = p.targetAudience?.departments;
        if (!targetDepts || targetDepts.length === 0 || targetDepts.includes(user.department)) {
          return true;
        }
      }

      const audience = p.targetAudience;
      if (!audience) return true;

      // Check role
      if (audience.roles && audience.roles.length > 0 && !audience.roles.includes(user.role)) {
        return false;
      }

      // Check department
      if (audience.departments && audience.departments.length > 0 && !audience.departments.includes(user.department)) {
        return false;
      }

      // Check academic year (if applicable for students)
      if (user.role === 'STUDENT' && audience.academicYears && audience.academicYears.length > 0) {
        if (!user.academicYear || !audience.academicYears.includes(user.academicYear)) {
          return false;
        }
      }

      return true;
    });

    // Check user vote status for all eligible polls
    const pollIds = eligiblePolls.map((p: any) => p._id);
    const userVotes = await Vote.find({
      userId: new Types.ObjectId(user.id),
      pollId: { $in: pollIds },
    }).lean();

    const voteMap = new Map<string, string[]>();
    userVotes.forEach((v: any) => {
      voteMap.set(v.pollId.toString(), v.selectedOptionIds);
    });

    const dtos = eligiblePolls.map((p: any) => {
      const selectedOptionIds = voteMap.get(p._id.toString());
      return {
        id: p._id.toString(),
        title: p.title,
        description: p.description,
        options: p.options || [],
        targetAudience: p.targetAudience,
        isAnonymous: p.isAnonymous,
        allowMultipleChoices: p.allowMultipleChoices,
        status: p.status,
        startDate: p.startDate?.toISOString(),
        endDate: p.endDate?.toISOString(),
        author: {
          id: p.author?.id ? p.author.id.toString() : (p.author?._id ? p.author._id.toString() : ''),
          name: p.author?.name || 'Faculty',
          role: p.author?.role || 'FACULTY',
          department: p.author?.department,
        },
        instituteId: p.instituteId.toString(),
        totalVotes: p.totalVotes || 0,
        hasVoted: Boolean(selectedOptionIds),
        userSelectedOptionIds: selectedOptionIds || [],
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    res.json(dtos);
  } catch (err: any) {
    console.error('Fetch polls error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to fetch campus polls' });
  }
});

// 2. POST /api/polls - Create New Targeted Poll (Faculty & Admin)
pollRouter.post(
  '/',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const {
        title,
        description,
        options,
        targetAudience,
        isAnonymous = true,
        allowMultipleChoices = false,
        endDate,
      } = req.body;

      if (!title || !options || !Array.isArray(options) || options.length < 2) {
        res.status(400).json({ error: 'Title and at least two options are required' });
        return;
      }

      if (!endDate) {
        res.status(400).json({ error: 'End date deadline is required' });
        return;
      }

      const formattedOptions = options.map((opt: any, idx: number) => ({
        id: opt.id || `opt_${idx + 1}`,
        text: typeof opt === 'string' ? opt.trim() : opt.text.trim(),
        voteCount: 0,
      }));

      const poll = await Poll.create({
        title: title.trim(),
        description: description?.trim(),
        options: formattedOptions,
        targetAudience: targetAudience || {
          roles: ['STUDENT'],
          departments: [user.department],
        },
        isAnonymous: Boolean(isAnonymous),
        allowMultipleChoices: Boolean(allowMultipleChoices),
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(endDate),
        author: {
          id: new Types.ObjectId(user.id),
          name: user.name,
          role: user.role,
          department: user.department,
        },
        instituteId: new Types.ObjectId(user.instituteId),
        totalVotes: 0,
      });

      if (poll.instituteId) {
        dispatchAudienceNotification({
          instituteId: poll.instituteId.toString(),
          roles: (poll.targetAudience?.roles as any) || ['STUDENT', 'FACULTY'],
          departments: poll.targetAudience?.departments,
          academicYears: poll.targetAudience?.academicYears,
          excludeUserId: user.id,
          title: `New Poll: ${poll.title}`,
          message: poll.description || 'Cast your vote in campus decision-making',
          type: 'POLL',
          link: '/app/polls',
        }).catch((err) => console.error('Poll notification error:', err));
      }

      res.status(201).json({
        message: 'Poll published successfully',
        poll: {
          ...poll.toJSON(),
          id: poll._id.toString(),
        },
      });
    } catch (err: any) {
      console.error('Create poll error:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: err.message || 'Failed to create poll' });
    }
  }
);

// 3. POST /api/polls/:id/vote - Cast Vote with Anti-Fraud Duplicate Protection
pollRouter.post('/:id/vote', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user || !user.instituteId) {
      res.status(401).json({ error: 'UNAUTHORIZED' });
      return;
    }

    const { id } = req.params;
    const { selectedOptionIds } = req.body;

    if (!selectedOptionIds || !Array.isArray(selectedOptionIds) || selectedOptionIds.length === 0) {
      res.status(400).json({ error: 'Please select an option to vote' });
      return;
    }

    const poll = await Poll.findOne({
      _id: id,
      instituteId: new Types.ObjectId(user.instituteId),
    });

    if (!poll) {
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    if (poll.status === 'CLOSED' || new Date(poll.endDate) < new Date()) {
      res.status(400).json({ error: 'This poll has concluded and is closed for voting.' });
      return;
    }

    if (!poll.allowMultipleChoices && selectedOptionIds.length > 1) {
      res.status(400).json({ error: 'This poll allows only a single choice selection.' });
      return;
    }

    // Check duplicate vote prevention via unique compound index
    const existingVote = await Vote.findOne({
      pollId: poll._id,
      userId: new Types.ObjectId(user.id),
    });

    if (existingVote) {
      res.status(409).json({ error: 'You have already cast your vote on this poll.' });
      return;
    }

    // Create Vote record
    await Vote.create({
      pollId: poll._id,
      userId: new Types.ObjectId(user.id),
      selectedOptionIds,
      instituteId: new Types.ObjectId(user.instituteId),
    });

    // Increment voteCount for chosen options
    selectedOptionIds.forEach((optId: string) => {
      const match = poll.options.find((o) => o.id === optId);
      if (match) {
        match.voteCount += 1;
      }
    });

    poll.totalVotes += 1;
    await poll.save();

    res.json({
      message: 'Vote registered successfully',
      poll: {
        ...poll.toJSON(),
        id: poll._id.toString(),
        hasVoted: true,
        userSelectedOptionIds: selectedOptionIds,
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: 'Duplicate vote detected. Exactly 1 vote allowed per student.' });
      return;
    }
    console.error('Vote error:', err);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to record vote' });
  }
});

// 4. PATCH /api/polls/:id/close - Close Poll Manually
pollRouter.patch(
  '/:id/close',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const { id } = req.params;

      const poll = await Poll.findOne({
        _id: id,
        instituteId: new Types.ObjectId(user.instituteId),
      });

      if (!poll) {
        res.status(404).json({ error: 'Poll not found' });
        return;
      }

      poll.status = 'CLOSED';
      await poll.save();

      res.json({ message: 'Poll closed successfully', status: 'CLOSED' });
    } catch (err: any) {
      console.error('Close poll error:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to close poll' });
    }
  }
);

// 5. DELETE /api/polls/:id - Delete Poll
pollRouter.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN', 'SUPER_ADMIN', 'FACULTY'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const id = req.params.id as string;

      await Poll.findOneAndDelete({
        _id: id,
        instituteId: new Types.ObjectId(user.instituteId),
      });

      await Vote.deleteMany({ pollId: new Types.ObjectId(id) });


      res.json({ message: 'Poll and associated vote tallies deleted' });
    } catch (err: any) {
      console.error('Delete poll error:', err);
      res.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete poll' });
    }
  }
);
