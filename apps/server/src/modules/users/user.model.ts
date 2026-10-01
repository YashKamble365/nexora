import { Schema, model, Document, Types } from 'mongoose';
import { Role, UserStatus, FacultyRole, TeachingAssignment } from '@nexora/types';
import '../institutes/institute.model.js';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  institutionalId: string;
  department: string;
  academicYear?: string;
  semester?: string;
  degreeProgram?: string;
  division?: string;
  batchSection?: string;
  admissionYear?: string;
  passingYear?: string;
  prnNumber?: string;
  bloodGroup?: string;
  campusRoles?: string[];
  links?: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  instituteId?: Types.ObjectId;
  facultyRole?: FacultyRole;
  coordinatorYear?: string;
  teachingAssignments?: TeachingAssignment[];
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  avatarUrl?: string;
  bio?: string;
  isOnline: boolean;
  privacySettings?: {
    dmPermission: 'ALLOW_ALL' | 'SAME_DEPARTMENT_ONLY' | 'FACULTY_ONLY';
  };
  profileVisibility?: 'PUBLIC' | 'PRIVATE';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['STUDENT', 'FACULTY', 'ADMIN', 'SUPER_ADMIN'],
      default: 'STUDENT',
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'SUSPENDED', 'PENDING', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    institutionalId: { type: String, required: true, trim: true, index: true },
    department: { type: String, required: true, index: true },
    academicYear: { type: String, index: true },
    semester: { type: String, index: true },
    degreeProgram: { type: String, trim: true },
    division: { type: String, trim: true },
    batchSection: { type: String, trim: true },
    admissionYear: { type: String, trim: true },
    passingYear: { type: String, trim: true },
    prnNumber: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    campusRoles: [{ type: String, trim: true }],
    links: {
      github: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      portfolio: { type: String, trim: true },
    },
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', index: true },
    facultyRole: {
      type: String,
      enum: ['HOD', 'CLASS_COORDINATOR', 'PROFESSOR', 'ASSISTANT_PROFESSOR'],
      index: true,
    },
    coordinatorYear: { type: String, index: true },
    teachingAssignments: [
      {
        subjectName: { type: String, required: true, trim: true },
        subjectCode: { type: String, trim: true, uppercase: true },
        department: { type: String, required: true, trim: true },
        academicYear: { type: String, required: true },
        semester: { type: String, required: true },
        division: { type: String, trim: true },
      },
    ],
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    avatarUrl: { type: String },
    bio: { type: String },
    isOnline: { type: Boolean, default: false },
    privacySettings: {
      dmPermission: {
        type: String,
        enum: ['ALLOW_ALL', 'SAME_DEPARTMENT_ONLY', 'FACULTY_ONLY'],
        default: 'ALLOW_ALL',
      },
    },
    profileVisibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE'],
      default: 'PUBLIC',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        (ret as Record<string, unknown>).id = ret._id.toString();
        if (ret.instituteId && typeof ret.instituteId === 'object') {
          if ((ret.instituteId as any).name) {
            (ret as Record<string, unknown>).instituteName = (ret.instituteId as any).name;
          }
          if ((ret.instituteId as any).code) {
            (ret as Record<string, unknown>).instituteCode = (ret.instituteId as any).code;
          }
        }
        delete (ret as Record<string, unknown>)._id;
        delete (ret as Record<string, unknown>).passwordHash;
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

// Compound indexes for coordinator matching and department filtering
UserSchema.index({ instituteId: 1, department: 1, role: 1 });
UserSchema.index({ instituteId: 1, department: 1, academicYear: 1, status: 1 });
UserSchema.index({ instituteId: 1, institutionalId: 1 }, { unique: true });

export const User = model<IUserDocument>('User', UserSchema);
