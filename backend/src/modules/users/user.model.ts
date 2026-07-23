import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
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
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
export default User;
