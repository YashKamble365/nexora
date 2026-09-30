import { Schema, model, Document, Types } from 'mongoose';
import { Role } from '@nexora/types';

export interface IEmergencyAlertDocument extends Document {
  title: string;
  message: string;
  severity: 'WARNING' | 'CRITICAL' | 'EVACUATION';
  affectedAreas: string[];
  actionRequired: string;
  issuedBy: {
    id: Types.ObjectId;
    name: string;
    role: Role;
  };
  instituteId: Types.ObjectId;
  isActive: boolean;
  expiresAt: Date;
  resolvedAt?: Date;
  resolvedBy?: {
    id: Types.ObjectId;
    name: string;
  };
  resolutionNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyAlertSchema = new Schema<IEmergencyAlertDocument>(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    severity: {
      type: String,
      required: true,
      enum: ['WARNING', 'CRITICAL', 'EVACUATION'],
      default: 'WARNING',
      index: true,
    },
    affectedAreas: [{ type: String, required: true }],
    actionRequired: { type: String, required: true, trim: true },
    issuedBy: {
      id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
    },
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    resolvedAt: { type: Date },
    resolvedBy: {
      id: { type: Schema.Types.ObjectId, ref: 'User' },
      name: { type: String },
    },
    resolutionNote: { type: String },
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

EmergencyAlertSchema.index({ instituteId: 1, isActive: 1, createdAt: -1 });

export const EmergencyAlert = model<IEmergencyAlertDocument>('EmergencyAlert', EmergencyAlertSchema);
