import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IOrganization extends Document, IAuditFields, ISoftDeleteFields {
  name: string;
  slug: string;
  plan: 'free' | 'pro';
  currency: string;
  timezone: string;
  country?: string;
  owner: Types.ObjectId;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    currency: { type: String, default: 'USD', trim: true },
    timezone: { type: String, default: 'UTC', trim: true },
    country: { type: String, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELLED'], default: 'TRIAL' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
OrganizationSchema.plugin(softDeletePlugin);

export const Organization = model<IOrganization>('Organization', OrganizationSchema);
export default Organization;
