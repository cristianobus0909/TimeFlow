import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  message: string;
  read: boolean;
  type: 'system' | 'billing' | 'timer';
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ['system', 'billing', 'timer'], default: 'system' },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1 });

export const Notification = model<INotification>('Notification', NotificationSchema);
