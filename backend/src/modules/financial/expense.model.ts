import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IExpense extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  project?: Types.ObjectId;
  category: 'SOFTWARE' | 'HOSTING' | 'MARKETING' | 'EQUIPMENT' | 'TRAVEL' | 'TRAINING' | 'SERVICES' | 'OTHERS';
  description: string;
  supplier?: string;
  amount: number;
  currency: string;
  date: Date;
  attachmentUrl?: string;
  status: 'PENDING' | 'PAID' | 'VOID';
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    category: {
      type: String,
      enum: ['SOFTWARE', 'HOSTING', 'MARKETING', 'EQUIPMENT', 'TRAVEL', 'TRAINING', 'SERVICES', 'OTHERS'],
      default: 'OTHERS',
      required: true,
    },
    description: { type: String, required: true },
    supplier: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD', required: true, trim: true },
    date: { type: Date, default: Date.now, required: true },
    attachmentUrl: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'VOID'],
      default: 'PAID',
      required: true,
    },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

ExpenseSchema.plugin(softDeletePlugin);

// Indexes
ExpenseSchema.index({ organization: 1, category: 1, date: 1, isDeleted: 1 });

export const Expense = model<IExpense>('Expense', ExpenseSchema);
export default Expense;
