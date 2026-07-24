import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IUserStreak extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  user: Types.ObjectId;
  currentStreak: number;
  bestStreak: number;
  lastCompletedDay: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserStreakSchema = new Schema<IUserStreak>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    currentStreak: { type: Number, required: true, default: 0, min: 0 },
    bestStreak: { type: Number, required: true, default: 0, min: 0 },
    lastCompletedDay: { type: Date, default: null },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete
UserStreakSchema.plugin(softDeletePlugin);

export const UserStreak = model<IUserStreak>('UserStreak', UserStreakSchema);
export default UserStreak;
