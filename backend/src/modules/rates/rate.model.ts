import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IRate extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  category: Types.ObjectId;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  hourlyRate: number;
  currency: string;
  effectiveFrom: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RateSchema = new Schema<IRate>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    complexity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
    hourlyRate: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', trim: true },
    effectiveFrom: { type: Date, default: Date.now },
    active: { type: Boolean, default: true },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
RateSchema.plugin(softDeletePlugin);

// Create indexes
RateSchema.index({ organization: 1, category: 1, complexity: 1, isDeleted: 1 });

export const Rate = model<IRate>('Rate', RateSchema);
export default Rate;
