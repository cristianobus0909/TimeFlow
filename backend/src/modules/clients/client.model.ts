import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IContact {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  whatsApp?: string;
  notes?: string;
}

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
  website?: string;
  whatsApp?: string;
  timezone?: string;
  contacts: IContact[];
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
    website: { type: String, trim: true },
    whatsApp: { type: String, trim: true },
    timezone: { type: String, default: 'UTC', trim: true },
    contacts: [
      {
        name: { type: String, required: true, trim: true },
        role: { type: String, trim: true },
        email: { type: String, lowercase: true, trim: true },
        phone: { type: String, trim: true },
        whatsApp: { type: String, trim: true },
        notes: { type: String },
      },
    ],
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
