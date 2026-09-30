import { Schema, model, Document, Types } from 'mongoose';
import { ConversationType, ChannelScope, ConversationStatus, GroupAccessMode } from '@nexora/types';

export interface IConversationDocument extends Document {
  type: ConversationType;
  name?: string;
  description?: string;
  scope?: ChannelScope;
  department?: string;
  academicYear?: string;
  semester?: string;
  subjectName?: string;
  instituteId: Types.ObjectId;
  participants: Types.ObjectId[];
  pendingInvites?: Types.ObjectId[];
  creatorId?: Types.ObjectId;
  adminIds?: Types.ObjectId[];
  joinRequests?: Types.ObjectId[];
  accessMode?: GroupAccessMode;
  isDiscoverable?: boolean;
  status: ConversationStatus;
  initiatedBy?: Types.ObjectId;
  isAnnouncementOnly?: boolean;
  lastMessage?: Types.ObjectId;
  pinnedBy?: Types.ObjectId[];
  mutedBy?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversationDocument>(
  {
    type: {
      type: String,
      required: true,
      enum: ['DIRECT', 'CHANNEL'],
      index: true,
    },
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    scope: {
      type: String,
      enum: ['CAMPUS', 'DEPARTMENT', 'BATCH', 'SUBJECT', 'CUSTOM'],
      index: true,
    },
    department: { type: String, index: true },
    academicYear: { type: String, index: true },
    semester: { type: String, index: true },
    subjectName: { type: String, trim: true, index: true },
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    pendingInvites: [{ type: Schema.Types.ObjectId, ref: 'User', index: true }],
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    adminIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    joinRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    accessMode: {
      type: String,
      enum: ['APPROVAL_REQUIRED', 'OPEN', 'INVITE_ONLY'],
      default: 'APPROVAL_REQUIRED',
    },
    isDiscoverable: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'REQUEST_PENDING', 'DECLINED', 'BLOCKED'],
      default: 'ACTIVE',
      index: true,
    },
    initiatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isAnnouncementOnly: { type: Boolean, default: false },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
    pinnedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    mutedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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

// Indexes for fast lookup of a user's conversations within an institute
ConversationSchema.index({ instituteId: 1, type: 1, status: 1 });
ConversationSchema.index({ instituteId: 1, scope: 1, department: 1, academicYear: 1 });
ConversationSchema.index({ participants: 1, updatedAt: -1 });

export const Conversation = model<IConversationDocument>('Conversation', ConversationSchema);
