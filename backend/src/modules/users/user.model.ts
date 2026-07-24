import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IUser extends Document, IAuditFields, ISoftDeleteFields {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  refreshToken?: string;
  stripeCustomerId?: string;
  subscriptionStatus: 'free' | 'active' | 'canceled' | 'past_due';
  subscriptionPlan: 'free' | 'pro';
  subscriptionId?: string;
  subscriptionPeriodEnd?: Date;
  organization?: Types.ObjectId;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  timezone: string;
  language: string;
  status: 'ACTIVE' | 'INACTIVE';
  avatar?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false },
    googleId: { type: String, unique: true, sparse: true },
    refreshToken: { type: String },
    stripeCustomerId: { type: String },
    subscriptionStatus: {
      type: String,
      enum: ['free', 'active', 'canceled', 'past_due'],
      default: 'free',
    },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    subscriptionId: { type: String },
    subscriptionPeriodEnd: { type: Date },
    organization: { type: Schema.Types.ObjectId, ref: 'Organization' },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'],
      default: 'MEMBER',
    },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'es' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    avatar: { type: String },
    lastLogin: { type: Date },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
UserSchema.plugin(softDeletePlugin);

export const User = model<IUser>('User', UserSchema);
export default User;
