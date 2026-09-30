import { Schema, model, Document, Types } from 'mongoose';
import { InstituteStatus } from '@nexora/types';

export interface IDepartmentSubject {
  _id?: Types.ObjectId;
  department: string;
  name: string;
  code?: string;
  academicYear: string;
  semester: string;
  addedBy?: Types.ObjectId;
  createdAt?: Date;
}

export interface IInstituteDocument extends Document {
  name: string;
  code: string;
  domain?: string;
  address?: string;
  status: InstituteStatus;
  departments: string[];
  academicYears: string[];
  semesters: string[];
  departmentSubjects?: IDepartmentSubject[];
  adminUserId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InstituteSchema = new Schema<IInstituteDocument>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    domain: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    status: {
      type: String,
      required: true,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    departments: {
      type: [String],
      default: [
        'Computer Science & Engineering',
        'Information Technology',
        'Artificial Intelligence & Data Science',
        'Electronics & Telecommunication',
        'Mechanical Engineering',
        'Civil Engineering',
      ],
    },
    academicYears: {
      type: [String],
      default: ['First Year', 'Second Year', 'Third Year', 'Final Year'],
    },
    semesters: {
      type: [String],
      default: [
        'Semester 1',
        'Semester 2',
        'Semester 3',
        'Semester 4',
        'Semester 5',
        'Semester 6',
        'Semester 7',
        'Semester 8',
      ],
    },
    departmentSubjects: [
      {
        department: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        code: { type: String, trim: true, uppercase: true },
        academicYear: { type: String, required: true },
        semester: { type: String, required: true },
        addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    adminUserId: { type: Schema.Types.ObjectId, ref: 'User' },
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

InstituteSchema.index({ name: 'text', code: 'text' });

export const Institute = model<IInstituteDocument>('Institute', InstituteSchema);
