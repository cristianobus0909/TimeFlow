import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IBreakSegment {
  startTime: Date;
  endTime?: Date;
  duration: number; // In seconds
  type: 'break' | 'dead_time';
  notes?: string;
}

export interface IWorkSession extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  user: Types.ObjectId;
  userId: Types.ObjectId; // Legacy compatibility
  client?: Types.ObjectId;
  project?: Types.ObjectId;
  projectId?: Types.ObjectId; // Legacy compatibility
  task: Types.ObjectId;
  taskId: Types.ObjectId; // Legacy compatibility
  category: Types.ObjectId | string; // Mixed for legacy compatibility
  rate?: Types.ObjectId;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  startTime: Date;
  endTime?: Date;
  duration?: number; // Total raw duration in seconds
  breakDuration: number; // Sum of break times in seconds
  effectiveDuration: number; // raw duration - breakDuration (actual worked seconds)
  billable: boolean;
  hourlyRate?: number;
  totalAmount?: number;
  notes?: string;
  description?: string;
  device?: string;
  isCompleted: boolean; // Legacy compatibility
  status: 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  breaks: IBreakSegment[];
  createdAt: Date;
  updatedAt: Date;
}

const BreakSegmentSchema = new Schema<IBreakSegment>({
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 },
  type: { type: String, enum: ['break', 'dead_time'], default: 'break' },
  notes: { type: String },
});

const WorkSessionSchema = new Schema<IWorkSession>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Legacy
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: false },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: false }, // Legacy
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true }, // Legacy
    category: { type: Schema.Types.Mixed, required: true },
    rate: { type: Schema.Types.ObjectId, ref: 'Rate', required: false },
    complexity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number, default: 0 },
    breakDuration: { type: Number, default: 0 },
    effectiveDuration: { type: Number, default: 0 },
    billable: { type: Boolean, default: true },
    hourlyRate: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
    notes: { type: String },
    description: { type: String },
    device: { type: String },
    isCompleted: { type: Boolean, default: false }, // Legacy
    status: {
      type: String,
      enum: ['RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED'],
      default: 'RUNNING',
    },
    breaks: [BreakSegmentSchema],
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
WorkSessionSchema.plugin(softDeletePlugin);

// Create indexes
WorkSessionSchema.index({ organization: 1, user: 1, startTime: 1, status: 1, isDeleted: 1 });
WorkSessionSchema.index({ project: 1, isDeleted: 1 });
WorkSessionSchema.index({ task: 1, isDeleted: 1 });

export const WorkSession = model<IWorkSession>('WorkSession', WorkSessionSchema);
export default WorkSession;
