import { Schema, model, Document, Types } from 'mongoose';
import { AcademicFileCategory, Role } from '@nexora/types';

export interface IAcademicFileDocument extends Document {
  title: string;
  description?: string;
  category: AcademicFileCategory;
  department: string;
  academicYear?: string;
  semester?: string;
  subjectCode?: string;
  subjectName?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  publicId?: string;
  downloadsCount: number;
  uploadedBy: {
    id: Types.ObjectId;
    name: string;
    role: Role;
  };
  instituteId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AcademicFileSchema = new Schema<IAcademicFileDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['SYLLABUS', 'LECTURE_NOTES', 'LAB_MANUAL', 'PYQ_PAPERS', 'PROJECT_GUIDELINES', 'OTHER'],
      index: true,
    },
    department: { type: String, required: true, index: true },
    academicYear: { type: String, index: true },
    semester: { type: String, index: true },
    subjectCode: { type: String, trim: true },
    subjectName: { type: String, trim: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    publicId: { type: String },
    downloadsCount: { type: Number, default: 0 },
    uploadedBy: {
      id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
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

AcademicFileSchema.index({ instituteId: 1, department: 1, category: 1 });
AcademicFileSchema.index({ instituteId: 1, createdAt: -1 });

export const AcademicFile = model<IAcademicFileDocument>('AcademicFile', AcademicFileSchema);
