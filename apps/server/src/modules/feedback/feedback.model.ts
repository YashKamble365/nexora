import { Schema, model, Document, Types } from 'mongoose';
import { Role } from '@nexora/types';

export interface IFeedbackDocument extends Document {
  instituteId: Types.ObjectId;
  facultyId: Types.ObjectId;
  facultyName: string;
  courseName: string;
  department: string;
  academicYear: string;
  rating: number;
  clarity: number;
  pace: number;
  comments?: string;
  isAnonymous: boolean;
  submittedBy?: {
    id: Types.ObjectId;
    name: string;
    role: Role;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedbackDocument>(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    facultyId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    facultyName: { type: String, required: true },
    courseName: { type: String, required: true, trim: true },
    department: { type: String, required: true, index: true },
    academicYear: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    clarity: { type: Number, required: true, min: 1, max: 5 },
    pace: { type: Number, required: true, min: 1, max: 5 },
    comments: { type: String, trim: true },
    isAnonymous: { type: Boolean, default: true },
    submittedBy: {
      id: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
      role: { type: String },
    },
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

FeedbackSchema.index({ instituteId: 1, facultyId: 1, createdAt: -1 });

export const Feedback = model<IFeedbackDocument>('Feedback', FeedbackSchema);
