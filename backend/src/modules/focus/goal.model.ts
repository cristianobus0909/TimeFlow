import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IGoal extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  user: Types.ObjectId;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  targetHours: number;
  targetAmount: number;
  targetSessions: number;
  targetTasks: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY'], required: true },
    targetHours: { type: Number, required: true, min: 0, default: 0 },
    targetAmount: { type: Number, required: true, min: 0, default: 0 },
    targetSessions: { type: Number, required: true, min: 0, default: 0 },
    targetTasks: { type: Number, required: true, min: 0, default: 0 },
    date: { type: Date, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete
GoalSchema.plugin(softDeletePlugin);

// Compound index for uniqueness: only one goal type per user per date range/period
GoalSchema.index({ user: 1, period: 1, date: 1, isDeleted: 1 }, { unique: true });

export const Goal = model<IGoal>('Goal', GoalSchema);
export default Goal;
