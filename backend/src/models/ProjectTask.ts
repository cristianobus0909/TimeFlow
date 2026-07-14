import { Schema, model, Document, Types } from 'mongoose';

export interface IProjectTask extends Document {
  projectId: Types.ObjectId;
  taskId: Types.ObjectId;
  order: number;
  status: 'pending' | 'completed';
  actualDuration: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const ProjectTaskSchema = new Schema<IProjectTask>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    order: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    actualDuration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index for unique order of tasks inside a project
ProjectTaskSchema.index({ projectId: 1, order: 1 });

export const ProjectTask = model<IProjectTask>('ProjectTask', ProjectTaskSchema);
