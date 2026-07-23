import { Schema, model, Document, Types } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  plan: 'free' | 'pro';
  currency: string;
  timezone: string;
  owner: Types.ObjectId;
  status: 'active' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    currency: { type: String, default: 'USD', trim: true },
    timezone: { type: String, default: 'UTC', trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true }
);

export const Organization = model<IOrganization>('Organization', OrganizationSchema);
