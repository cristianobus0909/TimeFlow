import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IFinancialTransaction extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  type: 'INCOME' | 'EXPENSE' | 'REFUND' | 'ADJUSTMENT' | 'TRANSFER';
  client?: Types.ObjectId;
  project?: Types.ObjectId;
  invoice?: Types.ObjectId;
  session?: Types.ObjectId;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  paymentMethod?: 'TRANSFER' | 'CASH' | 'CARD' | 'PAYPAL' | 'STRIPE' | 'MERCADO_PAGO' | 'OTHER';
  transactionDate: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinancialTransactionSchema = new Schema<IFinancialTransaction>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    type: { type: String, enum: ['INCOME', 'EXPENSE', 'REFUND', 'ADJUSTMENT', 'TRANSFER'], required: true },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: false },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: false },
    session: { type: Schema.Types.ObjectId, ref: 'WorkSession', required: false },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD', required: true, trim: true },
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED'], default: 'COMPLETED' },
    paymentMethod: {
      type: String,
      enum: ['TRANSFER', 'CASH', 'CARD', 'PAYPAL', 'STRIPE', 'MERCADO_PAGO', 'OTHER'],
      required: false,
    },
    transactionDate: { type: Date, default: Date.now },
    description: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

// Apply soft delete plugin
FinancialTransactionSchema.plugin(softDeletePlugin);

// Create compound index for fast tenant financial reports
FinancialTransactionSchema.index({ organization: 1, transactionDate: 1, type: 1, isDeleted: 1 });

export const FinancialTransaction = model<IFinancialTransaction>('FinancialTransaction', FinancialTransactionSchema);
export default FinancialTransaction;
