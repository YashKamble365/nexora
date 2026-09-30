import { Schema, model, Document, Types } from 'mongoose';
import { SurveyType, SurveyQuestionType, Role } from '@nexora/types';

export interface ISurveyQuestionDocument {
  id: string;
  text: string;
  type: SurveyQuestionType;
  coTag?: string;
  options?: string[];
  required: boolean;
}

export interface ISurveyDocument extends Document {
  instituteId: Types.ObjectId;
  title: string;
  description?: string;
  type: SurveyType;
  department: string;
  courseName?: string;
  courseCode?: string;
  academicYear: string;
  semester: string;
  author: {
    id: Types.ObjectId;
    name: string;
    role: Role;
    department?: string;
    facultyRole?: string;
  };
  questions: ISurveyQuestionDocument[];
  status: 'ACTIVE' | 'CLOSED' | 'DRAFT';
  isAnonymous: boolean;
  endDate: Date;
  totalResponses: number;
  createdAt: Date;
  updatedAt: Date;
}

const SurveyQuestionSchema = new Schema<ISurveyQuestionDocument>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['RATING_5', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT'],
      required: true,
    },
    coTag: { type: String, trim: true },
    options: [{ type: String, trim: true }],
    required: { type: Boolean, default: true },
  },
  { _id: false }
);

const SurveySchema = new Schema<ISurveyDocument>(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ['COURSE_EXIT', 'GENERAL_ACADEMIC', 'FACULTY_EVALUATION', 'FACILITY_FEEDBACK'],
      default: 'COURSE_EXIT',
      index: true,
    },
    department: { type: String, required: true, index: true },
    courseName: { type: String, trim: true },
    courseCode: { type: String, trim: true },
    academicYear: { type: String, required: true },
    semester: { type: String, required: true },
    author: {
      id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      department: { type: String },
      facultyRole: { type: String },
    },
    questions: [SurveyQuestionSchema],
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED', 'DRAFT'],
      default: 'ACTIVE',
      index: true,
    },
    isAnonymous: { type: Boolean, default: true },
    endDate: { type: Date, required: true, index: true },
    totalResponses: { type: Number, default: 0 },
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

SurveySchema.index({ instituteId: 1, department: 1, status: 1 });

export const Survey = model<ISurveyDocument>('Survey', SurveySchema);

export interface ISurveyAnswerDocument {
  questionId: string;
  ratingValue?: number;
  textValue?: string;
  selectedOptions?: string[];
}

export interface ISurveyResponseDocument extends Document {
  surveyId: Types.ObjectId;
  studentId: Types.ObjectId;
  instituteId: Types.ObjectId;
  answers: ISurveyAnswerDocument[];
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SurveyAnswerSchema = new Schema<ISurveyAnswerDocument>(
  {
    questionId: { type: String, required: true },
    ratingValue: { type: Number, min: 1, max: 5 },
    textValue: { type: String, trim: true },
    selectedOptions: [{ type: String }],
  },
  { _id: false }
);

const SurveyResponseSchema = new Schema<ISurveyResponseDocument>(
  {
    surveyId: { type: Schema.Types.ObjectId, ref: 'Survey', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    answers: [SurveyAnswerSchema],
    isAnonymous: { type: Boolean, default: true },
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

// Enforce single response per student per survey
SurveyResponseSchema.index({ surveyId: 1, studentId: 1 }, { unique: true });

export const SurveyResponse = model<ISurveyResponseDocument>('SurveyResponse', SurveyResponseSchema);
