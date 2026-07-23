import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  category?: string;
  color?: string;
  icon?: string;
  status: 'active' | 'archived';
  favorite: boolean;
  averageDuration: number; // in seconds (weighted average)
  minDuration: number;     // in seconds
  maxDuration: number;     // in seconds
  totalDuration: number;   // in seconds
  executionCount: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'General' },
    color: { type: String, default: '#7C3AED' }, // default purple
    icon: { type: String, default: 'Clock' },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    favorite: { type: Boolean, default: false },
    averageDuration: { type: Number, default: 0 },
    minDuration: { type: Number, default: 0 },
    maxDuration: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 },
    executionCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Index to find tasks for user quickly
TaskSchema.index({ userId: 1, favorite: -1 });

export const Task = model<ITask>('Task', TaskSchema);
