import { Schema, model, Document, Types } from 'mongoose';
import { ComplaintStatus, ComplaintPriority, ComplaintCategory, Role } from '@nexora/types';

export interface IComplaintTimelineDocument {
  status: ComplaintStatus;
  actor: {
    id: Types.ObjectId;
    name: string;
    role: Role;
  };
  note?: string;
  createdAt: Date;
}

export interface IComplaintDocument extends Document {
  ticketNumber: string;
  instituteId: Types.ObjectId;
  subject: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  isAnonymous: boolean;
  submittedBy?: {
    id: Types.ObjectId;
    name: string;
    department: string;
  };
  department: string;
  location?: string;
  assignedTo?: {
    id: Types.ObjectId;
    name: string;
    role: Role;
  };
  attachments?: {
    name: string;
    url: string;
    size: number;
    mimeType?: string;
    publicId?: string;
  }[];
  timeline: IComplaintTimelineDocument[];
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineItemSchema = new Schema<IComplaintTimelineDocument>({
  status: {
    type: String,
    required: true,
    enum: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'],
  },
  actor: {
    id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ComplaintSchema = new Schema<IComplaintDocument>(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['ACADEMIC', 'INFRASTRUCTURE', 'HOSTEL', 'HARASSMENT', 'ADMINISTRATIVE', 'OTHER'],
      index: true,
    },
    priority: {
      type: String,
      required: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'],
      default: 'SUBMITTED',
      index: true,
    },
    isAnonymous: { type: Boolean, default: false },
    submittedBy: {
      id: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      department: { type: String },
    },
    department: { type: String, required: true, index: true },
    location: { type: String },
    assignedTo: {
      id: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      role: { type: String },
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number, required: true },
        mimeType: { type: String },
        publicId: { type: String },
      },
    ],
    timeline: [TimelineItemSchema],
    resolvedAt: { type: Date },
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

// Multi-tenant indexes for rapid triage, department queues, and student tracking
ComplaintSchema.index({ instituteId: 1, status: 1, department: 1, createdAt: -1 });
ComplaintSchema.index({ instituteId: 1, 'submittedBy.id': 1, createdAt: -1 });
ComplaintSchema.index({ instituteId: 1, 'assignedTo.id': 1, status: 1 });
ComplaintSchema.index({ instituteId: 1, ticketNumber: 1 });

export const Complaint = model<IComplaintDocument>('Complaint', ComplaintSchema);
