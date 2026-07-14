import { Schema, model, Document, Types } from 'mongoose';

export interface IProject extends Document {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'planning' | 'in_progress' | 'completed' | 'paused';
  client?: string;
  startDate?: Date;
  endDate?: Date;
  estimatedDuration: number;   // in seconds (sum of estimated tasks)
  accumulatedDuration: number; // in seconds (actual tracked time)
  remainingDuration: number;   // in seconds
  completionPercentage: number;
  breaksDuration: number;      // in seconds
  deadTimeDuration: number;    // in seconds
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    color: { type: String, default: '#10B981' }, // default green
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['planning', 'in_progress', 'completed', 'paused'], default: 'planning' },
    client: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    estimatedDuration: { type: Number, default: 0 },
    accumulatedDuration: { type: Number, default: 0 },
    remainingDuration: { type: Number, default: 0 },
    completionPercentage: { type: Number, default: 0 },
    breaksDuration: { type: Number, default: 0 },
    deadTimeDuration: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Project = model<IProject>('Project', ProjectSchema);
