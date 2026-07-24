import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface ITask extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  project?: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  userId: Types.ObjectId; // Keep for legacy compatibility
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
  category?: Types.ObjectId | string; // Mixed for migration compatibility (ObjectId or legacy string)
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedHours?: number;
  tags?: string[];
  favorite: boolean;
  totalDuration: number;
  averageDuration: number;
  sessionsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Legacy compatibility
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived', 'TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'ARCHIVED'],
      default: 'TODO',
    },
    category: { type: Schema.Types.Mixed }, // String or ObjectId reference
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    estimatedHours: { type: Number, min: 0 },
    tags: [{ type: String, trim: true }],
    favorite: { type: Boolean, default: false },
    totalDuration: { type: Number, default: 0 },
    averageDuration: { type: Number, default: 0 },
    sessionsCount: { type: Number, default: 0 },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
TaskSchema.plugin(softDeletePlugin);

// Create indexes
TaskSchema.index({ organization: 1, project: 1, assignedTo: 1, status: 1, isDeleted: 1 });

export const Task = model<ITask>('Task', TaskSchema);
export default Task;
