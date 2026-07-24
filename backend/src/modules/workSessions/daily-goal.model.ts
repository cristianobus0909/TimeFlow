import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IDailyGoal extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  user: Types.ObjectId;
  targetHours: number;
  targetAmount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DailyGoalSchema = new Schema<IDailyGoal>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetHours: { type: Number, required: true, min: 0 },
    targetAmount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
DailyGoalSchema.plugin(softDeletePlugin);

// Create compound index for uniqueness: only one goal per user per day
DailyGoalSchema.index({ user: 1, date: 1, isDeleted: 1 }, { unique: true });

export const DailyGoal = model<IDailyGoal>('DailyGoal', DailyGoalSchema);
export default DailyGoal;
