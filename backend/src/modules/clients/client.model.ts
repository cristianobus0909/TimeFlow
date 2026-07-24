import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IClient extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  currency: string;
  notes?: string;
  color?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    taxId: { type: String, trim: true },
    currency: { type: String, default: 'USD', trim: true },
    notes: { type: String },
    color: { type: String, trim: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
ClientSchema.plugin(softDeletePlugin);

// Create indexes
ClientSchema.index({ organization: 1, isDeleted: 1 });

export const Client = model<IClient>('Client', ClientSchema);
export default Client;
