import { Schema, model, Document, Types } from 'mongoose';
import { MessageAttachment } from '@nexora/types';

export interface IMessageDocument extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  attachments?: MessageAttachment[];
  replyTo?: {
    id: Types.ObjectId;
    content: string;
    senderName: string;
  };
  reactions?: {
    emoji: string;
    userId: Types.ObjectId;
  }[];
  readBy: Types.ObjectId[];
  isUnsent?: boolean;
  unsentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, default: '', trim: true },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: Number, required: true },
        mimeType: { type: String, required: true },
        publicId: { type: String },
      },
    ],
    replyTo: {
      id: { type: Schema.Types.ObjectId, ref: 'Message' },
      content: { type: String },
      senderName: { type: String },
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isUnsent: { type: Boolean, default: false },
    unsentAt: { type: Date },
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

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = model<IMessageDocument>('Message', MessageSchema);
