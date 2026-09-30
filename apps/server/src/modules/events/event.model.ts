import { Schema, model, Document, Types } from 'mongoose';

export interface IEventDocument extends Document {
  instituteId?: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  capacity: number;
  registeredUsers: Types.ObjectId[];
  organizer: {
    id: Types.ObjectId;
    name: string;
    department: string;
  };
  status: 'DRAFT' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEventDocument>(
  {
    instituteId: { type: Schema.Types.ObjectId, ref: 'Institute', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    venue: { type: String, required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    registeredUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    organizer: {
      id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, required: true },
      department: { type: String, default: 'Campus Administration' },
    },
    status: {
      type: String,
      required: true,
      enum: ['DRAFT', 'UPCOMING', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ status: 1, startDate: 1 });

export const Event = model<IEventDocument>('Event', EventSchema);
