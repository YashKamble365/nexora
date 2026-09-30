import { Schema, model, Document, Types } from 'mongoose';
import { PollStatus, Role } from '@nexora/types';

export interface IPollOptionDocument {
  id: string;
  text: string;
  voteCount: number;
}

export interface IPollDocument extends Document {
  title: string;
  description?: string;
  options: IPollOptionDocument[];
  targetAudience: {
    roles: Role[];
    departments: string[];
    academicYears?: string[];
  };
  isAnonymous: boolean;
  allowMultipleChoices: boolean;
  status: PollStatus;
  startDate: Date;
  endDate: Date;
  author: {
    id: Types.ObjectId;
    name: string;
    role: Role;
    department?: string;
  };
  instituteId: Types.ObjectId;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const PollOptionSchema = new Schema<IPollOptionDocument>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    voteCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const PollSchema = new Schema<IPollDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    options: [PollOptionSchema],
    targetAudience: {
      roles: [{ type: String, enum: ['STUDENT', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'] }],
      departments: [{ type: String }],
      academicYears: [{ type: String }],
    },
    isAnonymous: { type: Boolean, default: true },
    allowMultipleChoices: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'CLOSED'],
      default: 'ACTIVE',
      index: true,
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true, index: true },
    author: {
      id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      department: { type: String },
    },
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    totalVotes: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        (ret as Record<string, unknown>).id = ret._id.toString();
        delete (ret as Record<string, unknown>)._id;
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

PollSchema.index({ instituteId: 1, status: 1, endDate: -1 });

export const Poll = model<IPollDocument>('Poll', PollSchema);

export interface IVoteDocument extends Document {
  pollId: Types.ObjectId;
  userId: Types.ObjectId;
  selectedOptionIds: string[];
  instituteId: Types.ObjectId;
  createdAt: Date;
}

const VoteSchema = new Schema<IVoteDocument>(
  {
    pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    selectedOptionIds: [{ type: String, required: true }],
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', required: true },
  },
  {
    timestamps: true,
  }
);

// Compound unique index strictly enforces 1 vote per user per poll
VoteSchema.index({ pollId: 1, userId: 1 }, { unique: true });

export const Vote = model<IVoteDocument>('Vote', VoteSchema);
