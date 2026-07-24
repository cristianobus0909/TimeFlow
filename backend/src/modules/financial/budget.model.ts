import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IBudget extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  client: Types.ObjectId;
  project?: Types.ObjectId;
  estimatedHours?: number;
  estimatedCost?: number;
  estimatedRevenue?: number;
  estimatedProfit?: number;
  hourlyRate?: number;
  fixedPrice?: number;
  currency: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    estimatedHours: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    estimatedRevenue: { type: Number, default: 0 },
    estimatedProfit: { type: Number, default: 0 },
    hourlyRate: { type: Number, default: 0 },
    fixedPrice: { type: Number, default: 0 },
    currency: { type: String, default: 'USD', required: true, trim: true },
    status: {
      type: String,
      enum: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'],
      default: 'DRAFT',
      required: true,
    },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

BudgetSchema.plugin(softDeletePlugin);

// Compound index for fast budgets queries
BudgetSchema.index({ organization: 1, client: 1, status: 1, isDeleted: 1 });

export const Budget = model<IBudget>('Budget', BudgetSchema);
export default Budget;
