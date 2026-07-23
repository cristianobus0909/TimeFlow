import { Schema, model, Document, Types } from 'mongoose';

export interface ITimeSession extends Document {
  userId: Types.ObjectId;
  taskId: Types.ObjectId;
  projectId?: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  notes?: string;
  device: 'desktop' | 'tablet' | 'mobile';
  createdAt: Date;
  updatedAt: Date;
}

const TimeSessionSchema = new Schema<ITimeSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true }, // duration in seconds
    notes: { type: String, default: '' },
    device: { type: String, enum: ['desktop', 'tablet', 'mobile'], default: 'desktop' },
  },
  { timestamps: true }
);

TimeSessionSchema.index({ userId: 1, taskId: 1 });
TimeSessionSchema.index({ userId: 1, createdAt: -1 });

export const TimeSession = model<ITimeSession>('TimeSession', TimeSessionSchema);
