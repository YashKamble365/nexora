import { Schema, model, Document, Types } from 'mongoose';
import { NoticePriority, NoticeCategory, NoticeStatus, Role } from '@nexora/types';

export interface INoticeDocument extends Document {
  title: string;
  content: string;
  summary: string;
  priority: NoticePriority;
  category: NoticeCategory;
  status: NoticeStatus;
  targetAudience: {
    roles: Role[];
    departments: string[];
    academicYears?: string[];
  };
  author: {
    id: Types.ObjectId;
    name: string;
    role: Role;
    department: string;
  };
  attachments?: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }[];
  publishedAt?: Date;
  expiresAt?: Date;
  instituteId?: Types.ObjectId;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INoticeDocument>(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', index: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    summary: { type: String, required: true },
    priority: {
      type: String,
      required: true,
      enum: ['NORMAL', 'IMPORTANT', 'HIGH', 'CRITICAL', 'URGENT'],
      default: 'NORMAL',
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['ACADEMIC', 'ADMINISTRATIVE', 'EXAMINATION', 'PLACEMENT', 'SPORTS', 'URGENT'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true,
    },
    targetAudience: {
      roles: [{ type: String, enum: ['STUDENT', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'] }],
      departments: [{ type: String }],
      academicYears: [{ type: String }],
    },
    author: {
      id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      department: { type: String, required: true },
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number, required: true },
        mimeType: { type: String, required: true },
      },
    ],
    publishedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
  }
);

// High throughput compound queries for target audience and published notices
NoticeSchema.index({ status: 1, publishedAt: -1 });
NoticeSchema.index({ 'targetAudience.departments': 1, status: 1 });
NoticeSchema.index({ category: 1, priority: 1, publishedAt: -1 });

export const Notice = model<INoticeDocument>('Notice', NoticeSchema);
