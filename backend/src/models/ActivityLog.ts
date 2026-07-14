import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  userId: Types.ObjectId;
  action: string;
  details: Schema.Types.Mixed;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true } // keeping timestamps for consistency, although createdAt is main
);

ActivityLogSchema.index({ userId: 1, createdAt: -1 });

export const ActivityLog = model<IActivityLog>('ActivityLog', ActivityLogSchema);
