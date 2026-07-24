import { Schema, model, Document, Types } from 'mongoose';
import { IAuditFields, ISoftDeleteFields, auditSchemaDefinition, softDeletePlugin } from '@shared/utils/schemaHelpers';

export interface IPayment extends Document, IAuditFields, ISoftDeleteFields {
  organization: Types.ObjectId;
  invoice: Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: 'TRANSFER' | 'CASH' | 'CARD' | 'PAYPAL' | 'STRIPE' | 'MERCADO_PAGO' | 'OTHER';
  paymentDate: Date;
  reference?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    organization: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD', required: true, trim: true },
    paymentMethod: {
      type: String,
      enum: ['TRANSFER', 'CASH', 'CARD', 'PAYPAL', 'STRIPE', 'MERCADO_PAGO', 'OTHER'],
      default: 'TRANSFER',
      required: true,
    },
    paymentDate: { type: Date, default: Date.now, required: true },
    reference: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'COMPLETED',
      required: true,
    },
    notes: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

PaymentSchema.plugin(softDeletePlugin);

// Indexes
PaymentSchema.index({ organization: 1, invoice: 1, isDeleted: 1 });

export const Payment = model<IPayment>('Payment', PaymentSchema);
export default Payment;
